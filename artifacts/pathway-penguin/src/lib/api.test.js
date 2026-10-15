import { describe, it, expect } from "vitest";
import { parseJSON, batchedMap } from "./api.js";

describe("parseJSON (AI responses)", () => {
  it("parses plain and fenced JSON", () => {
    expect(parseJSON('{"a":1}')).toEqual({ a: 1 });
    expect(parseJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("ignores chatter before and after the JSON", () => {
    expect(parseJSON('Sure! Here you go:\n{"q":"2+2","marks":1}\nHope that helps.')).toEqual({ q: "2+2", marks: 1 });
    expect(parseJSON('Result: [1,2,3] done')).toEqual([1, 2, 3]);
  });
  it("is not confused by brackets inside strings", () => {
    expect(parseJSON('text {"a":"x } y","b":[1]} tail')).toEqual({ a: "x } y", b: [1] });
  });
  it("throws a clear error when there is no usable JSON", () => {
    expect(() => parseJSON("no json here")).toThrow("No JSON found");
    expect(() => parseJSON('{"a": 1, "b": ')).toThrow("Malformed JSON");
  });
});

describe("batchedMap", () => {
  it("keeps order and never exceeds the batch size", async () => {
    let running = 0, peak = 0;
    const out = await batchedMap([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      running++; peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]);
    expect(peak).toBeLessThanOrEqual(3);
  });
});
