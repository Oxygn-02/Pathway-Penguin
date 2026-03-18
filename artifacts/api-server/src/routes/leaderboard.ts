import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/leaderboard ─────────────────────────────────────── */
router.get("/leaderboard", requireAuth, (req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      "SELECT id, username, points FROM users ORDER BY points DESC, created_at ASC"
    ).all() as any[];

    const leaderboard = rows.map((r, i) => ({
      position: i + 1,
      userId: r.id,
      username: r.username,
      points: r.points ?? 0,
    }));

    res.json({ leaderboard });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
