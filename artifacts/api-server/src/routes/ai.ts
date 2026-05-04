import { Router, type IRouter, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { acquireClaudeSlot, checkGeminiLimits, checkCombinedUserLimits } from "../lib/rateLimiter.js";
import { sanitizeUserInput, sanitizeSystemPrompt, validateInlineData } from "../lib/sanitize.js";
import { query } from "../db.js";

const router: IRouter = Router();

type Stage = "question_generation" | "answer_checking" | "material_processing" | "variant_generation" | "ask_pip" | "unknown";

// Model cascade: try primary first, fall back if temporarily unavailable
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite"];

/** Fire-and-forget usage log — never blocks the response. */
function logUsage(userId: number, provider: string, stage: Stage, inputTokens: number, outputTokens: number): void {
  query(
    "INSERT INTO ai_usage_log (user_id, ai_provider, stage, input_tokens, output_tokens) VALUES ($1, $2, $3, $4, $5)",
    [userId, provider, stage, inputTokens, outputTokens],
  ).catch(() => {});
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Extract text from a Gemini response object, handling both regular and
 * thinking-mode responses where `.text` may be a getter.
 */
function extractGeminiText(response: any): string {
  if (typeof response.text === "string") return response.text;
  // Fallback: pull from candidates directly
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p: any) => p.text && !p.thought)
    .map((p: any) => p.text)
    .join("") ?? "";
}

/**
 * Call Gemini with automatic model fallback and retry on transient errors.
 * Tries each model in GEMINI_MODELS in order; retries 503 once before moving on.
 */
async function callGemini(params: {
  system: string;
  parts: any[];
}): Promise<{ text: string; model: string; usage: any }> {
  const errors: string[] = [];

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: params.parts }],
          config: {
            systemInstruction: params.system,
            maxOutputTokens: 8192,
          },
        });
        const text = extractGeminiText(response);
        return { text, model, usage: response.usageMetadata };
      } catch (err: any) {
        const status = err?.status ?? err?.code ?? 0;
        // 503 (overloaded) or network error: wait and retry once, then try next model
        if (status === 503 || status === 0) {
          if (attempt === 0) {
            await sleep(3000);
            continue;
          }
          errors.push(`${model}: temporarily unavailable (${status})`);
          break;
        }
        // 429 from Google: propagate so caller can return the right HTTP status
        if (status === 429) throw err;
        // Any other error: don't retry this model
        errors.push(`${model}: error ${status}`);
        break;
      }
    }
  }

  throw new Error(`All Gemini models unavailable: ${errors.join("; ")}`);
}

/* ── POST /api/ai/message — Claude (question generation only) ── */
router.post("/ai/message", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;

  const combined = checkCombinedUserLimits(userId);
  if (combined !== "ok") {
    const msg = combined === "day_limit"
      ? "You've reached your daily study limit — great work today! Come back tomorrow."
      : "You're going very fast! Please slow down for a moment.";
    res.status(429).json({ error: msg });
    return;
  }

  try {
    const { system, user, max_tokens = 4096, documents = [], stage = "question_generation" } = req.body;

    const cleanSystem = sanitizeSystemPrompt(system);
    const cleanUser   = sanitizeUserInput(user, 20_000);

    const acquired = await acquireClaudeSlot();
    if (!acquired) {
      res.status(429).json({ error: "Our question generator is busy right now, please try again in a moment." });
      return;
    }

    const content: any[] = [];
    if (Array.isArray(documents) && documents.length > 0) {
      documents.forEach((doc: any) => content.push(doc));
    }
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
    if (err?.status === 429) {
      res.status(429).json({ error: "Our question generator is busy right now, please try again in a moment." });
    } else {
      res.status(500).json({ error: "Question generation failed. Please try again." });
    }
  }
});

/* ── POST /api/ai/gemini-message — Gemini (everything else) ──── */
router.post("/ai/gemini-message", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;

  const combined = checkCombinedUserLimits(userId);
  if (combined !== "ok") {
    const msg = combined === "day_limit"
      ? "You've reached your daily study limit — great work today! Come back tomorrow."
      : "You're going very fast! Please slow down for a moment.";
    res.status(429).json({ error: msg });
    return;
  }

  const geminiCheck = checkGeminiLimits(userId);
  if (geminiCheck === "user_limit") {
    res.status(429).json({ error: "You've been very busy studying! Take a short break and come back in a moment." });
    return;
  }
  if (geminiCheck === "global_limit") {
    res.status(429).json({ error: "Our systems are very busy right now. Please try again in a few minutes." });
    return;
  }

  try {
    const { system, user, inlineData, stage = "unknown" } = req.body;

    const inlineErr = validateInlineData(inlineData);
    if (inlineErr) {
      res.status(400).json({ error: inlineErr });
      return;
    }

    const cleanSystem = sanitizeSystemPrompt(system);
    const cleanUser   = sanitizeUserInput(user, 20_000);

    const parts: any[] = [];
    if (inlineData) parts.push({ inlineData });
    parts.push({ text: cleanUser });

    const { text, model, usage } = await callGemini({ system: cleanSystem, parts });

    logUsage(
      userId,
      "gemini",
      stage as Stage,
      usage?.promptTokenCount ?? 0,
      usage?.candidatesTokenCount ?? 0,
    );

    console.log(`Gemini [${model}] stage=${stage} tokens=${usage?.totalTokenCount ?? "?"}`);
    res.json({ text });
  } catch (err: any) {
    const status = err?.status ?? err?.code ?? 0;
    console.error("Gemini error:", status, err?.message?.slice(0, 200));
    if (status === 429) {
      // Google free-tier quota exhausted — not the user's fault
      res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
    } else {
      res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
    }
  }
});

export default router;
