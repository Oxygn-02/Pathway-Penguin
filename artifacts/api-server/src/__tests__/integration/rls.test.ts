import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { hasDb, startApp, Client, uniqueUser, signupBody, type TestApp } from "./helpers.js";

/**
 * Row Level Security. Student A must never see or change student B's data, in any table.
 * These run against a real Postgres, in the same way the API does: as the `pp_student`
 * role with `app.user_id` set to the signed-in student.
 */
describe.skipIf(!hasDb)("row level security (integration)", () => {
  let app: TestApp;
  let pool: pg.Pool;
  let A: number;
  let B: number;
  let bPathway: number;
  let bExam: number;

  /** Run `fn` as student `uid`, exactly like db.ts does. Always rolled back. */
  async function asStudent<T>(uid: number | null, fn: (q: (sql: string, p?: any[]) => Promise<pg.QueryResult>) => Promise<T>): Promise<T> {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT set_config('role', 'pp_student', true)");
      if (uid !== null) await c.query("SELECT set_config('app.user_id', $1, true)", [String(uid)]);
      return await fn((sql, p) => c.query(sql, p));
    } finally {
      try { await c.query("ROLLBACK"); } catch {}
      c.release();
    }
  }

  /** Statement that Postgres must reject. Each runs in its own transaction. */
  const denied = (uid: number, sql: string, params: any[] = []) =>
    asStudent(uid, (q) => q(sql, params)).then(
      () => { throw new Error("expected Postgres to refuse: " + sql); },
      (e) => String(e.message),
    );

  async function makeStudent() {
    const u = uniqueUser();
    await new Client(app.base).req("POST", "/auth/signup", signupBody(u));
    const id = (await app.query("SELECT id FROM users WHERE username = $1", [u.username])).rows[0].id as number;
    const pw = (await app.query("INSERT INTO pathways (user_id, subject, content) VALUES ($1,'Maths','[]') RETURNING id", [id])).rows[0].id as number;
    const ex = (await app.query("INSERT INTO exams (user_id, subject, exam_date) VALUES ($1,'Maths','2027-06-01') RETURNING id", [id])).rows[0].id as number;
    await app.query("INSERT INTO exam_papers (exam_id, user_id, name) VALUES ($1,$2,'Paper 1')", [ex, id]);
    await app.query("INSERT INTO pathway_sources (user_id, pathway_id, name, content) VALUES ($1,$2,'notes','secret notes')", [id, pw]);
    await app.query("INSERT INTO source_quizzes (user_id, pathway_id, name) VALUES ($1,$2,'quiz')", [id, pw]);
    await app.query("INSERT INTO quiz_results (user_id, topic_id, subject) VALUES ($1,'1.1','Maths')", [id]);
    await app.query("INSERT INTO calendar_entries (user_id, subject, day_of_week) VALUES ($1,'Maths',1)", [id]);
    await app.query("INSERT INTO activity_log (event_type, user_id, username) VALUES ('login',$1,$2)", [id, u.username]);
    await app.query("INSERT INTO ai_usage_log (user_id, ai_provider) VALUES ($1,'claude-haiku-5-5')", [id]);
    await app.query("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,'h', NOW() + interval '1 hour')", [id]);
    await app.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1,$2, NOW() + interval '1 hour')", ["sid-" + id, id]);
    return { id, pw, ex };
  }

  beforeAll(async () => {
    app = await startApp();
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
    A = (await makeStudent()).id;
    const b = await makeStudent();
    B = b.id; bPathway = b.pw; bExam = b.ex;
  });
  afterAll(async () => { await pool.end(); await app.close(); });

  const OWNED = ["subjects", "pathways", "quiz_results", "calendar_entries", "exams", "exam_papers",
    "pathway_sources", "source_quizzes", "activity_log", "ai_usage_log"];

  it("a student can read their own rows in every table", async () => {
    for (const t of OWNED.filter((t) => t !== "subjects")) {
      const n = await asStudent(A, async (q) => (await q(`SELECT count(*)::int AS n FROM ${t} WHERE user_id = $1`, [A])).rows[0].n);
      expect(n, t).toBeGreaterThan(0);
    }
    const me = await asStudent(A, async (q) => (await q("SELECT id FROM users")).rows);
    expect(me.map((r) => r.id)).toEqual([A]);
  });

  it("with no WHERE clause at all, a student only gets their own rows", async () => {
    for (const t of OWNED) {
      const owners = await asStudent(A, async (q) => (await q(`SELECT DISTINCT user_id FROM ${t}`)).rows.map((r) => r.user_id));
      expect(owners.filter((id: number) => id !== A), t).toEqual([]);
    }
  });

  it("a student cannot read another student's rows by id or by user_id", async () => {
    for (const t of OWNED) {
      const n = await asStudent(A, async (q) => (await q(`SELECT count(*)::int AS n FROM ${t} WHERE user_id = $1`, [B])).rows[0].n);
      expect(n, t).toBe(0);
    }
    expect(await asStudent(A, async (q) => (await q("SELECT * FROM users WHERE id = $1", [B])).rowCount)).toBe(0);
    expect(await asStudent(A, async (q) => (await q("SELECT * FROM pathways WHERE id = $1", [bPathway])).rowCount)).toBe(0);
  });

  it("with no signed-in user set, a student session sees nothing", async () => {
    for (const t of [...OWNED, "users"]) {
      const n = await asStudent(null, async (q) => (await q(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n);
      expect(n, t).toBe(0);
    }
  });

  it("a student cannot update or delete another student's rows", async () => {
    const before = await app.query("SELECT (SELECT count(*) FROM pathways WHERE user_id=$1) p, (SELECT count(*) FROM exams WHERE user_id=$1) e, (SELECT count(*) FROM calendar_entries WHERE user_id=$1) c, (SELECT count(*) FROM quiz_results WHERE user_id=$1) r", [B]);
    for (const t of ["pathways", "exams", "calendar_entries", "quiz_results", "pathway_sources", "source_quizzes", "exam_papers"]) {
      const del = await asStudent(A, (q) => q(`DELETE FROM ${t} WHERE user_id = $1`, [B]));
      expect(del.rowCount, "delete " + t).toBe(0);
    }
    expect((await asStudent(A, (q) => q("UPDATE pathways SET subject = 'hacked' WHERE user_id = $1", [B]))).rowCount).toBe(0);
    expect((await asStudent(A, (q) => q("UPDATE users SET avatar = 9 WHERE id = $1", [B]))).rowCount).toBe(0);
    expect((await asStudent(A, (q) => q("DELETE FROM users WHERE id = $1", [B]))).rowCount).toBe(0);
    const after = await app.query("SELECT (SELECT count(*) FROM pathways WHERE user_id=$1) p, (SELECT count(*) FROM exams WHERE user_id=$1) e, (SELECT count(*) FROM calendar_entries WHERE user_id=$1) c, (SELECT count(*) FROM quiz_results WHERE user_id=$1) r", [B]);
    expect(after.rows[0]).toEqual(before.rows[0]);
    expect((await app.query("SELECT subject FROM pathways WHERE id = $1", [bPathway])).rows[0].subject).toBe("Maths");
  });

  it("a student cannot insert a row that belongs to someone else", async () => {
    const inserts: Record<string, string> = {
      subjects: "INSERT INTO subjects (user_id, subject_name, exam_board) VALUES ($1,'x','AQA')",
      pathways: "INSERT INTO pathways (user_id, subject, content) VALUES ($1,'x','[]')",
      quiz_results: "INSERT INTO quiz_results (user_id, topic_id) VALUES ($1,'1')",
      calendar_entries: "INSERT INTO calendar_entries (user_id, subject, day_of_week) VALUES ($1,'x',1)",
      exams: "INSERT INTO exams (user_id, subject, exam_date) VALUES ($1,'x','2027-06-01')",
      activity_log: "INSERT INTO activity_log (event_type, user_id) VALUES ('answer',$1)",
      ai_usage_log: "INSERT INTO ai_usage_log (user_id, ai_provider) VALUES ($1,'x')",
    };
    for (const [t, sql] of Object.entries(inserts)) {
      expect(await denied(A, sql, [B]), t).toMatch(/row-level security/);
    }
  });

  it("a student cannot move their own row to another student", async () => {
    expect(await denied(A, "UPDATE pathways SET user_id = $1 WHERE user_id = $2", [B, A])).toMatch(/row-level security/);
  });

  it("a student cannot hang their rows off another student's exam or pathway", async () => {
    expect(await denied(A, "INSERT INTO exam_papers (exam_id, user_id, name) VALUES ($1,$2,'x')", [bExam, A])).toMatch(/row-level security/);
    expect(await denied(A, "INSERT INTO pathway_sources (user_id, pathway_id, name, content) VALUES ($1,$2,'x','x')", [A, bPathway])).toMatch(/row-level security/);
    expect(await denied(A, "INSERT INTO source_quizzes (user_id, pathway_id, name) VALUES ($1,$2,'x')", [A, bPathway])).toMatch(/row-level security/);
  });

  it("students can create their own rows, and the logs are append-only", async () => {
    await asStudent(A, async (q) => {
      expect((await q("INSERT INTO calendar_entries (user_id, subject, day_of_week) VALUES ($1,'Art',2) RETURNING id", [A])).rowCount).toBe(1);
      expect((await q("INSERT INTO ai_usage_log (user_id, ai_provider) VALUES ($1,'x')", [A])).rowCount).toBe(1);
    });
    expect(await denied(A, "UPDATE activity_log SET event_type = 'x' WHERE user_id = $1", [A])).toMatch(/permission denied/);
    expect(await denied(A, "DELETE FROM ai_usage_log WHERE user_id = $1", [A])).toMatch(/permission denied/);
  });

  it("login, session and reset-token tables are closed to students entirely", async () => {
    for (const t of ["sessions", "password_reset_tokens", "email_verification_tokens"]) {
      expect(await denied(A, `SELECT * FROM ${t}`), t).toMatch(/permission denied/);
      expect(await denied(A, `DELETE FROM ${t}`), t).toMatch(/permission denied/);
    }
  });

  it("students cannot create accounts, change password hashes or ids", async () => {
    expect(await denied(A, "INSERT INTO users (username, password_hash, email_encrypted, year_group) VALUES ('z','x','x',11)")).toMatch(/permission denied/);
    expect(await denied(A, "UPDATE users SET password_hash = 'x' WHERE id = $1", [A])).toMatch(/permission denied/);
    expect(await denied(A, "UPDATE users SET id = id + 1000 WHERE id = $1", [A])).toMatch(/permission denied/);
    // But the columns the app really edits still work on their own row.
    expect((await asStudent(A, (q) => q("UPDATE users SET avatar = 3 WHERE id = $1", [A]))).rowCount).toBe(1);
  });

  it("the leaderboard shows other students' username, points and avatar and nothing else", async () => {
    const r = await asStudent(A, (q) => q("SELECT * FROM pp_leaderboard()"));
    expect(Object.keys(r.rows[0]).sort()).toEqual(["avatar", "id", "points", "username"]);
    expect(r.rows.map((x) => x.id)).toEqual(expect.arrayContaining([A, B]));
  });
});

describe.skipIf(!hasDb)("row level security through the API (integration)", () => {
  let app: TestApp;
  beforeAll(async () => { app = await startApp(); });
  afterAll(async () => { await app.close(); });

  async function student() {
    const u = uniqueUser();
    const c = new Client(app.base);
    expect((await c.req("POST", "/auth/signup", signupBody(u))).status).toBeLessThan(300);
    const id = (await app.query("SELECT id FROM users WHERE username = $1", [u.username])).rows[0].id as number;
    return { c, id, u };
  }

  it("the data routes still work for a student on their own data", async () => {
    const { c } = await student();
    const pw = await c.req("POST", "/pathways", { subject: "Maths", topics: [{ id: "1.1", title: "Number" }] });
    expect(pw.status).toBe(200);
    expect((await c.req("PATCH", `/pathways/${pw.json.id}/open`)).status).toBe(200);
    expect((await c.req("PATCH", `/pathways/${pw.json.id}/questions`, { questions: [{ q: "1+1" }] })).status).toBe(200);
    expect((await c.req("GET", "/pathways")).json.pathways).toHaveLength(1);

    expect((await c.req("POST", "/calendar", { subject: "Maths", dayOfWeek: 1, durationMinutes: 60 })).status).toBe(200);
    expect((await c.req("GET", "/calendar")).status).toBe(200);

    const ex = await c.req("POST", "/exams", { subject: "Maths", examDate: "2027-06-01", priority: "red" });
    expect(ex.status).toBe(200);
    const paper = await c.req("POST", `/exams/${ex.json.id}/papers`, { name: "Paper 1", pathwayId: pw.json.id, topicIds: ["1.1"] });
    expect(paper.status).toBe(200);
    expect((await c.req("GET", "/exams")).status).toBe(200);

    expect((await c.req("POST", "/sources", { pathwayId: pw.json.id, name: "notes", content: "hello" })).status).toBeLessThan(300);
    expect((await c.req("POST", "/quiz-results", {
      subject: "Maths", sessionId: "s1", pathwayId: pw.json.id,
      results: [{ topicId: "1.1", topicDesc: "Number", correct: true, marksAwarded: 2, marksAvailable: 2 }],
    })).status).toBe(200);
    expect((await c.req("GET", `/quiz-results/pathway/${pw.json.id}`)).json.byTopic["1.1"].marksAwarded).toBe(2);

    // Points were awarded inside the scoped request.
    expect((await c.req("GET", "/auth/me")).status).toBe(200);
    const board = await c.req("GET", "/leaderboard");
    expect(board.status).toBe(200);
    expect(board.json.leaderboard.length).toBeGreaterThan(0);
    expect((await c.req("GET", "/account/export")).json.quizResults).toHaveLength(1);
  });

  it("one student cannot see or change another student's data through the API", async () => {
    const a = await student();
    const b = await student();
    const bPw = (await b.c.req("POST", "/pathways", { subject: "Secret", topics: [] })).json.id;
    const bCal = (await b.c.req("POST", "/calendar", { subject: "Secret", dayOfWeek: 2, durationMinutes: 30 })).json.id;
    const bExam = (await b.c.req("POST", "/exams", { subject: "Secret", examDate: "2027-06-02", priority: "green" })).json.id;
    await b.c.req("POST", "/quiz-results", { subject: "Secret", sessionId: "b", pathwayId: bPw, results: [{ topicId: "9.9", topicDesc: "x", correct: true }] });

    expect(JSON.stringify((await a.c.req("GET", "/pathways")).json)).not.toContain("Secret");
    expect(JSON.stringify((await a.c.req("GET", "/calendar")).json)).not.toContain("Secret");
    expect(JSON.stringify((await a.c.req("GET", "/exams")).json)).not.toContain("Secret");
    expect(JSON.stringify((await a.c.req("GET", `/quiz-results/pathway/${bPw}`)).json)).not.toContain("9.9");
    expect(JSON.stringify((await a.c.req("GET", "/account/export")).json)).not.toContain("Secret");

    await a.c.req("DELETE", `/pathways/${bPw}`);
    await a.c.req("DELETE", `/calendar/${bCal}`);
    await a.c.req("DELETE", `/exams/${bExam}`);
    expect((await a.c.req("POST", `/exams/${bExam}/papers`, { name: "sneaky" })).status).toBe(404);
    expect((await a.c.req("POST", "/sources", { pathwayId: bPw, name: "sneaky", content: "x" })).status).not.toBe(200);

    expect((await app.query("SELECT 1 FROM pathways WHERE id = $1", [bPw])).rowCount).toBe(1);
    expect((await app.query("SELECT 1 FROM calendar_entries WHERE id = $1", [bCal])).rowCount).toBe(1);
    expect((await app.query("SELECT 1 FROM exams WHERE id = $1", [bExam])).rowCount).toBe(1);
    expect((await app.query("SELECT 1 FROM exam_papers WHERE exam_id = $1", [bExam])).rowCount).toBe(0);
  });

  it("even a query with no user filter returns only the signed-in student's rows", async () => {
    const a = await student();
    const b = await student();
    await a.c.req("POST", "/pathways", { subject: "A-only", topics: [] });
    await b.c.req("POST", "/pathways", { subject: "B-only", topics: [] });
    const { runAsUser, query } = await import("../../db.js");
    const rows = await runAsUser(a.id, async () => (await query("SELECT user_id, subject FROM pathways")).rows);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r: any) => r.user_id === a.id)).toBe(true);
    expect(rows.some((r: any) => r.subject === "B-only")).toBe(false);
  });
});
