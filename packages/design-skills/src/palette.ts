/**
 * Palette construction.
 *
 * Measured corridors this targets (docs/10_DESIGN_EVIDENCE.md):
 *  - ≥ 4 distinct surface colours on a page — depth comes from layered surfaces, not shadows
 *  - ≥ 4 distinct ink tones — a primary/secondary/tertiary ink system, not one grey
 *  - ≤ 5 distinct hues — restraint is what reads as expensive
 *  - neutral saturation 0–4.3% — designed neutrals carry a faint temperature, never a strong tint
 *  - median text contrast ≥ 11 — premium pages are legible by default, not just at display sizes
 */
import { contrastHex, ensureContrast, mixHex, oklchToHex, hexToRgb, rgbToOklch } from "./color";
import type { ColorMood, SurfaceLevel } from "./types";

export interface Palette {
  /** Base page surface. */
  paper: string;
  /** One step off the page — panels, quiet bands. */
  paperRaised: string;
  /** One step into the page — wells, code, inputs. */
  paperSunken: string;
  /** Strongly contrasting band used once or twice per page. */
  inverse: string;
  inverseInk: string;
  inverseInkMuted: string;
  /** Ink ramp. */
  ink: string;
  inkBody: string;
  inkSecondary: string;
  inkTertiary: string;
  inkQuiet: string;
  /** Accent family. */
  accent: string;
  accentHover: string;
  accentInk: string;
  accentSurface: string;
  accentBorder: string;
  /** Structure. */
  border: string;
  borderStrong: string;
  /** Supporting signal hue for data/positive states. */
  signal: string;
  signalSurface: string;
  isDark: boolean;
  /** Measured contrasts, reported so reconciliation can prove the floor was held. */
  contrast: {
    headingOnPaper: number;
    bodyOnPaper: number;
    secondaryOnPaper: number;
    tertiaryOnPaper: number;
    accentOnPaper: number;
    inkOnAccent: number;
    inkOnInverse: number;
  };
}

interface MoodSeed {
  /** Hue carried by the paper surfaces, when the mood asks for warmth at all. */
  paperHue: number;
  /**
   * Chroma of the paper surfaces only. Kept under the measured ceiling so the tint reads as
   * paper stock rather than as a colour cast.
   */
  paperChroma: number;
  accentHue: number;
  accentChroma: number;
  signalHue: number;
  dark: boolean;
  /** Lightness of the page surface in OKL. */
  paperL: number;
}

/**
 * The single most surprising thing the corpus said, and the thing this engine had backwards.
 *
 * 37 of 53 usable references measure a neutral saturation of exactly 0. Their greys are literal
 * `rgb(255,255,255)`, `rgb(17,17,17)`, `rgb(250,250,250)`, `rgb(119,119,119)`. The handful that
 * carry any tint at all sit at 2.5–4.3, and in every one of those cases the warmth is in the
 * *paper stock* (`rgb(255,251,244)`, `rgb(242,240,235)`) while the ink stays a pure grey.
 *
 * So the law is not "designed neutrals carry a whisper of the brand hue" — that is the tell, and
 * an engine that smears the accent hue through every grey measures as a colour cast. The law is:
 * ink is achromatic, structure is achromatic, and warmth — if the brand wants any — lives in the
 * paper and the accent family, where it is a deliberate choice rather than a wash.
 */
const MOODS: Record<ColorMood, MoodSeed> = {
  /*
   * Accent hues stay off the purple/violet cluster (≈250–280) that reads as default AI chrome.
   * Neutral-professional is steel-ink blue; soft-brand is olive-copper (not cream+terracotta);
   * light-airy is clear cyan-blue. Paper may carry a faint stock tint; ink stays achromatic.
   */
  "neutral-professional": { paperHue: 220, paperChroma: 0.004, accentHue: 215, accentChroma: 0.14, signalHue: 155, dark: false, paperL: 0.985 },
  "soft-brand-accent": { paperHue: 85, paperChroma: 0.01, accentHue: 55, accentChroma: 0.12, signalHue: 148, dark: false, paperL: 0.978 },
  "dark-premium": { paperHue: 230, paperChroma: 0.006, accentHue: 195, accentChroma: 0.12, signalHue: 162, dark: true, paperL: 0.19 },
  "light-airy": { paperHue: 210, paperChroma: 0.003, accentHue: 205, accentChroma: 0.15, signalHue: 168, dark: false, paperL: 0.99 },
};

/**
 * Pull a hue and chroma out of a supplied brand hex so the accent family re-tunes around it.
 * The neutral ramp deliberately does not move: a brand colour is not a licence to tint the ink.
 */
function seedFromAccent(hex: string, base: MoodSeed): MoodSeed {
  const rgb = hexToRgb(hex);
  if (!rgb) return base;
  const { c, h } = rgbToOklch(rgb);
  return {
    ...base,
    accentHue: h,
    accentChroma: Math.max(0.06, Math.min(0.2, c)),
    signalHue: (h + 130) % 360,
  };
}

/** Snap a channel triple to a literal grey so the value measures as achromatic, not "almost". */
function grey(l: number): string {
  const v = Math.max(0, Math.min(255, Math.round(oklToSrgbGrey(l) * 255)));
  const hex = v.toString(16).padStart(2, "0");
  return `#${hex}${hex}${hex}`;
}

/** Inverse of the sRGB transfer function applied to an OKL lightness, for grey generation. */
function oklToSrgbGrey(l: number): number {
  const linear = l ** 3;
  return linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
}

/** Walk a literal grey until it clears a contrast floor against `against`. */
function greyAtContrast(startL: number, against: string, min: number, dark: boolean): string {
  let l = startL;
  for (let i = 0; i < 60; i += 1) {
    const hex = grey(l);
    if (contrastHex(hex, against) >= min) return hex;
    l += dark ? 0.012 : -0.012;
    if (l <= 0 || l >= 1) break;
  }
  return grey(Math.max(0, Math.min(1, l)));
}

export function buildPalette(mood: ColorMood, brandAccent?: string): Palette {
  const seed = brandAccent ? seedFromAccent(brandAccent, MOODS[mood]) : MOODS[mood];
  const { paperHue: ph, paperChroma: pc, accentHue: ah, accentChroma: ac, signalHue: sh, dark } = seed;

  // Paper stock may carry warmth. Everything structural below it does not.
  const surface = (l: number, chromaScale = 1) =>
    pc === 0 ? grey(l) : oklchToHex({ l, c: pc * chromaScale, h: ph });

  const paper = surface(seed.paperL);
  const paperRaised = dark ? surface(seed.paperL + 0.045, 0.8) : surface(seed.paperL - 0.028, 1.1);
  const paperSunken = dark
    ? surface(Math.max(0.08, seed.paperL - 0.055), 0.6)
    : surface(seed.paperL - 0.058, 1.25);

  /*
   * Inverse is not a pure grey slab. A faint accent temperature in the dark band is what makes a
   * tonal beat feel authored rather than toggled — still near-black, never a purple mesh.
   */
  const inverse = dark
    ? grey(0.93)
    : oklchToHex({ l: 0.2, c: Math.min(0.028, ac * 0.18), h: ah });
  const inverseInk = dark ? grey(0.2) : grey(0.975);
  const inverseInkMuted = dark
    ? grey(0.42)
    : oklchToHex({ l: 0.8, c: Math.min(0.02, ac * 0.12), h: ah });

  /*
   * Ink ramp: literal greys, solved against the page so each contrast floor is a fact.
   *
   * The corpus median text contrast is 15:1. Reference pages do not set prose in mid grey — they
   * set it near full contrast and build hierarchy out of size, weight, and space instead. The
   * secondary and tertiary tones exist for labels and captions, not for paragraphs, so their
   * floors are set high enough that using them on prose still passes.
   */
  const ink = greyAtContrast(dark ? 0.96 : 0.19, paper, 15, dark);
  const inkBody = greyAtContrast(dark ? 0.9 : 0.25, paper, 12.5, dark);
  const inkSecondary = greyAtContrast(dark ? 0.8 : 0.36, paper, 10, dark);
  const inkTertiary = greyAtContrast(dark ? 0.68 : 0.47, paper, 7, dark);
  const inkQuiet = greyAtContrast(dark ? 0.56 : 0.58, paper, 4.6, dark);

  const accent = oklchToHex(ensureContrast({ l: dark ? 0.72 : 0.52, c: ac, h: ah }, paper, 4.6));
  const accentHover = oklchToHex({ l: dark ? 0.79 : 0.44, c: ac, h: ah });
  const accentRgb = hexToRgb(accent)!;
  const accentL = rgbToOklch(accentRgb).l;
  const accentInk =
    contrastHex(accent, "#ffffff") >= 4.5
      ? oklchToHex({ l: 0.99, c: 0.005, h: ah })
      : oklchToHex({ l: 0.16, c: 0.02, h: ah });
  const accentSurface = dark
    ? oklchToHex({ l: seed.paperL + 0.07, c: ac * 0.28, h: ah })
    : oklchToHex({ l: 0.955, c: ac * 0.22, h: ah });
  const accentBorder = dark
    ? oklchToHex({ l: seed.paperL + 0.16, c: ac * 0.42, h: ah })
    : oklchToHex({ l: 0.87, c: ac * 0.34, h: ah });

  const border = dark ? grey(seed.paperL + 0.1) : grey(0.895);
  const borderStrong = dark ? grey(seed.paperL + 0.2) : grey(0.79);

  const signal = oklchToHex(ensureContrast({ l: dark ? 0.74 : 0.5, c: 0.11, h: sh }, paper, 4.5));
  const signalSurface = dark
    ? oklchToHex({ l: seed.paperL + 0.06, c: 0.03, h: sh })
    : oklchToHex({ l: 0.955, c: 0.03, h: sh });

  return {
    paper,
    paperRaised,
    paperSunken,
    inverse,
    inverseInk,
    inverseInkMuted,
    ink,
    inkBody,
    inkSecondary,
    inkTertiary,
    inkQuiet,
    accent,
    accentHover,
    accentInk,
    accentSurface,
    accentBorder,
    border,
    borderStrong,
    signal,
    signalSurface,
    isDark: dark,
    contrast: {
      headingOnPaper: contrastHex(ink, paper),
      bodyOnPaper: contrastHex(inkBody, paper),
      secondaryOnPaper: contrastHex(inkSecondary, paper),
      tertiaryOnPaper: contrastHex(inkTertiary, paper),
      accentOnPaper: contrastHex(accent, paper),
      inkOnAccent: contrastHex(accentInk, accent),
      inkOnInverse: contrastHex(inverseInk, inverse),
    },
  };
}

/** Resolve a section's surface level to concrete colours. Alternating levels is what gives rhythm. */
export function surfaceColors(palette: Palette, level: SurfaceLevel): {
  bg: string;
  ink: string;
  inkMuted: string;
  border: string;
} {
  switch (level) {
    case "raised":
      return { bg: palette.paperRaised, ink: palette.ink, inkMuted: palette.inkSecondary, border: palette.border };
    case "sunken":
      return { bg: palette.paperSunken, ink: palette.ink, inkMuted: palette.inkSecondary, border: palette.border };
    case "inverse":
      return {
        bg: palette.inverse,
        ink: palette.inverseInk,
        inkMuted: palette.inverseInkMuted,
        border: mixHex(palette.inverse, palette.inverseInk, 0.16),
      };
    case "accent":
      return { bg: palette.accentSurface, ink: palette.ink, inkMuted: palette.inkSecondary, border: palette.accentBorder };
    default:
      return { bg: palette.paper, ink: palette.ink, inkMuted: palette.inkSecondary, border: palette.border };
  }
}
