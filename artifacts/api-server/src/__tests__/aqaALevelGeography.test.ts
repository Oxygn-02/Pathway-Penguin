import { describe, it, expect } from "vitest";
import { ALEVEL_GEOG_TOPICS, ALEVEL_GEOG_COVERAGE, ALEVEL_GEOG_NO_QUESTION_FOUND, ALEVEL_GEOG_PAPERS, ALEVEL_GEOG_AO_WEIGHTS } from "../lib/marking/aqaALevelGeography.js";

describe("AQA 7037 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = ALEVEL_GEOG_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(59);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(ALEVEL_GEOG_TOPICS.map((t) => t.code));
    for (const c of ALEVEL_GEOG_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(ALEVEL_GEOG_COVERAGE.map((c) => c.code));
    for (const t of ALEVEL_GEOG_TOPICS) expect(covered.has(t.code) !== ALEVEL_GEOG_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("papers add up to 300 marks and AO ranges bracket 100", () => {
    expect(ALEVEL_GEOG_PAPERS.reduce((n, p) => n + p.marks, 0)).toBe(300);
    const lo = Object.values(ALEVEL_GEOG_AO_WEIGHTS).reduce((a, r) => a + r[0], 0);
    const hi = Object.values(ALEVEL_GEOG_AO_WEIGHTS).reduce((a, r) => a + r[1], 0);
    expect(lo <= 100 && hi >= 100).toBe(true);
  });
});
