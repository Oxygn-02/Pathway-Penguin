# Pathway Penguin — operations runbook

## Environment variables (API server)
See the table in `replit.md`. Required in production: `DATABASE_URL`, `PORT`, `JWT_SECRET`,
`ENCRYPTION_KEY` (exactly 32 characters), `ADMIN_PASSWORD`, AI provider keys, and `APP_DOMAIN`
(host name only, e.g. `pathway.example.com`; used to build links in emails).

Optional: `REQUIRE_EMAIL_VERIFICATION`, `RESEND_API_KEY`, `RESEND_FROM`, `CORS_ALLOWED_ORIGINS`,
`DATABASE_SSL_STRICT`, `AI_LIMIT_PER_MINUTE/_HOUR/_DAY`.

## First deploy of the hardened version
1. Set `ADMIN_PASSWORD` to a **new** value. Treat the old one as compromised.
2. Deploy. **Everyone is logged out once** (sessions moved server-side) and must log in again.
3. Check `/api/healthz`, log in, generate one quiz, and open Account → Your data.
4. Turn on email confirmation when ready (below).

## Turning on email confirmation
1. Verify your sending domain in Resend and set `RESEND_API_KEY` and `RESEND_FROM`.
2. Set `APP_DOMAIN`.
3. Set `REQUIRE_EMAIL_VERIFICATION=true` and redeploy.
4. Test with a real `@utcportsmouth.org` address: sign up → email arrives → link signs you in.
Existing accounts are treated as confirmed. If email sending breaks, signup returns an error
rather than creating accounts nobody can confirm; set the flag back to `false` to reopen signup.

## Database TLS
By default the connection is encrypted but the server certificate is not verified. Once you know
your database's certificate chain is trusted, set `DATABASE_SSL_STRICT=true`. If the app can't
connect afterwards, unset it.

## Backups and restore
Use your host's managed backups and **test a restore** at least once before exams.
Manual backup / restore with Postgres tools:
```sh
pg_dump --format=custom --file=pp-$(date +%F).dump "$DATABASE_URL"
pg_restore --clean --if-exists --no-owner --dbname "$TARGET_DATABASE_URL" pp-YYYY-MM-DD.dump
```
Store dumps encrypted and away from the app host; they contain student data.
Deleted accounts remain in backups until those backups expire (say so in the privacy notice).

## Rolling back
Redeploy the previous commit. The new database tables/columns (`sessions`,
`email_verification_tokens`, `users.email_verified`, `users.email_hash`) are additive and safe to
leave in place. Rolling back to a version older than the sessions change needs no data changes, but
users will have to log in again.

## Secrets
- `JWT_SECRET`: rotating it logs everyone out. Safe.
- `ADMIN_PASSWORD`: rotate freely.
- `ENCRYPTION_KEY`: **do not rotate casually.** Stored emails are encrypted with it; changing it
  makes existing emails undecryptable (password reset emails would stop working) and invalidates
  the duplicate-email hashes. Rotation needs a re-encryption script.
- AI/Resend keys: rotate in the provider dashboard and the host's secrets.

## Monitoring (recommended, not yet set up)
- Uptime check on `/api/healthz`.
- Error tracking (e.g. Sentry) on the API and the frontend.
- Alerts on AI spend. Per-user limits are in `artifacts/api-server/src/lib/rateLimiter.ts`
  and are in memory, so they reset on restart and apply per server instance.

## Known limitations
- Login throttling and AI limits are per instance (in memory).
- `pnpm audit --prod` reports one moderate advisory (`uuid` via the Resend SDK).
- Student text is sent to Google/Anthropic: confirm terms and the privacy notice.
- The student leaderboard shows usernames and points to other students.
