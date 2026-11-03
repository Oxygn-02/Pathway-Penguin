import { useState } from "react";
import { Pip } from "../components/common.jsx";
import { CORE_SUBJECTS, EXAM_BOARDS, FONT, OPTION_SUBJECTS, QUICK_TOPICS } from "../constants.js";

const MAX_TOPICS = 3;
const SUBJECTS = [...CORE_SUBJECTS, ...OPTION_SUBJECTS];

/* ── Quick start: subject → exam board → topics, no pathway document needed ── */
export function QuickStartScreen({ onStart, onBack, onUpload }) {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState(null);
  const [board, setBoard] = useState(null);
  const [picked, setPicked] = useState([]);
  const [custom, setCustom] = useState("");

  const suggestions = QUICK_TOPICS[subject] || [];
  const customTopic = custom.trim();
  const chosen = customTopic && picked.length < MAX_TOPICS ? [...picked, customTopic] : picked;

  function toggle(t) {
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length < MAX_TOPICS ? [...p, t] : p));
  }

  function start() {
    // Build the same topic shape the upload flow produces. No confidence rating,
    // so questions use the default difficulty.
    const topics = chosen.map((description, i) => ({ id: `q${i + 1}`, description, parentTitle: "", confidence: null }));
    onStart({ subject, topics, examBoard: board === "Not sure" ? null : board });
  }

  const optBase = { padding: "14px 12px", borderRadius: 14, fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left", minHeight: 48 };
  const opt = (on) => ({ ...optBase, background: on ? "rgba(91,174,212,0.14)" : "white", border: `2px solid ${on ? "#5baed4" : "rgba(180,220,240,0.55)"}`, color: on ? "#2f86b3" : "#1a3a4f" });
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 };
  const primary = (enabled) => ({ padding: "14px 26px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 800, fontSize: 16, cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.5 });

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      <button onClick={step === 1 ? onBack : () => setStep(step - 1)} style={{ background: "none", border: "none", color: "#7ab3cc", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "8px 0", minHeight: 44 }}>← Back</button>

      <div style={{ display: "flex", gap: 6, margin: "4px 0 6px" }} aria-hidden="true">
        {[1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i <= step ? "#5baed4" : "rgba(180,220,240,0.5)" }} />)}
      </div>
      <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: "0 0 14px" }}>Step {step} of 3</p>

      {step === 1 && (
        <>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#1a3a4f", margin: "0 0 6px" }}>Which subject?</h1>
          <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 15, margin: "0 0 18px" }}>Pick one. You can add more later.</p>
          <div style={grid} role="radiogroup" aria-label="Subject">
            {SUBJECTS.map((s) => (
              <button key={s} role="radio" aria-checked={subject === s} onClick={() => { setSubject(s); setPicked([]); setCustom(""); setStep(2); }} style={opt(subject === s)}>{s}</button>
            ))}
          </div>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: "22px 0 0" }}>
            Got a pathway sheet from your teacher? <button onClick={onUpload} style={{ background: "none", border: "none", padding: 0, color: "#2f86b3", fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Add it instead</button>
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#1a3a4f", margin: "0 0 6px" }}>Which exam board?</h1>
          <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 15, margin: "0 0 18px" }}>It changes how questions are worded. It's on the front of your exam paper, or ask your teacher.</p>
          <div style={grid} role="radiogroup" aria-label="Exam board">
            {EXAM_BOARDS.map((b) => (
              <button key={b} role="radio" aria-checked={board === b} onClick={() => { setBoard(b); setStep(3); }} style={opt(board === b)}>{b}</button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#1a3a4f", margin: "0 0 6px" }}>What do you want to practise?</h1>
          <p style={{ fontFamily: FONT, color: "#7ab3cc", fontSize: 15, margin: "0 0 18px" }}>Pick up to {MAX_TOPICS} topics for {subject}.</p>
          {suggestions.length > 0 && (
            <div style={grid}>
              {suggestions.map((t) => (
                <button key={t} aria-pressed={picked.includes(t)} onClick={() => toggle(t)} style={opt(picked.includes(t))}>{t}</button>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <label htmlFor="qs-custom" style={{ display: "block", fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", marginBottom: 6 }}>{suggestions.length ? "Or type your own" : "Type a topic"}</label>
            <input id="qs-custom" type="text" value={custom} maxLength={120} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Quadratic equations"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1.5px solid rgba(180,220,240,0.55)", fontFamily: FONT, fontSize: 15, color: "#1a3a4f", boxSizing: "border-box", minHeight: 48 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
            <button onClick={start} disabled={!chosen.length} style={primary(chosen.length > 0)}>Start quiz{chosen.length ? ` (${chosen.length})` : ""}</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Pip size={28} /><span style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc" }}>Pip writes one question per topic</span></div>
          </div>
        </>
      )}
    </div>
  );
}
