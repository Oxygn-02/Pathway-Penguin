/**
 * Row Level Security for student data.
 *
 * How it works
 * ------------
 * The API connects to Postgres as one login role (the table owner). For every
 * signed-in request, `query()` in db.ts runs inside a transaction that does
 *
 *     SET LOCAL ROLE pp_student;                 -- a NOLOGIN role, RLS applies to it
 *     SET LOCAL app.user_id = '<session user>';  -- who is asking
 *
 * and the policies below only let that student see and change rows whose
 * user_id matches. So even a route that forgets its `WHERE user_id = $1`
 * cannot read or write another student's data.
 *
 * Code that must act on behalf of nobody in particular (login, signup, password
 * reset, session lookup, admin stats) uses `systemQuery()`, which runs as the
 * owner and is not subject to these policies. The owner is deliberately NOT
 * forced (no FORCE ROW LEVEL SECURITY) so that is possible.
 *
 * Tables with no student policy at all (sessions, password_reset_tokens,
 * email_verification_tokens) are denied to pp_student entirely.
 *
 * Everything here is idempotent and runs from initDb() on every start. It never
 * deletes or rewrites rows.
 */
import type pg from "pg";

export const STUDENT_ROLE = "pp_student";

/** Tables where a row belongs to one student through a `user_id` column. */
const OWNED_TABLES = [
  "subjects",
  "pathways",
  "quiz_results",
  "calendar_entries",
  "exams",
  "exam_papers",
  "pathway_sources",
  "source_quizzes",
] as const;

/**
 * Per-table extra rule: a parent row referenced by a real foreign key must also belong to
 * the student (the FK check itself ignores RLS, so without this a student could hang a row
 * off someone else's exam or pathway). exam_papers.pathway_id and quiz_results.pathway_id
 * are plain integers that may point at a pathway the student later deleted, so they are
 * not checked; reading that pathway is blocked by its own policy anyway.
 */
const PARENT_CHECKS: Record<string, string> = {
  exam_papers: "exam_id IN (SELECT id FROM exams WHERE user_id = pp_uid())",
  pathway_sources: "pathway_id IN (SELECT id FROM pathways WHERE user_id = pp_uid())",
  source_quizzes: "pathway_id IN (SELECT id FROM pathways WHERE user_id = pp_uid())",
};

/** Append-only logs: a student can write and read their own rows, not change them. */
const LOG_TABLES = ["activity_log", "ai_usage_log"] as const;

/** Only the server (owner) may touch these. RLS is on and there is no student policy. */
const SYSTEM_ONLY_TABLES = ["sessions", "password_reset_tokens", "email_verification_tokens"] as const;

/** Columns on users a student session may change. Never password_hash or id. */
const USER_UPDATABLE_COLUMNS = [
  "username", "username_updated_at", "email_encrypted", "email_hash", "email_updated_at",
  "avatar", "points",
];

const q = (name: string) => `"${name}"`;

export function buildRlsStatements(): string[] {
  const s: string[] = [];

  // 1. Role. NOLOGIN: nobody can connect as it, the API can only SET ROLE to it.
  s.push(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${STUDENT_ROLE}') THEN
        CREATE ROLE ${STUDENT_ROLE} NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
      END IF;
    END $$`);
  // The connecting role must be allowed to SET ROLE to pp_student. On Postgres 16+ a role
  // that creates another is made its admin but is NOT given SET, so grant it explicitly.
  s.push(`
    DO $$
    BEGIN
      IF current_setting('server_version_num')::int >= 160000 THEN
        IF NOT pg_has_role(current_user, '${STUDENT_ROLE}', 'SET') THEN
          EXECUTE format('GRANT ${STUDENT_ROLE} TO %I WITH SET TRUE', current_user);
        END IF;
      ELSIF NOT pg_has_role(current_user, '${STUDENT_ROLE}', 'MEMBER') THEN
        EXECUTE format('GRANT ${STUDENT_ROLE} TO %I', current_user);
      END IF;
    END $$`);

  // 2. Helper that reads who is asking. NULL (no match on any policy) when unset.
  s.push(`
    CREATE OR REPLACE FUNCTION pp_uid() RETURNS integer
      LANGUAGE sql STABLE PARALLEL SAFE
      AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::integer $$`);
  s.push(`GRANT EXECUTE ON FUNCTION pp_uid() TO ${STUDENT_ROLE}`);

  s.push(`GRANT USAGE ON SCHEMA public TO ${STUDENT_ROLE}`);

  // 3. users: a student sees and edits only their own row.
  s.push(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);
  s.push(`DROP POLICY IF EXISTS pp_users_select ON users`);
  s.push(`CREATE POLICY pp_users_select ON users FOR SELECT TO ${STUDENT_ROLE} USING (id = pp_uid())`);
  s.push(`DROP POLICY IF EXISTS pp_users_update ON users`);
  s.push(`CREATE POLICY pp_users_update ON users FOR UPDATE TO ${STUDENT_ROLE} USING (id = pp_uid()) WITH CHECK (id = pp_uid())`);
  s.push(`DROP POLICY IF EXISTS pp_users_delete ON users`);
  s.push(`CREATE POLICY pp_users_delete ON users FOR DELETE TO ${STUDENT_ROLE} USING (id = pp_uid())`);
  // No INSERT policy: only signup (system) creates accounts.
  s.push(`REVOKE ALL ON users FROM ${STUDENT_ROLE}`);
  s.push(`GRANT SELECT, DELETE ON users TO ${STUDENT_ROLE}`);
  s.push(`GRANT UPDATE (${USER_UPDATABLE_COLUMNS.map(q).join(", ")}) ON users TO ${STUDENT_ROLE}`);

  // 4. Tables owned through user_id: full access to own rows only.
  for (const t of OWNED_TABLES) {
    const parent = PARENT_CHECKS[t];
    const check = parent ? `user_id = pp_uid() AND ${parent}` : `user_id = pp_uid()`;
    s.push(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
    s.push(`DROP POLICY IF EXISTS pp_${t}_all ON ${t}`);
    s.push(`CREATE POLICY pp_${t}_all ON ${t} FOR ALL TO ${STUDENT_ROLE} USING (user_id = pp_uid()) WITH CHECK (${check})`);
    s.push(`REVOKE ALL ON ${t} FROM ${STUDENT_ROLE}`);
    s.push(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${t} TO ${STUDENT_ROLE}`);
  }

  // 5. Logs: read and append own rows only.
  for (const t of LOG_TABLES) {
    s.push(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
    s.push(`DROP POLICY IF EXISTS pp_${t}_select ON ${t}`);
    s.push(`CREATE POLICY pp_${t}_select ON ${t} FOR SELECT TO ${STUDENT_ROLE} USING (user_id = pp_uid())`);
    s.push(`DROP POLICY IF EXISTS pp_${t}_insert ON ${t}`);
    s.push(`CREATE POLICY pp_${t}_insert ON ${t} FOR INSERT TO ${STUDENT_ROLE} WITH CHECK (user_id = pp_uid())`);
    s.push(`REVOKE ALL ON ${t} FROM ${STUDENT_ROLE}`);
    s.push(`GRANT SELECT, INSERT ON ${t} TO ${STUDENT_ROLE}`);
  }

  // 6. Server-only tables: RLS on, no policy, no grant => denied to students.
  for (const t of SYSTEM_ONLY_TABLES) {
    s.push(`
      DO $$
      BEGIN
        IF to_regclass('public.${t}') IS NOT NULL THEN
          EXECUTE 'ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY';
          EXECUTE 'REVOKE ALL ON ${t} FROM ${STUDENT_ROLE}';
        END IF;
      END $$`);
  }

  // 7. Serial ids.
  s.push(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${STUDENT_ROLE}`);

  // 8. The leaderboard is the one deliberate cross-student read. It exposes only
  //    these four columns and runs as the owner (SECURITY DEFINER).
  s.push(`
    CREATE OR REPLACE FUNCTION pp_leaderboard()
      RETURNS TABLE (id integer, username text, points integer, avatar integer)
      LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
      AS $$ SELECT u.id, u.username, u.points, u.avatar FROM users u ORDER BY u.points DESC, u.created_at ASC $$`);
  s.push(`REVOKE ALL ON FUNCTION pp_leaderboard() FROM PUBLIC`);
  s.push(`GRANT EXECUTE ON FUNCTION pp_leaderboard() TO ${STUDENT_ROLE}`);

  return s;
}

export async function applyRls(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of buildRlsStatements()) await client.query(stmt);
    await client.query("COMMIT");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    throw e;
  } finally {
    client.release();
  }

  // Prove the API can actually switch to the student role. If it cannot, fail at
  // startup rather than run signed-in requests with no row-level protection.
  const check = await pool.connect();
  try {
    await check.query("BEGIN");
    await check.query(`SET LOCAL ROLE ${STUDENT_ROLE}`);
    await check.query("ROLLBACK");
  } finally {
    check.release();
  }
}
