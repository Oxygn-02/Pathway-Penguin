import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  userId: number;
  username: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = (req as any).cookies?.pp_session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) { res.status(500).json({ error: "Server configuration error" }); return; }
    const payload = jwt.verify(token, secret) as AuthUser;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
