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

/* ── POST /api/ai/message — Claude (question generation only) ── */
router.post("/ai/message", requireAuth, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;

  // 1. Combined per-user guard
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

    // 2. Global Claude token-bucket — queue if full, reject if queue is full
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

  // 1. Combined per-user guard
  const combined = checkCombinedUserLimits(userId);
  if (combined !== "ok") {
    const msg = combined === "day_limit"
      ? "You've reached your daily study limit — great work today! Come back tomorrow."
      : "You're going very fast! Please slow down for a moment.";
    res.status(429).json({ error: msg });
    return;
  }

  // 2. Gemini sliding-window guards
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

    // 3. Validate uploaded file (inlineData) if present
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: cleanSystem,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text ?? "";
    logUsage(
      userId,
      "gemini",
      stage as Stage,
      response.usageMetadata?.promptTokenCount ?? 0,
      response.usageMetadata?.candidatesTokenCount ?? 0,
    );

    res.json({ text });
  } catch (err: any) {
    console.error("Gemini error:", err?.status, err?.message);
    if (err?.status === 429) {
      res.status(429).json({ error: "You've been very busy studying! Take a short break and come back in a moment." });
    } else {
      res.status(500).json({ error: "AI request failed. Please try again." });
    }
  }
});

export default router;
