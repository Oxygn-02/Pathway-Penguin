import type { Response } from "express";

/** Log the real error server-side and send a generic message to the client. */
export function serverError(res: Response, err: unknown, label: string, message = "Something went wrong. Please try again."): void {
  console.error(`${label}:`, err);
  if (!res.headersSent) res.status(500).json({ error: message });
}
