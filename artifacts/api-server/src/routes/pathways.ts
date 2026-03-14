import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/pathways — return all saved pathways ────────────── */
router.get("/pathways", requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const rows = db.prepare(
      "SELECT id, subject, content, created_at FROM pathways WHERE user_id = ? ORDER BY created_at DESC"
    ).all(userId) as any[];
    const pathways = rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      topics: JSON.parse(r.content),
      createdAt: r.created_at,
    }));
    res.json({ pathways });
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
