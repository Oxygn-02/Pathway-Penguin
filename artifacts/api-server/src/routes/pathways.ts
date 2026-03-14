import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/pathways — return all saved pathways ────────────── */
router.get("/pathways", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const rows = db.prepare(
      "SELECT id, subject, content, created_at, last_opened_at FROM pathways WHERE user_id = ? ORDER BY COALESCE(last_opened_at, created_at) DESC"
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

    const pathways = rows.map((r) => {
      const score = recentScore.get(userId, r.subject) as any;
      return {
        id: r.id,
        subject: r.subject,
        topics: JSON.parse(r.content),
        createdAt: r.created_at,
        lastOpenedAt: r.last_opened_at || null,
        recentScore: score ? { correct: score.correct_count, total: score.total } : null,
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
    res.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
