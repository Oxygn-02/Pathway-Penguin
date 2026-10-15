import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

export interface AuthUser {
  userId: number;
  username: string;
  sid: string;
}

/**
 * Requires a valid session cookie whose session id still exists in the
 * `sessions` table, so logging out or resetting a password revokes it.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = (req as any).cookies?.pp_session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: "Server configuration error" }); return; }

  let payload: AuthUser;
  try {
    payload = jwt.verify(token, secret) as AuthUser;
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  if (!payload.sid) {
    res.status(401).json({ error: "Please log in again." });
    return;
  }

  try {
    const r = await query(
      "SELECT 1 FROM sessions WHERE id = $1 AND user_id = $2 AND expires_at > NOW()",
      [payload.sid, payload.userId],
    );
    if (r.rowCount === 0) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
  } catch (e) {
    console.error("Session lookup failed:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
    return;
  }

  (req as any).user = payload;
  next();
}
