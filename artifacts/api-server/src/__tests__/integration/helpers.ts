import type { Server } from "node:http";
import { createHash, randomBytes } from "node:crypto";

// These tests run the real Express app against a real Postgres.
// They are skipped unless DATABASE_URL is set (CI provides one).
export const hasDb = !!process.env.DATABASE_URL;

process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.ENCRYPTION_KEY ??= "0123456789abcdef0123456789abcdef";
process.env.ADMIN_PASSWORD ??= "test-admin-password";
process.env.NODE_ENV = "test";
// The AI client throws at import without this; no AI calls are made in tests.
process.env.GEMINI_API_KEY ??= "test";

export interface TestApp {
  base: string;
  server: Server;
  query: (text: string, params?: any[]) => Promise<any>;
  close: () => Promise<void>;
}

export async function startApp(): Promise<TestApp> {
  const { initDb, query } = await import("../../db.js");
  const { default: app } = await import("../../app.js");
  await initDb();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as any).port;
  return {
    base: `http://127.0.0.1:${port}/api`,
    server,
    query,
    close: () => new Promise((r) => server.close(() => r())),
  };
}

/** Minimal cookie-jar client. */
export class Client {
  cookie = "";
  constructor(public base: string, public ip = "10.0.0." + (1 + Math.floor(Math.random() * 250))) {}

  async req(method: string, path: string, body?: unknown) {
    const res = await fetch(this.base + path, {
      method,
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": this.ip,
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const pair = setCookie.split(";")[0];
      this.cookie = pair.endsWith("=") ? "" : pair;
    }
    let json: any = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, json, headers: res.headers };
  }
}

export function uniqueUser() {
  const id = randomBytes(4).toString("hex");
  return { username: "t_" + id, email: `t_${id}@utcportsmouth.org`, password: "Passw0rd" + id };
}

export const signupBody = (u: ReturnType<typeof uniqueUser>) => ({
  username: u.username, email: u.email, password: u.password, yearGroup: 11,
  optionSubjects: ["Geography", "Computer Science"],
});

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
