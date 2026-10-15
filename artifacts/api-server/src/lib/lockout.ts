/**
 * Small in-memory failure counter used to throttle brute-force attempts
 * (logins, password-reset requests). State resets on restart, which is fine
 * for a single instance; use a shared store if you ever run several.
 */
export interface Lockout {
  /** Seconds until the key may try again, or 0 if it is not locked. */
  retryAfter(key: string, now?: number): number;
  /** Record a failed attempt. */
  fail(key: string, now?: number): void;
  /** Clear a key (e.g. after a successful login). */
  reset(key: string): void;
}

export function createLockout(max: number, windowMs: number): Lockout {
  const entries = new Map<string, { count: number; first: number }>();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of entries) if (now - v.first > windowMs) entries.delete(k);
  }, windowMs);
  timer.unref();

  return {
    retryAfter(key, now = Date.now()) {
      const e = entries.get(key);
      if (!e) return 0;
      if (now - e.first > windowMs) { entries.delete(key); return 0; }
      return e.count >= max ? Math.ceil((e.first + windowMs - now) / 1000) : 0;
    },
    fail(key, now = Date.now()) {
      const e = entries.get(key);
      if (!e || now - e.first > windowMs) entries.set(key, { count: 1, first: now });
      else e.count++;
    },
    reset(key) { entries.delete(key); },
  };
}
