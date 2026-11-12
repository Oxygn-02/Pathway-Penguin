import { Router, type IRouter, type Request, type Response } from "express";
import { getAnthropic, isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { aiRateLimit } from "../lib/rateLimiter.js";
import { sanitizeUserInput, sanitizeSourceContent } from "../lib/sanitize.js";
import {
  QUESTIONS, getQuestionSpec, buildMarkingPrompt, parseMarkingResponse, MarkingParseError,
} from "../lib/aqaEnglish.js";
import { query } from "../db.js";

const router: IRouter = Router();
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";

/* ── GET /api/marking/english/questions ── question types and their marks/AOs/levels ── */
router.get("/marking/english/questions", requireAuth, (_req: Request, res: Response) => {
  res.json({
    board: "AQA",
    questions: QUESTIONS.map((q) => ({
      id: q.id, qualification: q.qualification, paper: q.paper, title: q.title, marks: q.marks,
      kind: q.kind, needsSource: q.needsSource,
      aos: q.aos.map((a) => ({ ao: a.ao, marks: a.marks })),
      levels: q.bands.map((b) => ({ level: b.level, min: b.min, max: b.max, label: b.label })),
    })),
  });
});

/* ── POST /api/marking/english ── mark one answer against the AQA scheme ── */
router.post("/marking/english", requireAuth, aiRateLimit, async (req: Request, res: Response) => {
  const { userId } = (req as any).user as AuthUser;
  const { questionType, question, answer, source } = req.body ?? {};

  if (!isAnthropicConfigured()) {
    res.status(503).json({ error: "Pip's AI isn't switched on yet. Please check back soon.", code: "ai_not_configured" });
    return;
  }

  const spec = getQuestionSpec(questionType);
  if (!spec) { res.status(400).json({ error: "Unknown question type." }); return; }

  const cleanQuestion = sanitizeUserInput(question, 2_000);
  const cleanAnswer = sanitizeUserInput(answer, 12_000);
  if (!cleanQuestion.trim()) { res.status(400).json({ error: "question is required." }); return; }
  if (cleanAnswer.trim().length < 3) { res.status(400).json({ error: "answer is required." }); return; }
  const cleanSource = source ? sanitizeSourceContent(source).slice(0, 20_000) : "";
  if (spec.needsSource && !cleanSource.trim()) {
    res.status(400).json({ error: "This question type needs the source text." });
    return;
  }

  try {
    const { system, user } = buildMarkingPrompt(spec, { question: cleanQuestion, answer: cleanAnswer, source: cleanSource || undefined });
    const message = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: [{ type: "text", text: user }] }],
    });
    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

    query(
      "INSERT INTO ai_usage_log (user_id, ai_provider, stage, input_tokens, output_tokens) VALUES ($1, $2, $3, $4, $5)",
      [userId, MODEL, "answer_checking", message.usage?.input_tokens ?? 0, message.usage?.output_tokens ?? 0],
    ).catch(() => {});

    res.json(parseMarkingResponse(text, spec));
  } catch (err: any) {
    if (err instanceof MarkingParseError) {
      console.warn("Marking reply could not be read:", err.message);
      res.status(502).json({ error: "Pip couldn't mark that one. Please try again." });
      return;
    }
    console.error("Marking route error:", err?.status, err?.message?.slice(0, 200));
    res.status(503).json({ error: "AI is a bit busy right now — please try again in a moment." });
  }
});

export default router;
