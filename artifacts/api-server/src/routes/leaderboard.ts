import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { serverError } from "../lib/http.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

export const LEADERBOARD_TOP_N = 5;

/* ── GET /api/leaderboard?scope=school|year ───────────────────────
   Returns only the top few students plus the caller's own place, so a
   student never sees a ranked list of everyone (they are under 18).
   scope=year limits the board to the caller's own year group. */
router.get("/leaderboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const scope = req.query.scope === "year" ? "year" : "school";

    const meRow = (await query("SELECT id, username, points, avatar, year_group, created_at FROM users WHERE id = $1", [userId])).rows[0];
    if (!meRow) { res.status(401).json({ error: "Not signed in." }); return; }

    const where = scope === "year" ? "WHERE year_group = $1" : "WHERE $1::int IS NOT NULL";
    const param = scope === "year" ? meRow.year_group : 0;

    const top = await query(
      `SELECT id, username, points, avatar FROM users ${where} ORDER BY points DESC, created_at ASC LIMIT ${LEADERBOARD_TOP_N}`,
      [param],
    );
    const ahead = await query(
      `SELECT COUNT(*) AS n FROM users ${scope === "year" ? "WHERE year_group = $1 AND" : "WHERE $1::int IS NOT NULL AND"}
         (points > $2 OR (points = $2 AND created_at < $3))`,
      [param, meRow.points ?? 0, meRow.created_at],
    );

    const toEntry = (r: any, position: number) => ({
      position,
      userId: r.id,
      username: r.username,
      points: r.points ?? 0,
      avatar: r.avatar ?? 1,
    });

    res.json({
      scope,
      leaderboard: top.rows.map((r, i) => toEntry(r, i + 1)),
      me: toEntry(meRow, parseInt(ahead.rows[0].n, 10) + 1),
    });
  } catch (e: any) {
    serverError(res, e, "leaderboard");
  }
});

export default router;
