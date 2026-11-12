import { describe, it, expect } from "vitest";
import { ALEVEL_ELL_TOPICS, ALEVEL_ELL_COVERAGE, ALEVEL_ELL_NO_QUESTION_FOUND, ALEVEL_ELL_PAPERS, ALEVEL_ELL_AO_WEIGHTS } from "../lib/marking/aqaALevelEnglishLangLit.js";

describe("AQA 7707 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = ALEVEL_ELL_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(27);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(ALEVEL_ELL_TOPICS.map((t) => t.code));
    for (const c of ALEVEL_ELL_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(ALEVEL_ELL_COVERAGE.map((c) => c.code));
    for (const t of ALEVEL_ELL_TOPICS) expect(covered.has(t.code) !== ALEVEL_ELL_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("papers add up to 250 marks and AO ranges bracket 100", () => {
    expect(ALEVEL_ELL_PAPERS.reduce((n, p) => n + p.marks, 0)).toBe(250);
    expect(Object.values(ALEVEL_ELL_AO_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
