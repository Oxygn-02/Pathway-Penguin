import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hasDb, startApp, Client, uniqueUser, signupBody, type TestApp } from "./helpers.js";

describe.skipIf(!hasDb)("deleting a pathway (integration)", () => {
  let app: TestApp;
  beforeAll(async () => { app = await startApp(); });
  afterAll(async () => { await app.close(); });

  async function userWithPathway() {
    const u = uniqueUser();
    const c = new Client(app.base);
    await c.req("POST", "/auth/signup", signupBody(u));
    const id = (await app.query("SELECT id FROM users WHERE username = $1", [u.username])).rows[0].id as number;
    const pw = (await app.query("INSERT INTO pathways (user_id, subject, content) VALUES ($1,'Maths','[]') RETURNING id", [id])).rows[0].id as number;
    await app.query("INSERT INTO pathway_sources (user_id, pathway_id, name, content) VALUES ($1,$2,'n','t')", [id, pw]);
    await app.query("INSERT INTO quiz_results (user_id, topic_id, subject, pathway_id) VALUES ($1,'1.1','Maths',$2)", [id, pw]);
    const ex = (await app.query("INSERT INTO exams (user_id, subject, exam_date) VALUES ($1,'Maths','2027-06-01') RETURNING id", [id])).rows[0].id;
    await app.query("INSERT INTO exam_papers (exam_id, user_id, name, pathway_id) VALUES ($1,$2,'P1',$3)", [ex, id, pw]);
    return { c, id, pw };
  }

  const count = async (table: string, where: string, v: number) =>
    (await app.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE ${where}`, [v])).rows[0].n;

  it("removes the pathway and everything attached to it", async () => {
    const { c, pw } = await userWithPathway();
    expect((await c.req("DELETE", `/pathways/${pw}`)).status).toBe(200);
    expect(await count("pathways", "id = $1", pw)).toBe(0);
    expect(await count("pathway_sources", "pathway_id = $1", pw)).toBe(0);
    expect(await count("quiz_results", "pathway_id = $1", pw)).toBe(0);
    expect(await count("exam_papers", "pathway_id = $1", pw)).toBe(0);
  });

  it("will not delete another student's pathway", async () => {
    const a = await userWithPathway();
    const b = await userWithPathway();
    expect((await a.c.req("DELETE", `/pathways/${b.pw}`)).status).toBe(404);
    expect(await count("pathways", "id = $1", b.pw)).toBe(1);
    expect(await count("quiz_results", "pathway_id = $1", b.pw)).toBe(1);
  });

  it("rejects bad ids", async () => {
    const { c } = await userWithPathway();
    expect((await c.req("DELETE", "/pathways/abc")).status).toBe(400);
  });
});
