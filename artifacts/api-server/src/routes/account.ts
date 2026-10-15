import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { query, withTransaction } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { decryptEmail } from "../lib/emailCrypto.js";
import { serverError } from "../lib/http.js";
import { createLockout } from "../lib/lockout.js";

const router: IRouter = Router();

// Deleting is irreversible, so guard the password prompt against guessing too.
const deleteAttempts = createLockout(5, 15 * 60 * 1000);

/* ── GET /api/account/export — everything we hold about the signed-in user ── */
router.get("/account/export", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const u = (await query(
      "SELECT id, username, year_group, school_urn, email_encrypted, created_at, points, avatar FROM users WHERE id = $1",
      [userId],
    )).rows[0];
    if (!u) { res.status(404).json({ error: "Account not found." }); return; }

    let email = "";
    try { email = decryptEmail(u.email_encrypted); } catch {}

    const rows = async (sql: string) => (await query(sql, [userId])).rows;
    const data = {
      exportedAt: new Date().toISOString(),
      profile: { id: u.id, username: u.username, email, yearGroup: u.year_group, schoolUrn: u.school_urn, createdAt: u.created_at, points: u.points, avatar: u.avatar },
      subjects: await rows("SELECT subject_name, exam_board, tier FROM subjects WHERE user_id = $1"),
      pathways: await rows("SELECT id, subject, content, pathway_number, created_at, last_opened_at, questions, completed_topic_prefixes FROM pathways WHERE user_id = $1"),
      quizResults: await rows("SELECT topic_id, topic_desc, correct, marks_awarded, marks_available, subject, quiz_session_id, pathway_id, timestamp FROM quiz_results WHERE user_id = $1"),
      calendar: await rows("SELECT subject, day_of_week, duration_minutes FROM calendar_entries WHERE user_id = $1"),
      exams: await rows("SELECT id, subject, exam_date, priority, created_at FROM exams WHERE user_id = $1"),
      examPapers: await rows("SELECT exam_id, name, pathway_id, topic_ids, created_at FROM exam_papers WHERE user_id = $1"),
      sources: await rows("SELECT pathway_id, name, content, source_type, original_filename, page_count, created_at FROM pathway_sources WHERE user_id = $1"),
      sourceQuizzes: await rows("SELECT pathway_id, name, source_ids, questions, created_at FROM source_quizzes WHERE user_id = $1"),
      activity: await rows("SELECT event_type, timestamp FROM activity_log WHERE user_id = $1"),
      aiUsage: await rows("SELECT timestamp, ai_provider, input_tokens, output_tokens, stage FROM ai_usage_log WHERE user_id = $1"),
    };
    res.setHeader("Content-Disposition", 'attachment; filename="pathway-penguin-my-data.json"');
    res.json(data);
  } catch (e) {
    serverError(res, e, "account export");
  }
});

/* ── DELETE /api/account — permanently delete the account and all its data ── */
router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const key = `del:${userId}`;
    if (deleteAttempts.retryAfter(key) > 0) {
      res.status(429).json({ error: "Too many attempts. Please wait a few minutes." }); return;
    }

    const password = (req.body as { password?: unknown } | undefined)?.password;
    if (typeof password !== "string" || !password) { res.status(400).json({ error: "Please enter your password to confirm." }); return; }

    const u = (await query("SELECT password_hash FROM users WHERE id = $1", [userId])).rows[0];
    if (!u) { res.status(404).json({ error: "Account not found." }); return; }
    if (!(await bcrypt.compare(password, u.password_hash))) {
      deleteAttempts.fail(key);
      res.status(403).json({ error: "Incorrect password." }); return;
    }

    await withTransaction(async (q) => {
      // Tables whose foreign key to users has no ON DELETE CASCADE are cleared first.
      await q("DELETE FROM quiz_results WHERE user_id = $1", [userId]);
      await q("DELETE FROM calendar_entries WHERE user_id = $1", [userId]);
      await q("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
      await q("DELETE FROM exams WHERE user_id = $1", [userId]);      // exam_papers cascade from exams
      await q("DELETE FROM exam_papers WHERE user_id = $1", [userId]);
      await q("DELETE FROM pathways WHERE user_id = $1", [userId]);   // sources + source quizzes cascade
      await q("DELETE FROM subjects WHERE user_id = $1", [userId]);
      await q("DELETE FROM activity_log WHERE user_id = $1", [userId]);
      await q("DELETE FROM users WHERE id = $1", [userId]);           // sessions + ai_usage_log cascade
    });

    deleteAttempts.reset(key);
    res.clearCookie("pp_session", { path: "/" });
    res.json({ ok: true });
  } catch (e) {
    serverError(res, e, "account delete");
  }
});

export default router;
