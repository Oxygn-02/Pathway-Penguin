import { Router, type IRouter, Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, awardPoints, logActivity } from "../db.js";
import { serverError } from "../lib/http.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { createLockout } from "../lib/lockout.js";
import { encryptEmail, decryptEmail, emailHash } from "../lib/emailCrypto.js";
import { sendEmail, emailEnabled, appBaseUrl, emailTemplate } from "../lib/mailer.js";

const router: IRouter = Router();

/* ── UTC Portsmouth subjects ──────────────────────────────────── */
const CORE_SUBJECTS = [
  { subject_name: "Maths", exam_board: "OCR", tier: "core" },
  { subject_name: "English Language", exam_board: "AQA", tier: "core" },
  { subject_name: "English Literature", exam_board: "AQA", tier: "core" },
  { subject_name: "Biology", exam_board: "AQA", tier: "core" },
  { subject_name: "Chemistry", exam_board: "AQA", tier: "core" },
  { subject_name: "Physics", exam_board: "AQA", tier: "core" },
  { subject_name: "Engineering Design", exam_board: "OCR", tier: "core" },
  { subject_name: "Engineering Manufacture", exam_board: "OCR", tier: "core" },
];

const OPTION_SUBJECTS = [
  { subject_name: "Statistics/Further Maths", exam_board: "AQA" },
  { subject_name: "Computer Science", exam_board: "AQA" },
  { subject_name: "Geography", exam_board: "AQA" },
  { subject_name: "Programmable Systems", exam_board: "OCR" },
];
const OPTION_NAMES = OPTION_SUBJECTS.map((s) => s.subject_name);

/* ── Basic profanity list ──────────────────────────────────────── */
const PROFANITY = ["fuck","shit","cunt","bitch","ass","arse","dick","cock","pussy","nigger","nigga","faggot","fag","retard","slut","whore","bastard","damn","piss","twat"];
function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return PROFANITY.some((w) => lower.includes(w));
}

/* ── Session helper ───────────────────────────────────────────── */
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/** Creates a server-side session row and sets the signed cookie that points at it. */
async function setSessionCookie(res: Response, userId: number, username: string): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  const sid = randomBytes(24).toString("hex");
  await query("DELETE FROM sessions WHERE user_id = $1 AND expires_at < NOW()", [userId]);
  await query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sid, userId, new Date(Date.now() + SESSION_MS).toISOString()],
  );
  const token = jwt.sign({ userId, username, sid }, secret, { expiresIn: "7d" });
  res.cookie("pp_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MS,
    path: "/",
  });
}

/* ── Password rules (shared by signup and reset) ──────────────── */
function passwordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  return null;
}

/* ── Brute-force throttles (in memory) ────────────────────────── */
const loginByAccount = createLockout(8, 15 * 60 * 1000);   // per IP + username
const loginByIp = createLockout(40, 15 * 60 * 1000);       // per IP
const resetRequests = createLockout(5, 60 * 60 * 1000);    // per IP, counts every request
// A real bcrypt hash of a throwaway string; compared against when the username
// does not exist so response time does not reveal which usernames are registered.
const DUMMY_HASH = "$2b$12$TfxaPVgXZqUVPrJTPnLgKeTgu5SmayGWQiZfmvknff0VM/5gAWdpG";

/* ── Email verification ───────────────────────────────────────── */
// Off by default so nothing changes until email sending is configured; turn on with
// REQUIRE_EMAIL_VERIFICATION=true. Accounts that already exist are treated as verified.
const verificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION === "true";
const resendByAccount = createLockout(3, 60 * 60 * 1000);   // per IP + username, counts every request
const verifyAttempts = createLockout(20, 15 * 60 * 1000);   // per IP

const maskEmail = (email: string) => email.split("@")[0].slice(0, 2) + "***@utcportsmouth.org";

/** Emails a one-time link (valid 24h) proving control of `email`. Replaces any earlier link. */
async function sendVerificationEmail(userId: number, username: string, email: string): Promise<void> {
  const rawToken = randomBytes(32).toString("hex");
  await query("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);
  await query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, email_encrypted, email_hash, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [userId, createHash("sha256").update(rawToken).digest("hex"), encryptEmail(email), emailHash(email),
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()],
  );
  const url = `${appBaseUrl()}/?verify=${rawToken}`;
  const { html, text } = emailTemplate({
    heading: "Confirm your email address",
    intro: `Hi <strong>${username}</strong>, please confirm this is your school email address to finish setting up Pathway Penguin. The link is valid for <strong>24 hours</strong>.`,
    button: "Confirm my email",
    url,
    footer: "If you didn't sign up for Pathway Penguin, you can ignore this email.",
  });
  await sendEmail({ to: email, subject: "Confirm your Pathway Penguin email", html, text });
}

/** The JSON the client expects after logging in. */
async function userPayload(user: any) {
  const subjectsResult = await query(
    "SELECT subject_name, exam_board, tier FROM subjects WHERE user_id = $1",
    [user.id],
  );
  let maskedEmail = "";
  try { maskedEmail = maskEmail(decryptEmail(user.email_encrypted)); } catch {}
  return {
    id: user.id, username: user.username, yearGroup: user.year_group,
    subjects: subjectsResult.rows, maskedEmail,
    usernameUpdatedAt: user.username_updated_at || null,
    emailUpdatedAt: user.email_updated_at || null,
    avatar: user.avatar ?? 1,
  };
}

/* ── POST /api/auth/signup ────────────────────────────────────── */
router.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password, yearGroup, optionSubjects } = req.body as {
      username: string; email: string; password: string;
      yearGroup: number; optionSubjects: string[];
    };

    if (typeof username !== "string" || typeof email !== "string") {
      res.status(400).json({ error: "Invalid request." }); return;
    }
    if (!username || username.length < 3 || username.length > 20) {
      res.status(400).json({ error: "Username must be 3–20 characters." }); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." }); return;
    }
    if (containsProfanity(username)) {
      res.status(400).json({ error: "That username is not allowed. Please choose another." }); return;
    }
    if (!email || !email.toLowerCase().endsWith("@utcportsmouth.org")) {
      res.status(400).json({ error: "You must use your @utcportsmouth.org school email address." }); return;
    }
    const pwErr = passwordError(password);
    if (pwErr) { res.status(400).json({ error: pwErr }); return; }
    const yg = Number(yearGroup);
    if (![10, 11, 12, 13].includes(yg)) {
      res.status(400).json({ error: "This platform is currently only available to UTC Portsmouth students in Year 10 and above." }); return;
    }
    if (!Array.isArray(optionSubjects) || optionSubjects.length !== 2) {
      res.status(400).json({ error: "Please select exactly 2 option subjects." }); return;
    }
    if (!optionSubjects.every((s) => OPTION_NAMES.includes(s))) {
      res.status(400).json({ error: "Invalid option subject selected." }); return;
    }

    const normEmail = email.trim().toLowerCase();
    const needsVerify = verificationRequired();
    if (needsVerify && !emailEnabled()) {
      console.error("REQUIRE_EMAIL_VERIFICATION is on but RESEND_API_KEY is not set");
      res.status(503).json({ error: "Sign-up is temporarily unavailable. Please try again later." }); return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const email_encrypted = encryptEmail(normEmail);
    const hash = emailHash(normEmail);

    if ((await query("SELECT 1 FROM users WHERE email_hash = $1", [hash])).rowCount) {
      res.status(409).json({ error: "That email address is already registered. Try logging in or resetting your password." }); return;
    }

    let userId: number;
    try {
      const result = await query(
        "INSERT INTO users (username, password_hash, email_encrypted, email_hash, email_verified, year_group) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [username, password_hash, email_encrypted, hash, !needsVerify, yg],
      );
      userId = result.rows[0].id;
    } catch (e: any) {
      if (e.code === "23505") {
        const taken = String(e.constraint ?? "").includes("email");
        res.status(409).json({ error: taken ? "That email address is already registered. Try logging in or resetting your password." : "That username is already taken." }); return;
      }
      throw e;
    }

    for (const s of CORE_SUBJECTS) {
      await query(
        "INSERT INTO subjects (user_id, subject_name, exam_board, tier) VALUES ($1, $2, $3, $4)",
        [userId, s.subject_name, s.exam_board, s.tier],
      );
    }
    for (const name of optionSubjects) {
      const found = OPTION_SUBJECTS.find((s) => s.subject_name === name)!;
      await query(
        "INSERT INTO subjects (user_id, subject_name, exam_board, tier) VALUES ($1, $2, $3, $4)",
        [userId, found.subject_name, found.exam_board, "option"],
      );
    }

    if (needsVerify) {
      try {
        await sendVerificationEmail(userId, username, normEmail);
      } catch (mailErr) {
        // Don't leave an account nobody can verify; let the student try again.
        console.error("Verification email failed:", mailErr);
        await query("DELETE FROM subjects WHERE user_id = $1", [userId]);
        await query("DELETE FROM users WHERE id = $1", [userId]);
        res.status(503).json({ error: "We couldn't send your confirmation email. Please check the address and try again." }); return;
      }
      await logActivity("signup", userId, username);
      res.json({ verificationRequired: true, maskedEmail: maskEmail(normEmail) });
      return;
    }

    await setSessionCookie(res, userId, username);
    await logActivity("signup", userId, username);
    const subjectsResult = await query(
      "SELECT subject_name, exam_board, tier FROM subjects WHERE user_id = $1",
      [userId],
    );
    res.json({ id: userId, username, yearGroup: yg, subjects: subjectsResult.rows, avatar: 1 });
  } catch (e: any) {
    console.error("Signup error:", e);
    serverError(res, e, "auth", "Signup failed.");
  }
});

/* ── POST /api/auth/login ─────────────────────────────────────── */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) { res.status(400).json({ error: "Username and password required." }); return; }

    if (typeof username !== "string" || typeof password !== "string") { res.status(400).json({ error: "Username and password required." }); return; }

    const ip = req.ip ?? "unknown";
    const accountKey = `${ip}|${username.toLowerCase()}`;
    const wait = Math.max(loginByAccount.retryAfter(accountKey), loginByIp.retryAfter(ip));
    if (wait > 0) {
      res.setHeader("Retry-After", String(wait));
      res.status(429).json({ error: "Too many failed attempts. Please wait a few minutes and try again." }); return;
    }

    const userResult = await query("SELECT * FROM users WHERE username = $1", [username]);
    const user = userResult.rows[0];
    const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !passwordOk) {
      loginByAccount.fail(accountKey);
      loginByIp.fail(ip);
      res.status(401).json({ error: "Incorrect username or password." }); return;
    }
    loginByAccount.reset(accountKey);

    if (user.email_verified === false) {
      res.status(403).json({ error: "Please confirm your email address first — check your inbox for the link.", needsVerification: true }); return;
    }

    await setSessionCookie(res, user.id, user.username);
    await logActivity("login", user.id, user.username);
    res.json(await userPayload(user));
  } catch (e: any) {
    console.error("Login error:", e);
    serverError(res, e, "auth", "Login failed.");
  }
});

/* ── POST /api/auth/verify-email ──────────────────────────────── */
router.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const ip = req.ip ?? "unknown";
    if (verifyAttempts.retryAfter(ip) > 0) { res.status(429).json({ error: "Too many attempts. Please wait a few minutes." }); return; }
    const { token } = req.body as { token?: unknown };
    if (typeof token !== "string" || !token) { res.status(400).json({ error: "Token required." }); return; }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const row = (await query("SELECT * FROM email_verification_tokens WHERE token_hash = $1", [tokenHash])).rows[0];
    if (!row) { verifyAttempts.fail(ip); res.status(400).json({ error: "This confirmation link isn't valid. Request a new one from the login page." }); return; }
    if (new Date(row.expires_at) < new Date()) {
      await query("DELETE FROM email_verification_tokens WHERE id = $1", [row.id]);
      res.status(400).json({ error: "This confirmation link has expired. Log in to request a new one." }); return;
    }

    const user = (await query("SELECT * FROM users WHERE id = $1", [row.user_id])).rows[0];
    if (!user) { res.status(400).json({ error: "This confirmation link isn't valid." }); return; }

    const addressChanged = user.email_hash !== row.email_hash;
    const wasUnverified = user.email_verified === false;
    try {
      await query(
        `UPDATE users SET email_verified = TRUE, email_encrypted = $1, email_hash = $2,
           email_updated_at = CASE WHEN $3 THEN NOW() ELSE email_updated_at END WHERE id = $4`,
        [row.email_encrypted, row.email_hash, addressChanged, user.id],
      );
    } catch (e: any) {
      if (e.code === "23505") { res.status(409).json({ error: "That email address is already registered to another account." }); return; }
      throw e;
    }
    await query("DELETE FROM email_verification_tokens WHERE user_id = $1", [user.id]);

    if (!wasUnverified) {
      // An existing account confirming a new address: no new login is created from the link.
      res.json({ ok: true, emailChanged: true }); return;
    }
    await setSessionCookie(res, user.id, user.username);
    res.json(await userPayload({ ...user, email_encrypted: row.email_encrypted }));
  } catch (e) {
    serverError(res, e, "auth verify");
  }
});

/* ── POST /api/auth/resend-verification ───────────────────────── */
router.post("/auth/resend-verification", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username?: unknown; password?: unknown };
    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      res.status(400).json({ error: "Username and password required." }); return;
    }
    const key = `${req.ip ?? "unknown"}|${username.toLowerCase()}`;
    if (resendByAccount.retryAfter(key) > 0) { res.status(429).json({ error: "Too many requests. Please wait a while before asking again." }); return; }
    resendByAccount.fail(key);

    const user = (await query("SELECT * FROM users WHERE username = $1", [username])).rows[0];
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) { res.status(401).json({ error: "Incorrect username or password." }); return; }
    if (user.email_verified !== false) { res.status(400).json({ error: "This account is already confirmed — you can log in." }); return; }
    if (!emailEnabled()) { res.status(503).json({ error: "Email is temporarily unavailable. Please try again later." }); return; }

    await sendVerificationEmail(user.id, user.username, decryptEmail(user.email_encrypted));
    res.json({ ok: true });
  } catch (e) {
    serverError(res, e, "auth resend", "We couldn't send the email. Please try again later.");
  }
});

/* ── POST /api/auth/logout ────────────────────────────────────── */
router.post("/auth/logout", async (req: Request, res: Response) => {
  // Revoke the server-side session so the cookie is useless even if it was copied.
  try {
    const token = (req as any).cookies?.pp_session;
    const secret = process.env.JWT_SECRET;
    if (token && secret) {
      const payload = jwt.verify(token, secret, { ignoreExpiration: true }) as Partial<AuthUser>;
      if (payload.sid) await query("DELETE FROM sessions WHERE id = $1", [payload.sid]);
    }
  } catch { /* bad or missing token: nothing to revoke */ }
  res.clearCookie("pp_session", { path: "/" });
  res.json({ ok: true });
});

/* ── GET /api/auth/me ─────────────────────────────────────────── */
router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const userResult = await query(
      "SELECT id, username, year_group, email_encrypted, username_updated_at, email_updated_at, avatar FROM users WHERE id = $1",
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) { res.status(404).json({ error: "User not found." }); return; }
    const subjectsResult = await query(
      "SELECT subject_name, exam_board, tier FROM subjects WHERE user_id = $1",
      [userId],
    );
    let maskedEmail = "";
    try {
      const raw = decryptEmail(user.email_encrypted);
      const [local] = raw.split("@");
      maskedEmail = local.slice(0, 2) + "***@utcportsmouth.org";
    } catch {}
    res.json({
      id: user.id, username: user.username, yearGroup: user.year_group,
      subjects: subjectsResult.rows, maskedEmail,
      usernameUpdatedAt: user.username_updated_at || null,
      emailUpdatedAt: user.email_updated_at || null,
      avatar: user.avatar ?? 1,
    });
  } catch (e: any) {
    serverError(res, e, "auth");
  }
});

/* ── PATCH /api/auth/username ─────────────────────────────────── */
router.patch("/auth/username", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { username } = req.body as { username: string };
    if (!username || username.length < 3 || username.length > 20) {
      res.status(400).json({ error: "Username must be 3–20 characters." }); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." }); return;
    }
    if (containsProfanity(username)) {
      res.status(400).json({ error: "That username is not allowed. Please choose another." }); return;
    }
    const userResult = await query("SELECT username, username_updated_at FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];
    if (!user) { res.status(404).json({ error: "User not found." }); return; }
    if (user.username_updated_at) {
      const lastChange = new Date(user.username_updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastChange < sevenDays) {
        const nextAllowed = new Date(lastChange + sevenDays).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
        res.status(429).json({ error: `You can only change your username once a week. Next change available: ${nextAllowed}.` }); return;
      }
    }
    try {
      await query("UPDATE users SET username = $1, username_updated_at = NOW() WHERE id = $2", [username, userId]);
    } catch (e: any) {
      if (e.code === "23505") {
        res.status(409).json({ error: "That username is already taken." }); return;
      }
      throw e;
    }
    res.json({ ok: true, username, usernameUpdatedAt: new Date().toISOString() });
  } catch (e: any) {
    serverError(res, e, "auth");
  }
});

/* ── PATCH /api/auth/email ────────────────────────────────────── */
router.patch("/auth/email", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { email } = req.body as { email: string };
    if (!email || !email.toLowerCase().endsWith("@utcportsmouth.org")) {
      res.status(400).json({ error: "You must use your @utcportsmouth.org school email address." }); return;
    }
    const userResult = await query("SELECT email_updated_at FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];
    if (!user) { res.status(404).json({ error: "User not found." }); return; }
    if (user.email_updated_at) {
      const lastChange = new Date(user.email_updated_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastChange < thirtyDays) {
        const nextAllowed = new Date(lastChange + thirtyDays).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
        res.status(429).json({ error: `You can only change your email once a month. Next change available: ${nextAllowed}.` }); return;
      }
    }
    const normEmail = email.trim().toLowerCase();
    const hash = emailHash(normEmail);
    if ((await query("SELECT 1 FROM users WHERE email_hash = $1 AND id <> $2", [hash, userId])).rowCount) {
      res.status(409).json({ error: "That email address is already registered to another account." }); return;
    }

    if (verificationRequired()) {
      // The address only changes once the student clicks the link sent to the NEW address.
      if (!emailEnabled()) { res.status(503).json({ error: "Email is temporarily unavailable. Please try again later." }); return; }
      const { username } = (req as any).user as AuthUser;
      await sendVerificationEmail(userId, username, normEmail);
      res.json({ ok: true, pendingVerification: true, maskedEmail: maskEmail(normEmail) }); return;
    }

    await query("UPDATE users SET email_encrypted = $1, email_hash = $2, email_updated_at = NOW() WHERE id = $3", [encryptEmail(normEmail), hash, userId]);
    res.json({ ok: true, maskedEmail: maskEmail(normEmail), emailUpdatedAt: new Date().toISOString() });
  } catch (e: any) {
    serverError(res, e, "auth");
  }
});

/* ── PATCH /api/auth/avatar ───────────────────────────────────── */
router.patch("/auth/avatar", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { avatar } = req.body as { avatar: number };
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].includes(Number(avatar))) {
      res.status(400).json({ error: "Invalid avatar." }); return;
    }
    await query("UPDATE users SET avatar = $1 WHERE id = $2", [Number(avatar), userId]);
    res.json({ ok: true, avatar: Number(avatar) });
  } catch (e: any) {
    serverError(res, e, "auth");
  }
});

/* ── POST /api/auth/forgot-password ──────────────────────────── */
router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username: string };
    if (!username || typeof username !== "string") { res.status(400).json({ error: "Username required." }); return; }

    // Stops the form being used to spam someone's inbox. Same response either way.
    const resetIp = req.ip ?? "unknown";
    if (resetRequests.retryAfter(resetIp) > 0) { res.json({ ok: true }); return; }
    resetRequests.fail(resetIp);

    const userResult = await query("SELECT * FROM users WHERE username = $1", [username]);
    const user = userResult.rows[0];
    if (!user) { res.json({ ok: true }); return; }

    let email: string;
    try { email = decryptEmail(user.email_encrypted); }
    catch { res.status(500).json({ error: "Failed to process request." }); return; }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt],
    );

    const resetUrl = `${appBaseUrl()}/?token=${rawToken}`;
    if (emailEnabled()) {
      const { html, text } = emailTemplate({
        heading: "Reset your password",
        intro: `Hi <strong>${user.username}</strong>, we received a request to reset your Pathway Penguin password. This link is only valid for <strong>1 hour</strong>.`,
        button: "Reset my password",
        url: resetUrl,
        footer: "If you didn't request a password reset, you can safely ignore this email. Your password will not change.",
      });
      try {
        await sendEmail({ to: email, subject: "Reset your Pathway Penguin password", html, text });
      } catch (mailErr) {
        // Same response either way, so the form can't be used to discover which usernames exist.
        console.error("Reset email failed:", mailErr);
      }
    } else {
      console.warn("Password reset requested but RESEND_API_KEY is not set; no email sent.");
    }

    res.json({ ok: true });
  } catch (e: any) {
    console.error("Forgot password error:", e);
    serverError(res, e, "auth", "Failed to send reset email.");
  }
});

/* ── POST /api/auth/reset-password ───────────────────────────── */
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) { res.status(400).json({ error: "Token and password required." }); return; }
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const rowResult = await query("SELECT * FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
    const row = rowResult.rows[0];

    if (!row) { res.status(400).json({ error: "Invalid or expired reset link." }); return; }
    if (new Date(row.expires_at) < new Date()) {
      await query("DELETE FROM password_reset_tokens WHERE id = $1", [row.id]);
      res.status(400).json({ error: "This reset link has expired. Please request a new one." }); return;
    }

    const pwErr = passwordError(password);
    if (pwErr) { res.status(400).json({ error: pwErr }); return; }

    const password_hash = await bcrypt.hash(password, 12);
    // Following the emailed reset link also proves the student controls the mailbox.
    await query("UPDATE users SET password_hash = $1, email_verified = TRUE WHERE id = $2", [password_hash, row.user_id]);
    await query("DELETE FROM password_reset_tokens WHERE id = $1", [row.id]);
    // A password change signs the account out everywhere else.
    await query("DELETE FROM sessions WHERE user_id = $1", [row.user_id]);

    const userResult = await query("SELECT username FROM users WHERE id = $1", [row.user_id]);
    const user = userResult.rows[0];
    await setSessionCookie(res, row.user_id, user.username);
    res.json({ ok: true, username: user.username });
  } catch (e: any) {
    console.error("Reset password error:", e);
    serverError(res, e, "auth", "Password reset failed.");
  }
});

export default router;
