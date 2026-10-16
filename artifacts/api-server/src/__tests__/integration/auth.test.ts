import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hasDb, startApp, Client, uniqueUser, signupBody, sha256, type TestApp } from "./helpers.js";

describe.skipIf(!hasDb)("auth (integration)", () => {
  let app: TestApp;
  beforeAll(async () => { app = await startApp(); });
  afterAll(async () => { await app.close(); });

  it("signs up, reads /auth/me, and logging out revokes the session", async () => {
    const u = uniqueUser();
    const c = new Client(app.base);
    const signup = await c.req("POST", "/auth/signup", signupBody(u));
    expect(signup.status).toBe(200);
    expect(signup.json.username).toBe(u.username);

    expect((await c.req("GET", "/auth/me")).status).toBe(200);

    const stolenCookie = c.cookie;
    expect((await c.req("POST", "/auth/logout")).status).toBe(200);
    expect((await c.req("GET", "/auth/me")).status).toBe(401);

    // The copied cookie must not work any more, even though the JWT hasn't expired.
    const thief = new Client(app.base);
    thief.cookie = stolenCookie;
    expect((await thief.req("GET", "/auth/me")).status).toBe(401);
  });

  it("rejects wrong passwords, non-school emails and weak passwords", async () => {
    const u = uniqueUser();
    const c = new Client(app.base);
    expect((await c.req("POST", "/auth/signup", { ...signupBody(u), email: "x@gmail.com" })).status).toBe(400);
    expect((await c.req("POST", "/auth/signup", { ...signupBody(u), password: "short1" })).status).toBe(400);
    expect((await c.req("POST", "/auth/signup", { ...signupBody(u), password: "nodigitshere" })).status).toBe(400);
    expect((await c.req("POST", "/auth/signup", { ...signupBody(u), username: { a: 1 } })).status).toBe(400);
    await c.req("POST", "/auth/signup", signupBody(u));
    const login = new Client(app.base);
    expect((await login.req("POST", "/auth/login", { username: u.username, password: "wrong-pass1" })).status).toBe(401);
    expect((await login.req("POST", "/auth/login", { username: u.username, password: u.password })).status).toBe(200);
  });

  it("locks login after repeated failures from one IP for one account", async () => {
    const u = uniqueUser();
    await new Client(app.base).req("POST", "/auth/signup", signupBody(u));
    const attacker = new Client(app.base, "203.0.113.77");
    for (let i = 0; i < 8; i++) {
      expect((await attacker.req("POST", "/auth/login", { username: u.username, password: "bad-pass" + i })).status).toBe(401);
    }
    const locked = await attacker.req("POST", "/auth/login", { username: u.username, password: u.password });
    expect(locked.status).toBe(429);
    expect(locked.headers.get("retry-after")).toBeTruthy();
    // A different IP (the real student) is not locked out by the attacker's failures.
    const student = new Client(app.base, "198.51.100.5");
    expect((await student.req("POST", "/auth/login", { username: u.username, password: u.password })).status).toBe(200);
  });

  it("password reset enforces the password rules and signs out other sessions", async () => {
    const u = uniqueUser();
    const phone = new Client(app.base);
    await phone.req("POST", "/auth/signup", signupBody(u));
    const userId = (await app.query("SELECT id FROM users WHERE username = $1", [u.username])).rows[0].id;

    const rawToken = "reset-token-" + u.username;
    const insert = () => app.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval '1 hour')",
      [userId, sha256(rawToken)],
    );
    await insert();
    const c = new Client(app.base);
    expect((await c.req("POST", "/auth/reset-password", { token: rawToken, password: "weak" })).status).toBe(400);

    const ok = await c.req("POST", "/auth/reset-password", { token: rawToken, password: "BrandNew9pass" });
    expect(ok.status).toBe(200);
    // Token is single-use.
    expect((await c.req("POST", "/auth/reset-password", { token: rawToken, password: "BrandNew9pass" })).status).toBe(400);
    // The pre-reset session on the other device is revoked; the new one works.
    expect((await phone.req("GET", "/auth/me")).status).toBe(401);
    expect((await c.req("GET", "/auth/me")).status).toBe(200);
    expect((await new Client(app.base).req("POST", "/auth/login", { username: u.username, password: "BrandNew9pass" })).status).toBe(200);
  });

  it("protects admin routes and AI routes", async () => {
    const c = new Client(app.base, "192.0.2.50");
    expect((await c.req("POST", "/admin/stats", { password: "nope" })).status).toBe(403);
    expect((await c.req("POST", "/admin/stats", { password: process.env.ADMIN_PASSWORD })).status).toBe(200);
    expect((await new Client(app.base).req("POST", "/ai/gemini-message", { user: "hi" })).status).toBe(401);
  });

  it("sends security headers and JSON errors", async () => {
    const r = await new Client(app.base).req("GET", "/healthz");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("content-security-policy")).toBeTruthy();
    const nf = await new Client(app.base).req("GET", "/nope");
    expect(nf.status).toBe(404);
    expect(nf.json.error).toBeTruthy();
  });
});
