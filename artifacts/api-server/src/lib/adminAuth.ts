import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

// Failed-attempt tracking per client IP (in-memory; resets on restart).
const failures = new Map<string, { count: number; first: number }>();

function digest(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

/**
 * Check the admin password supplied in the request body or the
 * `x-admin-password` header against the ADMIN_PASSWORD env var.
 *
 * Returns true when authorised. Otherwise it sends the error response itself
 * and returns false. Fails closed when ADMIN_PASSWORD is not configured.
 */
export function checkAdmin(req: Request, res: Response): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(503).json({ error: "Admin access is not configured." });
    return false;
  }

  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const rec = failures.get(ip);
  if (rec && now - rec.first > WINDOW_MS) failures.delete(ip);
  const current = failures.get(ip);
  if (current && current.count >= MAX_FAILURES) {
    res.status(429).json({ error: "Too many attempts. Try again later." });
    return false;
  }

  const supplied =
    (typeof req.body?.password === "string" ? req.body.password : undefined) ??
    (typeof req.headers["x-admin-password"] === "string" ? req.headers["x-admin-password"] : "");

  if (timingSafeEqual(digest(supplied), digest(expected))) {
    failures.delete(ip);
    return true;
  }

  failures.set(ip, { count: (current?.count ?? 0) + 1, first: current?.first ?? now });
  res.status(403).json({ error: "Incorrect password." });
  return false;
}
