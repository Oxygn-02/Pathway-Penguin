import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

export default app;
