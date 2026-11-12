# Row Level Security (RLS)

Each student can only read and write their own rows. Postgres enforces this itself, so a route that forgets its `WHERE user_id = $1` still cannot leak another student's data.

## How it works

- The API still connects as one database user. After `requireAuth` accepts a session, every `query()` and `withTransaction()` in that request runs as the `pp_student` role with `app.user_id` set to the signed-in student (`src/db.ts`).
- `pp_student` is a `NOLOGIN` role without `BYPASSRLS`. Nobody can connect as it.
- Policies and grants are in `src/rls.ts`. They are applied by `initDb()` on every start. They are idempotent and never change or delete rows.
- Code that is not about one student (login, signup, password reset, session lookup, admin stats) uses `systemQuery()` / `withSystemTransaction()`, which run as the server. `routes/auth.ts` is entirely of this kind.

## Policies

| Table | Student can |
| --- | --- |
| `users` | read, delete and edit (avatar, username, email, points) their own row only. Cannot create accounts or touch `password_hash`/`id` |
| `subjects`, `pathways`, `quiz_results`, `calendar_entries`, `exams`, `exam_papers`, `pathway_sources`, `source_quizzes` | read, create, edit, delete rows where `user_id` is their own. Rows hung off a parent (`exam_id`, `pathway_id`) must point at the student's own exam or pathway |
| `activity_log`, `ai_usage_log` | read and append their own rows. No edit or delete |
| `sessions`, `password_reset_tokens`, `email_verification_tokens` | nothing (server only) |
| leaderboard | `pp_leaderboard()` returns only id, username, points, avatar for everyone |

## Adding a table

1. Add `user_id INTEGER NOT NULL REFERENCES users(id)`.
2. Add it to `OWNED_TABLES` in `src/rls.ts` (or `LOG_TABLES` / `SYSTEM_ONLY_TABLES`).
3. Add a case to `src/__tests__/integration/rls.test.ts`.

A table that is not listed has no grants for `pp_student`, so student requests fail closed on it.

## Operations

- The database user needs `CREATEROLE` (or already own `pp_student`) the first time the app starts. If the role cannot be set up, the server refuses to start rather than run unprotected.
- `RLS_ENFORCE=false` switches the per-request scoping off (emergency rollback only; logs a warning at start-up).
- Tests: `DATABASE_URL=... pnpm --filter @workspace/api-server run test` (`rls.test.ts`).

## Limits

- This protects against route bugs, bad ids and missing filters. The role switch is done with `SET ROLE` on the same connection, so it does not stop an attacker who can already run arbitrary SQL (all SQL here is parameterised). Full separation would need a second, restricted database login for student requests.
- `routes/auth.ts` (me, username, email, avatar) runs as the server, filtered by the session's user id in code, not by RLS.
- The owner is not forced through RLS (`FORCE ROW LEVEL SECURITY` is off) because system code relies on it.
