import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY is the standard variable. ANTHROPIC_BASE_URL is optional
// (only needed to route through a proxy).
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY must be set.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
});
