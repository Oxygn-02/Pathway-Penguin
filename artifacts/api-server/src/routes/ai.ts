import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.post("/ai/message", async (req, res) => {
  try {
    const { system, user, max_tokens = 4096, documents = [] } = req.body;

    const content: any[] = [];
    if (documents && documents.length > 0) {
      documents.forEach((doc: any) => content.push(doc));
    }
    content.push({ type: "text", text: user });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens,
      system,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ text, usage: message.usage ?? null });
  } catch (err: any) {
    console.error("AI message error:", err);
    res.status(500).json({ error: err.message || "AI request failed" });
  }
});

router.post("/ai/gemini-message", async (req, res) => {
  try {
    const { system, user, inlineData } = req.body;

    const parts: any[] = [];
    if (inlineData) {
      parts.push({ inlineData });
    }
    parts.push({ text: user });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: system,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text ?? "";
    res.json({ text });
  } catch (err: any) {
    console.error("Gemini message error:", err);
    res.status(500).json({ error: err.message || "Gemini request failed" });
  }
});

export default router;
