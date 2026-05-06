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

// ── Pricing constants (USD per 1 million tokens) ──────────────────────────────
// Sources: Google AI pricing (May 2025), Anthropic pricing (May 2025).
// Update these when pricing changes.
const PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  "claude":              { inputPerM: 3.00,  outputPerM: 15.00  }, // Claude Sonnet (legacy label)
  "claude-sonnet-4-6":   { inputPerM: 3.00,  outputPerM: 15.00  },
  "gemini":              { inputPerM: 0.15,  outputPerM: 0.60   }, // gemini-2.5-flash (legacy label)
  "gemini-2.5-flash":    { inputPerM: 0.15,  outputPerM: 0.60   },
  "gemini-2.0-flash":    { inputPerM: 0.075, outputPerM: 0.30   },
  "gemini-2.0-flash-fallback": { inputPerM: 0.075, outputPerM: 0.30 },
};

function estimateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[provider] ?? { inputPerM: 0.15, outputPerM: 0.60 };
  return (inputTokens / 1_000_000) * p.inputPerM + (outputTokens / 1_000_000) * p.outputPerM;
}

/* ── GET /api/admin/token-stats ──────────────────────────────────────────────
 *
 *  Query params:
 *    password  — required (admin password)
 *    from      — ISO date string, inclusive (default: 30 days ago)
 *    to        — ISO date string, inclusive (default: today)
 *    user_id   — optional integer filter
 *
 *  Returns per-stage aggregate stats with estimated USD cost.
 * ───────────────────────────────────────────────────────────────────────────── */
router.get("/admin/token-stats", async (req: Request, res: Response) => {
  try {
    const { password, from, to, user_id } = req.query as Record<string, string | undefined>;

    if (password !== ADMIN_PASSWORD) {
      res.status(403).json({ error: "Incorrect password." }); return;
    }

    const fromDate = from ?? (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    // Make toDate inclusive by extending to end of day
    const toDateEnd = `${toDate}T23:59:59.999Z`;

    const params: any[] = [fromDate, toDateEnd];
    let userFilter = "";
    if (user_id) {
      params.push(parseInt(user_id, 10));
      userFilter = `AND user_id = $${params.length}`;
    }

    const result = await query(
      `SELECT
         stage,
         ai_provider,
         COUNT(*)::int                          AS total_calls,
         ROUND(AVG(input_tokens))::int          AS avg_input_tokens,
         ROUND(AVG(output_tokens))::int         AS avg_output_tokens,
         SUM(input_tokens)::bigint              AS total_input_tokens,
         SUM(output_tokens)::bigint             AS total_output_tokens
       FROM ai_usage_log
       WHERE timestamp >= $1 AND timestamp <= $2
       ${userFilter}
       GROUP BY stage, ai_provider
       ORDER BY stage, ai_provider`,
      params,
    );

    const rows = result.rows.map((r: any) => {
      const totalCost = estimateCost(r.ai_provider, Number(r.total_input_tokens), Number(r.total_output_tokens));
      const avgCost = r.total_calls > 0 ? totalCost / r.total_calls : 0;
      return {
        stage: r.stage,
        ai_provider: r.ai_provider,
        total_calls: r.total_calls,
        avg_input_tokens: r.avg_input_tokens,
        avg_output_tokens: r.avg_output_tokens,
        total_input_tokens: Number(r.total_input_tokens),
        total_output_tokens: Number(r.total_output_tokens),
        estimated_total_cost_usd: parseFloat(totalCost.toFixed(6)),
        estimated_avg_cost_usd: parseFloat(avgCost.toFixed(8)),
      };
    });

    // Grand total across all stages
    const grandTotal = {
      total_calls: rows.reduce((s: number, r: any) => s + r.total_calls, 0),
      total_input_tokens: rows.reduce((s: number, r: any) => s + r.total_input_tokens, 0),
      total_output_tokens: rows.reduce((s: number, r: any) => s + r.total_output_tokens, 0),
      estimated_total_cost_usd: parseFloat(
        rows.reduce((s: number, r: any) => s + r.estimated_total_cost_usd, 0).toFixed(6),
      ),
    };

    res.json({
      from: fromDate,
      to: toDate,
      user_id: user_id ? parseInt(user_id, 10) : null,
      by_stage: rows,
      grand_total: grandTotal,
      pricing_note: "Costs estimated using published May-2025 prices. Claude Sonnet: $3/$15 per M tokens. Gemini 2.5 Flash: $0.15/$0.60. Gemini 2.0 Flash: $0.075/$0.30.",
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
