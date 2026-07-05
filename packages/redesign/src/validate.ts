// Shared, dependency-free CSS gate for the emitted restyle sheet (docs/06 validation gate).
// Both the deterministic path and the LLM path run their output through this before it ships.
// If a sheet fails, the caller keeps the last known-good deterministic sheet.

const MAX_BYTES = 80 * 1024; // 80KB ceiling
const MIN_FONT_PX = 12;

// Content roles must never be absolutely positioned or removed from flow — that would
// destroy the captured page's layout integrity.
const CONTENT_ROLE_RE = /\b(display|heading|body|button|link|card|surface|nav|input)\b/;

export type ValidateResult = { ok: boolean; violations: string[] };

/**
 * Validate an emitted restyle sheet:
 *  - braces balance (parseable)
 *  - no `display:none`
 *  - no `position:` on content roles (absolute/fixed positioning of content)
 *  - no `font-size` below 12px
 *  - byte size ≤ 80KB
 * Pure string analysis — no CSS parser dependency, safe in Node and the browser.
 */
export function validateRestyleSheet(css: string): ValidateResult {
  const violations: string[] = [];
  const text = css ?? "";

  // ── size ──
  const bytes = typeof Buffer !== "undefined" ? Buffer.byteLength(text, "utf8") : new TextEncoder().encode(text).length;
  if (bytes > MAX_BYTES) violations.push(`sheet is ${(bytes / 1024).toFixed(1)}KB, over the 80KB ceiling`);

  // ── brace balance ──
  let depth = 0, unbalanced = false;
  for (const ch of text) {
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth < 0) { unbalanced = true; break; } }
  }
  if (unbalanced || depth !== 0) violations.push("unbalanced braces — sheet is not parseable");

  // Strip comments and background-image data (which can legitimately contain "none"/"position"
  // substrings inside SVG/gradient payloads) before scanning declarations.
  const scrub = text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/url\((?:[^()]|\([^()]*\))*\)/gi, "url()");

  // ── display:none ──
  if (/display\s*:\s*none/i.test(scrub)) violations.push("uses display:none (destroys reflow content)");

  // ── font-size below floor ──
  const fsRe = /font-size\s*:\s*([\d.]+)px/gi;
  let m: RegExpExecArray | null;
  while ((m = fsRe.exec(scrub))) {
    const v = Number(m[1]);
    if (v > 0 && v < MIN_FONT_PX) { violations.push(`font-size ${v}px is below the ${MIN_FONT_PX}px floor`); break; }
  }

  // ── positioning on content roles ──
  // Scan each rule block; if its selector references a content role (via role class or a
  // [data-tell-id] element rule) and its body sets a non-static position, flag it.
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let r: RegExpExecArray | null;
  while ((r = ruleRe.exec(scrub))) {
    const selector = r[1] ?? "";
    const body = r[2] ?? "";
    const pos = body.match(/position\s*:\s*(absolute|fixed|sticky)/i);
    if (!pos) continue;
    // Decorative pseudo-elements (::before/::after) may be absolutely positioned inside a
    // relatively-positioned content box — that adds a mark, it does not remove content.
    if (/::(before|after)/.test(selector)) continue;
    const onContent = CONTENT_ROLE_RE.test(selector) || /\[data-tell-id=/.test(selector) || /\b(h[1-6]|p|a|button|body|html|main|section|article|nav|header|footer)\b/.test(selector);
    if (onContent) { violations.push(`position:${pos[1]} on a content selector (${selector.trim().slice(0, 48)})`); break; }
  }

  return { ok: violations.length === 0, violations };
}
