// Grounded, element-precise redesign. For each captured element (identified by its stamped
// data-tell-id) we compute a targeted transform from its MEASURED values, following the
// deterministic redesign order in docs/05 §8: contrast → type snap → spacing snap → depth
// collapse → accent re-band → font pairing. The emitted CSS targets [data-tell-id="…"], so the
// live "after" preview transforms the real elements — no guessed selectors, no cascade war.

import type { BrandDNA, CapturePayload, ComputedStyleSample, DesignFingerprint } from "@tell/schema";
import { clamp, contrastRatio, parseColor, px, pxList, rgbToHsl, type Hsl } from "./color";
import { ELEVATION, snapSpace, snapType, tameAccent, type Direction } from "./scales";

export type ElOp = { tellId: string; role: string; decls: Record<string, string> };

export type RestylePlan = {
  direction: Direction;
  display: string; body: string; mono: string;
  ratio: number; base: number; spacingBase: number; radius: string;
  accentBefore: string; accentAfter: string; accentInk: string; accentTamed: boolean;
  surface: string; ink: string; inkMuted: string; isDark: boolean;
  ops: ElOp[];
  remapVars: { name: string; value: string }[];
  floatedCount: number; elevationLevels: number;
  distinctSizesAfter: number; distinctSpacesAfter: number;
  headingWeight: number; bodyWeight: number;
  displaySizeAfter: number; bodySizeAfter: number;
};

const CANDIDATE_INKS_LIGHT = ["#17140F", "#1A1714", "#211C18"];
const CANDIDATE_INKS_DARK = ["#F6F1E8", "#EFE8DC", "#FBF7F0"];

/** Best-contrast readable ink for a surface, meeting ≥4.5:1 where possible. */
function inkFor(surface: string, isDark: boolean): string {
  const pool = isDark ? CANDIDATE_INKS_DARK : CANDIDATE_INKS_LIGHT;
  let best = pool[0]!, bestRatio = 0;
  for (const ink of [...pool, isDark ? "#FFFFFF" : "#000000"]) {
    const r = contrastRatio(surface, ink);
    if (r > bestRatio) { bestRatio = r; best = ink; }
  }
  return best;
}

function bodyBaseSize(styles: ComputedStyleSample[]): number {
  const bodySizes = styles.filter((s) => s.role === "body").map((s) => px(s.fontSize)).filter((v) => v >= 12 && v <= 20);
  const c = new Map<number, number>();
  for (const v of bodySizes) c.set(Math.round(v), (c.get(Math.round(v)) ?? 0) + 1);
  let best = 16, bc = 0;
  for (const [v, n] of c) if (n > bc && v >= 14 && v <= 18) { bc = n; best = v; }
  return best;
}

/** Snapshot the page's dominant accent (weighted toward interactive fills). */
function pageAccent(styles: ComputedStyleSample[]): { hex: string; hsl: Hsl } | null {
  const counts = new Map<string, number>();
  for (const s of styles) for (const c of [s.backgroundColor, s.color]) {
    const rgb = parseColor(c); if (!rgb) continue;
    const hsl = rgbToHsl(rgb);
    if (hsl.s < 0.35 || hsl.l < 0.12 || hsl.l > 0.9) continue;
    counts.set(c, (counts.get(c) ?? 0) + (s.role === "button" ? 3 : 1));
  }
  let best: string | null = null, bc = 0;
  for (const [c, n] of counts) if (n > bc) { bc = n; best = c; }
  if (!best) return null;
  const rgb = parseColor(best)!;
  return { hex: `#${[rgb.r, rgb.g, rgb.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase(), hsl: rgbToHsl(rgb) };
}

function nearAccent(color: string, accent: Hsl | null, tol = 22): boolean {
  if (!accent) return false;
  const rgb = parseColor(color); if (!rgb) return false;
  const h = rgbToHsl(rgb);
  return h.s > 0.28 && Math.abs(((h.h - accent.h + 540) % 360) - 180) < tol;
}

export function buildRestylePlan(
  capture: CapturePayload,
  _fingerprint: DesignFingerprint,
  dir: Direction,
  dna?: BrandDNA,
): RestylePlan {
  const styles = capture.styles;
  const display = dna?.displayFont || dir.display;
  const body = dna?.bodyFont || dir.body;
  const mono = dna?.monoFont || dir.mono;
  const ratio = dna?.typeScaleRatio || dir.ratio;
  const spacingBase = dna?.spacingBase || dir.spacingBase;
  const radius = dna?.radius || dir.radius;
  const headingWeight = dir.headingWeight;
  const bodyWeight = dir.bodyWeight;
  const maxElevation = clamp(dna?.maxElevationLevels ?? 3, 1, 3) as 1 | 2 | 3;

  const base = bodyBaseSize(styles);
  const pageBg = capture.surfaceTokens?.bodyBg || styles.find((s) => s.tag === "body")?.backgroundColor || "#ffffff";
  const bgRgb = parseColor(pageBg);
  const isDark = bgRgb ? rgbToHsl(bgRgb).l < 0.4 : false;
  const surface = isDark ? dir.paperDark : dir.paperLight;
  const ink = inkFor(surface, isDark);
  const inkMuted = isDark ? "#B8AA98" : "#6B5F52";

  const accent = pageAccent(styles);
  const dnaAccent = dna?.accent ? { hex: dna.accent, hsl: rgbToHsl(parseColor(dna.accent)!) } : null;
  const tamed = dnaAccent
    ? { hex: dnaAccent.hex, tamed: false }
    : tameAccent(accent?.hsl ?? null, dir.sig, dir.band);
  const accentAfter = tamed.hex;
  const accentInk = contrastRatio(accentAfter, "#FFFFFF") >= 4.5 ? "#FFFFFF" : ink;

  const ops: ElOp[] = [];
  const snappedSizes = new Set<number>();
  const snappedSpaces = new Set<number>();
  let floated = 0;
  const usedLevels = new Set<number>();
  const FLOAT_CAP = 6; // don't reintroduce shadow-everywhere

  for (const s of styles) {
    if (!s.tellId || s.tag === "body" || s.tag === "html") continue;
    const decls: Record<string, string> = {};

    // (2) type: snap size + assign the pairing's voice + commit weight
    const size = px(s.fontSize);
    if (size > 0 && (s.role === "display" || s.role === "heading" || s.role === "body" || s.role === "link" || s.role === "button")) {
      const snapped = snapType(size, base, ratio);
      snappedSizes.add(snapped);
      decls["font-size"] = `${snapped}px`;
      const voice = s.role === "display" || s.role === "heading" ? display : body;
      decls["font-family"] = `"${voice}", ${s.role === "display" || s.role === "heading" ? "Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"}`;
      if (s.role === "display" || s.role === "heading") { decls["font-weight"] = String(headingWeight); decls["line-height"] = "1.12"; decls["letter-spacing"] = "-0.01em"; }
    }

    // (3) spacing: snap padding onto the token grid
    const pads = pxList(s.padding);
    if (pads.length && pads.some((v) => v > 0)) {
      const snapped = pads.map((v) => (v > 0 ? snapSpace(v) : 0));
      snapped.forEach((v) => v > 0 && snappedSpaces.add(v));
      decls["padding"] = snapped.map((v) => `${v}px`).join(" ");
    }

    // (4) depth: collapse to the ramp; only a capped set of cards float, everything else flat
    const hasShadow = s.boxShadow && s.boxShadow !== "none";
    if (s.role === "card" && floated < FLOAT_CAP) {
      const lvl = Math.min(1, maxElevation) as 1;
      decls["box-shadow"] = ELEVATION[lvl];
      usedLevels.add(lvl); floated++;
    } else if (hasShadow) {
      decls["box-shadow"] = "none";
      if (s.role === "card" || s.role === "surface") decls["border"] = isDark ? "1px solid rgba(246,241,232,.12)" : "1px solid rgba(23,20,15,.12)";
    }

    // (5) accent: remap accent-colored fills/text to the tamed accent
    if (nearAccent(s.backgroundColor, accent?.hsl ?? null)) { decls["background-color"] = accentAfter; decls["color"] = accentInk; }
    else if (nearAccent(s.color, accent?.hsl ?? null)) decls["color"] = accentAfter;

    // radius unification for controls + cards
    if ((s.role === "button" || s.role === "card" || s.role === "input") && px(s.borderRadius) > 0) decls["border-radius"] = radius;

    // (6/§6) contrast: readable text on owned surfaces; strip AI hero gradients
    if (s.backgroundImage && s.backgroundImage.includes("gradient") && (s.role === "surface" || s.role === "display" || s.role === "heading")) {
      decls["background-image"] = "none";
      decls["background-color"] = surface;
      if (!decls["color"]) decls["color"] = ink;
    }

    if (Object.keys(decls).length) ops.push({ tellId: s.tellId, role: s.role, decls });
  }

  // Remap the page's OWN accent custom properties (so components that read var(--brand) update too).
  const remapVars = (capture.cssVariables ?? []).filter((v) => nearAccent(v.value, accent?.hsl ?? null, 26)).map((v) => ({ name: v.name, value: accentAfter }));

  return {
    direction: dir, display, body, mono, ratio, base, spacingBase, radius,
    accentBefore: accent?.hex ?? (styles.find((s) => s.role === "button")?.backgroundColor ?? "#6366F1"),
    accentAfter, accentInk, accentTamed: tamed.tamed,
    surface, ink, inkMuted, isDark,
    ops, remapVars,
    floatedCount: floated, elevationLevels: usedLevels.size,
    distinctSizesAfter: snappedSizes.size, distinctSpacesAfter: snappedSpaces.size,
    headingWeight, bodyWeight,
    displaySizeAfter: snapType(Math.max(34, base * Math.pow(ratio, 3)), base, ratio), bodySizeAfter: base,
  };
}

/** Element-precise CSS that lands in the live "after" iframe. */
export function emitRestyleCss(plan: RestylePlan): string {
  const g = `/* Tell · ${plan.direction.label} — grounded restyle of the captured page */
:root{
  --tell-display:"${plan.display}";
  --tell-body:"${plan.body}";
  --tell-mono:"${plan.mono}";
  --tell-accent:${plan.accentAfter};
  --tell-accent-ink:${plan.accentInk};
  --tell-radius:${plan.radius};
  --tell-paper:${plan.surface};
  --tell-ink:${plan.ink};
}
${plan.remapVars.length ? `:root{\n${plan.remapVars.map((v) => `  ${v.name}: ${plan.accentAfter} !important;`).join("\n")}\n}\n` : ""}html,body{
  background-color:var(--tell-paper) !important;
  color:var(--tell-ink) !important;
  font-family:var(--tell-body),ui-sans-serif,system-ui,-apple-system,sans-serif !important;
}
h1,h2,h3,h4{ font-family:var(--tell-display),Georgia,serif !important; color:var(--tell-ink) !important; }`;

  const elRules = plan.ops.map((op) => {
    const body = Object.entries(op.decls).map(([k, v]) => `  ${k}:${v} !important;`).join("\n");
    return `[data-tell-id="${op.tellId}"]{\n${body}\n}`;
  }).join("\n");

  return `${g}\n${elRules}\n`;
}

/** The "after" axis quality scores — enforced by the plan's construction (docs/05 redesign order). */
export function afterAxes(plan: RestylePlan, before: { contrast: number }): { contrast: number; typescale: number; spacing: number; depth: number; accent: number; identity: number } {
  // typescale: everything snapped to one ratio → fit = 1; count factor from distinct snapped sizes
  const scaleCount = clamp(1 - Math.max(0, plan.distinctSizesAfter - 8) * 0.12, 0.3, 1);
  const typescale = clamp(1 * scaleCount, 0.6, 1);
  // spacing: fully on-grid; count factor from distinct snapped values
  const spaceCount = clamp((16 - plan.distinctSpacesAfter) / 6, 0, 1);
  const spacing = clamp(0.7 * 1 + 0.3 * spaceCount, 0.7, 1);
  // depth: k = elevation levels used (≤3), coverage small (only capped floats)
  const k = Math.max(1, plan.elevationLevels);
  const kFactor = k >= 2 && k <= 4 ? 1 : 0.7;
  const depth = clamp(kFactor, 0.7, 1);
  // accent: single tamed hue, considered band, disciplined area
  const accent = 1;
  // identity: display + body pairing, classes differ, committed display weight
  const identity = clamp((plan.display.toLowerCase() !== plan.body.toLowerCase() ? 1 : 0.7) * (plan.headingWeight >= 600 ? 1 : 0.8), 0.7, 1);
  // contrast: readable pairings enforced on owned text; hierarchy from the new type ramp
  const H = (plan.displaySizeAfter / Math.max(1, plan.bodySizeAfter)) * (plan.headingWeight / Math.max(1, plan.bodyWeight)) * 1.5;
  const hierFactor = H >= 3.5 ? 1 : H >= 2.2 ? 0.7 : 0.4;
  const contrast = clamp(1 * 1 * 0.8 + 0.2 * hierFactor, before.contrast, 1);
  return { contrast, typescale, spacing, depth, accent, identity };
}
