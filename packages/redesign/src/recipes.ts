// Per-role recipe builders. Each function turns the direction's identity tokens + the
// computed palette into concrete CSS rules for one component family (hero, nav, button,
// card, input, badge, section, link, footer, selection/details). These are what make each
// direction read as a *different designer's* finished work rather than a recolor.
//
// A rule is `{ selector, decls }`; the emitter appends `!important` to every declaration and
// serializes uniformly, so pseudo-elements, counters, and backgrounds all flow through the
// same gate. Colors arrive pre-solved for contrast in the Palette (see restyle.ts).

import type { Direction } from "./directions";

export type EmittedRule = { selector: string; decls: Record<string, string> };

export type Palette = {
  spec: Direction;
  display: string; body: string; mono: string; radius: string;
  paper: string; paperAlt: string; cardBg: string; cardBgAlt: string;
  ink: string; inkMuted: string; hairline: string; hairlineStrong: string;
  accent: string; accentInk: string; accentText: string; accentWash: string;
  headingWeight: number; bodyWeight: number;
  serifFallback: string; // display fallback stack
};

const rule = (selector: string, decls: Record<string, string>): EmittedRule => ({ selector, decls });
const sel = (id: string, pseudo = "") => `[data-tell-id="${id}"]${pseudo}`;

// ── page + texture ──────────────────────────────────────────────────
/** A faint per-direction paper texture, embedded (no external requests). Kept small. */
export function textureBackground(p: Palette): string | null {
  const t = p.spec.recipe.texture;
  const line = hairlineRGBA(p, 0.05);
  const line2 = hairlineRGBA(p, 0.07);
  switch (t) {
    case "fiber": {
      // ~1.2KB inline feTurbulence fiber grain (editorial).
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.035 0'/></filter><rect width='120' height='120' filter='url(%23f)'/></svg>`;
      return `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/'/g, "%27").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, "%20")}")`;
    }
    case "blueprint":
      // 1px cool grid lines every 32px (precision).
      return `repeating-linear-gradient(0deg, transparent 0, transparent 31px, ${line} 31px, ${line} 32px), repeating-linear-gradient(90deg, transparent 0, transparent 31px, ${line} 31px, ${line} 32px)`;
    case "baseline":
      // Visible 8px baseline grid (brutalist).
      return `repeating-linear-gradient(0deg, transparent 0, transparent 7px, ${line2} 7px, ${line2} 8px)`;
    default:
      return null;
  }
}

function hairlineRGBA(p: Palette, a: number): string {
  const rgb = hexToRgb(p.ink);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function pageRules(p: Palette): EmittedRule[] {
  const tex = textureBackground(p);
  const decls: Record<string, string> = {
    "background-color": p.paper,
    color: p.ink,
    "font-family": `"${p.body}", ui-sans-serif, system-ui, -apple-system, sans-serif`,
    "-webkit-font-smoothing": "antialiased",
  };
  const rules: EmittedRule[] = [rule("html,body", decls)];
  if (tex) rules.push(rule("body", { "background-image": tex, "background-attachment": "fixed" }));
  return rules;
}

export function selectionRule(p: Palette): EmittedRule[] {
  const on = p.spec.recipe.selection === "ink" ? { bg: p.ink, fg: p.paper } : { bg: p.accent, fg: p.accentInk };
  return [rule("::selection", { "background-color": on.bg, color: on.fg })];
}

export function headingRules(p: Palette): EmittedRule[] {
  const titleCase = p.spec.recipe.card.titleCase;
  const decls: Record<string, string> = {
    "font-family": `"${p.display}", ${p.serifFallback}`,
    color: p.ink,
    "font-weight": String(p.headingWeight),
    "letter-spacing": p.spec.recipe.hero.tracking,
    "line-height": "1.14",
  };
  const rules = [rule("h1,h2,h3,h4,h5,h6", decls)];
  // Card/section title case is a signature detail (small-caps luxury, uppercase brutalist).
  if (titleCase === "small-caps") rules.push(rule("h2,h3,h4", { "font-variant": "small-caps", "letter-spacing": p.spec.recipe.card.titleTracking }));
  else if (titleCase === "uppercase") rules.push(rule("h2,h3,h4", { "text-transform": "uppercase", "letter-spacing": p.spec.recipe.card.titleTracking, "font-size": "0.92em" }));
  return rules;
}

// ── links ───────────────────────────────────────────────────────────
export function linkRules(p: Palette): EmittedRule[] {
  const k = p.spec.recipe.link;
  const base: Record<string, string> = { color: p.accentText };
  const rules: EmittedRule[] = [];
  switch (k.kind) {
    case "offset":
      Object.assign(base, { "text-decoration": "underline", "text-decoration-thickness": k.thickness, "text-underline-offset": k.offset, "text-decoration-color": p.accent });
      break;
    case "none":
      Object.assign(base, { "text-decoration": "none", color: p.accentText });
      rules.push(rule("a:hover", { "text-decoration": "underline", "text-decoration-thickness": "1px", "text-underline-offset": k.offset }));
      break;
    case "highlight":
      Object.assign(base, { color: p.ink, "background-color": p.accentWash, "box-decoration-break": "clone", "-webkit-box-decoration-break": "clone", padding: "1px 4px", "text-decoration": "none", "border-radius": "2px" });
      break;
    case "soft":
      Object.assign(base, { "text-decoration": "underline", "text-decoration-thickness": k.thickness, "text-underline-offset": k.offset, "text-decoration-color": hairlineRGBA(p, 0.4) });
      break;
    case "underline":
      Object.assign(base, { "text-decoration": "underline", "text-decoration-thickness": k.thickness, "text-underline-offset": k.offset, "text-decoration-color": p.accent });
      rules.push(rule("a:hover", { "text-decoration-color": p.accentText, "text-decoration-thickness": "2px" }));
      break;
    case "invert":
      Object.assign(base, { color: p.ink, "text-decoration": "underline", "text-decoration-thickness": k.thickness, "text-underline-offset": k.offset, "text-decoration-color": p.ink });
      rules.push(rule("a:hover", { "background-color": p.ink, color: p.paper, "text-decoration": "none" }));
      break;
  }
  rules.unshift(rule("a", base));
  return rules;
}

// ── hero ────────────────────────────────────────────────────────────
export function heroRules(p: Palette, headingId: string | null, containerId: string | null, sizePx: number): EmittedRule[] {
  const r = p.spec.recipe.hero;
  const rules: EmittedRule[] = [];

  if (containerId) {
    const cd: Record<string, string> = {
      "background-image": "none",
      "background-color": r.decoration === "underline-block" || p.spec.recipe.texture === "tint-block" ? p.accentWash : p.paper,
      color: p.ink,
      position: "relative",
      "text-align": r.align,
      padding: `${Math.max(48, p.spec.recipe.section.padY)}px 32px ${Math.max(40, p.spec.recipe.section.padY - 8)}px`,
    };
    if (r.decoration === "keyline-box") { cd["border"] = `3px solid ${p.ink}`; cd["margin"] = "24px"; }
    if (r.decoration === "rules") { cd["border-top"] = `1px solid ${p.hairlineStrong}`; cd["border-bottom"] = `1px solid ${p.hairlineStrong}`; }
    if (r.decoration === "hairline-double") { cd["border-top"] = `3px double ${p.hairlineStrong}`; cd["border-bottom"] = `3px double ${p.hairlineStrong}`; }
    rules.push(rule(sel(containerId), cd));

    // precision corner tick marks
    if (r.decoration === "corner-ticks") {
      const tick = { position: "absolute", width: "14px", height: "14px", content: '""' };
      rules.push(rule(sel(containerId, "::before"), { ...tick, top: "14px", left: "14px", "border-top": `2px solid ${p.accent}`, "border-left": `2px solid ${p.accent}` }));
      rules.push(rule(sel(containerId, "::after"), { ...tick, bottom: "14px", right: "14px", "border-bottom": `2px solid ${p.accent}`, "border-right": `2px solid ${p.accent}` }));
    }
  }

  if (headingId) {
    const hd: Record<string, string> = {
      "font-family": `"${p.display}", ${p.serifFallback}`,
      "font-size": `${sizePx}px`,
      "font-weight": String(r.weight),
      "letter-spacing": r.tracking,
      "line-height": "1.04",
      color: p.ink,
      "text-align": r.align,
      "text-transform": r.transform,
      margin: "0",
      position: "relative",
    };
    if (r.italicAccentWord) hd["font-style"] = "italic";
    if (r.decoration === "underline-block") {
      hd["display"] = "inline-block";
      hd["box-shadow"] = `inset 0 -0.18em 0 ${p.accentWash}`;
      hd["padding"] = "0 0.06em";
    }
    rules.push(rule(sel(headingId), hd));

    // eyebrow ::before
    const eyebrowRule = heroEyebrow(p, headingId);
    if (eyebrowRule) rules.push(eyebrowRule);
  }
  return rules;
}

function heroEyebrow(p: Palette, headingId: string): EmittedRule | null {
  const e = p.spec.recipe.hero.eyebrow;
  if (e.kind === "none") return null;
  const base: Record<string, string> = {
    content: `"${e.text}"`,
    display: "block",
    "font-family": `"${p.body}", ui-sans-serif, sans-serif`,
    "margin-bottom": "16px",
    "text-align": p.spec.recipe.hero.align,
  };
  switch (e.kind) {
    case "small-caps":
      Object.assign(base, { "font-variant": "small-caps", "letter-spacing": "0.18em", "font-weight": "600", color: p.accentText, "font-size": "14px" });
      break;
    case "mono-bracket":
      Object.assign(base, { "font-family": `"${p.mono}", ui-monospace, monospace`, "letter-spacing": "0.14em", color: p.accentText, "font-size": "13px", "font-weight": "500" });
      break;
    case "chip":
      Object.assign(base, {
        "display": "inline-block", "background-color": p.accent, color: p.accentInk,
        "text-transform": "uppercase", "letter-spacing": "0.1em", "font-weight": "700",
        "font-size": "12px", padding: "5px 12px", "border-radius": "999px",
      });
      break;
    case "mono-meta":
      Object.assign(base, {
        "font-family": `"${p.mono}", ui-monospace, monospace`, "letter-spacing": "0.1em",
        color: p.inkMuted, "font-size": "12px", "border-bottom": `2px solid ${p.ink}`,
        "padding-bottom": "8px", "text-transform": "uppercase",
      });
      break;
  }
  return rule(sel(headingId, "::before"), base);
}

// ── buttons ─────────────────────────────────────────────────────────
export function buttonDecls(p: Palette): Record<string, string> {
  const b = p.spec.recipe.button;
  const common: Record<string, string> = {
    "font-family": `"${p.body}", ui-sans-serif, sans-serif`,
    "font-weight": String(b.weight),
    "text-transform": b.transform,
    "letter-spacing": b.tracking,
    "background-image": "none",
    cursor: "pointer",
  };
  switch (b.kind) {
    case "solid":
      return { ...common, "background-color": p.accent, color: p.accentInk, border: "none", "border-radius": p.radius, "box-shadow": "none" };
    case "outline":
      return { ...common, "background-color": "transparent", color: p.accentText, border: `1.5px solid ${p.accent}`, "border-radius": p.radius, "box-shadow": "none" };
    case "ink-block":
      return { ...common, "background-color": p.ink, color: p.paper, border: "none", "border-radius": p.radius, "box-shadow": "none" };
    case "offset-shadow":
      return { ...common, "background-color": p.accent, color: p.accentInk, border: `2px solid ${p.ink}`, "border-radius": "0", "box-shadow": `6px 6px 0 ${p.ink}` };
    case "chip":
      return { ...common, "background-color": p.accent, color: p.accentInk, border: "none", "border-radius": "999px", "box-shadow": "none" };
  }
}

// ── cards ───────────────────────────────────────────────────────────
export function cardDecls(p: Palette, alt: boolean, elevation: string): Record<string, string> {
  const c = p.spec.recipe.card;
  const bg = alt ? p.cardBgAlt : p.cardBg;
  const base: Record<string, string> = { "background-color": bg, color: p.ink, "background-image": "none" };
  switch (c.kind) {
    case "shadow":
      return { ...base, border: "none", "box-shadow": elevation, "border-radius": p.radius };
    case "hairline":
      return { ...base, border: `1px solid ${p.hairline}`, "box-shadow": "none", "border-radius": p.radius };
    case "ink-border":
      return { ...base, border: `2px solid ${p.ink}`, "box-shadow": "none", "border-radius": "0" };
    case "tint":
      return { ...base, "background-color": p.cardBgAlt, border: "none", "box-shadow": "none", "border-radius": p.radius };
    case "double-hairline":
      return { ...base, border: `1px solid ${p.hairlineStrong}`, "box-shadow": `inset 0 0 0 4px ${bg}, inset 0 0 0 5px ${p.hairline}`, "border-radius": p.radius };
  }
}

// ── inputs ──────────────────────────────────────────────────────────
export function inputDecls(p: Palette): Record<string, string> {
  return {
    "background-color": p.cardBg,
    color: p.ink,
    border: `1px solid ${p.hairlineStrong}`,
    "border-radius": p.radius,
    "font-family": `"${p.body}", ui-sans-serif, sans-serif`,
  };
}

// ── badge / pill (role=body with its own fill in the hero) ───────────
export function badgeDecls(p: Palette): Record<string, string> {
  return {
    "background-color": p.accentWash,
    color: p.accentText,
    border: `1px solid ${p.accent}`,
    "border-radius": "999px",
    "box-shadow": "none",
    "font-weight": "600",
    "background-image": "none",
  };
}

// ── nav ─────────────────────────────────────────────────────────────
export function navDecls(p: Palette): Record<string, string> {
  return {
    "background-color": p.paper,
    "background-image": "none",
    "border-bottom": `1px solid ${p.hairline}`,
    color: p.ink,
    "box-shadow": "none",
  };
}

// ── section rhythm ──────────────────────────────────────────────────
export function sectionDecls(p: Palette, index: number): Record<string, string> {
  const s = p.spec.recipe.section;
  const alt = s.alternate && index % 2 === 1;
  const decls: Record<string, string> = {
    "padding-top": `${s.padY}px`,
    "padding-bottom": `${s.padY}px`,
  };
  if (s.alternate) decls["background-color"] = alt ? p.paperAlt : p.paper;
  if (s.divider === "hairline-top") decls["border-top"] = `1px solid ${p.hairline}`;
  else if (s.divider === "rule-2px") decls["border-top"] = `2px solid ${p.ink}`;
  else if (s.divider === "double-hairline") decls["border-top"] = `3px double ${p.hairlineStrong}`;
  else if (s.divider === "tint-wash" && alt) decls["background-color"] = p.accentWash;
  return decls;
}

// ── footer ──────────────────────────────────────────────────────────
export function footerDecls(p: Palette): Record<string, string> {
  return {
    "background-color": p.paperAlt,
    "background-image": "none",
    "border-top": `1px solid ${p.hairline}`,
    color: p.inkMuted,
    "box-shadow": "none",
  };
}

// ── decorative section/card numerals via CSS counters ────────────────
export function numeralRule(p: Palette, cardId: string, resetHost: string): EmittedRule[] {
  // Increment a counter per card and print it as a leading-zero index — a "designer was here"
  // detail for precision/luxury/brutalist. resetHost seeds the counter once.
  return [
    rule(sel(cardId, "::before"), {
      "counter-increment": "tell-idx",
      content: 'counter(tell-idx, decimal-leading-zero) " "',
      display: "block",
      "font-family": `"${p.mono}", ui-monospace, monospace`,
      "font-size": "12px",
      "letter-spacing": "0.12em",
      color: p.accentText,
      "margin-bottom": "12px",
    }),
  ];
}
