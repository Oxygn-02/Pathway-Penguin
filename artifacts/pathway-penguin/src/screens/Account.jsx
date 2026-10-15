import { useState } from "react";
import {
  Legend,
} from "recharts";
import { AVATARS, FONT } from "../constants.js";
import { callApi } from "../lib/api.js";

/* ── Account screen ───────────────────────────────────────────── */
export function AccountScreen({ user, onBack, onUserUpdate, onLogout, onAdmin }) {
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [emailInput, setEmailInput] = useState("");
  const [usernameMsg, setUsernameMsg] = useState({ type: "", text: "" });
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  async function changeAvatar(idx) {
    if (avatarBusy) return;
    setAvatarBusy(true); setAvatarMsg("");
    const data = await callApi("/api/auth/avatar", { method: "PATCH", body: { avatar: idx } });
    setAvatarBusy(false);
    if (data.error) { setAvatarMsg("Error: " + data.error); setTimeout(() => setAvatarMsg(""), 3000); }
    else { onUserUpdate({ ...user, avatar: data.avatar }); setAvatarMsg("Saved!"); setTimeout(() => setAvatarMsg(""), 1500); }
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 16 }}>
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
                    outlineOffset: 4, transition: "outline 0.15s, transform 0.15s",
                    transform: selected ? "scale(1.08)" : "scale(1)",
                    opacity: avatarBusy && !selected ? 0.55 : 1,
                  }}
                >
                  <img src={src} alt={`Avatar ${idx}`} style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", objectFit: "cover", display: "block" }} />
                </button>
              );
            })}
          </div>
          {(avatarBusy || avatarMsg) && (
            <p style={{ fontFamily: FONT, fontSize: 12, color: avatarMsg.startsWith("Error") ? "#b03030" : avatarMsg === "Already selected!" ? "#9ac0d8" : "#27826a", margin: "10px 0 0" }}>
              {avatarBusy ? "Saving…" : avatarMsg}
            </p>
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

        {/* Admin (KaneCyrus26 only) */}
        {user.username === "KaneCyrus26" && (
          <div style={{ marginTop: 28 }}>
            <button onClick={onAdmin}
              style={{ width: "100%", padding: "13px", borderRadius: 16, background: "none", border: "1.5px solid rgba(126,173,216,0.35)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(126,173,216,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >Admin Dashboard</button>
          </div>
        )}


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
export function AdminPage({ onBack }) {
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
