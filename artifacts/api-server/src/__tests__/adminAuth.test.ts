import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkAdmin } from "../lib/adminAuth.js";

function fakeRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: unknown) => { res.body = b; return res; };
  return res;
}
const req = (password?: string, ip = "1.1.1.1"): any => ({ ip, body: password === undefined ? {} : { password }, headers: {} });

describe("checkAdmin", () => {
  beforeEach(() => { process.env.ADMIN_PASSWORD = "correct-horse"; });
  afterEach(() => { delete process.env.ADMIN_PASSWORD; });

  it("accepts the right password", () => {
    expect(checkAdmin(req("correct-horse", "2.2.2.2"), fakeRes())).toBe(true);
  });

  it("rejects a wrong or missing password with 403", () => {
    const res = fakeRes();
    expect(checkAdmin(req("nope", "3.3.3.3"), res)).toBe(false);
    expect(res.statusCode).toBe(403);
    const res2 = fakeRes();
    expect(checkAdmin(req(undefined, "3.3.3.4"), res2)).toBe(false);
    expect(res2.statusCode).toBe(403);
  });

  it("fails closed when ADMIN_PASSWORD is not set", () => {
    delete process.env.ADMIN_PASSWORD;
    const res = fakeRes();
    expect(checkAdmin(req("", "4.4.4.4"), res)).toBe(false);
    expect(res.statusCode).toBe(503);
  });

  it("locks out an IP after repeated failures, even for the right password", () => {
    for (let i = 0; i < 5; i++) checkAdmin(req("bad", "5.5.5.5"), fakeRes());
    const res = fakeRes();
    expect(checkAdmin(req("correct-horse", "5.5.5.5"), res)).toBe(false);
    expect(res.statusCode).toBe(429);
  });
});
