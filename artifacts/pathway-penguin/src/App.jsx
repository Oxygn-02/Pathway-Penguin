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
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

/* ── Pip image ─────────────────────────────────────────────────────── */
function Pip({ size = 60 }) {
  return (
    <img
      src="/pip.png"
      alt="Pip the penguin"
      style={{ width: size, height: "auto", display: "block", flexShrink: 0 }}
    />
  );
}

/* ── Question text renderer (splits numbered points) ───────────────── */
function QuestionText({ text }) {
  // Detect numbered points: "1. " "2. " etc anywhere in text
  const parts = text.split(/(?=\n?\d+\.\s)/);
  if (parts.length <= 1) {
    // No numbered points — just render plain
    return (
      <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: "#1a3a4f", lineHeight: 1.55, margin: 0 }}>
        {text}
      </p>
    );
  }
  // Render preamble + each numbered point separated by a rule
  return (
    <div>
      {parts.map((part, i) => {
        const trimmed = part.replace(/^\n/, "").trim();
        if (!trimmed) return null;
        const isPoint = /^\d+\.\s/.test(trimmed);
        return (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: "rgba(126,173,216,0.2)", margin: "10px 0" }} />}
            <p
              style={{
                fontFamily: FONT,
                fontWeight: isPoint ? 400 : 500,
                fontSize: isPoint ? 15 : 17,
                color: isPoint ? "#2d5a7a" : "#1a3a4f",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {trimmed}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Step dots ─────────────────────────────────────────────────────── */
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

/* ── Error box ─────────────────────────────────────────────────────── */
function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: "rgba(220,100,100,0.08)", border: "1.5px solid rgba(220,100,100,0.25)", borderRadius: 14, padding: "11px 15px", color: "#b03030", fontSize: 14, fontFamily: FONT, marginTop: 12 }}>
      {message}
    </div>
  );
}

/* ── Loading screen — just the video looping ───────────────────────── */
function LoadingScreen({ progress, total }) {
  const pct = total > 0 ? progress / total : 0;
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 50 }}>
      <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
        <source src="/loading-bg.mp4" type="video/mp4" />
      </video>
      {/* Progress card */}
      <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", textAlign: "center", zIndex: 10, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 24, padding: "18px 36px", boxShadow: "0 4px 28px rgba(91,174,212,0.18)", minWidth: 260 }}>
        <Pip size={52} />
        <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 17, color: "#1a3a4f", margin: "10px 0 3px" }}>
          {progress === 0 ? "Pip is reading your pathway…" : progress < total ? "Generating your questions…" : "Almost ready! ❄️"}
        </p>
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: "#7ab3cc", margin: "0 0 12px" }}>{progress} of {total} questions ready</p>
        <div style={{ width: 200, height: 5, background: "#ddeefa", borderRadius: 3, overflow: "hidden", margin: "0 auto" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Speech bubble ─────────────────────────────────────────────────── */
function SpeechBubble({ loading, correct, feedback }) {
  const text = loading ? null : correct ? `Waddle waddle — nailed it! 🐧 ${feedback}` : `Not quite! ${feedback}`;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18 }}>
      <Pip size={46} />
      <div style={{ background: loading ? "#f0f8ff" : correct ? "rgba(60,186,140,0.07)" : "rgba(220,100,100,0.07)", border: `1.5px solid ${loading ? "#c8dff0" : correct ? "rgba(60,186,140,0.3)" : "rgba(220,100,100,0.3)"}`, borderRadius: "16px 16px 16px 5px", padding: "13px 16px", flex: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
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

/* ── Pip chat panel ────────────────────────────────────────────────── */
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
        system: `You are Pip, a friendly study penguin. Topic ID: ${topic?.id}, Topic: ${topic?.description}. Question: "${question}". Correct answer: "${correctAnswer}". Reply in 2-3 short plain English sentences. No bullet points. Friendly tone. Occasional penguin pun is fine.`,
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(180,220,240,0.4)" }}>
        <Pip size={36} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f" }}>Pip</p>
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 12, color: "#7ab3cc" }}>Your study penguin 🐧</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ac4d8", lineHeight: 1, fontWeight: 300 }}>×</button>
      </div>
      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 270 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
            {m.role === "pip" && <Pip size={22} />}
            <div style={{ maxWidth: "76%", padding: "8px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "linear-gradient(135deg,#7eadd8,#5baed4)" : "#e8f4fb", color: m.role === "user" ? "white" : "#1a3a4f", fontFamily: FONT, fontWeight: 400, fontSize: 13.5, lineHeight: 1.5 }}>
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
      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(180,220,240,0.4)", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Pip anything…" style={{ flex: 1, padding: "8px 13px", borderRadius: 20, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: FONT, fontWeight: 400, fontSize: 13, outline: "none", color: "#1a3a4f" }} />
        <button onClick={send} style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", cursor: "pointer", color: "white", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>➤</button>
      </div>
    </div>
  );
}

/* ── Upload screen ─────────────────────────────────────────────────── */
function UploadScreen({ onTopicsReady }) {
  const [tab, setTab] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const extractFromText = useCallback(async (text) => {
    setLoading(true); setError("");
    try {
      const raw = await callClaude({
        system: `Extract topics from this GCSE pathway document. Return ONLY valid JSON:
{"subject":"Subject Name","topics":[{"id":"1.1","description":"topic text","confidence":1}]}
confidence = number 1-4 from document, or null. IDs sequential like 1.1, 1.2, 2.1 etc.`,
        user: text, max_tokens: 4096,
      });
      const data = parseJSON(raw);
      const rated = data.topics.filter((t) => t.confidence >= 1 && t.confidence <= 4);
      if (!rated.length) throw new Error("No topics with confidence ratings 1–4 found. Please check your document.");
      onTopicsReady({ subject: data.subject, topics: rated });
    } catch (e) { setError(e.message || "Failed to extract topics."); }
    setLoading(false);
  }, [onTopicsReady]);

  const handleFile = useCallback(async (file) => {
    if (!file?.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setLoading(true); setError("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const raw = await callClaude({
          system: `Extract topics from this GCSE pathway PDF. Return ONLY valid JSON:
{"subject":"Subject Name","topics":[{"id":"1.1","description":"topic text","confidence":1}]}
confidence = number 1-4 from confidence column, or null. IDs sequential like 1.1, 1.2.`,
          user: "Extract all topics and confidence ratings from this pathway document.",
          max_tokens: 4096,
          documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }],
        });
        const data = parseJSON(raw);
        const rated = data.topics.filter((t) => t.confidence >= 1 && t.confidence <= 4);
        if (!rated.length) throw new Error("No topics with confidence ratings 1–4 found in the PDF.");
        onTopicsReady({ subject: data.subject, topics: rated });
      } catch (e) { setError(e.message || "Failed to extract topics from PDF."); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onTopicsReady]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Pip size={90} />
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#1a3a4f", margin: "10px 0 5px", letterSpacing: "-0.3px" }}>Pathway Penguin</h1>
        <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7ab3cc", fontSize: 15, margin: 0 }}>Upload your subject pathway and let Pip quiz you!</p>
      </div>

      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1.5px solid rgba(180,220,240,0.35)" }}>
          {["pdf", "text"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "13px", background: tab === t ? "rgba(126,173,216,0.07)" : "white", border: "none", borderBottom: tab === t ? "2.5px solid #7eadd8" : "2.5px solid transparent", cursor: "pointer", fontFamily: FONT, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#4a8cbf" : "#9ac0d8", fontSize: 14, transition: "all 0.2s" }}>
              {t === "pdf" ? "📄 Upload PDF" : "📝 Paste Text"}
            </button>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          {tab === "pdf" ? (
            <div onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? "#7eadd8" : "rgba(180,220,240,0.55)"}`, borderRadius: 18, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(126,173,216,0.05)" : "rgba(220,240,250,0.12)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Pip size={72} />
              <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7ab3cc", margin: 0, fontSize: 14 }}>{dragging ? "Drop it here!" : "Drag & drop your pathway PDF or click to browse"}</p>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your pathway document text here… Topics with confidence ratings 1–4 will be extracted." style={{ width: "100%", height: 170, padding: 13, borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
              <button onClick={() => extractFromText(pasteText)} disabled={!pasteText.trim() || loading} style={{ padding: "12px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed", opacity: pasteText.trim() && !loading ? 1 : 0.5 }}>
                Extract Topics →
              </button>
            </div>
          )}
          {loading && <p style={{ fontFamily: FONT, fontWeight: 400, color: "#7eadd8", fontSize: 14, textAlign: "center", marginTop: 14 }}>🐧 Pip is reading your document…</p>}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

/* ── Quiz screen ───────────────────────────────────────────────────── */
function QuizScreen({ topics, questions, onFinish, onAskPip }) {
  const [idx, setIdx] = useState(0);
  const [workings, setWorkings] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const answerRef = useRef(null);

  const current = questions[idx];
  const topic = topics.find((t) => t.id === current?.topicId);
  const total = questions.length;

  async function submitAnswer() {
    if (!answer.trim() || checking || submitted) return;
    setChecking(true); setError("");
    try {
      const raw = await callClaude({
        system: `Check a student's answer. Return ONLY valid JSON: {"correct":true,"feedback":"one short sentence"}`,
        user: `Question: ${current.question}\nCorrect answer: ${current.answer}\nStudent answer: ${answer}\n\nIs the student correct (accept equivalent forms)?`,
        max_tokens: 200,
      });
      const data = parseJSON(raw);
      setFeedback(data);
      setSubmitted(true);
      setResults((r) => [...r, { topicId: current.topicId, correct: data.correct }]);
    } catch { setError("Couldn't check your answer. Please try again."); }
    setChecking(false);
  }

  function advance() {
    if (idx + 1 >= total) {
      const topicResults = {};
      results.forEach((r) => {
        if (!topicResults[r.topicId]) topicResults[r.topicId] = { correct: 0, total: 0 };
        topicResults[r.topicId].total++;
        if (r.correct) topicResults[r.topicId].correct++;
      });
      onFinish({ score: results.filter((r) => r.correct).length, total, results, topicResults });
    } else {
      setIdx((i) => i + 1);
      setWorkings(""); setAnswer(""); setSubmitted(false); setFeedback(null); setError("");
    }
  }

  function skip() { setResults((r) => [...r, { topicId: current.topicId, correct: false }]); advance(); }

  useEffect(() => { answerRef.current?.focus(); }, [idx]);
  if (!current) return null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
      {/* Progress bar */}
      <div style={{ height: 5, background: "#ddeefa", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((idx + (submitted ? 1 : 0)) / total) * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ padding: "4px 13px", borderRadius: 20, background: "rgba(126,173,216,0.12)", fontFamily: FONT, fontWeight: 600, fontSize: 12, color: "#4a8cbf" }}>
          {topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}
        </div>
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: "#9ac0d8", margin: 0 }}>{idx + 1} / {total}</p>
      </div>

      {/* Question card */}
      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "22px 24px", marginBottom: 14 }}>
        <QuestionText text={current.question} />

        <div style={{ height: 1, background: "rgba(180,220,240,0.3)", margin: "16px 0" }} />

        {/* Workings */}
        <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Your Workings</label>
        <textarea value={workings} onChange={(e) => setWorkings(e.target.value)} placeholder="Show your working here…" disabled={submitted} style={{ width: "100%", height: 72, padding: "10px 12px", borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 12, background: submitted ? "#f8fbfd" : "white" }} />

        {/* Answer */}
        <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Final Answer</label>
        <input ref={answerRef} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !submitted && submitAnswer()} placeholder="Enter your answer…" disabled={submitted}
          style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: `1.5px solid ${submitted && feedback ? (feedback.correct ? "rgba(60,186,140,0.4)" : "rgba(220,100,100,0.4)") : "rgba(180,220,240,0.5)"}`, fontFamily: FONT, fontWeight: 400, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box", background: submitted ? "#f8fbfd" : "white" }} />

        <ErrorBox message={error} />

        {/* Pip feedback */}
        {(checking || submitted) && <SpeechBubble loading={checking} correct={feedback?.correct} feedback={feedback?.feedback} />}

        {/* Step-by-step */}
        {submitted && !feedback?.correct && current.steps?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#4a8cbf", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Step by step</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {current.steps.map((step, i) => (
                <div key={i}>
                  {i > 0 && <div style={{ height: 1, background: "rgba(180,220,240,0.3)", margin: "8px 0" }} />}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.55, paddingTop: 3 }}>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!submitted ? (
          <>
            <button onClick={submitAnswer} disabled={!answer.trim() || checking} style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: answer.trim() && !checking ? "pointer" : "not-allowed", opacity: answer.trim() && !checking ? 1 : 0.5 }}>Submit Answer</button>
            <button onClick={skip} style={{ padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#9ac0d8", fontFamily: FONT, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Skip</button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Pip size={20} /> Ask Pip
            </button>
          </>
        ) : (
          <>
            <button onClick={advance} style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{idx + 1 >= total ? "See Results →" : "Next Question →"}</button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Pip size={20} /> Ask Pip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Results screen ────────────────────────────────────────────────── */
function ResultsScreen({ subject, topics, score, total, results, onRetry, onReset }) {
  const pct = total > 0 ? score / total : 0;
  const msg = pct === 1 ? "Perfect score! 🎉" : pct >= 0.85 ? "Outstanding! 🌟" : pct >= 0.7 ? "Strong performance! 👏" : pct >= 0.5 ? "Keep going — you're getting there! 💪" : "Don't give up — practice makes perfect! 🐧";
  const wrongIds = [...new Set(results.filter((r) => !r.correct).map((r) => r.topicId))];
  const rightIds = [...new Set(results.filter((r) => r.correct).map((r) => r.topicId))].filter((id) => !wrongIds.includes(id));
  const getTopic = (id) => topics.find((t) => t.id === id);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Pip size={86} />
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#1a3a4f", margin: "8px 0 4px", letterSpacing: "-1.5px" }}>{score}/{total}</h1>
        <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: "#6ba3be", margin: 0 }}>{msg}</p>
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: "#9ac0d8", marginTop: 3 }}>{subject}</p>
      </div>

      {wrongIds.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Areas to Focus On</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {wrongIds.map((id) => { const t = getTopic(id); if (!t) return null; return (
              <div key={id} style={{ background: "rgba(220,100,100,0.06)", border: "1.5px solid rgba(220,100,100,0.18)", borderRadius: 14, padding: "11px 15px", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(220,100,100,0.1)", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#b03030", whiteSpace: "nowrap" }}>{t.id}</span>
                <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
              </div>
            ); })}
          </div>
        </div>
      )}

      {rightIds.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Strong Topics</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {rightIds.map((id) => { const t = getTopic(id); if (!t) return null; return (
              <div key={id} style={{ background: "rgba(60,186,140,0.06)", border: "1.5px solid rgba(60,186,140,0.18)", borderRadius: 14, padding: "11px 15px", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(60,186,140,0.1)", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#27826a", whiteSpace: "nowrap" }}>{t.id}</span>
                <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
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

/* ── App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [stage, setStage] = useState("upload");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pipOpen, setPipOpen] = useState(false);
  const [quizIdx] = useState(0);

  function reset() {
    setStage("upload"); setSubject(""); setTopics([]); setQuestions([]);
    setLoadProgress(0); setQuizResults(null); setLoadError(""); setPipOpen(false);
  }

  async function handleTopicsReady({ subject: sub, topics: tops }) {
    setSubject(sub); setTopics(tops); setStage("loading"); setLoadProgress(0); setLoadError("");
    let done = 0;
    try {
      const qs = await Promise.all(tops.map(async (topic) => {
        const raw = await callClaude({
          system: `Generate one GCSE exam question. Return ONLY valid JSON:
{"question":"the question text","answer":"short model answer","steps":["sentence 1","sentence 2","sentence 3"]}
Max 4 steps. Each step = one short plain English sentence. No jargon.
If the question has multiple parts, write them as: 1. task\\n2. task`,
          user: `Topic: "${topic.description}". Confidence level ${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]}).`,
          max_tokens: 4096,
        });
        const q = parseJSON(raw);
        done++;
        setLoadProgress(done);
        return { topicId: topic.id, ...q };
      }));
      setQuestions(qs);
      setStage("quiz");
    } catch (e) {
      setLoadError(e.message || "Failed to generate questions.");
      setStage("upload");
    }
  }

  function handleQuizFinish(r) { setQuizResults(r); setStage("results"); }
  function handleRetry() { setQuizResults(null); setStage("quiz"); }

  const currentQ = stage === "quiz" ? questions[quizIdx] : null;
  const currentTopic = currentQ ? topics.find((t) => t.id === currentQ.topicId) : null;

  return (
    <>
      <style>{`
        @keyframes pipBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        * { font-family: 'Nunito', -apple-system, system-ui, sans-serif; }
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
              {loadError && <div style={{ maxWidth: 540, margin: "14px auto 0", padding: "0 16px" }}><ErrorBox message={loadError} /></div>}
            </>
          )}
          {stage === "quiz" && <QuizScreen topics={topics} questions={questions} onFinish={handleQuizFinish} onAskPip={() => setPipOpen(true)} />}
          {stage === "results" && quizResults && <ResultsScreen subject={subject} topics={topics} score={quizResults.score} total={quizResults.total} results={quizResults.results} onRetry={handleRetry} onReset={reset} />}
        </div>
      )}

      {/* Floating Ask Pip */}
      {(stage === "quiz" || stage === "results") && !pipOpen && (
        <button onClick={() => setPipOpen(true)} style={{ position: "fixed", bottom: 20, right: 16, padding: "9px 18px 9px 10px", borderRadius: 30, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 18px rgba(91,174,212,0.38)", zIndex: 999 }}>
          <Pip size={26} /> Ask Pip
        </button>
      )}

      {pipOpen && <PipChat topic={currentTopic} question={currentQ?.question} correctAnswer={currentQ?.answer} onClose={() => setPipOpen(false)} />}
    </>
  );
}
