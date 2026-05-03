import { GoogleGenAI } from "@google/genai";

// Prefer a direct Gemini API key (GEMINI_API_KEY) when present — used as a
// fallback when the Replit AI Integrations proxy is unavailable or rejecting
// requests. Otherwise fall back to the Replit-provisioned proxy credentials.
const directKey = process.env.GEMINI_API_KEY;

if (!directKey) {
  if (!process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
    throw new Error(
      "AI_INTEGRATIONS_GEMINI_BASE_URL must be set. Did you forget to provision the Gemini AI integration?",
    );
  }

  if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
    throw new Error(
      "AI_INTEGRATIONS_GEMINI_API_KEY must be set. Did you forget to provision the Gemini AI integration?",
    );
  }
}

export const ai = directKey
  ? new GoogleGenAI({ apiKey: directKey })
  : new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
