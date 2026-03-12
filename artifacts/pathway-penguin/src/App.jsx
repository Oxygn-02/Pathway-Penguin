import { useState, useRef, useEffect, useCallback } from "react";

const FONT = "'Nunito', -apple-system, system-ui, sans-serif";
const CONFIDENCE_LABELS = { 1: "Refresher", 2: "Consolidate", 3: "Needs Help", 4: "New Topic" };

function callClaude({ system, user, max_tokens = 4096, documents = [] }) {
  return fetch("/api/ai/message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, user, max_tokens, documents }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.error) throw new Error(d.error || "API error");
      return d.text;
    });
}

function parseJSON(raw) {
  return JSON.parse(raw.replace(/```json\s*|```/g, "").trim());
}

/* run at most `size` promises at a time */
async function batchedMap(arr, size, fn) {
  const results = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

/* ── Pip image ────────────────────────────────────────────────────── */
function Pip({ size = 60 }) {
  return (
    <img src="/pip.png" alt="Pip the penguin"
      style={{ width: size, height: "auto", display: "block", flexShrink: 0 }} />
  );
}

/* ── Question text renderer ──────────────────────────────────────── */
function QuestionText({ text }) {
  const parts = text.split(/(?=\n\d+[.)]\s|\n[a-z][)]\s)/i);
  if (parts.length <= 1) {
    return (
      <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 16, color: "#1a3a4f", lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {parts.map((part, i) => {
        const trimmed = part.replace(/^\n/, "").trim();
        if (!trimmed) return null;
        const isPoint = /^\d+[.)]\s|^[a-z][)]\s/i.test(trimmed);
        return (
          <p key={i} style={{ fontFamily: FONT, fontWeight: isPoint ? 400 : 500, fontSize: isPoint ? 14.5 : 16, color: isPoint ? "#2d5a7a" : "#1a3a4f", lineHeight: 1.6, margin: 0 }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

/* ── Trace table ─────────────────────────────────────────────────── */
function TraceTable({ headers, initialRows, disabled, onChange }) {
  const [cells, setCells] = useState(() =>
    initialRows.map((row) => row.map((v) => (v === null || v === undefined ? "" : String(v))))
  );

  function update(ri, ci, val) {
    setCells((prev) => {
      const next = prev.map((r) => [...r]);
      next[ri][ci] = val;
      onChange(next);
      return next;
    });
  }

  const cellStyle = {
    border: "1.5px solid rgba(126,173,216,0.35)",
    padding: "6px 8px",
    minWidth: 72,
    fontFamily: FONT,
    fontSize: 13,
    color: "#1a3a4f",
    background: "white",
  };
  const inputStyle = {
    width: "100%",
    border: "none",
    outline: "none",
    fontFamily: FONT,
    fontSize: 13,
    color: "#1a3a4f",
    background: "transparent",
    padding: 0,
  };

  return (
    <div style={{ overflowX: "auto", marginTop: 14, marginBottom: 4 }}>
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", marginBottom: 7 }}>
        Trace Table — fill in each cell
      </p>
      <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ ...cellStyle, background: "rgba(126,173,216,0.1)", fontWeight: 700, fontSize: 12, color: "#4a8cbf", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, ri) => (
            <tr key={ri}>
              {row.map((val, ci) => (
                <td key={ci} style={cellStyle}>
                  {disabled ? (
                    <span>{val}</span>
                  ) : (
                    <input
                      value={val}
                      onChange={(e) => update(ri, ci, e.target.value)}
                      style={inputStyle}
                      placeholder="…"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Step dots ───────────────────────────────────────────────────── */
function StepDots({ stage }) {
  const stages = ["upload", "quiz", "results"];
  const idx = Math.max(0, stages.indexOf(stage));
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
      {stages.map((_, i) => (
        <div key={i} style={{ height: 7, width: i === idx ? 22 : 7, borderRadius: 4, background: i === idx ? "#7eadd8" : "#c8dff0", transition: "all 0.3s" }} />
      ))}
    </div>
  );
}

/* ── Error box ───────────────────────────────────────────────────── */
function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: "rgba(220,100,100,0.08)", border: "1.5px solid rgba(220,100,100,0.25)", borderRadius: 14, padding: "11px 15px", color: "#b03030", fontSize: 14, fontFamily: FONT, marginTop: 12 }}>
      {message}
    </div>
  );
}

/* ── Loading screen ──────────────────────────────────────────────── */
function LoadingScreen({ progress, total }) {
  const pct = total > 0 ? progress / total : 0;
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 50 }}>
      <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
        <source src="/loading-bg.mp4" type="video/mp4" />
      </video>
      <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", textAlign: "center", zIndex: 10, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderRadius: 24, padding: "20px 40px", boxShadow: "0 4px 28px rgba(91,174,212,0.18)", minWidth: 280, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Pip size={56} />
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: "#1a3a4f", margin: "10px 0 3px" }}>
          {progress === 0 ? "Pip is reading your pathway…" : progress < total ? "Generating questions…" : "Almost ready! ❄️"}
        </p>
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: "#7ab3cc", margin: "0 0 13px" }}>{progress} of {total} done</p>
        <div style={{ width: 210, height: 5, background: "#ddeefa", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Speech bubble ───────────────────────────────────────────────── */
function SpeechBubble({ loading, correct, partial, feedback }) {
  const text = loading ? null
    : correct ? `Waddle waddle — nailed it! 🐧 ${feedback}`
    : partial ? `Almost there! Some parts were right. ${feedback}`
    : `Not quite! ${feedback}`;
  const bg = loading ? "#f0f8ff"
    : correct ? "rgba(60,186,140,0.07)"
    : partial ? "rgba(240,180,30,0.08)"
    : "rgba(220,100,100,0.07)";
  const border = loading ? "#c8dff0"
    : correct ? "rgba(60,186,140,0.3)"
    : partial ? "rgba(240,180,30,0.4)"
    : "rgba(220,100,100,0.3)";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18 }}>
      <Pip size={46} />
      <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: "16px 16px 16px 5px", padding: "13px 16px", flex: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
        {loading ? (
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />)}
          </div>
        ) : (
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.55 }}>{text}</p>
        )}
      </div>
    </div>
  );
}

/* ── Pip chat panel ──────────────────────────────────────────────── */
function PipChat({ topic, question, correctAnswer, onClose }) {
  const [messages, setMessages] = useState([
    { role: "pip", text: "Hi! I'm Pip 🐧 I'm here to help with this topic. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const reply = await callClaude({
        system: `You are Pip, a friendly study penguin. Topic: "${topic?.description}". Question: "${question}". Answer: "${correctAnswer}". Reply in 2-3 short plain sentences. No bullet points. Friendly tone. Occasional penguin pun ok.`,
        user: text, max_tokens: 300,
      });
      setMessages((m) => [...m, { role: "pip", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "pip", text: "Oops, I hit an iceberg! Try again. 🐧" }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 78, right: 16, width: 310, maxHeight: 430, background: "white", borderRadius: 22, boxShadow: "0 6px 28px rgba(91,174,212,0.22), 0 0 0 1.5px rgba(126,173,216,0.28)", display: "flex", flexDirection: "column", zIndex: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(180,220,240,0.4)" }}>
        <Pip size={36} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f" }}>Pip</p>
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 12, color: "#7ab3cc" }}>Your study penguin 🐧</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ac4d8", lineHeight: 1 }}>×</button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 270 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
            {m.role === "pip" && <Pip size={22} />}
            <div style={{ maxWidth: "76%", padding: "8px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "linear-gradient(135deg,#7eadd8,#5baed4)" : "#e8f4fb", color: m.role === "user" ? "white" : "#1a3a4f", fontFamily: FONT, fontSize: 13.5, lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <Pip size={22} />
            <div style={{ padding: "8px 13px", borderRadius: "14px 14px 14px 4px", background: "#e8f4fb", display: "flex", gap: 5 }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(180,220,240,0.4)", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Pip anything…" style={{ flex: 1, padding: "8px 13px", borderRadius: 20, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: FONT, fontSize: 13, outline: "none", color: "#1a3a4f" }} />
        <button onClick={send} style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", cursor: "pointer", color: "white", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>➤</button>
      </div>
    </div>
  );
}

/* ── Upload screen ───────────────────────────────────────────────── */
function UploadScreen({ onTopicsReady }) {
  const [tab, setTab] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const EXTRACT_SYSTEM = `You are extracting topics from a GCSE subject pathway document.
The document has topics with sub-topics (e.g. 1.1, 1.2 … 1.10, 2.1 … 2.10, up to 20+ topics and many sub-topics).
Each topic/sub-topic has a confidence rating column (1, 2, 3, or 4).
Return ONLY valid JSON — no markdown, no commentary:
{"subject":"Subject Name","topics":[{"id":"1.1","description":"Topic description","confidence":2}]}
- id: use the numeric ID from the document (e.g. "1.1", "2.3", "12.4")
- confidence: integer 1-4 from the rating column. Omit topics with no rating.
- Extract ALL sub-topics, not just top-level headings.`;

  const extractFromText = useCallback(async (text) => {
    setLoading(true); setError("");
    try {
      const raw = await callClaude({ system: EXTRACT_SYSTEM, user: text, max_tokens: 8192 });
      const data = parseJSON(raw);
      const rated = data.topics.filter((t) => t.confidence >= 1 && t.confidence <= 4);
      if (!rated.length) throw new Error("No topics with confidence ratings 1–4 found. Please check your document.");
      onTopicsReady({ subject: data.subject, topics: rated });
    } catch (e) { setError(e.message || "Failed to extract topics."); }
    setLoading(false);
  }, [onTopicsReady]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setLoading(true); setError("");
    const reader = new FileReader();
    reader.onerror = () => { setError("Could not read the file."); setLoading(false); };
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const raw = await callClaude({
          system: EXTRACT_SYSTEM,
          user: "Extract all topics and their confidence ratings from this pathway document. Include every sub-topic.",
          max_tokens: 8192,
          documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }],
        });
        const data = parseJSON(raw);
        const rated = data.topics.filter((t) => t.confidence >= 1 && t.confidence <= 4);
        if (!rated.length) throw new Error("No topics with confidence ratings 1–4 found in the PDF.");
        onTopicsReady({ subject: data.subject, topics: rated });
      } catch (e) { setError(e.message || "Failed to extract topics from PDF."); setLoading(false); }
    };
    reader.readAsDataURL(file);
  }, [onTopicsReady]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      {/* Header — no Pip image, large title */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#1a3a4f", margin: "0 0 8px", letterSpacing: "-1px", lineHeight: 1.1 }}>Pathway Penguin</h1>
        <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7ab3cc", fontSize: 18, margin: 0 }}>Upload your subject pathway and let Pip quiz you!</p>
      </div>

      <div style={{ background: "white", borderRadius: 26, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1.5px solid rgba(180,220,240,0.35)" }}>
          {["pdf", "text"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "14px", background: tab === t ? "rgba(126,173,216,0.07)" : "white", border: "none", borderBottom: tab === t ? "2.5px solid #7eadd8" : "2.5px solid transparent", cursor: "pointer", fontFamily: FONT, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#4a8cbf" : "#9ac0d8", fontSize: 14, transition: "all 0.2s" }}>
              {t === "pdf" ? "📄  Upload PDF" : "📝  Paste Text"}
            </button>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          {tab === "pdf" ? (
            <div onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? "#7eadd8" : "rgba(180,220,240,0.55)"}`, borderRadius: 18, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(126,173,216,0.05)" : "rgba(220,240,250,0.12)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Pip size={80} />
              <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7ab3cc", margin: 0, fontSize: 14 }}>
                {dragging ? "Drop it here!" : "Drag & drop your pathway PDF or click to browse"}
              </p>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your pathway document text here… Topics with confidence ratings 1–4 will be extracted automatically."
                style={{ width: "100%", height: 170, padding: 13, borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
              <button onClick={() => extractFromText(pasteText)} disabled={!pasteText.trim() || loading}
                style={{ padding: "13px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed", opacity: pasteText.trim() && !loading ? 1 : 0.5 }}>
                Extract Topics →
              </button>
            </div>
          )}
          {loading && <p style={{ fontFamily: FONT, fontWeight: 500, color: "#7eadd8", fontSize: 14, textAlign: "center", marginTop: 14, margin: "14px 0 0" }}>🐧 Pip is reading your document…</p>}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

/* ── Quiz screen ─────────────────────────────────────────────────── */
function QuizScreen({ topics, questions, onFinish, onAskPip }) {
  const [idx, setIdx] = useState(0);
  const [workings, setWorkings] = useState("");
  const [answer, setAnswer] = useState("");
  const [traceData, setTraceData] = useState(null);
  // checked = Pip has evaluated, showAnswer = student clicked "Show Answer"
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const answerRef = useRef(null);

  const current = questions[idx];
  const topic = topics.find((t) => t.id === current?.topicId);
  const total = questions.length;
  const hasTrace = !!current?.traceTable;

  // Derived colour state for the answer border
  const answerBorderColor = !checked ? "rgba(180,220,240,0.5)"
    : feedback?.correct ? "rgba(60,186,140,0.4)"
    : feedback?.partial ? "rgba(240,180,30,0.45)"
    : "rgba(220,100,100,0.4)";

  function resetToRetry() {
    // Keep workings for reference, clear answer and feedback so student can try again
    setAnswer(""); setTraceData(null);
    setChecked(false); setFeedback(null); setError("");
    setTimeout(() => answerRef.current?.focus(), 50);
  }

  function fullReset() {
    setWorkings(""); setAnswer(""); setTraceData(null);
    setChecked(false); setShowAnswer(false); setFeedback(null); setError("");
  }

  function recordAndAdvance(isCorrect) {
    const newResults = [...results, { topicId: current.topicId, correct: isCorrect }];
    setResults(newResults);
    if (idx + 1 >= total) {
      const topicResults = {};
      newResults.forEach((r) => {
        if (!topicResults[r.topicId]) topicResults[r.topicId] = { correct: 0, total: 0 };
        topicResults[r.topicId].total++;
        if (r.correct) topicResults[r.topicId].correct++;
      });
      onFinish({ score: newResults.filter((r) => r.correct).length, total, results: newResults, topicResults });
    } else {
      setIdx((i) => i + 1);
      fullReset();
    }
  }

  async function submitAnswer() {
    const finalAnswer = hasTrace
      ? (traceData ? JSON.stringify(traceData) : "") + (answer.trim() ? "\n" + answer : "")
      : answer;
    if (!finalAnswer.trim() || checking || checked) return;
    setChecking(true); setError("");
    try {
      const raw = await callClaude({
        system: `Check a GCSE student's answer. Return ONLY valid JSON:
{"correct":false,"partial":false,"feedback":"one short encouraging sentence"}
- correct: true if fully correct
- partial: true if multi-part question and SOME parts are correct but not all (set correct:false when partial:true)
- feedback: brief sentence, warm tone
If the question has a trace table, check the logic of the provided trace data.
Accept equivalent correct forms. Be forgiving of minor formatting differences.`,
        user: `Question: ${current.question}\nCorrect answer: ${current.answer}\n${current.traceTable ? `Correct trace: ${JSON.stringify(current.traceTable.answer || [])}` : ""}\nStudent answer: ${finalAnswer}\n\nEvaluate the answer.`,
        max_tokens: 200,
      });
      const data = parseJSON(raw);
      setFeedback(data);
      setChecked(true);
    } catch { setError("Couldn't check your answer — please try again."); }
    setChecking(false);
  }

  function handleShowAnswer() {
    setShowAnswer(true);
  }

  function handleSkip() { recordAndAdvance(false); }

  useEffect(() => { answerRef.current?.focus(); }, [idx]);
  if (!current) return null;

  const canSubmit = hasTrace ? (traceData !== null || answer.trim()) : answer.trim();
  const isWrong = checked && feedback && !feedback.correct && !feedback.partial;
  const isPartial = checked && feedback?.partial;
  const isCorrect = checked && feedback?.correct;
  const revealContent = showAnswer || isCorrect; // show steps/trace when answer shown or correct

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 16px" }}>
      {/* Progress bar */}
      <div style={{ height: 5, background: "#ddeefa", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(idx / total) * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ padding: "4px 13px", borderRadius: 20, background: "rgba(126,173,216,0.12)", fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#4a8cbf" }}>
          {topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}
        </div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>{idx + 1} / {total}</p>
      </div>

      {/* Question card */}
      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "22px 24px", marginBottom: 14 }}>
        <QuestionText text={current.question} />

        {/* Trace table */}
        {hasTrace && (
          <TraceTable
            headers={current.traceTable.headers}
            initialRows={current.traceTable.rows}
            disabled={checked}
            onChange={setTraceData}
          />
        )}

        <div style={{ height: 1, background: "rgba(180,220,240,0.25)", margin: "16px 0" }} />

        {/* Workings */}
        <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Your Workings</label>
        <textarea value={workings} onChange={(e) => setWorkings(e.target.value)} placeholder="Show your working here…" disabled={showAnswer}
          style={{ width: "100%", height: 68, padding: "10px 12px", borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 12, background: showAnswer ? "#f8fbfd" : "white" }} />

        {/* Final answer */}
        <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
          {hasTrace ? "Final Answer (optional)" : "Final Answer"}
        </label>
        <input ref={answerRef} value={answer} onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !checked && submitAnswer()}
          placeholder={hasTrace ? "Any additional notes…" : "Enter your answer…"}
          disabled={checked || showAnswer}
          style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: `1.5px solid ${answerBorderColor}`, fontFamily: FONT, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box", background: checked || showAnswer ? "#f8fbfd" : "white", transition: "border-color 0.2s" }} />

        <ErrorBox message={error} />

        {/* Pip feedback */}
        {(checking || checked) && (
          <SpeechBubble loading={checking} correct={isCorrect} partial={isPartial} feedback={feedback?.feedback} />
        )}

        {/* Answer / method reveal — shown when student clicks "Show Answer" or got it right */}
        {(showAnswer || (checked && !isCorrect && !isPartial)) && (
          /* Model answer box — only shown after "Show Answer" is clicked */
          showAnswer && (
            <div style={{ marginTop: 18, background: "rgba(126,173,216,0.06)", border: "1.5px solid rgba(126,173,216,0.2)", borderRadius: 16, padding: "14px 16px" }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Model Answer</p>
              <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.6 }}>{current.answer}</p>
            </div>
          )
        )}

        {/* Correct trace answer reveal (show when answer revealed or wrong) */}
        {(showAnswer || isWrong) && hasTrace && current.traceTable.answer?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "#4a8cbf", textTransform: "uppercase", marginBottom: 7 }}>Correct Trace</p>
            <TraceTable headers={current.traceTable.headers} initialRows={current.traceTable.answer} disabled={true} onChange={() => {}} />
          </div>
        )}

        {/* Step-by-step method */}
        {(showAnswer || isWrong) && current.steps?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Method</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.55, paddingTop: 3 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!checked && !showAnswer ? (
          /* ── Before check ── */
          <>
            <button onClick={submitAnswer} disabled={!canSubmit || checking}
              style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: canSubmit && !checking ? "pointer" : "not-allowed", opacity: canSubmit && !checking ? 1 : 0.5 }}>
              Submit Answer
            </button>
            <button onClick={handleSkip}
              style={{ padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#9ac0d8", fontFamily: FONT, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Skip
            </button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Pip size={20} /> Ask Pip
            </button>
          </>
        ) : isCorrect ? (
          /* ── Correct ── */
          <>
            <button onClick={() => recordAndAdvance(true)}
              style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {idx + 1 >= total ? "See Results →" : "Next Question →"}
            </button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Pip size={20} /> Ask Pip
            </button>
          </>
        ) : showAnswer ? (
          /* ── Answer revealed ── */
          <>
            <button onClick={() => recordAndAdvance(false)}
              style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {idx + 1 >= total ? "See Results →" : "Next Question →"}
            </button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Pip size={20} /> Ask Pip
            </button>
          </>
        ) : (
          /* ── Checked but wrong / partial — offer retry or show answer ── */
          <>
            <button onClick={resetToRetry}
              style={{ padding: "11px 20px", borderRadius: 14, background: isPartial ? "rgba(240,180,30,0.12)" : "rgba(220,100,100,0.08)", border: `1.5px solid ${isPartial ? "rgba(240,180,30,0.4)" : "rgba(220,100,100,0.25)"}`, color: isPartial ? "#a07010" : "#b03030", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Try Again
            </button>
            <button onClick={handleShowAnswer}
              style={{ padding: "11px 18px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#7ab3cc", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Show Answer
            </button>
            <button onClick={() => recordAndAdvance(isPartial ? false : false)}
              style={{ padding: "11px 16px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {idx + 1 >= total ? "Finish →" : "Next →"}
            </button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Pip size={20} /> Ask Pip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Results screen ──────────────────────────────────────────────── */
function ResultsScreen({ subject, topics, score, total, results, onRetry, onReset }) {
  const pct = total > 0 ? score / total : 0;
  const msg = pct === 1 ? "Perfect score! 🎉" : pct >= 0.85 ? "Outstanding! 🌟" : pct >= 0.7 ? "Strong performance! 👏" : pct >= 0.5 ? "Keep going! 💪" : "Don't give up — practice makes perfect! 🐧";
  const wrongIds = [...new Set(results.filter((r) => !r.correct).map((r) => r.topicId))];
  const rightIds = [...new Set(results.filter((r) => r.correct).map((r) => r.topicId))].filter((id) => !wrongIds.includes(id));
  const getTopic = (id) => topics.find((t) => t.id === id);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Pip size={86} />
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#1a3a4f", margin: "8px 0 4px", letterSpacing: "-1.5px" }}>{score}/{total}</h1>
        <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: "#6ba3be", margin: 0 }}>{msg}</p>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", marginTop: 3 }}>{subject}</p>
      </div>

      {wrongIds.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#1a3a4f", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Areas to Focus On</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {wrongIds.map((id) => { const t = getTopic(id); if (!t) return null; return (
              <div key={id} style={{ background: "rgba(220,100,100,0.06)", border: "1.5px solid rgba(220,100,100,0.18)", borderRadius: 14, padding: "11px 15px", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(220,100,100,0.1)", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#b03030", whiteSpace: "nowrap" }}>{t.id}</span>
                <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
              </div>
            ); })}
          </div>
        </div>
      )}

      {rightIds.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#1a3a4f", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Strong Topics</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {rightIds.map((id) => { const t = getTopic(id); if (!t) return null; return (
              <div key={id} style={{ background: "rgba(60,186,140,0.06)", border: "1.5px solid rgba(60,186,140,0.18)", borderRadius: 14, padding: "11px 15px", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(60,186,140,0.1)", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#27826a", whiteSpace: "nowrap" }}>{t.id}</span>
                <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
              </div>
            ); })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 11 }}>
        <button onClick={onRetry} style={{ flex: 1, padding: "13px", borderRadius: 16, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Retry Quiz</button>
        <button onClick={onReset} style={{ flex: 1, padding: "13px", borderRadius: 16, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#9ac0d8", fontFamily: FONT, fontWeight: 500, fontSize: 15, cursor: "pointer" }}>Upload New Pathway</button>
      </div>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────── */
export default function App() {
  const [stage, setStage] = useState("upload");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pipOpen, setPipOpen] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);

  function reset() {
    setStage("upload"); setSubject(""); setTopics([]); setQuestions([]);
    setLoadProgress(0); setQuizResults(null); setLoadError(""); setPipOpen(false); setCurrentQuizIdx(0);
  }

  const QUESTION_SYSTEM = `You are generating a GCSE exam question for a student.
Return ONLY valid JSON with no markdown:
{
  "question": "The full question text. If multiple parts, write as:\\n1. first part\\n2. second part",
  "answer": "concise model answer",
  "steps": ["step 1 sentence", "step 2 sentence", "step 3 sentence"],
  "traceTable": null
}
If the topic is a Computer Science trace/dry-run exercise, replace traceTable with:
{
  "headers": ["Variable / Line", "step1", "step2", "step3"],
  "rows": [["x", "", "", ""], ["y", "", "", ""]],
  "answer": [["x", "0", "3", "5"], ["y", "2", "4", "4"]]
}
Otherwise traceTable must be null. Max 4 steps, each one short plain sentence.`;

  async function handleTopicsReady({ subject: sub, topics: tops }) {
    setSubject(sub); setTopics(tops); setStage("loading"); setLoadProgress(0); setLoadError("");
    let done = 0;
    try {
      const qs = await batchedMap(tops, 5, async (topic) => {
        const raw = await callClaude({
          system: QUESTION_SYSTEM,
          user: `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]})`,
          max_tokens: 1024,
        });
        const q = parseJSON(raw);
        done++;
        setLoadProgress(done);
        return { topicId: topic.id, ...q };
      });
      setQuestions(qs);
      setStage("quiz");
    } catch (e) {
      setLoadError(e.message || "Failed to generate questions.");
      setStage("upload");
    }
  }

  function handleQuizFinish(r) { setQuizResults(r); setStage("results"); }
  function handleRetry() { setQuizResults(null); setCurrentQuizIdx(0); setStage("quiz"); }

  const currentQ = stage === "quiz" ? questions[currentQuizIdx] : null;
  const currentTopic = currentQ ? topics.find((t) => t.id === currentQ.topicId) : null;

  return (
    <>
      <style>{`
        @keyframes pipBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        * { font-family: 'Nunito', -apple-system, system-ui, sans-serif; }
        input, textarea, button { font-family: inherit; }
      `}</style>

      {stage === "loading" && <LoadingScreen progress={loadProgress} total={topics.length} />}

      {stage !== "loading" && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", padding: "30px 0" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
            <StepDots stage={stage} />
          </div>
          {stage === "upload" && (
            <>
              <UploadScreen onTopicsReady={handleTopicsReady} />
              {loadError && <div style={{ maxWidth: 560, margin: "14px auto 0", padding: "0 16px" }}><ErrorBox message={loadError} /></div>}
            </>
          )}
          {stage === "quiz" && (
            <QuizScreen
              topics={topics} questions={questions}
              onFinish={handleQuizFinish} onAskPip={() => setPipOpen(true)}
              onIdxChange={setCurrentQuizIdx}
            />
          )}
          {stage === "results" && quizResults && (
            <ResultsScreen subject={subject} topics={topics} score={quizResults.score} total={quizResults.total} results={quizResults.results} onRetry={handleRetry} onReset={reset} />
          )}
        </div>
      )}

      {(stage === "quiz" || stage === "results") && !pipOpen && (
        <button onClick={() => setPipOpen(true)} style={{ position: "fixed", bottom: 20, right: 16, padding: "9px 18px 9px 10px", borderRadius: 30, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 18px rgba(91,174,212,0.38)", zIndex: 999 }}>
          <Pip size={26} /> Ask Pip
        </button>
      )}

      {pipOpen && <PipChat topic={currentTopic} question={currentQ?.question} correctAnswer={currentQ?.answer} onClose={() => setPipOpen(false)} />}
    </>
  );
}
