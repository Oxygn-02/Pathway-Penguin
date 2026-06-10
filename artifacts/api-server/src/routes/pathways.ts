import { Router, type IRouter, Request, Response } from "express";
import { query, awardPoints } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/pathways — return all saved pathways ────────────── */
router.get("/pathways", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const rowsResult = await query(
      `SELECT p.id, p.subject, p.content, p.pathway_number, p.questions, p.created_at, p.last_opened_at,
              p.resume_number, p.completed_topic_prefixes, s.exam_board
       FROM pathways p
       LEFT JOIN subjects s ON s.subject_name = p.subject AND s.user_id = p.user_id
       WHERE p.user_id = $1
       ORDER BY COALESCE(p.last_opened_at, p.created_at) DESC`,
      [userId],
    );
    const rows = rowsResult.rows;

    const pathways = await Promise.all(rows.map(async (r) => {
      const scoreResult = await query(`
        SELECT correct_count, total FROM (
          SELECT SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct_count,
                 COUNT(*) AS total,
                 MIN(timestamp) AS completed_at
          FROM quiz_results
          WHERE user_id = $1 AND subject = $2 AND quiz_session_id != ''
          GROUP BY quiz_session_id
          ORDER BY completed_at DESC
          LIMIT 1
        ) sub
      `, [userId, r.subject]);
      const score = scoreResult.rows[0];

      const completedResult = await query(
        "SELECT COUNT(DISTINCT topic_id) AS n FROM quiz_results WHERE user_id = $1 AND pathway_id = $2",
        [userId, r.id],
      );
      const completedTopics = parseInt(completedResult.rows[0]?.n ?? "0", 10);

      return {
        id: r.id,
        subject: r.subject,
        topics: JSON.parse(r.content),
        pathwayNumber: r.pathway_number ?? null,
        questions: r.questions ? JSON.parse(r.questions) : null,
        createdAt: r.created_at,
        lastOpenedAt: r.last_opened_at || null,
        recentScore: score ? { correct: parseInt(score.correct_count, 10), total: parseInt(score.total, 10) } : null,
        completedTopics,
        resumeNumber: r.resume_number ?? null,
        completedTopicPrefixes: (() => { try { return JSON.parse(r.completed_topic_prefixes || "[]"); } catch { return []; } })(),
        examBoard: r.exam_board ?? null,
      };
    }));

    res.json({ pathways });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/open — mark pathway as opened ───── */
router.patch("/pathways/:id/open", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    await query(
      "UPDATE pathways SET last_opened_at = NOW() WHERE id = $1 AND user_id = $2",
      [Number(id), userId],
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/questions — cache generated questions */
router.patch("/pathways/:id/questions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const { questions } = req.body as { questions: any[] | null };
    if (questions !== null && !Array.isArray(questions)) {
      res.status(400).json({ error: "questions must be an array or null." }); return;
    }
    await query(
      "UPDATE pathways SET questions = $1 WHERE id = $2 AND user_id = $3",
      [questions !== null ? JSON.stringify(questions) : null, Number(id), userId],
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/resume — persist last-known question number */
router.patch("/pathways/:id/resume", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const { resumeNumber } = req.body as { resumeNumber: number };
    if (typeof resumeNumber !== "number") { res.status(400).json({ error: "resumeNumber required." }); return; }
    await query(
      "UPDATE pathways SET resume_number = $1 WHERE id = $2 AND user_id = $3",
      [resumeNumber, Number(id), userId],
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/complete-topic — mark a topic prefix as mastered */
router.patch("/pathways/:id/complete-topic", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const { prefix } = req.body as { prefix: string };
    if (!prefix) { res.status(400).json({ error: "prefix required." }); return; }
    const pathwayResult = await query(
      "SELECT completed_topic_prefixes, questions FROM pathways WHERE id = $1 AND user_id = $2",
      [Number(id), userId],
    );
    const pathway = pathwayResult.rows[0];
    if (!pathway) { res.status(404).json({ error: "Not found." }); return; }
    const existing: string[] = (() => { try { return JSON.parse(pathway.completed_topic_prefixes || "[]"); } catch { return []; } })();
    const updated = existing.includes(prefix) ? existing : [...existing, prefix];
    const questions: any[] = (() => { try { return JSON.parse(pathway.questions || "[]"); } catch { return []; } })();
    const prunedQuestions = questions.filter((q: any) => {
      const qPrefix = q.topicId ? String(q.topicId).split(".")[0] : null;
      return qPrefix !== prefix;
    });
    await query(
      "UPDATE pathways SET completed_topic_prefixes = $1, questions = $2 WHERE id = $3 AND user_id = $4",
      [JSON.stringify(updated), JSON.stringify(prunedQuestions), Number(id), userId],
    );
    res.json({ ok: true, completedTopicPrefixes: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DELETE /api/pathways/:id ─────────────────────────────────── */
router.delete("/pathways/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const pathwayId = Number(id);
    await query(
      "DELETE FROM quiz_results WHERE pathway_id = $1 AND user_id = $2",
      [pathwayId, userId],
    );
    await query(
      "DELETE FROM pathways WHERE id = $1 AND user_id = $2",
      [pathwayId, userId],
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/pathways — save a new pathway (keeps history) ──── */
router.post("/pathways", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { subject, topics, pathwayNumber } = req.body as { subject: string; topics: any[]; pathwayNumber?: number | null };
    if (!subject || !Array.isArray(topics)) {
      res.status(400).json({ error: "subject and topics required." }); return;
    }
    const result = await query(
      "INSERT INTO pathways (user_id, subject, content, pathway_number) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, subject, JSON.stringify(topics), pathwayNumber != null ? pathwayNumber : null],
    );
    await awardPoints(userId, 1);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
