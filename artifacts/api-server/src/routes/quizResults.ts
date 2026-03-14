import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── POST /api/quiz-results ───────────────────────────────────── */
router.post("/quiz-results", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { results, subject, sessionId } = req.body as {
      subject?: string;
      sessionId?: string;
      results: Array<{ topicId: string; topicDesc: string; correct: boolean }>;
    };
    if (!Array.isArray(results)) { res.status(400).json({ error: "results array required." }); return; }

    const insert = db.prepare(
      "INSERT INTO quiz_results (user_id, topic_id, topic_desc, correct, subject, quiz_session_id) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const r of results) {
      insert.run(userId, r.topicId, r.topicDesc || "", r.correct ? 1 : 0, subject || "", sessionId || "");
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/sessions?subject=X ─────────────────── */
router.get("/quiz-results/sessions", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const subject = (req.query.subject as string) || "";
    if (!subject) { res.status(400).json({ error: "subject query param required." }); return; }

    const rows = db.prepare(`
      SELECT quiz_session_id,
             COUNT(*) AS total,
             SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct_count,
             MIN(timestamp) AS completed_at
      FROM quiz_results
      WHERE user_id = ? AND subject = ? AND quiz_session_id != ''
      GROUP BY quiz_session_id
      ORDER BY completed_at DESC
    `).all(userId, subject) as any[];

    res.json({ sessions: rows.map((r) => ({
      sessionId: r.quiz_session_id,
      completedAt: r.completed_at,
      correct: r.correct_count,
      total: r.total,
      pct: Math.round((r.correct_count / r.total) * 100),
    })) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/weak?subject=X ─────────────────────── */
router.get("/quiz-results/weak", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const subject = (req.query.subject as string) || "";
    if (!subject) { res.status(400).json({ error: "subject query param required." }); return; }

    const rows = db.prepare(`
      SELECT topic_id, topic_desc,
             COUNT(*) AS total,
             SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) AS wrong_count,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS pct_correct
      FROM quiz_results
      WHERE user_id = ? AND subject = ?
      GROUP BY topic_id
      HAVING wrong_count > 0
      ORDER BY wrong_count DESC
    `).all(userId, subject) as any[];

    const weak = rows.filter((r) => r.pct_correct < 60);
    res.json({ topics: weak });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
