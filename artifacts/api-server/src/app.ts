import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import router from "./routes/index.js";

const app: Express = express();

// Behind a reverse proxy (Replit/Render): use the real client IP for rate limiting.
app.set("trust proxy", 1);

// The frontend is served same-origin, so CORS is only needed for explicitly
// allowed origins (comma-separated in CORS_ALLOWED_ORIGINS). Without that,
// cross-origin requests are not granted credentialed access. In development,
// localhost origins are allowed so a separate dev server still works.
const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== "production";

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // same-origin / non-browser requests
    if (allowed.includes(origin)) return cb(null, true);
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(helmet());
app.use(cookieParser());

// Only the AI routes accept large bodies (base64 PDFs up to ~20 MB). This parser
// must run first: once a body is parsed, later parsers skip the request.
app.use("/api/ai", express.json({ limit: "30mb" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Unknown API routes and uncaught errors: JSON, never stack traces.
app.use("/api", (_req, res) => { res.status(404).json({ error: "Not found." }); });
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.type === "entity.too.large") { res.status(413).json({ error: "That upload is too large." }); return; }
  if (err?.type === "entity.parse.failed") { res.status(400).json({ error: "Invalid request." }); return; }
  console.error("Unhandled error:", err);
  if (!res.headersSent) res.status(500).json({ error: "Something went wrong. Please try again." });
});

export default app;
