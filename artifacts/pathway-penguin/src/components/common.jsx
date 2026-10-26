import { useState, useRef, useEffect } from "react";
import {
  Bar,
} from "recharts";
import { AVATARS, FONT } from "../constants.js";
import { callAi } from "../lib/api.js";

/* ── Pip image ────────────────────────────────────────────────── */
export function Pip({ size = 60 }) {
  return <img src="/pip.png" alt="Pip the penguin" style={{ width: size, height: "auto", display: "inline-block", flexShrink: 0 }} />;
}

/* ── Step dots ────────────────────────────────────────────────── */
export function StepDots({ stage }) {
  const stages = ["upload", "quiz", "results"];
  const idx = Math.max(0, stages.indexOf(stage));
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
      {stages.map((_, i) => <div key={i} style={{ height: 7, width: i === idx ? 22 : 7, borderRadius: 4, background: i === idx ? "#7eadd8" : "#c8dff0", transition: "all 0.3s" }} />)}
    </div>
  );
}

/* ── Error box ────────────────────────────────────────────────── */
export function ErrorBox({ message }) {
  if (!message) return null;
  return <div style={{ background: "rgba(220,100,100,0.08)", border: "1.5px solid rgba(220,100,100,0.25)", borderRadius: 14, padding: "11px 15px", color: "#b03030", fontSize: 14, fontFamily: FONT, marginTop: 12 }}>{message}</div>;
}

/* ── Loading screen ───────────────────────────────────────────── */
export function LoadingScreen({ progress, total, error, onRetry, onHome }) {
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
export function SpeechBubble({ loading, marksAwarded, marksAvailable, noWorkings, feedback }) {
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
export function PipChat({ topic, question, correctAnswer, questionAnswered, onClose }) {
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
      const reply = await callAi({ system, user: text, max_tokens: 300, stage: "ask_pip" });
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

/* ── Top tab bar ──────────────────────────────────────────────── */
export function TopBar({ user, activeStage, onHome, onSuggestions, onCalendar, onAreas, onAccount, onLeaderboard, onExams, onSources, onLogout }) {
  if (!user) return null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 700);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isActive = (key) => activeStage === key
    || (key === "home" && ["upload", "quiz", "results", "loading", "topicSelect"].includes(activeStage))
    || (key === "sources" && ["source-quiz", "source-quiz-results"].includes(activeStage));

  const navigate = (action) => { setMenuOpen(false); action(); };

  const allTabs = [
    { label: "Home", key: "home", action: () => navigate(onHome) },
    { label: "Exams", key: "exams", action: () => navigate(onExams) },
    { label: "Sources", key: "sources", action: () => navigate(onSources) },
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

  /* ── Desktop layout ── */
  return (
    <div style={{ height: 56, background: "white", borderBottom: "1.5px solid rgba(180,220,240,0.45)", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", paddingLeft: 20, paddingRight: 20, flexShrink: 0 }}>
      {/* Logo — left column */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <button onClick={onAccount} title={user?.username} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, outline: "2px solid rgba(91,174,212,0.3)", outlineOffset: 1 }}>
          <img src={AVATARS[user?.avatar ?? 1]} alt={user?.username ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </button>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: "#1a3a4f", whiteSpace: "nowrap" }}>Pathway Penguin</span>
      </div>

      {/* Tabs — centre column, truly centred in the bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
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

      {/* Right spacer — mirrors left column so tabs stay centred */}
      <div />
    </div>
  );
}

/* ── Completion ring ──────────────────────────────────────────── */
export function CompletionRing({ completed, total, size = 46 }) {
  const R = (size / 2) - 5;
  const circ = 2 * Math.PI * R;
  const pct = total > 0 ? Math.min(1, completed / total) : 0;
  const offset = circ * (1 - pct);
  const allDone = pct >= 1;
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
