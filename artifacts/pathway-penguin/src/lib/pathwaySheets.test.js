import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { describePage, groupPagesIntoSheets, selectRatedPages, buildPdfWithPages } from "./pathwaySheets.js";

const HEADER = ["KS4 Maths Pathway", "1- I could teach this to someone else", "4 - I don't recognise this", "Confidence", "1-4", "My Notes"];
const page = (pathway, rows) => [...HEADER.slice(0, 3), `Pathway ${pathway}`, ...HEADER.slice(3), ...rows.flat()];
// A topic row; rating may be blank (empty cell is simply absent from the text).
const row = (id, rating) => [id, "Some topic description.", ...(rating ? [String(rating)] : [])];

describe("describePage", () => {
  it("counts ratings but not the legend digits or topic ids", () => {
    const info = describePage(page(2, [row("1.1", 3), row("1.2"), row("1.3", 1)]));
    expect(info.ratings).toBe(2);
    expect(info.pathway).toBe(2);
    expect(info.firstTopic).toEqual({ major: 1, minor: 1 });
    expect(info.lastTopic).toEqual({ major: 1, minor: 3 });
  });
  it("treats a page with no text as blank", () => {
    expect(describePage(["", " "]).blank).toBe(true);
  });
});

describe("groupPagesIntoSheets", () => {
  it("keeps a multi-page sheet together and splits when numbering restarts", () => {
    const pages = [
      page(1, [row("1.1", 2), row("1.2", 2)]),
      page(1, [row("8.1", 3)]),
      page(1, [row("1.1"), row("1.2")]), // new tab, same pathway label
    ];
    expect(groupPagesIntoSheets(pages).map((s) => s.pages)).toEqual([[0, 1], [2]]);
  });
  it("splits when the pathway label changes", () => {
    const pages = [page(1, [row("1.1", 2)]), page(2, [row("2.1", 2)])];
    expect(groupPagesIntoSheets(pages)).toHaveLength(2);
  });
});

describe("selectRatedPages", () => {
  it("skips a sheet that has no ratings at all", () => {
    const pages = [
      page(1, [row("1.1", 2)]), page(1, [row("8.1", 1)]), // rated, 2 pages
      page(2, [row("1.1"), row("1.2")]),                  // empty sheet
      page(3, [row("1.1", 4)]),                           // rated
    ];
    expect(selectRatedPages(pages)).toEqual({ keep: [0, 1, 3], skippedSheets: 1 });
  });
  it("keeps a sheet with some blank fields as long as it has one rating", () => {
    const pages = [page(1, [row("1.1"), row("1.2"), row("1.3", 3)]), page(2, [row("1.1")])];
    expect(selectRatedPages(pages)).toEqual({ keep: [0], skippedSheets: 1 });
  });
  it("skips blank pages between rated sheets", () => {
    const pages = [page(1, [row("1.1", 2)]), [], page(2, [row("1.1", 2)])];
    expect(selectRatedPages(pages)).toEqual({ keep: [0, 2], skippedSheets: 1 });
  });
  it("keeps everything when every sheet is rated", () => {
    const pages = [page(1, [row("1.1", 2)]), page(2, [row("1.1", 3)])];
    expect(selectRatedPages(pages)).toEqual({ keep: [0, 1], skippedSheets: 0 });
  });
  it("keeps everything when nothing has been rated yet", () => {
    const pages = [page(1, [row("1.1")]), page(2, [row("1.1")])];
    expect(selectRatedPages(pages)).toEqual({ keep: [0, 1], skippedSheets: 0 });
  });
});

describe("buildPdfWithPages", () => {
  it("returns a PDF containing only the chosen pages", async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 4; i++) doc.addPage();
    const bytes = await doc.save();
    const out = await PDFDocument.load(await buildPdfWithPages(bytes, [0, 3]));
    expect(out.getPageCount()).toBe(2);
  });
});
