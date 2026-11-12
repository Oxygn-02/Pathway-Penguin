import { describe, it, expect } from "vitest";
import { QUESTIONS, getQuestionSpec, parseMarkingResponse, buildMarkingPrompt, MarkingParseError, bandsForAo } from "../lib/aqaEnglish.js";

describe("AQA catalogue", () => {
  it("AO marks add up to the question marks", () => {
    for (const q of QUESTIONS) expect(q.aos.reduce((n, a) => n + a.marks, 0)).toBe(q.marks);
  });
  it("Language papers are 80 marks each", () => {
    for (const p of ["Paper 1", "Paper 2"]) {
      const total = QUESTIONS.filter((q) => q.qualification === "language" && q.paper === p).reduce((n, q) => n + q.marks, 0);
      expect(total).toBe(80);
    }
  });
  it("level bands run from 1 to the top mark with no gaps", () => {
    for (const q of QUESTIONS) {
      for (const a of q.aos) {
        const bands = bandsForAo(q, a.ao);
        if (q.kind === "points" || bands.length === 0) continue;
        const sorted = [...bands].sort((x, y) => x.min - y.min);
        expect(sorted[0].min).toBe(1);
        for (let i = 1; i < sorted.length; i++) expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
      }
    }
  });
});

describe("parseMarkingResponse", () => {
  const q2 = getQuestionSpec("lang-p1-q2")!;
  it("derives the level from the mark and ignores any level the model claims", () => {
    const r = parseMarkingResponse('```json\n{"aoMarks":{"AO2":6},"levels":{"AO2":1},"strengths":["a"],"improvements":["b"],"nextStep":"c","summary":"d"}\n```', q2);
    expect(r.marksAwarded).toBe(6);
    expect(r.aoMarks.AO2.level).toBe(3);
  });
  it("clamps and rounds marks", () => {
    const r = parseMarkingResponse('{"aoMarks":{"AO2":12.4}}', q2);
    expect(r.marksAwarded).toBe(8);
    expect(r.adjustments.length).toBe(2);
  });
  it("marks the two writing AOs on separate scales", () => {
    const q5 = getQuestionSpec("lang-p1-q5")!;
    const r = parseMarkingResponse('{"aoMarks":{"AO5":20,"AO6":10}}', q5);
    expect(r.marksAwarded).toBe(30);
    expect(r.aoMarks.AO5.level).toBe(4);
    expect(r.aoMarks.AO6.level).toBe(3);
  });
  it("uses one level across Literature AO1 to AO3 and AO4 separately", () => {
    const sh = getQuestionSpec("lit-p1-shakespeare")!;
    const r = parseMarkingResponse('{"aoMarks":{"AO1":10,"AO2":9,"AO3":4,"AO4":3}}', sh);
    expect(r.marksAwarded).toBe(26);
    expect(r.aoMarks.AO1.level).toBe(5); // 23 of 30
    expect(r.aoMarks.AO4.level).toBe(2);
  });
  it("marks the unseen poem comparison (8 marks) as AO2 only", () => {
    const q = getQuestionSpec("lit-p2-unseen-2")!;
    expect(q.aos).toEqual([expect.objectContaining({ ao: "AO2", marks: 8 })]);
    const r = parseMarkingResponse('{"aoMarks":{"AO2":6}}', q);
    expect(r.marksAwarded).toBe(6);
    expect(r.aoMarks.AO2.level).toBe(3);
  });
  it("rejects unreadable replies", () => {
    expect(() => parseMarkingResponse("sorry", q2)).toThrow(MarkingParseError);
    expect(() => parseMarkingResponse('{"aoMarks":{}}', q2)).toThrow(MarkingParseError);
  });
});

describe("buildMarkingPrompt", () => {
  it("includes the level descriptors and treats input as untrusted", () => {
    const { system, user } = buildMarkingPrompt(getQuestionSpec("lang-p1-q2")!, { question: "Q", answer: "A", source: "S" });
    expect(system).toContain("Level 4 (7-8)");
    expect(system).toContain("untrusted");
    expect(user).toContain("STUDENT ANSWER:\nA");
  });
});
