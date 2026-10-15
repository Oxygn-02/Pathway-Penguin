import { useState, useRef, useEffect } from "react";
import { CompletionRing, Pip } from "../components/common.jsx";
import { FONT, KNOWN_SUBJECTS } from "../constants.js";
import { callApi } from "../lib/api.js";

/* ── Topic selection screen ───────────────────────────────────── */
export function deriveGroupTitle(descriptions) {
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

export function groupTopicsByPrefix(topics) {
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

export function TopicSelectScreen({ pathway, onStart, onBack, savedResume, onRegenerateTopic }) {
  const [topicResults, setTopicResults] = useState(null);
  const [regenPrefix, setRegenPrefix] = useState(null);

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

          const isRegen = regenPrefix === group.prefix;
          return (
            <div
              key={group.prefix}
              onClick={() => { if (!isRegen) onStart(group.subtopics, null); }}
              style={{ background: "white", border: `2px solid ${isResume ? "#5baed4" : "rgba(180,220,240,0.5)"}`, borderRadius: 18, padding: "16px 18px", cursor: isRegen ? "default" : "pointer", boxShadow: "0 2px 12px rgba(91,174,212,0.07)", transition: "border-color 0.15s, background 0.15s" }}
              onMouseEnter={(e) => { if (!isRegen) { e.currentTarget.style.borderColor = "#5baed4"; e.currentTarget.style.background = "rgba(91,174,212,0.04)"; } }}
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
                {/* Regenerate button */}
                {onRegenerateTopic && (
                  <button
                    title="Regenerate fresh board-aware question for this topic"
                    onClick={(e) => { e.stopPropagation(); if (!isRegen && !regenPrefix) { setRegenPrefix(group.prefix); onRegenerateTopic(group, () => setRegenPrefix(null)); } }}
                    style={{ flexShrink: 0, background: isRegen ? "rgba(126,173,216,0.15)" : "rgba(126,173,216,0.08)", border: "1px solid rgba(126,173,216,0.28)", borderRadius: 10, padding: "5px 10px", fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#4a8cbf", cursor: isRegen ? "default" : "pointer", opacity: isRegen ? 0.6 : 1, whiteSpace: "nowrap" }}
                  >{isRegen ? "↻ …" : "↻"}</button>
                )}
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

export function getResumeTopicInfo(pathway) {
  if (!pathway.resumeNumber || !Array.isArray(pathway.questions) || !pathway.questions.length) return null;
  const resumeQ = pathway.questions.find((q) => q.number === pathway.resumeNumber);
  if (!resumeQ) return null;
  const prefix = String(resumeQ.topicId).split(".")[0];
  const subtopics = pathway.topics.filter((t) => String(t.id).split(".")[0] === prefix);
  if (!subtopics.length) return null;
  const title = subtopics[0]?.parentTitle?.trim() || deriveGroupTitle(subtopics.map((t) => t.description).filter(Boolean)) || `Topic ${prefix}`;
  return { title, prefix, subtopics, resumeNumber: pathway.resumeNumber };
}

export function cleanSubjectName(raw) {
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  for (const s of KNOWN_SUBJECTS) {
    if (lower.includes(s.toLowerCase())) return s;
  }
  // Strip code-like tokens (e.g. ro47, ks4, 8463h) but keep the rest
  return raw.replace(/\b([a-z]{1,3}\d+[a-z\d]*|ks\d)\b/gi, "").replace(/\s{2,}/g, " ").trim() || raw;
}

export function PathwayDashboard({ pathways, onSelect, onAddNew, onDelete, savedSubject, onContinue, onContinueTopic, onRegenerate }) {
  const [confirmId, setConfirmId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [longPressId, setLongPressId] = useState(null);
  const [regenId, setRegenId] = useState(null);
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
              const isRegen = regenId === mostRecent.id;
              return (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {ri ? (
                    <span onClick={(e) => { e.stopPropagation(); onContinueTopic(mostRecent, ri); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>▶ {hasProgress ? "Continue" : "Begin"}: Topic {ri.prefix}</span>
                  ) : savedSubject === mostRecent.subject && hasProgress ? (
                    <span onClick={(e) => { e.stopPropagation(); onContinue(); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>▶ Continue</span>
                  ) : (
                    <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>Begin: Topic {firstPrefix}</span>
                  )}
                  {onRegenerate && (
                    <span onClick={(e) => { e.stopPropagation(); if (isRegen) return; setRegenId(mostRecent.id); onRegenerate(mostRecent, () => setRegenId(null)); }}
                      title="Clear cached questions and regenerate fresh board-aware questions"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: "rgba(126,173,216,0.12)", border: "1.5px solid rgba(126,173,216,0.35)", color: "#5a8fb5", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: isRegen ? "default" : "pointer", opacity: isRegen ? 0.6 : 1 }}>
                      {isRegen ? "↻ …" : "↻ Regenerate Qs"}
                    </span>
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
                  const isRegen = regenId === p.id;
                  return (
                    <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {ri ? (
                        <span onClick={(e) => { e.stopPropagation(); onContinueTopic(p, ri); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▶ {hasProgress ? "Continue" : "Begin"}: Topic {ri.prefix}</span>
                      ) : savedSubject === p.subject && hasProgress ? (
                        <span onClick={(e) => { e.stopPropagation(); onContinue(); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "linear-gradient(135deg,#3cba8c,#27a87a)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▶ Continue</span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "linear-gradient(135deg,#7eadd8,#5baed4)", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>Begin: Topic {firstPrefix}</span>
                      )}
                      {onRegenerate && (
                        <span onClick={(e) => { e.stopPropagation(); if (isRegen) return; setRegenId(p.id); onRegenerate(p, () => setRegenId(null)); }}
                          title="Clear cached questions and regenerate fresh board-aware questions"
                          style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "4px 10px", borderRadius: 20, background: "rgba(126,173,216,0.12)", border: "1.5px solid rgba(126,173,216,0.35)", color: "#5a8fb5", fontFamily: FONT, fontWeight: 700, fontSize: 11, cursor: isRegen ? "default" : "pointer", opacity: isRegen ? 0.6 : 1 }}>
                          {isRegen ? "↻ …" : "↻ Regenerate Qs"}
                        </span>
                      )}
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
export function BestTopicsAccordion({ subjectName, subAccordionStyle, subHeaderStyle }) {
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
export function SubjectRow({ subjectName, pathways, onQuiz }) {
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
      pathwayNumber: pathway?.pathwayNumber ?? null,
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
                      const ids = s.topicIds || [];
                      const MAX_SHOW = 4;
                      const shown = ids.slice(0, MAX_SHOW);
                      const extra = ids.length - MAX_SHOW;
                      const summary = shown.join(" · ") + (extra > 0 ? ` +${extra}` : "");
                      return (
                        <div key={s.sessionId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: bg, borderRadius: 10, padding: "9px 13px", gap: 10 }}>
                          <p style={{ fontFamily: FONT, fontSize: 12, color: "#4a6a80", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {summary || "—"}
                          </p>
                          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: colour, margin: 0, flexShrink: 0 }}>{s.correct}/{s.total} ({pct}%)</p>
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
export function SuggestionsScreen({ pathways, onQuiz }) {
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
      pathwayNumber: pathway?.pathwayNumber ?? null,
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

export function SubjectsScreen({ pathways, onQuiz }) {
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
