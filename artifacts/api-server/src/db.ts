import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, "db.sqlite"));

db.exec(`
  PRAGMA journal_mode=WAL;
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_encrypted TEXT NOT NULL,
    year_group INTEGER NOT NULL,
    school_urn TEXT NOT NULL DEFAULT '13936742',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject_name TEXT NOT NULL,
    exam_board TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'core',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pathways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id TEXT NOT NULL,
    topic_desc TEXT NOT NULL DEFAULT '',
    correct INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS calendar_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migrations — safe to run repeatedly
try { db.exec("ALTER TABLE users ADD COLUMN username_updated_at TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN email_updated_at TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN avatar INTEGER NOT NULL DEFAULT 1"); } catch {}
try { db.exec("ALTER TABLE quiz_results ADD COLUMN subject TEXT NOT NULL DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE quiz_results ADD COLUMN quiz_session_id TEXT NOT NULL DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE pathways ADD COLUMN last_opened_at TEXT"); } catch {}
try { db.exec("ALTER TABLE pathways ADD COLUMN questions TEXT"); } catch {}
// pathway_id links each quiz result to the specific pathway it was answered against
try { db.exec("ALTER TABLE quiz_results ADD COLUMN pathway_id INTEGER"); } catch {}
// resume_number stores the last-known question number (stamp) so resume lands on the correct question
try { db.exec("ALTER TABLE pathways ADD COLUMN resume_number INTEGER"); } catch {}
try { db.exec("ALTER TABLE pathways ADD COLUMN completed_topic_prefixes TEXT NOT NULL DEFAULT '[]'"); } catch {}
// marks columns so topic cards can show marks earned vs total marks available
try { db.exec("ALTER TABLE quiz_results ADD COLUMN marks_awarded INTEGER NOT NULL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE quiz_results ADD COLUMN marks_available INTEGER NOT NULL DEFAULT 1"); } catch {}

/* ── Points helper ─────────────────────────────────────────────── */
const _awardPts = db.prepare("UPDATE users SET points = points + ? WHERE id = ?");
export function awardPoints(userId: number, pts: number): void {
  if (pts > 0) _awardPts.run(pts, userId);
}
