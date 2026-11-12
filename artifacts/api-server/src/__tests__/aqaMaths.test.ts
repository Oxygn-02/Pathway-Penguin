import { describe, it, expect } from "vitest";
import { MATHS_COVERAGE_EXTRAS, MATHS_NO_QUESTION_FOUND, MATHS_JUN23, MATHS_PAPERS, MATHS_TOPICS, MATHS_MARK_TYPES } from "../lib/marking/aqaMaths.js";
import { buildMathsMarkingPrompt, parseMathsMarkingResponse, getPastPaperQuestion, MathsMarkingParseError } from "../lib/marking/aqaMathsMarking.js";

describe("AQA 8300 catalogue", () => {
  it("each June 2023 paper adds up to 80 marks", () => {
    for (const p of MATHS_PAPERS) {
      const total = MATHS_JUN23.filter((q) => q.paper === p.id).reduce((n, q) => n + q.marks, 0);
      expect(total, p.code).toBe(80);
    }
  });
  it("every tagged topic code exists in the specification list", () => {
    const codes = new Set(MATHS_TOPICS.map((t) => t.code));
    for (const q of MATHS_JUN23) for (const c of q.topics) expect(codes.has(c), `${q.paper} Q${q.q} ${c}`).toBe(true);
  });
  it("has the 25 algebra, 16 ratio, 25 geometry, 9 probability and 6 statistics codes", () => {
    const n = (a: string) => MATHS_TOPICS.filter((t) => t.area.startsWith(a)).length;
    expect(n("Number")).toBe(16);
    expect(n("Algebra")).toBe(25);
    expect(n("Ratio")).toBe(16);
    expect(n("Geometry")).toBe(25);
    expect(n("Probability")).toBe(9);
    expect(n("Statistics")).toBe(6);
  });
  it("every specification topic has a real question, bar the ones listed as not found", () => {
    const covered = new Set([...MATHS_JUN23, ...MATHS_COVERAGE_EXTRAS].flatMap((q) => q.topics));
    const missing = MATHS_TOPICS.map((t) => t.code).filter((c) => !covered.has(c));
    expect(missing).toEqual(MATHS_NO_QUESTION_FOUND);
  });
  it("extra questions only use valid topic codes", () => {
    const codes = new Set(MATHS_TOPICS.map((t) => t.code));
    for (const q of MATHS_COVERAGE_EXTRAS) for (const c of q.topics) expect(codes.has(c)).toBe(true);
  });
  it("defines the five mark types", () => expect(Object.keys(MATHS_MARK_TYPES)).toEqual(["M", "A", "B", "ft", "SC"]));
});

describe("parseMathsMarkingResponse", () => {
  it("removes accuracy marks when there is no method mark", () => {
    const r = parseMathsMarkingResponse('{"method":0,"accuracy":1,"independent":0}', 3);
    expect(r.marksAwarded).toBe(0);
  });
  it("never awards more than the question is worth", () => {
    const r = parseMathsMarkingResponse('{"method":2,"accuracy":2,"independent":2}', 3);
    expect(r.marksAwarded).toBe(3);
  });
  it("rejects unreadable replies", () => {
    expect(() => parseMathsMarkingResponse("sorry", 3)).toThrow(MathsMarkingParseError);
    expect(() => parseMathsMarkingResponse('{"method":1}', 3)).toThrow(MathsMarkingParseError);
  });
});

describe("buildMathsMarkingPrompt", () => {
  it("includes the mark scheme when given and treats input as untrusted", () => {
    const { system, user } = buildMathsMarkingPrompt({ question: "Q", answer: "A", marks: 3, markScheme: "M1 for 180 ÷ 9" });
    expect(system).toContain("untrusted");
    expect(user).toContain("OFFICIAL MARK SCHEME:\nM1 for 180 ÷ 9");
  });
  it("finds a past-paper question", () => expect(getPastPaperQuestion("H1", "4")?.marks).toBe(3));
});
