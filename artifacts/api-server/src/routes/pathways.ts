import { Router, type IRouter, Request, Response } from "express";
import { db, awardPoints } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/pathways — return all saved pathways ────────────── */
router.get("/pathways", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const rows = db.prepare(
      "SELECT id, subject, content, questions, created_at, last_opened_at, resume_number, completed_topic_prefixes FROM pathways WHERE user_id = ? ORDER BY COALESCE(last_opened_at, created_at) DESC"
    ).all(userId) as any[];

    const recentScore = db.prepare(`
      SELECT correct_count, total FROM (
        SELECT SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct_count,
               COUNT(*) AS total,
               MIN(timestamp) AS completed_at
        FROM quiz_results
        WHERE user_id = ? AND subject = ? AND quiz_session_id != ''
        GROUP BY quiz_session_id
        ORDER BY completed_at DESC
        LIMIT 1
      )
    `);

    // Count completed topics per pathway — scoped to pathway_id so re-uploads start at 0
    const completedCountStmt = db.prepare(
      "SELECT COUNT(DISTINCT topic_id) AS n FROM quiz_results WHERE user_id = ? AND pathway_id = ?"
    );

    const pathways = rows.map((r) => {
      const score = recentScore.get(userId, r.subject) as any;
      const topics = JSON.parse(r.content);
      const completedTopics = (completedCountStmt.get(userId, r.id) as any)?.n ?? 0;
      return {
        id: r.id,
        subject: r.subject,
        topics,
        questions: r.questions ? JSON.parse(r.questions) : null,
        createdAt: r.created_at,
        lastOpenedAt: r.last_opened_at || null,
        recentScore: score ? { correct: score.correct_count, total: score.total } : null,
        completedTopics,
        resumeNumber: r.resume_number ?? null,
        completedTopicPrefixes: (() => { try { return JSON.parse(r.completed_topic_prefixes || "[]"); } catch { return []; } })(),
      };
    });
    res.json({ pathways });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/open — mark pathway as opened ───── */
router.patch("/pathways/:id/open", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    db.prepare(
      "UPDATE pathways SET last_opened_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(Number(id), userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/questions — cache generated questions */
router.patch("/pathways/:id/questions", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const { questions } = req.body as { questions: any[] };
    if (!Array.isArray(questions)) {
      res.status(400).json({ error: "questions must be an array." }); return;
    }
    db.prepare(
      "UPDATE pathways SET questions = ? WHERE id = ? AND user_id = ?"
    ).run(JSON.stringify(questions), Number(id), userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/resume — persist last-known question number */
router.patch("/pathways/:id/resume", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const { resumeNumber } = req.body as { resumeNumber: number };
    if (typeof resumeNumber !== "number") { res.status(400).json({ error: "resumeNumber required." }); return; }
    db.prepare("UPDATE pathways SET resume_number = ? WHERE id = ? AND user_id = ?")
      .run(resumeNumber, Number(id), userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/pathways/:id/complete-topic — mark a topic prefix as mastered */
router.patch("/pathways/:id/complete-topic", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const { prefix } = req.body as { prefix: string };
    if (!prefix) { res.status(400).json({ error: "prefix required." }); return; }
    const pathway = db.prepare("SELECT completed_topic_prefixes, questions FROM pathways WHERE id = ? AND user_id = ?")
      .get(Number(id), userId) as any;
    if (!pathway) { res.status(404).json({ error: "Not found." }); return; }
    // Update completed prefix list
    const existing: string[] = (() => { try { return JSON.parse(pathway.completed_topic_prefixes || "[]"); } catch { return []; } })();
    const updated = existing.includes(prefix) ? existing : [...existing, prefix];
    // Wipe cached questions for this prefix so fresh ones are generated next time
    const questions: any[] = (() => { try { return JSON.parse(pathway.questions || "[]"); } catch { return []; } })();
    const prunedQuestions = questions.filter((q: any) => {
      const qPrefix = q.topicId ? String(q.topicId).split(".")[0] : null;
      return qPrefix !== prefix;
    });
    db.prepare("UPDATE pathways SET completed_topic_prefixes = ?, questions = ? WHERE id = ? AND user_id = ?")
      .run(JSON.stringify(updated), JSON.stringify(prunedQuestions), Number(id), userId);
    res.json({ ok: true, completedTopicPrefixes: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DELETE /api/pathways/:id ─────────────────────────────────── */
router.delete("/pathways/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const pathwayId = Number(id);
    // Delete quiz results tied to this specific pathway (resets completion %)
    // Results with no pathway_id (old sessions) are left intact for areas-to-work-on history
    db.prepare("DELETE FROM quiz_results WHERE pathway_id = ? AND user_id = ?").run(pathwayId, userId);
    db.prepare("DELETE FROM pathways WHERE id = ? AND user_id = ?").run(pathwayId, userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/pathways — save a new pathway (keeps history) ──── */
router.post("/pathways", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { subject, topics } = req.body as { subject: string; topics: any[] };
    if (!subject || !Array.isArray(topics)) {
      res.status(400).json({ error: "subject and topics required." }); return;
    }
    const result = db.prepare(
      "INSERT INTO pathways (user_id, subject, content) VALUES (?, ?, ?)"
    ).run(userId, subject, JSON.stringify(topics));
    awardPoints(userId, 1);
    res.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
