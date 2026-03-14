import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── POST /api/quiz-results ───────────────────────────────────── */
router.post("/quiz-results", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { results, subject } = req.body as {
      subject?: string;
      results: Array<{ topicId: string; topicDesc: string; correct: boolean }>;
    };
    if (!Array.isArray(results)) { res.status(400).json({ error: "results array required." }); return; }

    const insert = db.prepare(
      "INSERT INTO quiz_results (user_id, topic_id, topic_desc, correct, subject) VALUES (?, ?, ?, ?, ?)"
    );
    for (const r of results) {
      insert.run(userId, r.topicId, r.topicDesc || "", r.correct ? 1 : 0, subject || "");
    }
    res.json({ ok: true });
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

    // Weak = less than 60% correct
    const weak = rows.filter((r) => r.pct_correct < 60);
    res.json({ topics: weak });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
