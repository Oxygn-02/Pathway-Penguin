import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hasDb, startApp, Client, uniqueUser, signupBody, type TestApp } from "./helpers.js";

describe.skipIf(!hasDb)("account export and deletion (integration)", () => {
  let app: TestApp;
  beforeAll(async () => { app = await startApp(); });
  afterAll(async () => { await app.close(); });

  async function userWithData() {
    const u = uniqueUser();
    const c = new Client(app.base);
    await c.req("POST", "/auth/signup", signupBody(u));
    const id = (await app.query("SELECT id FROM users WHERE username = $1", [u.username])).rows[0].id as number;
    const pw = (await app.query("INSERT INTO pathways (user_id, subject, content) VALUES ($1,'Maths','topics') RETURNING id", [id])).rows[0].id;
    await app.query("INSERT INTO pathway_sources (user_id, pathway_id, name, content) VALUES ($1,$2,'notes','text')", [id, pw]);
    await app.query("INSERT INTO source_quizzes (user_id, pathway_id, name) VALUES ($1,$2,'q')", [id, pw]);
    await app.query("INSERT INTO quiz_results (user_id, topic_id, subject) VALUES ($1,'1.1','Maths')", [id]);
    await app.query("INSERT INTO calendar_entries (user_id, subject, day_of_week) VALUES ($1,'Maths',1)", [id]);
    const ex = (await app.query("INSERT INTO exams (user_id, subject, exam_date) VALUES ($1,'Maths','2027-06-01') RETURNING id", [id])).rows[0].id;
    await app.query("INSERT INTO exam_papers (exam_id, user_id, name) VALUES ($1,$2,'Paper 1')", [ex, id]);
    await app.query("INSERT INTO ai_usage_log (user_id, ai_provider) VALUES ($1,'claude-haiku-5-5')", [id]);
    await app.query("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,'h', NOW() + interval '1 hour')", [id]);
    return { u, c, id };
  }

  it("exports the user's data, including their decrypted email", async () => {
    const { u, c } = await userWithData();
    const r = await c.req("GET", "/account/export");
    expect(r.status).toBe(200);
    expect(r.json.profile.username).toBe(u.username);
    expect(r.json.profile.email).toBe(u.email);
    expect(r.json.pathways).toHaveLength(1);
    expect(r.json.examPapers).toHaveLength(1);
    expect(r.json.quizResults).toHaveLength(1);
    expect(JSON.stringify(r.json)).not.toContain("password_hash");
    expect((await new Client(app.base).req("GET", "/account/export")).status).toBe(401);
  });

  it("deleting requires the right password, then removes everything", async () => {
    const { u, c, id } = await userWithData();
    expect((await c.req("DELETE", "/account", {})).status).toBe(400);
    expect((await c.req("DELETE", "/account", { password: "wrong-pass9" })).status).toBe(403);
    expect((await c.req("GET", "/auth/me")).status).toBe(200); // still there

    expect((await c.req("DELETE", "/account", { password: u.password })).status).toBe(200);
    expect((await c.req("GET", "/auth/me")).status).toBe(401);
    expect((await new Client(app.base).req("POST", "/auth/login", { username: u.username, password: u.password })).status).toBe(401);

    for (const table of ["users", "subjects", "pathways", "pathway_sources", "source_quizzes", "quiz_results",
      "calendar_entries", "exams", "exam_papers", "ai_usage_log", "password_reset_tokens", "sessions", "activity_log"]) {
      const col = table === "users" ? "id" : "user_id";
      const n = (await app.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE ${col} = $1`, [id])).rows[0].n;
      expect(n, table).toBe(0);
    }
  });

  it("does not let one user delete another's account", async () => {
    const a = await userWithData();
    const b = await userWithData();
    expect((await a.c.req("DELETE", "/account", { password: b.u.password })).status).toBe(403);
    expect((await app.query("SELECT 1 FROM users WHERE id = $1", [b.id])).rowCount).toBe(1);
  });
});
