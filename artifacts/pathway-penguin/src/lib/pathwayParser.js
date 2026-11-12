/* ── Read a pathway sheet without the AI ─────────────────────────
 * A pathway sheet is a table: topic id (1.1), description, a confidence
 * rating 1-4 (blank if not rated yet) and a notes column. Reading it locally
 * is instant, free, and keeps the student's sheet in their browser. The AI is
 * only a fallback for layouts this cannot read (see Upload.jsx).
 *
 * Input is a flat list of text items, in reading order. PDF pages give this
 * directly; pasted text is split on tabs and line breaks (Google Sheets
 * copies as tab-separated). */

const TOPIC_ID = /^(\d{1,2})\.(\d{1,2})$/;
const RATING = /^[1-4]$/;
const PATHWAY_LABEL = /^Pathway\s*([1-4])$/i;
const PATHWAY_ANYWHERE = /\bPathway\s*([1-4])\b/i;
const TITLE = /^(?:KS4\s+|GCSE\s+)?(.+?)\s+Pathway(?:\s*[1-4])?$/i;
const HEADER_WORDS = /^(my notes|confidence|1-4|topic|topics|notes)$/i;

const clean = (items) => items.map((s) => String(s).replace(/\s+/g, " ").trim()).filter(Boolean);

/** Turn pasted text into the same flat item list a PDF page gives. */
export function itemsFromPastedText(text) {
  const items = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (line.includes("\t")) { items.push(...line.split("\t")); continue; }
    // "1.1  Solve equations  3": cells separated by two or more spaces.
    if (/\s{2,}/.test(line.trim())) { items.push(...line.trim().split(/\s{2,}/)); continue; }
    // "1.1 Solve equations": split the id off so it is its own item.
    const m = /^(\d{1,2}\.\d{1,2})[.)]?\s+(.+)$/.exec(line.trim());
    if (m) { items.push(m[1], m[2]); continue; }
    items.push(line);
  }
  return clean(items);
}

/**
 * Parse one sheet's items.
 * Returns { subject, pathwayNumber, topics: [{id, description, parentTitle, confidence}] }.
 * subject is "" and pathwayNumber is null when the sheet doesn't say.
 */
export function parsePathwayItems(rawItems) {
  const items = clean(rawItems);
  let subject = "";
  let pathwayNumber = null;
  for (const s of items) {
    const label = PATHWAY_ANYWHERE.exec(s);
    if (label && !pathwayNumber) pathwayNumber = Number(label[1]);
    const title = TITLE.exec(s);
    if (title && !subject && !PATHWAY_LABEL.test(s) && !TOPIC_ID.test(s)) subject = title[1].trim();
  }

  const topics = [];
  const seen = new Set();
  let cur = null;
  for (const s of items) {
    if (TOPIC_ID.test(s)) {
      cur = { id: s, parts: [], confidence: null, rated: false };
      topics.push(cur);
      continue;
    }
    if (!cur) continue; // header and legend, before the first topic
    if (cur.rated) continue; // notes column after the rating
    if (RATING.test(s) && cur.parts.length) { cur.confidence = Number(s); cur.rated = true; continue; }
    if (HEADER_WORDS.test(s) || PATHWAY_LABEL.test(s)) continue;
    cur.parts.push(s);
  }

  const out = [];
  for (const t of topics) {
    const description = t.parts.join(" ").trim();
    if (!description || seen.has(t.id)) continue; // empty rows and repeated ids
    seen.add(t.id);
    out.push({ id: t.id, description, parentTitle: "", confidence: t.confidence });
  }
  return { subject, pathwayNumber, topics: out };
}

export const parsePastedPathway = (text) => parsePathwayItems(itemsFromPastedText(text));
