import { GoogleGenAI } from "@google/genai";

const directKey = process.env.GEMINI_API_KEY;
const proxyKey  = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const proxyUrl  = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

if (!directKey && (!proxyKey || !proxyUrl)) {
  throw new Error(
    "Gemini credentials missing. Set GEMINI_API_KEY (direct) or both AI_INTEGRATIONS_GEMINI_API_KEY and AI_INTEGRATIONS_GEMINI_BASE_URL (Replit proxy).",
  );
}

export const ai = directKey
  ? new GoogleGenAI({ apiKey: directKey })
  : new GoogleGenAI({
      apiKey: proxyKey!,
      httpOptions: { apiVersion: "", baseUrl: proxyUrl! },
    });
