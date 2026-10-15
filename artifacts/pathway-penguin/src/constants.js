import av1 from "@assets/1__1_-removebg-preview_1773838630317.png";
import av2 from "@assets/4__1_-removebg-preview_1773838630314.png";
import av3 from "@assets/5__1_-removebg-preview_1773838630315.png";
import av4 from "@assets/6__1_-removebg-preview_1773838630316.png";
import av5 from "@assets/7__1_-removebg-preview_1773838630316.png";
import av6 from "@assets/Untitled_design__1_-removebg-preview_1773911677741.png";
import av7 from "@assets/8__1_-removebg-preview_1773921258885.png";
import av8 from "@assets/9__1_-removebg-preview_1773921258883.png";
import av9 from "@assets/10__1_-removebg-preview_1773921258881.png";
import av10 from "@assets/11__1_-removebg-preview_1773921258880.png";
import av11 from "@assets/12__1_-removebg-preview_1773921258875.png";
import av12 from "@assets/13__1_-removebg-preview_1773921258879.png";
import av13 from "@assets/Untitled_design__2_-removebg-preview_1774009546929.png";
import av14 from "@assets/image-removebg-preview_(1)_1774009723671.png";

export const AVATARS = [null, av1, av2, av3, av4, av5, av6, av7, av8, av9, av10, av11, av12, av13, av14]; // index 1–14 match DB value

export const FONT = "'Nunito', -apple-system, system-ui, sans-serif";

export const CONFIDENCE_LABELS = { 1: "Refresher", 2: "Consolidate", 3: "Needs Help", 4: "New Topic" };

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DURATIONS = [{ label: "30 min", value: 30 }, { label: "1 hour", value: 60 }, { label: "1.5 hours", value: 90 }, { label: "2 hours", value: 120 }];

export const OPTION_SUBJECTS = ["Statistics/Further Maths", "Computer Science", "Geography", "Programmable Systems"];

export const CORE_SUBJECTS = ["Maths", "English Language", "English Literature", "Biology", "Chemistry", "Physics", "Engineering Design", "Engineering Manufacture"];

/* ── Maths-subject detector ─────────────────────────────────── */
export const MATHS_SUBJ_RE = /maths|physics|chemistry|statistics/i;

/* ── Rank system ──────────────────────────────────────────────── */
export const RANKS = [
  { name: "Little Blue",  latin: "Eudyptula minor",          subtitle: "the world's smallest penguin",  desc: "Tiny but eager. Every journey starts here.",                       emoji: "🐧", min: 0,    max: 99 },
  { name: "Magellanic",   latin: "Spheniscus magellanicus",   subtitle: "the South American explorer",   desc: "Setting out on the voyage. Bold stripes, bolder ambition.",        emoji: "🐧", min: 100,  max: 299 },
  { name: "Rockhopper",   latin: "Eudyptes chrysocome",       subtitle: "fearless cliff climber",        desc: "Bouncing over obstacles. Tenacious learner.",                       emoji: "🐧", min: 300,  max: 599 },
  { name: "Macaroni",     latin: "Eudyptes chrysolophus",     subtitle: "most abundant penguin",         desc: "Flamboyant and consistent. Hard to miss.",                          emoji: "🐧", min: 600,  max: 999 },
  { name: "Chinstrap",    latin: "Pygoscelis antarcticus",    subtitle: "boldly marked",                 desc: "Disciplined and sharp. A reliable presence.",                      emoji: "🐧", min: 1000, max: 1749 },
  { name: "Gentoo",       latin: "Pygoscelis papua",          subtitle: "fastest swimming penguin",      desc: "Swift progress. Cutting through the curriculum.",                   emoji: "🐧", min: 1750, max: 2749 },
  { name: "King",         latin: "Aptenodytes patagonicus",   subtitle: "second largest penguin",        desc: "Regal and experienced. Commanding respect.",                        emoji: "🐧", min: 2750, max: 3999 },
  { name: "Adelie",       latin: "Pygoscelis adeliae",        subtitle: "true Antarctic native",         desc: "Tough, dedicated, thriving in the harshest conditions.",            emoji: "🐧", min: 4000, max: 5999 },
  { name: "Emperor",      latin: "Aptenodytes forsteri",      subtitle: "the largest penguin on Earth",  desc: "The pinnacle. A true Pathway Penguin legend.",                      emoji: "🐧", min: 6000, max: Infinity },
];

export const MEDAL = [
  { crown: "🥇", gradient: "linear-gradient(110deg,#a07800 0%,#ffd700 30%,#fff8c0 50%,#ffd700 70%,#a07800 100%)", text: "#6b4200" },
  { crown: "🥈", gradient: "linear-gradient(110deg,#6e6e6e 0%,#c8c8c8 30%,#f0f0f0 50%,#c8c8c8 70%,#6e6e6e 100%)", text: "#3a3a3a" },
  { crown: "🥉", gradient: "linear-gradient(110deg,#7a3c10 0%,#cd7f32 30%,#eab47a 50%,#cd7f32 70%,#7a3c10 100%)", text: "#5c2e00" },
];

/* ── Exams screen ─────────────────────────────────────────────── */
export const PRIORITY_COLORS = {
  red:    { bg: "#fdeaea", border: "#f5b8b8", dot: "#e84545", label: "High priority",    text: "#b03030" },
  orange: { bg: "#fef4e8", border: "#f5d4a8", dot: "#f5993a", label: "Medium priority",  text: "#a05f10" },
  yellow: { bg: "#fefae8", border: "#f0e09a", dot: "#d4a800", label: "Low priority",     text: "#7a6000" },
  green:  { bg: "#eaf7f2", border: "#a8dfc8", dot: "#3cba8c", label: "Minimum priority", text: "#20744f" },
};

export const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const CAL_DAYS   = ["Mo","Tu","We","Th","Fr","Sa","Su"];

export const UTC_SUBJECTS = [...CORE_SUBJECTS, ...OPTION_SUBJECTS];

export const KNOWN_SUBJECTS = [
  "English Language", "English Literature", "English",
  "Mathematics", "Maths", "Further Mathematics", "Further Maths",
  "Biology", "Chemistry", "Physics", "Combined Science", "Science",
  "Computer Science", "Computing", "ICT",
  "History", "Geography",
  "French", "Spanish", "German", "Mandarin", "Latin",
  "Religious Studies", "Religious Education",
  "Art", "Design Technology", "Design & Technology",
  "Music", "Drama", "Physical Education",
  "Business Studies", "Business", "Economics",
  "Sociology", "Psychology", "Media Studies",
  "Engineering", "Electronics", "Graphic Design",
];

/* ── Question chart ───────────────────────────────────────────── */
export const CHART_COLORS = ["#5baed4", "#7eadd8", "#4a8cbf", "#a8d4ee", "#2d6fa3"];

export const PIE_COLORS = ["#5baed4", "#7eadd8", "#a8d4ee", "#4a8cbf", "#2d6fa3", "#b8dff0", "#3a7fae", "#9bc8e0"];

/* ── Maths keyboard ──────────────────────────────────────────── */
export const MATH_KB_EXPRESSIONS = [
  {
    label: "a/b",
    title: "Fraction",
    insert: "$\\frac{}{}$",
    cursorBack: 4,
    preview: "\\frac{a}{b}",
  },
  {
    label: "√□",
    title: "Square root",
    insert: "$\\sqrt{}$",
    cursorBack: 2,
    preview: "\\sqrt{x}",
  },
  {
    label: "ⁿ√□",
    title: "nth root",
    insert: "$\\sqrt[]{}$",
    cursorBack: 2,
    preview: "\\sqrt[n]{x}",
  },
  {
    label: "∫ dx",
    title: "Integral",
    insert: "$\\int  \\,dx$",
    cursorBack: 5,
    preview: "\\int f(x)\\,dx",
  },
  {
    label: "∫ₐᵇ dx",
    title: "Definite integral",
    insert: "$\\int_{a}^{b}  \\,dx$",
    cursorBack: 6,
    preview: "\\int_a^b f(x)\\,dx",
  },
  {
    label: "Σ",
    title: "Summation (i = 1 to n)",
    insert: "$\\sum_{i=1}^{n} $",
    cursorBack: 0,
    preview: "\\sum_{i=1}^{n}",
  },
  {
    label: "lim",
    title: "Limit (x → a)",
    insert: "$\\lim_{x \\to a} $",
    cursorBack: 0,
    preview: "\\lim_{x \\to a}",
  },
  {
    label: "d/dx",
    title: "Derivative d/dx",
    insert: "$\\frac{d}{dx}\\left(\\right)$",
    cursorBack: 8,
    preview: "\\frac{d}{dx}(f)",
  },
  {
    label: "∂/∂x",
    title: "Partial derivative ∂/∂x",
    insert: "$\\frac{\\partial }{\\partial x}$",
    cursorBack: 14,
    preview: "\\frac{\\partial f}{\\partial x}",
  },
  {
    label: "logₐ",
    title: "Logarithm with base",
    insert: "$\\log_{a}()$",
    cursorBack: 2,
    preview: "\\log_a(x)",
  },
  {
    label: "|x|",
    title: "Absolute value",
    insert: "$\\left| \\right|$",
    cursorBack: 8,
    preview: "\\left|x\\right|",
  },
  {
    label: "(n k)",
    title: "Binomial coefficient",
    insert: "$\\binom{n}{k}$",
    cursorBack: 0,
    preview: "\\binom{n}{k}",
  },
  {
    label: "x̄",
    title: "Mean (overline)",
    insert: "$\\overline{}$",
    cursorBack: 2,
    preview: "\\overline{x}",
  },
  {
    label: "→v",
    title: "Vector",
    insert: "$\\vec{}$",
    cursorBack: 2,
    preview: "\\vec{v}",
  },
  {
    label: "â",
    title: "Unit vector (hat)",
    insert: "$\\hat{}$",
    cursorBack: 2,
    preview: "\\hat{v}",
  },
  {
    label: "x²",
    title: "Squared",
    insert: "^{2}",
    cursorBack: 0,
    preview: "x^{2}",
  },
];

export const MATH_KB_SYMBOLS = [
  { label: "a/b",  title: "Fraction",              insert: "$\\frac{}{}$",      cursorBack: 3 },
  { label: "√x",   title: "Square root",           insert: "$\\sqrt{}$",        cursorBack: 2 },
  { label: "xⁿ",   title: "Power / superscript",   insert: "$x^{}$",            cursorBack: 2 },
  { label: "x₀",   title: "Subscript",             insert: "$x_{}$",            cursorBack: 2 },
  { label: "π",    title: "Pi",                    insert: "$\\pi$" },
  { label: "α",    title: "Alpha",                 insert: "$\\alpha$" },
  { label: "β",    title: "Beta",                  insert: "$\\beta$" },
  { label: "θ",    title: "Theta",                 insert: "$\\theta$" },
  { label: "λ",    title: "Lambda",                insert: "$\\lambda$" },
  { label: "Δ",    title: "Delta (change in)",     insert: "$\\Delta$" },
  { label: "Σ",    title: "Sigma (sum)",           insert: "$\\Sigma$" },
  { label: "∞",    title: "Infinity",              insert: "$\\infty$" },
  { label: "±",    title: "Plus or minus",         insert: "$\\pm$" },
  { label: "×",    title: "Multiply",              insert: "$\\times$" },
  { label: "÷",    title: "Divide",                insert: "$\\div$" },
  { label: "≤",    title: "Less than or equal to", insert: "$\\leq$" },
  { label: "≥",    title: "Greater than or equal", insert: "$\\geq$" },
  { label: "≠",    title: "Not equal to",          insert: "$\\neq$" },
  { label: "°",    title: "Degrees",               insert: "$^{\\circ}$",       cursorBack: 1 },
  { label: "∝",    title: "Proportional to",       insert: "$\\propto$" },
];
