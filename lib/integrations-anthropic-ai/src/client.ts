import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY must be set.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Retries 429/5xx/overloaded responses with backoff before giving up.
  maxRetries: 3,
  timeout: 60_000,
});
