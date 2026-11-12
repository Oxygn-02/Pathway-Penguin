import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, logActivity } from "../db.js";
import { serverError } from "../lib/http.js";
import { encryptEmail, emailHash } from "../lib/emailCrypto.js";
import { appBaseUrl } from "../lib/mailer.js";
import { containsProfanity } from "../lib/profanity.js";
import { CORE_SUBJECTS, OPTION_SUBJECTS, OPTION_NAMES, setSessionCookie, userPayload } from "./auth.js";

const router: IRouter = Router();

const SCHOOL_DOMAIN = "utcportsmouth.org";
const OAUTH_COOKIE = "pp_oauth";       // state + PKCE verifier while the student is at Google
const SIGNUP_COOKIE = "pp_gsignup";    // verified Google identity while a new student picks a username
const COOKIE_PATH = "/api/auth/google";

const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const redirectUri = () => process.env.GOOGLE_REDIRECT_URI || `${appBaseUrl()}/api/auth/google/callback`;
const cookieOpts = (maxAgeMs: number) => ({
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: maxAgeMs, path: COOKIE_PATH,
});
const b64url = (b: Buffer) => b.toString("base64url");
const fail = (res: Response, code: string) => res.redirect(`/?google_error=${encodeURIComponent(code)}`);

/** Lets the login screen hide the button when Google isn't set up. */
router.get("/auth/google/enabled", (_req, res) => { res.json({ enabled: googleConfigured() }); });

/* ── GET /api/auth/google/start ───────────────────────────────── */
router.get("/auth/google/start", (_req: Request, res: Response) => {
  if (!googleConfigured()) { fail(res, "unavailable"); return; }
  const secret = process.env.JWT_SECRET;
  if (!secret) { fail(res, "unavailable"); return; }
  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  res.cookie(OAUTH_COOKIE, jwt.sign({ state, nonce, verifier }, secret, { expiresIn: "10m" }), cookieOpts(10 * 60 * 1000));
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email",
    state, nonce,
    code_challenge: challenge, code_challenge_method: "S256",
    hd: SCHOOL_DOMAIN,            // only a hint to Google; the real check is on the verified token below
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

/* ── GET /api/auth/google/callback ────────────────────────────── */
router.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!googleConfigured() || !secret) { fail(res, "unavailable"); return; }
    if (req.query.error) { fail(res, "cancelled"); return; }

    let saved: { state: string; nonce: string; verifier: string };
    try { saved = jwt.verify((req as any).cookies?.[OAUTH_COOKIE] ?? "", secret) as any; }
    catch { fail(res, "expired"); return; }
    res.clearCookie(OAUTH_COOKIE, { path: COOKIE_PATH });

    const code = req.query.code, state = req.query.state;
    if (typeof code !== "string" || typeof state !== "string" || state !== saved.state) { fail(res, "failed"); return; }

    // Server-to-server exchange over TLS, so the returned ID token comes straight from Google.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, grant_type: "authorization_code", redirect_uri: redirectUri(),
        client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code_verifier: saved.verifier,
      }),
    });
    const tokenJson: any = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || typeof tokenJson.id_token !== "string") { console.error("Google token exchange failed:", tokenRes.status, tokenJson?.error); fail(res, "failed"); return; }

    let claims: any;
    try { claims = JSON.parse(Buffer.from(tokenJson.id_token.split(".")[1], "base64url").toString("utf8")); }
    catch { fail(res, "failed"); return; }

    const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID || claims.nonce !== saved.nonce
        || !(claims.exp * 1000 > Date.now()) || typeof claims.sub !== "string") { fail(res, "failed"); return; }

    const email = String(claims.email ?? "").trim().toLowerCase();
    // School accounts only: a verified @utcportsmouth.org address that Google also says belongs to the school's domain.
    if (claims.email_verified !== true || !email.endsWith("@" + SCHOOL_DOMAIN) || claims.hd !== SCHOOL_DOMAIN) { fail(res, "not_school"); return; }

    // 1. Already linked to this Google account.
    let user = (await query("SELECT * FROM users WHERE google_sub = $1", [claims.sub])).rows[0];
    // 2. Existing password account with the same school email: link it.
    if (!user) {
      const byEmail = (await query("SELECT * FROM users WHERE email_hash = $1", [emailHash(email)])).rows[0];
      if (byEmail) {
        if (byEmail.google_sub && byEmail.google_sub !== claims.sub) { fail(res, "failed"); return; }
        if (byEmail.email_verified === false) { fail(res, "unverified"); return; }
        await query("UPDATE users SET google_sub = $1 WHERE id = $2", [claims.sub, byEmail.id]);
        user = byEmail;
      }
    }
    if (user) {
      await setSessionCookie(res, user.id, user.username);
      await logActivity("login", user.id, user.username);
      res.redirect("/");
      return;
    }

    // 3. New student: they still need to choose a username, year group and options.
    res.cookie(SIGNUP_COOKIE, jwt.sign({ sub: claims.sub, email }, secret, { expiresIn: "15m" }), cookieOpts(15 * 60 * 1000));
    res.redirect("/?google=complete");
  } catch (e) {
    console.error("Google callback error:", e);
    fail(res, "failed");
  }
});

/* ── GET /api/auth/google/pending ─────────────────────────────── */
router.get("/auth/google/pending", (req: Request, res: Response) => {
  try {
    const p: any = jwt.verify((req as any).cookies?.[SIGNUP_COOKIE] ?? "", process.env.JWT_SECRET ?? "");
    const [name] = String(p.email).split("@");
    res.json({ maskedEmail: name.slice(0, 2) + "***@" + SCHOOL_DOMAIN });
  } catch { res.status(401).json({ error: "Your Google sign-in has expired. Please try again." }); }
});

/* ── POST /api/auth/google/complete ───────────────────────────── */
router.post("/auth/google/complete", async (req: Request, res: Response) => {
  try {
    const secret = process.env.JWT_SECRET;
    let pending: { sub: string; email: string };
    try { pending = jwt.verify((req as any).cookies?.[SIGNUP_COOKIE] ?? "", secret ?? "") as any; }
    catch { res.status(401).json({ error: "Your Google sign-in has expired. Please try again." }); return; }

    const { username, yearGroup, optionSubjects } = req.body as { username: unknown; yearGroup: unknown; optionSubjects: unknown };
    if (typeof username !== "string" || username.length < 3 || username.length > 20) { res.status(400).json({ error: "Username must be 3–20 characters." }); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." }); return; }
    if (containsProfanity(username)) { res.status(400).json({ error: "That username is not allowed. Please choose another." }); return; }
    const yg = Number(yearGroup);
    if (![10, 11, 12, 13].includes(yg)) { res.status(400).json({ error: "This platform is currently only available to UTC Portsmouth students in Year 10 and above." }); return; }
    if (!Array.isArray(optionSubjects) || optionSubjects.length !== 2 || new Set(optionSubjects).size !== 2) { res.status(400).json({ error: "Please select exactly 2 option subjects." }); return; }
    if (!optionSubjects.every((s) => OPTION_NAMES.includes(s))) { res.status(400).json({ error: "Invalid option subject selected." }); return; }

    // No password is ever used for these accounts; store an unguessable hash to satisfy the NOT NULL column.
    const password_hash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    let userId: number;
    try {
      const r = await query(
        "INSERT INTO users (username, password_hash, email_encrypted, email_hash, email_verified, year_group, google_sub) VALUES ($1, $2, $3, $4, TRUE, $5, $6) RETURNING id",
        [username, password_hash, encryptEmail(pending.email), emailHash(pending.email), yg, pending.sub],
      );
      userId = r.rows[0].id;
    } catch (e: any) {
      if (e.code === "23505") {
        const c = String(e.constraint ?? "");
        res.status(409).json({ error: c.includes("username") || c.includes("users_username") ? "That username is already taken." : "This school email is already registered. Try signing in again." }); return;
      }
      throw e;
    }
    for (const s of CORE_SUBJECTS) {
      await query("INSERT INTO subjects (user_id, subject_name, exam_board, tier) VALUES ($1, $2, $3, $4)", [userId, s.subject_name, s.exam_board, s.tier]);
    }
    for (const name of optionSubjects as string[]) {
      const found = OPTION_SUBJECTS.find((s) => s.subject_name === name)!;
      await query("INSERT INTO subjects (user_id, subject_name, exam_board, tier) VALUES ($1, $2, $3, $4)", [userId, found.subject_name, found.exam_board, "option"]);
    }
    res.clearCookie(SIGNUP_COOKIE, { path: COOKIE_PATH });
    await setSessionCookie(res, userId, username);
    await logActivity("signup", userId, username);
    const user = (await query("SELECT * FROM users WHERE id = $1", [userId])).rows[0];
    res.json(await userPayload(user));
  } catch (e) {
    serverError(res, e, "auth google", "Sign-up failed.");
  }
});

export default router;
