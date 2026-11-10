import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceCard } from "./Quiz.jsx";

const sources = [{ id: 1, name: "AQA Biology Paper 1", content: "Intro. Enzymes are biological catalysts that speed up reactions. More text." }];

describe("SourceCard", () => {
  it("shows the source name and excerpt preview", () => {
    const q = { sourceIds: [1], sourceExcerpts: [{ id: 1, start: 7, end: 62 }] };
    const html = renderToStaticMarkup(<SourceCard question={q} sources={sources} onOpen={() => {}} />);
    expect(html).toContain("AQA Biology Paper 1");
    expect(html).toContain("Enzymes are biological catalysts");
    expect(html).toContain("View source");
  });
  it("renders nothing for general-knowledge or legacy questions", () => {
    expect(renderToStaticMarkup(<SourceCard question={{ sourceIds: [] }} sources={sources} onOpen={() => {}} />)).toBe("");
    expect(renderToStaticMarkup(<SourceCard question={{}} sources={sources} onOpen={() => {}} />)).toBe("");
  });
});
