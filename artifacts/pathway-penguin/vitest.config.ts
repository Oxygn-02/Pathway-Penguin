import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vite.config.ts, which requires PORT/BASE_PATH to be set.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.{js,jsx,ts}"] },
});
