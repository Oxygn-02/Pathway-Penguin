import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/calendar ────────────────────────────────────────── */
router.get("/calendar", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const result = await query(
      "SELECT id, subject, day_of_week, duration_minutes FROM calendar_entries WHERE user_id = $1 ORDER BY day_of_week, id",
      [userId],
    );
    res.json({ entries: result.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/calendar ───────────────────────────────────────── */
router.post("/calendar", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { subject, dayOfWeek, durationMinutes } = req.body as {
      subject: string; dayOfWeek: number; durationMinutes: number;
    };
    if (!subject || dayOfWeek === undefined || !durationMinutes) {
      res.status(400).json({ error: "subject, dayOfWeek, durationMinutes required." }); return;
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) { res.status(400).json({ error: "dayOfWeek must be 0-6." }); return; }
    const VALID_DURATIONS = [30, 60, 90, 120];
    if (!VALID_DURATIONS.includes(durationMinutes)) {
      res.status(400).json({ error: "durationMinutes must be 30, 60, 90, or 120." }); return;
    }

    const result = await query(
      "INSERT INTO calendar_entries (user_id, subject, day_of_week, duration_minutes) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, subject, dayOfWeek, durationMinutes],
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DELETE /api/calendar/:id ─────────────────────────────────── */
router.delete("/calendar/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { id } = req.params;
    const result = await query(
      "DELETE FROM calendar_entries WHERE id = $1 AND user_id = $2",
      [Number(id), userId],
    );
    if ((result.rowCount ?? 0) === 0) { res.status(404).json({ error: "Entry not found." }); return; }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
