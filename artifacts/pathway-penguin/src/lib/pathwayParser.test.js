import { describe, it, expect } from "vitest";
import { itemsFromPastedText, parsePathwayItems, parsePastedPathway } from "./pathwayParser.js";

const HEAD = ["KS4 Maths Pathway", "1- I could teach this to someone else", "4 - I don't recognise this", "Pathway 3", "Confidence", "1-4", "My Notes"];

describe("parsePathwayItems (PDF text items)", () => {
  it("reads subject, pathway, topics and ratings; blank rating is null", () => {
    const r = parsePathwayItems([...HEAD, "1.1", "Solve linear equations", "3", "1.2", "Expand brackets", "1.3", "Factorise", "quadratics", "2", "my note"]);
    expect(r.subject).toBe("Maths");
    expect(r.pathwayNumber).toBe(3);
    expect(r.topics).toEqual([
      { id: "1.1", description: "Solve linear equations", parentTitle: "", confidence: 3 },
      { id: "1.2", description: "Expand brackets", parentTitle: "", confidence: null },
      { id: "1.3", description: "Factorise quadratics", parentTitle: "", confidence: 2 },
    ]);
  });
  it("ignores legend digits and notes after the rating", () => {
    const r = parsePathwayItems([...HEAD, "1.1", "Some topic", "4", "3", "2"]);
    expect(r.topics[0].confidence).toBe(4);
  });
  it("drops repeated ids and rows with no description", () => {
    const r = parsePathwayItems([...HEAD, "1.1", "A", "1.1", "B", "1.2"]);
    expect(r.topics.map((t) => t.id)).toEqual(["1.1"]);
  });
  it("returns no topics for text that is not a pathway", () => {
    expect(parsePathwayItems(["Hello", "world"]).topics).toEqual([]);
  });
});

describe("parsePastedPathway", () => {
  it("reads tab-separated Google Sheets rows including blank ratings", () => {
    const text = "Biology Pathway 2\nTopic\tDescription\tConfidence\n1.1\tCell structure\t4\tnotes\n1.2\tTransport in cells\t\n1.3\tMitosis\t1";
    const r = parsePastedPathway(text);
    expect(r.pathwayNumber).toBe(2);
    expect(r.topics.map((t) => [t.id, t.confidence])).toEqual([["1.1", 4], ["1.2", null], ["1.3", 1]]);
  });
  it("reads plain lines with an id then a description", () => {
    const r = parsePastedPathway("1.1 Add fractions with denominators up to 4\n1.2 Subtract fractions");
    expect(r.topics).toHaveLength(2);
    expect(r.topics[0].description).toBe("Add fractions with denominators up to 4");
    expect(r.topics[0].confidence).toBeNull();
  });
  it("splits cells separated by two spaces", () => {
    expect(itemsFromPastedText("1.1  Cells  3")).toEqual(["1.1", "Cells", "3"]);
  });
});
