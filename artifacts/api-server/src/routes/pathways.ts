import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/pathways — load saved pathway ───────────────────── */
router.get("/pathways", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const row = db.prepare(
      "SELECT id, subject, content, created_at FROM pathways WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(userId) as any;
    if (!row) { res.json({ pathway: null }); return; }
    res.json({ pathway: { id: row.id, subject: row.subject, content: JSON.parse(row.content), createdAt: row.created_at } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/pathways — save pathway ────────────────────────── */
router.post("/pathways", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { subject, topics } = req.body as { subject: string; topics: any[] };
    if (!subject || !Array.isArray(topics)) { res.status(400).json({ error: "subject and topics required." }); return; }

    // Replace existing pathway for this user
    db.prepare("DELETE FROM pathways WHERE user_id = ?").run(userId);
    const result = db.prepare(
      "INSERT INTO pathways (user_id, subject, content) VALUES (?, ?, ?)"
    ).run(userId, subject, JSON.stringify(topics));

    res.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
