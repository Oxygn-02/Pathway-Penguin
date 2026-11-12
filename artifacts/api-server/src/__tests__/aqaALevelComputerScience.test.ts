import { describe, it, expect } from "vitest";
import { ALEVEL_CS_TOPICS, ALEVEL_CS_COVERAGE, ALEVEL_CS_NO_QUESTION_FOUND, ALEVEL_CS_PAPERS, ALEVEL_CS_AO_WEIGHTS } from "../lib/marking/aqaALevelComputerScience.js";

describe("AQA 7517 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = ALEVEL_CS_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(51);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(ALEVEL_CS_TOPICS.map((t) => t.code));
    for (const c of ALEVEL_CS_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(ALEVEL_CS_COVERAGE.map((c) => c.code));
    for (const t of ALEVEL_CS_TOPICS) expect(covered.has(t.code) !== ALEVEL_CS_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("papers add up to 275 marks and AO weights to 100", () => {
    expect(ALEVEL_CS_PAPERS.reduce((n, p) => n + p.marks, 0)).toBe(275);
    expect(Object.values(ALEVEL_CS_AO_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
