import { Router, type IRouter, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { acquireClaudeSlot } from "../lib/rateLimiter.js";
import { sanitizeUserInput, sanitizeSystemPrompt, validateInlineData } from "../lib/sanitize.js";
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
 * Always use the parts array to extract text so that thinking tokens
 * (thought:true parts) from gemini-2.5-flash are automatically skipped.
 * Fall back to response.text only if the parts array is empty.
 */
function extractGeminiText(response: any): string {
  const parts: any[] = response.candidates?.[0]?.content?.parts ?? [];
  const nonThought = parts.filter((p: any) => typeof p.text === "string" && p.text && !p.thought);
  if (nonThought.length > 0) return nonThought.map((p: any) => p.text).join("");
  // Fallback — should rarely be hit
  return typeof response.text === "string" ? response.text : "";
}

/** Random jitter (±10 s) so concurrent retries don't all fire together. */
function jitter(base: number): number {
  return base + Math.floor(Math.random() * 10_000) - 5_000;
}

// Models that do NOT support systemInstruction and need the system prompt
// prepended directly to the first user message instead.
const SYSTEM_IN_USER_MODELS = new Set<string>();

/**
 * Try a single Gemini model with automatic retry on 429/503.
 * 429 delays are set above the 35-second free-tier reset window.
 * Timeout is 60 s to accommodate thinking-model latency.
 * For models that don't support systemInstruction (e.g. gemma-3-27b-it),
 * the system prompt is prepended to the user message automatically.
 */
async function tryModel(
  model: string,
  params: { system: string; parts: any[]; maxTokens: number },
  opts: { failFast429?: boolean } = {},
): Promise<{ text: string; usage: any } | null> {
  // When failFast429=true (question generation), skip the wait and move to
  // the next model immediately — lets Claude fallback kick in quickly.
  const DELAYS_429 = opts.failFast429 ? [] : [jitter(36_000), jitter(60_000), jitter(90_000)];
  const DELAYS_503 = [2_000, 5_000, 10_000];
  let attempt429 = 0;
  let attempt503 = 0;

  const noSysInstruction = SYSTEM_IN_USER_MODELS.has(model);
  let contents: any[];
  let config: any;
  if (noSysInstruction) {
    const combinedParts = params.parts.map((p, idx) => {
      if (idx === params.parts.length - 1 && typeof p.text === "string") {
        return { ...p, text: `${params.system}\n\n${p.text}` };
      }
      return p;
    });
    contents = [{ role: "user", parts: combinedParts }];
    config = { maxOutputTokens: params.maxTokens };
  } else {
    contents = [{ role: "user", parts: params.parts }];
    config = { systemInstruction: params.system, maxOutputTokens: params.maxTokens };
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({ model, contents, config }),
        60_000,
      );
      const text = extractGeminiText(response);
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

/** Claude fallback for question generation when all Gemini models are rate-limited. */
async function tryClaudeForQuestion(
  params: { system: string; user: string; maxTokens: number },
): Promise<{ text: string } | null> {
  console.log("[claude-fallback] attempting Claude question generation");
  try {
    const acquired = await acquireClaudeSlot();
    if (!acquired) { console.warn("[claude-fallback] slot not acquired"); return null; }
    // Use at least 2500 tokens — question JSON with steps can exceed 1200
    const safeTokens = Math.max(params.maxTokens, 2500);
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: safeTokens,
      system: params.system,
      messages: [{ role: "user", content: params.user }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    console.log(`[claude-fallback] success — ${text.length} chars`);
    return { text };
  } catch (err: any) {
    console.error("[claude-fallback] error:", err?.status, err?.message?.slice(0, 300));
    return null;
  }
}

/* ── POST /api/ai/message — Claude (legacy route, kept for non-question uses) ── */
router.post("/ai/message", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;

  try {
    const { system, user, max_tokens = 4096, documents = [], stage = "question_generation" } = req.body;
    const cleanSystem = sanitizeSystemPrompt(system);
    const cleanUser = sanitizeUserInput(user, 20_000);

    const content: any[] = [];
    if (Array.isArray(documents) && documents.length > 0) documents.forEach((doc: any) => content.push(doc));
    content.push({ type: "text", text: cleanUser });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens,
      system: cleanSystem,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    logUsage(userId, "claude", stage as Stage, message.usage?.input_tokens ?? 0, message.usage?.output_tokens ?? 0);
    res.json({ text, usage: message.usage ?? null });
  } catch (err: any) {
    console.error("Claude error:", err?.status, err?.message);
    res.status(err?.status === 429 ? 503 : 500).json({
      error: "Question generation failed. Please try again.",
    });
  }
});

/* ── POST /api/ai/gemini-message ── */
//
// Model priority is stage-dependent:
//   question_generation → gemini-2.0-flash first (faster, higher quota),
//                         gemini-2.5-flash as fallback, then Claude
//   everything else     → gemini-2.5-flash first (better quality),
//                         gemini-2.0-flash as fallback
//
// This prevents question generation from exhausting the gemini-2.5-flash
// free-tier quota (20 RPM) and starving answer-checking / Pip / extraction.
//
router.post("/ai/gemini-message", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;

  try {
    const { system, user, inlineData, stage = "unknown", max_tokens = 8192 } = req.body;
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

    const isQuestionGen = stage === "question_generation";

    // Question generation: gemini-2.0-flash → gemini-2.5-flash → Claude (failFast429 so
    //   rate-limited Gemini models are skipped immediately rather than waiting minutes).
    // Everything else:     gemini-2.5-flash → gemini-2.0-flash (with normal retries).
    const geminiModels: { model: string; label: string }[] = isQuestionGen
      ? [
          { model: "gemini-2.0-flash", label: "gemini-2.0-flash" },
          { model: "gemini-2.5-flash", label: "gemini-2.5-flash" },
        ]
      : [
          { model: "gemini-2.5-flash", label: "gemini-2.5-flash" },
          { model: "gemini-2.0-flash", label: "gemini-2.0-flash" },
        ];

    for (const { model, label } of geminiModels) {
      const result = await tryModel(model, { system: cleanSystem, parts, maxTokens }, { failFast429: isQuestionGen });
      if (result) {
        logUsage(userId, label, stage as Stage, result.usage?.promptTokenCount ?? 0, result.usage?.candidatesTokenCount ?? 0);
        res.json({ text: result.text });
        return;
      }
    }

    // Final fallback for question generation: Claude (separate quota, always available).
    if (isQuestionGen) {
      const claudeResult = await tryClaudeForQuestion({ system: cleanSystem, user: cleanUser, maxTokens });
      if (claudeResult) {
        logUsage(userId, "claude-fallback", stage as Stage, 0, 0);
        res.json({ text: claudeResult.text });
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
