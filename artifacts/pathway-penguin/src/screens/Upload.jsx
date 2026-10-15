import { useState, useRef, useCallback } from "react";
import { ErrorBox, Pip } from "../components/common.jsx";
import { CORE_SUBJECTS, FONT, OPTION_SUBJECTS } from "../constants.js";
import { callClaude, parseJSON } from "../lib/api.js";

/* ── Upload screen ────────────────────────────────────────────── */
export function UploadScreen({ onTopicsReady, onExtractionStarted, savedPathway, existingPathways = [] }) {
  const [tab, setTab] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    // Keyword fallback — handle cases where Claude returns a shortened/variant name
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

  const extractFromText = useCallback(async (text) => {
    onExtractionStarted?.();
    setLoading(true); setError("");
    try {
      const raw = await callClaude({ system: EXTRACT_SYSTEM, user: text, max_tokens: 8192, model: "gemini", stage: "material_processing" });
      const data = parseJSON(raw);
      const allTopics = (data.topics || []).filter((t) => t.id && t.description);
      if (!allTopics.length) throw new Error("No topics found. Please check your document.");
      const subject = normaliseSubject(data.subject);
      if (checkDuplicate(subject, allTopics)) throw new Error("This pathway has already been uploaded.");
      onTopicsReady({ subject, topics: allTopics, pathwayNumber: data.pathwayNumber ?? null });
    } catch (e) { setError(e.message || "Failed to extract topics."); }
    setLoading(false);
  }, [onTopicsReady, existingPathways]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    onExtractionStarted?.();
    setLoading(true); setError("");
    const reader = new FileReader();
    reader.onerror = () => { setError("Could not read the file."); setLoading(false); };
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const raw = await callClaude({ system: EXTRACT_SYSTEM, user: "Extract all topics and their confidence ratings from this pathway document. Include every sub-topic.", max_tokens: 8192, documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }], model: "gemini", stage: "material_processing" });
        const data = parseJSON(raw);
        const allTopics = (data.topics || []).filter((t) => t.id && t.description);
        if (!allTopics.length) throw new Error("No topics found in the PDF.");
        const subject = normaliseSubject(data.subject);
        if (checkDuplicate(subject, allTopics)) throw new Error("This pathway has already been uploaded.");
        onTopicsReady({ subject, topics: allTopics, pathwayNumber: data.pathwayNumber ?? null });
      } catch (e) { setError(e.message || "Failed to extract topics from PDF."); setLoading(false); }
    };
    reader.readAsDataURL(file);
  }, [onTopicsReady, existingPathways]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

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
