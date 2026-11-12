import { describe, it, expect } from "vitest";
import { GEOGRAPHY_TOPICS, GEOGRAPHY_COVERAGE, GEOGRAPHY_NO_QUESTION_FOUND, GEOGRAPHY_PAPERS, GEOGRAPHY_LEVEL_BANDS } from "../lib/marking/aqaGeography.js";

describe("AQA 8035 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = GEOGRAPHY_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(GEOGRAPHY_TOPICS.map((t) => t.code));
    for (const c of GEOGRAPHY_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(GEOGRAPHY_COVERAGE.map((c) => c.code));
    for (const t of GEOGRAPHY_TOPICS) expect(covered.has(t.code) !== GEOGRAPHY_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("papers add up to 252 marks", () => expect(GEOGRAPHY_PAPERS.reduce((n, p) => n + p.marks, 0)).toBe(252));
  it("level bands run from 1 to the top mark with no gaps", () => {
    for (const [top, bands] of Object.entries(GEOGRAPHY_LEVEL_BANDS)) {
      const sorted = [...bands].sort((a, b) => a.min - b.min);
      expect(sorted[0].min).toBe(1);
      expect(sorted[sorted.length - 1].max).toBe(Number(top));
      for (let i = 1; i < sorted.length; i++) expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
    }
  });
});
