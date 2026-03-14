import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── POST /api/quiz-results ───────────────────────────────────── */
router.post("/quiz-results", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { results } = req.body as {
      results: Array<{ topicId: string; topicDesc: string; correct: boolean }>;
    };
    if (!Array.isArray(results)) { res.status(400).json({ error: "results array required." }); return; }

    const insert = db.prepare(
      "INSERT INTO quiz_results (user_id, topic_id, topic_desc, correct) VALUES (?, ?, ?, ?)"
    );
    for (const r of results) {
      insert.run(userId, r.topicId, r.topicDesc || "", r.correct ? 1 : 0);
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
