import { describe, it, expect } from "vitest";
import { cleanResults, pointsFor, MAX_MARKS_PER_QUESTION, MAX_RESULTS_PER_REQUEST } from "../lib/quizScoring.js";

describe("cleanResults", () => {
  it("clamps awarded marks to marks available", () => {
    const [r] = cleanResults([{ topicId: "1.1", marksAwarded: 99, marksAvailable: 3 }]);
    expect(r.marksAwarded).toBe(3);
    expect(r.correct).toBe(true);
  });
  it("ignores a client claim of correct when marks say otherwise", () => {
    const [r] = cleanResults([{ topicId: "1.1", correct: true, marksAwarded: 1, marksAvailable: 4 }]);
    expect(r.correct).toBe(false);
    expect(pointsFor(r)).toBe(5);
  });
  it("rejects negative, fractional and non-numeric marks", () => {
    const [neg] = cleanResults([{ topicId: "1.1", marksAwarded: -5, marksAvailable: 2 }]);
    expect(neg.marksAwarded).toBe(0);
    const [str] = cleanResults([{ topicId: "1.1", marksAwarded: "9" as any, marksAvailable: "9" as any }]);
    expect(str.marksAvailable).toBe(1);
  });
  it("caps marks available and request size, drops bad topic ids", () => {
    expect(cleanResults([{ topicId: "1.1", marksAvailable: 5000, marksAwarded: 5000 }])[0].marksAvailable).toBe(MAX_MARKS_PER_QUESTION);
    expect(cleanResults(Array.from({ length: 500 }, () => ({ topicId: "1.1" })))).toHaveLength(MAX_RESULTS_PER_REQUEST);
    expect(cleanResults([{ topicId: "" }, { topicId: 5 as any }, null as any])).toHaveLength(0);
  });
  it("falls back to correct flag when no marks are sent", () => {
    expect(cleanResults([{ topicId: "2.1", correct: true }])[0].correct).toBe(true);
    expect(cleanResults([{ topicId: "2.1", correct: false }])[0].correct).toBe(false);
  });
});
