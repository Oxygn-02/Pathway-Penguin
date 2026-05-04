// ── In-memory rate limiting for AI routes ─────────────────────────────────────
//
//  Claude  : Global token bucket — 400 req/hr across ALL users combined.
//            Queues when full and retries; rejects only when queue is full.
//
//  Gemini  : Sliding window — 800 global/hr, 50 per-user/hr.
//
//  Combined: Per-user safety net — 20/min, 150/hr, 300/day (resets at midnight).
// ─────────────────────────────────────────────────────────────────────────────

const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pruneArray(arr: number[], cutoff: number): void {
  while (arr.length > 0 && arr[0] < cutoff) arr.shift();
}

// ── Claude — global token bucket 400/hr ───────────────────────────────────────

const CLAUDE_MAX_PER_HOUR = 400;
const CLAUDE_QUEUE_MAX = 80;          // max concurrent waiters
const CLAUDE_RETRY_DELAY_MS = 5_000; // poll interval while queued
const CLAUDE_MAX_WAIT_MS = 55_000;   // give up after this long

const claudeTimestamps: number[] = [];
let claudeQueueSize = 0;

function pruneClaudeTimestamps(): void {
  pruneArray(claudeTimestamps, Date.now() - HOUR_MS);
}

function tryClaudeSlot(): boolean {
  pruneClaudeTimestamps();
  if (claudeTimestamps.length < CLAUDE_MAX_PER_HOUR) {
    claudeTimestamps.push(Date.now());
    return true;
  }
  return false;
}

/**
 * Tries to acquire a Claude slot immediately.
 * If the bucket is full, waits up to CLAUDE_MAX_WAIT_MS for a slot to open.
 * Returns false if the queue is full or the wait timed out.
 */
export async function acquireClaudeSlot(): Promise<boolean> {
  if (tryClaudeSlot()) return true;
  if (claudeQueueSize >= CLAUDE_QUEUE_MAX) return false;

  claudeQueueSize++;
  try {
    const deadline = Date.now() + CLAUDE_MAX_WAIT_MS;
    while (Date.now() < deadline) {
      await delay(CLAUDE_RETRY_DELAY_MS);
      if (tryClaudeSlot()) return true;
    }
    return false;
  } finally {
    claudeQueueSize--;
  }
}

// ── Gemini — sliding window 800/hr global, 50/hr per user ───────────────────

const GEMINI_MAX_GLOBAL_PER_HOUR = 800;
const GEMINI_MAX_USER_PER_HOUR = 50;

const geminiGlobalTs: number[] = [];
const geminiUserTs = new Map<number, number[]>();

export type GeminiCheck = "ok" | "user_limit" | "global_limit";

export function checkGeminiLimits(userId: number): GeminiCheck {
  const now = Date.now();
  const cutoff = now - HOUR_MS;

  pruneArray(geminiGlobalTs, cutoff);

  let userArr = geminiUserTs.get(userId);
  if (!userArr) { userArr = []; geminiUserTs.set(userId, userArr); }
  pruneArray(userArr, cutoff);

  if (userArr.length >= GEMINI_MAX_USER_PER_HOUR) return "user_limit";
  if (geminiGlobalTs.length >= GEMINI_MAX_GLOBAL_PER_HOUR) return "global_limit";

  geminiGlobalTs.push(now);
  userArr.push(now);
  return "ok";
}

// ── Combined per-user limits across both AIs ──────────────────────────────────

const USER_MAX_PER_MIN = 20;
const USER_MAX_PER_HOUR = 150;
const USER_MAX_PER_DAY = 300;

interface UserWindow {
  minuteTs: number[];
  hourTs: number[];
  dayTs: number[];
}

const userWindows = new Map<number, UserWindow>();

function getMidnightMs(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export type CombinedCheck = "ok" | "minute_limit" | "hour_limit" | "day_limit";

export function checkCombinedUserLimits(userId: number): CombinedCheck {
  const now = Date.now();

  let w = userWindows.get(userId);
  if (!w) { w = { minuteTs: [], hourTs: [], dayTs: [] }; userWindows.set(userId, w); }

  pruneArray(w.minuteTs, now - MIN_MS);
  pruneArray(w.hourTs, now - HOUR_MS);
  pruneArray(w.dayTs, getMidnightMs());

  if (w.minuteTs.length >= USER_MAX_PER_MIN) return "minute_limit";
  if (w.hourTs.length >= USER_MAX_PER_HOUR) return "hour_limit";
  if (w.dayTs.length >= USER_MAX_PER_DAY) return "day_limit";

  w.minuteTs.push(now);
  w.hourTs.push(now);
  w.dayTs.push(now);
  return "ok";
}
