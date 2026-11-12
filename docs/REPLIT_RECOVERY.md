# Replit recovery notes

## What is already in this repo
The Replit project's code was committed here (git history from the first commit to 2026-05-05
by `kane777` and `Replit Agent`). Nothing in the app code is missing: the web app
(`artifacts/pathway-penguin`), API (`artifacts/api-server`), shared libs (`lib/*`), scripts and
`attached_assets` are all present.

## What was deliberately removed (PR #11, commit 7f79938)
Replit-only scaffolding: `.replit`, `.replitignore`, every `.replit-artifact/artifact.toml`, and the
`artifacts/mockup-sandbox` design-preview app. They are not needed to run the app on Render.
To look at or restore any of them:

    git show 7f79938^:.replit
    git checkout 7f79938^ -- artifacts/mockup-sandbox   # restores the whole sandbox

`replit.md` became `ARCHITECTURE.md`. Leftover `// @replit` comments in
`artifacts/pathway-penguin/src/components/ui/*.tsx` are harmless style notes.

## What can only come from Replit itself (not in git)
- Anything saved since the last Replit commit (2026-05-05) that was never committed or synced.
- Replit Secrets (copy values into Render env vars; never commit them).
- Replit's own database contents, if any real test data matters.
- Uploaded files or objects kept in Replit storage.
