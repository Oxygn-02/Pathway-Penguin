import { Router, type IRouter, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { acquireClaudeSlot, checkGeminiLimits, checkCombinedUserLimits } from "../lib/rateLimiter.js";
import { sanitizeUserInput, sanitizeSystemPrompt, validateInlineData } from "../lib/sanitize.js";
import { query } from "../db.js";

const router: IRouter = Router();

type Stage = "question_generation" | "answer_checking" | "material_processing" | "variant_generation" | "ask_pip" | "unknown";

/** Fire-and-forget usage log — never blocks the response. */
function logUsage(userId: number, provider: string, stage: Stage, inputTokens: number, outputTokens: number): void {
  query(
    "INSERT INTO ai_usage_log (user_id, ai_provider, stage, input_tokens, output_tokens) VALUES ($1, $2, $3, $4, $5)",
    [userId, provider, stage, inputTokens, outputTokens],
  ).catch(() => {});
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Extract text from a Gemini response, handling thinking-model responses
 * where `.text` may be a getter that returns undefined at low token budgets.
 */
function extractGeminiText(response: any): string {
  if (typeof response.text === "string" && response.text) return response.text;
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p: any) => p.text && !p.thought)
    .map((p: any) => p.text)
    .join("");
}

/**
 * Try Gemini 2.5 Flash with exponential-backoff retries on 503 (overloaded).
 * Returns null if unavailable so the caller can fall back to a smaller Gemini model.
 */
async function tryGemini(params: { system: string; parts: any[] }): Promise<{ text: string; usage: any } | null> {
  const DELAYS = [2000, 5000, 10000];
  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: params.parts }],
        config: { systemInstruction: params.system, maxOutputTokens: 8192 },
      });
      return { text: extractGeminiText(response), usage: response.usageMetadata };
    } catch (err: any) {
      const status = err?.status ?? 0;
      if (status === 503 && attempt < DELAYS.length) {
        await sleep(DELAYS[attempt]);
        continue;
      }
      console.warn(`Gemini attempt ${attempt + 1} failed (${status}) — trying smaller Gemini model`);
      return null;
    }
  }
  return null;
}

async function tryGeminiFallback(params: { system: string; parts: any[] }): Promise<{ text: string; usage: any } | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ role: "user", parts: params.parts }],
      config: { systemInstruction: params.system, maxOutputTokens: 8192 },
    });
    return { text: extractGeminiText(response), usage: response.usageMetadata };
  } catch {
    return null;
  }
}

/* ── POST /api/ai/message — Claude (question generation) ── */
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
    res.status(err?.status === 429 ? 429 : 500).json({
      error: err?.status === 429
        ? "Our question generator is busy right now, please try again in a moment."
        : "Question generation failed. Please try again.",
    });
  }
});

/* ── POST /api/ai/gemini-message — Gemini preferred, smaller Gemini fallback ── */
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
  if (geminiCheck === "global_limit") {
    res.status(429).json({ error: "Our systems are very busy right now. Please try again in a few minutes." });
    return;
  }

  try {
    const { system, user, inlineData, stage = "unknown" } = req.body;

    const inlineErr = validateInlineData(inlineData);
    if (inlineErr) { res.status(400).json({ error: inlineErr }); return; }

    const cleanSystem = sanitizeSystemPrompt(system);
    const cleanUser   = sanitizeUserInput(user, 20_000);

    const parts: any[] = [];
    if (inlineData) parts.push({ inlineData });
    parts.push({ text: cleanUser });

    const geminiResult = geminiCheck === "ok"
      ? await tryGemini({ system: cleanSystem, parts })
      : null;

    if (geminiResult) {
      logUsage(userId, "gemini", stage as Stage,
        geminiResult.usage?.promptTokenCount ?? 0,
        geminiResult.usage?.candidatesTokenCount ?? 0);
      console.log(`Gemini OK stage=${stage}`);
      res.json({ text: geminiResult.text });
      return;
    }

    const fallbackResult = geminiCheck === "ok"
      ? await tryGeminiFallback({ system: cleanSystem, parts })
      : null;

    if (fallbackResult) {
      logUsage(userId, "gemini-fallback", stage as Stage,
        fallbackResult.usage?.promptTokenCount ?? 0,
        fallbackResult.usage?.candidatesTokenCount ?? 0);
      console.log(`Gemini fallback OK stage=${stage}`);
      res.json({ text: fallbackResult.text });
      return;
    }

    res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
  } catch (err: any) {
    console.error("AI error:", err?.status, err?.message?.slice(0, 200));
    res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
  }
});

export default router;
