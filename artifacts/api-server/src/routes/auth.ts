import { Router, type IRouter, Request, Response } from "express";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { query, awardPoints, logActivity } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

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

/* ── Email encryption (AES-256-CBC) ──────────────────────────── */
function getEncKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
  return Buffer.from(key, "utf8");
}

function encryptEmail(email: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(email, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptEmail(stored: string): string {
  const [ivHex, encHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", getEncKey(), iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/* ── Cookie helper ────────────────────────────────────────────── */
function setSessionCookie(res: Response, userId: number, username: string): void {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  const token = jwt.sign({ userId, username }, secret, { expiresIn: "7d" });
  res.cookie("pp_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

/* ── POST /api/auth/signup ────────────────────────────────────── */
router.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password, yearGroup, optionSubjects } = req.body as {
      username: string; email: string; password: string;
      yearGroup: number; optionSubjects: string[];
    };

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
    if (!password || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." }); return;
    }
    if (!/\d/.test(password)) {
      res.status(400).json({ error: "Password must contain at least one number." }); return;
    }
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

    const password_hash = bcrypt.hashSync(password, 12);
    const email_encrypted = encryptEmail(email.toLowerCase());

    let userId: number;
    try {
      const result = await query(
        "INSERT INTO users (username, password_hash, email_encrypted, year_group) VALUES ($1, $2, $3, $4) RETURNING id",
        [username, password_hash, email_encrypted, yg],
      );
      userId = result.rows[0].id;
    } catch (e: any) {
      if (e.code === "23505") {
        res.status(409).json({ error: "That username is already taken." }); return;
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

    setSessionCookie(res, userId, username);
    await logActivity("signup", userId, username);
    const subjectsResult = await query(
      "SELECT subject_name, exam_board, tier FROM subjects WHERE user_id = $1",
      [userId],
    );
    res.json({ id: userId, username, yearGroup: yg, subjects: subjectsResult.rows, avatar: 1 });
  } catch (e: any) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message || "Signup failed." });
  }
});

/* ── POST /api/auth/login ─────────────────────────────────────── */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) { res.status(400).json({ error: "Username and password required." }); return; }

    const userResult = await query("SELECT * FROM users WHERE username = $1", [username]);
    const user = userResult.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: "Incorrect username or password." }); return;
    }

    setSessionCookie(res, user.id, user.username);
    await logActivity("login", user.id, user.username);
    const subjectsResult = await query(
      "SELECT subject_name, exam_board, tier FROM subjects WHERE user_id = $1",
      [user.id],
    );
    let maskedEmail = "";
    try { const raw = decryptEmail(user.email_encrypted); const [local] = raw.split("@"); maskedEmail = local.slice(0, 2) + "***@utcportsmouth.org"; } catch {}
    res.json({
      id: user.id, username: user.username, yearGroup: user.year_group,
      subjects: subjectsResult.rows, maskedEmail,
      usernameUpdatedAt: user.username_updated_at || null,
      emailUpdatedAt: user.email_updated_at || null,
      avatar: user.avatar ?? 1,
    });
  } catch (e: any) {
    console.error("Login error:", e);
    res.status(500).json({ error: e.message || "Login failed." });
  }
});

/* ── POST /api/auth/logout ────────────────────────────────────── */
router.post("/auth/logout", (_req: Request, res: Response) => {
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
    res.status(500).json({ error: e.message });
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
    res.status(500).json({ error: e.message });
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
    const email_encrypted = encryptEmail(email.toLowerCase());
    await query("UPDATE users SET email_encrypted = $1, email_updated_at = NOW() WHERE id = $2", [email_encrypted, userId]);
    const [local] = email.toLowerCase().split("@");
    const maskedEmail = local.slice(0, 2) + "***@utcportsmouth.org";
    res.json({ ok: true, maskedEmail, emailUpdatedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/auth/forgot-password ──────────────────────────── */
router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username: string };
    if (!username) { res.status(400).json({ error: "Username required." }); return; }

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

    const domain = process.env.APP_DOMAIN
      ? `https://${process.env.APP_DOMAIN}`
      : process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:3000";
    const resetUrl = `${domain}/?token=${rawToken}`;

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromAddress = process.env.RESEND_FROM
        ? `Pathway Penguin <${process.env.RESEND_FROM}>`
        : "Pathway Penguin <onboarding@resend.dev>";

      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: "Reset your Pathway Penguin password",
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1a3a4f;">
            <div style="background:#daeefa;padding:24px 32px;border-radius:12px 12px 0 0;">
              <h2 style="margin:0;font-size:20px;color:#1a3a4f;">🐧 Pathway Penguin</h2>
            </div>
            <div style="background:#ffffff;padding:32px;border:1px solid #daeefa;border-top:none;border-radius:0 0 12px 12px;">
              <h3 style="margin-top:0;color:#1a3a4f;">Reset your password</h3>
              <p style="margin-bottom:8px;">Hi <strong>${user.username}</strong>,</p>
              <p>We received a request to reset your Pathway Penguin password. Click the button below — this link is only valid for <strong>1 hour</strong>.</p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;background:#5baed4;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Reset my password</a>
              </div>
              <p style="font-size:13px;color:#555;">If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size:12px;word-break:break-all;background:#f4f9fc;padding:10px 12px;border-radius:6px;color:#1a3a4f;">${resetUrl}</p>
              <hr style="border:none;border-top:1px solid #eef7fd;margin:24px 0;">
              <p style="font-size:12px;color:#999;margin:0;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
            </div>
          </div>
        `,
        text: `Reset your Pathway Penguin password\n\nHi ${user.username},\n\nWe received a request to reset your password. Copy and paste the link below into your browser to reset it. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      });
    }

    res.json({ ok: true });
  } catch (e: any) {
    console.error("Forgot password error:", e);
    res.status(500).json({ error: e.message || "Failed to send reset email." });
  }
});

/* ── POST /api/auth/reset-password ───────────────────────────── */
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) { res.status(400).json({ error: "Token and password required." }); return; }
    if (password.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters." }); return; }
    if (!/\d/.test(password)) { res.status(400).json({ error: "Password must contain at least one number." }); return; }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const rowResult = await query("SELECT * FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
    const row = rowResult.rows[0];

    if (!row) { res.status(400).json({ error: "Invalid or expired reset link." }); return; }
    if (new Date(row.expires_at) < new Date()) {
      await query("DELETE FROM password_reset_tokens WHERE id = $1", [row.id]);
      res.status(400).json({ error: "This reset link has expired. Please request a new one." }); return;
    }

    const password_hash = bcrypt.hashSync(password, 12);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [password_hash, row.user_id]);
    await query("DELETE FROM password_reset_tokens WHERE id = $1", [row.id]);

    const userResult = await query("SELECT username FROM users WHERE id = $1", [row.user_id]);
    const user = userResult.rows[0];
    setSessionCookie(res, row.user_id, user.username);
    res.json({ ok: true, username: user.username });
  } catch (e: any) {
    console.error("Reset password error:", e);
    res.status(500).json({ error: e.message || "Password reset failed." });
  }
});

export default router;
