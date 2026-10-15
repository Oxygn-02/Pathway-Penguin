import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { hasDb, startApp, Client, uniqueUser, signupBody, type TestApp } from "./helpers.js";

describe.skipIf(!hasDb)("email verification and duplicate emails (integration)", () => {
  let app: TestApp;
  let outbox: { to: string; subject: string; text: string }[] = [];
  let mailer: typeof import("../../lib/mailer.js");

  beforeAll(async () => { app = await startApp(); mailer = await import("../../lib/mailer.js"); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => {
    outbox = [];
    mailer.mailerHooks.transport = async (m) => { outbox.push(m); };
    process.env.REQUIRE_EMAIL_VERIFICATION = "true";
  });
  afterEach(() => {
    mailer.mailerHooks.transport = null;
    delete process.env.REQUIRE_EMAIL_VERIFICATION;
  });

  const tokenFrom = (m: { text: string }) => m.text.match(/[?&]verify=([a-f0-9]+)/)![1];

  it("new accounts must confirm their email before they can log in", async () => {
    const u = uniqueUser();
    const c = new Client(app.base);
    const signup = await c.req("POST", "/auth/signup", signupBody(u));
    expect(signup.status).toBe(200);
    expect(signup.json.verificationRequired).toBe(true);
    expect(c.cookie).toBe("");                                   // no session yet
    expect((await c.req("GET", "/auth/me")).status).toBe(401);

    const early = await c.req("POST", "/auth/login", { username: u.username, password: u.password });
    expect(early.status).toBe(403);
    expect(early.json.needsVerification).toBe(true);

    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe(u.email);
    const token = tokenFrom(outbox[0]);

    expect((await c.req("POST", "/auth/verify-email", { token: "0".repeat(64) })).status).toBe(400);
    const verified = await c.req("POST", "/auth/verify-email", { token });
    expect(verified.status).toBe(200);
    expect(verified.json.username).toBe(u.username);
    expect((await c.req("GET", "/auth/me")).status).toBe(200);   // verified link signs them in

    expect((await new Client(app.base).req("POST", "/auth/verify-email", { token })).status).toBe(400); // single use
    expect((await new Client(app.base).req("POST", "/auth/login", { username: u.username, password: u.password })).status).toBe(200);
  });

  it("rejects an expired link", async () => {
    const u = uniqueUser();
    const c = new Client(app.base);
    await c.req("POST", "/auth/signup", signupBody(u));
    await app.query("UPDATE email_verification_tokens SET expires_at = NOW() - interval '1 minute'");
    const r = await c.req("POST", "/auth/verify-email", { token: tokenFrom(outbox[0]) });
    expect(r.status).toBe(400);
    expect(r.json.error).toMatch(/expired/i);
  });

  it("resend needs the password and is throttled", async () => {
    const u = uniqueUser();
    const c = new Client(app.base, "198.51.100.200");
    await c.req("POST", "/auth/signup", signupBody(u));
    expect((await c.req("POST", "/auth/resend-verification", { username: u.username, password: "nope-nope1" })).status).toBe(401);
    expect(outbox).toHaveLength(1);
    const r = await c.req("POST", "/auth/resend-verification", { username: u.username, password: u.password });
    expect(r.status).toBe(200);
    expect(outbox).toHaveLength(2);
    // The first link was replaced by the second.
    expect((await c.req("POST", "/auth/verify-email", { token: tokenFrom(outbox[0]) })).status).toBe(400);
    expect((await c.req("POST", "/auth/verify-email", { token: tokenFrom(outbox[1]) })).status).toBe(200);
    // Three requests per hour are allowed (this one is rejected as "already confirmed"); the fourth is throttled.
    expect((await c.req("POST", "/auth/resend-verification", { username: u.username, password: u.password })).status).toBe(400);
    expect((await c.req("POST", "/auth/resend-verification", { username: u.username, password: u.password })).status).toBe(429);
  });

  it("refuses to sign up when verification is on but email can't be sent, and leaves no account behind", async () => {
    mailer.mailerHooks.transport = async () => { throw new Error("smtp down"); };
    const u = uniqueUser();
    const r = await new Client(app.base).req("POST", "/auth/signup", signupBody(u));
    expect(r.status).toBe(503);
    expect((await app.query("SELECT 1 FROM users WHERE username = $1", [u.username])).rowCount).toBe(0);
  });

  it("does not allow one email address on two accounts (any capitalisation)", async () => {
    process.env.REQUIRE_EMAIL_VERIFICATION = "false";
    const a = uniqueUser(); const b = uniqueUser();
    expect((await new Client(app.base).req("POST", "/auth/signup", signupBody(a))).status).toBe(200);
    const dup = await new Client(app.base).req("POST", "/auth/signup", { ...signupBody(b), email: a.email.toUpperCase() });
    expect(dup.status).toBe(409);
    expect(dup.json.error).toMatch(/email/i);
  });

  it("changing email only takes effect after confirming the new address", async () => {
    process.env.REQUIRE_EMAIL_VERIFICATION = "false";
    const u = uniqueUser(); const other = uniqueUser();
    const c = new Client(app.base);
    await c.req("POST", "/auth/signup", signupBody(u));
    await new Client(app.base).req("POST", "/auth/signup", signupBody(other));
    process.env.REQUIRE_EMAIL_VERIFICATION = "true";

    expect((await c.req("PATCH", "/auth/email", { email: other.email })).status).toBe(409);

    const newEmail = `new_${u.username}@utcportsmouth.org`;
    const r = await c.req("PATCH", "/auth/email", { email: newEmail });
    expect(r.status).toBe(200);
    expect(r.json.pendingVerification).toBe(true);
    const before = (await app.query("SELECT email_hash FROM users WHERE username = $1", [u.username])).rows[0].email_hash;
    expect(outbox[0].to).toBe(newEmail);

    const confirm = await new Client(app.base).req("POST", "/auth/verify-email", { token: tokenFrom(outbox[0]) });
    expect(confirm.status).toBe(200);
    expect(confirm.json.emailChanged).toBe(true);
    const after = (await app.query("SELECT email_hash, email_updated_at FROM users WHERE username = $1", [u.username])).rows[0];
    expect(after.email_hash).not.toBe(before);
    expect(after.email_updated_at).not.toBeNull();
  });

  it("an emailed password-reset link also confirms an unverified account", async () => {
    const u = uniqueUser();
    const c = new Client(app.base);
    await c.req("POST", "/auth/signup", signupBody(u));
    const userId = (await app.query("SELECT id FROM users WHERE username = $1", [u.username])).rows[0].id;
    const { sha256 } = await import("./helpers.js");
    await app.query("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, NOW() + interval '1 hour')", [userId, sha256("rt-" + u.username)]);
    expect((await c.req("POST", "/auth/reset-password", { token: "rt-" + u.username, password: "NewPassw0rd1" })).status).toBe(200);
    expect((await new Client(app.base).req("POST", "/auth/login", { username: u.username, password: "NewPassw0rd1" })).status).toBe(200);
  });
});
