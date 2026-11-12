import { describe, it, expect } from "vitest";
import { ALEVEL_MATHS_TOPICS, ALEVEL_MATHS_COVERAGE, ALEVEL_MATHS_NO_QUESTION_FOUND, ALEVEL_MATHS_PAPERS, ALEVEL_MATHS_AO_WEIGHTS } from "../lib/marking/aqaALevelMaths.js";

describe("AQA 7357 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = ALEVEL_MATHS_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(ALEVEL_MATHS_TOPICS.map((t) => t.code));
    for (const c of ALEVEL_MATHS_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(ALEVEL_MATHS_COVERAGE.map((c) => c.code));
    for (const t of ALEVEL_MATHS_TOPICS) expect(covered.has(t.code) !== ALEVEL_MATHS_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("papers add up to 300 marks and the AO weights to 100", () => {
    expect(ALEVEL_MATHS_PAPERS.reduce((n, p) => n + p.marks, 0)).toBe(300);
    expect(Object.values(ALEVEL_MATHS_AO_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("pure-only papers do not cite mechanics or statistics topics", () => {
    for (const c of ALEVEL_MATHS_COVERAGE) {
      if (c.paper === "73571") expect(/^[A-I]/.test(c.code)).toBe(true);
    }
  });
});
