import { afterEach, describe, expect, it } from "vitest";
import { getAnthropic, isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";

const original = process.env.ANTHROPIC_API_KEY;
afterEach(() => {
  if (original === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = original;
});

describe("anthropic client", () => {
  it("reports unconfigured without a key, and only throws when used", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(isAnthropicConfigured()).toBe(false);
    expect(() => getAnthropic()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("builds a client once a key is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(isAnthropicConfigured()).toBe(true);
    expect(getAnthropic()).toBeTruthy();
  });
});
