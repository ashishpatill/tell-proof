import type { AestheticLean, ColorMood, DesignTokens, RoundingDepth, TasteControls, TypeWeight } from "./types";

const COLOR: Record<ColorMood, Pick<DesignTokens, "paper" | "paperAlt" | "ink" | "inkMuted" | "accent" | "accentInk" | "border">> = {
  "neutral-professional": {
    paper: "#F7F7F5",
    paperAlt: "#FFFFFF",
    ink: "#141414",
    inkMuted: "#5C5C57",
    accent: "#1F4B7A",
    accentInk: "#FFFFFF",
    border: "rgba(20,20,20,0.12)",
  },
  "soft-brand-accent": {
    paper: "#F8F6F2",
    paperAlt: "#FFFFFF",
    ink: "#1A1714",
    inkMuted: "#6E655C",
    accent: "#0F6E56",
    accentInk: "#FFFFFF",
    border: "rgba(26,23,20,0.12)",
  },
  "dark-premium": {
    paper: "#121212",
    paperAlt: "#1A1A1A",
    ink: "#F2F2F0",
    inkMuted: "#A3A39C",
    accent: "#7EB6FF",
    accentInk: "#0B1220",
    border: "rgba(242,242,240,0.14)",
  },
  "light-airy": {
    paper: "#FBFBFA",
    paperAlt: "#FFFFFF",
    ink: "#1C1C1A",
    inkMuted: "#6B6B66",
    accent: "#2A5FFF",
    accentInk: "#FFFFFF",
    border: "rgba(28,28,26,0.10)",
  },
};

function fonts(weight: TypeWeight, lean: AestheticLean): Pick<DesignTokens, "fontDisplay" | "fontBody"> {
  if (lean === "refined-story") {
    return { fontDisplay: "Source Serif 4", fontBody: "Source Sans 3" };
  }
  if (lean === "minimal-clean") {
    return { fontDisplay: "IBM Plex Sans", fontBody: "IBM Plex Sans" };
  }
  if (weight === "bold-confident") {
    return { fontDisplay: "Schibsted Grotesk", fontBody: "IBM Plex Sans" };
  }
  if (weight === "light-elegant") {
    return { fontDisplay: "Instrument Serif", fontBody: "Source Sans 3" };
  }
  return { fontDisplay: "Source Sans 3", fontBody: "Source Sans 3" };
}

function radiusDepth(r: RoundingDepth): Pick<DesignTokens, "radius" | "shadow"> {
  if (r === "sharp") return { radius: "2px", shadow: "none" };
  if (r === "soft-elevation") return { radius: "12px", shadow: "0 8px 28px rgba(0,0,0,0.08)" };
  return { radius: "8px", shadow: "0 1px 0 rgba(0,0,0,0.04)" };
}

function contentMax(lean: AestheticLean, density: TasteControls["density"]): string {
  if (lean === "refined-story" || lean === "minimal-clean") return density === "sparse" ? "680px" : "720px";
  if (density === "information-rich") return "1120px";
  if (density === "sparse") return "880px";
  return "1040px";
}

const HEX_ACCENT = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Build CSS-facing tokens from taste controls (+ optional brand accent override). */
export function buildTokens(taste: TasteControls, brandAccent?: string): DesignTokens {
  const palette = { ...COLOR[taste.colorMood] };
  if (brandAccent && HEX_ACCENT.test(brandAccent)) palette.accent = brandAccent;
  const type = fonts(taste.typographyWeight, taste.aestheticLean);
  const depth = radiusDepth(taste.roundingDepth);
  const sectionY =
    taste.density === "sparse" ? "6rem" : taste.density === "information-rich" ? "3.5rem" : "5rem";

  return {
    ...palette,
    ...type,
    ...depth,
    contentMax: contentMax(taste.aestheticLean, taste.density),
    sectionY,
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
      "Extreme clarity and content-first lists",
      "Neutral functional presentation",
      "Zero decorative noise",
    ],
    sectionBias: "Clean statement heroes and sparse proof",
  },
  "conversion-sharp": {
    label: "Conversion sharp",
    principles: [
      "Strong hierarchy and repeated clear CTAs",
      "Benefit-driven sections unique to the client",
      "Generous whitespace with scannable flow",
    ],
    sectionBias: "Problem → solution → proof → action",
  },
  "system-crafted": {
    label: "System crafted",
    principles: [
      "Full token systems and consistent components",
      "Content architecture for complex products",
      "Purposeful micro-interaction only",
    ],
    sectionBias: "Design-system cohesion across every touchpoint",
  },
  "refined-story": {
    label: "Refined story",
    principles: [
      "Art-directed typography and visual systems",
      "Narrative depth without spectacle",
      "Motion supports story, never competes",
    ],
    sectionBias: "Editorial chapter rhythm for brand trust",
  },
};
