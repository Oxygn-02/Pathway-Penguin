import { describe, it, expect } from "vitest";
import {
  SCIENCE_TOPICS, SCIENCE_COVERAGE, SCIENCE_NO_QUESTION_FOUND, SCIENCE_PAPERS, SCIENCE_AO_WEIGHTS, SCIENCE_LEVEL_BANDS, SCIENCE_SPECS,
  type ScienceSubject,
} from "../lib/marking/aqaScience.js";

const subjects: ScienceSubject[] = ["biology", "chemistry", "physics"];

describe.each(subjects)("AQA GCSE %s catalogue", (s) => {
  const topics = SCIENCE_TOPICS[s];
  const cov = SCIENCE_COVERAGE[s];
  const nf = SCIENCE_NO_QUESTION_FOUND[s];
  it("has no duplicate topic codes and every code starts with the 4. section", () => {
    const codes = topics.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of codes) expect(c.startsWith("4.")).toBe(true);
  });
  it("every covered code exists, has marks, and cites a paper of this spec", () => {
    const codes = new Set(topics.map((t) => t.code));
    for (const c of cov) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
      expect(c.paper.startsWith(SCIENCE_SPECS[s].code + "/")).toBe(true);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(cov.map((c) => c.code));
    for (const t of topics) expect(covered.has(t.code) !== nf.includes(t.code)).toBe(true);
  });
  it("has two papers of 100 marks", () => {
    expect(SCIENCE_PAPERS[s].length).toBe(2);
    expect(SCIENCE_PAPERS[s].reduce((n, p) => n + p.marks, 0)).toBe(200);
  });
});

describe("shared science rules", () => {
  it("assessment objectives add up to 100", () => expect(Object.values(SCIENCE_AO_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100));
  it("level bands have two marks per level and run from 1 to the top mark", () => {
    for (const [top, bands] of Object.entries(SCIENCE_LEVEL_BANDS)) {
      const sorted = [...bands].sort((a, b) => a.min - b.min);
      expect(sorted[0].min).toBe(1);
      expect(sorted[sorted.length - 1].max).toBe(Number(top));
      for (const b of sorted) expect(b.max - b.min).toBe(1);
    }
  });
});
