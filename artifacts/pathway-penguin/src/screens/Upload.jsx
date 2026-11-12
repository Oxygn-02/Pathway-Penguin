import { useState, useRef, useCallback } from "react";
import { ErrorBox, Pip } from "../components/common.jsx";
import { CORE_SUBJECTS, FONT, OPTION_SUBJECTS } from "../constants.js";
import { callAi, parseJSON } from "../lib/api.js";
import { extractPdfPages, groupPagesIntoSheets, keepRatedSheets } from "../lib/pathwaySheets.js";
import { parsePastedPathway, parsePathwayItems } from "../lib/pathwayParser.js";

/* ── Upload screen ────────────────────────────────────────────── */
export function UploadScreen({ onTopicsReady, savedPathway, existingPathways = [] }) {
  const [tab, setTab] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState(null);
  const fileRef = useRef(null);

  function checkDuplicate(subject, topics) {
    const normSubject = (subject || "").trim().toLowerCase();
    const newIds = topics.map((t) => t.id).sort().join(",");
    return existingPathways.some((p) => {
      const existSubject = (p.subject || "").trim().toLowerCase();
      const existIds = (p.topics || []).map((t) => t.id).sort().join(",");
      return existSubject === normSubject && existIds === newIds;
    });
  }

  const EXTRACT_SYSTEM = `EXTRACT ONLY THE JSON OBJECT. NO OTHER TEXT. NO EXPLANATION. NO MARKDOWN CODE FENCES.

You are extracting topics from a GCSE subject pathway document.
The document has topics with numeric IDs (e.g. 1.1, 1.2, 2.1, etc.) and descriptions.
Each topic may have a confidence rating (1=confident, 4=new/unsure) in a column.
The document also contains a "Pathway" number (e.g. "Pathway 1", "Pathway 2", "Pathway 3", "Pathway 4") near the top — usually in the header. Pathway 1 means advanced; Pathway 4 means the student finds the subject difficult.

Respond with ONLY this JSON structure. Nothing else:
{"subject":"Subject Name","pathwayNumber":3,"topics":[{"id":"1.1","description":"description text","parentTitle":"heading","confidence":null}]}

Rules:
- subject: FULL subject name as written in document. Never abbreviate.
- pathwayNumber: the Pathway number (1, 2, 3, or 4) from the document. Look for "Pathway 1" / "Pathway 2" / "Pathway 3" / "Pathway 4" in the header. null if no pathway number found.
- id: numeric topic ID from the document (e.g. "1.1", "2.3")
- description: the topic's description text
- parentTitle: parent section heading (e.g. "Algebra" for topics 1.x). Use SAME parentTitle for same prefix. Empty string if none.
- confidence: 1, 2, 3, 4 integer from rating column. null if no rating or blank.
- Extract ALL sub-topics.

IMPORTANT: Output MUST be valid JSON. No introduction. No explanation. No markdown backticks. Just the JSON object.`;

  const ALL_SUBJECTS = [...CORE_SUBJECTS, ...OPTION_SUBJECTS];
  function normaliseSubject(name) {
    if (!name) return name;
    const lower = name.toLowerCase().trim();
    // Exact match first
    const exact = ALL_SUBJECTS.find((s) => s.toLowerCase() === lower);
    if (exact) return exact;
    // Partial match — find the known subject that CONTAINS the extracted name or vice versa
    const partial = ALL_SUBJECTS.find((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()));
    if (partial) return partial;
    // Keyword fallback — handle cases where the AI returns a shortened/variant name
    const KEYWORD_MAP = [
      { keywords: ["statistic", "further maths", "further math"], subject: "Statistics/Further Maths" },
      { keywords: ["programmable", "programme", "programm"], subject: "Programmable Systems" },
      { keywords: ["computer", "computing", "ict", "c.s"], subject: "Computer Science" },
      { keywords: ["engineering manuf"], subject: "Engineering Manufacture" },
      { keywords: ["engineering"], subject: "Engineering Design" },
      { keywords: ["english lit"], subject: "English Literature" },
      { keywords: ["english lang", "english"], subject: "English Language" },
      { keywords: ["biology", "bio "], subject: "Biology" },
      { keywords: ["chemistry", "chem "], subject: "Chemistry" },
      { keywords: ["physics", "phys "], subject: "Physics" },
      { keywords: ["geography", "geog"], subject: "Geography" },
      { keywords: ["maths", "math"], subject: "Maths" },
    ];
    for (const { keywords, subject } of KEYWORD_MAP) {
      if (keywords.some((k) => lower.includes(k))) return subject;
    }
    return name;
  }

  function finish(data, notice = "") {
    const allTopics = (data.topics || []).filter((t) => t.id && t.description);
    if (!allTopics.length) throw new Error("No topics found. Please check your document.");
    const subject = normaliseSubject(data.subject) || "";
    if (subject && checkDuplicate(subject, allTopics)) throw new Error("This pathway has already been uploaded.");
    const n = data.pathwayNumber;
    setExtracted({ subject, topics: allTopics, notice, pathwayNumber: Number.isInteger(n) && n >= 1 && n <= 4 ? n : null });
  }

  const extractFromText = useCallback(async (text) => {
    setLoading(true); setError("");
    try {
      // Read the pasted table here first; only ask the AI if that finds nothing.
      const local = parsePastedPathway(text);
      if (local.topics.length) { finish(local); }
      else {
        const raw = await callAi({ system: EXTRACT_SYSTEM, user: text, max_tokens: 8192, stage: "material_processing" });
        finish(parseJSON(raw));
      }
    } catch (e) { setError(e.message || "Failed to extract topics."); }
    setLoading(false);
  }, [onTopicsReady, existingPathways]);

  /** Read the PDF's text in the browser. Returns null if no topics could be read. */
  async function readPdfLocally(arrayBuffer) {
    const pages = await extractPdfPages(arrayBuffer);
    const sheets = groupPagesIntoSheets(pages)
      .map((sheet) => ({ ...sheet, data: parsePathwayItems(sheet.pages.flatMap((i) => pages[i])) }))
      .filter((sheet) => sheet.data.topics.length);
    if (!sheets.length) return null;
    // Several filled-in tabs: take the one with the most ratings, and say so.
    const rated = sheets.filter((sh) => sh.ratings > 0);
    const pool = rated.length ? rated : sheets;
    const best = pool.reduce((a, b) => (b.ratings > a.ratings ? b : a));
    const notice = pool.length > 1 ? `Your file had ${pool.length} filled-in sheets. Pip is showing the one with the most ratings. Upload the file again to add another.` : "";
    return { data: best.data, notice };
  }

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setLoading(true); setError("");
    const reader = new FileReader();
    reader.onerror = () => { setError("Could not read the file."); setLoading(false); };
    reader.onload = async (e) => {
      const originalBase64 = e.target.result.split(",")[1];
      try {
        const buffer = await file.arrayBuffer();
        let local = null;
        try { local = await readPdfLocally(buffer); } catch { /* unreadable text layer: fall back to the AI */ }
        if (local) { finish(local.data, local.notice); setLoading(false); return; }
        // Scanned or unusual layout: drop empty sheets, then let the AI read it.
        const { base64 } = await keepRatedSheets(buffer, originalBase64);
        const raw = await callAi({ system: EXTRACT_SYSTEM, user: "Extract all topics and their confidence ratings from this pathway document. Include every sub-topic.", max_tokens: 8192, documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }], stage: "material_processing" });
        finish(parseJSON(raw));
        setLoading(false);
      } catch (e) { setError(e.message || "Failed to extract topics from PDF."); setLoading(false); }
    };
    reader.readAsDataURL(file);
  }, [onTopicsReady, existingPathways]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  if (extracted) {
    return <ConfirmExtraction extracted={extracted} onChange={setExtracted} onConfirm={() => onTopicsReady(extracted)} onRetry={() => { setExtracted(null); setPasteText(""); }} />;
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#1a3a4f", margin: "0 0 8px", letterSpacing: "-1px", lineHeight: 1.1 }}>Pathway Penguin</h1>
        <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7ab3cc", fontSize: 18, margin: 0 }}>Upload your subject pathway and let Pip quiz you!</p>
      </div>

      {/* Saved pathway shortcut */}
      {savedPathway && (
        <div style={{ background: "rgba(91,174,212,0.07)", border: "1.5px solid rgba(91,174,212,0.25)", borderRadius: 18, padding: "16px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 3px" }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{savedPathway.loading ? (savedPathway.subject ? savedPathway.subject : "New pathway") : `Continue: ${savedPathway.subject}`}</p>
              {savedPathway.loading && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }} aria-label="Loading pathway">
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: 0 }}>{savedPathway.loading ? "Processing…" : `${savedPathway.topics.length} topics saved`}</p>
          </div>
          <button onClick={() => onTopicsReady(savedPathway)} style={{ padding: "9px 18px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Continue →
          </button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 26, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1.5px solid rgba(180,220,240,0.35)" }}>
          {["pdf", "text"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "14px", background: tab === t ? "rgba(126,173,216,0.07)" : "white", border: "none", borderBottom: tab === t ? "2.5px solid #7eadd8" : "2.5px solid transparent", cursor: "pointer", fontFamily: FONT, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#4a8cbf" : "#9ac0d8", fontSize: 14, transition: "all 0.2s" }}>
              {t === "pdf" ? "Upload PDF" : "Paste Text"}
            </button>
          ))}
        </div>
        <div style={{ padding: 22 }}>
          {tab === "pdf" ? (
            <div
              onDrop={loading ? undefined : onDrop}
              onDragOver={loading ? undefined : (e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={loading ? undefined : () => setDragging(false)}
              onClick={loading ? undefined : () => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? "#7eadd8" : "rgba(180,220,240,0.55)"}`, borderRadius: 18, padding: "40px 20px", textAlign: "center", cursor: loading ? "default" : "pointer", background: dragging ? "rgba(126,173,216,0.05)" : "rgba(220,240,250,0.12)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Pip size={80} />
              {loading ? (
                <div style={{ display: "flex", gap: 6 }}>
                  {[0,1,2].map((i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7ab3cc", margin: 0, fontSize: 14 }}>
                  {dragging ? "Drop it here!" : "Drag & drop your pathway PDF or click to browse"}
                </p>
              )}
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your pathway document text here… Topics with confidence ratings 1–4 will be extracted automatically."
                style={{ width: "100%", height: 170, padding: 13, borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
              <button onClick={() => extractFromText(pasteText)} disabled={!pasteText.trim() || loading}
                style={{ padding: "13px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed", opacity: pasteText.trim() && !loading ? 1 : 0.5 }}>
                Extract Topics →
              </button>
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: 0 }}>Extracting topics…</p>
                </div>
              )}
            </div>
          )}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

/* ── Confirm what the AI found before anything is saved ───────── */
function ConfirmExtraction({ extracted, onChange, onConfirm, onRetry }) {
  const [showMissing, setShowMissing] = useState(false);
  const { subject, topics, pathwayNumber } = extracted;
  const labelStyle = { display: "block", fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", marginBottom: 6 };
  const fieldStyle = { width: "100%", padding: "12px 14px", borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: FONT, fontSize: 15, color: "#1a3a4f", boxSizing: "border-box", minHeight: 48, background: "white" };
  const ALL = [...CORE_SUBJECTS, ...OPTION_SUBJECTS];

  function confirm() {
    if (!pathwayNumber) { setShowMissing(true); return; }
    onConfirm();
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#1a3a4f", margin: "0 0 6px" }}>Is this right?</h1>
      <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 15, margin: "0 0 18px" }}>Check what Pip found. Fix anything that's wrong. Nothing is saved yet.</p>
      <div style={{ background: "white", borderRadius: 22, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="cx-subject" style={labelStyle}>Subject</label>
          <input id="cx-subject" type="text" list="cx-subjects" value={subject} onChange={(e) => onChange({ ...extracted, subject: e.target.value })} style={fieldStyle} />
          <datalist id="cx-subjects">{ALL.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label htmlFor="cx-pathway" style={labelStyle}>Pathway number</label>
          <select id="cx-pathway" value={pathwayNumber ?? ""} aria-describedby="cx-pathway-err" onChange={(e) => { setShowMissing(false); onChange({ ...extracted, pathwayNumber: e.target.value ? Number(e.target.value) : null }); }} style={fieldStyle}>
            <option value="">I couldn't find it. Pick yours</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Pathway {n}</option>)}
          </select>
          {!pathwayNumber && (
            <p id="cx-pathway-err" style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: showMissing ? "#b03030" : "#7ab3cc", margin: "6px 0 0" }}>
              Pip couldn't see a pathway number on your sheet. It's usually at the top of the page, like "Pathway 3".
            </p>
          )}
        </div>
        {extracted.notice && <p style={{ fontFamily: FONT, fontSize: 13, color: "#2f86b3", margin: 0 }}>{extracted.notice}</p>}
        <div>
          <p style={{ ...labelStyle, marginBottom: 8 }}>{topics.length} topic{topics.length === 1 ? "" : "s"} found</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 280, overflowY: "auto", border: "1.5px solid rgba(180,220,240,0.4)", borderRadius: 14 }}>
            {topics.map((t) => (
              <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid rgba(180,220,240,0.25)", fontFamily: FONT, fontSize: 13, color: "#1a3a4f" }}>
                <span style={{ fontWeight: 800, color: "#2f86b3", minWidth: 34 }}>{t.id}</span>
                <span style={{ flex: 1 }}>{t.description}</span>
                <span title="Your confidence rating" style={{ background: "rgba(91,174,212,0.12)", color: "#2f86b3", borderRadius: 99, padding: "2px 9px", fontWeight: 700, fontSize: 12 }}>{t.confidence ?? "–"}</span>
                <button type="button" aria-label={`Remove topic ${t.id}`} onClick={() => onChange({ ...extracted, topics: topics.filter((x) => x.id !== t.id) })} style={{ background: "none", border: "none", color: "#b03030", fontSize: 18, cursor: "pointer", minWidth: 32, minHeight: 32 }}>×</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button onClick={confirm} disabled={!subject.trim() || !topics.length} style={{ padding: "14px 26px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 800, fontSize: 16, cursor: subject.trim() && topics.length ? "pointer" : "not-allowed", opacity: subject.trim() && topics.length ? 1 : 0.5 }}>Yes, save and continue</button>
          <button onClick={onRetry} style={{ background: "none", border: "none", color: "#7ab3cc", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 44 }}>Try a different file</button>
        </div>
      </div>
    </div>
  );
}
