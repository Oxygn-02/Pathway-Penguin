import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hasDb, startApp, Client, uniqueUser, signupBody, type TestApp } from "./helpers.js";

describe.skipIf(!hasDb)("leaderboard and quiz results (integration)", () => {
  let app: TestApp;
  beforeAll(async () => { app = await startApp(); });
  afterAll(async () => { await app.close(); });

  async function newUser(points: number, yearGroup = 11) {
    const u = uniqueUser();
    const c = new Client(app.base);
    await c.req("POST", "/auth/signup", { ...signupBody(u), yearGroup });
    await app.query("UPDATE users SET points = $1 WHERE username = $2", [points, u.username]);
    return { u, c };
  }

  it("returns at most the top 5 plus the caller's own place", async () => {
    for (let i = 0; i < 7; i++) await newUser(900000 + i);
    const { u, c } = await newUser(0);
    const r = await c.req("GET", "/leaderboard");
    expect(r.status).toBe(200);
    expect(r.json.leaderboard).toHaveLength(5);
    expect(r.json.me.username).toBe(u.username);
    expect(r.json.me.position).toBeGreaterThan(5);
    expect(JSON.stringify(r.json)).not.toMatch(/email|password/i);
  });

  it("scope=year only counts the caller's year group", async () => {
    const { c } = await newUser(5, 12);
    const r = await c.req("GET", "/leaderboard?scope=year");
    expect(r.json.scope).toBe("year");
    expect(r.json.me.position).toBe(1);
  });

  it("clamps faked marks and awards points once per topic per session", async () => {
    const { u, c } = await newUser(0);
    const body = { subject: "Maths", sessionId: "s1", results: [{ topicId: "1.1", correct: true, marksAwarded: 99, marksAvailable: 3 }] };
    expect((await c.req("POST", "/quiz-results", body)).status).toBe(200);
    expect((await c.req("POST", "/quiz-results", body)).status).toBe(200);
    const row = (await app.query("SELECT marks_awarded, marks_available FROM quiz_results r JOIN users u ON u.id = r.user_id WHERE u.username = $1 LIMIT 1", [u.username])).rows[0];
    expect(row.marks_awarded).toBe(3);
    const pts = (await app.query("SELECT points FROM users WHERE username = $1", [u.username])).rows[0].points;
    expect(pts).toBe(15);
  });
});
