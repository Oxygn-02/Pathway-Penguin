import { useState, useRef, useEffect, useCallback } from "react";

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
  return <img src="/pip.png" alt="Pip the penguin" style={{ width: size, height: "auto", display: "block", flexShrink: 0 }} />;
}

/* ── Question text renderer ───────────────────────────────────── */
function QuestionText({ text }) {
  const parts = text.split(/(?=\n\d+[.)]\s|\n[a-z][)]\s)/i);
  if (parts.length <= 1) {
    return <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 16, color: "#1a3a4f", lineHeight: 1.6, margin: 0 }}>{text}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {parts.map((part, i) => {
        const trimmed = part.replace(/^\n/, "").trim();
        if (!trimmed) return null;
        const isPoint = /^\d+[.)]\s|^[a-z][)]\s/i.test(trimmed);
        return <p key={i} style={{ fontFamily: FONT, fontWeight: isPoint ? 400 : 500, fontSize: isPoint ? 14.5 : 16, color: isPoint ? "#2d5a7a" : "#1a3a4f", lineHeight: 1.6, margin: 0 }}>{trimmed}</p>;
      })}
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
function LoadingScreen({ progress, total }) {
  const pct = total > 0 ? progress / total : 0;
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
function PipChat({ topic, question, correctAnswer, onClose }) {
  const [messages, setMessages] = useState([{ role: "pip", text: "Hi! I'm Pip. I'm here to help with this topic. What would you like to know?" }]);
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
      const reply = await callClaude({ system: `You are Pip, a friendly study penguin. Topic: "${topic?.description}". Question: "${question}". Answer: "${correctAnswer}". Reply in 2-3 short plain sentences. No bullet points. Friendly tone.`, user: text, max_tokens: 300 });
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
function TopBar({ user, activeStage, onHome, onSuggestions, onCalendar, onAreas, onAccount, onLogout }) {
  if (!user) return null;

  const tabs = [
    { label: "Home", key: "home", action: onHome },
    { label: "Suggestions", key: "suggestions", action: onSuggestions },
    { label: "Calendar", key: "calendar", action: onCalendar },
    { label: "Subjects", key: "subjects", action: onAreas },
    { label: "Account", key: "account", action: onAccount },
  ];

  const isActive = (key) => activeStage === key || (key === "home" && ["upload", "quiz", "results", "loading"].includes(activeStage));

  return (
    <div style={{ height: 56, background: "white", borderBottom: "1.5px solid rgba(180,220,240,0.45)", display: "flex", alignItems: "center", paddingLeft: 20, paddingRight: 20, gap: 0, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 28 }}>
        <Pip size={30} />
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: "#1a3a4f", whiteSpace: "nowrap" }}>Pathway Penguin</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
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

      {/* User */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#1a3a4f", margin: 0 }}>{user.username}</p>
      </div>
    </div>
  );
}

/* ── Account screen ───────────────────────────────────────────── */
function AccountScreen({ user, onBack, onUserUpdate, onLogout }) {
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [emailInput, setEmailInput] = useState("");
  const [usernameMsg, setUsernameMsg] = useState({ type: "", text: "" });
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

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

        {/* Log out */}
        <div style={{ marginTop: 32 }}>
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
    onSignup(data);
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

/* ── Calendar screen ──────────────────────────────────────────── */
function CalendarScreen({ user, onBack }) {
  const [entries, setEntries] = useState([]);
  const [dragSubject, setDragSubject] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(null);

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

          {/* Weekly grid */}
          <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, alignItems: "start" }}>
            {DAYS.map((day, dayIdx) => {
              const dayEntries = entries.filter((e) => e.day_of_week === dayIdx);
              const isDropping = dropping === dayIdx;
              return (
                <div key={day}
                  onDragOver={(e) => onDragOver(e, dayIdx)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, dayIdx)}
                  style={{ background: isDropping ? "rgba(91,174,212,0.08)" : "white", borderRadius: 18, border: `2px ${isDropping ? "dashed #5baed4" : "solid rgba(180,220,240,0.4)"}`, padding: "14px 10px", minHeight: dayEntries.length > 0 ? "auto" : 90, boxShadow: "0 4px 18px rgba(91,174,212,0.07)", transition: "all 0.15s" }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#4a8cbf", margin: "0 0 12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>{day.slice(0, 3)}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {dayEntries.map((entry) => (
                      <div key={entry.id} style={{ background: subjectColors[entry.subject] || "rgba(126,173,216,0.15)", borderRadius: 11, padding: "8px 10px", position: "relative" }}>
                        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#1a3a4f", margin: "0 0 3px", lineHeight: 1.3 }}>{entry.subject}</p>
                        <p style={{ fontFamily: FONT, fontSize: 11, color: "#4a8cbf", margin: 0 }}>{DURATIONS.find((d) => d.value === entry.duration_minutes)?.label || entry.duration_minutes + "m"}</p>
                        <button onClick={() => removeEntry(entry.id)} style={{ position: "absolute", top: 4, right: 5, background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.3)", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                      </div>
                    ))}
                  </div>
                  {isDropping && (
                    <div style={{ marginTop: 8, padding: "8px", borderRadius: 11, border: "2px dashed #5baed4", textAlign: "center" }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, color: "#5baed4", margin: 0 }}>Drop here</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pathway dashboard (home after login) ─────────────────────── */
function PathwayDashboard({ pathways, onSelect, onAddNew, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

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
    const visible = hoveredId === pathway.id || confirmId === pathway.id;
    const isConfirming = confirmId === pathway.id;
    if (!visible) return null;
    return (
      <div style={{ position: "absolute", top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
        {isConfirming ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, color: "#e05a5a", fontWeight: 700 }}>Delete?</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pathway.id); setConfirmId(null); setHoveredId(null); }}
              style={{ padding: "3px 10px", borderRadius: 12, background: "#e05a5a", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >Yes</button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
              style={{ padding: "3px 10px", borderRadius: 12, background: "rgba(126,173,216,0.15)", border: "none", color: "#4a8cbf", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >No</button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmId(pathway.id); }}
            title="Delete pathway"
            style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "#e05a5a", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, lineHeight: 1, padding: 0 }}
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
            onClick={() => { setConfirmId(null); onSelect(mostRecent); }}
            onMouseEnter={(e) => { setHoveredId(mostRecent.id); e.currentTarget.style.boxShadow = "0 8px 32px rgba(91,174,212,0.22)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { setHoveredId(null); if (confirmId === mostRecent.id) setConfirmId(null); e.currentTarget.style.boxShadow = cardBase.boxShadow; e.currentTarget.style.transform = "none"; }}
          >
            <DeleteBtn pathway={mostRecent} />
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: "#1a3a4f", margin: 0, paddingRight: 36 }}>{mostRecent.subject}</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>{mostRecent.topics.length} topics · {fmtDate(mostRecent.createdAt)}</p>
            {mostRecent.recentScore && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: FONT, fontSize: 13, color: "#4a8cbf", fontWeight: 700 }}>
                  Last score: {mostRecent.recentScore.correct}/{mostRecent.recentScore.total}
                </span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8" }}>
                  ({Math.round((mostRecent.recentScore.correct / mostRecent.recentScore.total) * 100)}%)
                </span>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>Quiz me!</span>
            </div>
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
                onClick={() => { setConfirmId(null); onSelect(p); }}
                onMouseEnter={(e) => { setHoveredId(p.id); e.currentTarget.style.boxShadow = "0 8px 32px rgba(91,174,212,0.22)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { setHoveredId(null); if (confirmId === p.id) setConfirmId(null); e.currentTarget.style.boxShadow = cardBase.boxShadow; e.currentTarget.style.transform = "none"; }}
              >
                <DeleteBtn pathway={p} />
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#1a3a4f", margin: 0, paddingRight: 36 }}>{p.subject}</p>
                <p style={{ fontFamily: FONT, fontSize: 12, color: "#9ac0d8", margin: 0 }}>{p.topics.length} topics · {fmtDate(p.createdAt)}</p>
                {p.recentScore && (
                  <p style={{ fontFamily: FONT, fontSize: 12, color: "#4a8cbf", fontWeight: 700, margin: "4px 0 0" }}>
                    Last: {p.recentScore.correct}/{p.recentScore.total} ({Math.round((p.recentScore.correct / p.recentScore.total) * 100)}%)
                  </p>
                )}
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
        .then((d) => setBestTopics(d.topics || []))
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
        .then((d) => setWeakTopics(d.topics || []))
        .catch(() => setWeakTopics([]))
        .finally(() => setLoadingAreas(false));
    }
  }

  function handleGenerateQuiz() {
    if (!weakTopics?.length) return;
    const pathway = pathways.find((p) => p.subject === subjectName);
    const topicMap = Object.fromEntries((pathway?.topics || []).map((t) => [t.id, t]));
    const quizTopics = weakTopics.map((w) => topicMap[w.topic_id] || { id: w.topic_id, description: w.topic_desc, confidence: 3 });
    onQuiz({ subject: subjectName, topics: quizTopics, save: false });
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
          callApi(`/api/quiz-results/weak?subject=${encodeURIComponent(subject)}`).then((d) => d.topics || []).catch(() => []),
          callApi(`/api/quiz-results/best?subject=${encodeURIComponent(subject)}`).then((d) => d.topics || []).catch(() => []),
        ]).then(([weak, best]) => ({ subject, weak, best }))
      )
    ).then((results) => { setSuggestions(results); setLoading(false); });
  }, []);

  function handleStartQuiz(subject, weakTopics) {
    const pathway = pathways.find((p) => p.subject === subject);
    const topicMap = Object.fromEntries((pathway?.topics || []).map((t) => [t.id, t]));
    const quizTopics = weakTopics.map((w) => topicMap[w.topic_id] || { id: w.topic_id, description: w.topic_desc, confidence: 3 });
    onQuiz({ subject, topics: quizTopics, save: false });
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
function UploadScreen({ onTopicsReady, savedPathway }) {
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
        const raw = await callClaude({ system: EXTRACT_SYSTEM, user: "Extract all topics and their confidence ratings from this pathway document. Include every sub-topic.", max_tokens: 8192, documents: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }] });
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
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your pathway document text here… Topics with confidence ratings 1–4 will be extracted automatically."
                style={{ width: "100%", height: 170, padding: 13, borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 14, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
              <button onClick={() => extractFromText(pasteText)} disabled={!pasteText.trim() || loading}
                style={{ padding: "13px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed", opacity: pasteText.trim() && !loading ? 1 : 0.5 }}>
                Extract Topics →
              </button>
            </div>
          )}
          {loading && <p style={{ fontFamily: FONT, fontWeight: 500, color: "#7eadd8", fontSize: 14, textAlign: "center", marginTop: 14, margin: "14px 0 0" }}>Pip is reading your document…</p>}
          <ErrorBox message={error} />
        </div>
      </div>
    </div>
  );
}

/* ── Quiz screen ──────────────────────────────────────────────── */
function QuizScreen({ topics, questions, onFinish, onAskPip }) {
  const [idx, setIdx] = useState(0);
  const [workings, setWorkings] = useState("");
  const [answer, setAnswer] = useState("");
  const [traceData, setTraceData] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [variant, setVariant] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const answerRef = useRef(null);

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
    setAnswer(""); setTraceData(null);
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
        max_tokens: 1024,
      });
      const q = parseJSON(raw);
      setVariant({ topicId: base.topicId, ...q });
    } catch { setVariant(null); }
    setRegenerating(false);
    setTimeout(() => answerRef.current?.focus(), 50);
  }

  function fullReset() {
    setWorkings(""); setAnswer(""); setTraceData(null);
    setChecked(false); setShowAnswer(false); setFeedback(null); setError("");
    setVariant(null); setRegenerating(false);
  }

  function recordAndAdvance(marksGiven, marksMax) {
    const newResults = [...results, { topicId: current.topicId, marksAwarded: marksGiven, marksAvailable: marksMax }];
    setResults(newResults);
    if (idx + 1 >= total) {
      const totalScore = newResults.reduce((s, r) => s + r.marksAwarded, 0);
      const totalMarks = newResults.reduce((s, r) => s + r.marksAvailable, 0);
      const topicResults = {};
      newResults.forEach((r) => {
        if (!topicResults[r.topicId]) topicResults[r.topicId] = { correct: 0, total: 0 };
        topicResults[r.topicId].total += r.marksAvailable;
        topicResults[r.topicId].correct += r.marksAwarded;
      });
      onFinish({ score: totalScore, total: totalMarks, results: newResults, topicResults });
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
        system: `Check a GCSE student's answer and award marks. Return ONLY valid JSON:
{"marksAwarded":1,"marksAvailable":1,"noWorkings":false,"feedback":"one short encouraging sentence"}
Rules:
- marksAvailable equals the number of sub-parts in the question (1 for a single question).
- marksAwarded: award 1 mark for each sub-part answered correctly, 0 for each incorrect or missing part.
- noWorkings: set true ONLY when the question clearly requires calculation or method steps AND the student's answer is correct but shows no working. When noWorkings is true, marksAwarded must still equal marksAvailable — do NOT reduce marks just for missing working. Just note it gently in feedback.
- feedback: one short warm encouraging sentence. If noWorkings is true, add a gentle reminder to show working next time.
- MATHEMATICAL EQUIVALENCE: always evaluate both the model answer and student answer numerically before comparing. Accept any form that evaluates to the same value — e.g. accept "36" when the answer is "6^2" or "6²", accept "0.5" when the answer is "1/2", accept "100" when the answer is "10^2", accept simplified or unsimplified fractions that are equal, accept correct units in any reasonable order. Do NOT penalise a student for writing the evaluated number instead of the expression, or vice versa.
- Be forgiving of minor formatting and spelling differences that don't change the meaning.`,
        user: `Question: ${current.question}\nMarks available: ${current.marks ?? 1}\n${current.partAnswers ? `Part answers: ${JSON.stringify(current.partAnswers)}` : `Correct answer: ${current.answer}`}\n${current.traceTable ? `Correct trace: ${JSON.stringify(current.traceTable.answer || [])}` : ""}\nStudent answer: ${finalAnswer}\n\nAward marks.`,
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
  useEffect(() => { answerRef.current?.focus(); }, [idx]);
  if (!current) return null;

  const canSubmit = hasTrace ? (traceData !== null || answer.trim()) : answer.trim();
  const isCorrect = checked && feedback && fMarks === fAvail;
  const isPartial = checked && feedback && fMarks > 0 && fMarks < fAvail;
  const isWrong = checked && feedback && fMarks === 0;

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ height: 5, background: "#ddeefa", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(idx / total) * 100}%`, background: "linear-gradient(90deg,#7eadd8,#5baed4)", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ padding: "4px 13px", borderRadius: 20, background: "rgba(126,173,216,0.12)", fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#4a8cbf" }}>{topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}</div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#9ac0d8", margin: 0 }}>{idx + 1} / {total}</p>
      </div>
      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(180,220,240,0.4)", boxShadow: "0 6px 32px rgba(91,174,212,0.09)", padding: "22px 24px", marginBottom: 14, minHeight: 180 }}>
        {regenerating ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 140, gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #daeefa", borderTopColor: "#5baed4", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: 0 }}>Generating new question…</p>
          </div>
        ) : (
          <>
            <QuestionText text={current.question} />
            {hasTrace && <TraceTable headers={current.traceTable.headers} initialRows={current.traceTable.rows} disabled={checked} onChange={setTraceData} />}

            {/* Text answer */}
            {(!hasTrace || true) && (
              <textarea ref={answerRef} value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={checked}
                placeholder={hasTrace ? "Add any written explanation here (optional)…" : "Type your answer here…"}
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey && canSubmit && !checked) submitAnswer(); }}
                style={{ width: "100%", marginTop: 16, padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${answerBorderColor}`, fontFamily: FONT, fontSize: 14.5, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, minHeight: hasTrace ? 70 : 100, transition: "border-color 0.2s" }} />
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

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!checked && !showAnswer ? (
          <>
            <button onClick={submitAnswer} disabled={!canSubmit || checking}
              style={{ padding: "11px 20px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: canSubmit && !checking ? "pointer" : "not-allowed", opacity: canSubmit && !checking ? 1 : 0.5 }}>
              Submit Answer
            </button>
            <button onClick={handleSkip} style={{ padding: "11px 16px", borderRadius: 14, background: "transparent", border: "1.5px solid rgba(180,220,240,0.5)", color: "#9ac0d8", fontFamily: FONT, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Skip
            </button>
          </>
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

/* ── App ──────────────────────────────────────────────────────── */
export default function App() {
  const [stage, setStage] = useState("checking");
  const [user, setUser] = useState(null);
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
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);

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
    setStage("login");
  }

  function reset() {
    setStage("home"); setSubject(""); setTopics([]); setQuestions([]);
    setLoadProgress(0); setQuizResults(null); setLoadError(""); setPipOpen(false); setCurrentQuizIdx(0);
  }

  const QUESTION_SYSTEM = `You are generating a GCSE exam question for a student.
Return ONLY valid JSON with no markdown:
{
  "question": "The full question text. If multiple parts, write as:\\n1. first part\\n2. second part\\n3. third part",
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
Otherwise traceTable must be null. Max 4 steps, each one short plain sentence.`;

  async function handleTopicsReady({ subject: sub, topics: tops, save = true }) {
    setSubject(sub); setTopics(tops); setStage("loading"); setLoadProgress(0); setLoadError("");

    // Save pathway to backend and refresh list (only for new uploads)
    if (user && save) {
      callApi("/api/pathways", { method: "POST", body: { subject: sub, topics: tops } })
        .then(() => loadPathways())
        .catch(() => {});
    }

    let done = 0;
    try {
      const qs = await batchedMap(tops, 5, async (topic) => {
        const raw = await callClaude({ system: QUESTION_SYSTEM, user: `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]})`, max_tokens: 1024 });
        const q = parseJSON(raw);
        done++; setLoadProgress(done);
        return { topicId: topic.id, ...q };
      });
      setQuestions(qs);
      setStage("quiz");
    } catch (e) {
      setLoadError(e.message || "Failed to generate questions.");
      setStage("upload");
    }
  }

  function handleQuizFinish(r) {
    setQuizResults(r);
    setStage("results");
    // Save results to backend with a session ID so scores can be grouped per-quiz
    if (user) {
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const payload = r.results.map((res) => ({
        topicId: res.topicId,
        topicDesc: topics.find((t) => t.id === res.topicId)?.description || "",
        correct: res.marksAwarded === res.marksAvailable,
      }));
      callApi("/api/quiz-results", { method: "POST", body: { subject, sessionId, results: payload } })
        .then(() => loadPathways())
        .catch(() => {});
    }
  }

  function handleRetry() { setQuizResults(null); setCurrentQuizIdx(0); setStage("quiz"); }

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
        * { font-family: 'Nunito', -apple-system, system-ui, sans-serif; }
        input, textarea, button, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(126,173,216,0.3); border-radius: 6px; }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          user={user}
          activeStage={stage}
          onHome={() => setStage("home")}
          onSuggestions={() => setStage("suggestions")}
          onCalendar={() => setStage("calendar")}
          onAreas={() => setStage("subjects")}
          onAccount={() => setStage("account")}
          onLogout={handleLogout}
        />

        {stage === "loading" && <LoadingScreen progress={loadProgress} total={topics.length} />}

        {stage === "calendar" && <div style={contentBg}><CalendarScreen user={user} onBack={() => setStage("home")} /></div>}

        {stage === "account" && <div style={contentBg}><AccountScreen user={user} onBack={() => setStage("home")} onUserUpdate={(updated) => setUser(updated)} onLogout={handleLogout} /></div>}

        {stage === "subjects" && <div style={contentBg}><SubjectsScreen pathways={pathways} onQuiz={handleTopicsReady} /></div>}

        {stage === "suggestions" && <div style={contentBg}><SuggestionsScreen pathways={pathways} onQuiz={handleTopicsReady} /></div>}

        {stage === "home" && (
          <div style={contentBg}>
            <PathwayDashboard
              pathways={pathways}
              onSelect={(p) => {
                callApi(`/api/pathways/${p.id}/open`, { method: "PATCH" }).then(() => loadPathways()).catch(() => {});
                handleTopicsReady({ subject: p.subject, topics: p.topics, save: false });
              }}
              onAddNew={() => setStage("upload")}
              onDelete={(id) => callApi(`/api/pathways/${id}`, { method: "DELETE" }).then(() => loadPathways()).catch(() => {})}
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
            />
          </div>
        )}

        {(stage === "quiz" || stage === "results") && (
          <div style={{ ...contentBg, padding: "30px 0" }}>
            {stage === "quiz" && <QuizScreen topics={topics} questions={questions} onFinish={handleQuizFinish} onAskPip={() => setPipOpen(true)} onIdxChange={setCurrentQuizIdx} />}
            {stage === "results" && quizResults && <ResultsScreen subject={subject} topics={topics} score={quizResults.score} total={quizResults.total} results={quizResults.results} onRetry={handleRetry} onReset={reset} />}
          </div>
        )}

        {(stage === "quiz" || stage === "results") && !pipOpen && (
          <button onClick={() => setPipOpen(true)} style={{ position: "fixed", bottom: 20, right: 16, padding: "9px 18px 9px 10px", borderRadius: 30, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 18px rgba(91,174,212,0.38)", zIndex: 999 }}>
            <Pip size={26} /> Ask Pip
          </button>
        )}
        {pipOpen && <PipChat topic={currentTopic} question={currentQ?.question} correctAnswer={currentQ?.answer} onClose={() => setPipOpen(false)} />}
      </div>
    </>
  );
}
