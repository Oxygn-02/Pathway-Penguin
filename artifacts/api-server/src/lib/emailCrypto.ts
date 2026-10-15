import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/* ── Email encryption (AES-256-CBC) ──────────────────────────── */
function getEncKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
  return Buffer.from(key, "utf8");
}

export function encryptEmail(email: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(email, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptEmail(stored: string): string {
  const [ivHex, encHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", getEncKey(), iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}


/**
 * Deterministic keyed hash of an email address, used to detect an address that is
 * already registered (the encrypted value uses a random IV, so it can't be compared).
 */
export function emailHash(email: string): string {
  return createHmac("sha256", getEncKey()).update(email.trim().toLowerCase()).digest("hex");
}
