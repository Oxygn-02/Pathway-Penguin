import "katex/dist/katex.min.css";
import { useState, useRef, useEffect } from "react";
import {
  Line,
} from "recharts";
import { LoadingScreen, Pip, PipChat, TopBar } from "./components/common.jsx";
import { CONFIDENCE_LABELS, FONT } from "./constants.js";
import { batchedMap, callApi, callClaude, parseJSON } from "./lib/api.js";
import { sourceContextSection } from "./lib/sources.js";
import { AccountScreen, AdminPage } from "./screens/Account.jsx";
import { ForgotScreen, LoginScreen, ResetScreen, SignupScreen } from "./screens/Auth.jsx";
import { CalendarScreen } from "./screens/Calendar.jsx";
import { ExamsScreen } from "./screens/Exams.jsx";
import { LeaderboardScreen } from "./screens/Leaderboard.jsx";
import { PathwayDashboard, SubjectsScreen, SuggestionsScreen, TopicSelectScreen } from "./screens/Pathways.jsx";
import { QuizScreen, ResultsScreen } from "./screens/Quiz.jsx";
import { SourcesScreen } from "./screens/Sources.jsx";
import { UploadScreen } from "./screens/Upload.jsx";

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
  const [currentQuizChecked, setCurrentQuizChecked] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [initialQuizResults, setInitialQuizResults] = useState({});
  const currentPathwayIdRef = useRef(null);
  const cachedQuestionsRef = useRef(null);
  const examBoardRef = useRef(null);
  const pathwaySourcesRef = useRef([]);
  const [pathwaySourcesState, setPathwaySourcesState] = useState([]);
  const quizScrollRef = useRef(null);
  const remainingQuestionsRef = useRef([]);
  const currentQuizResultsRef = useRef({});
  const quizSessionIdRef = useRef(null);
  const savedResultTopicsRef = useRef(new Set());
  const questionsRef = useRef([]);
  const resumeSaveTimerRef = useRef(null);
  const [pendingPathway, setPendingPathway] = useState(null);
  const [sourceQuizState, setSourceQuizState] = useState(null);
  const [sourceQuizResults, setSourceQuizResults] = useState(null);
  const [savedQuiz, setSavedQuiz] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pp_quiz") || "null"); } catch { return null; }
  });

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
    localStorage.removeItem("pp_quiz"); setSavedQuiz(null);
    setPendingPathway(null);
    setStage("login");
  }

  function saveQuizSession(resumeIdx) {
    const qs = questionsRef.current;
    if (qs.length > 0) {
      const baseIdx = resumeIdx !== undefined ? resumeIdx : currentQuizIdx;
      const currentResults = currentQuizResultsRef.current;
      // Advance past already-answered questions so "Continue" always lands on the
      // first question the student hasn't dealt with yet (handles the interstitial case
      // where currentQuizIdx still points at the just-answered question).
      let effectiveIdx = baseIdx;
      while (effectiveIdx < qs.length - 1 && currentResults[qs[effectiveIdx]?.topicId] != null) {
        effectiveIdx++;
      }
      const resumeNumber = qs[effectiveIdx]?.number ?? (effectiveIdx + 1);
      const session = { subject, topics, questions: qs, idx: effectiveIdx, resumeNumber, results: currentResults };
      localStorage.setItem("pp_quiz", JSON.stringify(session));
      setSavedQuiz(session);
      // Immediately stamp the DB (cancel any pending debounce) so the resume position
      // is always correct when the user returns — even from the topic-done interstitial.
      const pid = currentPathwayIdRef.current;
      if (pid && resumeNumber != null) {
        if (resumeSaveTimerRef.current) clearTimeout(resumeSaveTimerRef.current);
        callApi(`/api/pathways/${pid}/resume`, { method: "PATCH", body: { resumeNumber } }).catch(() => {});
      }
    }
  }

  function reset() {
    setStage("home"); setSubject(""); setTopics([]); setQuestions([]);
    setLoadProgress(0); setQuizResults(null); setLoadError(""); setPipOpen(false);
    setCurrentQuizIdx(0); setInitialQuizResults({});
    currentQuizResultsRef.current = {};
  }

  function handleExit(resumeIdx) {
    saveQuizSession(resumeIdx);
    reset();
  }

  function handleBackToTopics(resumeIdx) {
    const qs = questionsRef.current;
    // Calculate effective resume idx (same logic as saveQuizSession)
    const currentResults = currentQuizResultsRef.current;
    let effectiveIdx = resumeIdx !== undefined ? resumeIdx : currentQuizIdx;
    while (effectiveIdx < qs.length - 1 && currentResults[qs[effectiveIdx]?.topicId] != null) {
      effectiveIdx++;
    }
    const newResumeNumber = qs[effectiveIdx]?.number ?? (effectiveIdx + 1);
    saveQuizSession(resumeIdx);
    // Update pendingPathway so topicSelect immediately sees the correct resume position
    // AND the correct questions list (so resumePrefix look-up works on the topic cards)
    if (pendingPathway) {
      setPendingPathway((prev) => prev ? { ...prev, resumeNumber: newResumeNumber, questions: qs.length ? qs : prev.questions } : prev);
    }
    setStage("topicSelect");
    setSubject(""); setTopics([]); setQuestions([]);
    setCurrentQuizIdx(0); setInitialQuizResults({});
    currentQuizResultsRef.current = {};
  }

  function handleContinueTopic(pathway, resumeInfo) {
    const { subtopics, resumeNumber } = resumeInfo;
    const selectedIds = new Set(subtopics.map((t) => t.id));
    const filteredCached = Array.isArray(pathway.questions)
      ? pathway.questions.filter((q) => selectedIds.has(q.topicId))
      : null;
    setPendingPathway(pathway);
    handleTopicsReady({
      subject: pathway.subject,
      topics: subtopics,
      save: false,
      pathwayId: pathway.id,
      cachedQuestions: filteredCached && filteredCached.length > 0 ? filteredCached : null,
      resumeNumber,
      examBoard: pathway.examBoard ?? null,
      pathwayNumber: pathway.pathwayNumber ?? null,
    });
  }

  // Called by QuizScreen on every question navigation — debounces a DB write so
  // the server always knows the last-seen position even if the user force-closes.
  function handleIdxChange(newIdx) {
    setCurrentQuizIdx(newIdx);
    const pid = currentPathwayIdRef.current;
    const qNum = questionsRef.current[newIdx]?.number;
    if (!pid || qNum == null) return;
    // Keep local pathways state in sync immediately so handleContinueQuiz
    // always reads the current position, not the stale value from page-load.
    setPathways((prev) => prev.map((p) => p.id === pid ? { ...p, resumeNumber: qNum } : p));
    if (resumeSaveTimerRef.current) clearTimeout(resumeSaveTimerRef.current);
    resumeSaveTimerRef.current = setTimeout(() => {
      callApi(`/api/pathways/${pid}/resume`, { method: "PATCH", body: { resumeNumber: qNum } }).catch(() => {});
    }, 600);
  }

  function handleContinueQuiz() {
    if (!savedQuiz) return;
    const matchingPathway = pathways.find((p) => p.subject === savedQuiz.subject);
    // If the matching pathway's cached questions were cleared on the server
    // (which happens when sources are added or removed), the saved local
    // session is stale. Drop it and regenerate a fresh, source-grounded quiz.
    if (matchingPathway && matchingPathway.questions == null && Array.isArray(matchingPathway.topics)) {
      localStorage.removeItem("pp_quiz");
      setSavedQuiz(null);
      handleTopicsReady({
        subject: matchingPathway.subject,
        topics: matchingPathway.topics,
        save: false,
        pathwayId: matchingPathway.id,
        cachedQuestions: null,
        examBoard: matchingPathway.examBoard ?? null,
        pathwayNumber: matchingPathway.pathwayNumber ?? null,
      });
      return;
    }
    const restoredResults = savedQuiz.results ?? {};
    // Stamp numbers onto restored questions if missing (old sessions)
    const qs = (savedQuiz.questions ?? []).map((q, i) => (q.number != null ? q : { ...q, number: i + 1 }));
    let resumeIdx = 0;
    // Primary: DB-stored resume_number (updated on every navigation — most reliable)
    const dbResumeNumber = matchingPathway?.resumeNumber ?? null;
    if (dbResumeNumber != null) {
      const byNum = qs.findIndex((q) => q.number === dbResumeNumber);
      resumeIdx = byNum >= 0 ? byNum : 0;
    } else if (savedQuiz.resumeNumber != null) {
      // Fallback: localStorage resume number
      const byNum = qs.findIndex((q) => q.number === savedQuiz.resumeNumber);
      resumeIdx = byNum >= 0 ? byNum : savedQuiz.idx ?? 0;
    } else if (savedQuiz.idx != null && savedQuiz.idx > 0) {
      resumeIdx = savedQuiz.idx;
    } else if (Object.keys(restoredResults).length > 0) {
      const first = qs.findIndex((q) => !restoredResults[q.topicId]);
      resumeIdx = first > 0 ? first : 0;
    }
    currentQuizResultsRef.current = restoredResults;
    setSubject(savedQuiz.subject);
    setTopics(savedQuiz.topics);
    questionsRef.current = qs;
    setQuestions(qs);
    remainingQuestionsRef.current = [...qs];
    setCurrentQuizIdx(resumeIdx);
    setInitialQuizResults(restoredResults);
    // Track the resumed pathway so source-attribution name lookups work in the
    // quiz card. Sources for that pathway are loaded asynchronously below.
    currentPathwayIdRef.current = matchingPathway?.id ?? null;
    examBoardRef.current = matchingPathway?.examBoard ?? null;
    if (matchingPathway?.id) {
      callApi(`/api/sources?pathwayId=${matchingPathway.id}`)
        .then((r) => {
          const list = Array.isArray(r?.sources) ? r.sources : [];
          pathwaySourcesRef.current = list;
          setPathwaySourcesState(list);
        })
        .catch(() => {});
    } else {
      pathwaySourcesRef.current = [];
      setPathwaySourcesState([]);
    }
    setStage("quiz");
  }

  function buildQuestionSystem(examBoard, subject, pathwayNumber, hasSources = false) {
    const sourcesPreamble = hasSources
      ? `IMPORTANT — SOURCE-GROUNDED MODE:
Some user messages will include a SOURCE MATERIAL section containing past paper extracts or revision content the student has uploaded. When that section is present, you MUST base the question ONLY on facts, scenarios, data, definitions, and concepts explicitly contained in the source material. Do not introduce facts, numbers, names, or scenarios that are not grounded in the source. You may rephrase, swap values, or change the surrounding scenario to avoid copying verbatim, but the underlying content must come from the source. If the user message does NOT contain a SOURCE MATERIAL section for a particular topic, generate the question from your general GCSE knowledge as normal.

`
      : "";
    const boardInstructions = examBoard
      ? `The student's exam board is ${examBoard}. You must mirror the real question style that ${examBoard} uses for GCSE ${subject || "this subject"} in their past papers:
- Recall the typical question structure ${examBoard} uses for this topic and replicate it with different values, data, or scenarios substituted in (do NOT copy verbatim).
- Use ${examBoard}'s exact command words (e.g. AQA favours "Describe and explain…", "Give one reason why…", "Evaluate…", "Calculate…"; OCR favours "State one reason…", "Explain how…", "Show that…", "Analyse…").
- Follow ${examBoard}'s mark scheme conventions — e.g. AQA often uses point-based marking with bullet points; OCR uses structured sub-part marks with numbered steps.
- Mirror ${examBoard}'s typical sub-part lettering (e.g. (a)(i), (a)(ii), (b)) when the question has multiple parts.
- The question must feel authentic to a ${examBoard} GCSE ${subject || "exam"} past paper.`
      : `Write a standard GCSE exam-style question for this topic.`;

    return `${sourcesPreamble}You are generating legitimate educational content: a GCSE exam question for a student preparing for UK GCSE exams. This is standard academic revision material from UK high school curricula (Biology, Chemistry, Physics, etc.).

IMPORTANT: Some topics may involve sensitive terms (e.g., biological reproduction, chemical synthesis, disease mechanisms, etc.). These terms are educationally necessary and scientifically appropriate. Generate the question with correct terminology and educational framing — use neutral, clinical language appropriate for a high school textbook. Do not avoid accurate scientific or medical terminology when it is essential to the topic.

${boardInstructions}
Return ONLY valid JSON with no markdown:
{
  "question": "The full question text. If multiple parts, write as:\\n1. first part\\n2. second part\\n3. third part. If the question contains any code (Python, pseudocode, SQL, etc.) place it in a fenced code block using triple backticks with the language name, e.g. \`\`\`python\\nx = 5\\n\`\`\`. Keep prose and code clearly separated. IMPORTANT: Wrap key information in **bold** markers (e.g., **12 cm**, **sodium hydroxide**, **angle ABC = 60°**). Bold every number, quantity, named substance, variable, critical condition, and key term that the student must use to answer the question. Do NOT bold entire sentences — only the specific values and terms.",
  "marks": 1,
  "partAnswers": null,
  "answer": "full model answer",
  "steps": ["step 1 sentence", "step 2 sentence", "step 3 sentence"],
  "traceTable": null,
  "graph": null
}
- marks: total marks available. For a single-part question set marks: 1 and partAnswers: null. For a multi-part question set marks equal to the number of parts and partAnswers to an array of concise answers, one per part e.g. ["answer to part 1", "answer to part 2"].
If a question requires a graph (e.g. plotting points, reading charts, interpreting data, distance-time, speed-time, scatter diagram, frequency histogram, pie chart, or a "join the points" / dot-to-dot exercise), include a "graph" field in your JSON output with this exact shape:
{
  "graph": {
    "graphType": "scatter" | "bar" | "line" | "pie" | "dot-to-dot" | "none",
    "connect": true | false,
    "title": "string",
    "xLabel": "string",
    "yLabel": "string",
    "points":   [{"x": number, "y": number}],
    "bars":     [{"label": "string", "value": number}],
    "segments": [{"label": "string", "value": number}]
  }
}
Use only the fields that apply to the chosen graphType: scatter / line / dot-to-dot use "points"; bar uses "bars"; pie uses "segments". Set "connect": true for line and dot-to-dot graphs; false for scatter and bar; ignored for pie. If no graph is needed, set "graphType": "none" or set the whole "graph" field to null. Do NOT include a graph for questions that can be answered without a visual.
If the topic is a Computer Science trace/dry-run exercise, replace traceTable with:
{
  "headers": ["Variable / Line", "step1", "step2", "step3"],
  "rows": [["x", "", "", ""], ["y", "", "", ""]],
  "answer": [["x", "0", "3", "5"], ["y", "2", "4", "4"]]
}
Otherwise traceTable must be null. Max 4 steps, each one short plain sentence.

MATHEMATICAL NOTATION — use the following rules consistently in the question, answer, and steps fields:

For fractions, nested roots, and complex expressions use LaTeX inside $…$ delimiters (inline) or $$…$$ delimiters (display/block):
- Fractions: $\frac{a}{b}$  e.g. $\frac{285}{\pi}$, $\frac{x+1}{2}$
- Mixed numbers: $2\frac{1}{3}$
- Square roots: $\sqrt{x}$
- nth roots: $\sqrt[3]{x}$
- Display fraction (standalone, centred): $$\frac{a}{b}$$
- Subscript/superscript in expressions: $x_{1}$, $a^{n}$

For simple symbols write them as plain Unicode (no $…$ needed):
- Powers: x², x³, xⁿ
- Greek letters: π, θ, α, β, λ
- Basic operators: ×, ÷, ±, ≤, ≥, ≠, ≈, √ (only when not inside a fraction)
- Subscripts: x₁, y₂, aₙ
- Standard form: 3.2 × 10⁵
- Inequalities: x < y, x ≥ y
- Probability: P(A), P(A ∩ B), P(A ∪ B)
- Recurring decimals: 0.3̅, 0.12̅
- Absolute value: |x|
- Ratios: x : y
- Coordinates: (x, y)

Use $…$ any time a fraction, nested expression, or LaTeX symbol would be ambiguous as plain text. Do NOT use HTML tags or markdown math fences.

Difficulty rules based on the student's confidence rating for this topic:
- Rating 1 (Refresher / high confidence): HARDEST — challenging multi-step question requiring analysis, evaluation or extended application; 4–6 marks; test deep understanding and expect the student to synthesise ideas.
- Rating 2 (Consolidate): MODERATELY HARD — multi-part question requiring explanation and application; 3–4 marks; standard A/A* exam style.
- Rating 3 (Needs Help): MODERATE — straightforward exam-style question testing understanding; 2–3 marks; clear and accessible.
- Rating 4 (New Topic / no rating / null): EASIEST — simple recall or definition question; 1–2 marks; foundational knowledge only.

Pathway difficulty override (the student's overall pathway level also influences difficulty):
- Pathway 1 (Advanced): ALWAYS HARDEST regardless of confidence rating. Generate A/A* exam questions that require deep analysis, evaluation, and multi-step reasoning.
- Pathway 2: Bias toward harder questions. Use confidence rating but shift difficulty up by one level (e.g. Rating 3 becomes Rating 2 difficulty).
- Pathway 3 (Standard): Follow the confidence rating rules exactly as written above.
- Pathway 4 (Needs Support): ALWAYS EASIEST regardless of confidence rating. Generate foundational questions only — simple recall, single-step calculations, and basic definitions.

${pathwayNumber ? `This student is on Pathway ${pathwayNumber}. Apply the pathway difficulty override above.` : "No pathway number detected. Use confidence rating rules only."}
Always match question difficulty and marks to the appropriate rating/pathway level above.`;
  }

  async function handleTopicsReady({ subject: sub, topics: rawTops, save = true, pathwayId = null, cachedQuestions = null, resumeNumber = null, examBoard = null, pathwayNumber = null }) {
    // Deduplicate topics by id — Claude occasionally emits the same id twice which
    // causes two questions with identical topicId and double-highlighted dots.
    const seenIds = new Set();
    const tops = rawTops.filter((t) => { if (seenIds.has(t.id)) return false; seenIds.add(t.id); return true; });
    setSubject(sub); setTopics(tops); setStage("loading"); setLoadProgress(0); setLoadError(""); setCurrentQuizIdx(0);
    currentPathwayIdRef.current = pathwayId;
    cachedQuestionsRef.current = cachedQuestions;
    examBoardRef.current = examBoard;
    // Fresh session ID for this quiz run — used to save per-question results immediately
    quizSessionIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    savedResultTopicsRef.current = new Set();

    // Save pathway to backend and refresh list (only for new uploads)
    let resolvedPathwayId = pathwayId;
    if (user && save) {
      try {
        const saved = await callApi("/api/pathways", { method: "POST", body: { subject: sub, topics: tops, pathwayNumber } });
        resolvedPathwayId = saved.id ?? null;
        currentPathwayIdRef.current = resolvedPathwayId;
        loadPathways();
      } catch {}
    }

    // Helper: ensure every question has an immutable sequence number
    const stampNumbers = (arr) => arr.map((q, i) => (q.number != null ? q : { ...q, number: i + 1 }));

    // Fetch sources attached to this pathway up front. If any exist, the cached
    // question set may be stale (generated before sources were attached/changed),
    // so we ignore cache and regenerate so the quiz reflects the current sources.
    let pathwaySources = [];
    if (resolvedPathwayId) {
      try {
        const r = await callApi(`/api/sources?pathwayId=${resolvedPathwayId}`);
        pathwaySources = Array.isArray(r.sources) ? r.sources : [];
      } catch {}
    }
    pathwaySourcesRef.current = pathwaySources;
    setPathwaySourcesState(pathwaySources);

    // If we already have cached questions for this pathway AND no sources are
    // attached, use the cache directly. With sources attached, always regenerate
    // so questions are grounded in the latest source material.
    if (pathwaySources.length === 0 && Array.isArray(cachedQuestions) && cachedQuestions.length > 0) {
      // Prefer the full question list from localStorage (includes already-answered Qs)
      const lsQuiz = (() => { try { return JSON.parse(localStorage.getItem("pp_quiz") || "null"); } catch { return null; } })();
      const fullQs = (lsQuiz?.subject === sub && Array.isArray(lsQuiz.questions) && lsQuiz.questions.length >= cachedQuestions.length)
        ? stampNumbers(lsQuiz.questions)
        : stampNumbers(cachedQuestions);
      const restoredResults = (lsQuiz?.subject === sub) ? (lsQuiz.results ?? {}) : {};
      // Determine resume position: DB resumeNumber (most reliable) → localStorage → start
      let resumeIdx = 0;
      if (resumeNumber != null) {
        const byNum = fullQs.findIndex((q) => q.number === resumeNumber);
        resumeIdx = byNum >= 0 ? byNum : 0;
      } else if (lsQuiz?.subject === sub && lsQuiz?.resumeNumber != null) {
        const byNum = fullQs.findIndex((q) => q.number === lsQuiz.resumeNumber);
        resumeIdx = byNum >= 0 ? byNum : 0;
      }
      setLoadProgress(tops.length);
      questionsRef.current = fullQs;
      setQuestions(fullQs);
      remainingQuestionsRef.current = [...fullQs];
      setInitialQuizResults(restoredResults);
      currentQuizResultsRef.current = restoredResults;
      setCurrentQuizIdx(resumeIdx);
      setStage("quiz");
      return;
    }

    const QUESTION_SYSTEM = buildQuestionSystem(examBoard, sub, pathwayNumber, pathwaySources.length > 0);

    // Progressive loading: start quiz immediately with placeholder questions so
    // students can begin answering as soon as the first questions arrive.
    const placeholders = tops.map((topic, i) => ({ topicId: topic.id, loading: true, number: i + 1 }));
    const finalQs = [...placeholders];
    questionsRef.current = placeholders;
    setQuestions(placeholders);
    setStage("quiz");

    let done = 0;
    const CHUNK = 6;
    try {
      for (let i = 0; i < tops.length; i += CHUNK) {
        const chunk = tops.slice(i, i + CHUNK);
        await Promise.all(chunk.map(async (topic, ci) => {
          const topicIdx = i + ci;
          try {
            const confLabel = topic.confidence != null ? `${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]})` : "null (no rating — treat as Rating 4, easiest)";
            const boardLine = examBoard ? `\nExam board: ${examBoard}` : "";
            const { text: sourceLine, sourceIds, excerpts: sourceExcerpts } = sourceContextSection(topic, pathwaySources);
            const topicBase = `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${confLabel}${boardLine}`;
            let raw = await callClaude({ system: QUESTION_SYSTEM, user: `${topicBase}${sourceLine}`, max_tokens: 2500, model: "gemini", stage: "question_generation" });
            let q;
            try {
              q = parseJSON(raw);
            } catch {
              if (sourceLine) {
                raw = await callClaude({ system: buildQuestionSystem(examBoard, sub, pathwayNumber, false), user: topicBase, max_tokens: 2500, model: "gemini", stage: "question_generation" });
                q = parseJSON(raw);
              } else {
                throw new Error("Question generation failed");
              }
            }
            finalQs[topicIdx] = { topicId: topic.id, ...q, number: topicIdx + 1, sourceIds, sourceExcerpts };
          } catch {
            finalQs[topicIdx] = { topicId: topic.id, loading: false, failed: true, question: "Could not generate this question. Please regenerate.", marks: 1, answer: "", steps: [], partAnswers: null, number: topicIdx + 1 };
          }
          done++; setLoadProgress(done);
          questionsRef.current = [...finalQs];
          setQuestions([...finalQs]);
        }));
      }

      remainingQuestionsRef.current = [...finalQs];
      // Cache the generated questions for this pathway in the DB
      if (resolvedPathwayId) {
        const cacheable = finalQs.filter((q) => !q.loading && !q.failed);
        if (cacheable.length > 0) {
          callApi(`/api/pathways/${resolvedPathwayId}/questions`, { method: "PATCH", body: { questions: cacheable } })
            .then(() => loadPathways())
            .catch(() => {});
        }
      }
    } catch (e) {
      const errMsg = e.message || "Failed to generate questions. Please check your connection and try again.";
      const isContentFilter = errMsg.includes("content filtering") || errMsg.includes("invalid_request_error");
      const errorToShow = isContentFilter
        ? "One or more topics couldn't be processed (content policy). Please review your topic descriptions and try again."
        : errMsg;

      // Fall back to DB-cached questions if available
      if (Array.isArray(cachedQuestionsRef.current) && cachedQuestionsRef.current.length > 0) {
        const numbered = stampNumbers(cachedQuestionsRef.current);
        setLoadProgress(tops.length);
        questionsRef.current = numbered;
        setQuestions(numbered);
        remainingQuestionsRef.current = [...numbered];
      } else {
        setLoadError(errorToShow);
        setStage("loading");
      }
    }
  }

  // Called by QuizScreen when user clicks "Mark Topic as Mastered"
  async function handleCompleteTopic(prefix) {
    const pid = currentPathwayIdRef.current;
    if (!pid) return;
    await callApi(`/api/pathways/${pid}/complete-topic`, { method: "PATCH", body: { prefix } }).catch(() => {});
    // Remove completed topic's questions from local cache so future sessions regenerate them
    const pruned = questionsRef.current.filter((q) => {
      const qPrefix = q.topicId ? String(q.topicId).split(".")[0] : null;
      return qPrefix !== prefix;
    });
    questionsRef.current = pruned;
    loadPathways();
  }

  // Called by QuizScreen each time a question is answered.
  // variantQuestion is non-null when the student used "Try again" and answered the variant.
  function handleQuestionComplete(topicId, marksAwarded, marksAvailable, variantQuestion) {
    const pid = currentPathwayIdRef.current;
    // If a variant was answered, replace that question in the DB so resume sees the variant
    if (variantQuestion && pid) {
      const updated = questionsRef.current.map((q) =>
        q.topicId === topicId ? { ...variantQuestion, number: q.number } : q
      );
      questionsRef.current = updated;
      setQuestions(updated);
      remainingQuestionsRef.current = [...updated];
      callApi(`/api/pathways/${pid}/questions`, { method: "PATCH", body: { questions: updated } }).catch(() => {});
    }
    // Immediately persist this result so Subjects / Suggestions tabs update in real-time
    if (user && quizSessionIdRef.current && marksAwarded != null) {
      const topicDesc = topics.find((t) => t.id === topicId)?.description || "";
      savedResultTopicsRef.current.add(topicId);
      callApi("/api/quiz-results", {
        method: "POST",
        body: {
          subject,
          sessionId: quizSessionIdRef.current,
          pathwayId: currentPathwayIdRef.current,
          results: [{ topicId, topicDesc, correct: marksAwarded === marksAvailable, marksAwarded, marksAvailable }],
        },
      }).catch(() => {});
    }
  }

  function handleQuizFinish(r) {
    setQuizResults(r);
    setStage("results");
    localStorage.removeItem("pp_quiz"); setSavedQuiz(null);
    // Save any results not already persisted per-question (avoids duplicates)
    if (user) {
      const unsaved = r.results.filter((res) => !savedResultTopicsRef.current.has(res.topicId));
      if (unsaved.length > 0) {
        const sessionId = quizSessionIdRef.current || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payload = unsaved.map((res) => ({
          topicId: res.topicId,
          topicDesc: topics.find((t) => t.id === res.topicId)?.description || "",
          correct: res.marksAwarded === res.marksAvailable,
          marksAwarded: res.marksAwarded ?? 0,
          marksAvailable: res.marksAvailable ?? 1,
        }));
        callApi("/api/quiz-results", { method: "POST", body: { subject, sessionId, pathwayId: currentPathwayIdRef.current, results: payload } })
          .then(() => loadPathways())
          .catch(() => {});
      } else {
        loadPathways();
      }
    }
    // Silently generate a fresh set of questions for all topics in the background
    const pid = currentPathwayIdRef.current;
    const snapTopics = [...topics];
    if (pid && snapTopics.length > 0) {
      (async () => {
        try {
          // Re-fetch sources so any newly added/removed sources are reflected next time
          let bgSources = [];
          try {
            const r = await callApi(`/api/sources?pathwayId=${pid}`);
            bgSources = Array.isArray(r.sources) ? r.sources : [];
          } catch {}
          const pathwayNumber = pathways.find((p) => p.id === pid)?.pathwayNumber ?? null;
          const BG_QUESTION_SYSTEM = buildQuestionSystem(examBoardRef.current, subject, pathwayNumber, bgSources.length > 0);
          const freshQs = await batchedMap(snapTopics, 3, async (topic) => {
            const confLabel = topic.confidence != null ? `${topic.confidence} (${CONFIDENCE_LABELS[topic.confidence]})` : "null (no rating — treat as Rating 4, easiest)";
            const { text: sourceLine, sourceIds, excerpts: sourceExcerpts } = sourceContextSection(topic, bgSources);
            const topicBase = `Topic ID: ${topic.id}\nTopic: "${topic.description}"\nConfidence level: ${confLabel}`;
            let raw = await callClaude({ system: BG_QUESTION_SYSTEM, user: `${topicBase}${sourceLine}`, max_tokens: 2500, model: "gemini", stage: "question_generation" });
            let q;
            try {
              q = parseJSON(raw);
            } catch {
              if (sourceLine) {
                raw = await callClaude({ system: buildQuestionSystem(examBoardRef.current, subject, pathwayNumber, false), user: topicBase, max_tokens: 2500, model: "gemini", stage: "question_generation" });
                q = parseJSON(raw);
              } else {
                throw new Error("Question generation failed");
              }
            }
            return { topicId: topic.id, ...q, sourceIds, sourceExcerpts };
          });
          await callApi(`/api/pathways/${pid}/questions`, { method: "PATCH", body: { questions: freshQs.filter((q) => q && !q.failed) } });
          loadPathways();
        } catch {}
      })();
    }
  }

  function handleRetry() { setQuizResults(null); setCurrentQuizIdx(0); setInitialQuizResults({}); setStage("quiz"); }

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
        @keyframes metalShimmer {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        * { font-family: 'Nunito', -apple-system, system-ui, sans-serif; }
        input, textarea, button, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(126,173,216,0.3); border-radius: 6px; }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          user={user}
          activeStage={stage}
          onHome={() => { if (stage === "quiz") { handleExit(); } else { setPendingPathway(null); setStage("home"); } }}
          onExams={() => setStage("exams")}
          onSources={() => setStage("sources")}
          onSuggestions={() => setStage("suggestions")}
          onCalendar={() => setStage("calendar")}
          onLeaderboard={() => setStage("leaderboard")}
          onAreas={() => setStage("subjects")}
          onAccount={() => setStage("account")}
          onLogout={handleLogout}
        />

        {stage === "loading" && <LoadingScreen progress={loadProgress} total={topics.length} error={loadError} onRetry={() => { setLoadError(""); handleTopicsReady({ subject, topics, save: false, pathwayId: currentPathwayIdRef.current, cachedQuestions: cachedQuestionsRef.current, examBoard: examBoardRef.current, pathwayNumber: pendingPathway?.pathwayNumber ?? null }); }} onHome={() => { setLoadError(""); reset(); }} />}

        {stage === "exams" && <div style={contentBg}><ExamsScreen pathways={pathways} onQuiz={handleTopicsReady} onRequestUpload={() => setStage("upload")} /></div>}
        {stage === "sources" && <div style={contentBg}><SourcesScreen pathways={pathways} onRequestUpload={() => setStage("upload")} onSourcesChanged={loadPathways} onStartSourceQuiz={(state) => { setSourceQuizState(state); setSourceQuizResults(null); setStage("source-quiz"); }} /></div>}

        {(stage === "source-quiz" || stage === "source-quiz-results") && sourceQuizState && (
          <div ref={quizScrollRef} style={{ ...contentBg, padding: "30px 0" }}>
            {stage === "source-quiz" && (
              <QuizScreen
                topics={sourceQuizState.topics}
                questions={sourceQuizState.questions}
                pathwaySources={sourceQuizState.sources}
                onFinish={(r) => { setSourceQuizResults(r); setStage("source-quiz-results"); }}
                onAskPip={(wasChecked) => { setCurrentQuizChecked(wasChecked); setPipOpen(true); }}
                onIdxChange={() => {}}
                onExit={() => { setSourceQuizState(null); setSourceQuizResults(null); setStage("sources"); }}
                onQuestionComplete={() => {}}
                onResultsChange={() => {}}
                initialIdx={0}
                initialResults={{}}
                onScrollTop={() => quizScrollRef.current?.scrollTo({ top: 0, behavior: "instant" })}
              />
            )}
            {stage === "source-quiz-results" && sourceQuizResults && (
              <ResultsScreen
                subject={sourceQuizState.name}
                topics={sourceQuizState.topics}
                score={sourceQuizResults.score}
                total={sourceQuizResults.total}
                results={sourceQuizResults.results}
                onRetry={() => setStage("source-quiz")}
                onReset={() => { setSourceQuizState(null); setSourceQuizResults(null); setStage("sources"); }}
              />
            )}
          </div>
        )}

        {stage === "calendar" && <div style={contentBg}><CalendarScreen user={user} onBack={() => setStage("home")} /></div>}

        {stage === "leaderboard" && <div style={contentBg}><LeaderboardScreen currentUserId={user?.id} /></div>}

        {stage === "account" && <div style={contentBg}><AccountScreen user={user} onBack={() => setStage("home")} onUserUpdate={(updated) => setUser(updated)} onLogout={handleLogout} onAdmin={() => setStage("admin")} /></div>}

        {stage === "admin" && <div style={contentBg}><AdminPage onBack={() => setStage("account")} /></div>}


        {stage === "subjects" && <div style={contentBg}><SubjectsScreen pathways={pathways} onQuiz={handleTopicsReady} /></div>}

        {stage === "suggestions" && <div style={contentBg}><SuggestionsScreen pathways={pathways} onQuiz={handleTopicsReady} /></div>}

        {stage === "topicSelect" && pendingPathway && (
          <div style={contentBg}>
            <TopicSelectScreen
              pathway={pendingPathway}
              onBack={() => { setPendingPathway(null); setStage("home"); }}
              savedResume={{
                resumeNumber: pendingPathway.resumeNumber ?? pendingPathway.resume_number ?? null,
                questions: Array.isArray(pendingPathway.questions) ? pendingPathway.questions : null,
              }}
              onStart={(selectedTopics, resumeNum) => {
                const p = pendingPathway;
                const selectedIds = new Set(selectedTopics.map((t) => t.id));
                const filteredCached = Array.isArray(p.questions)
                  ? p.questions.filter((q) => selectedIds.has(q.topicId))
                  : null;
                handleTopicsReady({
                  subject: p.subject,
                  topics: selectedTopics,
                  save: false,
                  pathwayId: p.id,
                  cachedQuestions: filteredCached && filteredCached.length > 0 ? filteredCached : null,
                  resumeNumber: resumeNum ?? null,
                  examBoard: p.examBoard ?? null,
                  pathwayNumber: p.pathwayNumber ?? null,
                });
              }}
              onRegenerateTopic={(group, done) => {
                const p = pendingPathway;
                const groupIds = new Set(group.subtopics.map((t) => t.id));
                const remaining = Array.isArray(p.questions)
                  ? p.questions.filter((q) => !groupIds.has(q.topicId))
                  : [];
                callApi(`/api/pathways/${p.id}/questions`, { method: "PATCH", body: { questions: remaining } })
                  .then(() => {
                    setPendingPathway({ ...p, questions: remaining });
                    handleTopicsReady({
                      subject: p.subject,
                      topics: group.subtopics,
                      save: false,
                      pathwayId: p.id,
                      cachedQuestions: null,
                      examBoard: p.examBoard ?? null,
                      pathwayNumber: p.pathwayNumber ?? null,
                    });
                  })
                  .catch(() => {})
                  .finally(() => done());
              }}
            />
          </div>
        )}

        {stage === "home" && (
          <div style={contentBg}>
            {pendingPathway?.loading && (
              <div style={{ background: "rgba(91,174,212,0.07)", border: "1.5px solid rgba(91,174,212,0.25)", borderRadius: 18, padding: "16px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 3px" }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: "#1a3a4f", margin: 0 }}>
                      {pendingPathway.subject || "New pathway"}
                    </p>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7eadd8", animation: `pipBounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: "#7ab3cc", margin: 0 }}>
                    {pendingPathway.subject ? "Saving…" : "Extracting topics…"}
                  </p>
                </div>
              </div>
            )}
            <PathwayDashboard
              pathways={pathways}
              savedSubject={savedQuiz?.subject ?? null}
              onSelect={(p) => {
                callApi(`/api/pathways/${p.id}/open`, { method: "PATCH" }).then(() => loadPathways()).catch(() => {});
                setPendingPathway(p);
                setStage("topicSelect");
              }}
              onContinue={() => handleContinueQuiz()}
              onContinueTopic={(pathway, resumeInfo) => handleContinueTopic(pathway, resumeInfo)}
              onRegenerate={(pathway, done) => {
                callApi(`/api/pathways/${pathway.id}/questions`, { method: "PATCH", body: { questions: null } })
                  .then(() => {
                    setPathways(prev => prev.map(p => p.id === pathway.id ? { ...p, questions: null } : p));
                    const updated = { ...pathway, questions: null };
                    setPendingPathway(updated);
                    setStage("topicSelect");
                  })
                  .catch(() => {})
                  .finally(() => done());
              }}
              onAddNew={() => setStage("upload")}
              onDelete={(id) => {
                const deleted = pathways.find((p) => p.id === id);
                callApi(`/api/pathways/${id}`, { method: "DELETE" })
                  .then(() => {
                    // Clear saved quiz session if it belongs to the deleted pathway
                    if (deleted && savedQuiz?.subject === deleted.subject) {
                      localStorage.removeItem("pp_quiz");
                      setSavedQuiz(null);
                    }
                    loadPathways();
                  })
                  .catch(() => {});
              }}
            />
          </div>
        )}

        {stage === "upload" && (
          <div style={contentBg}>
            <UploadScreen
              onExtractionStarted={() => {
                setPendingPathway({ subject: null, topics: [], loading: true });
                setStage("home");
              }}
              onTopicsReady={({ subject: sub, topics: tops, pathwayNumber }) => {
                setPendingPathway({ subject: sub, topics: tops, pathwayNumber: pathwayNumber ?? null, loading: true });
                callApi("/api/pathways", { method: "POST", body: { subject: sub, topics: tops, pathwayNumber: pathwayNumber ?? null } })
                  .then(() => loadPathways())
                  .catch(() => {})
                  .finally(() => setPendingPathway(null));
              }}
              existingPathways={pathways}
            />
          </div>
        )}

        {(stage === "quiz" || stage === "results") && (
          <div ref={quizScrollRef} style={{ ...contentBg, padding: "30px 0" }}>
            {stage === "quiz" && <QuizScreen topics={topics} questions={questions} pathwaySources={pathwaySourcesState} subject={subject} pathwayNumber={pendingPathway?.pathwayNumber ?? null} onFinish={handleQuizFinish} onAskPip={(wasChecked) => { setCurrentQuizChecked(wasChecked); setPipOpen(true); }} onIdxChange={handleIdxChange} onExit={handleExit} onBackToTopics={pendingPathway ? (resumeIdx) => handleBackToTopics(resumeIdx) : null} onQuestionComplete={handleQuestionComplete} onResultsChange={(r) => { currentQuizResultsRef.current = r; }} initialIdx={currentQuizIdx} initialResults={initialQuizResults} onScrollTop={() => quizScrollRef.current?.scrollTo({ top: 0, behavior: "instant" })} onCompleteTopic={currentPathwayIdRef.current ? handleCompleteTopic : undefined} />}
            {stage === "results" && quizResults && <ResultsScreen subject={subject} topics={topics} score={quizResults.score} total={quizResults.total} results={quizResults.results} onRetry={handleRetry} onReset={reset} />}
          </div>
        )}

        {pipOpen && <PipChat topic={currentTopic} question={currentQ?.question} correctAnswer={currentQ?.answer} questionAnswered={currentQuizChecked} onClose={() => setPipOpen(false)} />}
      </div>

    </>
  );
}
