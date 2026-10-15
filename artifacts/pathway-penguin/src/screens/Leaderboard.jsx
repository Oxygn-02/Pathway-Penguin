import { useState, useEffect } from "react";
import { AVATARS, FONT, MEDAL, RANKS } from "../constants.js";
import { callApi } from "../lib/api.js";

export function getRank(pts) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].min) return { ...RANKS[i], rankIdx: i };
  }
  return { ...RANKS[0], rankIdx: 0 };
}

export function UserProfilePage({ entry, currentUserId, onBack }) {
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
              {isPast && <span style={{ fontSize: 13 }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeaderboardScreen({ currentUserId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  function fetchLeaderboard() {
    return callApi("/api/leaderboard")
      .then((data) => { setEntries(data.leaderboard || []); setLoading(false); })
      .catch((e) => { setError(e.message || "Failed to load."); setLoading(false); });
  }

  useEffect(() => {
    // Small delay on mount so any in-flight question submissions finish first
    const initial = setTimeout(fetchLeaderboard, 400);
    // Re-fetch every 15 seconds so points update while viewing
    const poll = setInterval(fetchLeaderboard, 15000);
    return () => { clearTimeout(initial); clearInterval(poll); };
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
