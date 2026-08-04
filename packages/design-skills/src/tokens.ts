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
 * Type pairings. Chosen for range (real weight axes), for a display face with actual character,
 * and for a monospace companion that carries data and labels. All are open licensed and served
 * with `display=swap` so the first paint is never blocked.
 */
interface Pairing {
  display: string;
  body: string;
  mono: string;
  requests: string[];
}

const PAIRINGS: Record<AestheticLean, Record<TypeWeight, Pairing>> = {
  "minimal-clean": {
    "light-elegant": { display: "Inter Tight", body: "Inter", mono: "IBM Plex Mono", requests: ["Inter+Tight:wght@300..600", "Inter:wght@300..600", "IBM+Plex+Mono:wght@400;500"] },
    "medium-modern": { display: "Inter Tight", body: "Inter", mono: "IBM Plex Mono", requests: ["Inter+Tight:wght@400..700", "Inter:wght@400..600", "IBM+Plex+Mono:wght@400;500"] },
    "bold-confident": { display: "Archivo", body: "Inter", mono: "IBM Plex Mono", requests: ["Archivo:wght@500..800", "Inter:wght@400..600", "IBM+Plex+Mono:wght@400;500"] },
  },
  "conversion-sharp": {
    "light-elegant": { display: "Schibsted Grotesk", body: "Schibsted Grotesk", mono: "JetBrains Mono", requests: ["Schibsted+Grotesk:wght@400..700", "JetBrains+Mono:wght@400;500"] },
    "medium-modern": { display: "Schibsted Grotesk", body: "Schibsted Grotesk", mono: "JetBrains Mono", requests: ["Schibsted+Grotesk:wght@400..800", "JetBrains+Mono:wght@400;500"] },
    "bold-confident": { display: "Archivo", body: "Schibsted Grotesk", mono: "JetBrains Mono", requests: ["Archivo:wght@600..900", "Schibsted+Grotesk:wght@400..600", "JetBrains+Mono:wght@400;500"] },
  },
  "system-crafted": {
    "light-elegant": { display: "Figtree", body: "Figtree", mono: "IBM Plex Mono", requests: ["Figtree:wght@300..700", "IBM+Plex+Mono:wght@400;500"] },
    "medium-modern": { display: "Figtree", body: "Figtree", mono: "IBM Plex Mono", requests: ["Figtree:wght@400..800", "IBM+Plex+Mono:wght@400;500"] },
    "bold-confident": { display: "Archivo", body: "Figtree", mono: "IBM Plex Mono", requests: ["Archivo:wght@600..900", "Figtree:wght@400..700", "IBM+Plex+Mono:wght@400;500"] },
  },
  "refined-story": {
    "light-elegant": { display: "Fraunces", body: "Source Sans 3", mono: "IBM Plex Mono", requests: ["Fraunces:opsz,wght@9..144,300..600", "Source+Sans+3:wght@300..600", "IBM+Plex+Mono:wght@400;500"] },
    "medium-modern": { display: "Newsreader", body: "Source Sans 3", mono: "IBM Plex Mono", requests: ["Newsreader:opsz,wght@6..72,300..600", "Source+Sans+3:wght@300..600", "IBM+Plex+Mono:wght@400;500"] },
    "bold-confident": { display: "Fraunces", body: "Source Sans 3", mono: "IBM Plex Mono", requests: ["Fraunces:opsz,wght@9..144,500..900", "Source+Sans+3:wght@400..700", "IBM+Plex+Mono:wght@400;500"] },
  },
};

/**
 * Radius ladder. Corpus corridor asks for ≥ 5 distinct radii — a scale, not one rounded value
 * applied to everything.
 */
function radiusScale(rounding: RoundingDepth): Record<string, string> {
  if (rounding === "sharp") {
    return { xs: "0px", sm: "1px", md: "2px", lg: "3px", xl: "4px", pill: "999px" };
  }
  if (rounding === "soft-elevation") {
    return { xs: "3px", sm: "6px", md: "10px", lg: "16px", xl: "24px", pill: "999px" };
  }
  return { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "18px", pill: "999px" };
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

export function buildTokens(taste: TasteControls, siteKind: SiteKind, brandAccent?: string): DesignTokens {
  const palette = buildPalette(taste.colorMood, brandAccent);
  const pairing = PAIRINGS[taste.aestheticLean][taste.typographyWeight];
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
