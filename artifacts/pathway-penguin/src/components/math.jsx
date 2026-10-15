import { useState } from "react";
import katex from "katex";
import { FONT, MATH_KB_EXPRESSIONS, MATH_KB_SYMBOLS } from "../constants.js";

/* ── Math renderer helpers ──────────────────────────────────── */
export function renderKatex(expr, displayMode) {
  try {
    return katex.renderToString(expr, { throwOnError: false, displayMode, output: "html" });
  } catch {
    return expr;
  }
}

export function renderRich(str, keyPrefix) {
  if (!str) return null;
  const parts = [];
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|`[^`]+`|\*\*[^\*]+\*\*)/g;
  let last = 0, m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: str.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("$$")) parts.push({ type: "math-block", content: tok.slice(2, -2) });
    else if (tok.startsWith("$")) parts.push({ type: "math-inline", content: tok.slice(1, -1) });
    else if (tok.startsWith("`")) parts.push({ type: "code", content: tok.slice(1, -1) });
    else if (tok.startsWith("**")) parts.push({ type: "bold", content: tok.slice(2, -2) });
    last = m.index + tok.length;
  }
  if (last < str.length) parts.push({ type: "text", content: str.slice(last) });
  const prefix = keyPrefix ?? Math.random().toString(36).slice(2);
  return parts.map((p, i) => {
    const key = `${prefix}-${i}`;
    if (p.type === "math-block") return <span key={key} dangerouslySetInnerHTML={{ __html: renderKatex(p.content, true) }} style={{ display: "block", textAlign: "center", margin: "6px 0" }} />;
    if (p.type === "math-inline") return <span key={key} dangerouslySetInnerHTML={{ __html: renderKatex(p.content, false) }} />;
    if (p.type === "code") return <code key={key} style={{ fontFamily: "monospace", background: "rgba(91,174,212,0.12)", borderRadius: 4, padding: "1px 5px", fontSize: 13, color: "#1a3a5f" }}>{p.content}</code>;
    if (p.type === "bold") return <strong key={key} style={{ fontWeight: 700, color: "#1a3a4f" }}>{p.content}</strong>;
    return p.content;
  });
}

/* ── Math answer input — rendered overlay over transparent textarea ─── */
// The rendered div controls height and shows KaTeX; the absolutely-positioned
// textarea (transparent text, visible caret) captures all keystrokes.
export function MathAnswerInput({ value, onChange, disabled, placeholder, onKeyDown, refCallback, borderColor, fontSize = 14.5, minHeight = 52, background = "white" }) {
  const [focused, setFocused] = useState(false);
  const hasContent = !!(value && value.length);
  const hasLatex = /\$/.test(value);
  return (
    <div>
      <div style={{ position: "relative", borderRadius: 12, border: `1.5px solid ${borderColor}`, boxSizing: "border-box", transition: "border-color 0.2s", background }}>
        {/* Rendered layer — drives the container height */}
        <div
          aria-hidden="true"
          style={{ padding: "10px 13px", minHeight, fontFamily: FONT, fontSize, lineHeight: 1.6, color: "#1a3a4f", whiteSpace: "pre-wrap", wordBreak: "break-word", boxSizing: "border-box", userSelect: "none", pointerEvents: "none" }}
        >
          {hasContent ? renderRich(value) : <span style={{ color: "transparent" }}>{"A"}</span>}
          {"\u200b"}
        </div>
        {/* Placeholder */}
        {!hasContent && placeholder && (
          <div style={{ position: "absolute", top: "10px", left: "14px", fontFamily: FONT, fontSize, lineHeight: 1.6, color: "#b0c8d8", pointerEvents: "none", zIndex: 0 }}>
            {placeholder}
          </div>
        )}
        {/* Transparent textarea — receives all input */}
        <textarea
          ref={refCallback}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: "10px 13px", fontFamily: FONT, fontSize, lineHeight: 1.6, background: "transparent", border: "none", outline: "none", color: "transparent", caretColor: disabled ? "transparent" : "#2d5a7a", resize: "none", boxSizing: "border-box", overflow: "hidden", zIndex: 1 }}
        />
      </div>
      {/* LaTeX preview — appears while focused and there is LaTeX content */}
      {focused && hasContent && hasLatex && (
        <div style={{ marginTop: 6, padding: "7px 12px", background: "rgba(218,238,250,0.35)", borderRadius: 10, border: "1.5px solid rgba(180,220,240,0.5)", fontFamily: FONT, fontSize, lineHeight: 1.7, color: "#1a3a4f", wordBreak: "break-word" }}>
          <span style={{ display: "block", fontFamily: FONT, fontWeight: 700, fontSize: 10, color: "#7eadd8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Preview</span>
          {renderRich(value, "latexprev")}
        </div>
      )}
    </div>
  );
}

export function MathsKeyboard({ textareaRef, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);

  function handleInsert(sym) {
    const el = textareaRef?.current;
    const ins = sym.insert;
    const cursorBack = sym.cursorBack ?? 0;
    if (!el) {
      onChange(value + ins);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newVal = value.slice(0, start) + ins + value.slice(end);
    onChange(newVal);
    const cursorPos = start + ins.length - cursorBack;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorPos, cursorPos);
    });
  }

  const hasMath = /\$/.test(value);

  return (
    <div style={{ marginTop: 3 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, border: "1.5px solid rgba(126,173,216,0.4)", background: open ? "rgba(126,173,216,0.12)" : "white", fontFamily: FONT, fontWeight: 600, fontSize: 12, color: "#4a8cbf", cursor: "pointer", lineHeight: 1.4 }}
        >
          Symbols {open ? "▴" : "▾"}
        </button>
        <button
          type="button"
          onClick={() => setExpOpen((o) => !o)}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, border: "1.5px solid rgba(126,173,216,0.4)", background: expOpen ? "rgba(126,173,216,0.12)" : "white", fontFamily: FONT, fontWeight: 600, fontSize: 12, color: "#4a8cbf", cursor: "pointer", lineHeight: 1.4 }}
        >
          Expressions {expOpen ? "▴" : "▾"}
        </button>
      </div>

      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "7px 8px", marginTop: 4, background: "rgba(218,238,250,0.35)", borderRadius: 10, border: "1.5px solid rgba(180,220,240,0.45)" }}>
          {MATH_KB_SYMBOLS.map((sym) => (
            <button
              key={sym.insert + sym.label}
              type="button"
              title={sym.title}
              onMouseDown={(e) => { e.preventDefault(); handleInsert(sym); }}
              style={{ padding: "4px 9px", borderRadius: 7, border: "1.5px solid rgba(126,173,216,0.3)", background: "white", fontFamily: "KaTeX_Math, Georgia, serif", fontSize: 14, color: "#1a3a4f", cursor: "pointer", lineHeight: 1.3, minWidth: 32, textAlign: "center" }}
            >
              {sym.label}
            </button>
          ))}
        </div>
      )}

      {expOpen && (
        <div style={{ marginTop: 4, background: "rgba(218,238,250,0.35)", borderRadius: 10, border: "1.5px solid rgba(180,220,240,0.45)", padding: "8px 10px" }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: "#7eadd8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Click a template — the cursor will land on the first argument
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {MATH_KB_EXPRESSIONS.map((expr) => (
              <button
                key={expr.title}
                type="button"
                title={expr.title}
                onMouseDown={(e) => { e.preventDefault(); handleInsert(expr); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 10px", borderRadius: 8, border: "1.5px solid rgba(126,173,216,0.35)", background: "white", cursor: "pointer", minWidth: 54, transition: "background 0.12s, border-color 0.12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(126,173,216,0.1)"; e.currentTarget.style.borderColor = "rgba(126,173,216,0.7)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "rgba(126,173,216,0.35)"; }}
              >
                <span style={{ fontFamily: "KaTeX_Math, Georgia, serif", fontSize: 14, color: "#1a3a4f", lineHeight: 1.3 }}>{expr.label}</span>
                <span style={{ fontFamily: FONT, fontSize: 9, color: "#7eadd8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{expr.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Bold text renderer ─────────────────────────────────────── */
export function BoldText({ text }) {
  if (!text) return null;
  return <span>{renderRich(text, "bt")}</span>;
}

/* ── Question text renderer ───────────────────────────────────── */
export function QuestionText({ text }) {
  // Split on triple-backtick code fences (```lang\ncode```)
  const segments = [];
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = fenceRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "prose", content: text.slice(last, m.index) });
    segments.push({ type: "code", lang: m[1] || "", content: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "prose", content: text.slice(last) });
  if (segments.length === 0) segments.push({ type: "prose", content: text });

  function renderInline(str, keyPrefix) {
    return renderRich(str, keyPrefix);
  }

  function renderProse(content) {
    const trimmed = content.replace(/^\n+/, "").replace(/\n+$/, "");
    if (!trimmed) return null;
    const parts = trimmed.split(/(?=\n\s*\d+[.)]\s|\n\s*[a-z][)]\s|\n\s*\([a-z]+\)(?:\([ivxdcm]+\))?\s)/i);
    if (parts.length <= 1) {
      return <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: "#1a3a4f", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{renderInline(trimmed)}</p>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {parts.map((part, i) => {
          const t = part.replace(/^\n/, "").trim();
          if (!t) return null;
          const isPoint = /^\d+[.)]\s|^[a-z][)]\s|^\([a-z]+\)(?:\([ivxdcm]+\))?\s/i.test(t);
          return <p key={i} style={{ fontFamily: FONT, fontWeight: isPoint ? 400 : 500, fontSize: isPoint ? 14.5 : 15, color: isPoint ? "#2d5a7a" : "#1a3a4f", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{renderInline(t)}</p>;
        })}
      </div>
    );
  }

  function renderCode(content, lang) {
    return (
      <div style={{ background: "#1e2f3e", borderRadius: 12, padding: "14px 16px", marginTop: 2, marginBottom: 2 }}>
        {lang && <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#7ab3cc", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{lang}</p>}
        <pre style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13.5, color: "#daeefa", lineHeight: 1.75, margin: 0, whiteSpace: "pre", overflowX: "auto" }}>{content}</pre>
      </div>
    );
  }

  if (segments.length === 1 && segments[0].type === "prose") return renderProse(segments[0].content) ?? <></>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {segments.map((seg, i) =>
        seg.type === "code"
          ? <div key={i}>{renderCode(seg.content, seg.lang)}</div>
          : <div key={i}>{renderProse(seg.content)}</div>
      )}
    </div>
  );
}
