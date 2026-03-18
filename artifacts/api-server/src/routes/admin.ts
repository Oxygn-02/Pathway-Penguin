import { Router, type IRouter, Request, Response } from "express";
import { db } from "../db.js";

const router: IRouter = Router();

const ADMIN_PASSWORD = "princessabc123";

/* ── POST /api/admin/stats ───────────────────────────────────── */
router.post("/admin/stats", (req: Request, res: Response) => {
  try {
    const { password } = req.body as { password: string };
    if (password !== ADMIN_PASSWORD) {
      res.status(403).json({ error: "Incorrect password." }); return;
    }

    // Today's date in SQLite format (UTC date prefix)
    const today = new Date().toISOString().slice(0, 10);

    // Counts for today
    const todayLogins = (db.prepare(
      "SELECT COUNT(*) AS n FROM activity_log WHERE event_type='login' AND timestamp >= ?"
    ).get(today) as any)?.n ?? 0;

    const todaySignups = (db.prepare(
      "SELECT COUNT(*) AS n FROM activity_log WHERE event_type='signup' AND timestamp >= ?"
    ).get(today) as any)?.n ?? 0;

    const todayAnswers = (db.prepare(
      "SELECT COUNT(*) AS n FROM activity_log WHERE event_type='answer' AND timestamp >= ?"
    ).get(today) as any)?.n ?? 0;

    // Unique usernames for today
    const loginUsers = (db.prepare(
      "SELECT DISTINCT username FROM activity_log WHERE event_type='login' AND timestamp >= ? ORDER BY username"
    ).all(today) as any[]).map((r: any) => r.username);

    const signupUsers = (db.prepare(
      "SELECT DISTINCT username FROM activity_log WHERE event_type='signup' AND timestamp >= ? ORDER BY username"
    ).all(today) as any[]).map((r: any) => r.username);

    const answerUsers = (db.prepare(
      "SELECT DISTINCT username FROM activity_log WHERE event_type='answer' AND timestamp >= ? ORDER BY username"
    ).all(today) as any[]).map((r: any) => r.username);

    // Total user count
    const totalUsers = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as any)?.n ?? 0;

    // Last 14 days breakdown for graph
    const days: Array<{ date: string; logins: number; signups: number; answers: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const nextStr = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
      const logins = (db.prepare("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='login' AND timestamp >= ? AND timestamp < ?").get(dateStr, nextStr) as any)?.n ?? 0;
      const signups = (db.prepare("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='signup' AND timestamp >= ? AND timestamp < ?").get(dateStr, nextStr) as any)?.n ?? 0;
      const answers = (db.prepare("SELECT COUNT(*) AS n FROM activity_log WHERE event_type='answer' AND timestamp >= ? AND timestamp < ?").get(dateStr, nextStr) as any)?.n ?? 0;
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
