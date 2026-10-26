import { Router, type IRouter, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { aiRateLimit } from "../lib/rateLimiter.js";
import { sanitizeUserInput, sanitizeSystemPrompt, validateInlineData, normaliseStage } from "../lib/sanitize.js";
import { query } from "../db.js";

const router: IRouter = Router();

/** Override with CLAUDE_MODEL to try another Claude model without a code change. */
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";

type Stage = ReturnType<typeof normaliseStage>;

/** Fire-and-forget usage log — never blocks the response. */
function logUsage(userId: number, stage: Stage, inputTokens: number, outputTokens: number): void {
  query(
    "INSERT INTO ai_usage_log (user_id, ai_provider, stage, input_tokens, output_tokens) VALUES ($1, $2, $3, $4, $5)",
    [userId, MODEL, stage, inputTokens, outputTokens],
  ).catch(() => {});
}

/* ── POST /api/ai/message ── */
router.post("/ai/message", requireAuth, aiRateLimit, async (req: Request, res: Response) => {
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

    // Rebuild the content from known fields only, so nothing arbitrary reaches the model.
    const content: any[] = [];
    if (inlineData) {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: inlineData.data } });
    }
    content.push({ type: "text", text: cleanUser });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: cleanSystem,
      messages: [{ role: "user", content }],
    });

    const text = message.content.filter((b) => b.type === "text").map((b: any) => b.text).join("");
    if (!text.trim()) {
      console.warn(`[${MODEL}] empty response (stop_reason: ${message.stop_reason})`);
      res.status(503).json({ error: "The AI sent back an empty reply. Please try again." });
      return;
    }

    logUsage(userId, stage, message.usage?.input_tokens ?? 0, message.usage?.output_tokens ?? 0);
    res.json({ text, usage: { input_tokens: message.usage?.input_tokens ?? 0, output_tokens: message.usage?.output_tokens ?? 0 } });
  } catch (err: any) {
    console.error("AI route error:", err?.status, err?.message?.slice(0, 200));
    res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
  }
});

export default router;
