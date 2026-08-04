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
    bodyOnPaper: number;
    secondaryOnPaper: number;
    tertiaryOnPaper: number;
    accentOnPaper: number;
    inkOnAccent: number;
    inkOnInverse: number;
  };
}

interface MoodSeed {
  /** Hue for the neutral ramp — the faint temperature that separates designed greys from #808080. */
  neutralHue: number;
  /** Chroma of the neutral ramp; measured references sit under ~4.3% HSL saturation. */
  neutralChroma: number;
  accentHue: number;
  accentChroma: number;
  signalHue: number;
  dark: boolean;
  /** Lightness of the page surface in OKL. */
  paperL: number;
}

const MOODS: Record<ColorMood, MoodSeed> = {
  "neutral-professional": { neutralHue: 250, neutralChroma: 0.006, accentHue: 258, accentChroma: 0.15, signalHue: 155, dark: false, paperL: 0.985 },
  "soft-brand-accent": { neutralHue: 62, neutralChroma: 0.008, accentHue: 28, accentChroma: 0.13, signalHue: 148, dark: false, paperL: 0.975 },
  "dark-premium": { neutralHue: 258, neutralChroma: 0.008, accentHue: 232, accentChroma: 0.13, signalHue: 162, dark: true, paperL: 0.19 },
  "light-airy": { neutralHue: 220, neutralChroma: 0.005, accentHue: 224, accentChroma: 0.16, signalHue: 168, dark: false, paperL: 0.99 },
};

/** Pull a hue and chroma out of a supplied brand hex so the whole system re-tunes around it. */
function seedFromAccent(hex: string, base: MoodSeed): MoodSeed {
  const rgb = hexToRgb(hex);
  if (!rgb) return base;
  const { c, h } = rgbToOklch(rgb);
  return {
    ...base,
    accentHue: h,
    accentChroma: Math.max(0.06, Math.min(0.2, c)),
    // Neutrals inherit a whisper of the brand hue: this is what makes a palette feel authored.
    neutralHue: h,
    neutralChroma: base.neutralChroma,
    signalHue: (h + 130) % 360,
  };
}

export function buildPalette(mood: ColorMood, brandAccent?: string): Palette {
  const seed = brandAccent ? seedFromAccent(brandAccent, MOODS[mood]) : MOODS[mood];
  const { neutralHue: nh, neutralChroma: nc, accentHue: ah, accentChroma: ac, signalHue: sh, dark } = seed;

  const paper = oklchToHex({ l: seed.paperL, c: nc, h: nh });
  const paperRaised = dark
    ? oklchToHex({ l: seed.paperL + 0.045, c: nc * 1.2, h: nh })
    : oklchToHex({ l: seed.paperL - 0.028, c: nc * 1.4, h: nh });
  const paperSunken = dark
    ? oklchToHex({ l: Math.max(0.08, seed.paperL - 0.055), c: nc, h: nh })
    : oklchToHex({ l: seed.paperL - 0.055, c: nc * 1.6, h: nh });

  const inverse = dark
    ? oklchToHex({ l: 0.93, c: nc * 1.5, h: nh })
    : oklchToHex({ l: 0.19, c: nc * 2.2, h: nh });
  const inverseInk = dark ? oklchToHex({ l: 0.2, c: nc * 2, h: nh }) : oklchToHex({ l: 0.965, c: nc, h: nh });
  const inverseInkMuted = dark ? oklchToHex({ l: 0.42, c: nc * 2, h: nh }) : oklchToHex({ l: 0.76, c: nc * 1.6, h: nh });

  // Ink ramp: solve each tone against the page so the contrast floor is a fact, not a hope.
  const inkBase = dark ? { l: 0.96, c: nc * 1.2, h: nh } : { l: 0.19, c: nc * 2.4, h: nh };
  const ink = oklchToHex(ensureContrast(inkBase, paper, 13));
  const inkSecondary = oklchToHex(
    ensureContrast(dark ? { l: 0.78, c: nc * 2, h: nh } : { l: 0.42, c: nc * 3, h: nh }, paper, 7.2),
  );
  const inkTertiary = oklchToHex(
    ensureContrast(dark ? { l: 0.63, c: nc * 2, h: nh } : { l: 0.55, c: nc * 3, h: nh }, paper, 4.8),
  );
  const inkQuiet = oklchToHex(
    ensureContrast(dark ? { l: 0.52, c: nc * 2, h: nh } : { l: 0.64, c: nc * 3, h: nh }, paper, 3.4),
  );

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

  const border = dark
    ? oklchToHex({ l: seed.paperL + 0.1, c: nc * 1.6, h: nh })
    : oklchToHex({ l: 0.895, c: nc * 3, h: nh });
  const borderStrong = dark
    ? oklchToHex({ l: seed.paperL + 0.2, c: nc * 1.6, h: nh })
    : oklchToHex({ l: 0.79, c: nc * 3, h: nh });

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
      bodyOnPaper: contrastHex(ink, paper),
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
