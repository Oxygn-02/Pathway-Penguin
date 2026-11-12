import { describe, it, expect } from "vitest";
import { COMPUTER_SCIENCE_TOPICS, COMPUTER_SCIENCE_COVERAGE, COMPUTER_SCIENCE_NO_QUESTION_FOUND, COMPUTER_SCIENCE_PAPERS } from "../lib/marking/aqaComputerScience.js";

describe("AQA 8525 catalogue", () => {
  it("has no duplicate topic codes", () => {
    const codes = COMPUTER_SCIENCE_TOPICS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("every covered code exists and every question has marks", () => {
    const codes = new Set(COMPUTER_SCIENCE_TOPICS.map((t) => t.code));
    for (const c of COMPUTER_SCIENCE_COVERAGE) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(COMPUTER_SCIENCE_COVERAGE.map((c) => c.code));
    for (const t of COMPUTER_SCIENCE_TOPICS) expect(covered.has(t.code) !== COMPUTER_SCIENCE_NO_QUESTION_FOUND.includes(t.code)).toBe(true);
  });
  it("both papers are 90 marks", () => {
    for (const p of COMPUTER_SCIENCE_PAPERS) expect(p.marks).toBe(90);
  });
});
