# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL via `pg` (raw SQL, schema created in `artifacts/api-server/src/db.ts`). `lib/db` (Drizzle) is unused scaffolding.
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Pathway Penguin (`artifacts/pathway-penguin`)

A GCSE study tool React app at `/`. Students upload or paste a subject pathway document (topic table with confidence ratings 1–4). The app:
1. Extracts topics using Gemini (PDF or text)
2. Generates GCSE exam questions in parallel using Gemini
3. Quizzes the student with AI-checked answers
4. Shows results with areas to focus on and strong topics

Features:
- Penguin mascot "Pip" using uploaded PNG (`/public/pip.png`) throughout
- Loading screen is just the uploaded video (`/public/loading-bg.mp4`) looping fullscreen with a progress card overlay
- Pip chat panel for asking questions during the quiz
- Nunito font (Google Fonts) — rounded Apple SF Pro Rounded-like text
- Soft blue color scheme (#daeefa → #eef7fd → #ffffff gradient)
- Questions with numbered points (1. / 2. etc.) separated by thin ruled lines
- AI calls go via backend `/api/ai/gemini-message`, which tries a chain of free-tier models (default `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemma-3-27b-it`; override with `GEMINI_MODELS`)
- Single self-contained App.jsx file

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── pathway-penguin/    # Pathway Penguin GCSE study app (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Environment variables (API server)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `PORT` | yes | Port the API listens on |
| `JWT_SECRET` | yes | Signs session cookies |
| `ENCRYPTION_KEY` | yes | Exactly 32 chars; encrypts stored emails |
| `ADMIN_PASSWORD` | for admin | Password for `/api/admin/*`. If unset, admin endpoints return 503 (fail closed). Sent in the request body (`stats`) or the `x-admin-password` header (`token-stats`); 5 failures per IP locks out for 15 min |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated origins allowed credentialed cross-origin access. Unset = same-origin only (localhost allowed in development) |
| `APP_DOMAIN` | for emails | Public host name (no scheme) used in links in emails |
| `RESEND_API_KEY` / `RESEND_FROM` | for emails | Sends reset and confirmation emails through Resend |
| `REQUIRE_EMAIL_VERIFICATION` | no | `true` makes new signups confirm their school email before logging in (default off) |
| `DATABASE_SSL_STRICT` | no | `true` verifies the database's TLS certificate in production |
| `AI_LIMIT_PER_MINUTE` / `_HOUR` / `_DAY` | no | Per-user AI request caps (defaults 120 / 1500 / 6000) |
| AI provider keys | yes | See `lib/integrations-*` |

Never commit `.env` files or database files (`*.sqlite*`); both are in `.gitignore`.

## Tests and CI

- `pnpm run typecheck` — whole workspace.
- `pnpm --filter @workspace/api-server run test` — API tests. Integration tests need `DATABASE_URL` pointing at a Postgres (they are skipped without it).
- `pnpm --filter @workspace/pathway-penguin run test` / `run lint` — frontend tests and lint.
- GitHub Actions (`.github/workflows/ci.yml`) runs all of the above plus both builds and a dependency audit on every PR.

See `docs/RUNBOOK.md` (operations) and `docs/PRIVACY_NOTICE_DRAFT.md` (draft for the school's data-protection lead).

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/`. Database persistence uses the `pg` (node-postgres) library directly against any PostgreSQL database (`DATABASE_URL`) — **not** Drizzle ORM. Schema is created/migrated via `initDb()` in `src/db.ts` on every server startup using `CREATE TABLE IF NOT EXISTS`.

- Entry: `src/index.ts` — calls `initDb()`, then starts Express on `PORT`
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Database: `src/db.ts` — pg Pool, `query()` helper, `awardPoints()`, `logActivity()`, `initDb()`
- Routes: `src/routes/` — auth, pathways, quizResults, leaderboard, calendar, admin, ai
- `pnpm --filter @workspace/api-server run dev` — run the dev server (port 8080)
- All SQL uses `$1 $2 ...` PostgreSQL parameterised placeholders

### `lib/db` (`@workspace/db`)

**Currently unused** — the API server talks to Postgres through `pg` directly (see `artifacts/api-server/src/db.ts`) and does not import this package. Kept as scaffolding. Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, set `DATABASE_URL`)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production schema changes happen via `initDb()` at startup. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

#### Load Test (`scripts/load-test.mjs`)

Standalone load test simulating 10 concurrent users through an 11-step journey (signup → login → pathway upload → question generation → answer checking → results → weak topics → calendar → logout/re-login → session resume). Uses Node 24 native fetch with manual cookie handling for per-user auth sessions.

Run: `node scripts/load-test.mjs` (defaults to port 8080) or `node scripts/load-test.mjs --port 3000`.

Output includes per-action timing, AI API call counts, token usage, peak concurrency, DB operation estimates, failure logs, and projected paid-tier costs at 50/150/300 users (gemini-2.5-flash pricing).

The `/api/ai/gemini-message` route returns `usage: { input_tokens, output_tokens }` alongside `text` to support token tracking.
