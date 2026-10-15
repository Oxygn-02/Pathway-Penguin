import { describe, it, expect } from "vitest";
import { stemWord, topicKeywords, sourceContextSection } from "./sources.js";

describe("stemWord / topicKeywords", () => {
  it("stems common suffixes but keeps short words and 'class'", () => {
    expect(stemWord("on")).toBe("on");
    expect(stemWord("class")).toBe("class");
    expect(stemWord("equations")).toBe(stemWord("equation"));
  });
  it("drops stop words and keeps topic words", () => {
    const k = topicKeywords("Solve the linear equations with fractions");
    expect(k).toContain("linear");
    expect(k).toContain("equations");
    expect(k).not.toContain("the");
    expect(topicKeywords("")).toEqual([]);
  });
});

describe("sourceContextSection", () => {
  const sources = [
    { id: 1, name: "Maths notes", content: "Linear equations: collect x terms on one side and solve for x." },
    { id: 2, name: "History notes", content: "The causes of the First World War included alliances." },
  ];
  it("returns only relevant sources, with their ids", () => {
    const r = sourceContextSection({ description: "Solve linear equations" }, sources);
    expect(r.sourceIds).toEqual([1]);
    expect(r.text).toContain("Maths notes");
    expect(r.text).not.toContain("History notes");
  });
  it("returns nothing when no source matches or there are none", () => {
    expect(sourceContextSection({ description: "Photosynthesis" }, sources).sourceIds).toEqual([]);
    expect(sourceContextSection({ description: "Solve linear equations" }, []).text).toBe("");
  });
  it("never exceeds the prompt budget", () => {
    const big = [{ id: 9, name: "Big", content: "linear equations ".repeat(5000) }];
    const r = sourceContextSection({ description: "linear equations" }, big);
    expect(r.text.length).toBeLessThan(13000);
  });
});
