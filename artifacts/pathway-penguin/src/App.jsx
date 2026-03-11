import { useState, useRef, useEffect, useCallback } from "react";

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

function Penguin({ size = 60, expression = "normal" }) {
  const w = size;
  const h = size * 1.25;
  const cx = w / 2;
  const cy = h / 2;
  const bodyRx = w * 0.38;
  const bodyRy = h * 0.42;
  const headR = w * 0.28;
  const headCy = cy - bodyRy * 0.55;

  const eyeScaleY = expression === "happy" ? 0.45 : expression === "sad" ? 0.65 : 1;
  const eyeLx = cx - headR * 0.42;
  const eyeRx = cx + headR * 0.42;
  const eyeY = headCy - headR * 0.05;
  const eyeRxVal = headR * 0.16;
  const eyeRyVal = headR * 0.18 * eyeScaleY;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <ellipse cx={cx} cy={cy + bodyRy * 0.05} rx={bodyRx} ry={bodyRy} fill="#3a8fc7" />
      <ellipse cx={cx} cy={cy + bodyRy * 0.18} rx={bodyRx * 0.58} ry={bodyRy * 0.65} fill="#e8f4fb" />
      <circle cx={cx} cy={headCy} r={headR} fill="#3a8fc7" />
      <ellipse cx={cx} cy={headCy + headR * 0.1} rx={headR * 0.6} ry={headR * 0.55} fill="#dff0fa" />
      <ellipse cx={eyeLx} cy={eyeY} rx={eyeRxVal} ry={eyeRyVal} fill="#1a2533" />
      <circle cx={eyeLx - eyeRxVal * 0.25} cy={eyeY - eyeRyVal * 0.28} r={eyeRxVal * 0.45} fill="white" />
      <ellipse cx={eyeRx} cy={eyeY} rx={eyeRxVal} ry={eyeRyVal} fill="#1a2533" />
      <circle cx={eyeRx - eyeRxVal * 0.25} cy={eyeY - eyeRyVal * 0.28} r={eyeRxVal * 0.45} fill="white" />
      <ellipse cx={cx} cy={headCy + headR * 0.38} rx={headR * 0.22} ry={headR * 0.14} fill="#f4a535" />
      {expression === "happy" && (
        <path
          d={`M ${cx - headR * 0.28} ${headCy + headR * 0.56} Q ${cx} ${headCy + headR * 0.72} ${cx + headR * 0.28} ${headCy + headR * 0.56}`}
          stroke="#1a2533"
          strokeWidth={headR * 0.07}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {expression === "sad" && (
        <path
          d={`M ${cx - headR * 0.28} ${headCy + headR * 0.68} Q ${cx} ${headCy + headR * 0.55} ${cx + headR * 0.28} ${headCy + headR * 0.68}`}
          stroke="#1a2533"
          strokeWidth={headR * 0.07}
          fill="none"
          strokeLinecap="round"
        />
      )}
      <ellipse cx={cx - bodyRx * 0.82} cy={cy - bodyRy * 0.05} rx={bodyRx * 0.22} ry={bodyRy * 0.42} fill="#2b6ea0" transform={`rotate(-18,${cx - bodyRx * 0.82},${cy - bodyRy * 0.05})`} />
      <ellipse cx={cx + bodyRx * 0.82} cy={cy - bodyRy * 0.05} rx={bodyRx * 0.22} ry={bodyRy * 0.42} fill="#2b6ea0" transform={`rotate(18,${cx + bodyRx * 0.82},${cy - bodyRy * 0.05})`} />
      <ellipse cx={cx - bodyRx * 0.3} cy={cy + bodyRy * 0.82} rx={bodyRx * 0.2} ry={bodyRy * 0.1} fill="#f4a535" />
      <ellipse cx={cx + bodyRx * 0.3} cy={cy + bodyRy * 0.82} rx={bodyRx * 0.2} ry={bodyRy * 0.1} fill="#f4a535" />
    </svg>
  );
}

function StepDots({ stage }) {
  const stages = ["upload", "quiz", "results"];
  const idx = stages.indexOf(stage) === -1 ? 0 : stages.indexOf(stage);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
      {stages.map((s, i) => (
        <div
          key={s}
          style={{
            height: 8,
            width: i === idx ? 22 : 8,
            borderRadius: i === idx ? 4 : "50%",
            background: i === idx ? "#5baed4" : "#b8d8ee",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: "rgba(224,112,112,0.12)",
        border: "1px solid rgba(224,112,112,0.4)",
        borderRadius: 12,
        padding: "12px 16px",
        color: "#c0392b",
        fontSize: 14,
        marginTop: 12,
      }}
    >
      {message}
    </div>
  );
}

function LoadingScene({ progress, total, message }) {
  const pct = total > 0 ? progress / total : 0;
  const waterHeight = 28 + (183 - 28) * pct;
  const isSwimming = pct > 0.72;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        style={{
          width: 340,
          height: 250,
          overflow: "hidden",
          borderRadius: 16,
          position: "relative",
          background: "linear-gradient(180deg, #b8e4f8 0%, #ddf2fc 100%)",
        }}
      >
        <svg style={{ position: "absolute", top: 20, left: 30 }} width={80} height={40}>
          <ellipse cx={40} cy={20} rx={38} ry={18} fill="white" opacity={0.85} />
        </svg>
        <svg style={{ position: "absolute", top: 35, right: 40 }} width={60} height={28}>
          <ellipse cx={30} cy={14} rx={28} ry={12} fill="white" opacity={0.75} />
        </svg>

        <svg
          style={{ position: "absolute", bottom: waterHeight - 10, left: "50%", transform: "translateX(-50%)" }}
          width={180}
          height={90}
        >
          <polygon points="90,0 10,90 170,90" fill="#d6eefa" />
          <polygon points="90,0 30,90 150,90" fill="#e8f6fd" />
        </svg>

        {!isSwimming && (
          <div
            style={{
              position: "absolute",
              bottom: waterHeight + 72,
              left: "50%",
              animation: "penguinSlide 3.2s linear infinite",
            }}
          >
            <div style={{ animation: "penguinWaddle 0.38s ease-in-out infinite alternate" }}>
              <Penguin size={46} expression="happy" />
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: waterHeight,
            background: "linear-gradient(180deg, #5baed4 0%, #3d9ec7 100%)",
            transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <svg width="100%" height="16" style={{ position: "absolute", top: -10 }} preserveAspectRatio="none">
            <path d="M0,8 Q42.5,0 85,8 T170,8 T255,8 T340,8 L340,16 L0,16 Z" fill="#5baed4">
              <animateTransform attributeName="transform" type="translate" from="-85 0" to="0 0" dur="1.5s" repeatCount="indefinite" />
            </path>
          </svg>

          {isSwimming && (
            <div
              style={{
                position: "absolute",
                top: 4,
                left: "50%",
                transform: "translateX(-50%)",
                animation: "swimSway 1.2s ease-in-out infinite alternate",
              }}
            >
              <Penguin size={38} expression="happy" />
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#1a3a4f", margin: 0 }}>{message}</p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6ba3be", marginTop: 6 }}>
          {progress} of {total} questions ready
        </p>
        <div style={{ width: 220, height: 6, background: "#d6eefa", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${pct * 100}%`,
              background: "linear-gradient(90deg, #5baed4, #3d9ec7)",
              borderRadius: 3,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes penguinSlide {
          0% { transform: translateX(-80px); }
          85% { transform: translateX(90px); }
          86% { transform: translateX(-80px); }
          100% { transform: translateX(-80px); }
        }
        @keyframes penguinWaddle {
          from { transform: rotate(-9deg); }
          to { transform: rotate(9deg); }
        }
        @keyframes swimSway {
          from { transform: translateX(-50%) rotate(-8deg); }
          to { transform: translateX(-50%) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}

function SpeechBubble({ loading, correct, feedback }) {
  const expression = loading ? "normal" : correct ? "happy" : "sad";
  const text = loading
    ? null
    : correct
    ? `Waddle waddle — nailed it! 🐧 ${feedback}`
    : `Not quite! ${feedback}`;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 16 }}>
      <Penguin size={52} expression={expression} />
      <div
        style={{
          background: loading ? "#f0f8ff" : correct ? "rgba(61,186,140,0.1)" : "rgba(224,112,112,0.1)",
          border: `1px solid ${loading ? "#b8d8ee" : correct ? "rgba(61,186,140,0.4)" : "rgba(224,112,112,0.4)"}`,
          borderRadius: "16px 16px 16px 4px",
          padding: "14px 18px",
          flex: 1,
          minHeight: 60,
          display: "flex",
          alignItems: "center",
        }}
      >
        {loading ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#5baed4",
                  animation: `dotBounce 0.9s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes dotBounce {
                0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
                40% { transform: scale(1.1); opacity: 1; }
              }
            `}</style>
          </div>
        ) : (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#1a3a4f", margin: 0, lineHeight: 1.5 }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

function PipChat({ topic, question, correctAnswer, onClose }) {
  const [messages, setMessages] = useState([
    { role: "pip", text: `Hi! I'm Pip 🐧 I'm here to help you understand this topic. What would you like to know?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const systemPrompt = `You are Pip, a friendly study penguin. Context: Topic ID: ${topic?.id}, Topic: ${topic?.description}. Question asked: "${question}". Correct answer: "${correctAnswer}". Reply in 2-3 short plain English sentences. No bullet points. Friendly tone. Occasional penguin pun is fine.`;
      const reply = await callClaude({ system: systemPrompt, user: text, max_tokens: 300 });
      setMessages((m) => [...m, { role: "pip", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "pip", text: "Oops, I hit an iceberg! Try again in a moment. 🐧" }]);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 16,
        width: 308,
        maxHeight: 430,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(91,174,212,0.25), 0 0 0 1.5px rgba(91,174,212,0.3)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(180,220,240,0.4)" }}>
        <Penguin size={34} expression="happy" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: "#1a3a4f" }}>Pip</p>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6ba3be" }}>Your study penguin 🐧</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6ba3be", lineHeight: 1 }}>×</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 280 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
            {m.role === "pip" && <Penguin size={24} expression="normal" />}
            <div
              style={{
                maxWidth: "75%",
                padding: "8px 12px",
                borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                background: m.role === "user" ? "linear-gradient(135deg, #5baed4, #3d9ec7)" : "#e8f4fb",
                color: m.role === "user" ? "white" : "#1a3a4f",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5,
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <Penguin size={24} expression="normal" />
            <div style={{ padding: "8px 12px", borderRadius: "13px 13px 13px 3px", background: "#e8f4fb", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#5baed4", animation: `dotBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(180,220,240,0.4)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Pip anything..."
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 20,
            border: "1px solid rgba(180,220,240,0.6)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            outline: "none",
            color: "#1a3a4f",
          }}
        />
        <button
          onClick={send}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 16,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function UploadScreen({ onTopicsReady }) {
  const [tab, setTab] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const extractFromText = useCallback(async (text) => {
    setLoading(true);
    setError("");
    try {
      const raw = await callClaude({
        system: `You are a GCSE study assistant. Extract topics from the provided pathway document. Return ONLY valid JSON (no markdown) in this exact format:
{"subject":"Subject Name","topics":[{"id":"1.1","description":"topic text","confidence":1}]}
- confidence is the number (1-4) from the document. If no number, use null.
- Assign sequential IDs like 1.1, 1.2, 2.1 etc.
- Include all topics that have a confidence rating (1-4). Do not skip any.`,
        user: text,
        max_tokens: 4096,
      });
      const data = parseJSON(raw);
      const rated = data.topics.filter((t) => t.confidence !== null && t.confidence >= 1 && t.confidence <= 4);
      if (rated.length === 0) throw new Error("No topics with confidence ratings (1–4) were found. Please check your document.");
      onTopicsReady({ subject: data.subject, topics: rated });
    } catch (e) {
      setError(e.message || "Failed to extract topics. Please try again.");
    }
    setLoading(false);
  }, [onTopicsReady]);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.includes("pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(",")[1];
        try {
          const raw = await callClaude({
            system: `You are a GCSE study assistant. Extract topics from the provided pathway document PDF. Return ONLY valid JSON (no markdown) in this exact format:
{"subject":"Subject Name","topics":[{"id":"1.1","description":"topic text","confidence":1}]}
- confidence is the number (1-4) from the confidence column. If no number, use null.
- Assign sequential IDs like 1.1, 1.2, 2.1 etc.
- Include all topics that have a confidence rating (1-4).`,
            user: "Extract the topics and confidence ratings from this pathway document.",
            max_tokens: 4096,
            documents: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 },
              },
            ],
          });
          const data = parseJSON(raw);
          const rated = data.topics.filter((t) => t.confidence !== null && t.confidence >= 1 && t.confidence <= 4);
          if (rated.length === 0) throw new Error("No topics with confidence ratings (1–4) were found in the PDF.");
          onTopicsReady({ subject: data.subject, topics: rated });
        } catch (e) {
          setError(e.message || "Failed to extract topics from PDF.");
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError(e.message || "Failed to read file.");
      setLoading(false);
    }
  }, [onTopicsReady]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Penguin size={72} expression="normal" />
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#1a3a4f", margin: "8px 0 4px" }}>
          Pathway Penguin
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6ba3be", fontSize: 16, margin: 0 }}>
          Upload your subject pathway and let Pip quiz you!
        </p>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 20,
          border: "1px solid rgba(180,220,240,0.4)",
          boxShadow: "0 4px 20px rgba(91,174,212,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid rgba(180,220,240,0.4)" }}>
          {["pdf", "text"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "14px",
                background: tab === t ? "rgba(91,174,212,0.08)" : "white",
                border: "none",
                borderBottom: tab === t ? "2px solid #5baed4" : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "#5baed4" : "#6ba3be",
                fontSize: 14,
                transition: "all 0.2s",
              }}
            >
              {t === "pdf" ? "📄 Upload PDF" : "📝 Paste Text"}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === "pdf" ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#5baed4" : "rgba(180,220,240,0.7)"}`,
                borderRadius: 16,
                padding: "40px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(91,174,212,0.06)" : "rgba(218,238,250,0.2)",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Penguin size={64} expression={dragging ? "happy" : "normal"} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6ba3be", margin: 0, fontSize: 15 }}>
                {dragging ? "Drop it here!" : "Drag & drop your pathway PDF or click to browse"}
              </p>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your pathway document text here... Topics with confidence ratings 1–4 will be extracted."
                style={{
                  width: "100%",
                  height: 180,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid rgba(180,220,240,0.6)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: "#1a3a4f",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
              />
              <button
                onClick={() => extractFromText(pasteText)}
                disabled={!pasteText.trim() || loading}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
                  border: "none",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed",
                  opacity: pasteText.trim() && !loading ? 1 : 0.6,
                }}
              >
                Extract Topics →
              </button>
            </div>
          )}

          {loading && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#5baed4", fontSize: 14 }}>
                🐧 Pip is reading your document...
              </p>
            </div>
          )}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

function QuizScreen({ subject, topics, questions, onFinish, onAskPip }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [workings, setWorkings] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const answerRef = useRef(null);

  const current = questions[currentIdx];
  const topic = topics.find((t) => t.id === current?.topicId);
  const total = questions.length;

  async function submitAnswer() {
    if (!answer.trim() || checking || submitted) return;
    setChecking(true);
    setError("");
    try {
      const raw = await callClaude({
        system: `You are checking a student's answer to an exam question. Return ONLY valid JSON: {"correct":true,"feedback":"one short sentence explaining why or giving the key point"}`,
        user: `Question: ${current.question}\nCorrect answer: ${current.answer}\nStudent answer: ${answer}\n\nIs the student's answer correct (accept equivalent forms)?`,
        max_tokens: 200,
      });
      const data = parseJSON(raw);
      setFeedback(data);
      setSubmitted(true);
      setResults((r) => [...r, { topicId: current.topicId, correct: data.correct }]);
    } catch (e) {
      setError("Couldn't check your answer. Please try again.");
    }
    setChecking(false);
  }

  function next() {
    if (currentIdx + 1 >= total) {
      const topicResults = {};
      results.forEach((r) => {
        if (!topicResults[r.topicId]) topicResults[r.topicId] = { correct: 0, total: 0 };
        topicResults[r.topicId].total++;
        if (r.correct) topicResults[r.topicId].correct++;
      });
      onFinish({ score: results.filter((r) => r.correct).length, total, results, topicResults });
    } else {
      setCurrentIdx((i) => i + 1);
      setWorkings("");
      setAnswer("");
      setSubmitted(false);
      setFeedback(null);
      setError("");
    }
  }

  function skip() {
    setResults((r) => [...r, { topicId: current.topicId, correct: false }]);
    next();
  }

  useEffect(() => {
    if (answerRef.current) answerRef.current.focus();
  }, [currentIdx]);

  if (!current) return null;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ height: 4, background: "#d6eefa", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${((currentIdx + (submitted ? 1 : 0)) / total) * 100}%`,
            background: "linear-gradient(90deg, #5baed4, #3d9ec7)",
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(91,174,212,0.12)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#5baed4",
            fontWeight: 600,
          }}
        >
          {topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6ba3be", margin: 0 }}>
          {currentIdx + 1} / {total}
        </p>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 20,
          border: "1px solid rgba(180,220,240,0.4)",
          boxShadow: "0 4px 20px rgba(91,174,212,0.12)",
          padding: "24px 28px",
          marginBottom: 16,
        }}
      >
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#1a3a4f", lineHeight: 1.4, margin: "0 0 20px" }}>
          {current.question}
        </p>

        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.08em", fontWeight: 600, color: "#7ab3cc", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Your Workings
        </label>
        <textarea
          value={workings}
          onChange={(e) => setWorkings(e.target.value)}
          placeholder="Show your working here..."
          disabled={submitted}
          style={{
            width: "100%",
            height: 80,
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(180,220,240,0.6)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#1a3a4f",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 12,
            background: submitted ? "#f8fbfd" : "white",
          }}
        />

        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.08em", fontWeight: 600, color: "#7ab3cc", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Final Answer
        </label>
        <input
          ref={answerRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !submitted && submitAnswer()}
          placeholder="Enter your answer..."
          disabled={submitted}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${submitted && feedback ? (feedback.correct ? "rgba(61,186,140,0.5)" : "rgba(224,112,112,0.5)") : "rgba(180,220,240,0.6)"}`,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: "#1a3a4f",
            outline: "none",
            boxSizing: "border-box",
            background: submitted ? "#f8fbfd" : "white",
          }}
        />

        <ErrorBox message={error} />

        <SpeechBubble
          loading={checking}
          correct={feedback?.correct}
          feedback={feedback?.feedback}
        />

        {submitted && !feedback?.correct && current.steps?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1a3a4f", marginBottom: 10 }}>
              Step-by-step explanation:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {current.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      minWidth: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.5, paddingTop: 4 }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {!submitted ? (
          <>
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || checking}
              style={{
                padding: "12px 22px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
                border: "none",
                color: "white",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                cursor: answer.trim() && !checking ? "pointer" : "not-allowed",
                opacity: answer.trim() && !checking ? 1 : 0.6,
              }}
            >
              Submit Answer
            </button>
            <button
              onClick={skip}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(180,220,240,0.6)",
                color: "#6ba3be",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
            <button
              onClick={onAskPip}
              style={{
                marginLeft: "auto",
                padding: "12px 18px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(91,174,212,0.4)",
                color: "#5baed4",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>🐧</span> Ask Pip
            </button>
          </>
        ) : (
          <>
            <button
              onClick={next}
              style={{
                padding: "12px 22px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
                border: "none",
                color: "white",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {currentIdx + 1 >= total ? "See Results →" : "Next Question →"}
            </button>
            <button
              onClick={onAskPip}
              style={{
                marginLeft: "auto",
                padding: "12px 18px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(91,174,212,0.4)",
                color: "#5baed4",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>🐧</span> Ask Pip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ subject, topics, score, total, results, topicResults, onRetry, onReset }) {
  const pct = total > 0 ? score / total : 0;
  const expression = pct >= 0.7 ? "happy" : "sad";
  const message =
    pct === 1 ? "Perfect score! 🎉" : pct >= 0.85 ? "Outstanding work! 🌟" : pct >= 0.7 ? "Strong performance! 👏" : pct >= 0.5 ? "Keep going — you're getting there! 💪" : "Don't give up — practice makes perfect! 🐧";

  const wrongTopicIds = [...new Set(results.filter((r) => !r.correct).map((r) => r.topicId))];
  const correctTopicIds = [...new Set(results.filter((r) => r.correct).map((r) => r.topicId))].filter(
    (id) => !wrongTopicIds.includes(id)
  );

  const getTopicById = (id) => topics.find((t) => t.id === id);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Penguin size={72} expression={expression} />
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: "#1a3a4f", margin: "8px 0 4px", lineHeight: 1 }}>
          {score}/{total}
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#6ba3be", margin: 0 }}>{message}</p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#7ab3cc", marginTop: 4 }}>{subject}</p>
      </div>

      {wrongTopicIds.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16, color: "#1a3a4f", marginBottom: 12 }}>
            Areas to Focus On
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wrongTopicIds.map((id) => {
              const t = getTopicById(id);
              if (!t) return null;
              return (
                <div
                  key={id}
                  style={{
                    background: "rgba(224,112,112,0.08)",
                    border: "1px solid rgba(224,112,112,0.25)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: "rgba(224,112,112,0.15)",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c0392b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.id}
                  </span>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {correctTopicIds.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16, color: "#1a3a4f", marginBottom: 12 }}>
            Strong Topics
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {correctTopicIds.map((id) => {
              const t = getTopicById(id);
              if (!t) return null;
              return (
                <div
                  key={id}
                  style={{
                    background: "rgba(61,186,140,0.08)",
                    border: "1px solid rgba(61,186,140,0.25)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: "rgba(61,186,140,0.15)",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#27826a",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.id}
                  </span>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
            border: "none",
            color: "white",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Retry Quiz
        </button>
        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            background: "transparent",
            border: "1px solid rgba(180,220,240,0.6)",
            color: "#6ba3be",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Upload New Pathway
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState("upload");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pipOpen, setPipOpen] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  function reset() {
    setStage("upload");
    setSubject("");
    setTopics([]);
    setQuestions([]);
    setLoadProgress(0);
    setQuizResults(null);
    setLoadError("");
    setPipOpen(false);
    setCurrentQuestionIdx(0);
  }

  async function handleTopicsReady({ subject: sub, topics: tops }) {
    setSubject(sub);
    setTopics(tops);
    setStage("loading");
    setLoadProgress(0);
    setLoadError("");

    let done = 0;
    const total = tops.length;

    try {
      const questionPromises = tops.map(async (topic) => {
        const raw = await callClaude({
          system: `You are a GCSE exam question generator. Return ONLY valid JSON (no markdown):
{"question":"the exam question","answer":"short model answer","steps":["plain sentence 1","plain sentence 2","plain sentence 3"]}
Max 4 steps. Each step = one short plain English sentence. No jargon. No bullet points within steps.`,
          user: `Generate one GCSE exam question for this topic: "${topic.description}". Confidence level ${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]}).`,
          max_tokens: 4096,
        });
        const q = parseJSON(raw);
        done++;
        setLoadProgress(done);
        return { topicId: topic.id, ...q };
      });

      const qs = await Promise.all(questionPromises);
      setQuestions(qs);
      setStage("quiz");
    } catch (e) {
      setLoadError(e.message || "Failed to generate questions. Please try again.");
      setStage("upload");
    }
  }

  function handleQuizFinish(results) {
    setQuizResults(results);
    setStage("results");
  }

  function handleRetry() {
    setQuizResults(null);
    setCurrentQuestionIdx(0);
    setStage("quiz");
  }

  const currentQuestion = stage === "quiz" ? questions[currentQuestionIdx] : null;
  const currentTopic = currentQuestion ? topics.find((t) => t.id === currentQuestion.topicId) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #daeefa 0%, #eef7fd 45%, #ffffff 100%)",
        padding: "32px 0",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
        <StepDots stage={stage === "loading" ? "upload" : stage} />
        <div style={{ height: 28 }} />
      </div>

      {stage === "upload" && (
        <>
          <UploadScreen onTopicsReady={handleTopicsReady} />
          {loadError && (
            <div style={{ maxWidth: 560, margin: "16px auto 0", padding: "0 16px" }}>
              <ErrorBox message={loadError} />
            </div>
          )}
        </>
      )}

      {stage === "loading" && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 16px" }}>
          <LoadingScene
            progress={loadProgress}
            total={topics.length}
            message={loadProgress === 0 ? "Pip is preparing your quiz..." : loadProgress < topics.length ? "Building your questions..." : "Almost ready!"}
          />
        </div>
      )}

      {stage === "quiz" && (
        <QuizScreen
          subject={subject}
          topics={topics}
          questions={questions}
          onFinish={handleQuizFinish}
          onAskPip={() => setPipOpen(true)}
        />
      )}

      {stage === "results" && quizResults && (
        <ResultsScreen
          subject={subject}
          topics={topics}
          score={quizResults.score}
          total={quizResults.total}
          results={quizResults.results}
          topicResults={quizResults.topicResults}
          onRetry={handleRetry}
          onReset={reset}
        />
      )}

      {(stage === "quiz" || stage === "results") && !pipOpen && (
        <button
          onClick={() => setPipOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 16,
            padding: "10px 18px",
            borderRadius: 30,
            background: "linear-gradient(135deg, #5baed4, #3d9ec7)",
            border: "none",
            color: "white",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(91,174,212,0.4)",
            zIndex: 999,
          }}
        >
          <span style={{ fontSize: 20 }}>🐧</span> Ask Pip
        </button>
      )}

      {pipOpen && (
        <PipChat
          topic={currentTopic}
          question={currentQuestion?.question}
          correctAnswer={currentQuestion?.answer}
          onClose={() => setPipOpen(false)}
        />
      )}
    </div>
  );
}
