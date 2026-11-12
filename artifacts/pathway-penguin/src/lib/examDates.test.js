import { describe, it, expect } from "vitest";
import { daysUntil, countdownLabel, localDateStr } from "./examDates.js";

const now = new Date(2026, 10, 12, 15, 30); // 12 Nov 2026, afternoon

describe("examDates", () => {
  it("counts whole days", () => {
    expect(daysUntil("2026-11-12", now)).toBe(0);
    expect(daysUntil("2026-11-13", now)).toBe(1);
    expect(daysUntil("2027-05-14", now)).toBe(183);
    expect(daysUntil("2026-11-10", now)).toBe(-2);
  });
  it("is stable across the clock change", () => {
    expect(daysUntil("2027-03-29", new Date(2027, 2, 27, 23, 0))).toBe(2);
  });
  it("labels countdowns", () => {
    expect(countdownLabel("2026-11-12", now)).toBe("Today");
    expect(countdownLabel("2026-11-13", now)).toBe("Tomorrow");
    expect(countdownLabel("2026-11-30", now)).toBe("18 days to go");
    expect(countdownLabel("2026-11-01", now)).toBe("Passed");
  });
  it("formats local date", () => {
    expect(localDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
