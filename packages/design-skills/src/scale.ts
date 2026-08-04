/**
 * Type and space ladders.
 *
 * Measured reference pages do not pick sizes; they walk a ladder. The corridors this module
 * targets come from `docs/10_DESIGN_EVIDENCE.md`:
 *  - 8–16 distinct type sizes on a page, smallest→largest ratio roughly 4–9×
 *  - display type between ~3.2% and ~6.5% of viewport width at desktop
 *  - display leading under 1.15, body leading 1.4–1.75
 *  - almost every spacing value landing on a 4px grid
 */
import type { Density, TypeWeight } from "./types";

export interface TypeStep {
  name: string;
  /** Rendered size at 1440px viewport, used for reasoning and tests. */
  px: number;
  /** CSS value — fluid for the large end, fixed for the small end. */
  css: string;
  lineHeight: number;
  trackingEm: number;
  weight: number;
}

export interface TypeLadder {
  steps: TypeStep[];
  /** Convenience lookups. */
  byName: Record<string, TypeStep>;
  displayPx: number;
  bodyPx: number;
  rangeRatio: number;
}

const DESIGN_VW = 1440;

function fluid(minPx: number, maxPx: number, minVw = 400, maxVw = DESIGN_VW): string {
  const slope = (maxPx - minPx) / (maxVw - minVw);
  const intercept = minPx - slope * minVw;
  const vw = Number((slope * 100).toFixed(3));
  const rem = Number((intercept / 16).toFixed(3));
  return `clamp(${(minPx / 16).toFixed(3)}rem, ${rem}rem + ${vw}vw, ${(maxPx / 16).toFixed(3)}rem)`;
}

/**
 * Leading tightens as type grows: it is the most reliable single signal of typographic intent,
 * and the flat 1.2-everywhere default is what makes generated pages read as unconsidered.
 */
function leadingFor(px: number): number {
  if (px >= 56) return 0.98;
  if (px >= 40) return 1.05;
  if (px >= 30) return 1.14;
  if (px >= 22) return 1.28;
  if (px >= 17) return 1.5;
  if (px >= 14) return 1.58;
  return 1.45;
}

/** Optical tracking: large type needs negative tracking, micro labels need positive. */
function trackingFor(px: number, weightBias: number): number {
  if (px >= 56) return -0.032 + weightBias;
  if (px >= 40) return -0.028 + weightBias;
  if (px >= 28) return -0.022 + weightBias;
  if (px >= 20) return -0.016 + weightBias;
  if (px >= 15) return -0.008;
  if (px >= 13) return 0;
  return 0.06;
}

export interface LadderOptions {
  density: Density;
  typographyWeight: TypeWeight;
  /** Target display size in px at 1440. Composition picks this per site kind and lean. */
  displayPx: number;
  bodyPx: number;
  /** Modular ratio between adjacent large steps. */
  ratio: number;
}

export function buildTypeLadder(opts: LadderOptions): TypeLadder {
  const { displayPx, bodyPx, ratio, typographyWeight } = opts;
  const weightBias = typographyWeight === "light-elegant" ? 0.006 : typographyWeight === "bold-confident" ? -0.004 : 0;

  const bodyWeight = typographyWeight === "bold-confident" ? 420 : 400;
  const displayWeight = typographyWeight === "bold-confident" ? 700 : typographyWeight === "light-elegant" ? 400 : 560;
  const headingWeight = typographyWeight === "bold-confident" ? 650 : typographyWeight === "light-elegant" ? 420 : 540;

  // Downward ladder from the display size, then a small-end ladder from body size.
  const large = [displayPx, displayPx / ratio, displayPx / ratio ** 2, displayPx / ratio ** 2.6]
    .map((n) => Math.round(n));
  const small = [
    Math.round(bodyPx * 1.28),
    Math.round(bodyPx * 1.14),
    bodyPx,
    Math.round(bodyPx * 0.9),
    Math.round(bodyPx * 0.8),
    Math.round(bodyPx * 0.7),
  ];

  const named: Array<{ name: string; px: number; weight: number; minRatio: number }> = [
    { name: "display", px: large[0]!, weight: displayWeight, minRatio: 0.42 },
    { name: "title", px: large[1]!, weight: headingWeight, minRatio: 0.52 },
    { name: "heading", px: large[2]!, weight: headingWeight, minRatio: 0.66 },
    { name: "subheading", px: large[3]!, weight: headingWeight, minRatio: 0.78 },
    { name: "lede", px: small[0]!, weight: bodyWeight, minRatio: 0.86 },
    { name: "bodyLarge", px: small[1]!, weight: bodyWeight, minRatio: 0.92 },
    { name: "body", px: small[2]!, weight: bodyWeight, minRatio: 1 },
    { name: "bodySmall", px: small[3]!, weight: bodyWeight, minRatio: 1 },
    { name: "caption", px: small[4]!, weight: bodyWeight, minRatio: 1 },
    { name: "micro", px: small[5]!, weight: 560, minRatio: 1 },
  ];

  const steps: TypeStep[] = named.map((n) => {
    const minPx = Math.max(11, Math.round(n.px * n.minRatio));
    return {
      name: n.name,
      px: n.px,
      css: n.minRatio < 1 ? fluid(minPx, n.px) : `${(n.px / 16).toFixed(3)}rem`,
      lineHeight: leadingFor(n.px),
      trackingEm: Number(trackingFor(n.px, weightBias).toFixed(4)),
      weight: n.weight,
    };
  });

  const byName: Record<string, TypeStep> = {};
  for (const s of steps) byName[s.name] = s;

  const sizes = steps.map((s) => s.px);
  return {
    steps,
    byName,
    displayPx,
    bodyPx,
    rangeRatio: Number((Math.max(...sizes) / Math.min(...sizes)).toFixed(2)),
  };
}

/** Spacing ladder, every value on the 4px grid. */
export interface SpaceLadder {
  steps: Array<{ name: string; px: number }>;
  sectionY: string;
  sectionYTight: string;
  gutter: string;
}

export function buildSpaceLadder(density: Density): SpaceLadder {
  const base = density === "information-rich" ? 4 : density === "sparse" ? 4 : 4;
  const multipliers = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 40];
  const names = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
  const steps = multipliers.map((m, i) => ({ name: names[i]!, px: base * m }));

  // Section rhythm: corpus median lands near 96–128px at desktop, and the sparse end runs higher.
  const [minY, maxY] =
    density === "information-rich" ? [48, 96] : density === "sparse" ? [80, 168] : [64, 132];

  return {
    steps,
    sectionY: fluid(minY, maxY),
    sectionYTight: fluid(Math.round(minY * 0.62), Math.round(maxY * 0.6)),
    gutter: fluid(20, 40),
  };
}

/** Container widths per density — content is framed, never stretched edge to edge. */
export function containerFor(density: Density, wide = false): string {
  if (wide) return density === "information-rich" ? "1360px" : "1240px";
  if (density === "information-rich") return "1200px";
  if (density === "sparse") return "980px";
  return "1120px";
}

/** Reading column for prose — 60–72ch is where sustained reading lives. */
export function proseWidth(bodyPx: number, ch = 68): string {
  return `${Math.round(bodyPx * 0.5 * ch)}px`;
}
