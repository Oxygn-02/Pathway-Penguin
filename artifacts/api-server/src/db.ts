import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]): Promise<pg.QueryResult> {
  return pool.query(text, params);
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_encrypted TEXT NOT NULL,
      year_group INTEGER NOT NULL,
      school_urn TEXT NOT NULL DEFAULT '13936742',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      username_updated_at TIMESTAMPTZ,
      email_updated_at TIMESTAMPTZ,
      points INTEGER NOT NULL DEFAULT 0,
      avatar INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject_name TEXT NOT NULL,
      exam_board TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'core'
    );

    CREATE TABLE IF NOT EXISTS pathways (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_opened_at TIMESTAMPTZ,
      questions TEXT,
      resume_number INTEGER,
      completed_topic_prefixes TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      topic_id TEXT NOT NULL,
      topic_desc TEXT NOT NULL DEFAULT '',
      correct INTEGER NOT NULL DEFAULT 0,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      subject TEXT NOT NULL DEFAULT '',
      quiz_session_id TEXT NOT NULL DEFAULT '',
      pathway_id INTEGER,
      marks_awarded INTEGER NOT NULL DEFAULT 0,
      marks_available INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS calendar_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      user_id INTEGER,
      username TEXT NOT NULL DEFAULT '',
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      exam_date DATE NOT NULL,
      priority TEXT NOT NULL DEFAULT 'red',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS exam_papers (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      pathway_id INTEGER,
      topic_ids TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Migrations — safe to re-run on existing installations
  try { await pool.query("ALTER TABLE exam_papers ADD COLUMN IF NOT EXISTS pathway_id INTEGER"); } catch {}
  try { await pool.query("ALTER TABLE exam_papers ADD COLUMN IF NOT EXISTS topic_ids TEXT NOT NULL DEFAULT '[]'"); } catch {}
}

export async function awardPoints(userId: number, pts: number): Promise<void> {
  if (pts > 0) {
    await pool.query("UPDATE users SET points = points + $1 WHERE id = $2", [pts, userId]);
  }
}

export async function logActivity(
  eventType: "login" | "signup" | "answer",
  userId: number,
  username: string,
): Promise<void> {
  try {
    await pool.query(
      "INSERT INTO activity_log (event_type, user_id, username) VALUES ($1, $2, $3)",
      [eventType, userId, username],
    );
  } catch {}
}
