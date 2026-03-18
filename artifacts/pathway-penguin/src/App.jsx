import { useState, useRef, useEffect, useCallback } from "react";
import av1 from "@assets/1__1_-removebg-preview_1773838630317.png";
import av2 from "@assets/4__1_-removebg-preview_1773838630314.png";
import av3 from "@assets/5__1_-removebg-preview_1773838630315.png";
import av4 from "@assets/6__1_-removebg-preview_1773838630316.png";
import av5 from "@assets/7__1_-removebg-preview_1773838630316.png";
const AVATARS = [null, av1, av2, av3, av4, av5]; // index 1–5 match DB value

const FONT = "'Nunito', -apple-system, system-ui, sans-serif";
const CONFIDENCE_LABELS = { 1: "Refresher", 2: "Consolidate", 3: "Needs Help", 4: "New Topic" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATIONS = [{ label: "30 min", value: 30 }, { label: "1 hour", value: 60 }, { label: "1.5 hours", value: 90 }, { label: "2 hours", value: 120 }];
const OPTION_SUBJECTS = ["Statistics/Further Maths", "Computer Science", "Geography", "Programmable Systems"];
const CORE_SUBJECTS = ["Maths", "English Language", "English Literature", "Biology", "Chemistry", "Physics", "Engineering Design", "Engineering Manufacture"];

/* ── API helpers ─────────────────────────────────────────────── */
function callApi(path, options = {}) {
  return fetch(path, {
    ...options,
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    body: options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
  }).then((r) => r.json());
}

function callClaude({ system, user, max_tokens = 4096, documents = [] }) {
  return fetch("/api/ai/message", {
    method: "POST",
    credentials: "include",
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
  let text = raw.replace(/```json\s*|```/g, "").trim();
  const start = text.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found in response");
  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0, end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === opener) depth++;
    else if (text[i] === closer) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Malformed JSON in response");
  return JSON.parse(text.slice(start, end + 1));
}

async function batchedMap(arr, size, fn) {
  const results = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

/* ── Pip image ────────────────────────────────────────────────── */
function Pip({ size = 60 }) {
  return <img src="/pip.png" alt="Pip the penguin" style={{ width: size, height: "auto", display: "inline-block", flexShrink: 0 }} />;
}

/* ── Question text renderer ───────────────────────────────────── */
function QuestionText({ text }) {
  // Split on triple-backtick code fences (```lang\ncode```)
  const segments = [];
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = fenceRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "prose", content: text.slice(last, m.index) });
    segments.push({ type: "code", lang: m[1] || "", content: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "prose", content: text.slice(last) });
  if (segments.length === 0) segments.push({ type: "prose", content: text });

  function renderInline(str) {
    // Render inline backtick code within a prose string
    const tokens = str.split(/`([^`]+)`/);
    if (tokens.length === 1) return str;
    return tokens.map((t, i) =>
      i % 2 === 0 ? t : <code key={i} style={{ fontFamily: "monospace", background: "rgba(91,174,212,0.12)", borderRadius: 4, padding: "1px 5px", fontSize: 13, color: "#1a3a5f" }}>{t}</code>
    );
  }

  function renderProse(content) {
    const trimmed = content.replace(/^\n+/, "").replace(/\n+$/, "");
    if (!trimmed) return null;
    const parts = trimmed.split(/(?=\n\d+[.)]\s|\n[a-z][)]\s)/i);
    if (parts.length <= 1) {
      return <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: "#1a3a4f", lineHeight: 1.6, margin: 0 }}>{renderInline(trimmed)}</p>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {parts.map((part, i) => {
          const t = part.replace(/^\n/, "").trim();
          if (!t) return null;
          const isPoint = /^\d+[.)]\s|^[a-z][)]\s/i.test(t);
          return <p key={i} style={{ fontFamily: FONT, fontWeight: isPoint ? 400 : 500, fontSize: isPoint ? 14.5 : 15, color: isPoint ? "#2d5a7a" : "#1a3a4f", lineHeight: 1.6, margin: 0 }}>{renderInline(t)}</p>;
        })}
      </div>
    );
  }

  function renderCode(content, lang) {
    return (
      <div style={{ background: "#1e2f3e", borderRadius: 12, padding: "14px 16px", marginTop: 2, marginBottom: 2 }}>
        {lang && <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{lang}</p>}
        <pre style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13.5, color: "#daeefa", lineHeight: 1.75, margin: 0, whiteSpace: "pre", overflowX: "auto" }}>{content}</pre>
      </div>
    );
  }

  if (segments.length === 1 && segments[0].type === "prose") return renderProse(segments[0].content) ?? <></>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {segments.map((seg, i) =>
        seg.type === "code"
          ? <div key={i}>{renderCode(seg.content, seg.lang)}</div>
          : <div key={i}>{renderProse(seg.content)}</div>
      )}
    </div>
  );
}

/* ── Trace table ──────────────────────────────────────────────── */
function TraceTable({ headers, initialRows, disabled, onChange }) {
  const [cells, setCells] = useState(() => initialRows.map((row) => row.map((v) => (v === null || v === undefined ? "" : String(v)))));
  function update(ri, ci, val) {
    setCells((prev) => { const next = prev.map((r) => [...r]); next[ri][ci] = val; onChange(next); return next; });
  }
  const cellStyle = { border: "1.5px solid rgba(126,173,216,0.35)", padding: "6px 8px", minWidth: 72, fontFamily: FONT, fontSize: 13, color: "#1a3a4f", background: "white" };
  const inputStyle = { width: "100%", border: "none", outline: "none", fontFamily: FONT, fontSize: 13, color: "#1a3a4f", background: "transparent", padding: 0 };
  return (
    <div style={{ overflowX: "auto", marginTop: 14, marginBottom: 4 }}>
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", marginBottom: 7 }}>Trace Table — fill in each cell</p>
      <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead><tr>{headers.map((h, i) => <th key={i} style={{ ...cellStyle, background: "rgba(126,173,216,0.1)", fontWeight: 700, fontSize: 12, color: "#4a8cbf", textAlign: "left" }}>{h}</th>)}</tr></thead>
        <tbody>{cells.map((row, ri) => (<tr key={ri}>{row.map((val, ci) => (<td key={ci} style={cellStyle}>{disabled ? <span>{val}</span> : <input value={val} onChange={(e) => update(ri, ci, e.target.value)} style={inputStyle} placeholder="…" />}</td>))}</tr>))}</tbody>
      </table>
    </div>
  );
}

/* ── Step dots ────────────────────────────────────────────────── */
function StepDots({ stage }) {
  const stages = ["upload", "quiz", "results"];
  const idx = Math.max(0, stages.indexOf(stage));
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
      {stages.map((_, i) => <div key={i} style={{ height: 7, width: i === idx ? 22 : 7, borderRadius: 4, background: i === idx ? "#7eadd8" : "#c8dff0", transition: "all 0.3s" }} />)}
    </div>
  );
}

/* ── Error box ────────────────────────────────────────────────── */
function ErrorBox({ message }) {
  if (!message) return null;
  return <div style={{ background: "rgba(220,100,100,0.08)", border: "1.5px solid rgba(220,100,100,0.25)", borderRadius: 14, padding: "11px 15px", color: "#b03030", fontSize: 14, fontFamily: FONT, marginTop: 12 }}>{message}</div>;
}

/* ── Loading screen ───────────────────────────────────────────── */
function LoadingScreen({ progress, total, error, onRetry, onHome }) {
  const pct = total > 0 ? progress / total : 0;
  if (error) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 32 }}>
        <Pip size={72} />
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "#1a3a4f", margin: 0, textAlign: "center" }}>Something went wrong</h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#9ac0d8", margin: 0, textAlign: "center", maxWidth: 340 }}>{error}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
          <button onClick={onRetry} style={{ padding: "11px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Try again</button>
          <button onClick={onHome} style={{ padding: "11px 18px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#9ac0d8", fontFamily: FONT, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Go home</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "white", display: "flex", flexDirection: "column" }}>
      {/* Progress bar area */}
      <div style={{ padding: "22px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, marginBottom: 10 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#5baed4", margin: 0 }}>Generating questions</p>
          <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: "#9ac0d8", margin: 0 }}>{progress} / {total}</p>
        </div>
        <div style={{ height: 6, background: "#e8f4fb", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 6, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Video centred on white */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <video autoPlay loop muted playsInline style={{ maxWidth: 260, width: "60%", borderRadius: 20 }}>
          <source src="/loading-bg.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

/* ── Speech bubble ────────────────────────────────────────────── */
function SpeechBubble({ loading, marksAwarded, marksAvailable, noWorkings, feedback }) {
  const isCorrect = marksAwarded === marksAvailable;
  const isPartial = marksAwarded > 0 && marksAwarded < marksAvailable;
  const text = loading ? null
    : isCorrect ? `Waddle waddle — nailed it! ${feedback}`
    : isPartial ? `${marksAwarded}/${marksAvailable} marks! ${feedback}`
    : `Not quite! ${feedback}`;
  const bg = loading ? "#f0f8ff" : isCorrect ? "rgba(60,186,140,0.07)" : isPartial ? "rgba(240,180,30,0.08)" : "rgba(220,100,100,0.07)";
  const border = loading ? "#c8dff0" : isCorrect ? "rgba(60,186,140,0.3)" : isPartial ? "rgba(240,180,30,0.4)" : "rgba(220,100,100,0.3)";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18 }}>
      <Pip size={46} />
      <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: "16px 16px 16px 5px", padding: "13px 16px", flex: 1, minHeight: 56, display: "flex", alignItems: "center" }}>
        {loading ? (
          <div style={{ display: "flex", gap: 6 }}>{[0,1,2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}</div>
        ) : (
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.55 }}>{text}</p>
        )}
      </div>
    </div>
  );
}

/* ── Pip chat panel ───────────────────────────────────────────── */
function PipChat({ topic, question, correctAnswer, questionAnswered, onClose }) {
  const greeting = questionAnswered
    ? "Hi! I'm Pip 🐧 Great effort on that question — ask me anything and I'll give you a full explanation!"
    : "Hi! I'm Pip 🐧 I can give you a hint to point you in the right direction, but I won't reveal the answer until you've had a go!";
  const [messages, setMessages] = useState([{ role: "pip", text: greeting }]);
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
      const system = questionAnswered
        ? `You are Pip, a friendly GCSE study penguin. The student has already answered this question. Topic: "${topic?.description}". The question was: "${question}". The correct answer is: "${correctAnswer}". You may now give full explanations including the answer and any relevant working. Reply in 2-3 short plain sentences. No bullet points. Friendly, encouraging tone.`
        : `You are Pip, a friendly GCSE study penguin. The student has NOT yet answered this question. Topic: "${topic?.description}". The question is: "${question}". IMPORTANT: You must NOT reveal the answer or any part of it. If the student asks for the answer directly, politely decline and offer a small conceptual hint instead — something that helps them think in the right direction without giving it away. Keep hints brief (one sentence). Reply in 2-3 short plain sentences. No bullet points. Friendly, encouraging tone.`;
      const reply = await callClaude({ system, user: text, max_tokens: 300 });
      setMessages((m) => [...m, { role: "pip", text: reply }]);
    } catch { setMessages((m) => [...m, { role: "pip", text: "Oops, I hit an iceberg! Try again." }]); }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 78, right: 16, width: 310, maxHeight: 430, background: "white", borderRadius: 22, boxShadow: "0 6px 28px rgba(91,174,212,0.22), 0 0 0 1.5px rgba(126,173,216,0.28)", display: "flex", flexDirection: "column", zIndex: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(180,220,240,0.4)" }}>
        <Pip size={36} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f" }}>Pip</p>
          <p style={{ margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 12, color: "#7ab3cc" }}>Your study penguin</p>
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
              {[0,1,2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}
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

/* ── Rank system ──────────────────────────────────────────────── */
const RANKS = [
  { name: "Little Blue",  latin: "Eudyptula minor",          subtitle: "the world's smallest penguin",  desc: "Tiny but eager. Every journey starts here.",                       emoji: "🐧", min: 0,    max: 99 },
  { name: "Magellanic",   latin: "Spheniscus magellanicus",   subtitle: "the South American explorer",   desc: "Setting out on the voyage. Bold stripes, bolder ambition.",        emoji: "🐧", min: 100,  max: 299 },
  { name: "Rockhopper",   latin: "Eudyptes chrysocome",       subtitle: "fearless cliff climber",        desc: "Bouncing over obstacles. Tenacious learner.",                       emoji: "🐧", min: 300,  max: 599 },
  { name: "Macaroni",     latin: "Eudyptes chrysolophus",     subtitle: "most abundant penguin",         desc: "Flamboyant and consistent. Hard to miss.",                          emoji: "🐧", min: 600,  max: 999 },
  { name: "Chinstrap",    latin: "Pygoscelis antarcticus",    subtitle: "boldly marked",                 desc: "Disciplined and sharp. A reliable presence.",                      emoji: "🐧", min: 1000, max: 1749 },
  { name: "Gentoo",       latin: "Pygoscelis papua",          subtitle: "fastest swimming penguin",      desc: "Swift progress. Cutting through the curriculum.",                   emoji: "🐧", min: 1750, max: 2749 },
  { name: "King",         latin: "Aptenodytes patagonicus",   subtitle: "second largest penguin",        desc: "Regal and experienced. Commanding respect.",                        emoji: "🐧", min: 2750, max: 3999 },
  { name: "Adelie",       latin: "Pygoscelis adeliae",        subtitle: "true Antarctic native",         desc: "Tough, dedicated, thriving in the harshest conditions.",            emoji: "🐧", min: 4000, max: 5999 },
  { name: "Emperor",      latin: "Aptenodytes forsteri",      subtitle: "the largest penguin on Earth",  desc: "The pinnacle. A true Pathway Penguin legend.",                      emoji: "🐧", min: 6000, max: Infinity },
];

function getRank(pts) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].min) return { ...RANKS[i], rankIdx: i };
  }
  return { ...RANKS[0], rankIdx: 0 };
}

function UserProfilePage({ entry, currentUserId, onBack }) {
  const rank = getRank(entry.points ?? 0);
  const nextRank = RANKS[rank.rankIdx + 1];
  const progress = nextRank
    ? Math.min(100, Math.round(((entry.points - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;
  const isMe = entry.userId === currentUserId;
  const medalIdx = entry.position <= 3 ? entry.position - 1 : -1;
  const medal = medalIdx >= 0 ? MEDAL[medalIdx] : null;

  const headerBg = medal
    ? medal.gradient
    : "linear-gradient(135deg,#daeefa 0%,#7eadd8 100%)";
  const headerText = medal ? medal.text : "#1a3a4f";
  const headerTextSub = medal ? medal.text : "#4a8cbf";

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 0 60px" }}>
      {/* Back button */}
      <div style={{ padding: "18px 16px 0" }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#5baed4" }}
        >
          ← Leaderboard
        </button>
      </div>

      {/* Profile hero card */}
      <div style={{
        margin: "14px 16px 20px",
        borderRadius: 24,
        padding: "28px 24px 24px",
        background: headerBg,
        backgroundSize: medal ? "300% auto" : "auto",
        animation: medal ? "metalShimmer 7s linear infinite" : "none",
        boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "4px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}>
            <img src={AVATARS[entry.avatar ?? 1]} alt={entry.username} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </div>
        <p style={{ fontFamily: FONT, fontWeight: 900, fontSize: 22, color: headerText, margin: "0 0 2px" }}>
          {entry.username}{isMe ? " (you)" : ""}
        </p>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: headerTextSub, opacity: 0.75, margin: "0 0 10px" }}>
          #{entry.position} on the leaderboard
        </p>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.22)", borderRadius: 12, padding: "5px 16px", marginBottom: 6 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: headerText }}>
            {(entry.points ?? 0).toLocaleString()} pts
          </span>
        </div>
      </div>

      {/* Rank card */}
      <div style={{ margin: "0 16px 16px", background: "white", borderRadius: 18, padding: "20px 20px 18px", boxShadow: "0 2px 12px rgba(91,174,212,0.09)", border: "1.5px solid rgba(180,220,240,0.35)" }}>
        <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: "#1a3a4f", margin: "0 0 1px" }}>{rank.name}</p>
        <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: "0 0 10px", fontStyle: "italic" }}>
          {rank.latin} — {rank.subtitle}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#4a8cbf", margin: "0 0 16px", lineHeight: 1.5 }}>{rank.desc}</p>

        {nextRank ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", fontWeight: 600 }}>
                {(entry.points ?? 0).toLocaleString()} pts
              </span>
              <span style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", fontWeight: 600 }}>
                {nextRank.name} at {nextRank.min.toLocaleString()} pts
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(180,220,240,0.25)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 4, transition: "width 0.8s ease" }} />
            </div>
            <p style={{ fontFamily: FONT, fontSize: 11, color: "#b0cfe4", margin: "6px 0 0", textAlign: "right" }}>
              {nextRank.min - (entry.points ?? 0)} pts to go
            </p>
          </>
        ) : (
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#5baed4", fontWeight: 700, margin: 0 }}>
            Maximum rank achieved! 🎉
          </p>
        )}
      </div>

      {/* All rank tiers */}
      <div style={{ margin: "0 16px", background: "white", borderRadius: 18, padding: "18px 20px", boxShadow: "0 2px 12px rgba(91,174,212,0.09)", border: "1.5px solid rgba(180,220,240,0.35)" }}>
        <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: "#1a3a4f", margin: "0 0 14px" }}>Rank Journey</p>
        {RANKS.map((r, i) => {
          const isCurrent = i === rank.rankIdx;
          const isPast = i < rank.rankIdx;
          return (
            <div key={r.name} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 10, marginBottom: 4,
              background: isCurrent ? "rgba(91,174,212,0.10)" : "transparent",
              border: isCurrent ? "1.5px solid rgba(91,174,212,0.3)" : "1.5px solid transparent",
              opacity: isPast ? 0.45 : 1,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{r.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: FONT, fontWeight: isCurrent ? 800 : 600, fontSize: 13, color: isCurrent ? "#1a3a4f" : "#4a8cbf" }}>
                  {r.name}
                </span>
                <span style={{ fontFamily: FONT, fontSize: 11, color: "#b0cfe4", marginLeft: 6 }}>
                  {r.min.toLocaleString()}{r.max !== Infinity ? `–${r.max.toLocaleString()}` : "+"} pts
                </span>
              </div>
              {isCurrent && <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: "#5baed4", background: "rgba(91,174,212,0.15)", borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}>YOU</span>}
              {isPast && <span style={{ fontSize: 13 }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MEDAL = [
  { crown: "🥇", gradient: "linear-gradient(110deg,#a07800 0%,#ffd700 30%,#fff8c0 50%,#ffd700 70%,#a07800 100%)", text: "#6b4200" },
  { crown: "🥈", gradient: "linear-gradient(110deg,#6e6e6e 0%,#c8c8c8 30%,#f0f0f0 50%,#c8c8c8 70%,#6e6e6e 100%)", text: "#3a3a3a" },
  { crown: "🥉", gradient: "linear-gradient(110deg,#7a3c10 0%,#cd7f32 30%,#eab47a 50%,#cd7f32 70%,#7a3c10 100%)", text: "#5c2e00" },
];

function LeaderboardScreen({ currentUserId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    callApi("/api/leaderboard")
      .then((data) => { setEntries(data.leaderboard || []); setLoading(false); })
      .catch((e) => { setError(e.message || "Failed to load."); setLoading(false); });
  }, []);

  if (selectedUser) {
    return (
      <UserProfilePage
        entry={selectedUser}
        currentUserId={currentUserId}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
      <div style={{ display: "flex", gap: 7 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <p style={{ fontFamily: FONT, color: "#e05a5a", fontSize: 14 }}>{error}</p>
    </div>
  );

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 60px" }}>
      <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#1a3a4f", margin: "0 0 4px" }}>Leaderboard 🏆</h1>
      <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: "0 0 26px", lineHeight: 1.5 }}>
        Earn points by uploading pathways (+1), attempting questions (+5) and answering correctly (+10 bonus).
      </p>

      {/* ── Medal podium ── */}
      {top3.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${top3.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
          {top3.map((entry, i) => {
            const medal = MEDAL[i];
            const isMe = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                onClick={() => setSelectedUser(entry)}
                style={{
                  borderRadius: 20, padding: "18px 14px 16px", cursor: "pointer",
                  background: medal.gradient, backgroundSize: "300% auto",
                  animation: "metalShimmer 7s linear infinite",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
                  outline: isMe ? "3px solid rgba(255,255,255,0.75)" : "none",
                  outlineOffset: -2,
                  transition: "transform 0.15s",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, position: "relative" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.55)", boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
                    <img src={AVATARS[entry.avatar ?? 1]} alt={entry.username} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <span style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", fontSize: 16, lineHeight: 1 }}>{medal.crown}</span>
                </div>
                <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: medal.text, margin: "10px 0 2px", textAlign: "center", wordBreak: "break-word" }}>
                  {entry.username}{isMe ? " (you)" : ""}
                </p>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: medal.text, opacity: 0.72, margin: "0 0 2px", textAlign: "center" }}>
                  {(entry.points ?? 0).toLocaleString()} pts
                </p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: medal.text, opacity: 0.55, margin: 0, textAlign: "center" }}>
                  {getRank(entry.points ?? 0).name}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rest of list ── */}
      {rest.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rest.map((entry) => {
            const isMe = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                onClick={() => setSelectedUser(entry)}
                style={{
                  background: "white", borderRadius: 14, padding: "12px 16px", cursor: "pointer",
                  border: isMe ? "2px solid #7eadd8" : "1.5px solid rgba(180,220,240,0.35)",
                  boxShadow: "0 2px 8px rgba(91,174,212,0.07)",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 13, color: "#b0cfe4", minWidth: 24, textAlign: "right", flexShrink: 0 }}>
                    {entry.position}.
                  </span>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(91,174,212,0.25)" }}>
                    <img src={AVATARS[entry.avatar ?? 1]} alt={entry.username} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f" }}>
                      {entry.username}{isMe ? " (you)" : ""}
                    </span>
                    <span style={{ fontFamily: FONT, fontSize: 11, color: "#b0cfe4", marginLeft: 8 }}>
                      {getRank(entry.points ?? 0).name}
                    </span>
                  </div>
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#4a8cbf", flexShrink: 0 }}>
                    {(entry.points ?? 0).toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <p style={{ fontFamily: FONT, fontSize: 16, color: "#9ac0d8" }}>No players yet — start quizzing to claim the top spot!</p>
        </div>
      )}
    </div>
  );
}

/* ── Top tab bar ──────────────────────────────────────────────── */
function TopBar({ user, activeStage, onHome, onSuggestions, onCalendar, onAreas, onAccount, onLeaderboard, onLogout }) {
  if (!user) return null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 700);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isActive = (key) => activeStage === key || (key === "home" && ["upload", "quiz", "results", "loading", "topicSelect"].includes(activeStage));

  const navigate = (action) => { setMenuOpen(false); action(); };

  const allTabs = [
    { label: "Home", key: "home", action: () => navigate(onHome) },
    { label: "Suggestions", key: "suggestions", action: () => navigate(onSuggestions) },
    { label: "Calendar", key: "calendar", action: () => navigate(onCalendar) },
    { label: "Leaderboard", key: "leaderboard", action: () => navigate(onLeaderboard) },
    { label: "Subjects", key: "subjects", action: () => navigate(onAreas) },
    { label: "Account", key: "account", action: () => navigate(onAccount) },
  ];
  const tabs = isMobile ? allTabs.filter((t) => t.key !== "home") : allTabs;

  /* ── Mobile layout ── */
  if (isMobile) {
    return (
      <>
        {/* Bar */}
        <div style={{ height: 56, background: "white", borderBottom: "1.5px solid rgba(180,220,240,0.45)", display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 10, flexShrink: 0, position: "relative", zIndex: 200 }}>
          <div onClick={() => navigate(onHome)} style={{ display: "flex", alignItems: "center", flex: 1, cursor: "pointer" }}>
            <Pip size={28} />
          </div>
          {/* Avatar → Account */}
          <button
            onClick={() => navigate(onAccount)}
            style={{ background: "none", border: "2px solid rgba(91,174,212,0.35)", borderRadius: "50%", width: 34, height: 34, padding: 0, cursor: "pointer", overflow: "hidden", flexShrink: 0, marginRight: 6 }}
          >
            <img src={AVATARS[user.avatar ?? 1]} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
          {/* Hamburger → X button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{ background: "none", border: "none", cursor: "pointer", width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {/* Wrapper height=14, bar height=2.5 → each bar moves (14-2.5)/2 = 5.75px to meet at centre */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 22, height: 14 }}>
              <span style={{ display: "block", width: 22, height: 2.5, background: "#1a3a4f", borderRadius: 2, transformOrigin: "center", transition: "transform 0.28s cubic-bezier(.4,0,.2,1)", transform: menuOpen ? "translateY(5.75px) rotate(45deg)" : "none" }} />
              <span style={{ display: "block", width: 22, height: 2.5, background: "#1a3a4f", borderRadius: 2, transformOrigin: "center", transition: "transform 0.28s cubic-bezier(.4,0,.2,1)", transform: menuOpen ? "translateY(-5.75px) rotate(-45deg)" : "none" }} />
            </div>
          </button>
        </div>

        {/* Backdrop */}
        {menuOpen && (
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 149 }} />
        )}

        {/* Floating card dropdown */}
        <div style={{ position: "fixed", top: 64, right: 12, width: "75%", background: "white", zIndex: 150, borderRadius: 18, boxShadow: menuOpen ? "0 8px 32px rgba(0,0,0,0.13)" : "none", border: "1.5px solid rgba(180,220,240,0.5)", transformOrigin: "top right", transform: menuOpen ? "scale(1)" : "scale(0.92)", opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none", transition: "transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s ease" }}>
          <div style={{ padding: "10px 14px 14px" }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#7eadd8", margin: "8px 4px 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{user.username}</p>
            <div style={{ height: 1, background: "rgba(180,220,240,0.5)", marginBottom: 8 }} />
            {tabs.map(({ label, key, action }) => {
              const active = isActive(key);
              return (
                <button key={key} onClick={action} style={{ display: "block", width: "100%", textAlign: "left", background: active ? "rgba(91,174,212,0.1)" : "none", border: "none", borderRadius: 10, padding: "12px 14px", fontFamily: FONT, fontWeight: active ? 700 : 600, fontSize: 15, color: active ? "#5baed4" : "#1a3a4f", cursor: "pointer", marginBottom: 2 }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  /* ── Desktop layout (unchanged) ── */
  return (
    <div style={{ height: 56, background: "white", borderBottom: "1.5px solid rgba(180,220,240,0.45)", display: "flex", alignItems: "center", paddingLeft: 20, paddingRight: 20, gap: 0, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 28 }}>
        <button onClick={onAccount} title={user?.username} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, outline: "2px solid rgba(91,174,212,0.3)", outlineOffset: 1 }}>
          <img src={AVATARS[user?.avatar ?? 1]} alt={user?.username ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </button>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: "#1a3a4f", whiteSpace: "nowrap" }}>Pathway Penguin</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, flex: 1 }}>
        {tabs.map(({ label, key, action }) => {
          const active = isActive(key);
          return (
            <button key={key} onClick={action} style={{ background: active ? "rgba(91,174,212,0.1)" : "none", border: "none", borderRadius: 10, padding: "7px 14px", fontFamily: FONT, fontWeight: active ? 700 : 600, fontSize: 14, color: active ? "#5baed4" : "#6a8fa8", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s, color 0.15s" }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(126,173,216,0.07)"; e.currentTarget.style.color = "#1a3a4f"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6a8fa8"; } }}
            >{label}</button>
          );
        })}
      </div>

    </div>
  );
}

/* ── Account screen ───────────────────────────────────────────── */
function AccountScreen({ user, onBack, onUserUpdate, onLogout, onAdmin, onTopSecret }) {
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [emailInput, setEmailInput] = useState("");
  const [usernameMsg, setUsernameMsg] = useState({ type: "", text: "" });
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  async function changeAvatar(idx) {
    if (avatarBusy || (user.avatar ?? 1) === idx) return;
    setAvatarBusy(true);
    const data = await callApi("/api/auth/avatar", { method: "PATCH", body: { avatar: idx } });
    setAvatarBusy(false);
    if (!data.error) onUserUpdate({ ...user, avatar: data.avatar });
  }

  function daysUntil(isoDate, days) {
    if (!isoDate) return null;
    const next = new Date(new Date(isoDate).getTime() + days * 24 * 60 * 60 * 1000);
    const diff = Math.ceil((next - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }

  const usernameLocked = daysUntil(user.usernameUpdatedAt, 7);
  const emailLocked = daysUntil(user.emailUpdatedAt, 30);

  async function saveUsername(e) {
    e.preventDefault();
    if (usernameLocked) return;
    setUsernameBusy(true); setUsernameMsg({ type: "", text: "" });
    const data = await callApi("/api/auth/username", { method: "PATCH", body: { username: usernameInput.trim() } });
    setUsernameBusy(false);
    if (data.error) { setUsernameMsg({ type: "error", text: data.error }); }
    else { setUsernameMsg({ type: "ok", text: "Username updated." }); onUserUpdate({ ...user, username: data.username, usernameUpdatedAt: data.usernameUpdatedAt }); }
  }

  async function saveEmail(e) {
    e.preventDefault();
    if (emailLocked) return;
    setEmailBusy(true); setEmailMsg({ type: "", text: "" });
    const data = await callApi("/api/auth/email", { method: "PATCH", body: { email: emailInput.trim() } });
    setEmailBusy(false);
    if (data.error) { setEmailMsg({ type: "error", text: data.error }); }
    else { setEmailMsg({ type: "ok", text: "Email updated." }); onUserUpdate({ ...user, maskedEmail: data.maskedEmail, emailUpdatedAt: data.emailUpdatedAt }); setEmailInput(""); }
  }

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", outline: "none", boxSizing: "border-box", background: "white" };
  const labelStyle = { fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#7ab3cc", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6, display: "block" };
  const saveBtn = (busy, locked) => ({
    padding: "10px 20px", borderRadius: 12, border: "none", background: locked ? "rgba(180,220,240,0.3)" : "linear-gradient(135deg,#7eadd8,#5baed4)", color: locked ? "#9ac0d8" : "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: locked ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1,
  });
  const msgStyle = (type) => ({ fontFamily: FONT, fontSize: 13, color: type === "error" ? "#b03030" : "#27826a", marginTop: 7 });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", padding: "36px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600, fontSize: 14, color: "#7eadd8", padding: 0, marginBottom: 22 }}>Back</button>
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: "#1a3a4f", margin: "0 0 28px" }}>Account</h2>

        {/* Avatar */}
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 16px rgba(126,173,216,0.1)", marginBottom: 20 }}>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: "#1a3a4f", margin: "0 0 16px" }}>Profile picture</h3>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {AVATARS.slice(1).map((src, i) => {
              const idx = i + 1;
              const selected = (user.avatar ?? 1) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => changeAvatar(idx)}
                  disabled={avatarBusy}
                  title={`Avatar ${idx}`}
                  style={{
                    padding: 0, border: "none", background: "none", cursor: avatarBusy ? "not-allowed" : "pointer",
                    borderRadius: "50%", outline: selected ? "3px solid #5baed4" : "3px solid transparent",
                    outlineOffset: 3, transition: "outline 0.15s, transform 0.15s",
                    transform: selected ? "scale(1.08)" : "scale(1)",
                    opacity: avatarBusy && !selected ? 0.55 : 1,
                  }}
                >
                  <img src={src} alt={`Avatar ${idx}`} style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                </button>
              );
            })}
          </div>
          {avatarBusy && (
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: "10px 0 0" }}>Saving…</p>
          )}
        </div>

        {/* Username */}
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 16px rgba(126,173,216,0.1)", marginBottom: 20 }}>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: "#1a3a4f", margin: "0 0 18px" }}>Username</h3>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: "0 0 14px" }}>
            Current: <strong style={{ color: "#1a3a4f" }}>{user.username}</strong>
          </p>
          {usernameLocked ? (
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", background: "rgba(126,173,216,0.08)", padding: "10px 14px", borderRadius: 10, margin: 0 }}>
              You can change your username again in {usernameLocked} day{usernameLocked !== 1 ? "s" : ""}.
            </p>
          ) : (
            <form onSubmit={saveUsername} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={labelStyle}>New username</label>
              <input value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} style={inputStyle} maxLength={20} />
              <div><button type="submit" disabled={usernameBusy} style={saveBtn(usernameBusy, false)}>{usernameBusy ? "Saving..." : "Save username"}</button></div>
              {usernameMsg.text && <p style={msgStyle(usernameMsg.type)}>{usernameMsg.text}</p>}
            </form>
          )}
        </div>

        {/* Email */}
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 16px rgba(126,173,216,0.1)" }}>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: "#1a3a4f", margin: "0 0 18px" }}>Email address</h3>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: "0 0 14px" }}>
            Current: <strong style={{ color: "#1a3a4f" }}>{user.maskedEmail || "—"}</strong>
          </p>
          {emailLocked ? (
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", background: "rgba(126,173,216,0.08)", padding: "10px 14px", borderRadius: 10, margin: 0 }}>
              You can change your email again in {emailLocked} day{emailLocked !== 1 ? "s" : ""}.
            </p>
          ) : (
            <form onSubmit={saveEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={labelStyle}>New school email</label>
              <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} type="email" placeholder="you@utcportsmouth.org" style={inputStyle} />
              <div><button type="submit" disabled={emailBusy} style={saveBtn(emailBusy, false)}>{emailBusy ? "Saving..." : "Save email"}</button></div>
              {emailMsg.text && <p style={msgStyle(emailMsg.type)}>{emailMsg.text}</p>}
            </form>
          )}
        </div>

        {/* Admin / TOP SECRET */}
        <div style={{ marginTop: 28 }}>
          {user.username === "KaneCyrus26" ? (
            <button onClick={onAdmin}
              style={{ width: "100%", padding: "13px", borderRadius: 16, background: "none", border: "1.5px solid rgba(126,173,216,0.35)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(126,173,216,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >Admin Dashboard</button>
          ) : (
            <button onClick={onTopSecret}
              style={{ width: "100%", padding: "13px", borderRadius: 16, background: "none", border: "1.5px solid rgba(40,40,40,0.35)", color: "#333", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: "0.12em" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >TOP SECRET</button>
          )}
        </div>

        {/* Log out */}
        <div style={{ marginTop: 12 }}>
          <button onClick={onLogout}
            style={{ width: "100%", padding: "13px", borderRadius: 16, background: "none", border: "1.5px solid rgba(220,100,100,0.3)", color: "#b03030", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,100,100,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >Log out</button>
        </div>
      </div>
    </div>
  );
}

/* ── Admin dashboard ──────────────────────────────────────────── */
function AdminPage({ onBack }) {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const data = await callApi("/api/admin/stats", { method: "POST", body: { password } });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setStats(data);
    setAuthed(true);
  }

  async function refreshStats() {
    const data = await callApi("/api/admin/stats", { method: "POST", body: { password } });
    if (!data.error) setStats(data);
  }

  const card = (label, value, color) => (
    <div style={{ background: "white", borderRadius: 18, padding: "18px 22px", boxShadow: "0 2px 12px rgba(91,174,212,0.1)", flex: 1, minWidth: 120 }}>
      <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontFamily: FONT, fontSize: 32, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );

  function MiniChart({ days }) {
    if (!days || !days.length) return null;
    const W = 560, H = 180, PAD = { top: 20, right: 20, bottom: 48, left: 32 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(1, ...days.flatMap((d) => [d.logins, d.signups, d.answers]));
    const xStep = chartW / (days.length - 1);
    const series = [
      { key: "logins", color: "#5baed4", label: "Logins" },
      { key: "signups", color: "#27826a", label: "Signups" },
      { key: "answers", color: "#f0a04a", label: "Questions" },
    ];
    const px = (i) => PAD.left + i * xStep;
    const py = (v) => PAD.top + chartH - (v / maxVal) * chartH;

    const hovered = hoveredDay != null ? days[hoveredDay] : null;

    return (
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", fontFamily: FONT }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = PAD.top + chartH * (1 - f);
            return (
              <g key={f}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(180,220,240,0.4)" strokeWidth={1} />
                <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9ac0d8">{Math.round(maxVal * f)}</text>
              </g>
            );
          })}
          {/* Series lines */}
          {series.map(({ key, color }) => {
            const pts = days.map((d, i) => `${px(i)},${py(d[key])}`).join(" ");
            return <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />;
          })}
          {/* Dots + hover zones */}
          {days.map((d, i) => (
            <g key={i}>
              <rect
                x={px(i) - xStep / 2} y={PAD.top} width={xStep} height={chartH}
                fill="transparent" style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredDay(i)} onMouseLeave={() => setHoveredDay(null)}
              />
              {series.map(({ key, color }) => (
                <circle key={key} cx={px(i)} cy={py(d[key])} r={hoveredDay === i ? 5 : 3} fill={color} stroke="white" strokeWidth={1.5} />
              ))}
            </g>
          ))}
          {/* Hover tooltip */}
          {hovered && (() => {
            const i = hoveredDay;
            const tx = Math.min(px(i), W - 110);
            const date = new Date(hovered.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return (
              <g>
                <rect x={tx - 2} y={PAD.top - 4} width={108} height={74} rx={8} fill="white" stroke="rgba(180,220,240,0.6)" strokeWidth={1} filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))" />
                <text x={tx + 52} y={PAD.top + 13} textAnchor="middle" fontSize={10} fontWeight="700" fill="#1a3a4f">{date}</text>
                {series.map(({ key, color, label }, si) => (
                  <g key={key}>
                    <rect x={tx + 6} y={PAD.top + 22 + si * 16} width={8} height={8} rx={2} fill={color} />
                    <text x={tx + 18} y={PAD.top + 30 + si * 16} fontSize={10} fill="#1a3a4f">{label}: {hovered[key]}</text>
                  </g>
                ))}
              </g>
            );
          })()}
          {/* X axis labels */}
          {days.map((d, i) => {
            if (i % 2 !== 0) return null;
            const date = new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ac0d8">{date}</text>;
          })}
          {/* Legend */}
          {series.map(({ color, label }, i) => (
            <g key={label}>
              <rect x={PAD.left + i * 90} y={H - 20} width={10} height={10} rx={3} fill={color} />
              <text x={PAD.left + i * 90 + 14} y={H - 11} fontSize={10} fill="#6a8fa8">{label}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  function UserList({ title, usernames, color }) {
    if (!usernames.length) return (
      <div>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#9ac0d8", margin: "0 0 6px" }}>{title}</p>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", fontStyle: "italic" }}>None today</p>
      </div>
    );
    return (
      <div>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#6a8fa8", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {usernames.map((u) => (
            <span key={u} style={{ padding: "3px 10px", borderRadius: 20, background: color + "18", color, fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>{u}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", padding: "36px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600, fontSize: 14, color: "#7eadd8", padding: 0, marginBottom: 22 }}>← Back</button>
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: "#1a3a4f", margin: "0 0 28px" }}>Admin Dashboard</h2>

        {!authed ? (
          <div style={{ background: "white", borderRadius: 20, padding: 28, boxShadow: "0 2px 16px rgba(126,173,216,0.1)" }}>
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#6a8fa8", margin: "0 0 18px" }}>Enter the admin password to continue.</p>
            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                style={{ padding: "11px 14px", borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", outline: "none" }}
                autoFocus
              />
              {error && <p style={{ fontFamily: FONT, fontSize: 13, color: "#b03030", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ padding: "11px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {loading ? "Checking…" : "Unlock"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Refresh */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={refreshStats} style={{ padding: "7px 16px", borderRadius: 10, border: "1px solid rgba(126,173,216,0.35)", background: "white", fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#5baed4", cursor: "pointer" }}>↻ Refresh</button>
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {card("Logins today", stats.today.logins, "#5baed4")}
              {card("Signups today", stats.today.signups, "#27826a")}
              {card("Questions answered", stats.today.answers, "#f0a04a")}
              {card("Total users", stats.totalUsers, "#7eadd8")}
            </div>

            {/* Chart */}
            <div style={{ background: "white", borderRadius: 20, padding: "22px 18px", boxShadow: "0 2px 16px rgba(126,173,216,0.1)" }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f", margin: "0 0 16px" }}>Last 14 days</p>
              <MiniChart days={stats.days} />
            </div>

            {/* User lists */}
            <div style={{ background: "white", borderRadius: 20, padding: "22px 22px", boxShadow: "0 2px 16px rgba(126,173,216,0.1)", display: "flex", flexDirection: "column", gap: 18 }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f", margin: 0 }}>Today's activity</p>
              <UserList title="Logged in" usernames={stats.loginUsers} color="#5baed4" />
              <UserList title="Signed up" usernames={stats.signupUsers} color="#27826a" />
              <UserList title="Answered questions" usernames={stats.answerUsers} color="#f0a04a" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Login screen ─────────────────────────────────────────────── */
function LoginScreen({ onLogin, onSignup, onForgot }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true); setError("");
    const data = await callApi("/api/auth/login", { method: "POST", body: { username: username.trim(), password } });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    onLogin(data);
  }

  const inputStyle = { width: "100%", padding: "12px 15px", borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Pip size={80} />
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: "#1a3a4f", margin: "12px 0 6px", letterSpacing: "-1px" }}>Pathway Penguin</h1>
          <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 15, margin: 0 }}>Sign in to start revising</p>
        </div>
        <div style={{ background: "white", borderRadius: 26, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "28px 28px 24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 6 }}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" style={inputStyle} autoComplete="username" />
            </div>
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" style={inputStyle} autoComplete="current-password" />
            </div>
            <ErrorBox message={error} />
            <button type="submit" disabled={loading || !username.trim() || !password}
              style={{ padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <button onClick={onForgot} style={{ background: "none", border: "none", color: "#7ab3cc", fontFamily: FONT, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Forgot password?
            </button>
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#9ac0d8", margin: 0 }}>
              New to Pathway Penguin?{" "}
              <button onClick={onSignup} style={{ background: "none", border: "none", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Create account
              </button>
            </p>
          </div>
        </div>
        <p style={{ textAlign: "center", fontFamily: FONT, fontSize: 12, color: "#b8d4e4", marginTop: 16 }}>Only for UTC Portsmouth students in Years 10–13</p>
      </div>
    </div>
  );
}

/* ── Signup screen ────────────────────────────────────────────── */
function SignupScreen({ onSignup, onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [pendingData, setPendingData] = useState(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  function toggleOption(subject) {
    setSelectedOptions((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : prev.length < 2 ? [...prev, subject] : prev
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (selectedOptions.length !== 2) { setError("Please select exactly 2 option subjects."); return; }
    setLoading(true);
    const data = await callApi("/api/auth/signup", {
      method: "POST",
      body: { username: username.trim(), email: email.trim(), password, yearGroup: Number(yearGroup), optionSubjects: selectedOptions },
    });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setPendingData(data);
    setStep(2);
  }

  async function pickAvatar(idx) {
    setAvatarBusy(true);
    await callApi("/api/auth/avatar", { method: "PATCH", body: { avatar: idx } });
    setAvatarBusy(false);
    onSignup({ ...pendingData, avatar: idx });
  }

  if (step === 2) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px 40px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Pip size={54} />
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: "#1a3a4f", margin: "12px 0 6px" }}>Choose your penguin</h1>
            <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 14, margin: 0 }}>Pick a profile picture — you can change it later</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {AVATARS.slice(1).map((src, i) => {
              const idx = i + 1;
              return (
                <button
                  key={idx}
                  onClick={() => !avatarBusy && pickAvatar(idx)}
                  disabled={avatarBusy}
                  style={{
                    background: "white", border: "2px solid rgba(180,220,240,0.5)", borderRadius: 20,
                    padding: 16, cursor: avatarBusy ? "not-allowed" : "pointer", display: "flex", justifyContent: "center",
                    boxShadow: "0 4px 18px rgba(91,174,212,0.1)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    opacity: avatarBusy ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => { if (!avatarBusy) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(91,174,212,0.18)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(91,174,212,0.1)"; }}
                >
                  <img src={src} alt={`Avatar ${idx}`} style={{ width: 130, height: 130, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                </button>
              );
            })}
          </div>
          {avatarBusy && (
            <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 24 }}>
              {[0,1,2].map((i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 13, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 40px" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Pip size={60} />
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#1a3a4f", margin: "10px 0 4px", letterSpacing: "-0.5px" }}>Create your account</h1>
          <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 14, margin: 0 }}>UTC Portsmouth students only</p>
        </div>

        <div style={{ background: "white", borderRadius: 26, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "26px 26px 22px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>

            {/* Username */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="3–20 chars, letters/numbers/underscores" style={inputStyle} autoComplete="username" />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>School email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@utcportsmouth.org" style={inputStyle} autoComplete="email" />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters, at least 1 number" style={inputStyle} autoComplete="new-password" />
            </div>

            {/* Year group */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>Year group</label>
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}
                style={{ ...inputStyle, appearance: "none", background: "white", cursor: "pointer" }}>
                <option value="">Select your year…</option>
                {[10, 11, 12, 13].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            {/* Core subjects — auto-filled */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 8 }}>Core subjects (auto-filled)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CORE_SUBJECTS.map((s) => (
                  <span key={s} style={{ padding: "4px 11px", borderRadius: 20, background: "rgba(126,173,216,0.1)", border: "1px solid rgba(126,173,216,0.25)", fontFamily: FONT, fontSize: 12, color: "#4a8cbf" }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Option subjects */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 8 }}>Choose 2 option subjects</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {OPTION_SUBJECTS.map((s) => {
                  const checked = selectedOptions.includes(s);
                  const disabled = !checked && selectedOptions.length >= 2;
                  return (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}>
                      <div onClick={() => !disabled && toggleOption(s)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#5baed4" : "rgba(180,220,240,0.7)"}`, background: checked ? "#5baed4" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
                        {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f" }}>{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <ErrorBox message={error} />

            <button type="submit" disabled={loading || !username || !email || !password || !yearGroup || selectedOptions.length !== 2}
              style={{ padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontFamily: FONT, fontSize: 14, color: "#9ac0d8", marginTop: 16 }}>
            Already have an account?{" "}
            <button onClick={onLogin} style={{ background: "none", border: "none", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Forgot password screen ───────────────────────────────────── */
function ForgotScreen({ onBack }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true); setError("");
    const data = await callApi("/api/auth/forgot-password", { method: "POST", body: { username: username.trim() } });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setSent(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Pip size={70} />
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: "#1a3a4f", margin: "12px 0 6px" }}>Reset password</h1>
          <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 14, margin: 0 }}>Enter your username and we'll email you a reset link</p>
        </div>
        <div style={{ background: "white", borderRadius: 26, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "26px" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: FONT, fontSize: 15, color: "#1a3a4f", lineHeight: 1.6 }}>
                If that username exists, we've sent a reset link to the school email on file. Check your inbox!
              </p>
              <button onClick={onBack} style={{ marginTop: 16, padding: "11px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" style={{ width: "100%", padding: "12px 14px", borderRadius: 13, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box" }} />
              </div>
              <ErrorBox message={error} />
              <button type="submit" disabled={loading || !username.trim()}
                style={{ padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <button type="button" onClick={onBack} style={{ padding: "9px", borderRadius: 14, background: "transparent", border: "none", color: "#9ac0d8", fontFamily: FONT, fontSize: 13, cursor: "pointer" }}>
                ← Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reset password screen ────────────────────────────────────── */
function ResetScreen({ token, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    const data = await callApi("/api/auth/reset-password", { method: "POST", body: { token, password } });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    onSuccess(data);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Pip size={70} />
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: "#1a3a4f", margin: "12px 0 6px" }}>Choose a new password</h1>
        </div>
        <div style={{ background: "white", borderRadius: 26, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "26px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, at least 1 number" style={{ width: "100%", padding: "12px 14px", borderRadius: 13, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box" }} autoComplete="new-password" />
            </div>
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#4a8cbf", display: "block", marginBottom: 5 }}>Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Same password again" style={{ width: "100%", padding: "12px 14px", borderRadius: 13, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 15, color: "#1a3a4f", outline: "none", boxSizing: "border-box" }} autoComplete="new-password" />
            </div>
            <ErrorBox message={error} />
            <button type="submit" disabled={loading || !password || !confirm}
              style={{ padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Updating…" : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar entry card (hover-reveal delete) ────────────────── */
function EntryCard({ entry, subjectColors, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: subjectColors[entry.subject] || "rgba(126,173,216,0.15)", borderRadius: 11, padding: "8px 10px", position: "relative" }}
    >
      <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#1a3a4f", margin: "0 0 3px", lineHeight: 1.3, paddingRight: 18 }}>{entry.subject}</p>
      <p style={{ fontFamily: FONT, fontSize: 11, color: "#4a8cbf", margin: 0 }}>{DURATIONS.find((d) => d.value === entry.duration_minutes)?.label || entry.duration_minutes + "m"}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
        style={{ position: "absolute", top: 5, right: 5, width: 18, height: 18, background: "#e05555", border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: hov ? 1 : 0, transition: "opacity 0.15s", padding: 0, color: "white", fontSize: 13, fontWeight: 700, lineHeight: 1 }}
      >×</button>
    </div>
  );
}

/* ── Calendar screen ──────────────────────────────────────────── */
function CalendarScreen({ user, onBack }) {
  const [entries, setEntries] = useState([]);
  const [dragSubject, setDragSubject] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 700);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const subjects = user?.subjects?.map((s) => s.subject_name) || [];

  useEffect(() => {
    callApi("/api/calendar").then((d) => { if (d.entries) setEntries(d.entries); setLoading(false); });
  }, []);

  async function addEntry(dayOfWeek) {
    if (!dragSubject) return;
    const data = await callApi("/api/calendar", { method: "POST", body: { subject: dragSubject, dayOfWeek, durationMinutes: selectedDuration } });
    if (data.ok) {
      setEntries((prev) => [...prev, { id: data.id, subject: dragSubject, day_of_week: dayOfWeek, duration_minutes: selectedDuration }]);
    }
    setDragSubject(null);
  }

  async function removeEntry(id) {
    await callApi(`/api/calendar/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function onDragStart(subject) { setDragSubject(subject); }
  function onDragOver(e, day) { e.preventDefault(); setDropping(day); }
  function onDragLeave() { setDropping(null); }
  async function onDrop(e, day) { e.preventDefault(); setDropping(null); await addEntry(day); }

  const subjectColors = {};
  subjects.forEach((s, i) => {
    const hues = [210, 160, 40, 280, 20, 340, 180, 130, 260, 60];
    subjectColors[s] = `hsl(${hues[i % hues.length]}, 60%, 88%)`;
  });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{ display: "flex", gap: 7 }}>{[0,1,2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}</div>
    </div>
  );

  /* ── Weekly grid (shared between mobile and desktop) ── */
  const weekGrid = (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "start" }}>
      {DAYS.map((day, dayIdx) => {
        const dayEntries = entries.filter((e) => e.day_of_week === dayIdx);
        const isDropping = dropping === dayIdx;
        const tappable = isMobile && !!dragSubject;
        return (
          <div key={day}
            onDragOver={(e) => onDragOver(e, dayIdx)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, dayIdx)}
            onClick={tappable ? () => addEntry(dayIdx) : undefined}
            style={{ flex: "1 1 110px", background: isDropping || (tappable) ? "rgba(91,174,212,0.06)" : "white", borderRadius: 18, border: `2px ${isDropping ? "dashed #5baed4" : tappable ? "dashed rgba(91,174,212,0.5)" : "solid rgba(180,220,240,0.4)"}`, padding: "14px 10px", minHeight: dayEntries.length > 0 ? "auto" : 90, boxShadow: "0 4px 18px rgba(91,174,212,0.07)", transition: "all 0.15s", cursor: tappable ? "pointer" : "default" }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: tappable ? "#5baed4" : "#4a8cbf", margin: "0 0 12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>{day.slice(0, 3)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {dayEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} subjectColors={subjectColors} onRemove={removeEntry} />
              ))}
            </div>
            {tappable && dayEntries.length === 0 && (
              <div style={{ marginTop: 4, textAlign: "center" }}>
                <p style={{ fontFamily: FONT, fontSize: 11, color: "#5baed4", margin: 0, opacity: 0.7 }}>Tap to add</p>
              </div>
            )}
            {isDropping && (
              <div style={{ marginTop: 8, padding: "8px", borderRadius: 11, border: "2px dashed #5baed4", textAlign: "center" }}>
                <p style={{ fontFamily: FONT, fontSize: 11, color: "#5baed4", margin: 0 }}>Drop here</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Mobile layout ── */
  if (isMobile) {
    return (
      <div style={{ padding: "20px 14px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: "rgba(126,173,216,0.1)", border: "1px solid rgba(126,173,216,0.3)", borderRadius: 12, padding: "7px 14px", fontFamily: FONT, fontSize: 13, color: "#4a8cbf", cursor: "pointer" }}>← Back</button>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "#1a3a4f", margin: 0 }}>Revision Calendar</h2>
        </div>

        {/* Session length chips */}
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session length</p>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
          {DURATIONS.map((d) => (
            <button key={d.value} onClick={() => setSelectedDuration(d.value)}
              style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${selectedDuration === d.value ? "#5baed4" : "rgba(180,220,240,0.6)"}`, background: selectedDuration === d.value ? "rgba(91,174,212,0.12)" : "white", fontFamily: FONT, fontSize: 13, color: selectedDuration === d.value ? "#4a8cbf" : "#9ac0d8", cursor: "pointer", fontWeight: selectedDuration === d.value ? 700 : 500 }}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Subject chips */}
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subjects — tap to select</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {subjects.map((s) => {
            const selected = dragSubject === s;
            return (
              <button key={s}
                onClick={() => setDragSubject(selected ? null : s)}
                style={{ padding: "8px 14px", borderRadius: 20, background: subjectColors[s] || "rgba(126,173,216,0.12)", border: `2px solid ${selected ? "#5baed4" : "transparent"}`, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1a3a4f", cursor: "pointer", boxShadow: selected ? "0 0 0 3px rgba(91,174,212,0.2)" : "none", transition: "all 0.15s", transform: selected ? "scale(1.04)" : "none" }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* Selection hint */}
        {dragSubject && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 14, background: "rgba(91,174,212,0.08)", border: "1px solid rgba(91,174,212,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#4a8cbf", margin: 0, fontWeight: 600 }}>"{dragSubject}" selected — tap a day to add</p>
            <button onClick={() => setDragSubject(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ac0d8", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>
          </div>
        )}

        {weekGrid}
      </div>
    );
  }

  /* ── Desktop layout (unchanged) ── */
  return (
    <div style={{ padding: "24px 20px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button onClick={onBack} style={{ background: "rgba(126,173,216,0.1)", border: "1px solid rgba(126,173,216,0.3)", borderRadius: 12, padding: "7px 14px", fontFamily: FONT, fontSize: 13, color: "#4a8cbf", cursor: "pointer" }}>← Back</button>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#1a3a4f", margin: 0 }}>Revision Calendar</h2>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Subject panel */}
          <div style={{ width: 200, background: "white", borderRadius: 20, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 4px 20px rgba(91,174,212,0.08)", padding: "18px 16px", flexShrink: 0 }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#4a8cbf", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session length</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => setSelectedDuration(d.value)}
                  style={{ padding: "7px 10px", borderRadius: 10, border: `1.5px solid ${selectedDuration === d.value ? "#5baed4" : "rgba(180,220,240,0.5)"}`, background: selectedDuration === d.value ? "rgba(91,174,212,0.1)" : "transparent", fontFamily: FONT, fontSize: 13, color: selectedDuration === d.value ? "#4a8cbf" : "#9ac0d8", cursor: "pointer", fontWeight: selectedDuration === d.value ? 700 : 400, textAlign: "left" }}>
                  {d.label}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#4a8cbf", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subjects</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subjects.map((s) => (
                <div key={s} draggable
                  onDragStart={() => onDragStart(s)}
                  style={{ padding: "8px 12px", borderRadius: 12, background: subjectColors[s] || "rgba(126,173,216,0.12)", cursor: "grab", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1a3a4f", userSelect: "none", border: dragSubject === s ? "2px solid #5baed4" : "2px solid transparent", transition: "border 0.15s" }}>
                  {s}
                </div>
              ))}
            </div>
            {dragSubject && (
              <div style={{ marginTop: 14, padding: "9px 12px", borderRadius: 11, background: "rgba(91,174,212,0.08)", border: "1px solid rgba(91,174,212,0.25)" }}>
                <p style={{ fontFamily: FONT, fontSize: 12, color: "#4a8cbf", margin: 0, fontWeight: 600 }}>Dragging: {dragSubject}</p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: "#9ac0d8", margin: "3px 0 0" }}>Drop onto a day</p>
              </div>
            )}
          </div>

          {weekGrid}
        </div>
      </div>
    </div>
  );
}

/* ── Completion ring ──────────────────────────────────────────── */
function CompletionRing({ completed, total, size = 46 }) {
  const R = (size / 2) - 5;
  const circ = 2 * Math.PI * R;
  const pct = total > 0 ? completed / total : 0;
  const offset = circ * (1 - pct);
  const allDone = pct === 1;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#daeefa" strokeWidth={3.5} />
      {pct > 0 && (
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke={allDone ? "#3cba8c" : "#5baed4"} strokeWidth={3.5}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size/2}, ${size/2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      )}
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, fill: allDone ? "#27826a" : "#4a8cbf" }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

/* ── Topic selection screen ───────────────────────────────────── */
function deriveGroupTitle(descriptions) {
  if (!descriptions.length) return null;
  if (descriptions.length === 1) {
    const d = descriptions[0];
    return d.length <= 45 ? d : d.slice(0, 43).replace(/\s+\S*$/, "") + "…";
  }
  const SKIP = new Set(["and","or","the","a","an","of","in","to","for","with","on","at","by","is","are","its","how","use","uses","role","roles","that","this","their","been","from","into","about","which","when","where","what","between","within","across"]);
  const freq = {}, cased = {};
  for (const d of descriptions) {
    const seen = new Set();
    for (const raw of d.split(/\W+/)) {
      const w = raw.toLowerCase();
      if (w.length < 4 || SKIP.has(w) || seen.has(w)) continue;
      seen.add(w);
      freq[w] = (freq[w] || 0) + 1;
      if (!cased[w]) cased[w] = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
  }
  const shared = Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([w]) => cased[w]);
  if (shared.length >= 1) return shared.join(" & ");
  // No common words — show compact snippet from each description
  const snippets = descriptions.slice(0, 3).map((d) => {
    const words = d.replace(/\s+(and|&|,).*$/i, "").trim().split(/\s+/);
    return words.slice(0, 3).join(" ");
  });
  return snippets.join(" · ");
}

function groupTopicsByPrefix(topics) {
  const map = {};
  for (const t of topics) {
    const prefix = String(t.id).split(".")[0];
    if (!map[prefix]) map[prefix] = [];
    map[prefix].push(t);
  }
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([prefix, subtopics]) => {
      const rawTitle = subtopics[0]?.parentTitle || "";
      const title = rawTitle.trim() || deriveGroupTitle(subtopics.map((t) => t.description).filter(Boolean)) || `Topic ${prefix}`;
      return { prefix, subtopics, title };
    });
}

function TopicSelectScreen({ pathway, onStart, onBack, savedResume }) {
  const [topicResults, setTopicResults] = useState(null);

  useEffect(() => {
    callApi(`/api/quiz-results/pathway/${pathway.id}`)
      .then((d) => setTopicResults(d.byTopic || {}))
      .catch(() => setTopicResults({}));
  }, [pathway.id]);

  const groups = groupTopicsByPrefix(pathway.topics);

  // Which group prefix does the saved resume belong to?
  let resumePrefix = null;
  if (savedResume?.resumeNumber != null && Array.isArray(savedResume.questions)) {
    const resumeQ = savedResume.questions.find((q) => q.number === savedResume.resumeNumber);
    if (resumeQ) resumePrefix = String(resumeQ.topicId).split(".")[0];
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "rgba(126,173,216,0.1)", border: "1px solid rgba(126,173,216,0.3)", borderRadius: 12, padding: "7px 14px", fontFamily: FONT, fontSize: 13, color: "#4a8cbf", cursor: "pointer", flexShrink: 0 }}>← Back</button>
        <div>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: "#1a3a4f", margin: 0 }}>Topics</h2>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#7eadd8", margin: "2px 0 0" }}>{pathway.subject}</p>
        </div>
      </div>

      {/* Topic group list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map((group) => {
          const isResume = group.prefix === resumePrefix;

          // Marks awarded so far (from answered questions stored in DB)
          let attempted = 0, marksAwarded = 0;
          if (topicResults) {
            for (const t of group.subtopics) {
              const r = topicResults[t.id];
              if (r && r.attempts > 0) { attempted++; marksAwarded += r.marksAwarded; }
            }
          }
          // Total marks available = sum across ALL questions in this group (inc. unanswered)
          let totalMarksAvailable = 0;
          if (Array.isArray(pathway.questions) && pathway.questions.length > 0) {
            const groupIds = new Set(group.subtopics.map((t) => t.id));
            for (const q of pathway.questions) {
              if (groupIds.has(q.topicId)) totalMarksAvailable += q.marks ?? 1;
            }
          }
          const hasStats = attempted > 0 && totalMarksAvailable > 0;

          return (
            <div
              key={group.prefix}
              onClick={() => onStart(group.subtopics, null)}
              style={{ background: "white", border: `2px solid ${isResume ? "#5baed4" : "rgba(180,220,240,0.5)"}`, borderRadius: 18, padding: "16px 18px", cursor: "pointer", boxShadow: "0 2px 12px rgba(91,174,212,0.07)", transition: "border-color 0.15s, background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#5baed4"; e.currentTarget.style.background = "rgba(91,174,212,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isResume ? "#5baed4" : "rgba(180,220,240,0.5)"; e.currentTarget.style.background = "white"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Number badge */}
                <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: isResume ? "linear-gradient(135deg,#7eadd8,#5baed4)" : "rgba(126,173,216,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 14, color: isResume ? "white" : "#7eadd8" }}>
                  {group.prefix}
                </span>
                {/* Title + score */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#1a3a4f", margin: 0, lineHeight: 1.3 }}>{group.title}</p>
                  {hasStats ? (
                    <p style={{ fontFamily: FONT, fontSize: 12, color: marksAwarded === totalMarksAvailable ? "#27826a" : "#4a8cbf", fontWeight: 700, margin: "3px 0 0" }}>
                      {marksAwarded}/{totalMarksAvailable} marks
                    </p>
                  ) : (
                    <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: "3px 0 0" }}>{group.subtopics.length} sub-topic{group.subtopics.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
                {/* Progress ring — % of subtopics attempted */}
                <CompletionRing completed={attempted} total={group.subtopics.length} size={44} />
              </div>
              {/* Continue strip — only shown when this group has a saved resume position */}
              {isResume && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(91,174,212,0.15)" }}
                  onClick={(e) => { e.stopPropagation(); onStart(group.subtopics, savedResume.resumeNumber); }}>
                  <button style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer", pointerEvents: "none" }}>
                    Continue →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getResumeTopicInfo(pathway) {
  if (!pathway.resumeNumber || !Array.isArray(pathway.questions) || !pathway.questions.length) return null;
  const resumeQ = pathway.questions.find((q) => q.number === pathway.resumeNumber);
  if (!resumeQ) return null;
  const prefix = String(resumeQ.topicId).split(".")[0];
  const subtopics = pathway.topics.filter((t) => String(t.id).split(".")[0] === prefix);
  if (!subtopics.length) return null;
  const title = subtopics[0]?.parentTitle?.trim() || deriveGroupTitle(subtopics.map((t) => t.description).filter(Boolean)) || `Topic ${prefix}`;
  return { title, prefix, subtopics, resumeNumber: pathway.resumeNumber };
}

const KNOWN_SUBJECTS = [
  "English Language", "English Literature", "English",
  "Mathematics", "Maths", "Further Mathematics", "Further Maths",
  "Biology", "Chemistry", "Physics", "Combined Science", "Science",
  "Computer Science", "Computing", "ICT",
  "History", "Geography",
  "French", "Spanish", "German", "Mandarin", "Latin",
  "Religious Studies", "Religious Education",
  "Art", "Design Technology", "Design & Technology",
  "Music", "Drama", "Physical Education",
  "Business Studies", "Business", "Economics",
  "Sociology", "Psychology", "Media Studies",
  "Engineering", "Electronics", "Graphic Design",
];

function cleanSubjectName(raw) {
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  for (const s of KNOWN_SUBJECTS) {
    if (lower.includes(s.toLowerCase())) return s;
  }
  // Strip code-like tokens (e.g. ro47, ks4, 8463h) but keep the rest
  return raw.replace(/\b([a-z]{1,3}\d+[a-z\d]*|ks\d)\b/gi, "").replace(/\s{2,}/g, " ").trim() || raw;
}

function PathwayDashboard({ pathways, onSelect, onAddNew, onDelete, savedSubject, onContinue, onContinueTopic }) {
  const [confirmId, setConfirmId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [longPressId, setLongPressId] = useState(null);
  const longPressTimer = useRef(null);

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const cardBase = {
    background: "white", borderRadius: 22, border: "1.5px solid rgba(180,220,240,0.4)",
    boxShadow: "0 4px 20px rgba(91,174,212,0.09)", padding: "22px 22px 20px",
    cursor: "pointer", transition: "box-shadow 0.18s, transform 0.18s",
    display: "flex", flexDirection: "column", gap: 8, minWidth: 0, position: "relative",
  };

  function DeleteBtn({ pathway }) {
    const visible = hoveredId === pathway.id || confirmId === pathway.id || longPressId === pathway.id;
    const isConfirming = confirmId === pathway.id;
    if (!visible) return null;
    return (
      <div style={{ position: "absolute", top: 8, right: 10, zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
        {isConfirming ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, color: "#e05a5a", fontWeight: 700 }}>Delete?</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pathway.id); setConfirmId(null); setHoveredId(null); setLongPressId(null); }}
              style={{ padding: "3px 10px", borderRadius: 12, background: "#e05a5a", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >Yes</button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmId(null); setLongPressId(null); }}
              style={{ padding: "3px 10px", borderRadius: 12, background: "rgba(126,173,216,0.15)", border: "none", color: "#4a8cbf", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >No</button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmId(pathway.id); }}
            title="Delete pathway"
            style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#7eadd8", fontSize: 20, fontWeight: 400, lineHeight: 1, fontFamily: "serif", opacity: 0.85 }}
          >×</button>
        )}
      </div>
    );
  }

  const [mostRecent, ...previous] = pathways;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "36px 20px 60px" }}>
      <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#1a3a4f", margin: "0 0 24px" }}>Your Pathways</h1>

      {/* Top row: most recent + add new */}
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Most Recent</p>
      <div style={{ display: "grid", gridTemplateColumns: mostRecent ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 36 }}>
        {mostRecent && (
          <div style={cardBase}
            onClick={() => { if (longPressId === mostRecent.id) { setLongPressId(null); return; } setConfirmId(null); onSelect(mostRecent); }}
            onMouseEnter={(e) => { setHoveredId(mostRecent.id); e.currentTarget.style.boxShadow = "0 8px 32px rgba(91,174,212,0.22)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { setHoveredId(null); if (confirmId === mostRecent.id) setConfirmId(null); e.currentTarget.style.boxShadow = cardBase.boxShadow; e.currentTarget.style.transform = "none"; }}
            onTouchStart={() => { longPressTimer.current = setTimeout(() => setLongPressId(mostRecent.id), 550); }}
            onTouchMove={() => clearTimeout(longPressTimer.current)}
            onTouchEnd={() => clearTimeout(longPressTimer.current)}
          >
            <DeleteBtn pathway={mostRecent} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ paddingRight: 10 }}>
                <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: "#1a3a4f", margin: "0 0 4px" }}>{cleanSubjectName(mostRecent.subject)}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>{groupTopicsByPrefix(mostRecent.topics).length} topics · {fmtDate(mostRecent.createdAt)}</p>
              </div>
              <CompletionRing completed={mostRecent.completedTopics ?? 0} total={groupTopicsByPrefix(mostRecent.topics).length} />
            </div>
            {(() => {
              const ri = getResumeTopicInfo(mostRecent);
              const completed = mostRecent.completedTopics ?? 0;
              const firstPrefix = groupTopicsByPrefix(mostRecent.topics)[0]?.prefix ?? "1";
              const hasProgress = completed > 0;
              return (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ri ? (
                    <span onClick={(e) => { e.stopPropagation(); onContinueTopic(mostRecent, ri); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>▶ {hasProgress ? "Continue" : "Begin"}: Topic {ri.prefix}</span>
                  ) : savedSubject === mostRecent.subject && hasProgress ? (
                    <span onClick={(e) => { e.stopPropagation(); onContinue(); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>▶ Continue</span>
                  ) : (
                    <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>Begin: Topic {firstPrefix}</span>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        {/* Add new card */}
        <div style={{ ...cardBase, alignItems: "center", justifyContent: "center", border: "2px dashed rgba(126,173,216,0.4)", background: "rgba(126,173,216,0.03)", minHeight: 130 }}
          onClick={onAddNew}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(126,173,216,0.08)"; e.currentTarget.style.borderColor = "#7eadd8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(126,173,216,0.03)"; e.currentTarget.style.borderColor = "rgba(126,173,216,0.4)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(126,173,216,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 26, color: "#7eadd8", lineHeight: 1 }}>+</span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#7ab3cc", margin: 0 }}>Add new pathway</p>
        </div>
      </div>

      {/* Previous pathways */}
      {previous.length > 0 && (
        <>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Previous</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {previous.map((p) => (
              <div key={p.id} style={cardBase}
                onClick={() => { if (longPressId === p.id) { setLongPressId(null); return; } setConfirmId(null); onSelect(p); }}
                onMouseEnter={(e) => { setHoveredId(p.id); e.currentTarget.style.boxShadow = "0 8px 32px rgba(91,174,212,0.22)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { setHoveredId(null); if (confirmId === p.id) setConfirmId(null); e.currentTarget.style.boxShadow = cardBase.boxShadow; e.currentTarget.style.transform = "none"; }}
                onTouchStart={() => { longPressTimer.current = setTimeout(() => setLongPressId(p.id), 550); }}
                onTouchMove={() => clearTimeout(longPressTimer.current)}
                onTouchEnd={() => clearTimeout(longPressTimer.current)}
              >
                <DeleteBtn pathway={p} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ paddingRight: 8 }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f", margin: "0 0 3px" }}>{cleanSubjectName(p.subject)}</p>
                    <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: 0 }}>{groupTopicsByPrefix(p.topics).length} topics · {fmtDate(p.createdAt)}</p>
                  </div>
                  <CompletionRing completed={p.completedTopics ?? 0} total={groupTopicsByPrefix(p.topics).length} size={42} />
                </div>
                {(() => {
                  const ri = getResumeTopicInfo(p);
                  const completed = p.completedTopics ?? 0;
                  const firstPrefix = groupTopicsByPrefix(p.topics)[0]?.prefix ?? "1";
                  const hasProgress = completed > 0;
                  if (ri) return (
                    <div style={{ marginTop: 6 }}>
                      <span onClick={(e) => { e.stopPropagation(); onContinueTopic(p, ri); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▶ {hasProgress ? "Continue" : "Begin"}: Topic {ri.prefix}</span>
                    </div>
                  );
                  if (savedSubject === p.subject && hasProgress) return (
                    <div style={{ marginTop: 6 }}>
                      <span onClick={(e) => { e.stopPropagation(); onContinue(); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▶ Continue</span>
                    </div>
                  );
                  return (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>Begin: Topic {firstPrefix}</span>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {pathways.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Pip size={80} />
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: "#7ab3cc", marginTop: 18 }}>No pathways yet — add your first one!</p>
        </div>
      )}
    </div>
  );
}

/* ── Best topics sub-accordion ────────────────────────────────── */
function BestTopicsAccordion({ subjectName, subAccordionStyle, subHeaderStyle }) {
  const [open, setOpen] = useState(false);
  const [bestTopics, setBestTopics] = useState(null);
  const [loading, setLoading] = useState(false);

  function toggle() {
    setOpen((o) => !o);
    if (!bestTopics && !loading) {
      setLoading(true);
      callApi(`/api/quiz-results/best?subject=${encodeURIComponent(subjectName)}`)
        .then((d) => { const seen = new Set(); setBestTopics((d.topics || []).filter((t) => { if (seen.has(t.topic_id)) return false; seen.add(t.topic_id); return true; })); })
        .catch(() => setBestTopics([]))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div style={subAccordionStyle}>
      <div style={subHeaderStyle} onClick={toggle}>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#27826a", margin: 0 }}>Best topics</p>
        <span style={{ fontFamily: FONT, fontSize: 16, color: "#9ac0d8", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
      </div>
      {open && (
        <div style={{ padding: "0 16px 14px" }}>
          {loading && <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>Loading…</p>}
          {bestTopics && bestTopics.length === 0 && (
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>No quiz data yet for this subject.</p>
          )}
          {bestTopics && bestTopics.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {bestTopics.map((t) => {
                const isGreen = t.pct_correct >= 80;
                const bg = isGreen ? "rgba(60,186,140,0.07)" : "rgba(200,170,0,0.07)";
                const tagBg = isGreen ? "rgba(60,186,140,0.15)" : "rgba(200,170,0,0.15)";
                const colour = isGreen ? "#27826a" : "#8a6a00";
                return (
                  <div key={t.topic_id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: bg, borderRadius: 10, padding: "9px 13px" }}>
                    <span style={{ padding: "2px 9px", borderRadius: 20, background: tagBg, fontFamily: FONT, fontSize: 12, fontWeight: 700, color: colour, whiteSpace: "nowrap", flexShrink: 0 }}>Topic {t.topic_id}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: "#1a3a4f", margin: 0, lineHeight: 1.4 }}>{t.topic_desc}</p>
                      <p style={{ fontFamily: FONT, fontSize: 11, color: colour, margin: "3px 0 0" }}>{t.pct_correct}% correct · {t.total} attempt{t.total !== 1 ? "s" : ""}</p>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: colour, background: tagBg, borderRadius: 8, padding: "2px 7px", alignSelf: "center" }}>{t.pct_correct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Subjects screen ──────────────────────────────────────────── */
function SubjectRow({ subjectName, pathways, onQuiz }) {
  const [open, setOpen] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [weakTopics, setWeakTopics] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  function toggleOpen() {
    setOpen((o) => !o);
  }

  function toggleScores() {
    setScoresOpen((o) => !o);
    if (!sessions && !loadingSessions) {
      setLoadingSessions(true);
      callApi(`/api/quiz-results/sessions?subject=${encodeURIComponent(subjectName)}`)
        .then((d) => setSessions(d.sessions || []))
        .catch(() => setSessions([]))
        .finally(() => setLoadingSessions(false));
    }
  }

  function toggleAreas() {
    setAreasOpen((o) => !o);
    if (!weakTopics && !loadingAreas) {
      setLoadingAreas(true);
      callApi(`/api/quiz-results/weak?subject=${encodeURIComponent(subjectName)}`)
        .then((d) => { const seen = new Set(); setWeakTopics((d.topics || []).filter((t) => { if (seen.has(t.topic_id)) return false; seen.add(t.topic_id); return true; })); })
        .catch(() => setWeakTopics([]))
        .finally(() => setLoadingAreas(false));
    }
  }

  function handleGenerateQuiz() {
    if (!weakTopics?.length) return;
    const pathway = pathways.find((p) => p.subject === subjectName);
    const topicMap = Object.fromEntries((pathway?.topics || []).map((t) => [t.id, t]));
    const quizTopics = weakTopics.map((w) => topicMap[w.topic_id] || { id: w.topic_id, description: w.topic_desc, confidence: 3 });
    const completed = pathway?.completedTopicPrefixes ?? [];
    const filteredCached = Array.isArray(pathway?.questions)
      ? pathway.questions.filter((q) => {
          const prefix = q.topicId ? String(q.topicId).split(".")[0] : null;
          return quizTopics.some((t) => t.id === q.topicId) && !completed.includes(prefix);
        })
      : null;
    onQuiz({
      subject: subjectName,
      topics: quizTopics,
      save: false,
      pathwayId: pathway?.id ?? null,
      cachedQuestions: filteredCached?.length ? filteredCached : null,
      resumeNumber: pathway?.resumeNumber ?? null,
    });
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const subAccordionStyle = { background: "rgba(126,173,216,0.04)", borderRadius: 14, border: "1px solid rgba(180,220,240,0.4)", overflow: "hidden", marginBottom: 8 };
  const subHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", cursor: "pointer", userSelect: "none" };

  return (
    <div style={{ background: "white", borderRadius: 18, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 2px 12px rgba(91,174,212,0.07)", marginBottom: 12, overflow: "hidden" }}>
      {/* Subject header */}
      <div onClick={toggleOpen} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", userSelect: "none" }}>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: "#1a3a4f", margin: 0 }}>{subjectName}</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: "3px 0 0" }}>{pathways.filter((p) => p.subject === subjectName).length} pathway{pathways.filter((p) => p.subject === subjectName).length !== 1 ? "s" : ""}</p>
        </div>
        <span style={{ fontFamily: FONT, fontSize: 20, color: "#7eadd8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", lineHeight: 1 }}>›</span>
      </div>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Scores sub-accordion */}
          <div style={subAccordionStyle}>
            <div style={subHeaderStyle} onClick={toggleScores}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#4a8cbf", margin: 0 }}>Scores</p>
              <span style={{ fontFamily: FONT, fontSize: 16, color: "#9ac0d8", transform: scoresOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
            </div>
            {scoresOpen && (
              <div style={{ padding: "0 16px 14px" }}>
                {loadingSessions && <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>Loading…</p>}
                {sessions && sessions.length === 0 && <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>No quiz attempts yet.</p>}
                {sessions && sessions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sessions.map((s) => {
                      const pct = s.pct;
                      const colour = pct >= 80 ? "#27826a" : pct >= 60 ? "#7a6a10" : "#b03030";
                      const bg = pct >= 80 ? "rgba(60,186,140,0.08)" : pct >= 60 ? "rgba(200,180,0,0.08)" : "rgba(220,100,100,0.06)";
                      return (
                        <div key={s.sessionId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: bg, borderRadius: 10, padding: "9px 13px" }}>
                          <p style={{ fontFamily: FONT, fontSize: 13, color: "#4a6a80", margin: 0 }}>{fmtDate(s.completedAt)}</p>
                          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: colour, margin: 0 }}>{s.correct}/{s.total} ({pct}%)</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Best topics sub-accordion */}
          <BestTopicsAccordion subjectName={subjectName} subAccordionStyle={subAccordionStyle} subHeaderStyle={subHeaderStyle} />

          {/* Areas to work on sub-accordion */}
          <div style={subAccordionStyle}>
            <div style={subHeaderStyle} onClick={toggleAreas}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#4a8cbf", margin: 0 }}>Areas to work on</p>
              <span style={{ fontFamily: FONT, fontSize: 16, color: "#9ac0d8", transform: areasOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
            </div>
            {areasOpen && (
              <div style={{ padding: "0 16px 14px" }}>
                {loadingAreas && <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>Loading…</p>}
                {weakTopics && weakTopics.length === 0 && (
                  <p style={{ fontFamily: FONT, fontSize: 13, color: "#27826a", margin: 0 }}>No weak areas — you're doing well!</p>
                )}
                {weakTopics && weakTopics.length > 0 && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
                      {weakTopics.map((t) => {
                        const isImproving = t.improving;
                        const bg = isImproving ? "rgba(200,170,0,0.07)" : "rgba(220,100,100,0.05)";
                        const tagBg = isImproving ? "rgba(200,170,0,0.15)" : "rgba(220,100,100,0.12)";
                        const tagColour = isImproving ? "#8a6a00" : "#b03030";
                        const subColour = isImproving ? "#8a6a00" : "#b06030";
                        return (
                        <div key={t.topic_id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: bg, borderRadius: 10, padding: "9px 13px" }}>
                          <span style={{ padding: "2px 9px", borderRadius: 20, background: tagBg, fontFamily: FONT, fontSize: 12, fontWeight: 700, color: tagColour, whiteSpace: "nowrap", flexShrink: 0 }}>Topic {t.topic_id}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: FONT, fontSize: 13, color: "#1a3a4f", margin: 0, lineHeight: 1.4 }}>{t.topic_desc}</p>
                            <p style={{ fontFamily: FONT, fontSize: 11, color: subColour, margin: "3px 0 0" }}>
                              {t.pct_correct}% correct overall · {t.total} attempt{t.total !== 1 ? "s" : ""}
                              {isImproving && t.recent_pct !== null && ` · last session: ${t.recent_pct}%`}
                            </p>
                          </div>
                          {isImproving && <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#8a6a00", background: "rgba(200,170,0,0.15)", borderRadius: 8, padding: "2px 7px", whiteSpace: "nowrap", alignSelf: "center" }}>Improving</span>}
                        </div>
                        );
                      })}
                    </div>
                    <button onClick={handleGenerateQuiz} style={{ padding: "10px 22px", borderRadius: 13, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Generate quiz on weak topics
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Suggestions screen ───────────────────────────────────────── */
function SuggestionsScreen({ pathways, onQuiz }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get up to 3 most-recently-opened unique subjects (pathways already sorted by last_opened)
  const recentSubjects = [...new Set(pathways.map((p) => p.subject))].slice(0, 3);

  useEffect(() => {
    if (!recentSubjects.length) { setSuggestions([]); setLoading(false); return; }
    Promise.all(
      recentSubjects.map((subject) =>
        Promise.all([
          callApi(`/api/quiz-results/weak?subject=${encodeURIComponent(subject)}`).then((d) => { const s = new Set(); return (d.topics || []).filter((t) => { if (s.has(t.topic_id)) return false; s.add(t.topic_id); return true; }); }).catch(() => []),
          callApi(`/api/quiz-results/best?subject=${encodeURIComponent(subject)}`).then((d) => { const s = new Set(); return (d.topics || []).filter((t) => { if (s.has(t.topic_id)) return false; s.add(t.topic_id); return true; }); }).catch(() => []),
        ]).then(([weak, best]) => ({ subject, weak, best }))
      )
    ).then((results) => { setSuggestions(results); setLoading(false); });
  }, []);

  function handleStartQuiz(subject, weakTopics) {
    const pathway = pathways.find((p) => p.subject === subject);
    const topicMap = Object.fromEntries((pathway?.topics || []).map((t) => [t.id, t]));
    const quizTopics = weakTopics.map((w) => topicMap[w.topic_id] || { id: w.topic_id, description: w.topic_desc, confidence: 3 });
    const completed = pathway?.completedTopicPrefixes ?? [];
    const filteredCached = Array.isArray(pathway?.questions)
      ? pathway.questions.filter((q) => {
          const prefix = q.topicId ? String(q.topicId).split(".")[0] : null;
          return quizTopics.some((t) => t.id === q.topicId) && !completed.includes(prefix);
        })
      : null;
    onQuiz({
      subject,
      topics: quizTopics,
      save: false,
      pathwayId: pathway?.id ?? null,
      cachedQuestions: filteredCached?.length ? filteredCached : null,
      resumeNumber: pathway?.resumeNumber ?? null,
    });
  }

  function fmtDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>
      <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#1a3a4f", margin: "0 0 6px" }}>Suggestions</h2>
      <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: "0 0 32px" }}>Personalised study suggestions based on your recent pathways and quiz history.</p>

      {loading && (
        <div style={{ display: "flex", gap: 7, padding: "20px 0" }}>
          {[0,1,2].map((i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Pip size={70} />
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: "#7ab3cc", marginTop: 16 }}>Start a quiz to get personalised suggestions.</p>
        </div>
      )}

      {suggestions && suggestions.map(({ subject, weak, best }) => {
        const pathway = pathways.find((p) => p.subject === subject);
        const lastOpened = pathway?.lastOpenedAt;
        const hasData = weak.length > 0 || best.length > 0;

        return (
          <div key={subject} style={{ background: "white", borderRadius: 20, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 2px 16px rgba(91,174,212,0.08)", padding: "22px 24px", marginBottom: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: "#1a3a4f", margin: 0 }}>{subject}</p>
                {lastOpened && <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: "3px 0 0" }}>Last revised {fmtDate(lastOpened)}</p>}
              </div>
              {weak.length > 0 && (
                <button onClick={() => handleStartQuiz(subject, weak)}
                  style={{ padding: "9px 18px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
                  Quiz weak topics
                </button>
              )}
            </div>

            {!hasData && (
              <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>Complete a quiz for this subject to see suggestions.</p>
            )}

            {/* Focus on — weak topics */}
            {weak.length > 0 && (
              <div style={{ marginBottom: best.length > 0 ? 16 : 0 }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#b03030", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Focus on</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {weak.slice(0, 4).map((t) => (
                    <div key={t.topic_id} style={{ display: "flex", alignItems: "center", gap: 10, background: t.improving ? "rgba(200,170,0,0.06)" : "rgba(220,100,100,0.05)", borderRadius: 10, padding: "8px 12px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 16, background: t.improving ? "rgba(200,170,0,0.15)" : "rgba(220,100,100,0.12)", fontFamily: FONT, fontSize: 11, fontWeight: 700, color: t.improving ? "#8a6a00" : "#b03030", whiteSpace: "nowrap" }}>Topic {t.topic_id}</span>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: "#1a3a4f", margin: 0, flex: 1, lineHeight: 1.3 }}>{t.topic_desc}</p>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: t.improving ? "#8a6a00" : "#b03030", whiteSpace: "nowrap" }}>{t.pct_correct}%</span>
                    </div>
                  ))}
                  {weak.length > 4 && <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: "4px 0 0" }}>+{weak.length - 4} more weak topics — see Subjects tab</p>}
                </div>
              </div>
            )}

            {/* Keep up — best topics */}
            {best.length > 0 && (
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#27826a", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Keep it up</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {best.slice(0, 5).map((t) => (
                    <div key={t.topic_id} style={{ display: "flex", alignItems: "center", gap: 6, background: t.pct_correct >= 80 ? "rgba(60,186,140,0.07)" : "rgba(200,170,0,0.07)", borderRadius: 10, padding: "6px 12px" }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: t.pct_correct >= 80 ? "#27826a" : "#8a6a00" }}>Topic {t.topic_id}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: "#6a8fa8" }}>{t.topic_desc.length > 40 ? t.topic_desc.slice(0, 40) + "…" : t.topic_desc}</span>
                      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: t.pct_correct >= 80 ? "#27826a" : "#8a6a00" }}>{t.pct_correct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubjectsScreen({ pathways, onQuiz }) {
  const subjects = [...new Set(pathways.map((p) => p.subject))];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 60px" }}>
      <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: "#1a3a4f", margin: "0 0 6px" }}>Subjects</h2>
      <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: "0 0 28px" }}>Your quiz history and weak areas, grouped by subject.</p>

      {subjects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Pip size={70} />
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: "#7ab3cc", marginTop: 16 }}>No pathways uploaded yet.</p>
        </div>
      ) : (
        subjects.map((s) => (
          <SubjectRow key={s} subjectName={s} pathways={pathways} onQuiz={onQuiz} />
        ))
      )}
    </div>
  );
}

/* ── Upload screen ────────────────────────────────────────────── */
function UploadScreen({ onTopicsReady, savedPathway, existingPathways = [] }) {
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

  const EXTRACT_SYSTEM = `You are extracting topics from a GCSE subject pathway document.
The document has topics with sub-topics (e.g. 1.1, 1.2 … 1.10, 2.1 … 2.10, up to 20+ topics and many sub-topics).
Each topic/sub-topic has a confidence rating column (1, 2, 3, or 4).
Return ONLY valid JSON — no markdown, no commentary:
{"subject":"Subject Name","topics":[{"id":"1.1","description":"Sub-topic description","parentTitle":"Parent topic heading","confidence":2}]}
- id: use the numeric ID from the document (e.g. "1.1", "2.3", "12.4")
- description: the sub-topic's own description/name
- parentTitle: the section heading for the parent topic group (e.g. "Algebra" for all 1.x sub-topics). Use the SAME parentTitle string for every sub-topic with the same integer prefix. If no heading exists, use an empty string.
- confidence: integer 1-4 from the rating column. If a topic has no rating or the column is blank, set confidence: null.
- Extract ALL sub-topics, not just top-level headings.`;

  const extractFromText = useCallback(async (text) => {
    setLoading(true); setError("");
    try {
      const raw = await callClaude({ system: EXTRACT_SYSTEM, user: text, max_tokens: 8192 });
      const data = parseJSON(raw);
      const allTopics = (data.topics || []).filter((t) => t.id && t.description);
      if (!allTopics.length) throw new Error("No topics found. Please check your document.");
      if (checkDuplicate(data.subject, allTopics)) throw new Error("This pathway has already been uploaded.");
      onTopicsReady({ subject: data.subject, topics: allTopics });
    } catch (e) { setError(e.message || "Failed to extract topics."); }
    setLoading(false);
  }, [onTopicsReady, existingPathways]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setLoading(true); setError("");
    const reader = new FileReader();
    reader.onerror = () => { setError("Could not read the file."); setLoading(false); };
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const raw = await callClaude({ system: EXTRACT_SYSTEM, user: "Extract all topics and their confidence ratings from this pathway document. Include every sub-topic.", max_tokens: 8192, documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }] });
        const data = parseJSON(raw);
        const allTopics = (data.topics || []).filter((t) => t.id && t.description);
        if (!allTopics.length) throw new Error("No topics found in the PDF.");
        if (checkDuplicate(data.subject, allTopics)) throw new Error("This pathway has already been uploaded.");
        onTopicsReady({ subject: data.subject, topics: allTopics });
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
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", margin: "0 0 3px" }}>Continue: {savedPathway.subject}</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: 0 }}>{savedPathway.topics.length} topics saved</p>
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
            </div>
          )}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

/* ── Quiz screen ──────────────────────────────────────────────── */
function QuizScreen({ topics, questions, onFinish, onAskPip, onExit, onIdxChange, onQuestionComplete, onResultsChange, onBackToTopics = null, initialIdx = 0, initialResults = {}, onScrollTop, onCompleteTopic }) {
  const PAGE_SIZE = 4;
  const [idx, setIdx] = useState(initialIdx);
  const [workings, setWorkings] = useState("");
  const answerCount = (q) => Array.isArray(q?.partAnswers) ? q.partAnswers.length : (q?.marks ?? 1);
  const [answers, setAnswers] = useState(() => Array(answerCount(questions[initialIdx])).fill(""));
  const [traceData, setTraceData] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState(initialResults);
  const [error, setError] = useState("");
  const [variant, setVariant] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [topicDone, setTopicDone] = useState(null);
  const [completingTopic, setCompletingTopic] = useState(false);
  const [hoveredTopicIdx, setHoveredTopicIdx] = useState(null);
  const [topicPage, setTopicPage] = useState(() => {
    const currentTopicId = questions[initialIdx]?.topicId;
    const topicIdx = topics.findIndex((t) => t.id === currentTopicId);
    return topicIdx >= 0 ? Math.floor(topicIdx / PAGE_SIZE) : 0;
  });
  const answerRef = useRef(null);
  useEffect(() => { onIdxChange?.(idx); }, [idx]);

  const base = questions[idx];
  const current = variant || base;
  const topic = topics.find((t) => t.id === base?.topicId);
  const total = questions.length;
  const hasTrace = !!current?.traceTable;

  const fMarks = feedback?.marksAwarded ?? 0;
  const fAvail = feedback?.marksAvailable ?? (current?.marks ?? 1);
  const answerBorderColor = !checked ? "rgba(180,220,240,0.5)"
    : fMarks === fAvail ? "rgba(60,186,140,0.4)"
    : fMarks > 0 ? "rgba(240,180,30,0.45)"
    : "rgba(220,100,100,0.4)";

  async function resetToRetry() {
    setAnswers(Array(answerCount(current)).fill("")); setTraceData(null);
    setChecked(false); setFeedback(null); setError("");
    setShowAnswer(false);
    setRegenerating(true);
    try {
      const raw = await callClaude({
        system: `You are creating a variant of a GCSE exam question. You MUST change every number, quantity, variable name, substance, code value, and named example to something completely different — the student must not be able to reuse their previous answer. Keep the same question TYPE, structure, number of parts, and difficulty. The variant must read as a clearly new question.
Return ONLY valid JSON with no markdown:
{
  "question": "variant question text with new values",
  "marks": 1,
  "partAnswers": null,
  "answer": "model answer for the new values",
  "steps": ["step 1", "step 2", "step 3"],
  "traceTable": null
}
Keep marks and partAnswers consistent with the number of parts. If the original had a traceTable, produce a new one with completely different values and variable names.`,
        user: `Original question: ${base.question}\nOriginal answer: ${base.answer}\nTopic: ${topic?.description}\n\nProduce a variant. Every number, variable, substance, and named value MUST be different from the original — do not copy any specific values.`,
        max_tokens: 2500,
      });
      const q = parseJSON(raw);
      setVariant({ topicId: base.topicId, ...q });
    } catch { setVariant(null); }
    setRegenerating(false);
    setTimeout(() => answerRef.current?.focus(), 50);
  }

  function fullReset(marks) {
    setWorkings(""); setAnswers(Array(marks ?? answerCount(current)).fill("")); setTraceData(null);
    setChecked(false); setShowAnswer(false); setFeedback(null); setError("");
    setVariant(null); setRegenerating(false);
  }

  function navigateTo(newIdx) {
    if (newIdx < 0 || newIdx >= total) return;
    setTopicDone(null);
    setIdx(newIdx);
    fullReset(answerCount(questions[newIdx]));
    onScrollTop?.();
    // Auto-advance topic page so the current topic bubble is always visible
    const topicIdx = topics.findIndex((t) => t.id === questions[newIdx]?.topicId);
    if (topicIdx >= 0) setTopicPage(Math.floor(topicIdx / PAGE_SIZE));
  }

  function buildFinishPayload(resultsMap) {
    const allResults = topics.map((t) => {
      const r = resultsMap[t.id];
      const q = questions.find((q) => q.topicId === t.id);
      return { topicId: t.id, marksAwarded: r?.marksAwarded ?? 0, marksAvailable: r?.marksAvailable ?? (q?.marks ?? 1) };
    });
    const totalScore = allResults.reduce((s, r) => s + r.marksAwarded, 0);
    const totalMarks = allResults.reduce((s, r) => s + r.marksAvailable, 0);
    const topicResults = {};
    allResults.forEach((r) => { topicResults[r.topicId] = { correct: r.marksAwarded, total: r.marksAvailable }; });
    return { score: totalScore, total: totalMarks, results: allResults, topicResults };
  }

  function topicPrefix(id) { return id ? String(id).split(".")[0] : ""; }

  function recordAndAdvance(marksGiven, marksMax) {
    const newResults = { ...results, [current.topicId]: { marksAwarded: marksGiven, marksAvailable: marksMax } };
    setResults(newResults);
    onQuestionComplete?.(current.topicId, marksGiven, marksMax, current !== base ? current : null);
    const isLast = idx + 1 >= total;
    const currentPrefix = topicPrefix(current.topicId);
    const nextPrefix = topicPrefix(questions[idx + 1]?.topicId);
    const topicGroupEnds = isLast || currentPrefix !== nextPrefix;
    if (topicGroupEnds) {
      setTopicDone({ marksAwarded: marksGiven, marksAvailable: marksMax, isLast, topicPrefix: currentPrefix, newResults });
    } else {
      navigateTo(idx + 1);
    }
  }

  function continueToNextTopic() {
    setTopicDone(null);
    navigateTo(idx + 1);
  }

  async function submitAnswer() {
    const joinedAnswers = answers.length === 1
      ? answers[0]
      : answers.map((a, i) => `Part ${i + 1}: ${a}`).join("\n");
    const finalAnswer = hasTrace
      ? (traceData ? JSON.stringify(traceData) : "") + (joinedAnswers.trim() ? "\n" + joinedAnswers : "")
      : joinedAnswers;
    if (!finalAnswer.trim() || checking || checked) return;
    setChecking(true); setError("");
    try {
      const raw = await callClaude({
        system: `Check a GCSE student's answer and award marks. Return ONLY valid JSON:
{"marksAwarded":1,"marksAvailable":1,"noWorkings":false,"feedback":"one short encouraging sentence"}
Rules:
- marksAvailable equals the number of sub-parts in the question (1 for a single question).
- marksAwarded: award 1 mark for each sub-part answered correctly, 0 for each incorrect or missing part.
- noWorkings: set true ONLY when the question clearly requires calculation or method steps AND the student's answer is correct but shows no working. When noWorkings is true, marksAwarded must still equal marksAvailable — do NOT reduce marks just for missing working. Just note it gently in feedback.
- feedback: one short warm encouraging sentence. If noWorkings is true, add a gentle reminder to show working next time.
- MATHEMATICAL EQUIVALENCE: always evaluate both the model answer and student answer numerically before comparing. Accept any form that evaluates to the same value — e.g. accept "36" when the answer is "6^2" or "6²", accept "0.5" when the answer is "1/2", accept "100" when the answer is "10^2", accept simplified or unsimplified fractions that are equal, accept correct units in any reasonable order. Do NOT penalise a student for writing the evaluated number instead of the expression, or vice versa.
- Be forgiving of minor formatting and spelling differences that don't change the meaning.`,
        user: `Question: ${current.question}\nMarks available: ${current.marks ?? 1}\n${current.partAnswers ? `Part answers: ${JSON.stringify(current.partAnswers)}` : `Correct answer: ${current.answer}`}\n${current.traceTable ? `Correct trace: ${JSON.stringify(current.traceTable.answer || [])}` : ""}${workings.trim() ? `\nStudent workings: ${workings}` : ""}\nStudent answer: ${finalAnswer}\n\nAward marks.`,
        max_tokens: 200,
      });
      const data = parseJSON(raw);
      setFeedback(data);
      setChecked(true);
    } catch { setError("Couldn't check your answer — please try again."); }
    setChecking(false);
  }

  function handleShowAnswer() { setShowAnswer(true); }
  function handleSkip() { recordAndAdvance(0, current?.marks ?? 1); }
  useEffect(() => { answerRef.current?.focus({ preventScroll: true }); }, [idx]);
  useEffect(() => { onResultsChange?.(results); }, [results]);

  // Between-topic interstitial
  if (topicDone) {
    const nextTopic = !topicDone.isLast ? topics.find((t) => t.id === questions[idx + 1]?.topicId) : null;
    const perfect = topicDone.marksAwarded === topicDone.marksAvailable;
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <Pip size={70} />
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: "#1a3a4f", margin: "16px 0 4px" }}>
          Topic {topicDone.topicPrefix} Complete!
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: "0 0 22px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          {(() => {
            const prefixTopics = topics.filter((t) => topicPrefix(t.id) === topicDone.topicPrefix);
            const totalMarks = prefixTopics.reduce((s, t) => {
              const q = questions.find((q) => q.topicId === t.id);
              return s + (topicDone.newResults[t.id]?.marksAvailable ?? q?.marks ?? 1);
            }, 0);
            const earnedMarks = prefixTopics.reduce((s, t) => s + (topicDone.newResults[t.id]?.marksAwarded ?? 0), 0);
            return `${earnedMarks}/${totalMarks} marks across ${prefixTopics.length} question${prefixTopics.length !== 1 ? "s" : ""}`;
          })()}
        </p>
        {(() => {
          const prefixTopics = topics.filter((t) => topicPrefix(t.id) === topicDone.topicPrefix);
          const groupTotal = prefixTopics.reduce((s, t) => {
            const q = questions.find((q) => q.topicId === t.id);
            return s + (topicDone.newResults[t.id]?.marksAvailable ?? q?.marks ?? 1);
          }, 0);
          const groupEarned = prefixTopics.reduce((s, t) => s + (topicDone.newResults[t.id]?.marksAwarded ?? 0), 0);
          const groupPerfect = groupEarned === groupTotal;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 20,
              background: groupPerfect ? "rgba(60,186,140,0.08)" : "rgba(220,100,100,0.06)",
              border: `1.5px solid ${groupPerfect ? "rgba(60,186,140,0.25)" : "rgba(220,100,100,0.22)"}`,
              marginBottom: 32 }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: groupPerfect ? "#27826a" : "#b03030" }}>
                {groupEarned}/{groupTotal}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: groupPerfect ? "#27826a" : "#b03030" }}>
                {groupPerfect ? "✓ Perfect!" : "Keep practising!"}
              </span>
            </div>
          );
        })()}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topicDone.isLast ? (
            <button onClick={() => onFinish(buildFinishPayload(topicDone.newResults))}
              style={{ padding: "14px", borderRadius: 16, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              See full results →
            </button>
          ) : (
            <button onClick={continueToNextTopic}
              style={{ padding: "14px", borderRadius: 16, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Continue to {nextTopic?.id || "next topic"} →
            </button>
          )}
          {onCompleteTopic && (
            <button
              disabled={completingTopic}
              onClick={async () => {
                setCompletingTopic(true);
                await onCompleteTopic(topicDone.topicPrefix);
                setCompletingTopic(false);
                if (topicDone.isLast) {
                  onFinish(buildFinishPayload(topicDone.newResults));
                } else {
                  continueToNextTopic();
                }
              }}
              style={{ padding: "13px", borderRadius: 16, background: "transparent", border: "1.5px solid rgba(60,186,140,0.4)", color: completingTopic ? "#9ac0d8" : "#27826a", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: completingTopic ? "not-allowed" : "pointer", opacity: completingTopic ? 0.7 : 1 }}
            >
              {completingTopic ? "Marking as mastered…" : `✓ Mark Topic ${topicDone.topicPrefix} as mastered — get fresh questions next time`}
            </button>
          )}
          <button onClick={() => onExit(idx + 1)}
            style={{ padding: "13px", borderRadius: 16, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#9ac0d8", fontFamily: FONT, fontWeight: 500, fontSize: 15, cursor: "pointer" }}>
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const canSubmit = hasTrace ? (traceData !== null || answers.some((a) => a.trim())) : answers.some((a) => a.trim());
  const isCorrect = checked && feedback && fMarks === fAvail;
  const isPartial = checked && feedback && fMarks > 0 && fMarks < fAvail;
  const isWrong = checked && feedback && fMarks === 0;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
      {/* Topic number bar + optional back button — same row, aligned with card */}
      {(() => {
        const totalPages = Math.ceil(topics.length / PAGE_SIZE);
        const pageTopics = topics.slice(topicPage * PAGE_SIZE, topicPage * PAGE_SIZE + PAGE_SIZE);
        return (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6, minHeight: 32 }}>
            {onBackToTopics && (
              <button
                onClick={() => onBackToTopics(idx)}
                style={{ position: "absolute", left: 40, background: "none", border: "none", padding: "5px 0", fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#4a8cbf", cursor: "pointer" }}
              >← Topics</button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {pageTopics.map((t, pi) => {
                const i = topicPage * PAGE_SIZE + pi;
                const r = results[t.id];
                const isCurrent = questions[idx]?.topicId === t.id;
                const isAnswered = r != null && r.marksAvailable != null && r.marksAvailable > 0;
                const perfect = isAnswered && r.marksAwarded === r.marksAvailable;
                const partial = isAnswered && r.marksAwarded > 0 && r.marksAwarded < r.marksAvailable;
                const wrong = isAnswered && r.marksAwarded === 0;
                const bg = isCurrent ? "linear-gradient(135deg,#7eadd8,#5baed4)" : perfect ? "rgba(60,186,140,0.18)" : partial ? "rgba(240,180,30,0.18)" : wrong ? "rgba(220,100,100,0.12)" : "rgba(180,220,240,0.25)";
                const col = isCurrent ? "white" : perfect ? "#27826a" : partial ? "#8a6000" : wrong ? "#b03030" : "#5a90b0";
                return (
                  <div key={t.id} style={{ position: "relative" }}>
                    <button onClick={() => { const qIdx = questions.findIndex((q) => q.topicId === t.id); if (qIdx >= 0) navigateTo(qIdx); }} onMouseEnter={() => setHoveredTopicIdx(i)} onMouseLeave={() => setHoveredTopicIdx(null)}
                      style={{ width: 30, height: 30, borderRadius: "50%", background: bg, border: "none", color: col, fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s", boxShadow: isCurrent ? "0 2px 8px rgba(91,174,212,0.35)" : "none" }}
                    >{i + 1}</button>
                    {hoveredTopicIdx === i && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#1a3a4f", color: "white", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: FONT, fontWeight: 500, whiteSpace: "normal", maxWidth: 180, zIndex: 100, pointerEvents: "none", lineHeight: 1.4, textAlign: "center" }}>
                        <strong style={{ display: "block", marginBottom: 2 }}>{t.id}</strong>{t.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        );
      })()}

      {/* Arrow nav + question card */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {(() => {
          const atFirst = (base?.number ?? (idx + 1)) <= 1;
          return (
            <button onClick={() => navigateTo(idx - 1)} disabled={atFirst}
              style={{ flexShrink: 0, alignSelf: "center", width: 32, height: 32, borderRadius: "50%", background: atFirst ? "rgba(180,220,240,0.12)" : "rgba(126,173,216,0.15)", border: "none", color: atFirst ? "#c0d8e8" : "#5a90b0", fontSize: 20, cursor: atFirst ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>‹</button>
          );
        })()}

        {/* Question card — arrows are siblings so they center on the card height only */}
        <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "22px 24px", flex: 1, minHeight: 180 }}>
          {regenerating ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 140, gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #daeefa", borderTopColor: "#5baed4", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: 0 }}>Generating new question…</p>
            </div>
          ) : (
            <>
              <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(126,173,216,0.12)", fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", marginBottom: 12 }}>{topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}</div>
              <QuestionText text={current.question} />
              {hasTrace && <TraceTable headers={current.traceTable.headers} initialRows={current.traceTable.rows} disabled={checked} onChange={setTraceData} />}

              {/* Workings box */}
              {!checked && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#9ac0d8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Workings</p>
                  <textarea
                    value={workings}
                    onChange={(e) => setWorkings(e.target.value)}
                    placeholder="Show your working here…"
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.4)", fontFamily: FONT, fontSize: 13.5, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, minHeight: 64, transition: "border-color 0.2s", background: "rgba(218,238,250,0.18)" }}
                  />
                </div>
              )}

              {/* Per-part answer boxes */}
              {(!hasTrace || true) && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {answers.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#4a8cbf", minWidth: 22, paddingTop: 13 }}>{i + 1}.</span>
                      <textarea
                        ref={i === 0 ? answerRef : undefined}
                        value={a}
                        onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }}
                        disabled={checked}
                        placeholder={hasTrace && i === 0 ? "Add any written explanation here (optional)…" : ""}
                        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey && canSubmit && !checked) submitAnswer(); }}
                        style={{ flex: 1, padding: "10px 13px", borderRadius: 12, border: `1.5px solid ${answerBorderColor}`, fontFamily: FONT, fontSize: 14.5, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, minHeight: 52, transition: "border-color 0.2s" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback */}
              {checked && <SpeechBubble loading={checking} marksAwarded={fMarks} marksAvailable={fAvail} noWorkings={feedback?.noWorkings} feedback={feedback?.feedback} />}

              {/* Correct answer reveal */}
              {showAnswer && (
                <div style={{ marginTop: 18, background: "rgba(91,174,212,0.05)", border: "1.5px solid rgba(91,174,212,0.2)", borderRadius: 16, padding: "14px 16px" }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", margin: "0 0 7px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model Answer</p>
                  <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.6 }}>{current.answer}</p>
                  {current.traceTable && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", margin: "0 0 7px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Correct Trace</p>
                      <TraceTable headers={current.traceTable.headers} initialRows={current.traceTable.answer} disabled={true} onChange={() => {}} />
                    </div>
                  )}
                </div>
              )}

              {/* Step-by-step */}
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
            </>
          )}
        </div>
        <button onClick={() => navigateTo(idx + 1)} disabled={idx === total - 1}
          style={{ flexShrink: 0, alignSelf: "center", width: 32, height: 32, borderRadius: "50%", background: idx === total - 1 ? "rgba(180,220,240,0.12)" : "rgba(126,173,216,0.15)", border: "none", color: idx === total - 1 ? "#c0d8e8" : "#5a90b0", fontSize: 20, cursor: idx === total - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>›</button>
      </div>

      {/* Action buttons — inset by arrow width so they align with the card edges */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", flexWrap: "wrap", marginTop: 14, paddingLeft: 40, paddingRight: 40 }}>
        {!checked && !showAnswer ? (
          <button onClick={submitAnswer} disabled={!canSubmit || checking}
            style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: canSubmit && !checking ? "pointer" : "not-allowed", opacity: canSubmit && !checking ? 1 : 0.5 }}>
            Submit Answer
          </button>
        ) : isCorrect ? (
          <button onClick={() => recordAndAdvance(fMarks, fAvail)} style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {idx + 1 >= total ? "See Results →" : "Next Question →"}
          </button>
        ) : showAnswer ? (
          <>
            <button onClick={resetToRetry} disabled={regenerating}
              style={{ padding: "11px 20px", borderRadius: 14, background: "rgba(126,173,216,0.1)", border: "1.5px solid rgba(126,173,216,0.35)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: regenerating ? "not-allowed" : "pointer", opacity: regenerating ? 0.6 : 1 }}>
              Try Again (new question)
            </button>
            <button onClick={() => recordAndAdvance(0, fAvail)} style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {idx + 1 >= total ? "See Results →" : "Next Question →"}
            </button>
          </>
        ) : (
          <>
            <button onClick={resetToRetry}
              style={{ padding: "11px 20px", borderRadius: 14, background: isPartial ? "rgba(240,180,30,0.12)" : "rgba(220,100,100,0.08)", border: `1.5px solid ${isPartial ? "rgba(240,180,30,0.4)" : "rgba(220,100,100,0.25)"}`, color: isPartial ? "#a07010" : "#b03030", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Try Again
            </button>
            <button onClick={handleShowAnswer}
              style={{ padding: "11px 18px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#7ab3cc", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Show Answer
            </button>
            <button onClick={() => recordAndAdvance(fMarks, fAvail)}
              style={{ padding: "11px 16px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {idx + 1 >= total ? "Finish →" : "Next →"}
            </button>
          </>
        )}
        <button onClick={() => onAskPip?.(checked)}
          style={{ padding: "11px 18px", borderRadius: 14, background: "rgba(126,173,216,0.12)", border: "1.5px solid rgba(126,173,216,0.3)", color: "#4a8cbf", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <Pip size={18} /> Ask Pip
        </button>
      </div>
    </div>
  );
}

/* ── Results screen ───────────────────────────────────────────── */
function ResultsScreen({ subject, topics, score, total, results, onRetry, onReset }) {
  const pct = total > 0 ? score / total : 0;
  const msg = pct === 1 ? "Perfect score!" : pct >= 0.85 ? "Outstanding!" : pct >= 0.7 ? "Strong performance!" : pct >= 0.5 ? "Keep going!" : "Don't give up — practice makes perfect!";
  const wrongIds = [...new Set(results.filter((r) => r.marksAwarded < r.marksAvailable).map((r) => r.topicId))];
  const rightIds = [...new Set(results.filter((r) => r.marksAwarded === r.marksAvailable).map((r) => r.topicId))].filter((id) => !wrongIds.includes(id));
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

/* ── Top Secret screen ────────────────────────────────────────── */
function TopSecretScreen({ onBack, onSetTheme }) {
  const [input, setInput] = useState("");
  const [bgColor, setBgColor] = useState("#000000");

  function handleInput(val) {
    setInput(val);
    const el = document.createElement("div");
    el.style.color = "";
    el.style.color = val;
    setBgColor(el.style.color ? val : "#000000");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const val = input.trim().toLowerCase();
    if (!val) { onBack(); return; }
    if (val === "blue") { onSetTheme(""); onBack(); return; }
    const el = document.createElement("div");
    el.style.color = "";
    el.style.color = val;
    if (el.style.color) { onSetTheme(val); }
    onBack();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "background 0.4s", background: bgColor }}>
      <button onClick={onBack} style={{ position: "absolute", top: 22, left: 22, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontFamily: FONT, fontWeight: 700, fontSize: 14, padding: 0, letterSpacing: "0.06em" }}>✕ CLOSE</button>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <input
          autoFocus
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder=""
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1.5px solid rgba(255,255,255,0.25)",
            outline: "none",
            color: "rgba(255,255,255,0.85)",
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: 26,
            textAlign: "center",
            width: 240,
            padding: "10px 0",
            caretColor: "rgba(255,255,255,0.6)",
            letterSpacing: "0.15em",
          }}
        />
      </form>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────────── */
export default function App() {
  const [stage, setStage] = useState("checking");
  const [user, setUser] = useState(null);
  const [secretTheme, setSecretTheme] = useState(() => localStorage.getItem("pp_secret_theme") || "");
  const [pathways, setPathways] = useState([]);
  const [resetToken, setResetToken] = useState("");

  // Quiz state
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pipOpen, setPipOpen] = useState(false);
  const [currentQuizChecked, setCurrentQuizChecked] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [initialQuizResults, setInitialQuizResults] = useState({});
  const currentPathwayIdRef = useRef(null);
  const cachedQuestionsRef = useRef(null);
  const quizScrollRef = useRef(null);
  const remainingQuestionsRef = useRef([]);
  const currentQuizResultsRef = useRef({});
  const quizSessionIdRef = useRef(null);
  const savedResultTopicsRef = useRef(new Set());
  const questionsRef = useRef([]);
  const resumeSaveTimerRef = useRef(null);
  const [pendingPathway, setPendingPathway] = useState(null);
  const [savedQuiz, setSavedQuiz] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pp_quiz") || "null"); } catch { return null; }
  });

  async function loadPathways() {
    const p = await callApi("/api/pathways");
    if (p.pathways) setPathways(p.pathways);
  }

  // Check auth on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setStage("reset");
      return;
    }
    callApi("/api/auth/me")
      .then((data) => {
        if (data.id) {
          setUser(data);
          return loadPathways().then(() => setStage("home"));
        } else {
          setStage("login");
        }
      })
      .catch(() => setStage("login"));
  }, []);

  async function afterAuth(data) {
    setUser(data);
    await loadPathways();
    setStage("home");
  }

  function handleLogin(data) { afterAuth(data); }
  function handleSignup(data) { afterAuth(data); }

  async function handleLogout() {
    await callApi("/api/auth/logout", { method: "POST" });
    setUser(null); setPathways([]);
    setSubject(""); setTopics([]); setQuestions([]);
    setLoadProgress(0); setQuizResults(null); setLoadError(""); setPipOpen(false); setCurrentQuizIdx(0);
    localStorage.removeItem("pp_quiz"); setSavedQuiz(null);
    setStage("login");
  }

  function saveQuizSession(resumeIdx) {
    const qs = questionsRef.current;
    if (qs.length > 0) {
      const baseIdx = resumeIdx !== undefined ? resumeIdx : currentQuizIdx;
      const currentResults = currentQuizResultsRef.current;
      // Advance past already-answered questions so "Continue" always lands on the
      // first question the student hasn't dealt with yet (handles the interstitial case
      // where currentQuizIdx still points at the just-answered question).
      let effectiveIdx = baseIdx;
      while (effectiveIdx < qs.length - 1 && currentResults[qs[effectiveIdx]?.topicId] != null) {
        effectiveIdx++;
      }
      const resumeNumber = qs[effectiveIdx]?.number ?? (effectiveIdx + 1);
      const session = { subject, topics, questions: qs, idx: effectiveIdx, resumeNumber, results: currentResults };
      localStorage.setItem("pp_quiz", JSON.stringify(session));
      setSavedQuiz(session);
      // Immediately stamp the DB (cancel any pending debounce) so the resume position
      // is always correct when the user returns — even from the topic-done interstitial.
      const pid = currentPathwayIdRef.current;
      if (pid && resumeNumber != null) {
        if (resumeSaveTimerRef.current) clearTimeout(resumeSaveTimerRef.current);
        callApi(`/api/pathways/${pid}/resume`, { method: "PATCH", body: { resumeNumber } }).catch(() => {});
      }
    }
  }

  function reset() {
    setStage("home"); setSubject(""); setTopics([]); setQuestions([]);
    setLoadProgress(0); setQuizResults(null); setLoadError(""); setPipOpen(false);
    setCurrentQuizIdx(0); setInitialQuizResults({});
    currentQuizResultsRef.current = {};
  }

  function handleExit(resumeIdx) {
    saveQuizSession(resumeIdx);
    reset();
  }

  function handleBackToTopics(resumeIdx) {
    const qs = questionsRef.current;
    // Calculate effective resume idx (same logic as saveQuizSession)
    const currentResults = currentQuizResultsRef.current;
    let effectiveIdx = resumeIdx !== undefined ? resumeIdx : currentQuizIdx;
    while (effectiveIdx < qs.length - 1 && currentResults[qs[effectiveIdx]?.topicId] != null) {
      effectiveIdx++;
    }
    const newResumeNumber = qs[effectiveIdx]?.number ?? (effectiveIdx + 1);
    saveQuizSession(resumeIdx);
    // Update pendingPathway so topicSelect immediately sees the correct resume position
    // AND the correct questions list (so resumePrefix look-up works on the topic cards)
    if (pendingPathway) {
      setPendingPathway((prev) => prev ? { ...prev, resumeNumber: newResumeNumber, questions: qs.length ? qs : prev.questions } : prev);
    }
    setStage("topicSelect");
    setSubject(""); setTopics([]); setQuestions([]);
    setCurrentQuizIdx(0); setInitialQuizResults({});
    currentQuizResultsRef.current = {};
  }

  function handleContinueTopic(pathway, resumeInfo) {
    const { subtopics, resumeNumber } = resumeInfo;
    const selectedIds = new Set(subtopics.map((t) => t.id));
    const filteredCached = Array.isArray(pathway.questions)
      ? pathway.questions.filter((q) => selectedIds.has(q.topicId))
      : null;
    setPendingPathway(pathway);
    handleTopicsReady({
      subject: pathway.subject,
      topics: subtopics,
      save: false,
      pathwayId: pathway.id,
      cachedQuestions: filteredCached && filteredCached.length > 0 ? filteredCached : null,
      resumeNumber,
    });
  }

  // Called by QuizScreen on every question navigation — debounces a DB write so
  // the server always knows the last-seen position even if the user force-closes.
  function handleIdxChange(newIdx) {
    setCurrentQuizIdx(newIdx);
    const pid = currentPathwayIdRef.current;
    const qNum = questionsRef.current[newIdx]?.number;
    if (!pid || qNum == null) return;
    if (resumeSaveTimerRef.current) clearTimeout(resumeSaveTimerRef.current);
    resumeSaveTimerRef.current = setTimeout(() => {
      callApi(`/api/pathways/${pid}/resume`, { method: "PATCH", body: { resumeNumber: qNum } }).catch(() => {});
    }, 600);
  }

  function handleContinueQuiz() {
    if (!savedQuiz) return;
    const restoredResults = savedQuiz.results ?? {};
    // Stamp numbers onto restored questions if missing (old sessions)
    const qs = (savedQuiz.questions ?? []).map((q, i) => (q.number != null ? q : { ...q, number: i + 1 }));
    let resumeIdx = 0;
    // Primary: DB-stored resume_number (updated on every navigation — most reliable)
    const matchingPathway = pathways.find((p) => p.subject === savedQuiz.subject);
    const dbResumeNumber = matchingPathway?.resumeNumber ?? null;
    if (dbResumeNumber != null) {
      const byNum = qs.findIndex((q) => q.number === dbResumeNumber);
      resumeIdx = byNum >= 0 ? byNum : 0;
    } else if (savedQuiz.resumeNumber != null) {
      // Fallback: localStorage resume number
      const byNum = qs.findIndex((q) => q.number === savedQuiz.resumeNumber);
      resumeIdx = byNum >= 0 ? byNum : savedQuiz.idx ?? 0;
    } else if (savedQuiz.idx != null && savedQuiz.idx > 0) {
      resumeIdx = savedQuiz.idx;
    } else if (Object.keys(restoredResults).length > 0) {
      const first = qs.findIndex((q) => !restoredResults[q.topicId]);
      resumeIdx = first > 0 ? first : 0;
    }
    currentQuizResultsRef.current = restoredResults;
    setSubject(savedQuiz.subject);
    setTopics(savedQuiz.topics);
    questionsRef.current = qs;
    setQuestions(qs);
    remainingQuestionsRef.current = [...qs];
    setCurrentQuizIdx(resumeIdx);
    setInitialQuizResults(restoredResults);
    setStage("quiz");
  }

  const QUESTION_SYSTEM = `You are generating a GCSE exam question for a student.
Return ONLY valid JSON with no markdown:
{
  "question": "The full question text. If multiple parts, write as:\\n1. first part\\n2. second part\\n3. third part. If the question contains any code (Python, pseudocode, SQL, etc.) place it in a fenced code block using triple backticks with the language name, e.g. \`\`\`python\\nx = 5\\n\`\`\`. Keep prose and code clearly separated.",
  "marks": 1,
  "partAnswers": null,
  "answer": "full model answer",
  "steps": ["step 1 sentence", "step 2 sentence", "step 3 sentence"],
  "traceTable": null
}
- marks: total marks available. For a single-part question set marks: 1 and partAnswers: null. For a multi-part question set marks equal to the number of parts and partAnswers to an array of concise answers, one per part e.g. ["answer to part 1", "answer to part 2"].
If the topic is a Computer Science trace/dry-run exercise, replace traceTable with:
{
  "headers": ["Variable / Line", "step1", "step2", "step3"],
  "rows": [["x", "", "", ""], ["y", "", "", ""]],
  "answer": [["x", "0", "3", "5"], ["y", "2", "4", "4"]]
}
Otherwise traceTable must be null. Max 4 steps, each one short plain sentence.

Difficulty rules based on the student's confidence rating for this topic:
- Rating 1 (Refresher / high confidence): HARDEST — challenging multi-step question requiring analysis, evaluation or extended application; 4–6 marks; test deep understanding and expect the student to synthesise ideas.
- Rating 2 (Consolidate): MODERATELY HARD — multi-part question requiring explanation and application; 3–4 marks; standard A/A* exam style.
- Rating 3 (Needs Help): MODERATE — straightforward exam-style question testing understanding; 2–3 marks; clear and accessible.
- Rating 4 (New Topic / no rating / null): EASIEST — simple recall or definition question; 1–2 marks; foundational knowledge only.
Always match question difficulty and marks to the rating above.`;

  async function handleTopicsReady({ subject: sub, topics: tops, save = true, pathwayId = null, cachedQuestions = null, resumeNumber = null }) {
    setSubject(sub); setTopics(tops); setStage("loading"); setLoadProgress(0); setLoadError(""); setCurrentQuizIdx(0);
    currentPathwayIdRef.current = pathwayId;
    cachedQuestionsRef.current = cachedQuestions;
    // Fresh session ID for this quiz run — used to save per-question results immediately
    quizSessionIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    savedResultTopicsRef.current = new Set();

    // Save pathway to backend and refresh list (only for new uploads)
    let resolvedPathwayId = pathwayId;
    if (user && save) {
      try {
        const saved = await callApi("/api/pathways", { method: "POST", body: { subject: sub, topics: tops } });
        resolvedPathwayId = saved.id ?? null;
        currentPathwayIdRef.current = resolvedPathwayId;
        loadPathways();
      } catch {}
    }

    // Helper: ensure every question has an immutable sequence number
    const stampNumbers = (arr) => arr.map((q, i) => (q.number != null ? q : { ...q, number: i + 1 }));

    // If we already have cached questions for this pathway, use them directly
    if (Array.isArray(cachedQuestions) && cachedQuestions.length > 0) {
      // Prefer the full question list from localStorage (includes already-answered Qs)
      const lsQuiz = (() => { try { return JSON.parse(localStorage.getItem("pp_quiz") || "null"); } catch { return null; } })();
      const fullQs = (lsQuiz?.subject === sub && Array.isArray(lsQuiz.questions) && lsQuiz.questions.length >= cachedQuestions.length)
        ? stampNumbers(lsQuiz.questions)
        : stampNumbers(cachedQuestions);
      const restoredResults = (lsQuiz?.subject === sub) ? (lsQuiz.results ?? {}) : {};
      // Determine resume position: DB resumeNumber (most reliable) → localStorage → start
      let resumeIdx = 0;
      if (resumeNumber != null) {
        const byNum = fullQs.findIndex((q) => q.number === resumeNumber);
        resumeIdx = byNum >= 0 ? byNum : 0;
      } else if (lsQuiz?.subject === sub && lsQuiz?.resumeNumber != null) {
        const byNum = fullQs.findIndex((q) => q.number === lsQuiz.resumeNumber);
        resumeIdx = byNum >= 0 ? byNum : 0;
      }
      setLoadProgress(tops.length);
      questionsRef.current = fullQs;
      setQuestions(fullQs);
      remainingQuestionsRef.current = [...fullQs];
      setInitialQuizResults(restoredResults);
      currentQuizResultsRef.current = restoredResults;
      setCurrentQuizIdx(resumeIdx);
      setStage("quiz");
      return;
    }

    let done = 0;
    try {
      const raw_qs = await batchedMap(tops, 5, async (topic) => {
        const confLabel = topic.confidence != null ? `${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]})` : "null (no rating — treat as Rating 4, easiest)";
        const raw = await callClaude({ system: QUESTION_SYSTEM, user: `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${confLabel}`, max_tokens: 2500 });
        const q = parseJSON(raw);
        done++; setLoadProgress(done);
        return { topicId: topic.id, ...q };
      });
      const qs = stampNumbers(raw_qs);
      questionsRef.current = qs;
      setQuestions(qs);
      remainingQuestionsRef.current = [...qs];
      setStage("quiz");
      // Cache the generated questions for this pathway in the DB
      if (resolvedPathwayId) {
        callApi(`/api/pathways/${resolvedPathwayId}/questions`, { method: "PATCH", body: { questions: qs } })
          .then(() => loadPathways())
          .catch(() => {});
      }
    } catch (e) {
      // Fall back to DB-cached questions if available
      if (Array.isArray(cachedQuestionsRef.current) && cachedQuestionsRef.current.length > 0) {
        const numbered = stampNumbers(cachedQuestionsRef.current);
        setLoadProgress(tops.length);
        questionsRef.current = numbered;
        setQuestions(numbered);
        remainingQuestionsRef.current = [...numbered];
        setStage("quiz");
      } else {
        setLoadError(e.message || "Failed to generate questions. Please check your connection and try again.");
      }
    }
  }

  // Called by QuizScreen when user clicks "Mark Topic as Mastered"
  async function handleCompleteTopic(prefix) {
    const pid = currentPathwayIdRef.current;
    if (!pid) return;
    await callApi(`/api/pathways/${pid}/complete-topic`, { method: "PATCH", body: { prefix } }).catch(() => {});
    // Remove completed topic's questions from local cache so future sessions regenerate them
    const pruned = questionsRef.current.filter((q) => {
      const qPrefix = q.topicId ? String(q.topicId).split(".")[0] : null;
      return qPrefix !== prefix;
    });
    questionsRef.current = pruned;
    loadPathways();
  }

  // Called by QuizScreen each time a question is answered.
  // variantQuestion is non-null when the student used "Try again" and answered the variant.
  function handleQuestionComplete(topicId, marksAwarded, marksAvailable, variantQuestion) {
    const pid = currentPathwayIdRef.current;
    // If a variant was answered, replace that question in the DB so resume sees the variant
    if (variantQuestion && pid) {
      const updated = questionsRef.current.map((q) =>
        q.topicId === topicId ? { ...variantQuestion, number: q.number } : q
      );
      questionsRef.current = updated;
      setQuestions(updated);
      remainingQuestionsRef.current = [...updated];
      callApi(`/api/pathways/${pid}/questions`, { method: "PATCH", body: { questions: updated } }).catch(() => {});
    }
    // Immediately persist this result so Subjects / Suggestions tabs update in real-time
    if (user && quizSessionIdRef.current && marksAwarded != null) {
      const topicDesc = topics.find((t) => t.id === topicId)?.description || "";
      savedResultTopicsRef.current.add(topicId);
      callApi("/api/quiz-results", {
        method: "POST",
        body: {
          subject,
          sessionId: quizSessionIdRef.current,
          pathwayId: currentPathwayIdRef.current,
          results: [{ topicId, topicDesc, correct: marksAwarded === marksAvailable, marksAwarded, marksAvailable }],
        },
      }).catch(() => {});
    }
  }

  function handleQuizFinish(r) {
    setQuizResults(r);
    setStage("results");
    localStorage.removeItem("pp_quiz"); setSavedQuiz(null);
    // Save any results not already persisted per-question (avoids duplicates)
    if (user) {
      const unsaved = r.results.filter((res) => !savedResultTopicsRef.current.has(res.topicId));
      if (unsaved.length > 0) {
        const sessionId = quizSessionIdRef.current || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payload = unsaved.map((res) => ({
          topicId: res.topicId,
          topicDesc: topics.find((t) => t.id === res.topicId)?.description || "",
          correct: res.marksAwarded === res.marksAvailable,
          marksAwarded: res.marksAwarded ?? 0,
          marksAvailable: res.marksAvailable ?? 1,
        }));
        callApi("/api/quiz-results", { method: "POST", body: { subject, sessionId, pathwayId: currentPathwayIdRef.current, results: payload } })
          .then(() => loadPathways())
          .catch(() => {});
      } else {
        loadPathways();
      }
    }
    // Silently generate a fresh set of questions for all topics in the background
    const pid = currentPathwayIdRef.current;
    const snapTopics = [...topics];
    if (pid && snapTopics.length > 0) {
      (async () => {
        try {
          const freshQs = await batchedMap(snapTopics, 5, async (topic) => {
            const confLabel = topic.confidence != null ? `${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]})` : "null (no rating — treat as Rating 4, easiest)";
            const raw = await callClaude({ system: QUESTION_SYSTEM, user: `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${confLabel}`, max_tokens: 2500 });
            const q = parseJSON(raw);
            return { topicId: topic.id, ...q };
          });
          await callApi(`/api/pathways/${pid}/questions`, { method: "PATCH", body: { questions: freshQs } });
          loadPathways();
        } catch {}
      })();
    }
  }

  function handleRetry() { setQuizResults(null); setCurrentQuizIdx(0); setInitialQuizResults({}); setStage("quiz"); }

  const currentQ = stage === "quiz" ? questions[currentQuizIdx] : null;
  const currentTopic = currentQ ? topics.find((t) => t.id === currentQ.topicId) : null;

  // Auth stages — no nav bar
  if (stage === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Pip size={70} />
          <div style={{ display: "flex", gap: 7 }}>{[0,1,2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}</div>
        </div>
      </div>
    );
  }

  if (stage === "login") return <LoginScreen onLogin={handleLogin} onSignup={() => setStage("signup")} onForgot={() => setStage("forgot")} />;
  if (stage === "signup") return <SignupScreen onSignup={handleSignup} onLogin={() => setStage("login")} />;
  if (stage === "forgot") return <ForgotScreen onBack={() => setStage("login")} />;
  if (stage === "reset") return <ResetScreen token={resetToken} onSuccess={(data) => { afterAuth(data); window.history.replaceState({}, "", "/"); }} />;

  const contentBg = { flex: 1, overflowY: "auto", background: "linear-gradient(160deg,#daeefa 0%,#eef7fd 45%,#ffffff 100%)" };

  return (
    <>
      <style>{`
        @keyframes pipBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes metalShimmer {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        * { font-family: 'Nunito', -apple-system, system-ui, sans-serif; }
        input, textarea, button, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(126,173,216,0.3); border-radius: 6px; }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          user={user}
          activeStage={stage}
          onHome={() => { if (stage === "quiz") { handleExit(); } else { setPendingPathway(null); setStage("home"); } }}
          onSuggestions={() => setStage("suggestions")}
          onCalendar={() => setStage("calendar")}
          onLeaderboard={() => setStage("leaderboard")}
          onAreas={() => setStage("subjects")}
          onAccount={() => setStage("account")}
          onLogout={handleLogout}
        />

        {stage === "loading" && <LoadingScreen progress={loadProgress} total={topics.length} error={loadError} onRetry={() => { setLoadError(""); handleTopicsReady({ subject, topics, save: false, pathwayId: currentPathwayIdRef.current, cachedQuestions: cachedQuestionsRef.current }); }} onHome={() => { setLoadError(""); reset(); }} />}

        {stage === "calendar" && <div style={contentBg}><CalendarScreen user={user} onBack={() => setStage("home")} /></div>}

        {stage === "leaderboard" && <div style={contentBg}><LeaderboardScreen currentUserId={user?.id} /></div>}

        {stage === "account" && <div style={contentBg}><AccountScreen user={user} onBack={() => setStage("home")} onUserUpdate={(updated) => setUser(updated)} onLogout={handleLogout} onAdmin={() => setStage("admin")} onTopSecret={() => setStage("topSecret")} /></div>}

        {stage === "admin" && <div style={contentBg}><AdminPage onBack={() => setStage("account")} /></div>}

        {stage === "topSecret" && <TopSecretScreen onBack={() => setStage("account")} onSetTheme={(theme) => { setSecretTheme(theme); localStorage.setItem("pp_secret_theme", theme); }} />}

        {stage === "subjects" && <div style={contentBg}><SubjectsScreen pathways={pathways} onQuiz={handleTopicsReady} /></div>}

        {stage === "suggestions" && <div style={contentBg}><SuggestionsScreen pathways={pathways} onQuiz={handleTopicsReady} /></div>}

        {stage === "topicSelect" && pendingPathway && (
          <div style={contentBg}>
            <TopicSelectScreen
              pathway={pendingPathway}
              onBack={() => { setPendingPathway(null); setStage("home"); }}
              savedResume={{
                resumeNumber: pendingPathway.resumeNumber ?? pendingPathway.resume_number ?? null,
                questions: Array.isArray(pendingPathway.questions) ? pendingPathway.questions : null,
              }}
              onStart={(selectedTopics, resumeNum) => {
                const p = pendingPathway;
                const selectedIds = new Set(selectedTopics.map((t) => t.id));
                const filteredCached = Array.isArray(p.questions)
                  ? p.questions.filter((q) => selectedIds.has(q.topicId))
                  : null;
                handleTopicsReady({
                  subject: p.subject,
                  topics: selectedTopics,
                  save: false,
                  pathwayId: p.id,
                  cachedQuestions: filteredCached && filteredCached.length > 0 ? filteredCached : null,
                  resumeNumber: resumeNum ?? null,
                });
              }}
            />
          </div>
        )}

        {stage === "home" && (
          <div style={contentBg}>
            <PathwayDashboard
              pathways={pathways}
              savedSubject={savedQuiz?.subject ?? null}
              onSelect={(p) => {
                callApi(`/api/pathways/${p.id}/open`, { method: "PATCH" }).then(() => loadPathways()).catch(() => {});
                setPendingPathway(p);
                setStage("topicSelect");
              }}
              onContinue={() => handleContinueQuiz()}
              onContinueTopic={(pathway, resumeInfo) => handleContinueTopic(pathway, resumeInfo)}
              onAddNew={() => setStage("upload")}
              onDelete={(id) => {
                const deleted = pathways.find((p) => p.id === id);
                callApi(`/api/pathways/${id}`, { method: "DELETE" })
                  .then(() => {
                    // Clear saved quiz session if it belongs to the deleted pathway
                    if (deleted && savedQuiz?.subject === deleted.subject) {
                      localStorage.removeItem("pp_quiz");
                      setSavedQuiz(null);
                    }
                    loadPathways();
                  })
                  .catch(() => {});
              }}
            />
          </div>
        )}

        {stage === "upload" && (
          <div style={contentBg}>
            <UploadScreen
              onTopicsReady={({ subject: sub, topics: tops }) => {
                callApi("/api/pathways", { method: "POST", body: { subject: sub, topics: tops } })
                  .then(() => loadPathways())
                  .catch(() => {});
                setStage("home");
              }}
              savedPathway={null}
              existingPathways={pathways}
            />
          </div>
        )}

        {(stage === "quiz" || stage === "results") && (
          <div ref={quizScrollRef} style={{ ...contentBg, padding: "30px 0" }}>
            {stage === "quiz" && <QuizScreen topics={topics} questions={questions} onFinish={handleQuizFinish} onAskPip={(wasChecked) => { setCurrentQuizChecked(wasChecked); setPipOpen(true); }} onIdxChange={handleIdxChange} onExit={handleExit} onBackToTopics={pendingPathway ? (resumeIdx) => handleBackToTopics(resumeIdx) : null} onQuestionComplete={handleQuestionComplete} onResultsChange={(r) => { currentQuizResultsRef.current = r; }} initialIdx={currentQuizIdx} initialResults={initialQuizResults} onScrollTop={() => quizScrollRef.current?.scrollTo({ top: 0, behavior: "instant" })} onCompleteTopic={currentPathwayIdRef.current ? handleCompleteTopic : undefined} />}
            {stage === "results" && quizResults && <ResultsScreen subject={subject} topics={topics} score={quizResults.score} total={quizResults.total} results={quizResults.results} onRetry={handleRetry} onReset={reset} />}
          </div>
        )}

        {pipOpen && <PipChat topic={currentTopic} question={currentQ?.question} correctAnswer={currentQ?.answer} questionAnswered={currentQuizChecked} onClose={() => setPipOpen(false)} />}
      </div>

      {/* Secret theme overlay — pointer-events: none so UI stays fully interactive */}
      {secretTheme === "black" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none", background: "#000", opacity: 0.88 }} />
      )}
      {secretTheme && secretTheme !== "black" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none", background: secretTheme, opacity: 0.45, mixBlendMode: "color" }} />
      )}
    </>
  );
}
