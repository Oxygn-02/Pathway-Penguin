// Input sanitisation helpers — applied to every field that reaches an AI model.

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+instructions?/gi,
  /disregard\s+(your\s+)?(instructions?|guidelines?|rules?|system\s*prompt)/gi,
  /act\s+as\s+(if\s+you\s+are|a\s+)?(different|new|another|unrestricted|evil|jailbreak)/gi,
  /you\s+are\s+now\s+(an?\s+)?(unrestricted|unfiltered|different|evil|jailbreak)/gi,
  /forget\s+(everything|all\s+previous|all\s+prior|all\s+your|your\s+training)/gi,
  /pretend\s+(you\s+are|to\s+be)\s+(an?\s+)?(unrestricted|unfiltered|different)/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
  /developer\s+mode/gi,
  /\[INST\]|\[\/INST\]/gi,
  /<\|system\|>|<\|user\|>|<\|assistant\|>|<\|im_start\|>|<\|im_end\|>/gi,
];

// Hard character limits
export const LIMIT_USER_TEXT = 20_000;    // student answers, Pip messages
export const LIMIT_SYSTEM_TEXT = 60_000;  // server-generated system prompts
export const LIMIT_SOURCE_TEXT = 200_000; // uploaded source material
export const LIMIT_INLINE_DATA_B64 = 26_843_546; // ~20 MB PDF in base64

/** Strip injection patterns, lightly escape HTML, enforce char cap. */
export function sanitizeUserInput(text: unknown, maxLen = LIMIT_USER_TEXT): string {
  if (typeof text !== "string") return "";
  let s = text;
  for (const re of INJECTION_PATTERNS) {
    s = s.replace(re, "[removed]");
  }
  // Prevent XSS if the text is ever reflected into HTML context
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return s.slice(0, maxLen);
}

/** System prompts are server-generated — just enforce length. */
export function sanitizeSystemPrompt(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.slice(0, LIMIT_SYSTEM_TEXT);
}

/** Source material — strip injection patterns and enforce length. */
export function sanitizeSourceContent(text: unknown): string {
  if (typeof text !== "string") return "";
  let s = text;
  for (const re of INJECTION_PATTERNS) {
    s = s.replace(re, "[removed]");
  }
  return s.slice(0, LIMIT_SOURCE_TEXT);
}

/** Validate inlineData for PDF uploads. Returns an error string or null. */
export function validateInlineData(data: unknown): string | null {
  if (data === null || data === undefined) return null; // optional field
  if (typeof data !== "object" || Array.isArray(data)) return "inlineData must be an object";
  const d = data as Record<string, unknown>;
  const allowed = ["application/pdf"];
  if (!allowed.includes(d.mimeType as string)) {
    return `Unsupported file type '${d.mimeType}'. Only PDF files are accepted.`;
  }
  if (typeof d.data !== "string") return "inlineData.data must be a base64 string";
  if (d.data.length > LIMIT_INLINE_DATA_B64) {
    return "File is too large. Maximum PDF size is 20 MB.";
  }
  return null;
}

const STAGES = [
  "question_generation", "answer_checking", "hint_request", "ask_pip",
  "variant_generation", "extraction", "material_processing", "unknown",
] as const;

/** Only accept known usage-log stages; anything else falls back to `fallback`. */
export function normaliseStage(stage: unknown, fallback: (typeof STAGES)[number]): (typeof STAGES)[number] {
  return typeof stage === "string" && (STAGES as readonly string[]).includes(stage)
    ? (stage as (typeof STAGES)[number])
    : fallback;
}
