import { describe, it, expect } from "vitest";
import { ALEVEL_FM_TOPICS, ALEVEL_FM_COVERAGE, ALEVEL_FM_NO_QUESTION_FOUND, ALEVEL_FM_PAPERS, ALEVEL_FM_AO_WEIGHTS } from "../lib/marking/aqaALevelFurtherMaths.js";

describe("AQA 7367 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = ALEVEL_FM_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(ALEVEL_FM_TOPICS.map((t) => t.code));
    for (const c of ALEVEL_FM_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(ALEVEL_FM_COVERAGE.map((c) => c.code));
    for (const t of ALEVEL_FM_TOPICS) expect(covered.has(t.code) !== ALEVEL_FM_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("optional application topics are only cited from the matching Paper 3 booklet", () => {
    const booklet: Record<string, string> = { M: "7367/3M", S: "7367/3S", D: "7367/3D" };
    for (const c of ALEVEL_FM_COVERAGE) {
      if (c.code.length === 2) expect(c.paper).toBe(booklet[c.code[0]]);
      else expect(["7367/1", "7367/2"]).toContain(c.paper);
    }
  });
  it("papers add up to 300 marks and AO weights to 100", () => {
    expect(ALEVEL_FM_PAPERS.reduce((n, p) => n + p.marks, 0)).toBe(300);
    expect(Object.values(ALEVEL_FM_AO_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
