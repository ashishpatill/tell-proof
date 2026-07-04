// Learn a project's distinctive design fingerprint (Brand DNA) from a captured reference page.
// The DNA becomes both the TARGET the redesign steers toward and the yardstick the scorecard
// measures against (see docs/05 and packages/schema BrandDNA). Deterministic, no LLM.

import { BrandDNA, type CapturePayload, type ComputedStyleSample, type DesignFingerprint } from "@tell/schema";
import { parseColor, px, pxList, rgbToHsl, toHex, type Hsl } from "./color";
import { DEFAULT_FONT_RE, inferTypeScale, resolveDirection } from "./scales";

function primaryFamily(fontFamily: string): string {
  return (fontFamily.split(",")[0] ?? "").replace(/["']/g, "").trim();
}

function fontClass(family: string): "serif" | "mono" | "sans" {
  const f = family.toLowerCase();
  if (/mono|code|consol/.test(f)) return "mono";
  if (/serif|fraunces|playfair|lora|georgia|times|instrument serif|dm serif/.test(f) && !/sans/.test(f)) return "serif";
  return "sans";
}

function mode<T>(items: T[]): T | undefined {
  const c = new Map<T, number>();
  for (const it of items) c.set(it, (c.get(it) ?? 0) + 1);
  let best: T | undefined, bc = 0;
  for (const [v, n] of c) if (n > bc) { bc = n; best = v; }
  return best;
}

/** The page's dominant accent (weighted toward interactive fills), skipping neutrals/status hues. */
function pageAccent(styles: ComputedStyleSample[]): { hex: string; hsl: Hsl } | null {
  const counts = new Map<string, number>();
  for (const s of styles) for (const c of [s.backgroundColor, s.color]) {
    const rgb = parseColor(c); if (!rgb) continue;
    const hsl = rgbToHsl(rgb);
    if (hsl.s < 0.35 || hsl.l < 0.12 || hsl.l > 0.9) continue;
    const isStatus = (hsl.h <= 15 || hsl.h >= 345) || (hsl.h >= 130 && hsl.h <= 160);
    counts.set(c, (counts.get(c) ?? 0) + (s.role === "button" ? 3 : 1) * (isStatus ? 0.5 : 1));
  }
  let best: string | null = null, bc = 0;
  for (const [c, n] of counts) if (n > bc) { bc = n; best = c; }
  if (!best) return null;
  const rgb = parseColor(best)!;
  return { hex: toHex(rgb), hsl: rgbToHsl(rgb) };
}

/** Most common non-zero corner radius across controls + cards. */
function dominantRadius(styles: ComputedStyleSample[]): string {
  const radii = styles
    .filter((s) => s.role === "button" || s.role === "card" || s.role === "input")
    .map((s) => Math.round(px(s.borderRadius)))
    .filter((v) => v > 0 && v < 400);
  const m = mode(radii);
  return m != null ? `${m}px` : "8px";
}

/** Infer the page's spacing base (8pt vs 4pt rhythm) from its paddings. */
function spacingBaseOf(styles: ComputedStyleSample[]): number {
  const spaces = styles.flatMap((s) => pxList(s.padding)).filter((v) => v > 2);
  if (!spaces.length) return 8;
  const on8 = spaces.filter((v) => v % 8 === 0).length / spaces.length;
  const on4 = spaces.filter((v) => v % 4 === 0).length / spaces.length;
  return on8 >= 0.6 ? 8 : on4 >= 0.6 ? 4 : 8;
}

/** Distinct shadow signatures, capped to a considered ramp (1..3). */
function elevationLevelsOf(styles: ComputedStyleSample[]): number {
  const sigs = new Set(
    styles.map((s) => s.boxShadow).filter((v) => v && v !== "none").map((v) => v.replace(/\s+/g, " ").trim()),
  );
  return Math.max(1, Math.min(3, sigs.size || 1));
}

/**
 * Derive a BrandDNA from a captured reference page. Keeps the page's real distinctive choices
 * (fonts, accent, radius, rhythm) so a later redesign can steer a *different* page toward this brand.
 */
export function learnBrandDNA(
  capture: CapturePayload,
  fingerprint: DesignFingerprint,
  source = "reference",
): BrandDNA {
  const styles = capture.styles;
  const textEls = styles.filter((s) => ["display", "heading", "body", "link", "button"].includes(s.role));

  const displaySample = styles.find((s) => s.role === "display") ?? styles.find((s) => s.role === "heading");
  const bodySample = styles.find((s) => s.role === "body");
  const monoSample = styles.find((s) => fontClass(primaryFamily(s.fontFamily)) === "mono");

  const displayFamRaw = primaryFamily(displaySample?.fontFamily ?? "");
  const bodyFamRaw = primaryFamily(bodySample?.fontFamily ?? "");
  const monoFamRaw = primaryFamily(monoSample?.fontFamily ?? "");

  // Pick a direction whose voice matches the reference (serif → editorial, else precision),
  // used only as a fallback when the page has no distinctive family of its own.
  const fallbackDir = resolveDirection(fontClass(displayFamRaw) === "serif" ? "editorial" : "precision");

  const displayFont = displayFamRaw && !DEFAULT_FONT_RE.test(displayFamRaw) ? displayFamRaw : fallbackDir.display;
  const bodyFont = bodyFamRaw && !DEFAULT_FONT_RE.test(bodyFamRaw) ? bodyFamRaw : fallbackDir.body;
  const monoFont = monoFamRaw || "";

  const accent = pageAccent(styles);

  const sizes = Array.from(new Set(textEls.map((s) => Math.round(px(s.fontSize) * 2) / 2))).filter((v) => v > 0);
  const bodySizes = styles.filter((s) => s.role === "body").map((s) => px(s.fontSize)).filter((v) => v >= 12 && v <= 20);
  const base = mode(bodySizes.map((v) => Math.round(v)))?.valueOf() ?? 16;
  const { ratio } = inferTypeScale(sizes, base);

  return BrandDNA.parse({
    displayFont,
    bodyFont,
    monoFont,
    accent: accent?.hex ?? fingerprint.colors[0] ?? "#6366F1",
    radius: dominantRadius(styles),
    spacingBase: spacingBaseOf(styles),
    typeScaleRatio: ratio,
    maxElevationLevels: elevationLevelsOf(styles),
    directionId: fallbackDir.id,
    source,
  });
}
