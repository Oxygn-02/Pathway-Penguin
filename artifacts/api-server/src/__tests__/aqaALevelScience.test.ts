import { describe, it, expect } from "vitest";
import {
  ALEVEL_SCIENCE_TOPICS, ALEVEL_SCIENCE_COVERAGE, ALEVEL_SCIENCE_NO_QUESTION_FOUND, ALEVEL_SCIENCE_PAPERS, ALEVEL_SCIENCE_SPECS,
  BIOLOGY_ESSAY_BANDS, type ALevelScienceSubject,
} from "../lib/marking/aqaALevelScience.js";

const subjects: ALevelScienceSubject[] = ["biology", "chemistry", "physics"];

describe.each(subjects)("AQA A-level %s catalogue", (s) => {
  const topics = ALEVEL_SCIENCE_TOPICS[s];
  const cov = ALEVEL_SCIENCE_COVERAGE[s];
  const nf = ALEVEL_SCIENCE_NO_QUESTION_FOUND[s];
  it("has no duplicate topic codes", () => {
    const codes = topics.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("every covered code exists, has marks and cites a paper of this spec", () => {
    const codes = new Set(topics.map((t) => t.code));
    for (const c of cov) {
      expect(codes.has(c.code)).toBe(true);
      expect(c.marks).toBeGreaterThan(0);
      expect(c.paper.startsWith(ALEVEL_SCIENCE_SPECS[s].code + "/")).toBe(true);
    }
  });
  it("every topic is either covered or listed as not found, never both", () => {
    const covered = new Set(cov.map((c) => c.code));
    for (const t of topics) expect(covered.has(t.code) !== nf.includes(t.code)).toBe(true);
  });
  it("weightings add up to 100", () => expect(ALEVEL_SCIENCE_PAPERS[s].reduce((n, p) => n + p.weighting, 0)).toBe(100));
});

describe("paper marks", () => {
  it("match the specifications", () => {
    const m = (s: ALevelScienceSubject) => ALEVEL_SCIENCE_PAPERS[s].reduce((n, p) => n + p.marks, 0);
    expect(m("biology")).toBe(260);
    expect(m("chemistry")).toBe(300);
    expect(m("physics")).toBe(250);
  });
  it("the biology essay bands run from 1 to 25 with no gaps", () => {
    const b = [...BIOLOGY_ESSAY_BANDS].sort((x, y) => x.min - y.min);
    expect(b[0].min).toBe(1);
    expect(b[b.length - 1].max).toBe(25);
    for (let i = 1; i < b.length; i++) expect(b[i].min).toBe(b[i - 1].max + 1);
  });
});
