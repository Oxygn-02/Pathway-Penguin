import { describe, it, expect } from "vitest";
import { passwordError } from "../lib/passwordPolicy.js";

describe("passwordError", () => {
  it("accepts a reasonable password", () => {
    expect(passwordError("blue-kettle-42")).toBeNull();
  });
  it("rejects short, digit-less, letter-less and over-long passwords", () => {
    expect(passwordError("short1a")).toMatch(/at least 10/);
    expect(passwordError("onlyletterslong")).toMatch(/number/);
    expect(passwordError("1234567890123")).toMatch(/letter/);
    expect(passwordError("a1".repeat(40))).toMatch(/too long/);
    expect(passwordError(undefined)).toMatch(/at least 10/);
  });
  it("rejects common passwords and repeated characters", () => {
    expect(passwordError("Password123")).toMatch(/common/);
    expect(passwordError("QWERTYUIOP1")).toMatch(/common/);
    expect(passwordError("aaaaaaaaaaaa")).toMatch(/easy to guess/);
  });
  it("rejects passwords containing the username or email name", () => {
    expect(passwordError("kane_cyrus-2026", { username: "kane_cyrus" })).toMatch(/username/);
    expect(passwordError("jsmithrocks99", { email: "jsmith@utcportsmouth.org" })).toMatch(/email/);
  });
});
