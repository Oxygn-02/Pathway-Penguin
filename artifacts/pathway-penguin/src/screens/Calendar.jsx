import { useState, useEffect } from "react";
import { DAYS, DURATIONS, FONT } from "../constants.js";
import { callApi } from "../lib/api.js";

/* ── Calendar entry card (hover-reveal delete) ────────────────── */
export function EntryCard({ entry, subjectColors, onRemove }) {
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
export function CalendarScreen({ user, onBack }) {
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
