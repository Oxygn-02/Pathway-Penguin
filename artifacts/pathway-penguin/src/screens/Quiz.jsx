import { useState, useRef, useEffect } from "react";
import { QuestionChart, QuestionGraph, TraceTable } from "../components/charts.jsx";
import { Pip, SpeechBubble } from "../components/common.jsx";
import { BoldText, MathAnswerInput, MathsKeyboard, QuestionText, renderRich } from "../components/math.jsx";
import { CONFIDENCE_LABELS, FONT, MATHS_SUBJ_RE } from "../constants.js";
import { callClaude, parseJSON } from "../lib/api.js";

/* ── Quiz screen ──────────────────────────────────────────────── */
export function QuizScreen({ topics, questions, pathwaySources = [], subject = "", pathwayNumber = null, onFinish, onAskPip, onExit, onIdxChange, onQuestionComplete, onResultsChange, onBackToTopics = null, initialIdx = 0, initialResults = {}, onScrollTop, onCompleteTopic }) {
  const PAGE_SIZE = 4;
  const [idx, setIdx] = useState(initialIdx);
  const [workings, setWorkings] = useState("");
  const [workingsFocused, setWorkingsFocused] = useState(false);
  // Extract labelled sub-parts from question text: (a)(i), (a)(ii), (b), 1., 2. etc.
  const getPartLabels = (q) => {
    if (Array.isArray(q?.partAnswers) && q.partAnswers.length > 0) {
      // partAnswers present — use them; labels are the part markers if detectable, else numbers
      const textLabels = [];
      const re = /(?:^|\n)\s*(\([a-z]+\)(?:\([ivxdcm]+\))?|\d+[.)]\s)/gi;
      let m;
      while ((m = re.exec(q.question ?? "")) !== null) textLabels.push(m[1].trim());
      if (textLabels.length === q.partAnswers.length) return textLabels;
      return q.partAnswers.map((_, i) => `${i + 1}.`);
    }
    // No partAnswers — scan question text for sub-part markers
    const re2 = /(?:^|\n)\s*(\([a-z]+\)(?:\([ivxdcm]+\))?)\s/gi;
    const found = [];
    let m2;
    while ((m2 = re2.exec(q?.question ?? "")) !== null) found.push(m2[1]);
    if (found.length > 1) return found;  // ≥2 explicit parts → one box each
    return null; // single answer box, no label needed
  };
  const answerCount = (q) => { const l = getPartLabels(q); return l ? l.length : 1; };
  const [answers, setAnswers] = useState(() => Array(answerCount(questions[initialIdx])).fill(""));
  const [traceData, setTraceData] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState(initialResults);
  const [error, setError] = useState("");
  const [latexWarning, setLatexWarning] = useState("");
  useEffect(() => { setLatexWarning(""); }, [answers, workings]);
  const [variant, setVariant] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [topicDone, setTopicDone] = useState(null);
  const [completingTopic, setCompletingTopic] = useState(false);
  const [hoveredTopicIdx, setHoveredTopicIdx] = useState(null);
  const [sourceExcerptModal, setSourceExcerptModal] = useState(null);
  const [topicPage, setTopicPage] = useState(() => {
    const currentTopicId = questions[initialIdx]?.topicId;
    const topicIdx = topics.findIndex((t) => t.id === currentTopicId);
    return topicIdx >= 0 ? Math.floor(topicIdx / PAGE_SIZE) : 0;
  });
  const answerRef = useRef(null);
  const answerRefs = useRef([]);
  const workingsRef = useRef(null);
  const perQCache = useRef({});
  useEffect(() => { onIdxChange?.(idx); }, [idx]);

  const base = questions[idx];
  const current = variant || base;
  const topic = topics.find((t) => t.id === base?.topicId);
  const isMathsSubject = MATHS_SUBJ_RE.test(subject);
  const total = questions.length;
  const hasTrace = !!current?.traceTable;

  // Fix progressive-loading answer-count: when a placeholder question finishes
  // loading, expand `answers` to match the actual number of parts (never shrink,
  // never clear boxes already typed into). Must be declared after `current`.
  useEffect(() => {
    if (current && !current.loading && !checked) {
      const needed = answerCount(current);
      setAnswers(prev => {
        if (prev.length >= needed) return prev;
        return [...prev, ...Array(needed - prev.length).fill("")];
      });
    }
  }, [current?.topicId, current?.loading]);

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
  "question": "variant question text with new values. IMPORTANT: Wrap key numbers, quantities, named substances, and critical terms in **bold** markers (e.g., **15 cm**, **sulfuric acid**). Only bold specific values and terms, not entire sentences.",
  "marks": 1,
  "partAnswers": null,
  "answer": "model answer for the new values",
  "steps": ["step 1", "step 2", "step 3"],
  "traceTable": null,
  "graph": null
}
CRITICAL — partAnswers rule: if the question has multiple labelled parts ((a), (b), (c) or 1., 2., 3.), partAnswers MUST be a non-null array with exactly one concise model answer per part, e.g. ["answer for (a)", "answer for (b)", "answer for (c)"]. Only set partAnswers: null for a single-part question. Keep marks equal to the number of parts.
MATHEMATICAL NOTATION: use $\frac{a}{b}$ for fractions, $\sqrt{x}$ for roots — wrap in $…$ delimiters. Use plain Unicode for simple symbols: x², π, ×, ≤, ≥. Do NOT use ASCII-art fractions.
If the original had a traceTable, produce a new one with completely different values and variable names. If the original had a graph, produce a new graph using the SAME schema and graphType, but with completely different numeric values and labels — same chart kind, fresh data.`,
        user: `Original question: ${base.question}\nOriginal answer: ${base.answer}\nTopic: ${topic?.description}\n${pathwayNumber ? `Student pathway: Pathway ${pathwayNumber} — keep the same difficulty level as the original (Pathway 1 = hardest, Pathway 4 = easiest).\n` : ""}Produce a variant. Every number, variable, substance, and named value MUST be different from the original — do not copy any specific values.`,
        max_tokens: 2500,
        model: "gemini",
        stage: "variant_generation",
      });
      const q = parseJSON(raw);
      // Inherit source attribution from the original question — the variant
      // is a re-roll of the same topic and is grounded in the same source(s).
      setVariant({ topicId: base.topicId, ...q, sourceIds: base.sourceIds });
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
    // Save current question's state to cache before navigating away
    perQCache.current[idx] = { answers: [...answers], workings, checked, feedback, showAnswer, variant };
    setTopicDone(null);
    setIdx(newIdx);
    // Restore cached state for the target question if available
    const cached = perQCache.current[newIdx];
    if (cached) {
      setAnswers(cached.answers);
      setWorkings(cached.workings);
      setChecked(cached.checked);
      setFeedback(cached.feedback);
      setShowAnswer(cached.showAnswer);
      setVariant(cached.variant ?? null);
      setRegenerating(false);
      setError("");
    } else {
      fullReset(answerCount(questions[newIdx]));
    }
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

  function validateLatex(text) {
    if (text == null) return true;
    const str = String(text);
    if (!/\$/.test(str)) return true;
    try {
      const dollarCount = (str.match(/(?<!\\)\$/g) || []).length;
      if (dollarCount % 2 !== 0) return false;
      const segments = str.split(/(?<!\\)\$/);
      for (let i = 1; i < segments.length; i += 2) {
        const latex = segments[i];
        let depth = 0;
        for (let j = 0; j < latex.length; j++) {
          if (latex[j] === "{" && latex[j - 1] !== "\\") depth++;
          else if (latex[j] === "}" && latex[j - 1] !== "\\") depth--;
          if (depth < 0) return false;
        }
        if (depth !== 0) return false;
      }
      return true;
    } catch { return true; }
  }

  async function submitAnswer() {
    const joinedAnswers = answers.length === 1
      ? answers[0]
      : answers.map((a, i) => `Part ${i + 1}: ${a}`).join("\n");
    const finalAnswer = hasTrace
      ? (traceData ? JSON.stringify(traceData) : "") + (joinedAnswers.trim() ? "\n" + joinedAnswers : "")
      : joinedAnswers;
    if (!finalAnswer.trim() || checking || checked) return;
    if (!validateLatex(finalAnswer) || !validateLatex(workings)) {
      setLatexWarning("Check your maths notation — it looks incomplete");
      return;
    }
    setLatexWarning("");
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
- LATEX NOTATION: the student's answer may contain LaTeX wrapped in $ signs (e.g. $\frac{1}{2}$, $\sqrt{3}$, $x^{2}$). Always interpret these as the mathematical value they represent before comparing to the model answer. $\frac{1}{2}$ means one-half, $\sqrt{4}$ means 2, and so on. Never penalise a student for using LaTeX notation.
- MATHEMATICAL EQUIVALENCE: always evaluate both the model answer and student answer numerically before comparing. Accept any form that evaluates to the same value — e.g. accept "36" when the answer is "6^2" or "6²", accept "0.5" when the answer is "1/2", accept "100" when the answer is "10^2", accept simplified or unsimplified fractions that are equal, accept correct units in any reasonable order. Do NOT penalise a student for writing the evaluated number instead of the expression, or vice versa.
- Be forgiving of minor formatting and spelling differences that don't change the meaning.`,
        user: `Question: ${current.question}\nMarks available: ${current.marks ?? 1}\n${current.partAnswers ? `Part answers: ${JSON.stringify(current.partAnswers)}` : `Correct answer: ${current.answer}`}\n${current.traceTable ? `Correct trace: ${JSON.stringify(current.traceTable.answer || [])}` : ""}${workings.trim() ? `\nStudent workings: ${workings}` : ""}\nStudent answer: ${finalAnswer}\n\nAward marks.`,
        max_tokens: 200,
        model: "gemini",
        stage: "answer_checking",
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
  useEffect(() => { setLatexWarning(""); }, [answers]);

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
          <button onClick={() => onExit(idx)}
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
        const uniqueTopics = topics.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
        const totalPages = Math.ceil(uniqueTopics.length / PAGE_SIZE);
        const pageTopics = uniqueTopics.slice(topicPage * PAGE_SIZE, topicPage * PAGE_SIZE + PAGE_SIZE);
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
          ) : base?.loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 140, gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #daeefa", borderTopColor: "#5baed4", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: FONT, fontSize: 14, color: "#7ab3cc", margin: 0 }}>Generating question for {topic?.id}…</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <span style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(126,173,216,0.12)", fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf" }}>{topic?.id} · {CONFIDENCE_LABELS[topic?.confidence] || ""}</span>
                {(() => {
                  // Source attribution tag: shows whether this question was
                  // grounded in one of the user's uploaded sources, or came
                  // from general GCSE knowledge. Hidden entirely for legacy
                  // questions cached before this field existed (sourceIds === undefined).
                  const sIds = current?.sourceIds;
                  if (!Array.isArray(sIds)) return null;
                  if (sIds.length === 0) {
                    const hasSources = pathwaySources && pathwaySources.length > 0;
                    return (
                      <>
                        <span title={hasSources
                            ? "This topic wasn't found in any of your uploaded sources, so the question was generated from general GCSE knowledge."
                            : "This question was generated from general GCSE knowledge. Upload a source to ground questions in your own paper."}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "rgba(154,192,216,0.18)", fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#5a90b0" }}>
                          General knowledge
                        </span>
                        <span style={{ fontFamily: FONT, fontSize: 11, color: "#7ab3cc", fontStyle: "italic" }}
                          title={hasSources
                            ? "None of your uploaded sources mention this topic. Add one to make questions paper-specific."
                            : "Upload a paper or notes to ground questions in your own material."}>
                          {hasSources
                            ? "· add a source for this topic to ground future questions"
                            : "· upload a source to ground questions in your own material"}
                        </span>
                      </>
                    );
                  }
                  // If sources haven't loaded yet (e.g. just resumed a quiz),
                  // skip rendering rather than showing a misleading
                  // "deleted source" badge. Once the fetch resolves,
                  // pathwaySources updates and the correct tag appears.
                  if (!pathwaySources || pathwaySources.length === 0) return null;
                  const names = sIds
                    .map((id) => pathwaySources.find((s) => s.id === id)?.name)
                    .filter(Boolean);
                  if (names.length === 0) {
                    return (
                      <span title="The source this question was generated from has been removed."
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "rgba(154,192,216,0.18)", fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#5a90b0", fontStyle: "italic" }}>
                        From: deleted source
                      </span>
                    );
                  }
                  const displayName = names.length === 1
                    ? names[0]
                    : `${names[0]} +${names.length - 1} more`;
                  return (
                    <button
                      onClick={() => {
                        const srcs = sIds.map((id) => pathwaySources.find((s) => s.id === id)).filter(Boolean);
                        if (srcs.length > 0) setSourceExcerptModal({ sources: srcs, excerpts: current?.sourceExcerpts || [] });
                      }}
                      title={`View source${names.length > 1 ? "s" : ""}: ${names.join(", ")}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "rgba(60,186,140,0.14)", border: "1.5px solid rgba(60,186,140,0.3)", fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#27826a", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>
                      📄 {displayName}
                    </button>
                  );
                })()}
              </div>
              <QuestionChart chartData={current.chartData ?? null} />
              <QuestionGraph graph={current.graph ?? null} />
              <QuestionText text={current.question} />
              {hasTrace && <TraceTable headers={current.traceTable.headers} initialRows={current.traceTable.rows} disabled={checked} onChange={setTraceData} />}

              {/* Workings box */}
              {!checked && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#9ac0d8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Workings</p>
                  {isMathsSubject ? (
                    <MathAnswerInput
                      value={workings}
                      onChange={setWorkings}
                      disabled={false}
                      placeholder="Show your working here…"
                      refCallback={(el) => { workingsRef.current = el; }}
                      borderColor="rgba(180,220,240,0.4)"
                      fontSize={13.5}
                      minHeight={64}
                      background="rgba(218,238,250,0.18)"
                    />
                  ) : (
                    <>
                      <textarea
                        ref={workingsRef}
                        value={workings}
                        onChange={(e) => setWorkings(e.target.value)}
                        onFocus={() => setWorkingsFocused(true)}
                        onBlur={() => setWorkingsFocused(false)}
                        placeholder="Show your working here…"
                        style={{ width: "100%", padding: "10px 13px", borderRadius: 12, border: "1.5px solid rgba(180,220,240,0.4)", fontFamily: FONT, fontSize: 13.5, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, minHeight: 64, transition: "border-color 0.2s", background: "rgba(218,238,250,0.18)" }}
                      />
                      {workingsFocused && workings && /\$/.test(workings) && (
                        <div style={{ marginTop: 6, padding: "7px 12px", background: "rgba(218,238,250,0.35)", borderRadius: 10, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize: 13.5, lineHeight: 1.7, color: "#1a3a4f", wordBreak: "break-word" }}>
                          <span style={{ display: "block", fontFamily: FONT, fontWeight: 700, fontSize: 10, color: "#7eadd8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Preview</span>
                          {renderRich(workings, "workingsprev")}
                        </div>
                      )}
                    </>
                  )}
                  {isMathsSubject && (
                    <MathsKeyboard
                      textareaRef={workingsRef}
                      value={workings}
                      onChange={setWorkings}
                    />
                  )}
                </div>
              )}

              {/* Per-part answer boxes */}
              {(!hasTrace || true) && (() => {
                const partLabels = getPartLabels(current);
                return (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {answers.map((a, i) => {
                      const label = partLabels ? partLabels[i] : null;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          {label && (
                            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#4a8cbf", minWidth: label.length > 3 ? 42 : 28, paddingTop: 13, flexShrink: 0 }}>{label}</span>
                          )}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            {isMathsSubject ? (
                              <MathAnswerInput
                                refCallback={(el) => { answerRefs.current[i] = el; if (i === 0) answerRef.current = el; }}
                                value={a}
                                onChange={(newVal) => { const next = [...answers]; next[i] = newVal; setAnswers(next); }}
                                disabled={checked}
                                placeholder={hasTrace && i === 0 ? "Add any written explanation here (optional)…" : label ? `Answer for ${label}…` : ""}
                                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey && canSubmit && !checked) submitAnswer(); }}
                                borderColor={answerBorderColor}
                              />
                            ) : (
                              <textarea
                                ref={(el) => { answerRefs.current[i] = el; if (i === 0) answerRef.current = el; }}
                                value={a}
                                onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }}
                                disabled={checked}
                                placeholder={hasTrace && i === 0 ? "Add any written explanation here (optional)…" : label ? `Answer for ${label}…` : ""}
                                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey && canSubmit && !checked) submitAnswer(); }}
                                style={{ width: "100%", padding: "10px 13px", borderRadius: 12, border: `1.5px solid ${answerBorderColor}`, fontFamily: FONT, fontSize: 14.5, color: "#1a3a4f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, minHeight: 52, transition: "border-color 0.2s" }}
                              />
                            )}
                            {!checked && isMathsSubject && (
                              <MathsKeyboard
                                textareaRef={{ current: answerRefs.current[i] }}
                                value={a}
                                onChange={(newVal) => { const next = [...answers]; next[i] = newVal; setAnswers(next); }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Feedback */}
              {checked && <SpeechBubble loading={checking} marksAwarded={fMarks} marksAvailable={fAvail} noWorkings={feedback?.noWorkings} feedback={feedback?.feedback} />}

              {/* Key Information — shown when wrong */}
              {isWrong && current.question && (() => {
                const bolded = (current.question.match(/\*\*([^\*]+)\*\*/g) || []).map((s) => s.slice(2, -2));
                if (!bolded.length) return null;
                return (
                  <div style={{ marginTop: 18, background: "rgba(240,180,30,0.07)", border: "1.5px solid rgba(240,180,30,0.25)", borderRadius: 16, padding: "14px 16px" }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#b8852c", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Information</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {bolded.map((b, i) => (
                        <span key={i} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#1a3a4f", background: "rgba(240,180,30,0.15)", borderRadius: 8, padding: "5px 10px", lineHeight: 1.4 }}>{b}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Correct answer reveal */}
              {showAnswer && (
                <div style={{ marginTop: 18, background: "rgba(91,174,212,0.05)", border: "1.5px solid rgba(91,174,212,0.2)", borderRadius: 16, padding: "14px 16px" }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: "#4a8cbf", margin: "0 0 7px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model Answer</p>
                  <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}><BoldText text={current.answer} /></p>
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
                        <p style={{ fontFamily: FONT, fontSize: 14, color: "#1a3a4f", margin: 0, lineHeight: 1.55, paddingTop: 3, whiteSpace: "pre-wrap" }}><BoldText text={step} /></p>
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

      {/* LaTeX validation warning */}
      {latexWarning && !checked && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingLeft: 40, paddingRight: 40 }}>
          <span style={{ fontSize: 15 }}>⚠️</span>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#b85c00", margin: 0, fontWeight: 600 }}>{latexWarning}</p>
        </div>
      )}

      {/* Action buttons — inset by arrow width so they align with the card edges */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", flexWrap: "wrap", marginTop: 14, paddingLeft: 40, paddingRight: 40 }}>
        {base?.loading ? null : !checked && !showAnswer ? (
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
      {sourceExcerptModal && (
        <SourceExcerptModal
          sources={sourceExcerptModal.sources}
          excerpts={sourceExcerptModal.excerpts}
          onClose={() => setSourceExcerptModal(null)}
        />
      )}
    </div>
  );
}

/* ── Source excerpt viewer (opened from quiz question badge) ───── */
export function SourceExcerptModal({ sources, excerpts, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const markRef = useRef(null);

  const activeSource = sources[activeIdx] ?? sources[0];
  const excerpt = excerpts.find((e) => e.id === activeSource?.id);
  const content = activeSource?.content || "";
  const hasExcerpt = excerpt && excerpt.end > excerpt.start;
  const start = hasExcerpt ? excerpt.start : 0;
  const end = hasExcerpt ? excerpt.end : 0;

  useEffect(() => {
    if (markRef.current) {
      markRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div onClick={handleBackdropClick}
      style={{ position: "fixed", inset: 0, background: "rgba(26,58,79,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1100 }}>
      <div style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 760, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(26,58,79,0.3)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(180,220,240,0.5)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: sources.length > 1 ? 12 : 0 }}>
            <div>
              <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: "#1a3a4f", margin: "0 0 4px", wordBreak: "break-word" }}>{activeSource?.name}</h3>
              {hasExcerpt ? (
                <p style={{ fontFamily: FONT, fontSize: 12, color: "#27826a", margin: 0, fontWeight: 600 }}>
                  The highlighted section was used to generate this question
                </p>
              ) : (
                <p style={{ fontFamily: FONT, fontSize: 12, color: "#7ab3cc", margin: 0 }}>
                  This source was referenced when generating this question
                </p>
              )}
            </div>
            <button onClick={onClose} title="Close"
              style={{ padding: "6px 12px", borderRadius: 10, background: "rgba(91,174,212,0.1)", border: "1.5px solid rgba(91,174,212,0.3)", color: "#5baed4", fontFamily: FONT, fontWeight: 700, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>
              ×
            </button>
          </div>
          {sources.length > 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {sources.map((s, i) => (
                <button key={s.id} onClick={() => setActiveIdx(i)}
                  style={{ padding: "4px 12px", borderRadius: 20, fontFamily: FONT, fontWeight: 700, fontSize: 11, cursor: "pointer", border: "1.5px solid",
                    background: i === activeIdx ? "rgba(60,186,140,0.14)" : "transparent",
                    borderColor: i === activeIdx ? "rgba(60,186,140,0.5)" : "rgba(180,220,240,0.5)",
                    color: i === activeIdx ? "#27826a" : "#7ab3cc" }}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "16px 24px", overflow: "auto", flex: 1, minHeight: 0 }}>
          <pre style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 13, lineHeight: 1.6, color: "#1a3a4f", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {hasExcerpt ? (
              <>
                {start > 0 && <span style={{ opacity: 0.38 }}>{content.slice(0, start)}</span>}
                <mark ref={markRef} style={{ background: "rgba(255,218,30,0.45)", color: "#1a3a4f", borderRadius: 3, padding: "1px 0", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{content.slice(start, end)}</mark>
                {end < content.length && <span style={{ opacity: 0.38 }}>{content.slice(end)}</span>}
              </>
            ) : content}
          </pre>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px 16px", borderTop: "1px solid rgba(180,220,240,0.5)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "9px 22px", borderRadius: 12, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Results screen ───────────────────────────────────────────── */
export function ResultsScreen({ subject, topics, score, total, results, onRetry, onReset }) {
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
