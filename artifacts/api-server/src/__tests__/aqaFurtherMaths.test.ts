import { describe, it, expect } from "vitest";
import { FURTHER_MATHS_TOPICS, FURTHER_MATHS_COVERAGE, FURTHER_MATHS_NO_QUESTION_FOUND, FURTHER_MATHS_PAPERS } from "../lib/marking/aqaFurtherMaths.js";

describe("AQA 8365 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = FURTHER_MATHS_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(FURTHER_MATHS_TOPICS.map((t) => t.code));
    for (const c of FURTHER_MATHS_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(FURTHER_MATHS_COVERAGE.map((c) => c.code));
    for (const t of FURTHER_MATHS_TOPICS) expect(covered.has(t.code) !== FURTHER_MATHS_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("both papers are 80 marks", () => {
    for (const p of FURTHER_MATHS_PAPERS) expect(p.marks).toBe(80);
  });
});
