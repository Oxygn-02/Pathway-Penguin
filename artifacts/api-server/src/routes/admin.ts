import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";

const router: IRouter = Router();

const ADMIN_PASSWORD = "princessabc123";

/* ── POST /api/admin/stats ───────────────────────────────────── */
router.post("/admin/stats", async (req: Request, res: Response) => {
  try {
    const { password } = req.body as { password: string };
    if (password !== ADMIN_PASSWORD) {
      res.status(403).json({ error: "Incorrect password." }); return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const todayLogins = parseInt(
      (await query("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='login' AND timestamp >= $1", [today])).rows[0]?.n ?? "0",
      10,
    );
    const todaySignups = parseInt(
      (await query("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='signup' AND timestamp >= $1", [today])).rows[0]?.n ?? "0",
      10,
    );
    const todayAnswers = parseInt(
      (await query("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='answer' AND timestamp >= $1", [today])).rows[0]?.n ?? "0",
      10,
    );

    const loginUsers = (await query(
      "SELECT DISTINCT username FROM activity_log WHERE event_type='login' AND timestamp >= $1 ORDER BY username",
      [today],
    )).rows.map((r: any) => r.username);

    const signupUsers = (await query(
      "SELECT DISTINCT username FROM activity_log WHERE event_type='signup' AND timestamp >= $1 ORDER BY username",
      [today],
    )).rows.map((r: any) => r.username);

    const answerUsers = (await query(
      "SELECT DISTINCT username FROM activity_log WHERE event_type='answer' AND timestamp >= $1 ORDER BY username",
      [today],
    )).rows.map((r: any) => r.username);

    const totalUsers = parseInt(
      (await query("SELECT COUNT(*) AS n FROM users")).rows[0]?.n ?? "0",
      10,
    );

    const days: Array<{ date: string; logins: number; signups: number; answers: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const nextStr = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
      const logins = parseInt((await query("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='login' AND timestamp >= $1 AND timestamp < $2", [dateStr, nextStr])).rows[0]?.n ?? "0", 10);
      const signups = parseInt((await query("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='signup' AND timestamp >= $1 AND timestamp < $2", [dateStr, nextStr])).rows[0]?.n ?? "0", 10);
      const answers = parseInt((await query("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='answer' AND timestamp >= $1 AND timestamp < $2", [dateStr, nextStr])).rows[0]?.n ?? "0", 10);
      days.push({ date: dateStr, logins, signups, answers });
    }

    res.json({
      today: { logins: todayLogins, signups: todaySignups, answers: todayAnswers },
      loginUsers,
      signupUsers,
      answerUsers,
      totalUsers,
      days,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
