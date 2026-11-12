import { describe, it, expect, beforeAll, afterAll } from "vitest";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { hasDb, startApp, Client, type TestApp } from "./helpers.js";

describe.skipIf(!hasDb)("google sign-in (integration)", () => {
  let app: TestApp;
  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    app = await startApp();
  });
  afterAll(async () => { await app.close(); });

  const pendingCookie = (sub: string, email: string) =>
    "pp_gsignup=" + jwt.sign({ sub, email }, process.env.JWT_SECRET!, { expiresIn: "15m" });
  const body = (username: string) => ({ username, yearGroup: 11, optionSubjects: ["Geography", "Computer Science"] });

  it("reports enabled and redirects to Google with PKCE, state and the school domain hint", async () => {
    const c = new Client(app.base);
    expect((await c.req("GET", "/auth/google/enabled")).json.enabled).toBe(true);
    const res = await fetch(app.base + "/auth/google/start", { redirect: "manual" });
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(loc.searchParams.get("code_challenge_method")).toBe("S256");
    expect(loc.searchParams.get("hd")).toBe("utcportsmouth.org");
    expect(loc.searchParams.get("state")).toBeTruthy();
    expect(res.headers.get("set-cookie")).toContain("pp_oauth=");
  });

  it("callback without a matching state cookie is rejected", async () => {
    const res = await fetch(app.base + "/auth/google/callback?code=x&state=y", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("google_error=");
  });

  it("completing sign-up needs the verified Google cookie", async () => {
    const c = new Client(app.base);
    expect((await c.req("POST", "/auth/google/complete", body("g_nocookie"))).status).toBe(401);
    c.cookie = "pp_gsignup=forged";
    expect((await c.req("POST", "/auth/google/complete", body("g_forged"))).status).toBe(401);
  });

  it("creates an account from a verified Google identity and signs the student in", async () => {
    const id = randomBytes(4).toString("hex");
    const c = new Client(app.base);
    c.cookie = pendingCookie("sub_" + id, `g_${id}@utcportsmouth.org`);
    const r = await c.req("POST", "/auth/google/complete", body("g_" + id));
    expect(r.status).toBe(200);
    expect(r.json.username).toBe("g_" + id);
    expect(r.json.subjects.length).toBe(10);
    // The response also clears the temporary Google cookie; pick out the session cookie.
    const session = r.headers.getSetCookie().find((h) => h.startsWith("pp_session="))!;
    expect(session).toBeTruthy();
    c.cookie = session.split(";")[0];
    expect((await c.req("GET", "/auth/me")).status).toBe(200);

    // The account can't be entered with a password.
    const pw = await new Client(app.base).req("POST", "/auth/login", { username: "g_" + id, password: "anything1" });
    expect(pw.status).toBe(401);

    // Same username can't be taken twice.
    const c2 = new Client(app.base);
    c2.cookie = pendingCookie("sub2_" + id, `g2_${id}@utcportsmouth.org`);
    expect((await c2.req("POST", "/auth/google/complete", body("g_" + id))).status).toBe(409);
  });
});
