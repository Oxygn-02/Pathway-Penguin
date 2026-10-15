import { describe, it, expect } from "vitest";
import { renderKatex } from "./math.jsx";

describe("renderKatex", () => {
  it("renders maths to KaTeX HTML", () => {
    expect(renderKatex("\\frac{1}{2}", false)).toContain("katex");
  });
  it("never returns raw HTML from student input", () => {
    const html = renderKatex("<img src=x onerror=alert(1)>", false);
    expect(html).not.toContain("<img");
  });
});
