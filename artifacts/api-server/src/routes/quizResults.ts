import { Router, type IRouter, Request, Response } from "express";
import { db, awardPoints } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── POST /api/quiz-results ───────────────────────────────────── */
router.post("/quiz-results", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { results, subject, sessionId, pathwayId } = req.body as {
      subject?: string;
      sessionId?: string;
      pathwayId?: number | null;
      results: Array<{ topicId: string; topicDesc: string; correct: boolean; marksAwarded?: number; marksAvailable?: number }>;
    };
    if (!Array.isArray(results)) { res.status(400).json({ error: "results array required." }); return; }

    const insert = db.prepare(
      "INSERT INTO quiz_results (user_id, topic_id, topic_desc, correct, subject, quiz_session_id, pathway_id, marks_awarded, marks_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    let pts = 0;
    for (const r of results) {
      const ma = typeof r.marksAwarded === "number" ? r.marksAwarded : (r.correct ? 1 : 0);
      const mv = typeof r.marksAvailable === "number" ? r.marksAvailable : 1;
      insert.run(userId, r.topicId, r.topicDesc || "", r.correct ? 1 : 0, subject || "", sessionId || "", pathwayId ?? null, ma, mv);
      pts += 5;
      if (r.correct) pts += 10;
    }
    awardPoints(userId, pts);
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

    // Find most recent session ID for this subject
    const recentSessionRow = db.prepare(`
      SELECT quiz_session_id
      FROM quiz_results
      WHERE user_id = ? AND subject = ? AND quiz_session_id != ''
      GROUP BY quiz_session_id
      ORDER BY MIN(timestamp) DESC
      LIMIT 1
    `).get(userId, subject) as any;

    const recentSessionId = recentSessionRow?.quiz_session_id || "";

    // Per-topic stats from the most recent session only
    const recentStats: any[] = recentSessionId ? (db.prepare(`
      SELECT topic_id,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS recent_pct
      FROM quiz_results
      WHERE user_id = ? AND subject = ? AND quiz_session_id = ?
      GROUP BY topic_id
    `).all(userId, subject, recentSessionId) as any[]) : [];

    const recentMap: Record<string, number> = Object.fromEntries(
      recentStats.map((r) => [r.topic_id, r.recent_pct])
    );

    // Overall per-topic stats, ordered worst → best
    const rows = db.prepare(`
      SELECT topic_id, topic_desc,
             COUNT(*) AS total,
             SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) AS wrong_count,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS pct_correct
      FROM quiz_results
      WHERE user_id = ? AND subject = ?
      GROUP BY topic_id
      HAVING wrong_count > 0
      ORDER BY pct_correct ASC
    `).all(userId, subject) as any[];

    const weak = rows
      .filter((r) => r.pct_correct < 60)
      .filter((r) => {
        // Remove topics the student just got 100% on in their most recent session
        const rp = recentMap[r.topic_id];
        return rp === undefined || rp < 100;
      })
      .map((r) => {
        const recentPct = recentMap[r.topic_id] ?? null;
        return {
          ...r,
          recent_pct: recentPct,
          // improving = they did better in the latest session than their overall average
          improving: recentPct !== null && recentPct > r.pct_correct,
        };
      });

    res.json({ topics: weak });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/best?subject=X ──────────────────────── */
router.get("/quiz-results/best", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const subject = (req.query.subject as string) || "";
    if (!subject) { res.status(400).json({ error: "subject query param required." }); return; }

    const rows = db.prepare(`
      SELECT topic_id, topic_desc,
             COUNT(*) AS total,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS pct_correct
      FROM quiz_results
      WHERE user_id = ? AND subject = ?
      GROUP BY topic_id
      HAVING pct_correct >= 60
      ORDER BY pct_correct DESC
    `).all(userId, subject) as any[];

    res.json({ topics: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/pathway/:id ────────────────────────── */
router.get("/quiz-results/pathway/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const pathwayId = Number(req.params.id);
    const rows = db.prepare(`
      SELECT topic_id,
             SUM(marks_awarded) AS marks_awarded,
             SUM(marks_available) AS marks_available,
             COUNT(*) AS attempts
      FROM quiz_results
      WHERE user_id = ? AND pathway_id = ?
      GROUP BY topic_id
    `).all(userId, pathwayId) as any[];

    const byTopic: Record<string, { marksAwarded: number; marksAvailable: number; attempts: number }> = {};
    for (const r of rows) {
      byTopic[r.topic_id] = { marksAwarded: r.marks_awarded, marksAvailable: r.marks_available, attempts: r.attempts };
    }
    res.json({ byTopic });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
