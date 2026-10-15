import { describe, it, expect } from "vitest";
import { checkCombinedUserLimits } from "../lib/rateLimiter.js";

describe("checkCombinedUserLimits", () => {
  it("allows normal bursts (a full pathway generation)", () => {
    const t = 1_000_000;
    for (let i = 0; i < 100; i++) expect(checkCombinedUserLimits(1, t)).toBe("ok");
  });

  it("blocks after the per-minute limit and recovers after a minute", () => {
    const t = 5_000_000;
    for (let i = 0; i < 120; i++) expect(checkCombinedUserLimits(2, t)).toBe("ok");
    expect(checkCombinedUserLimits(2, t)).toBe("minute_limit");
    expect(checkCombinedUserLimits(2, t + 61_000)).toBe("ok");
  });

  it("tracks users independently", () => {
    const t = 9_000_000;
    for (let i = 0; i < 120; i++) checkCombinedUserLimits(3, t);
    expect(checkCombinedUserLimits(3, t)).toBe("minute_limit");
    expect(checkCombinedUserLimits(4, t)).toBe("ok");
  });
});
