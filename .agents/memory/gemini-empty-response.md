---
name: Gemini empty-response bug
description: tryModel returned a truthy object with empty text when Gemini thinking tokens were filtered, silently blocking the Claude fallback.
---

## The rule
`tryModel` in `ai.ts` MUST return `null` whenever `extractGeminiText` produces empty or whitespace-only text. Returning `{ text: "" }` is truthy and the caller treats it as success, so Claude fallback never fires.

**Why:** gemini-2.5-flash may emit only "thought" parts (thinking tokens). `extractGeminiText` filters those out, leaving `""`. If `tryModel` returns `{ text: "" }`, the `/api/ai/gemini-message` route returns `{ text: "" }` to the frontend. The frontend's `parseJSON("")` throws, the question fails, but the server never logs an error — making this very hard to diagnose.

**How to apply:** After calling `extractGeminiText`, check `if (!text || !text.trim()) return null;` before returning the result object. The warning log `[model] empty response text — falling through to next model` makes it visible in server logs.
