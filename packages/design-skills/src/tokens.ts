/**
 * Token assembly — the declared design system a generated page ships with.
 *
 * Measured corridor: reference pages declare 100–1000 CSS custom properties. Hard-coded values
 * scattered through a stylesheet are the difference between a page that can be re-themed and a
 * page that has to be rewritten, and the measurement makes that difference visible.
 */
import { buildPalette } from "./palette";
import { buildSpaceLadder, buildTypeLadder, containerFor, proseWidth } from "./scale";
import { bodySizeFor, displaySizeFor, typeRatioFor } from "./composition";
import type { AestheticLean, DesignTokens, RoundingDepth, SiteKind, TasteControls, TypeWeight } from "./types";

/**
 * Typeface catalogue.
 *
 * Two constraints shaped this list. First, the default UI grotesque that ships with almost every
 * generated interface is the single most recognisable "made by a tool" signal there is, so it is
 * not in here at all. Second, every family below has a real weight axis and is served over the
 * variable-font endpoint, which is what lets a page use five weights without five downloads.
 *
 * `req` builds the Google Fonts CSS2 request for a weight range, clamped to what the family
 * actually ships so a request never silently falls back to the nearest static cut.
 */
type WeightRange = [number, number];

interface Family {
  /** CSS font-family name. */
  name: string;
  req: (w: WeightRange) => string;
}

function clampRange([lo, hi]: WeightRange, min: number, max: number): string {
  const a = Math.max(min, Math.min(max, lo));
  const b = Math.max(a, Math.min(max, hi));
  return `${a}..${b}`;
}

const FAMILIES: Record<string, Family> = {
  instrumentSans: { name: "Instrument Sans", req: (w) => `Instrument+Sans:wght@${clampRange(w, 400, 700)}` },
  publicSans: { name: "Public Sans", req: (w) => `Public+Sans:wght@${clampRange(w, 200, 800)}` },
  archivo: { name: "Archivo", req: (w) => `Archivo:wght@${clampRange(w, 300, 900)}` },
  spaceGrotesk: { name: "Space Grotesk", req: (w) => `Space+Grotesk:wght@${clampRange(w, 300, 700)}` },
  schibsted: { name: "Schibsted Grotesk", req: (w) => `Schibsted+Grotesk:wght@${clampRange(w, 400, 900)}` },
  bricolage: { name: "Bricolage Grotesque", req: (w) => `Bricolage+Grotesque:opsz,wght@12..96,${clampRange(w, 200, 800)}` },
  figtree: { name: "Figtree", req: (w) => `Figtree:wght@${clampRange(w, 300, 900)}` },
  manrope: { name: "Manrope", req: (w) => `Manrope:wght@${clampRange(w, 200, 800)}` },
  fraunces: { name: "Fraunces", req: (w) => `Fraunces:opsz,wght@9..144,${clampRange(w, 100, 900)}` },
  newsreader: { name: "Newsreader", req: (w) => `Newsreader:opsz,wght@6..72,${clampRange(w, 200, 800)}` },
  sourceSans: { name: "Source Sans 3", req: (w) => `Source+Sans+3:wght@${clampRange(w, 200, 900)}` },
  plexMono: { name: "IBM Plex Mono", req: () => "IBM+Plex+Mono:wght@400;500" },
  jetbrainsMono: { name: "JetBrains Mono", req: (w) => `JetBrains+Mono:wght@${clampRange(w, 100, 800)}` },
  spaceMono: { name: "Space Mono", req: () => "Space+Mono:wght@400;700" },
};

/**
 * Pairing pools, two or three per lean.
 *
 * A studio does not set every client in the same typeface, and an engine that does is legible as
 * an engine. The pool is selected deterministically from the product name, so a given brief always
 * regenerates identically while two different products with identical taste controls still arrive
 * at different type.
 */
interface Pairing {
  display: keyof typeof FAMILIES;
  body: keyof typeof FAMILIES;
  mono: keyof typeof FAMILIES;
}

const POOLS: Record<AestheticLean, Pairing[]> = {
  "minimal-clean": [
    { display: "instrumentSans", body: "publicSans", mono: "plexMono" },
    { display: "spaceGrotesk", body: "instrumentSans", mono: "spaceMono" },
    { display: "archivo", body: "publicSans", mono: "plexMono" },
  ],
  "conversion-sharp": [
    { display: "schibsted", body: "schibsted", mono: "jetbrainsMono" },
    { display: "bricolage", body: "figtree", mono: "jetbrainsMono" },
    { display: "archivo", body: "publicSans", mono: "jetbrainsMono" },
  ],
  "system-crafted": [
    { display: "figtree", body: "figtree", mono: "plexMono" },
    { display: "manrope", body: "publicSans", mono: "plexMono" },
    { display: "archivo", body: "figtree", mono: "jetbrainsMono" },
  ],
  "refined-story": [
    { display: "fraunces", body: "sourceSans", mono: "plexMono" },
    { display: "newsreader", body: "publicSans", mono: "plexMono" },
    { display: "fraunces", body: "instrumentSans", mono: "spaceMono" },
  ],
};

/** Weight corridors per taste control — the range actually requested from the font service. */
const WEIGHTS: Record<TypeWeight, { display: WeightRange; body: WeightRange }> = {
  "light-elegant": { display: [300, 600], body: [300, 600] },
  "medium-modern": { display: [400, 700], body: [400, 650] },
  "bold-confident": { display: [600, 900], body: [400, 700] },
};

/** Stable, order-independent hash so the same brief always resolves to the same pairing. */
function seedIndex(seed: string, length: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % length;
}

interface ResolvedPairing {
  display: string;
  body: string;
  mono: string;
  requests: string[];
}

function resolvePairing(lean: AestheticLean, weight: TypeWeight, seed: string): ResolvedPairing {
  const pool = POOLS[lean];
  const choice = pool[seedIndex(seed, pool.length)]!;
  const w = WEIGHTS[weight];
  const display = FAMILIES[choice.display]!;
  const body = FAMILIES[choice.body]!;
  const mono = FAMILIES[choice.mono]!;
  const requests = Array.from(
    new Set([display.req(w.display), body.req(w.body), mono.req([400, 500])]),
  );
  return { display: display.name, body: body.name, mono: mono.name, requests };
}

/**
 * Radius ladder. Corpus corridor asks for ≥ 5 distinct radii — a scale, not one rounded value
 * applied to everything.
 */
function radiusScale(rounding: RoundingDepth): Record<string, string> {
  // Every step is non-zero even at the sharp end: a 1px corner is a decision, 0px on everything
  // measures as the absence of a radius system.
  if (rounding === "sharp") {
    return { xs: "1px", sm: "2px", md: "3px", lg: "5px", xl: "7px", pill: "999px" };
  }
  if (rounding === "soft-elevation") {
    return { xs: "3px", sm: "6px", md: "10px", lg: "16px", xl: "22px", pill: "999px" };
  }
  return { xs: "2px", sm: "5px", md: "9px", lg: "14px", xl: "20px", pill: "999px" };
}

/**
 * Shadows. Corpus corridor caps shadow coverage at ~1.8% of elements, so the system offers two
 * and the renderer applies them only where an element genuinely floats above the page.
 */
function shadowScale(rounding: RoundingDepth, dark: boolean): Record<string, string> {
  if (rounding === "sharp") return { raised: "none", overlay: dark ? "0 12px 32px rgba(0,0,0,0.5)" : "0 12px 32px rgba(15,17,26,0.12)" };
  if (rounding === "soft-elevation") {
    return {
      raised: dark ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 2px rgba(15,17,26,0.05), 0 8px 24px rgba(15,17,26,0.06)",
      overlay: dark ? "0 24px 60px rgba(0,0,0,0.55)" : "0 24px 60px rgba(15,17,26,0.14)",
    };
  }
  return {
    raised: dark ? "0 1px 0 rgba(255,255,255,0.04)" : "0 1px 0 rgba(15,17,26,0.04)",
    overlay: dark ? "0 18px 44px rgba(0,0,0,0.5)" : "0 18px 44px rgba(15,17,26,0.10)",
  };
}

/** Motion tokens: corpus median transition 150–300ms with a single dominant easing. */
function motionScale(): Record<string, string> {
  return {
    fast: "120ms",
    base: "180ms",
    slow: "260ms",
    reveal: "420ms",
    ease: "cubic-bezier(0.2, 0, 0, 1)",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  };
}

export function buildTokens(
  taste: TasteControls,
  siteKind: SiteKind,
  brandAccent?: string,
  seed = "",
): DesignTokens {
  const palette = buildPalette(taste.colorMood, brandAccent);
  const pairing = resolvePairing(taste.aestheticLean, taste.typographyWeight, `${seed}|${siteKind}`);
  const displayPx = displaySizeFor(siteKind, taste.aestheticLean, taste.density);
  const bodyPx = bodySizeFor(taste.density, siteKind);
  const ladder = buildTypeLadder({
    density: taste.density,
    typographyWeight: taste.typographyWeight,
    displayPx,
    bodyPx,
    ratio: typeRatioFor(taste.aestheticLean, taste.density),
  });
  const space = buildSpaceLadder(taste.density);
  const radius = radiusScale(taste.roundingDepth);
  const shadow = shadowScale(taste.roundingDepth, palette.isDark);
  const motion = motionScale();

  const { contrast, isDark, ...color } = palette;

  // Raw scales + the semantic component layer emitted by `css.ts`.
  const SEMANTIC_ALIASES = 30;
  const LAYOUT_VARS = 9;
  const declared =
    Object.keys(color).length +
    ladder.steps.length * 4 +
    space.steps.length +
    Object.keys(radius).length +
    Object.keys(shadow).length +
    Object.keys(motion).length +
    SEMANTIC_ALIASES +
    LAYOUT_VARS;

  return {
    color,
    type: ladder.steps,
    space: space.steps,
    radius,
    shadow,
    motion,
    fontDisplay: pairing.display,
    fontBody: pairing.body,
    fontMono: pairing.mono,
    fontRequests: pairing.requests,
    contentMax: containerFor(taste.density),
    contentWide: containerFor(taste.density, true),
    proseMax: proseWidth(bodyPx, taste.density === "sparse" ? 62 : 68),
    sectionY: space.sectionY,
    sectionYTight: space.sectionYTight,
    gutter: space.gutter,
    contrast: contrast as unknown as Record<string, number>,
    declared,
  };
}

/** Map aesthetic lean → Tell redesign direction id for seam/reconcile reuse. */
export function tellDirectionForLean(lean: AestheticLean): string {
  switch (lean) {
    case "minimal-clean":
      return "precision";
    case "conversion-sharp":
      return "bold-contrast";
    case "system-crafted":
      return "warm-minimal";
    case "refined-story":
      return "explainer";
  }
}

export const AESTHETIC_PROFILES: Record<
  AestheticLean,
  { label: string; principles: string[]; sectionBias: string }
> = {
  "minimal-clean": {
    label: "Minimal clean",
    principles: [
      "Extreme clarity: content-first indexes instead of card grids",
      "Structure carried by hairlines and space, never by chrome",
      "Zero decorative surface — every mark earns its place",
    ],
    sectionBias: "Statement hero, indexed capabilities, sparse proof",
  },
  "conversion-sharp": {
    label: "Conversion sharp",
    principles: [
      "One decision per screen, restated where the reader is ready",
      "Benefit-led sections that name the buyer's own words back",
      "Asymmetric splits so the eye always has a first landing point",
    ],
    sectionBias: "Split hero, stakes band, bento capabilities, plans, close",
  },
  "system-crafted": {
    label: "System crafted",
    principles: [
      "Everything declared as tokens so the page can be re-themed, not rewritten",
      "Consistent components across marketing and product surfaces",
      "Micro-interaction only where the reader touches the interface",
    ],
    sectionBias: "Dense but ordered; system cohesion across every band",
  },
  "refined-story": {
    label: "Refined story",
    principles: [
      "Art-directed display type with real optical sizing",
      "Editorial rhythm: chapters, pull quotes, generous measure",
      "Motion supports the narrative and disappears when reduced",
    ],
    sectionBias: "Statement hero, chapters, quoted stakes, quiet close",
  },
};
