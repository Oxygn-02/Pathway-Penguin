import { useState } from "react";
import { ErrorBox, Pip } from "../components/common.jsx";
import { AVATARS, CORE_SUBJECTS, FONT, OPTION_SUBJECTS } from "../constants.js";
import { callApi } from "../lib/api.js";

/* ── Login screen ─────────────────────────────────────────────── */
export function LoginScreen({ onLogin, onSignup, onForgot }) {
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
export function SignupScreen({ onSignup, onLogin }) {
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
export function ForgotScreen({ onBack }) {
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
export function ResetScreen({ token, onSuccess }) {
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
