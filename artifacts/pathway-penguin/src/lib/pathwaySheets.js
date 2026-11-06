/* ── Skip completely empty sheets in a pathway PDF ───────────────
 * A Google Sheets export puts every tab in one PDF, and students can upload
 * all four pathways at once. Tabs with no confidence ratings at all would
 * only add topics (and AI cost), so we drop them before anything is sent.
 * A tab that has at least one rating is kept whole: blank cells inside it
 * are still handled by the AI as before (confidence: null).
 *
 * Pure functions here take each page as an array of text strings, so they
 * are easy to test. `extractPdfPages` / `keepRatedSheets` do the PDF work. */

const TOPIC_ID = /^\d+\.\d+$/;
const RATING = /^[1-4]$/;
const PATHWAY_LABEL = /^Pathway\s*([1-4])$/i;

const clean = (items) => items.map((s) => String(s).trim()).filter(Boolean);

/** Facts about one page: its Pathway label, topic ids and how many ratings it has. */
export function describePage(items) {
  const strs = clean(items);
  // Ratings sit after the header ("My Notes") so the legend's digits never count.
  const headerEnd = strs.findIndex((s) => /^my notes$/i.test(s));
  const body = headerEnd === -1 ? strs : strs.slice(headerEnd + 1);
  const label = strs.map((s) => PATHWAY_LABEL.exec(s)).find(Boolean);
  const topicIds = body.filter((s) => TOPIC_ID.test(s));
  return {
    blank: strs.length === 0,
    pathway: label ? Number(label[1]) : null,
    firstTopic: topicIds.length ? parseTopicId(topicIds[0]) : null,
    lastTopic: topicIds.length ? parseTopicId(topicIds[topicIds.length - 1]) : null,
    ratings: body.filter((s) => RATING.test(s)).length,
  };
}

function parseTopicId(id) {
  const [major, minor] = id.split(".").map(Number);
  return { major, minor };
}

const isAfter = (a, b) => a.major > b.major || (a.major === b.major && a.minor > b.minor);

/**
 * Group page indexes into sheets. A new sheet starts on a blank page, when the
 * Pathway label changes, or when topic numbering starts over (page 2 of one
 * sheet carries on from page 1, a new tab begins again at 1.1).
 */
export function groupPagesIntoSheets(pages) {
  const sheets = [];
  let current = null;
  let pathway = null; // carried from earlier pages of the same sheet
  let lastTopic = null;
  pages.forEach((items, index) => {
    const info = describePage(items);
    const startsNew =
      !current ||
      info.blank ||
      (info.pathway && pathway && info.pathway !== pathway) ||
      (info.firstTopic && lastTopic && !isAfter(info.firstTopic, lastTopic));
    if (startsNew) {
      current = { pages: [], ratings: 0 };
      sheets.push(current);
      pathway = null;
      lastTopic = null;
    }
    current.pages.push(index);
    current.ratings += info.ratings;
    pathway = info.pathway ?? pathway;
    lastTopic = info.lastTopic ?? lastTopic;
    if (info.blank) current = null; // a blank page never absorbs the next one
  });
  return sheets;
}

/**
 * Decide which pages to keep. Sheets without a single rating are skipped. If
 * no sheet has a rating (nothing filled in yet, or the text could not be read)
 * everything is kept so the upload behaves exactly as it did before.
 */
export function selectRatedPages(pages) {
  const sheets = groupPagesIntoSheets(pages);
  const rated = sheets.filter((s) => s.ratings > 0);
  if (!rated.length || rated.length === sheets.length) {
    return { keep: pages.map((_, i) => i), skippedSheets: 0 };
  }
  return { keep: rated.flatMap((s) => s.pages), skippedSheets: sheets.length - rated.length };
}

/** Read the text of each page of a PDF (ArrayBuffer). */
export async function extractPdfPages(arrayBuffer) {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str : "")));
  }
  return pages;
}

/** Copy only the chosen pages (0-based) into a new PDF. */
export async function buildPdfWithPages(arrayBuffer, keep) {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, keep);
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

function toBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/**
 * Returns { base64, skippedSheets } for the PDF to send. Any failure while
 * filtering falls back to the original file, so a quirky PDF still uploads.
 */
export async function keepRatedSheets(arrayBuffer, originalBase64) {
  try {
    const pages = await extractPdfPages(arrayBuffer);
    const { keep, skippedSheets } = selectRatedPages(pages);
    if (!skippedSheets) return { base64: originalBase64, skippedSheets: 0 };
    return { base64: toBase64(await buildPdfWithPages(arrayBuffer, keep)), skippedSheets };
  } catch {
    return { base64: originalBase64, skippedSheets: 0 };
  }
}
