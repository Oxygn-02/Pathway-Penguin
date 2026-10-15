import type { Request, Response, NextFunction } from "express";
import type { AuthUser } from "../middleware/auth.js";

// ── Per-user AI rate limiting ────────────────────────────────────────────────
//
//  In-memory sliding windows (reset on restart; fine for a single instance).
//  Limits are deliberately generous: generating questions for a full pathway
//  fires dozens of calls at once, and students revise heavily before exams.
//  They exist to stop a runaway script or abuse from burning the AI budget,
//  not to throttle normal use. Override with AI_LIMIT_PER_MINUTE / _HOUR / _DAY.
// ─────────────────────────────────────────────────────────────────────────────

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const LIMITS = {
  minute: envInt("AI_LIMIT_PER_MINUTE", 120),
  hour: envInt("AI_LIMIT_PER_HOUR", 1500),
  day: envInt("AI_LIMIT_PER_DAY", 6000),
};

// userId -> timestamps of recent AI calls (pruned to the last 24h)
const calls = new Map<number, number[]>();

export type CombinedCheck = "ok" | "minute_limit" | "hour_limit" | "day_limit";

/** Record one call for the user, or report which limit has been hit. */
export function checkCombinedUserLimits(userId: number, now = Date.now()): CombinedCheck {
  const recent = (calls.get(userId) ?? []).filter((t) => now - t < DAY);
  const inLast = (ms: number) => recent.filter((t) => now - t < ms).length;

  if (inLast(MINUTE) >= LIMITS.minute) { calls.set(userId, recent); return "minute_limit"; }
  if (inLast(HOUR) >= LIMITS.hour) { calls.set(userId, recent); return "hour_limit"; }
  if (recent.length >= LIMITS.day) { calls.set(userId, recent); return "day_limit"; }

  recent.push(now);
  calls.set(userId, recent);
  return "ok";
}

const MESSAGES: Record<Exclude<CombinedCheck, "ok">, string> = {
  minute_limit: "You're going a bit fast — wait a minute and try again.",
  hour_limit: "You've used a lot of AI requests this hour — please try again a bit later.",
  day_limit: "You've reached today's AI request limit — please try again tomorrow.",
};

/** Express middleware: run after requireAuth on every AI route. */
export function aiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const { userId } = (req as any).user as AuthUser;
  const result = checkCombinedUserLimits(userId);
  if (result !== "ok") {
    res.status(429).json({ error: MESSAGES[result] });
    return;
  }
  next();
}

// Periodically drop idle users so the map doesn't grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of calls) {
    if (!ts.some((t) => now - t < DAY)) calls.delete(id);
  }
}, HOUR).unref();
