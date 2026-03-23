import { Router, type IRouter, Request, Response } from "express";
import { query, awardPoints, logActivity } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── POST /api/quiz-results ───────────────────────────────────── */
router.post("/quiz-results", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, username } = (req as any).user as AuthUser;
    const { results, subject, sessionId, pathwayId } = req.body as {
      subject?: string;
      sessionId?: string;
      pathwayId?: number | null;
      results: Array<{ topicId: string; topicDesc: string; correct: boolean; marksAwarded?: number; marksAvailable?: number }>;
    };
    if (!Array.isArray(results)) { res.status(400).json({ error: "results array required." }); return; }

    let pts = 0;
    for (const r of results) {
      const ma = typeof r.marksAwarded === "number" ? r.marksAwarded : (r.correct ? 1 : 0);
      const mv = typeof r.marksAvailable === "number" ? r.marksAvailable : 1;
      await query(
        "INSERT INTO quiz_results (user_id, topic_id, topic_desc, correct, subject, quiz_session_id, pathway_id, marks_awarded, marks_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [userId, r.topicId, r.topicDesc || "", r.correct ? 1 : 0, subject || "", sessionId || "", pathwayId ?? null, ma, mv],
      );
      pts += 5;
      if (r.correct) pts += 10;
    }
    await awardPoints(userId, pts);
    if (results.length > 0) await logActivity("answer", userId, username);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/sessions?subject=X ─────────────────── */
router.get("/quiz-results/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const subject = (req.query.subject as string) || "";
    if (!subject) { res.status(400).json({ error: "subject query param required." }); return; }

    const result = await query(`
      SELECT quiz_session_id,
             COUNT(*) AS total,
             SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct_count,
             MIN(timestamp) AS completed_at,
             STRING_AGG(DISTINCT topic_id, ',') AS topic_ids
      FROM quiz_results
      WHERE user_id = $1 AND subject = $2 AND quiz_session_id != ''
      GROUP BY quiz_session_id
      ORDER BY completed_at DESC
    `, [userId, subject]);

    res.json({ sessions: result.rows.map((r) => ({
      sessionId: r.quiz_session_id,
      completedAt: r.completed_at,
      correct: parseInt(r.correct_count, 10),
      total: parseInt(r.total, 10),
      pct: Math.round((parseInt(r.correct_count, 10) / parseInt(r.total, 10)) * 100),
      topicIds: r.topic_ids ? r.topic_ids.split(",").sort((a: string, b: string) => {
        const [aM, aN] = a.split(".").map(Number);
        const [bM, bN] = b.split(".").map(Number);
        return aM !== bM ? aM - bM : aN - bN;
      }) : [],
    })) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/weak?subject=X ─────────────────────── */
router.get("/quiz-results/weak", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const subject = (req.query.subject as string) || "";
    if (!subject) { res.status(400).json({ error: "subject query param required." }); return; }

    const recentSessionResult = await query(`
      SELECT quiz_session_id
      FROM quiz_results
      WHERE user_id = $1 AND subject = $2 AND quiz_session_id != ''
      GROUP BY quiz_session_id
      ORDER BY MIN(timestamp) DESC
      LIMIT 1
    `, [userId, subject]);
    const recentSessionId = recentSessionResult.rows[0]?.quiz_session_id || "";

    const recentStats: any[] = recentSessionId ? (await query(`
      SELECT topic_id,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS recent_pct
      FROM quiz_results
      WHERE user_id = $1 AND subject = $2 AND quiz_session_id = $3
      GROUP BY topic_id
    `, [userId, subject, recentSessionId])).rows : [];

    const recentMap: Record<string, number> = Object.fromEntries(
      recentStats.map((r) => [r.topic_id, parseFloat(r.recent_pct)]),
    );

    const rowsResult = await query(`
      SELECT topic_id, topic_desc,
             COUNT(*) AS total,
             SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) AS wrong_count,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS pct_correct
      FROM quiz_results
      WHERE user_id = $1 AND subject = $2
      GROUP BY topic_id, topic_desc
      HAVING SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) > 0
      ORDER BY pct_correct ASC
    `, [userId, subject]);

    const weak = rowsResult.rows
      .map((r) => ({ ...r, pct_correct: parseFloat(r.pct_correct), wrong_count: parseInt(r.wrong_count, 10), total: parseInt(r.total, 10) }))
      .filter((r) => r.pct_correct < 60)
      .filter((r) => {
        const rp = recentMap[r.topic_id];
        return rp === undefined || rp < 100;
      })
      .map((r) => {
        const recentPct = recentMap[r.topic_id] ?? null;
        return { ...r, recent_pct: recentPct, improving: recentPct !== null && recentPct > r.pct_correct };
      });

    res.json({ topics: weak });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/best?subject=X ──────────────────────── */
router.get("/quiz-results/best", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const subject = (req.query.subject as string) || "";
    if (!subject) { res.status(400).json({ error: "subject query param required." }); return; }

    const result = await query(`
      SELECT topic_id, topic_desc,
             COUNT(*) AS total,
             ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS pct_correct
      FROM quiz_results
      WHERE user_id = $1 AND subject = $2
      GROUP BY topic_id, topic_desc
      HAVING ROUND(SUM(CASE WHEN correct = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) >= 60
      ORDER BY pct_correct DESC
    `, [userId, subject]);

    res.json({ topics: result.rows.map((r) => ({ ...r, pct_correct: parseFloat(r.pct_correct), total: parseInt(r.total, 10) })) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/quiz-results/pathway/:id ────────────────────────── */
router.get("/quiz-results/pathway/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const pathwayId = Number(req.params.id);
    const result = await query(`
      SELECT topic_id,
             SUM(marks_awarded) AS marks_awarded,
             SUM(marks_available) AS marks_available,
             COUNT(*) AS attempts
      FROM quiz_results
      WHERE user_id = $1 AND pathway_id = $2
      GROUP BY topic_id
    `, [userId, pathwayId]);

    const byTopic: Record<string, { marksAwarded: number; marksAvailable: number; attempts: number }> = {};
    for (const r of result.rows) {
      byTopic[r.topic_id] = {
        marksAwarded: parseInt(r.marks_awarded, 10),
        marksAvailable: parseInt(r.marks_available, 10),
        attempts: parseInt(r.attempts, 10),
      };
    }
    res.json({ byTopic });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
