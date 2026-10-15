import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Set DATABASE_SSL_STRICT=true once the database's certificate chain is trusted,
  // to verify the server certificate instead of only encrypting the connection.
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true" }
    : false,
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

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
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
      pathway_number INTEGER,
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

    CREATE TABLE IF NOT EXISTS pathway_sources (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pathway_id INTEGER NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_usage_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ai_provider TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'unknown'
    );
  `);
  // Migrations — safe to re-run on existing installations
  try { await pool.query("CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)"); } catch {}
  try { await pool.query("ALTER TABLE exam_papers ADD COLUMN IF NOT EXISTS pathway_id INTEGER"); } catch {}
  try { await pool.query("ALTER TABLE exam_papers ADD COLUMN IF NOT EXISTS topic_ids TEXT NOT NULL DEFAULT '[]'"); } catch {}
  try { await pool.query("CREATE INDEX IF NOT EXISTS pathway_sources_pathway_idx ON pathway_sources(pathway_id, user_id)"); } catch {}
  try { await pool.query("ALTER TABLE pathway_sources ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'text'"); } catch {}
  try { await pool.query("ALTER TABLE pathway_sources ADD COLUMN IF NOT EXISTS original_filename TEXT"); } catch {}
  try { await pool.query("ALTER TABLE pathway_sources ADD COLUMN IF NOT EXISTS page_count INTEGER"); } catch {}
  try { await pool.query("ALTER TABLE pathway_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"); } catch {}
  try { await pool.query("UPDATE subjects SET exam_board = 'AQA' WHERE subject_name = 'Computer Science' AND exam_board = 'OCR'"); } catch {}
  try { await pool.query("CREATE INDEX IF NOT EXISTS ai_usage_log_user_ts_idx ON ai_usage_log(user_id, timestamp)"); } catch {}
  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS source_quizzes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pathway_id INTEGER NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      source_ids JSONB NOT NULL DEFAULT '[]',
      questions JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `); } catch {}
  try { await pool.query("CREATE INDEX IF NOT EXISTS source_quizzes_user_pathway_idx ON source_quizzes(user_id, pathway_id)"); } catch {}
  try { await pool.query("ALTER TABLE pathways ADD COLUMN IF NOT EXISTS pathway_number INTEGER"); } catch {}
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
