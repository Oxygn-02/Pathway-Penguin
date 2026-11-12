/* Helpers for exam dates (YYYY-MM-DD strings, local time). */

export function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Whole calendar days from today until dateStr (negative if passed). */
export function daysUntil(dateStr, now = new Date()) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

/** Short day countdown, e.g. "12 days to go", "Tomorrow", "Today", "Passed". */
export function countdownLabel(dateStr, now = new Date()) {
  const diff = daysUntil(dateStr, now);
  if (diff < 0) return "Passed";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff} days to go`;
}
