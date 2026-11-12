import { describe, it, expect } from "vitest";
import { STATISTICS_TOPICS, STATISTICS_COVERAGE, STATISTICS_NO_QUESTION_FOUND, STATISTICS_PAPERS } from "../lib/marking/aqaStatistics.js";

describe("AQA 8382 catalogue", () => {
  it("has the 72 specification codes with no duplicates", () => {
    const codes = STATISTICS_TOPICS.map((t) => t.code);
    expect(codes.length).toBe(72);
    expect(new Set(codes).size).toBe(72);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(STATISTICS_TOPICS.map((t) => t.code));
    for (const c of STATISTICS_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(STATISTICS_COVERAGE.map((c) => c.code));
    for (const t of STATISTICS_TOPICS) expect(covered.has(t.code) !== STATISTICS_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("both papers are 80 marks", () => {
    for (const p of STATISTICS_PAPERS) expect(p.marks).toBe(80);
  });
});
