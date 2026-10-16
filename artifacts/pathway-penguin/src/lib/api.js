/* ── API helpers ─────────────────────────────────────────────── */

/** Parse a response as JSON; a proxy error page or empty body becomes a friendly { error }. */
export async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {
      error: res.status === 401
        ? "Your session has expired. Please log in again."
        : "The server didn't respond properly. Please try again in a moment.",
    };
  }
}

export function callApi(path, options = {}) {
  return fetch(path, {
    ...options,
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    body: options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
  }).then(readJson);
}

/** Ask the AI. `documents` may hold one base64 PDF, which is sent as inline data. */
export function callAi({ system, user, max_tokens = 4096, documents = [], stage = "unknown" }) {
  let inlineData = null;
  const doc = documents?.[0];
  if (doc?.source?.type === "base64") {
    inlineData = { mimeType: doc.source.media_type, data: doc.source.data };
  }
  return fetch("/api/ai/gemini-message", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, user, inlineData, stage, max_tokens }),
  })
    .then(readJson)
    .then((d) => {
      if (d.error) throw new Error(d.error);
      if (typeof d.text !== "string") throw new Error("The AI sent back an empty reply. Please try again.");
      return d.text;
    });
}

export function parseJSON(raw) {
  let text = raw.replace(/```json\s*|```/g, "").trim();

  // Fast path: the whole text is already valid JSON
  try { return JSON.parse(text); } catch {}

  const start = text.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found in response");

  // Fast path: everything from first bracket to end is valid JSON
  try { return JSON.parse(text.slice(start)); } catch {}

  // String-aware depth scan so brackets inside "quoted values" are ignored
  const opener  = text[start];
  const closer  = opener === "{" ? "}" : "]";
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc)              { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true;  continue; }
    if (ch === '"')       { inStr = !inStr; continue; }
    if (inStr)            continue;
    if (ch === opener)    depth++;
    else if (ch === closer) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Malformed JSON in response");
  try { return JSON.parse(text.slice(start, end + 1)); }
  catch { throw new Error("Malformed JSON in response"); }
}

export async function batchedMap(arr, size, fn) {
  const results = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}
