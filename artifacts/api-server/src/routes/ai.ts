import { Router, type IRouter, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { aiRateLimit } from "../lib/rateLimiter.js";
import { sanitizeUserInput, sanitizeSystemPrompt, validateInlineData, normaliseStage } from "../lib/sanitize.js";
import { query } from "../db.js";

const router: IRouter = Router();

type Stage =
  | "question_generation"
  | "answer_checking"
  | "hint_request"
  | "ask_pip"
  | "variant_generation"
  | "extraction"
  | "material_processing"
  | "unknown";

/** Fire-and-forget usage log — never blocks the response. */
function logUsage(userId: number, provider: string, stage: Stage, inputTokens: number, outputTokens: number): void {
  query(
    "INSERT INTO ai_usage_log (user_id, ai_provider, stage, input_tokens, output_tokens) VALUES ($1, $2, $3, $4, $5)",
    [userId, provider, stage, inputTokens, outputTokens],
  ).catch(() => {});
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(Object.assign(new Error("Request timed out"), { isTimeout: true })), ms)),
  ]);
}

/**
 * Extract non-thought text from a Gemini response.
 * gemini-2.5-flash may emit "thought" parts (thinking tokens) that must be
 * excluded — only parts where thought !== true contribute to the output.
 * Falls back to response.text if the parts array is empty.
 */
function extractGeminiText(response: any): string {
  const parts: any[] = response.candidates?.[0]?.content?.parts ?? [];
  const nonThought = parts.filter((p: any) => typeof p.text === "string" && p.text && !p.thought);
  if (nonThought.length > 0) return nonThought.map((p: any) => p.text).join("");
  return typeof response.text === "string" ? response.text : "";
}

/** Random jitter (±10 s) so concurrent retries don't all fire together. */
function jitter(base: number): number {
  return base + Math.floor(Math.random() * 10_000) - 5_000;
}

/**
 * Free-tier model chain, tried in order. Override with GEMINI_MODELS
 * (comma-separated) when Google adds or retires models — no code change needed.
 * Gemma is last: it has a large free quota but is text-only (no PDF input).
 */
const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemma-3-27b-it"];
const MODELS = (process.env.GEMINI_MODELS ?? "").split(",").map((m) => m.trim()).filter(Boolean);
const MODEL_CHAIN = MODELS.length > 0 ? MODELS : DEFAULT_MODELS;

const isGemma = (model: string) => model.startsWith("gemma");

/**
 * Thinking tokens count against maxOutputTokens, so a short reply limit (marking
 * uses 200, Pip 300) can be eaten entirely by thinking and come back empty.
 * Short, simple stages get no thinking; the rest get a small budget that is
 * added on top of the caller's token limit. Thinking is also billed as output.
 */
const NO_THINKING_STAGES = new Set<string>(["answer_checking", "ask_pip", "hint_request"]);
const THINKING_BUDGET = 1024;

/**
 * Try a single Gemini model with automatic retry on 429/503.
 * 429 delays are set above the 35-second free-tier reset window.
 * Timeout is 60 s to accommodate thinking-model latency.
 *
 * Returns null (rather than an object with empty text) when the response
 * contains no usable text — e.g. when all parts are thinking tokens and no
 * real output was produced. This ensures the caller falls through to the
 * next model instead of propagating an empty string.
 */
async function tryModel(
  model: string,
  params: { system: string; parts: any[]; maxTokens: number; stage: string },
  opts: { failFast429?: boolean } = {},
): Promise<{ text: string; usage: any } | null> {
  // When failFast429=true, skip the wait and move to the next model
  // immediately so a rate-limited model never stalls the request.
  const DELAYS_429 = opts.failFast429 ? [] : [jitter(36_000), jitter(60_000), jitter(90_000)];
  const DELAYS_503 = [2_000, 5_000, 10_000];
  let attempt429 = 0;
  let attempt503 = 0;

  // Gemma models reject systemInstruction ("Developer instruction is not
  // enabled"), so for them the system prompt is prepended to the user turn.
  let parts = params.parts;
  const config: Record<string, unknown> = { maxOutputTokens: params.maxTokens };
  if (!isGemma(model)) {
    const budget = NO_THINKING_STAGES.has(params.stage) ? 0 : THINKING_BUDGET;
    config.thinkingConfig = { thinkingBudget: budget };
    config.maxOutputTokens = params.maxTokens + budget;
  }
  if (isGemma(model)) {
    const userText = params.parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("\n\n");
    parts = [{ text: `${params.system}\n\n${userText}` }];
  } else {
    config.systemInstruction = params.system;
  }
  const contents = [{ role: "user", parts }];

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({ model, contents, config }),
        60_000,
      );
      const text = extractGeminiText(response);
      if (!text || !text.trim()) {
        // Response arrived but contained no usable text (e.g. all thinking
        // tokens were filtered out). Treat as a failure so the next model can
        // try instead.
        console.warn(`[${model}] empty response text — falling through to next model`);
        return null;
      }
      return { text, usage: response.usageMetadata };
    } catch (err: any) {
      const status = err?.status ?? 0;
      const isTimeout = !!(err as any)?.isTimeout;
      if (status === 429 && attempt429 < DELAYS_429.length) {
        console.warn(`[${model}] 429 rate-limited — waiting ${Math.round(DELAYS_429[attempt429] / 1000)}s before retry ${attempt + 1}`);
        await sleep(DELAYS_429[attempt429++]);
        continue;
      }
      if (status === 429) {
        console.warn(`[${model}] 429 rate-limited — failing fast to next model`);
        return null;
      }
      if (status === 503 && attempt503 < DELAYS_503.length) {
        await sleep(DELAYS_503[attempt503++]);
        continue;
      }
      if (isTimeout) {
        console.warn(`[${model}] request timed out after 60 s`);
      } else {
        console.error(`[${model}] error:`, status, err?.message?.slice(0, 200));
      }
      return null;
    }
  }
  return null;
}

/* ── POST /api/ai/gemini-message ── */
//
// Tries each model in MODEL_CHAIN in turn, moving on when one is rate-limited,
// times out or returns nothing. Question generation skips the first (most
// quota-limited) model so it doesn't starve answer checking, Pip and extraction.
//
router.post("/ai/gemini-message", requireAuth, aiRateLimit, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;

  try {
    const { system, user, inlineData, stage: rawStage, max_tokens = 8192 } = req.body;
    const stage = normaliseStage(rawStage, "unknown");
    const inlineErr = validateInlineData(inlineData);
    if (inlineErr) {
      res.status(400).json({ error: inlineErr });
      return;
    }

    const cleanSystem = sanitizeSystemPrompt(system);
    const cleanUser = sanitizeUserInput(user, 20_000);
    const maxTokens = Math.min(Math.max(Number(max_tokens) || 8192, 64), 8192);
    const parts: any[] = [];
    if (inlineData) parts.push({ inlineData });
    parts.push({ text: cleanUser });

    const chain = stage === "question_generation" && MODEL_CHAIN.length > 1
      ? [...MODEL_CHAIN.slice(1), MODEL_CHAIN[0]]
      : MODEL_CHAIN;

    for (const model of chain) {
      // Gemma can't read PDFs — skip it rather than silently dropping the attachment.
      if (inlineData && isGemma(model)) continue;
      const result = await tryModel(model, { system: cleanSystem, parts, maxTokens, stage }, { failFast429: true });
      if (result) {
        logUsage(userId, model, stage as Stage, result.usage?.promptTokenCount ?? 0, result.usage?.candidatesTokenCount ?? 0);
        res.json({
          text: result.text,
          usage: { input_tokens: result.usage?.promptTokenCount ?? 0, output_tokens: result.usage?.candidatesTokenCount ?? 0 },
        });
        return;
      }
    }

    res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
  } catch (err: any) {
    console.error("AI route error:", err?.status, err?.message?.slice(0, 200));
    res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
  }
});

export default router;
