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

/* ─── PENGUIN SVG ─────────────────────────────────────────────────── */
function Penguin({ size = 60, expression = "normal", rotate = 0, flipX = false }) {
  const w = size;
  const h = size * 1.35;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 135"
      style={{ display: "block", transform: `rotate(${rotate}deg) scaleX(${flipX ? -1 : 1})` }}
    >
      {/* Body */}
      <ellipse cx="50" cy="88" rx="34" ry="40" fill="#7eadd8" />
      {/* White belly */}
      <ellipse cx="50" cy="95" rx="22" ry="32" fill="white" />
      {/* Head */}
      <ellipse cx="50" cy="42" rx="30" ry="30" fill="#7eadd8" />
      {/* Head tuft */}
      <ellipse cx="48" cy="14" rx="8" ry="6" fill="#6699c8" transform="rotate(-15 48 14)" />
      <ellipse cx="52" cy="12" rx="6" ry="5" fill="#7eadd8" transform="rotate(10 52 12)" />
      {/* White face patch */}
      <ellipse cx="50" cy="46" rx="22" ry="22" fill="white" />
      {/* Left wing — hangs down alongside body */}
      <ellipse cx="17" cy="85" rx="9" ry="28" fill="#6a9bc4" transform="rotate(-6 17 85)" />
      {/* Right wing — hangs down alongside body */}
      <ellipse cx="83" cy="85" rx="9" ry="28" fill="#6a9bc4" transform="rotate(6 83 85)" />
      {/* Eyes */}
      <circle cx="38" cy="40" r={expression === "happy" ? 8.5 : 9} fill="#1a1f2e" />
      <circle cx="62" cy="40" r={expression === "happy" ? 8.5 : 9} fill="#1a1f2e" />
      {/* Eye whites */}
      <circle cx="41" cy="36" r="3.5" fill="white" />
      <circle cx="65" cy="36" r="3.5" fill="white" />
      {/* Happy squint lines */}
      {expression === "happy" && (
        <>
          <ellipse cx="38" cy="40" rx="9" ry="4" fill="#1a1f2e" />
          <ellipse cx="62" cy="40" rx="9" ry="4" fill="#1a1f2e" />
          <circle cx="41" cy="38" r="3" fill="white" />
          <circle cx="65" cy="38" r="3" fill="white" />
        </>
      )}
      {/* Sad droopy eyes */}
      {expression === "sad" && (
        <>
          <ellipse cx="38" cy="42" rx="9" ry="7" fill="#1a1f2e" />
          <ellipse cx="62" cy="42" rx="9" ry="7" fill="#1a1f2e" />
          <circle cx="41" cy="38" r="3" fill="white" />
          <circle cx="65" cy="38" r="3" fill="white" />
        </>
      )}
      {/* Beak */}
      <ellipse cx="50" cy="54" rx="7" ry="5" fill="#3a5fa0" />
      {/* Pink cheeks */}
      <ellipse cx="28" cy="50" rx="8" ry="6" fill="#f0a0b0" opacity="0.55" />
      <ellipse cx="72" cy="50" rx="8" ry="6" fill="#f0a0b0" opacity="0.55" />
      {/* Mouth */}
      {expression === "happy" && (
        <path d="M 43 60 Q 50 66 57 60" stroke="#3a5fa0" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {expression === "sad" && (
        <path d="M 43 64 Q 50 59 57 64" stroke="#3a5fa0" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* Feet */}
      <ellipse cx="38" cy="127" rx="12" ry="6" fill="#e8b840" />
      <ellipse cx="62" cy="127" rx="12" ry="6" fill="#e8b840" />
      <path d="M 28 127 Q 26 132 32 130 Q 30 135 38 132 Q 36 135 44 130 Q 46 132 48 127" fill="#e8b840" />
      <path d="M 52 127 Q 54 132 60 130 Q 58 135 66 132 Q 64 135 72 130 Q 74 132 72 127" fill="#e8b840" />
    </svg>
  );
}


/* ─── STEP DOTS ──────────────────────────────────────────────────── */
function StepDots({ stage }) {
  const stages = ["upload", "quiz", "results"];
  const idx = stages.indexOf(stage) === -1 ? 0 : stages.indexOf(stage);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
      {stages.map((s, i) => (
        <div
          key={s}
          style={{
            height: 8,
            width: i === idx ? 24 : 8,
            borderRadius: i === idx ? 4 : "50%",
            background: i === idx ? "#7eadd8" : "#c5dff0",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

/* ─── ERROR BOX ──────────────────────────────────────────────────── */
function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: "rgba(224,112,112,0.1)", border: "1px solid rgba(224,112,112,0.35)", borderRadius: 16, padding: "12px 16px", color: "#c0392b", fontSize: 14, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>
      {message}
    </div>
  );
}

/* ─── LOADING SCREEN ─────────────────────────────────────────────── */
function LoadingScreen({ progress, total }) {
  const pct = total > 0 ? progress / total : 0;
  const DUR = "7s";

  /* Iceberg geometry (viewBox 0 0 1000 500):
     flat top: y=180  x=250..750
     left slope: (250,180) → (0,360)
     right slope: (750,180) → (1000,360)
     The penguin:
       phase 0-30%  : enters right side, waddles left across flat
       phase 30-38% : belly-flops (rotate)
       phase 38-70% : slides down left slope, exits left edge
       phase 70-71% : instant jump to right edge (invisible mid-air)
       phase 71-100%: repeat (same as 0-30% entry)
  */

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 50 }}>
      {/* Video background */}
      <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
        <source src="/loading-bg.mp4" type="video/mp4" />
      </video>

      {/* Iceberg + penguin SVG overlay — anchored to bottom */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* ── Iceberg ── */}
        {/* Main body */}
        <polygon points="0,500 0,350 250,178 500,162 750,178 1000,350 1000,500" fill="#cde8f5" />
        {/* Snow cap / bright flat top */}
        <polygon points="250,178 500,162 750,178 700,168 500,155 300,168" fill="#eaf6fd" />
        <ellipse cx="500" cy="163" rx="200" ry="14" fill="white" opacity="0.7" />
        {/* Ice texture */}
        <path d="M80,400 Q150,370 230,390" stroke="#a8d4ec" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M770,390 Q850,368 930,385" stroke="#a8d4ec" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M320,198 Q420,188 500,192" stroke="#b8ddf0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M500,192 Q580,188 680,198" stroke="#b8ddf0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
        {/* Side glints */}
        <path d="M120,360 Q160,340 200,355" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M800,355 Q840,338 880,352" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* ── Water ── */}
        <rect x="0" y="420" width="1000" height="80" fill="#3d9ec7" opacity="0.65" />
        <path d="M-200,420 Q-100,410 0,420 Q100,430 200,420 Q300,410 400,420 Q500,430 600,420 Q700,410 800,420 Q900,430 1000,420 Q1100,410 1200,420 L1200,440 L-200,440Z" fill="#5baed4" opacity="0.8">
          <animateTransform attributeName="transform" type="translate" from="0 0" to="200 0" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M-100,440 Q50,430 200,440 Q350,450 500,440 Q650,430 800,440 Q950,450 1100,440 L1100,460 L-100,460Z" fill="#4a93ba" opacity="0.55">
          <animateTransform attributeName="transform" type="translate" from="200 0" to="0 0" dur="2.2s" repeatCount="indefinite" />
        </path>

        {/* ── Penguin walking across flat top ── */}
        {/* The penguin group moves left across the flat (x: 820→250) while the rotation handle tilts it */}
        <g>
          {/* Translate: right→left across flat, then continue down slope */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="820,0; 390,0; 320,10; 220,48; 100,105; -80,200; -80,200; 820,0"
            keyTimes="0; 0.30; 0.38; 0.50; 0.62; 0.72; 0.73; 1"
            dur={DUR}
            repeatCount="indefinite"
            calcMode="linear"
          />

          {/* Waddling bob (translateY) while upright */}
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-5; 0,0; 0,-5; 0,0; 0,0; 0,0; 0,0"
              keyTimes="0; 0.04; 0.08; 0.12; 0.16; 0.30; 0.73; 1"
              dur={DUR}
              repeatCount="indefinite"
              additive="sum"
            />

            {/* Rotate for belly flop + slide */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 0 0; 0 0 0; 90 0 0; 90 0 0; 90 0 0; 90 0 0; 0 0 0; 0 0 0"
                keyTimes="0; 0.28; 0.38; 0.50; 0.62; 0.72; 0.73; 1"
                dur={DUR}
                repeatCount="indefinite"
                additive="sum"
              />

              {/* ── Inline penguin (centered at 0,0, standing) ── */}
              {/* Placed so feet are at y=0 (ice surface) */}
              {/* Body */}
              <ellipse cx="0" cy="-26" rx="18" ry="22" fill="#7eadd8" />
              {/* Belly */}
              <ellipse cx="0" cy="-22" rx="12" ry="17" fill="white" />
              {/* Head */}
              <circle cx="0" cy="-55" r="18" fill="#7eadd8" />
              {/* Tuft */}
              <ellipse cx="-2" cy="-73" rx="6" ry="5" fill="#6a9bc4" transform="rotate(-12,-2,-73)" />
              <ellipse cx="4" cy="-75" rx="5" ry="4" fill="#7eadd8" transform="rotate(12,4,-75)" />
              {/* Face */}
              <circle cx="0" cy="-53" r="14" fill="white" />
              {/* Eyes */}
              <circle cx="-6" cy="-57" r="5.5" fill="#1a1f2e" />
              <circle cx="6" cy="-57" r="5.5" fill="#1a1f2e" />
              <circle cx="-4" cy="-59.5" r="2.2" fill="white" />
              <circle cx="8" cy="-59.5" r="2.2" fill="white" />
              {/* Beak */}
              <ellipse cx="0" cy="-47" rx="5" ry="3.5" fill="#3a5fa0" />
              {/* Cheeks */}
              <ellipse cx="-11" cy="-51" rx="5.5" ry="4" fill="#f0a0b0" opacity="0.55" />
              <ellipse cx="11" cy="-51" rx="5.5" ry="4" fill="#f0a0b0" opacity="0.55" />
              {/* Left wing */}
              <ellipse cx="-17" cy="-22" rx="6" ry="15" fill="#6a9bc4" transform="rotate(-10,-17,-22)" />
              {/* Right wing */}
              <ellipse cx="17" cy="-22" rx="6" ry="15" fill="#6a9bc4" transform="rotate(10,17,-22)" />
              {/* Feet */}
              <ellipse cx="-6" cy="-4" rx="8" ry="4" fill="#e8b840" />
              <ellipse cx="6" cy="-4" rx="8" ry="4" fill="#e8b840" />
            </g>
          </g>
        </g>

        {/* ── Waddle tilt (independent rotation for walking) ── */}
        {/* This is an extra tilt layer applied at a separate position */}
      </svg>

      {/* Progress card */}
      <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", textAlign: "center", zIndex: 10, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", borderRadius: 22, padding: "16px 34px", boxShadow: "0 4px 24px rgba(91,174,212,0.18)" }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 18, color: "#1a3a4f", margin: 0 }}>
          {progress === 0 ? "Pip is reading your pathway..." : progress < total ? "Generating your questions..." : "Almost ready! ❄️"}
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14, color: "#6ba3be", margin: "4px 0 10px" }}>{progress} of {total} questions ready</p>
        <div style={{ width: 210, height: 6, background: "#d6eefa", borderRadius: 3, margin: "0 auto", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── SPEECH BUBBLE ─────────────────────────────────────────────── */
function SpeechBubble({ loading, correct, feedback }) {
  const expression = loading ? "normal" : correct ? "happy" : "sad";
  const text = loading ? null : correct ? `Waddle waddle — nailed it! 🐧 ${feedback}` : `Not quite! ${feedback}`;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginTop: 18 }}>
      <Penguin size={52} expression={expression} />
      <div
        style={{
          background: loading ? "#f0f8ff" : correct ? "rgba(61,186,140,0.08)" : "rgba(224,112,112,0.08)",
          border: `1.5px solid ${loading ? "#c5dff0" : correct ? "rgba(61,186,140,0.35)" : "rgba(224,112,112,0.35)"}`,
          borderRadius: "18px 18px 18px 6px",
          padding: "14px 18px",
          flex: 1,
          minHeight: 60,
          display: "flex",
          alignItems: "center",
        }}
      >
        {loading ? (
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#7eadd8", animation: `dotBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#1a3a4f", margin: 0, lineHeight: 1.6 }}>{text}</p>
        )}
      </div>
    </div>
  );
}

/* ─── PIP CHAT ───────────────────────────────────────────────────── */
function PipChat({ topic, question, correctAnswer, onClose }) {
  const [messages, setMessages] = useState([
    { role: "pip", text: "Hi! I'm Pip 🐧 I'm here to help you understand this topic. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const reply = await callClaude({
        system: `You are Pip, a friendly study penguin. Context: Topic ID: ${topic?.id}, Topic: ${topic?.description}. Question: "${question}". Correct answer: "${correctAnswer}". Reply in 2-3 short plain English sentences. No bullet points. Friendly tone. Occasional penguin pun is fine.`,
        user: text,
        max_tokens: 300,
      });
      setMessages((m) => [...m, { role: "pip", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "pip", text: "Oops, I hit an iceberg! Try again in a moment. 🐧" }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, width: 308, maxHeight: 430, background: "white", borderRadius: 20, boxShadow: "0 4px 24px rgba(91,174,212,0.25), 0 0 0 1.5px rgba(126,173,216,0.3)", display: "flex", flexDirection: "column", zIndex: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(180,220,240,0.4)" }}>
        <Penguin size={34} expression="happy" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: "#1a3a4f" }}>Pip</p>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6ba3be" }}>Your study penguin 🐧</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#7eadd8", lineHeight: 1, fontWeight: 300 }}>×</button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 280 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
            {m.role === "pip" && <Penguin size={24} expression="normal" />}
            <div style={{ maxWidth: "75%", padding: "8px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "linear-gradient(135deg,#7eadd8,#5baed4)" : "#e8f4fb", color: m.role === "user" ? "white" : "#1a3a4f", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <Penguin size={24} expression="normal" />
            <div style={{ padding: "8px 13px", borderRadius: "14px 14px 14px 4px", background: "#e8f4fb", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7eadd8", animation: `dotBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(180,220,240,0.4)", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Pip anything..." style={{ flex: 1, padding: "8px 13px", borderRadius: 20, border: "1.5px solid rgba(180,220,240,0.6)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", color: "#1a3a4f" }} />
        <button onClick={send} style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15 }}>➤</button>
      </div>
    </div>
  );
}

/* ─── UPLOAD SCREEN ─────────────────────────────────────────────── */
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
        system: `You are a GCSE study assistant. Extract topics from the provided pathway document. Return ONLY valid JSON (no markdown):
{"subject":"Subject Name","topics":[{"id":"1.1","description":"topic text","confidence":1}]}
- confidence is the number (1-4) from the document. If no number, use null.
- Assign sequential IDs like 1.1, 1.2, 2.1 etc.`,
        user: text, max_tokens: 4096,
      });
      const data = parseJSON(raw);
      const rated = data.topics.filter((t) => t.confidence !== null && t.confidence >= 1 && t.confidence <= 4);
      if (rated.length === 0) throw new Error("No topics with confidence ratings (1–4) were found. Please check your document.");
      onTopicsReady({ subject: data.subject, topics: rated });
    } catch (e) { setError(e.message || "Failed to extract topics. Please try again."); }
    setLoading(false);
  }, [onTopicsReady]);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setLoading(true); setError("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const raw = await callClaude({
          system: `You are a GCSE study assistant. Extract topics from the PDF pathway document. Return ONLY valid JSON (no markdown):
{"subject":"Subject Name","topics":[{"id":"1.1","description":"topic text","confidence":1}]}
- confidence is the number (1-4) from the confidence column. If no number, use null.
- Assign sequential IDs like 1.1, 1.2, 2.1 etc.`,
          user: "Extract the topics and confidence ratings from this pathway document.",
          max_tokens: 4096,
          documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }],
        });
        const data = parseJSON(raw);
        const rated = data.topics.filter((t) => t.confidence !== null && t.confidence >= 1 && t.confidence <= 4);
        if (rated.length === 0) throw new Error("No topics with confidence ratings (1–4) were found in the PDF.");
        onTopicsReady({ subject: data.subject, topics: rated });
      } catch (e) { setError(e.message || "Failed to extract topics from PDF."); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onTopicsReady]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Penguin size={80} expression="normal" />
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: "#1a3a4f", margin: "10px 0 4px", letterSpacing: "-0.5px" }}>Pathway Penguin</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: "#7ab3cc", fontSize: 16, margin: 0 }}>Upload your subject pathway and let Pip quiz you!</p>
      </div>
      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 30px rgba(91,174,212,0.1)", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1.5px solid rgba(180,220,240,0.35)" }}>
          {["pdf", "text"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "14px", background: tab === t ? "rgba(126,173,216,0.07)" : "white", border: "none", borderBottom: tab === t ? "2.5px solid #7eadd8" : "2.5px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: tab === t ? 600 : 400, color: tab === t ? "#5a9ac4" : "#9ac0d8", fontSize: 14, transition: "all 0.2s" }}>
              {t === "pdf" ? "📄 Upload PDF" : "📝 Paste Text"}
            </button>
          ))}
        </div>
        <div style={{ padding: 24 }}>
          {tab === "pdf" ? (
            <div onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${dragging ? "#7eadd8" : "rgba(180,220,240,0.6)"}`, borderRadius: 18, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(126,173,216,0.06)" : "rgba(218,238,250,0.15)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Penguin size={68} expression={dragging ? "happy" : "normal"} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: "#7ab3cc", margin: 0, fontSize: 15 }}>{dragging ? "Drop it here!" : "Drag & drop your pathway PDF or click to browse"}</p>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your pathway document text here... Topics with confidence ratings 1–4 will be extracted." style={{ width: "100%", height: 180, padding: 14, borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
              <button onClick={() => extractFromText(pasteText)} disabled={!pasteText.trim() || loading} style={{ padding: "12px 24px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 15, cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed", opacity: pasteText.trim() && !loading ? 1 : 0.55 }}>
                Extract Topics →
              </button>
            </div>
          )}
          {loading && <div style={{ marginTop: 16, textAlign: "center" }}><p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: "#7eadd8", fontSize: 14 }}>🐧 Pip is reading your document...</p></div>}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

/* ─── QUIZ SCREEN ────────────────────────────────────────────────── */
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
    setChecking(true); setError("");
    try {
      const raw = await callClaude({
        system: `You are checking a student's answer. Return ONLY valid JSON: {"correct":true,"feedback":"one short sentence"}`,
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
      setWorkings(""); setAnswer(""); setSubmitted(false); setFeedback(null); setError("");
    }
  }

  function skip() { setResults((r) => [...r, { topicId: current.topicId, correct: false }]); next(); }

  useEffect(() => { if (answerRef.current) answerRef.current.focus(); }, [currentIdx]);
  if (!current) return null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ height: 5, background: "#ddeefa", borderRadius: 3, marginBottom: 22, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((currentIdx + (submitted ? 1 : 0)) / total) * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ padding: "5px 14px", borderRadius: 20, background: "rgba(126,173,216,0.12)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#5a9ac4", fontWeight: 500 }}>
          {topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: "#7ab3cc", margin: 0 }}>{currentIdx + 1} / {total}</p>
      </div>
      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 30px rgba(91,174,212,0.1)", padding: "26px 28px", marginBottom: 16 }}>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "#1a3a4f", lineHeight: 1.45, margin: "0 0 22px" }}>{current.question}</p>
        <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: "0.09em", fontWeight: 500, color: "#9ac0d8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Your Workings</label>
        <textarea value={workings} onChange={(e) => setWorkings(e.target.value)} placeholder="Show your working here..." disabled={submitted} style={{ width: "100%", height: 80, padding: 12, borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 14, background: submitted ? "#f7fbfd" : "white" }} />
        <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: "0.09em", fontWeight: 500, color: "#9ac0d8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Final Answer</label>
        <input ref={answerRef} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !submitted && submitAnswer()} placeholder="Enter your answer..." disabled={submitted} style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: `1.5px solid ${submitted && feedback ? (feedback.correct ? "rgba(61,186,140,0.45)" : "rgba(224,112,112,0.45)") : "rgba(180,220,240,0.55)"}`, fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box", background: submitted ? "#f7fbfd" : "white" }} />
        <ErrorBox message={error} />
        {(checking || submitted) && <SpeechBubble loading={checking} correct={feedback?.correct} feedback={feedback?.feedback} />}
        {submitted && !feedback?.correct && current.steps?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 14, color: "#1a3a4f", marginBottom: 10 }}>Step-by-step:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {current.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600 }}>{i + 1}</div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.6, paddingTop: 4 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!submitted ? (
          <>
            <button onClick={submitAnswer} disabled={!answer.trim() || checking} style={{ padding: "12px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 15, cursor: answer.trim() && !checking ? "pointer" : "not-allowed", opacity: answer.trim() && !checking ? 1 : 0.55 }}>Submit Answer</button>
            <button onClick={skip} style={{ padding: "12px 18px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#7ab3cc", fontFamily: "'DM Sans',sans-serif", fontWeight: 400, fontSize: 15, cursor: "pointer" }}>Skip</button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "12px 18px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.4)", color: "#5a9ac4", fontFamily: "'DM Sans',sans-serif", fontWeight: 400, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 18 }}>🐧</span> Ask Pip</button>
          </>
        ) : (
          <>
            <button onClick={next} style={{ padding: "12px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 15, cursor: "pointer" }}>{currentIdx + 1 >= total ? "See Results →" : "Next Question →"}</button>
            <button onClick={onAskPip} style={{ marginLeft: "auto", padding: "12px 18px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(126,173,216,0.4)", color: "#5a9ac4", fontFamily: "'DM Sans',sans-serif", fontWeight: 400, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 18 }}>🐧</span> Ask Pip</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── RESULTS SCREEN ─────────────────────────────────────────────── */
function ResultsScreen({ subject, topics, score, total, results, topicResults, onRetry, onReset }) {
  const pct = total > 0 ? score / total : 0;
  const expression = pct >= 0.7 ? "happy" : "sad";
  const message = pct === 1 ? "Perfect score! 🎉" : pct >= 0.85 ? "Outstanding work! 🌟" : pct >= 0.7 ? "Strong performance! 👏" : pct >= 0.5 ? "Keep going — you're getting there! 💪" : "Don't give up — practice makes perfect! 🐧";
  const wrongIds = [...new Set(results.filter((r) => !r.correct).map((r) => r.topicId))];
  const rightIds = [...new Set(results.filter((r) => r.correct).map((r) => r.topicId))].filter((id) => !wrongIds.includes(id));
  const getTopic = (id) => topics.find((t) => t.id === id);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Penguin size={80} expression={expression} />
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 52, color: "#1a3a4f", margin: "8px 0 4px", lineHeight: 1, letterSpacing: "-1px" }}>{score}/{total}</h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 18, color: "#6ba3be", margin: 0 }}>{message}</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14, color: "#9ac0d8", marginTop: 4 }}>{subject}</p>
      </div>
      {wrongIds.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 16, color: "#1a3a4f", marginBottom: 12 }}>Areas to Focus On</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wrongIds.map((id) => { const t = getTopic(id); if (!t) return null; return (
              <div key={id} style={{ background: "rgba(224,112,112,0.07)", border: "1.5px solid rgba(224,112,112,0.2)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ padding: "3px 11px", borderRadius: 20, background: "rgba(224,112,112,0.12)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: "#c0392b", whiteSpace: "nowrap" }}>{t.id}</span>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
              </div>
            ); })}
          </div>
        </div>
      )}
      {rightIds.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 16, color: "#1a3a4f", marginBottom: 12 }}>Strong Topics</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rightIds.map((id) => { const t = getTopic(id); if (!t) return null; return (
              <div key={id} style={{ background: "rgba(61,186,140,0.07)", border: "1.5px solid rgba(61,186,140,0.2)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ padding: "3px 11px", borderRadius: 20, background: "rgba(61,186,140,0.12)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: "#27826a", whiteSpace: "nowrap" }}>{t.id}</span>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14, color: "#1a3a4f", margin: 0 }}>{t.description}</p>
              </div>
            ); })}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onRetry} style={{ flex: 1, padding: "14px", borderRadius: 16, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 15, cursor: "pointer" }}>Retry Quiz</button>
        <button onClick={onReset} style={{ flex: 1, padding: "14px", borderRadius: 16, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#7ab3cc", fontFamily: "'DM Sans',sans-serif", fontWeight: 400, fontSize: 15, cursor: "pointer" }}>Upload New Pathway</button>
      </div>
    </div>
  );
}

/* ─── APP ────────────────────────────────────────────────────────── */
export default function App() {
  const [stage, setStage] = useState("upload");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pipOpen, setPipOpen] = useState(false);
  const [currentQuestionIdx] = useState(0);

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
          system: `You are a GCSE exam question generator. Return ONLY valid JSON (no markdown):
{"question":"the exam question","answer":"short model answer","steps":["plain sentence 1","plain sentence 2","plain sentence 3"]}
Max 4 steps. Each step = one short plain English sentence. No jargon.`,
          user: `Generate one GCSE exam question for: "${topic.description}". Confidence level ${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]}).`,
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
      setLoadError(e.message || "Failed to generate questions. Please try again.");
      setStage("upload");
    }
  }

  function handleQuizFinish(results) { setQuizResults(results); setStage("results"); }
  function handleRetry() { setQuizResults(null); setStage("quiz"); }

  const currentQuestion = stage === "quiz" ? questions[currentQuestionIdx] : null;
  const currentTopic = currentQuestion ? topics.find((t) => t.id === currentQuestion.topicId) : null;

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>

      {/* Loading screen — full viewport overlay */}
      {stage === "loading" && <LoadingScreen progress={loadProgress} total={topics.length} />}

      {/* Main content */}
      {stage !== "loading" && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", padding: "32px 0" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
            <StepDots stage={stage} />
          </div>

          {stage === "upload" && (
            <>
              <UploadScreen onTopicsReady={handleTopicsReady} />
              {loadError && <div style={{ maxWidth: 560, margin: "16px auto 0", padding: "0 16px" }}><ErrorBox message={loadError} /></div>}
            </>
          )}
          {stage === "quiz" && <QuizScreen subject={subject} topics={topics} questions={questions} onFinish={handleQuizFinish} onAskPip={() => setPipOpen(true)} />}
          {stage === "results" && quizResults && <ResultsScreen subject={subject} topics={topics} score={quizResults.score} total={quizResults.total} results={quizResults.results} topicResults={quizResults.topicResults} onRetry={handleRetry} onReset={reset} />}
        </div>
      )}

      {/* Floating Ask Pip button */}
      {(stage === "quiz" || stage === "results") && !pipOpen && (
        <button onClick={() => setPipOpen(true)} style={{ position: "fixed", bottom: 20, right: 16, padding: "10px 18px", borderRadius: 30, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 18px rgba(91,174,212,0.4)", zIndex: 999 }}>
          <span style={{ fontSize: 20 }}>🐧</span> Ask Pip
        </button>
      )}

      {pipOpen && <PipChat topic={currentTopic} question={currentQuestion?.question} correctAnswer={currentQuestion?.answer} onClose={() => setPipOpen(false)} />}
    </>
  );
}
