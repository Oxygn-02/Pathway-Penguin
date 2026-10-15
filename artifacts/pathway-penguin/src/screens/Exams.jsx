import { useState, useRef, useEffect } from "react";
import { Pip } from "../components/common.jsx";
import { CAL_DAYS, CAL_MONTHS, FONT, PRIORITY_COLORS, UTC_SUBJECTS } from "../constants.js";
import { callApi } from "../lib/api.js";
import { groupTopicsByPrefix } from "./Pathways.jsx";

export function fmtExamDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  const abs = new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  if (diff < 0) return abs + " (passed)";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `In ${diff} days`;
  if (diff <= 30) return `In ${Math.round(diff / 7)} week${diff >= 14 ? "s" : ""}`;
  return abs;
}

export function fmtShortDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function MiniCalendar({ value, onChange, minDate }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const sel   = value ? new Date(value + "T00:00:00") : null;
  const [vYear,  setVYear]  = useState(sel ? sel.getFullYear()  : today.getFullYear());
  const [vMonth, setVMonth] = useState(sel ? sel.getMonth()     : today.getMonth());

  const daysInMonth = new Date(vYear, vMonth + 1, 0).getDate();
  const firstDow    = (new Date(vYear, vMonth, 1).getDay() + 6) % 7;
  const cells       = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
  const minD        = minDate ? new Date(minDate + "T00:00:00") : null;

  function isSel(d)  { return sel && d && sel.getFullYear() === vYear && sel.getMonth() === vMonth && sel.getDate() === d; }
  function isTod(d)  { return d && today.getFullYear() === vYear && today.getMonth() === vMonth && today.getDate() === d; }
  function isPast(d) { return !!d && !!minD && new Date(vYear, vMonth, d) < minD; }

  function pick(d) {
    if (!d || isPast(d)) return;
    onChange(`${vYear}-${String(vMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  function prev() { vMonth === 0 ? (setVYear(y=>y-1), setVMonth(11)) : setVMonth(m=>m-1); }
  function next() { vMonth === 11 ? (setVYear(y=>y+1), setVMonth(0)) : setVMonth(m=>m+1); }

  const navBtn = { background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#5baed4", fontWeight:800, padding:"2px 10px", borderRadius:8, lineHeight:1 };

  return (
    <div style={{ background:"white", borderRadius:20, border:"1.5px solid rgba(91,174,212,0.3)", boxShadow:"0 8px 36px rgba(91,174,212,0.18)", padding:"16px 14px", width:280, userSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button type="button" onClick={prev} style={navBtn}>‹</button>
        <span style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:"#1a3a4f" }}>{CAL_MONTHS[vMonth]} {vYear}</span>
        <button type="button" onClick={next} style={navBtn}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {CAL_DAYS.map(d => <div key={d} style={{ textAlign:"center", fontFamily:FONT, fontSize:11, fontWeight:700, color:"#9ac0d8", padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((d,i) => {
          const sel_  = isSel(d);
          const tod_  = isTod(d);
          const past_ = isPast(d);
          return (
            <div key={i} onClick={() => pick(d)} style={{ textAlign:"center", padding:"5px 0", borderRadius:9, cursor: d && !past_ ? "pointer" : "default", background: sel_ ? "#5baed4" : tod_ ? "rgba(91,174,212,0.13)" : "transparent", color: !d ? "transparent" : past_ ? "#c8dce8" : sel_ ? "white" : "#1a3a4f", fontFamily:FONT, fontSize:13, fontWeight: sel_ || tod_ ? 700 : 400, position:"relative" }}>
              {d ?? ""}
              {tod_ && !sel_ && <span style={{ position:"absolute", bottom:1, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:"#5baed4", display:"block" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateField({ value, onChange, minDate }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onOut(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position:"relative" }}>
      <label style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Exam date</label>
      <div onClick={() => setOpen(o => !o)} style={{ padding:"10px 14px", borderRadius:12, border:`1.5px solid ${open ? "#5baed4" : "rgba(126,173,216,0.4)"}`, fontFamily:FONT, fontSize:14, color: value ? "#1a3a4f" : "#aac8d8", cursor:"pointer", background:"white", boxSizing:"border-box", display:"flex", alignItems:"center", gap:8, transition:"border-color 0.15s" }}>
        <span>📅</span>
        <span>{value ? fmtShortDate(value) : "dd/mm/yyyy"}</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:300 }}>
          <MiniCalendar value={value} onChange={v => { onChange(v); setOpen(false); }} minDate={minDate} />
        </div>
      )}
    </div>
  );
}

export function PaperBuilder({ paper, pathways, onChange, onRemove, onRequestUpload }) {
  const [showLink, setShowLink] = useState(false);
  const [selSubject, setSelSubject] = useState(() => {
    if (paper.pathwayId) { const pw = pathways.find(p => p.id === paper.pathwayId); return pw ? pw.subject : ""; }
    return "";
  });

  const matchPw = selSubject ? (pathways.find(p => p.subject === selSubject) || null) : null;

  function onSubjectChange(subj) {
    setSelSubject(subj);
    const pw = subj ? (pathways.find(p => p.subject === subj) || null) : null;
    onChange({ ...paper, pathwayId: pw ? pw.id : null, topicIds: [] });
  }

  function toggleGroup(group) {
    const gids = group.subtopics.map(t => String(t.id));
    const cur = paper.topicIds || [];
    const allSel = gids.every(id => cur.includes(id));
    onChange({ ...paper, topicIds: allSel ? cur.filter(id => !gids.includes(id)) : [...new Set([...cur, ...gids])] });
  }

  const groups = matchPw ? groupTopicsByPrefix(matchPw.topics || []) : [];

  return (
    <div style={{ background:"rgba(218,238,250,0.2)", borderRadius:14, border:"1.5px solid rgba(126,173,216,0.25)", padding:"12px 14px", marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <input
          value={paper.name}
          onChange={e => onChange({ ...paper, name: e.target.value })}
          placeholder="Paper name (e.g. Paper 1, Calculator…)"
          style={{ flex:1, padding:"8px 11px", borderRadius:10, border:"1.5px solid rgba(126,173,216,0.35)", fontFamily:FONT, fontSize:13, color:"#1a3a4f", outline:"none" }}
        />
        <button type="button" onClick={() => setShowLink(o => !o)}
          style={{ padding:"8px 12px", borderRadius:10, background: showLink ? "rgba(91,174,212,0.12)" : "rgba(218,238,250,0.5)", border:"1.5px solid rgba(126,173,216,0.3)", fontFamily:FONT, fontSize:12, fontWeight:700, color:"#5baed4", cursor:"pointer", whiteSpace:"nowrap" }}>
          {showLink ? "Hide" : "Link topics"}
        </button>
        <button type="button" onClick={onRemove}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#c09090", fontSize:20, lineHeight:1, padding:"0 2px", fontWeight:700 }}>×</button>
      </div>

      {showLink && (
        <div style={{ marginTop:10 }}>
          <label style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Subject</label>
          <select
            value={selSubject}
            onChange={e => onSubjectChange(e.target.value)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:10, border:"1.5px solid rgba(126,173,216,0.4)", fontFamily:FONT, fontSize:13, color: selSubject ? "#1a3a4f" : "#9ab3c8", marginBottom:8, background:"white", outline:"none" }}
          >
            <option value="">— Select a subject —</option>
            {UTC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {selSubject && !matchPw && (
            <div style={{ background:"rgba(218,238,250,0.4)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
              <p style={{ fontFamily:FONT, fontSize:13, color:"#5a7a99", margin:0 }}>No pathway uploaded for <strong>{selSubject}</strong> yet.</p>
              <button type="button" onClick={() => onRequestUpload && onRequestUpload(selSubject)}
                style={{ padding:"6px 14px", borderRadius:10, background:"linear-gradient(135deg,#7eadd8,#5baed4)", border:"none", color:"white", fontFamily:FONT, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                Upload pathway
              </button>
            </div>
          )}

          {matchPw && groups.length > 0 && (
            <div>
              <label style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Topics to revise</label>
              <div style={{ display:"flex", flexDirection:"column", gap:3, maxHeight:180, overflowY:"auto", border:"1px solid rgba(126,173,216,0.2)", borderRadius:10, padding:"6px 8px" }}>
                {groups.map(group => {
                  const gids = group.subtopics.map(t => String(t.id));
                  const allSel = gids.every(id => (paper.topicIds || []).includes(id));
                  return (
                    <label key={group.prefix} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"5px 7px", borderRadius:8, background: allSel ? "rgba(91,174,212,0.1)" : "transparent" }}>
                      <input type="checkbox" checked={allSel} onChange={() => toggleGroup(group)} style={{ width:15, height:15, accentColor:"#5baed4", cursor:"pointer", flexShrink:0 }} />
                      <span style={{ fontFamily:FONT, fontSize:13, color:"#1a3a4f", fontWeight: allSel ? 700 : 400 }}>
                        <span style={{ color:"#7eadd8", marginRight:4 }}>{group.prefix}.</span>{group.title}
                      </span>
                    </label>
                  );
                })}
              </div>
              {(paper.topicIds||[]).length > 0 && <p style={{ fontFamily:FONT, fontSize:11, color:"#5baed4", margin:"5px 0 0", fontWeight:600 }}>{paper.topicIds.length} topic group{paper.topicIds.length !== 1 ? "s" : ""} selected</p>}
            </div>
          )}
          {matchPw && groups.length === 0 && <p style={{ fontFamily:FONT, fontSize:12, color:"#9ab3c8", margin:"4px 0 0" }}>No topics found in this pathway.</p>}
        </div>
      )}
    </div>
  );
}

export function PaperRow({ paper, pathways, examId, onDelete, onUpdate, onQuiz, onRequestUpload }) {
  const [editing, setEditing] = useState(false);
  const [selSubject, setSelSubject] = useState(() => {
    if (paper.pathwayId) { const pw = pathways.find(p => p.id === paper.pathwayId); return pw ? pw.subject : ""; }
    return "";
  });
  const [selTopics, setSelTopics] = useState(paper.topicIds || []);
  const [saving, setSaving] = useState(false);

  const pw         = pathways.find(p => p.id === paper.pathwayId) || null;
  const editPw     = selSubject ? (pathways.find(p => p.subject === selSubject) || null) : null;
  const editGroups = editPw ? groupTopicsByPrefix(editPw.topics || []) : [];

  const linkedGroups = pw ? (() => {
    const tids = paper.topicIds || [];
    return groupTopicsByPrefix(pw.topics || []).filter(g =>
      g.subtopics.some(t => tids.includes(String(t.id)))
    );
  })() : [];

  function onEditSubjectChange(subj) {
    setSelSubject(subj);
    setSelTopics([]);
  }

  function toggleEditGroup(group) {
    const gids = group.subtopics.map(t => String(t.id));
    const allSel = gids.every(id => selTopics.includes(id));
    setSelTopics(cur => allSel ? cur.filter(id => !gids.includes(id)) : [...new Set([...cur, ...gids])]);
  }

  async function saveLinks() {
    setSaving(true);
    const pathwayId = editPw ? editPw.id : null;
    try {
      await callApi(`/api/exams/${examId}/papers/${paper.id}`, {
        method:"PATCH", body:{ pathwayId, topicIds: selTopics }
      });
      onUpdate(paper.id, { pathwayId, topicIds: selTopics });
      setEditing(false);
    } finally { setSaving(false); }
  }

  function handleQuiz() {
    if (!pw || !(paper.topicIds||[]).length) return;
    const tids = paper.topicIds;
    const selected = (pw.topics || []).filter(t => tids.includes(String(t.id)));
    if (!selected.length) return;
    onQuiz({ subject: pw.subject, topics: selected, save: false, pathwayId: pw.id });
  }

  return (
    <div style={{ background:"rgba(218,238,250,0.12)", borderRadius:12, border:"1px solid rgba(126,173,216,0.2)", padding:"10px 14px", marginBottom:7 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <span style={{ fontFamily:FONT, fontWeight:700, fontSize:14, color:"#1a3a4f", flex:1 }}>{paper.name}</span>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {pw && (paper.topicIds||[]).length > 0 && (
            <button type="button" onClick={handleQuiz}
              style={{ padding:"5px 14px", borderRadius:10, background:"linear-gradient(135deg,#7eadd8,#5baed4)", border:"none", color:"white", fontFamily:FONT, fontWeight:700, fontSize:12, cursor:"pointer" }}>
              Quiz me
            </button>
          )}
          <button type="button" onClick={() => {
            setEditing(o => !o);
            if (!editing) { setSelSubject(pw ? pw.subject : ""); setSelTopics(paper.topicIds || []); }
          }}
            style={{ padding:"5px 11px", borderRadius:10, background: editing ? "rgba(91,174,212,0.12)" : "none", border:"1.5px solid rgba(126,173,216,0.3)", fontFamily:FONT, fontSize:12, fontWeight:600, color:"#5baed4", cursor:"pointer" }}>
            {editing ? "Cancel" : "Topics"}
          </button>
          <button type="button" onClick={() => onDelete(paper.id)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#c09090", fontSize:18, lineHeight:1, fontWeight:700, padding:"0 2px" }}>×</button>
        </div>
      </div>

      {!editing && pw && (
        <div style={{ marginTop:6 }}>
          <span style={{ fontFamily:FONT, fontSize:12, color:"#7ab3cc", fontWeight:600 }}>{pw.subject}</span>
          {linkedGroups.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
              {linkedGroups.map(g => (
                <span key={g.prefix} style={{ fontFamily:FONT, fontSize:11, fontWeight:600, color:"#5baed4", background:"rgba(91,174,212,0.1)", borderRadius:6, padding:"2px 8px", border:"1px solid rgba(91,174,212,0.2)" }}>
                  {g.prefix}. {g.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <div style={{ marginTop:10 }}>
          <label style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Subject</label>
          <select
            value={selSubject}
            onChange={e => onEditSubjectChange(e.target.value)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:10, border:"1.5px solid rgba(126,173,216,0.4)", fontFamily:FONT, fontSize:13, color: selSubject ? "#1a3a4f" : "#9ab3c8", marginBottom:8, background:"white", outline:"none" }}
          >
            <option value="">— Select a subject —</option>
            {UTC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {selSubject && !editPw && (
            <div style={{ background:"rgba(218,238,250,0.4)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:8 }}>
              <p style={{ fontFamily:FONT, fontSize:13, color:"#5a7a99", margin:0 }}>No pathway uploaded for <strong>{selSubject}</strong> yet.</p>
              <button type="button" onClick={() => onRequestUpload && onRequestUpload(selSubject)}
                style={{ padding:"6px 14px", borderRadius:10, background:"linear-gradient(135deg,#7eadd8,#5baed4)", border:"none", color:"white", fontFamily:FONT, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                Upload pathway
              </button>
            </div>
          )}

          {editPw && editGroups.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <label style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Topics</label>
              <div style={{ display:"flex", flexDirection:"column", gap:3, maxHeight:180, overflowY:"auto", border:"1px solid rgba(126,173,216,0.2)", borderRadius:10, padding:"6px 8px" }}>
                {editGroups.map(group => {
                  const gids = group.subtopics.map(t => String(t.id));
                  const allSel = gids.every(id => selTopics.includes(id));
                  return (
                    <label key={group.prefix} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 6px", borderRadius:8, background: allSel ? "rgba(91,174,212,0.1)" : "transparent" }}>
                      <input type="checkbox" checked={allSel} onChange={() => toggleEditGroup(group)} style={{ width:14, height:14, accentColor:"#5baed4", cursor:"pointer", flexShrink:0 }} />
                      <span style={{ fontFamily:FONT, fontSize:12, color:"#1a3a4f", fontWeight: allSel ? 700 : 400 }}>
                        <span style={{ color:"#7eadd8", marginRight:4 }}>{group.prefix}.</span>{group.title}
                      </span>
                    </label>
                  );
                })}
              </div>
              {selTopics.length > 0 && <p style={{ fontFamily:FONT, fontSize:11, color:"#5baed4", margin:"5px 0 0", fontWeight:600 }}>{selTopics.length} group{selTopics.length !== 1 ? "s" : ""} selected</p>}
            </div>
          )}

          <button type="button" onClick={saveLinks} disabled={saving || !editPw}
            style={{ padding:"7px 18px", borderRadius:10, background: editPw ? "linear-gradient(135deg,#7eadd8,#5baed4)" : "rgba(180,210,230,0.4)", border:"none", color:"white", fontFamily:FONT, fontWeight:700, fontSize:13, cursor: editPw ? "pointer" : "not-allowed" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ExamCard({ exam, onDelete, onPapersChange, highlight, pathways, onQuiz, onRequestUpload }) {
  const [addingPaper, setAddingPaper] = useState(false);
  const [paperName,   setPaperName]   = useState("");
  const [saving,      setSaving]      = useState(false);

  const pc      = PRIORITY_COLORS[exam.priority] || PRIORITY_COLORS.red;
  const today   = new Date(); today.setHours(0,0,0,0);
  const examDay = new Date(exam.examDate + "T00:00:00");
  const diff    = Math.round((examDay - today) / 86400000);

  async function submitPaper(e) {
    e.preventDefault();
    if (!paperName.trim() || saving) return;
    setSaving(true);
    try {
      const data = await callApi(`/api/exams/${exam.id}/papers`, { method:"POST", body:{ name: paperName.trim() } });
      if (data.ok) {
        onPapersChange(exam.id, [...exam.papers, { id: data.id, name: paperName.trim(), pathwayId: null, topicIds: [] }]);
        setPaperName(""); setAddingPaper(false);
      }
    } finally { setSaving(false); }
  }

  function handleDelPaper(pid)       { onPapersChange(exam.id, exam.papers.filter(p => p.id !== pid)); }
  function handleUpdPaper(pid, upd)  { onPapersChange(exam.id, exam.papers.map(p => p.id === pid ? { ...p, ...upd } : p)); }

  return (
    <div style={{ background:"white", borderRadius:18, border:"1.5px solid rgba(180,220,240,0.4)", boxShadow:"0 2px 12px rgba(91,174,212,0.07)", padding:"20px 22px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:14 }}>
        <div style={{ flex:1, minWidth:0 }}>
          {highlight && <p style={{ fontFamily:FONT, fontWeight:700, fontSize:11, color:pc.text, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 4px" }}>Next up</p>}
          <p style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:"#1a3a4f", margin:"0 0 6px", wordBreak:"break-word" }}>{exam.subject}</p>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:FONT, fontSize:13, color: diff < 0 ? "#b03030" : diff <= 7 ? "#a05f10" : "#7ab3cc", fontWeight: diff <= 7 ? 700 : 500 }}>
              📅 {fmtShortDate(exam.examDate)} · {fmtExamDate(exam.examDate)}
            </span>
          </div>
        </div>
        {/* Priority dot */}
        <span title={pc.label} style={{ width:12, height:12, borderRadius:"50%", background:pc.dot, flexShrink:0, alignSelf:"center", boxShadow:`0 0 0 2.5px ${pc.dot}33` }} />
        <button onClick={() => onDelete(exam.id)}
          style={{ background:"none", border:"1.5px solid rgba(220,100,100,0.25)", borderRadius:10, padding:"5px 10px", cursor:"pointer", fontFamily:FONT, fontSize:12, color:"#c06060", fontWeight:600, flexShrink:0 }}>
          Delete
        </button>
      </div>

      {exam.papers.length > 0 && (
        <div style={{ marginBottom:10 }}>
          {exam.papers.map(p => (
            <PaperRow
              key={p.id}
              paper={p}
              pathways={pathways}
              examId={exam.id}
              onDelete={handleDelPaper}
              onUpdate={handleUpdPaper}
              onQuiz={onQuiz}
              onRequestUpload={onRequestUpload}
            />
          ))}
        </div>
      )}

      {addingPaper ? (
        <form onSubmit={submitPaper} style={{ display:"flex", gap:8, marginTop:6 }}>
          <input autoFocus value={paperName} onChange={e => setPaperName(e.target.value)} placeholder="e.g. Paper 1, Calculator…"
            style={{ flex:1, padding:"8px 12px", borderRadius:10, border:"1.5px solid rgba(126,173,216,0.5)", fontFamily:FONT, fontSize:13, color:"#1a3a4f", outline:"none" }} />
          <button type="submit" disabled={saving}
            style={{ padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#7eadd8,#5baed4)", border:"none", color:"white", fontFamily:FONT, fontWeight:700, fontSize:13, cursor:"pointer" }}>Add</button>
          <button type="button" onClick={() => { setAddingPaper(false); setPaperName(""); }}
            style={{ padding:"8px 12px", borderRadius:10, background:"none", border:"1.5px solid rgba(180,220,240,0.5)", color:"#9ac0d8", fontFamily:FONT, fontSize:13, cursor:"pointer" }}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAddingPaper(true)}
          style={{ marginTop:4, background:"none", border:"1.5px dashed rgba(126,173,216,0.45)", borderRadius:10, padding:"6px 14px", cursor:"pointer", fontFamily:FONT, fontSize:13, color:"#7ab3cc", fontWeight:600 }}>
          + Add paper
        </button>
      )}
    </div>
  );
}

export function ExamsScreen({ pathways, onQuiz, onRequestUpload }) {
  const [exams,    setExams]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formError,setFormError]= useState("");
  const [form, setForm] = useState({ subject:"", examDate:"", priority:"red", papers:[] });

  const todayStr = new Date().toISOString().slice(0,10);

  useEffect(() => {
    callApi("/api/exams")
      .then(d => { setExams(d.exams || []); setLoading(false); })
      .catch(() => { setExams([]); setLoading(false); });
  }, []);

  function sortExams(list) {
    const order = { red:1, orange:2, yellow:3, green:4 };
    return [...list].sort((a,b) => {
      const pa = order[a.priority]??99, pb = order[b.priority]??99;
      if (pa !== pb) return pa - pb;
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    });
  }

  function addFormPaper() {
    setForm(f => ({ ...f, papers: [...f.papers, { tempId: Date.now(), name:"", pathwayId:null, topicIds:[] }] }));
  }
  function updateFormPaper(tempId, upd) {
    setForm(f => ({ ...f, papers: f.papers.map(p => p.tempId === tempId ? { ...p, ...upd } : p) }));
  }
  function removeFormPaper(tempId) {
    setForm(f => ({ ...f, papers: f.papers.filter(p => p.tempId !== tempId) }));
  }

  async function handleAddExam(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.examDate || saving) return;
    setFormError(""); setSaving(true);
    try {
      const data = await callApi("/api/exams", { method:"POST", body:{ subject: form.subject.trim(), examDate: form.examDate, priority: form.priority } });
      if (!data.ok) throw new Error("Failed");
      const newExam = { id: data.id, subject: form.subject.trim(), examDate: form.examDate, priority: form.priority, papers:[] };

      const savedPapers = [];
      for (const fp of form.papers.filter(p => p.name.trim())) {
        const pr = await callApi(`/api/exams/${data.id}/papers`, { method:"POST", body:{ name: fp.name.trim(), pathwayId: fp.pathwayId || null, topicIds: fp.topicIds || [] } });
        if (pr.ok) savedPapers.push({ id: pr.id, name: fp.name.trim(), pathwayId: fp.pathwayId || null, topicIds: fp.topicIds || [] });
      }
      newExam.papers = savedPapers;

      setExams(prev => sortExams([...(prev||[]), newExam]));
      setForm({ subject:"", examDate:"", priority:"red", papers:[] });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to add exam.");
    } finally { setSaving(false); }
  }

  async function handleDelete(examId) {
    await callApi(`/api/exams/${examId}`, { method:"DELETE" });
    setExams(prev => prev.filter(e => e.id !== examId));
  }

  function handlePapersChange(examId, newPapers) {
    setExams(prev => prev.map(e => e.id === examId ? { ...e, papers: newPapers } : e));
  }

  return (
    <div style={{ maxWidth:720, margin:"0 auto", padding:"36px 20px 80px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, gap:12 }}>
        <div>
          <h2 style={{ fontFamily:FONT, fontWeight:800, fontSize:26, color:"#1a3a4f", margin:"0 0 4px" }}>Exams</h2>
          <p style={{ fontFamily:FONT, fontSize:14, color:"#7ab3cc", margin:0 }}>Track upcoming exams by priority. Highest priority and closest date shows first.</p>
        </div>
        <button onClick={() => { setShowForm(o => !o); setFormError(""); }}
          style={{ padding:"10px 20px", borderRadius:14, background: showForm ? "rgba(91,174,212,0.1)" : "linear-gradient(135deg,#7eadd8,#5baed4)", border: showForm ? "1.5px solid rgba(91,174,212,0.3)" : "none", color: showForm ? "#5baed4" : "white", fontFamily:FONT, fontWeight:700, fontSize:14, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
          {showForm ? "Cancel" : "+ Add exam"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddExam} style={{ background:"white", borderRadius:18, border:"1.5px solid rgba(126,173,216,0.35)", padding:"22px 24px", marginBottom:24, boxShadow:"0 2px 16px rgba(91,174,212,0.08)" }}>
          <p style={{ fontFamily:FONT, fontWeight:800, fontSize:16, color:"#1a3a4f", margin:"0 0 18px" }}>New exam</p>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Subject</label>
              <select
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1.5px solid rgba(126,173,216,0.4)", fontFamily:FONT, fontSize:14, color: form.subject ? "#1a3a4f" : "#9ab3c8", boxSizing:"border-box", outline:"none", background:"white" }}
              >
                <option value="">— Select a subject —</option>
                {UTC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:160 }}>
                <DateField value={form.examDate} onChange={v => setForm(f => ({ ...f, examDate: v }))} minDate={todayStr} />
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <label style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Priority</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["red","orange","yellow","green"].map(p => {
                    const pc = PRIORITY_COLORS[p];
                    const sel = form.priority === p;
                    return (
                      <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                        style={{ flex:1, height:38, borderRadius:10, border: sel ? `2.5px solid ${pc.dot}` : "1.5px solid rgba(0,0,0,0.08)", background: sel ? pc.bg : "rgba(0,0,0,0.03)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                        title={pc.label}>
                        <span style={{ width:14, height:14, borderRadius:"50%", background:pc.dot, display:"block" }} />
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontFamily:FONT, fontSize:11, color:PRIORITY_COLORS[form.priority].text, margin:"5px 0 0", fontWeight:600 }}>{PRIORITY_COLORS[form.priority].label}</p>
              </div>
            </div>

            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <label style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:"#7ab3cc", textTransform:"uppercase", letterSpacing:"0.06em" }}>Papers</label>
                <button type="button" onClick={addFormPaper}
                  style={{ padding:"4px 12px", borderRadius:8, background:"rgba(218,238,250,0.6)", border:"1.5px solid rgba(126,173,216,0.35)", fontFamily:FONT, fontSize:12, fontWeight:700, color:"#5baed4", cursor:"pointer" }}>
                  + Add paper
                </button>
              </div>
              {form.papers.length > 0 ? (
                form.papers.map(p => (
                  <PaperBuilder
                    key={p.tempId}
                    paper={p}
                    pathways={pathways || []}
                    onChange={upd => updateFormPaper(p.tempId, upd)}
                    onRemove={() => removeFormPaper(p.tempId)}
                    onRequestUpload={onRequestUpload}
                  />
                ))
              ) : (
                <p style={{ fontFamily:FONT, fontSize:13, color:"#aac8d8", margin:0 }}>No papers yet — click "+ Add paper" above to add one.</p>
              )}
            </div>
          </div>

          {formError && <p style={{ fontFamily:FONT, fontSize:13, color:"#b03030", margin:"12px 0 0" }}>{formError}</p>}
          <div style={{ display:"flex", gap:10, marginTop:18 }}>
            <button type="submit" disabled={saving || !form.subject.trim() || !form.examDate}
              style={{ padding:"11px 24px", borderRadius:12, background:"linear-gradient(135deg,#7eadd8,#5baed4)", border:"none", color:"white", fontFamily:FONT, fontWeight:700, fontSize:14, cursor: (saving || !form.subject.trim() || !form.examDate) ? "not-allowed" : "pointer", opacity: (saving || !form.subject.trim() || !form.examDate) ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Add exam"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div style={{ display:"flex", gap:7, padding:"20px 0" }}>
          {[0,1,2].map(i => <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:"#7eadd8", animation:`pipBounce 0.9s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      )}

      {exams && exams.length === 0 && !showForm && (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <Pip size={70} />
          <p style={{ fontFamily:FONT, fontWeight:600, fontSize:15, color:"#7ab3cc", marginTop:16 }}>No exams added yet. Hit "+ Add exam" to get started.</p>
        </div>
      )}

      {exams && exams.map((exam, i) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          highlight={i === 0}
          onDelete={handleDelete}
          onPapersChange={handlePapersChange}
          pathways={pathways || []}
          onQuiz={onQuiz}
          onRequestUpload={onRequestUpload}
        />
      ))}
    </div>
  );
}
