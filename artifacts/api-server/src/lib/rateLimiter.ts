// ── Rate limiting — DISABLED for pilot data collection ────────────────────────
//
//  All functions are stubs that always permit requests.
//  The original implementation is preserved in git history.
//  Re-enable by restoring the logic once real usage data is collected.
// ─────────────────────────────────────────────────────────────────────────────

export async function acquireClaudeSlot(): Promise<boolean> {
  return true;
}

export type GeminiCheck = "ok" | "user_limit" | "global_limit";

export function checkGeminiLimits(_userId: number): GeminiCheck {
  return "ok";
}

export type CombinedCheck = "ok" | "minute_limit" | "hour_limit" | "day_limit";

export function checkCombinedUserLimits(_userId: number): CombinedCheck {
  return "ok";
}
