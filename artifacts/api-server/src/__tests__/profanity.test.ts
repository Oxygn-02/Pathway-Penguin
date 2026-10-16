import { describe, it, expect } from "vitest";
import { containsProfanity } from "../lib/profanity.js";

describe("containsProfanity", () => {
  it("blocks rude names", () => {
    for (const n of ["fuck123", "ShitHead", "big_ass", "dick_99", "xXbitchXx"]) expect(containsProfanity(n)).toBe(true);
  });
  it("allows ordinary names that merely contain short rude fragments", () => {
    for (const n of ["class_of_2026", "assist", "Dickinson", "bass_player", "Cockburn1", "passport", "Pathway_Penguin"]) expect(containsProfanity(n)).toBe(false);
  });
});
