/**
 * Turns the untrusted quiz result payload from the browser into rows that are
 * safe to store and score. Progress and Ranks are built from these rows, so a
 * crafted request must not be able to claim more marks than a question offers.
 */
export const MAX_RESULTS_PER_REQUEST = 50;
export const MAX_MARKS_PER_QUESTION = 20;

export interface RawResult {
  topicId?: unknown;
  topicDesc?: unknown;
  correct?: unknown;
  marksAwarded?: unknown;
  marksAvailable?: unknown;
}

export interface CleanResult {
  topicId: string;
  topicDesc: string;
  correct: boolean;
  marksAwarded: number;
  marksAvailable: number;
}

function wholeNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : null;
}

export function cleanResults(results: RawResult[]): CleanResult[] {
  const out: CleanResult[] = [];
  for (const r of results.slice(0, MAX_RESULTS_PER_REQUEST)) {
    if (!r || typeof r !== "object") continue;
    if (typeof r.topicId !== "string" || r.topicId.length === 0 || r.topicId.length > 40) continue;

    const availRaw = wholeNumber(r.marksAvailable);
    const marksAvailable = Math.min(MAX_MARKS_PER_QUESTION, Math.max(1, availRaw ?? 1));
    const awardedRaw = wholeNumber(r.marksAwarded) ?? (r.correct === true ? marksAvailable : 0);
    const marksAwarded = Math.min(marksAvailable, Math.max(0, awardedRaw));

    out.push({
      topicId: r.topicId,
      topicDesc: typeof r.topicDesc === "string" ? r.topicDesc.slice(0, 500) : "",
      // Full marks is the only thing that counts as correct, derived from marks
      // rather than trusted from the client.
      correct: marksAwarded === marksAvailable,
      marksAwarded,
      marksAvailable,
    });
  }
  return out;
}

/** +5 for attempting, +10 more for full marks. */
export function pointsFor(r: CleanResult): number {
  return 5 + (r.correct ? 10 : 0);
}
