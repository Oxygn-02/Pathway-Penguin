import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { serverError } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

/* ── GET /api/leaderboard ─────────────────────────────────────── */
router.get("/leaderboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, username, points, avatar FROM users ORDER BY points DESC, created_at ASC",
    );

    const leaderboard = result.rows.map((r, i) => ({
      position: i + 1,
      userId: r.id,
      username: r.username,
      points: r.points ?? 0,
      avatar: r.avatar ?? 1,
    }));

    res.json({ leaderboard });
  } catch (e: any) {
    serverError(res, e, "leaderboard");
  }
});

export default router;
