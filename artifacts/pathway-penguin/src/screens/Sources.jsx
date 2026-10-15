import { useState, useRef, useEffect } from "react";
import { Pip } from "../components/common.jsx";
import { FONT } from "../constants.js";
import { callApi, callClaude, parseJSON } from "../lib/api.js";
import { extractPdfText } from "../lib/sources.js";

/* ── Sources screen — attach past papers/notes to pathways ────── */
export function SourcesScreen({ pathways, onRequestUpload, onSourcesChanged, onStartSourceQuiz }) {
  const [selectedPathwayId, setSelectedPathwayId] = useState(() => pathways[0]?.id ?? null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("text"); // "text" | "pdf"
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [pdfPreview, setPdfPreview] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfPageCount, setPdfPageCount] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewingSourceId, setViewingSourceId] = useState(null);
  const [sourceQuizzes, setSourceQuizzes] = useState([]);
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const fileInputRef = useRef(null);

  const viewingSource = sources.find((s) => s.id === viewingSourceId) || null;

  const selectedPathway = pathways.find((p) => p.id === selectedPathwayId) || null;

  // Keep selection valid as pathways list changes.
  useEffect(() => {
    if (!pathways.length) { setSelectedPathwayId(null); return; }
    if (!pathways.find((p) => p.id === selectedPathwayId)) {
      setSelectedPathwayId(pathways[0].id);
    }
  }, [pathways, selectedPathwayId]);

  // Load sources whenever the selected pathway changes.
  useEffect(() => {
    if (!selectedPathwayId) { setSources([]); return; }
    setLoading(true);
    callApi(`/api/sources?pathwayId=${selectedPathwayId}`)
      .then((d) => { setSources(Array.isArray(d.sources) ? d.sources : []); })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, [selectedPathwayId]);

  // Load source quizzes whenever the selected pathway changes.
  useEffect(() => {
    if (!selectedPathwayId) { setSourceQuizzes([]); return; }
    callApi(`/api/source-quizzes?pathwayId=${selectedPathwayId}`)
      .then((d) => setSourceQuizzes(Array.isArray(d.quizzes) ? d.quizzes : []))
      .catch(() => setSourceQuizzes([]));
  }, [selectedPathwayId]);

  function resetForm() {
    setName(""); setText(""); setPdfPreview(""); setPdfText(""); setPdfFileName("");
    setPdfPageCount(null);
    setFormError(""); setFormMode("text");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePdfFile(file) {
    if (!file) return;
    if (!file.type.includes("pdf")) { setFormError("Please choose a PDF file."); return; }
    setFormError(""); setExtracting(true); setPdfPreview(""); setPdfText(""); setPdfPageCount(null); setPdfFileName(file.name);
    try {
      const { text: extracted, pageCount } = await extractPdfText(file);
      if (!extracted || extracted.length < 20) {
        setFormError("Couldn't extract any readable text from this PDF. It might be scanned images. Try pasting the text instead.");
      } else {
        setPdfText(extracted);
        setPdfPageCount(pageCount);
        setPdfPreview(extracted.slice(0, 240) + (extracted.length > 240 ? "…" : ""));
        if (!name.trim()) setName(file.name.replace(/\.pdf$/i, ""));
      }
    } catch (err) {
      setFormError(err?.message || "Failed to read the PDF.");
    } finally { setExtracting(false); }
  }

  async function handleSave() {
    if (!selectedPathwayId) { setFormError("Pick a pathway first."); return; }
    if (!name.trim()) { setFormError("Give this source a name."); return; }
    const content = formMode === "pdf" ? pdfText : text.trim();
    if (!content) { setFormError(formMode === "pdf" ? "Upload a PDF before saving." : "Paste some text first."); return; }
    setSaving(true); setFormError("");
    try {
      const body = { pathwayId: selectedPathwayId, name: name.trim(), content };
      if (formMode === "pdf") {
        body.sourceType = "pdf";
        body.originalFilename = pdfFileName || null;
        body.pageCount = pdfPageCount || null;
      } else {
        body.sourceType = "text";
      }
      const r = await callApi("/api/sources", { method: "POST", body });
      if (!r.ok) throw new Error("Failed");
      // Prefer the canonical mapped source from the server (handles things
      // like server-side content truncation); fall back to local reconstruction.
      const newSource = r.source ?? {
        id: r.id,
        pathwayId: selectedPathwayId,
        name: name.trim(),
        content,
        sourceType: body.sourceType,
        originalFilename: body.originalFilename ?? null,
        pageCount: body.pageCount ?? null,
        createdAt: r.createdAt,
        updatedAt: null,
      };
      setSources((prev) => [...prev, newSource]);
      resetForm(); setShowForm(false);
      // Notify parent so the in-memory pathway list refreshes — the server cleared
      // this pathway's cached questions so the next quiz start will regenerate.
      onSourcesChanged?.();
    } catch (err) {
      setFormError(err?.message || "Failed to save source.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    const prev = sources;
    setSources((s) => s.filter((x) => x.id !== id));
    try {
      await callApi(`/api/sources/${id}`, { method: "DELETE" });
      onSourcesChanged?.();
    } catch { setSources(prev); }
  }

  async function handleUpdateSource(id, { name: newName, content: newContent }) {
    const body = {};
    if (typeof newName === "string") body.name = newName;
    if (typeof newContent === "string") body.content = newContent;
    const r = await callApi(`/api/sources/${id}`, { method: "PATCH", body });
    if (!r.ok) throw new Error(r.error || "Failed to save changes.");
    setSources((s) => s.map((x) => x.id === id ? { ...x, ...r.source } : x));
    if (typeof newContent === "string") onSourcesChanged?.();
    return r.source;
  }

  const labelStyle = { fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(126,173,216,0.4)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", boxSizing: "border-box", outline: "none", background: "white" };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#1a3a4f", margin: "0 0 4px" }}>Sources</h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: 0 }}>Paste past-paper text or upload PDFs and attach them to a pathway. Quizzes for that pathway will be based on these sources whenever the topic appears in them.</p>
      </div>

      {pathways.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 18, border: "1.5px solid rgba(180,220,240,0.4)" }}>
          <Pip size={70} />
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: "#7ab3cc", margin: "16px 0 18px" }}>You need a pathway before you can attach sources to it.</p>
          <button onClick={onRequestUpload}
            style={{ padding: "10px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Upload a pathway
          </button>
        </div>
      ) : (
        <>
          {/* Pathway selector */}
          <div style={{ background: "white", borderRadius: 18, border: "1.5px solid rgba(180,220,240,0.4)", padding: "18px 22px", marginBottom: 18, boxShadow: "0 2px 16px rgba(91,174,212,0.06)" }}>
            <label style={labelStyle}>Pathway</label>
            <select
              value={selectedPathwayId ?? ""}
              onChange={(e) => setSelectedPathwayId(Number(e.target.value))}
              style={inputStyle}
            >
              {pathways.map((p) => (
                <option key={p.id} value={p.id}>{p.subject}{p.examBoard ? ` — ${p.examBoard}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Sources list */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", margin: 0 }}>
              {selectedPathway ? `Sources for ${selectedPathway.subject}` : "Sources"} ({sources.length})
            </p>
            <button onClick={() => { setShowForm((o) => !o); if (showForm) resetForm(); }}
              style={{ padding: "9px 18px", borderRadius: 12, background: showForm ? "rgba(91,174,212,0.1)" : "linear-gradient(135deg,#7eadd8,#5baed4)", border: showForm ? "1.5px solid rgba(91,174,212,0.3)" : "none", color: showForm ? "#5baed4" : "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {showForm ? "Cancel" : "+ Add source"}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div style={{ background: "white", borderRadius: 18, border: "1.5px solid rgba(126,173,216,0.35)", padding: "22px 24px", marginBottom: 20, boxShadow: "0 2px 16px rgba(91,174,212,0.08)" }}>
              <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: "#1a3a4f", margin: "0 0 18px" }}>New source</p>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2023 AQA Paper 1" style={inputStyle} />
              </div>

              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["text", "pdf"].map((mode) => {
                  const active = formMode === mode;
                  return (
                    <button key={mode} type="button" onClick={() => { setFormMode(mode); setFormError(""); }}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: active ? "2px solid #5baed4" : "1.5px solid rgba(126,173,216,0.4)", background: active ? "rgba(91,174,212,0.1)" : "white", color: active ? "#5baed4" : "#6a8fa8", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {mode === "text" ? "Paste text" : "Upload PDF"}
                    </button>
                  );
                })}
              </div>

              {formMode === "text" ? (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Source text</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Paste the past paper, mark scheme, or revision notes here…"
                    style={{ ...inputStyle, fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 13, lineHeight: 1.5, resize: "vertical", minHeight: 200 }} />
                  <p style={{ fontFamily: FONT, fontSize: 11, color: "#9ac0d8", margin: "6px 2px 0" }}>{text.length.toLocaleString()} characters</p>
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>PDF file</label>
                  <input ref={fileInputRef} type="file" accept="application/pdf" onChange={(e) => handlePdfFile(e.target.files?.[0])}
                    style={{ ...inputStyle, padding: "9px 12px", cursor: "pointer" }} />
                  {extracting && <p style={{ fontFamily: FONT, fontSize: 12, color: "#7ab3cc", margin: "8px 2px 0" }}>Extracting text from {pdfFileName}…</p>}
                  {!extracting && pdfPreview && (
                    <div style={{ background: "rgba(91,174,212,0.07)", border: "1px solid rgba(126,173,216,0.3)", borderRadius: 10, padding: "10px 14px", marginTop: 10 }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#5baed4", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview · {pdfText.length.toLocaleString()} characters extracted</p>
                      <p style={{ fontFamily: FONT, fontSize: 12.5, color: "#1a3a4f", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{pdfPreview}</p>
                    </div>
                  )}
                </div>
              )}

              {formError && <p style={{ fontFamily: FONT, fontSize: 13, color: "#d04545", margin: "0 0 12px" }}>{formError}</p>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => { setShowForm(false); resetForm(); }} disabled={saving}
                  style={{ padding: "10px 20px", borderRadius: 12, background: "rgba(91,174,212,0.1)", border: "1.5px solid rgba(91,174,212,0.3)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || extracting}
                  style={{ padding: "10px 22px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save source"}
                </button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div style={{ display: "flex", gap: 7, padding: "20px 0" }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          ) : sources.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "white", borderRadius: 18, border: "1.5px dashed rgba(180,220,240,0.6)" }}>
              <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: "#7ab3cc", margin: 0 }}>No sources yet for this pathway. Add a past paper or some revision notes to ground future quizzes in real exam material.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sources.map((s) => {
                const isPdf = s.sourceType === "pdf";
                const qCount = Number(s.questionCount ?? 0);
                const qLabel = `${qCount} question${qCount === 1 ? "" : "s"} generated`;
                const baseMeta = isPdf
                  ? `PDF · ${s.pageCount ? `${s.pageCount} page${s.pageCount === 1 ? "" : "s"} · ` : ""}${(s.content?.length ?? 0).toLocaleString()} characters`
                  : `${(s.content?.length ?? 0).toLocaleString()} characters`;
                const meta = `${baseMeta} · ${qLabel}`;
                return (
                  <div
                    key={s.id}
                    onClick={() => setViewingSourceId(s.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewingSourceId(s.id); } }}
                    style={{ background: "white", borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.4)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(91,174,212,0.55)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(91,174,212,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(180,220,240,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: "#1a3a4f", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                      <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: 0 }}>{meta}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      title="Delete source"
                      style={{ padding: "7px 14px", borderRadius: 10, background: "none", border: "1.5px solid rgba(208,69,69,0.35)", color: "#d04545", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {/* ── Source Quizzes subsection ──────────────────────── */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", margin: "0 0 3px" }}>Source Quizzes</p>
                <p style={{ fontFamily: FONT, fontSize: 12, color: "#7ab3cc", margin: 0 }}>Quizzes generated purely from your uploaded source material</p>
              </div>
              <button
                onClick={() => setShowQuizGenerator(true)}
                disabled={sources.length === 0}
                title={sources.length === 0 ? "Add at least one source first" : "Generate a quiz from your sources"}
                style={{ padding: "9px 18px", borderRadius: 12, background: sources.length === 0 ? "rgba(91,174,212,0.3)" : "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: sources.length === 0 ? "not-allowed" : "pointer", flexShrink: 0 }}>
                + Generate quiz
              </button>
            </div>
            {sourceQuizzes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 20px", background: "white", borderRadius: 18, border: "1.5px dashed rgba(180,220,240,0.6)" }}>
                <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#7ab3cc", margin: 0 }}>
                  {sources.length === 0
                    ? "Add a source first, then generate a quiz from it."
                    : "No source quizzes yet. Hit \"Generate quiz\" to create one from your sources."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sourceQuizzes.map((sq) => {
                  const qCount = Array.isArray(sq.questions) ? sq.questions.length : 0;
                  const srcNames = (sq.sourceIds || [])
                    .map((id) => sources.find((s) => s.id === id)?.name)
                    .filter(Boolean);
                  const date = sq.createdAt ? new Date(sq.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
                  return (
                    <div key={sq.id} style={{ background: "white", borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.4)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: "#1a3a4f", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sq.name}</p>
                        <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: 0 }}>
                          {qCount} question{qCount !== 1 ? "s" : ""}
                          {srcNames.length > 0 ? ` · ${srcNames.join(", ")}` : " · source deleted"}
                          {date ? ` · ${date}` : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            const qs = Array.isArray(sq.questions) ? sq.questions : [];
                            const tops = qs.map((q, i) => ({ id: q.topicId || `SQ-${i + 1}`, description: q.question?.slice(0, 70) || `Question ${i + 1}`, confidence: null }));
                            const srcs = (sq.sourceIds || []).map((id) => sources.find((s) => s.id === id)).filter(Boolean);
                            onStartSourceQuiz?.({ questions: qs, topics: tops, sources: srcs, name: sq.name, pathwayId: selectedPathwayId });
                          }}
                          style={{ padding: "7px 16px", borderRadius: 10, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          Take Quiz
                        </button>
                        <button
                          onClick={async () => {
                            const sqId = sq.id;
                            setSourceQuizzes((prev) => prev.filter((x) => x.id !== sqId));
                            try { await callApi(`/api/source-quizzes/${sqId}`, { method: "DELETE" }); }
                            catch { callApi(`/api/source-quizzes?pathwayId=${selectedPathwayId}`).then((d) => setSourceQuizzes(Array.isArray(d.quizzes) ? d.quizzes : [])).catch(() => {}); }
                          }}
                          style={{ padding: "7px 14px", borderRadius: 10, background: "none", border: "1.5px solid rgba(208,69,69,0.35)", color: "#d04545", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showQuizGenerator && (
        <SourceQuizGeneratorModal
          sources={sources}
          pathwayId={selectedPathwayId}
          onClose={() => setShowQuizGenerator(false)}
          onGenerated={(quiz) => {
            setSourceQuizzes((prev) => [quiz, ...prev]);
            setShowQuizGenerator(false);
          }}
        />
      )}

      {viewingSource && (
        <SourceViewerModal
          key={viewingSource.id}
          source={viewingSource}
          onClose={() => setViewingSourceId(null)}
          onSave={(payload) => handleUpdateSource(viewingSource.id, payload)}
        />
      )}
    </div>
  );
}

/* ── Source quiz generator modal ───────────────────────────────── */
export function SourceQuizGeneratorModal({ sources, pathwayId, onClose, onGenerated }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(sources.map((s) => s.id)));
  const [quizName, setQuizName] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const selectedSources = sources.filter((s) => selectedIds.has(s.id));

  function toggleSource(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (selectedSources.length === 0) { setError("Select at least one source."); return; }
    const name = quizName.trim() || `Source Quiz – ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    setGenerating(true); setError(""); setProgress("Preparing source material…");
    try {
      // Build a budget-capped source text from all selected sources.
      const BUDGET = 14000;
      const SEP = "\n\n---\n\n";
      const parts = [];
      const usedIds = [];
      const usedExcerpts = [];
      let remaining = BUDGET;
      for (let i = 0; i < selectedSources.length; i++) {
        const s = selectedSources[i];
        const overhead = `[Source: ${s.name}]\n`.length + (i > 0 ? SEP.length : 0);
        const take = Math.min((s.content || "").length, remaining - overhead);
        if (take <= 0) break;
        parts.push(`[Source: ${s.name}]\n${(s.content || "").slice(0, take)}`);
        usedIds.push(s.id);
        usedExcerpts.push({ id: s.id, start: 0, end: take });
        remaining -= overhead + take;
      }
      if (!parts.length) { setError("Selected sources have no readable content."); setGenerating(false); return; }

      setProgress(`Generating ${questionCount} questions…`);
      const sourceText = parts.join(SEP);
      const system = `You are generating GCSE exam questions based purely on source material. Generate exactly ${questionCount} questions. Every question MUST be grounded in facts, data, and concepts explicitly present in the source material provided — do not add outside knowledge. Vary question types and difficulty appropriately for GCSE level.
Return ONLY a valid JSON array with no markdown or explanation:
[{"question":"...","marks":2,"answer":"model answer text","steps":["step 1","step 2"],"partAnswers":null,"traceTable":null,"graph":null,"chartData":null}]`;
      const user = `SOURCE MATERIAL:\n${sourceText}\n\nGenerate exactly ${questionCount} GCSE exam questions based on this material.`;

      const raw = await callClaude({ system, user, max_tokens: 4096, model: "gemini", stage: "question_generation" });
      const parsed = parseJSON(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No questions were generated. Please try again.");

      const questions = parsed.slice(0, questionCount).map((q, i) => ({
        topicId: `SQ-${i + 1}`,
        number: i + 1,
        sourceIds: usedIds,
        sourceExcerpts: usedExcerpts,
        question: q.question || "",
        marks: typeof q.marks === "number" ? q.marks : 2,
        answer: q.answer || "",
        steps: Array.isArray(q.steps) ? q.steps : [],
        partAnswers: q.partAnswers ?? null,
        traceTable: q.traceTable ?? null,
        graph: q.graph ?? null,
        chartData: q.chartData ?? null,
      }));

      setProgress("Saving quiz…");
      const r = await callApi("/api/source-quizzes", {
        method: "POST",
        body: { pathwayId, name, sourceIds: usedIds, questions },
      });
      if (!r.ok) throw new Error(r.error || "Failed to save the quiz.");
      onGenerated(r.quiz);
    } catch (err) {
      setError(err?.message || "Generation failed. Please try again.");
    } finally { setGenerating(false); setProgress(""); }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !generating) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(26,58,79,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1050 }}>
      <div style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(26,58,79,0.3)", padding: "28px 28px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "#1a3a4f", margin: "0 0 4px" }}>Generate Source Quiz</h3>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: 0 }}>Create a practice quiz purely from your uploaded sources</p>
          </div>
          <button onClick={onClose} disabled={generating}
            style={{ padding: "6px 12px", borderRadius: 10, background: "rgba(91,174,212,0.1)", border: "1.5px solid rgba(91,174,212,0.3)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* Quiz name */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Quiz name (optional)</label>
          <input value={quizName} onChange={(e) => setQuizName(e.target.value)} placeholder="e.g. AQA Paper 1 Practice"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(126,173,216,0.4)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", boxSizing: "border-box", outline: "none" }} />
        </div>

        {/* Question count */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Number of questions</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[5, 10, 15, 20].map((n) => (
              <button key={n} onClick={() => setQuestionCount(n)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: questionCount === n ? "2px solid #5baed4" : "1.5px solid rgba(126,173,216,0.4)", background: questionCount === n ? "rgba(91,174,212,0.1)" : "white", color: questionCount === n ? "#5baed4" : "#6a8fa8", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Source selection */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
            Sources to include ({selectedSources.length}/{sources.length} selected)
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sources.map((s) => {
              const checked = selectedIds.has(s.id);
              return (
                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${checked ? "rgba(91,174,212,0.5)" : "rgba(180,220,240,0.4)"}`, background: checked ? "rgba(91,174,212,0.06)" : "white", cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleSource(s.id)}
                    style={{ width: 16, height: 16, accentColor: "#5baed4", cursor: "pointer", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: "#1a3a4f", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                    <p style={{ fontFamily: FONT, fontSize: 11, color: "#9ac0d8", margin: 0 }}>
                      {(s.content?.length || 0).toLocaleString()} chars{s.sourceType === "pdf" ? " · PDF" : ""}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && <p style={{ fontFamily: FONT, fontSize: 13, color: "#d04545", margin: "0 0 16px" }}>{error}</p>}
        {generating && progress && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid #daeefa", borderTopColor: "#5baed4", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#5baed4", margin: 0 }}>{progress}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={generating}
            style={{ padding: "10px 20px", borderRadius: 12, background: "rgba(91,174,212,0.1)", border: "1.5px solid rgba(91,174,212,0.3)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={generating || selectedSources.length === 0}
            style={{ padding: "10px 22px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: (generating || selectedSources.length === 0) ? "not-allowed" : "pointer", opacity: (generating || selectedSources.length === 0) ? 0.7 : 1 }}>
            {generating ? "Generating…" : "Generate Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Source viewer / editor modal ─────────────────────────────── */
export function SourceViewerModal({ source, onClose, onSave }) {
  const [name, setName] = useState(source.name);
  const [content, setContent] = useState(source.content || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // If the upstream source object updates (e.g. after a successful save in
  // this same modal), keep our drafts in sync when we're not actively editing.
  useEffect(() => {
    if (!editing) {
      setName(source.name);
      setContent(source.content || "");
    }
  }, [source.id, source.name, source.content, editing]);

  const isPdf = source.sourceType === "pdf";
  const dirty = editing && (name.trim() !== source.name || content !== (source.content || ""));

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    if (!content.trim()) { setError("Source content cannot be empty."); return; }
    setSaving(true);
    try {
      const payload = {};
      if (name.trim() !== source.name) payload.name = name.trim();
      if (content !== (source.content || "")) payload.content = content;
      if (Object.keys(payload).length === 0) { setEditing(false); setSaving(false); return; }
      await onSave(payload);
      setEditing(false);
    } catch (err) {
      setError(err?.message || "Failed to save changes.");
    } finally { setSaving(false); }
  }

  function handleCancelEdit() {
    setName(source.name);
    setContent(source.content || "");
    setError("");
    setEditing(false);
  }

  function requestClose() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) requestClose();
  }

  const labelStyle = { fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(126,173,216,0.4)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", boxSizing: "border-box", outline: "none", background: "white" };

  return (
    <div
      onClick={handleBackdropClick}
      style={{ position: "fixed", inset: 0, background: "rgba(26,58,79,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}
    >
      <div style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 760, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(26,58,79,0.3)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(180,220,240,0.5)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editing ? (
                <>
                  <label style={labelStyle}>Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Source name" />
                </>
              ) : (
                <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "#1a3a4f", margin: 0, wordBreak: "break-word" }}>{source.name}</h3>
              )}
            </div>
            <button onClick={requestClose} title="Close"
              style={{ padding: "6px 12px", borderRadius: 10, background: "rgba(91,174,212,0.1)", border: "1.5px solid rgba(91,174,212,0.3)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>
              ×
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontFamily: FONT, fontSize: 12, color: "#7ab3cc" }}>
            {isPdf && (
              <span style={{ background: "rgba(91,174,212,0.12)", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>PDF</span>
            )}
            {isPdf && source.originalFilename && (
              <span style={{ background: "rgba(91,174,212,0.08)", padding: "3px 10px", borderRadius: 999, color: "#1a3a4f" }} title={source.originalFilename}>
                {source.originalFilename}
              </span>
            )}
            {isPdf && source.pageCount ? (
              <span style={{ background: "rgba(91,174,212,0.08)", padding: "3px 10px", borderRadius: 999, color: "#1a3a4f" }}>
                {source.pageCount} page{source.pageCount === 1 ? "" : "s"}
              </span>
            ) : null}
            <span style={{ background: "rgba(91,174,212,0.08)", padding: "3px 10px", borderRadius: 999, color: "#1a3a4f" }}>
              {(content?.length ?? 0).toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 24px", overflow: "auto", flex: 1, minHeight: 0 }}>
          {editing ? (
            <>
              <label style={labelStyle}>Extracted text</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ ...inputStyle, fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 13, lineHeight: 1.5, resize: "vertical", minHeight: 360, whiteSpace: "pre-wrap" }}
                spellCheck={false}
              />
              {isPdf && (
                <p style={{ fontFamily: FONT, fontSize: 12, color: "#7ab3cc", margin: "8px 2px 0" }}>
                  PDF extraction can miss equations, tables, and scanned text. Edit anything that looks wrong before saving.
                </p>
              )}
            </>
          ) : (
            <pre style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 13, lineHeight: 1.6, color: "#1a3a4f", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {source.content || ""}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px 18px", borderTop: "1px solid rgba(180,220,240,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {error && <p style={{ fontFamily: FONT, fontSize: 13, color: "#d04545", margin: 0 }}>{error}</p>}
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {editing ? (
              <>
                <button onClick={handleCancelEdit} disabled={saving}
                  style={{ padding: "9px 18px", borderRadius: 12, background: "rgba(91,174,212,0.1)", border: "1.5px solid rgba(91,174,212,0.3)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: "9px 22px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                style={{ padding: "9px 22px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
