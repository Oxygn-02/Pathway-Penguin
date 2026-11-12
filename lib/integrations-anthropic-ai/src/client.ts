import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** True when ANTHROPIC_API_KEY is set. The app starts and runs without it; only AI features are off. */
export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Lazily builds the client so a missing key never crashes server start-up. Throws only when AI is actually used. */
export function getAnthropic(): Anthropic {
  if (!isAnthropicConfigured()) {
    throw new Error("ANTHROPIC_API_KEY must be set.");
  }
  client ??= new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    // Retries 429/5xx/overloaded responses with backoff before giving up.
    maxRetries: 3,
    timeout: 60_000,
  });
  return client;
}
