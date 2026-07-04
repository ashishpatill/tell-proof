// The encoded de-genericization methodology (docs/05_GENERICNESS_METHODOLOGY.md).
// Every constant here maps to a numbered rule; nothing is a hand-wave.

import { clamp, hslHex, type Hsl } from "./color";

// ── §1 T1: default-font monoculture ────────────────────────────────
export const DEFAULT_FONT_RE = /inter|system-ui|-apple-system|blinkmacsystemfont|segoe|roboto|open sans|helvetica|arial|sans-serif|ui-sans-serif/i;
// Second-favourite AI convergence font — soft tell as a sole display voice.
export const SOFT_DEFAULT_RE = /space grotesk/i;

// ── §1 T3: the documented "AI slop" accent hues (indigo/violet/purple-500) ──
export const AI_DEFAULT_HUES = [239, 258, 271]; // H° of #6366F1 #8B5CF6 #A855F7
export function matchesAIDefaultHue(h: Hsl): boolean {
  return h.h >= 230 && h.h <= 280 && h.s >= 0.7 && h.l >= 0.5 && h.l <= 0.72;
}
export function isElectric(h: Hsl): boolean {
  return h.s >= 0.85 && h.l >= 0.5 && h.l <= 0.65;
}

// ── §2: modular type scale ─────────────────────────────────────────
export const TYPE_RATIOS: Record<string, number> = {
  minorThird: 1.2, majorThird: 1.25, perfectFourth: 1.333, augFourth: 1.414, golden: 1.618,
};
/** Snap an arbitrary size onto base·ratio^n, never below 12px. §2 */
export function snapType(size: number, base: number, ratio: number): number {
  if (size <= 0) return base;
  const n = Math.round(Math.log(size / base) / Math.log(ratio));
  return Math.max(12, Math.round(base * Math.pow(ratio, n)));
}
/** Which canonical ratio best explains a set of sizes, and how well (0..1). §2 */
export function inferTypeScale(sizes: number[], base: number): { ratio: number; name: string; fit: number } {
  let best = { ratio: 1.25, name: "majorThird", fit: 0 };
  for (const [name, ratio] of Object.entries(TYPE_RATIOS)) {
    let fits = 0;
    for (const s of sizes) {
      if (s <= 0) continue;
      const n = Math.log(s / base) / Math.log(ratio);
      if (Math.abs(n - Math.round(n)) <= 0.15) fits++;
    }
    const fit = sizes.length ? fits / sizes.length : 0;
    if (fit > best.fit) best = { ratio, name, fit };
  }
  return best;
}

// ── §3: spacing rhythm ─────────────────────────────────────────────
export const SPACE_SCALE = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
export function snapSpace(v: number): number {
  if (v <= 2) return v <= 1 ? 0 : 2;
  if (v > 128) return 32 * Math.round(v / 32);
  return SPACE_SCALE.reduce((a, b) => (Math.abs(b - v) <= Math.abs(a - v) ? b : a));
}
export function onGrid(v: number): boolean {
  return v <= 2 || v % 4 === 0;
}

// ── §4: elevation ramp (light-from-above, blur≈2·y, spread≤0) ───────
export const ELEVATION: Record<0 | 1 | 2 | 3, string> = {
  0: "none",
  1: "0 1px 3px rgba(20,16,12,.10), 0 1px 2px rgba(20,16,12,.06)",
  2: "0 4px 6px -1px rgba(20,16,12,.10), 0 2px 4px -2px rgba(20,16,12,.10)",
  3: "0 20px 25px -5px rgba(20,16,12,.14), 0 8px 10px -6px rgba(20,16,12,.12)",
};

// ── §5: taming an accent into a considered band ────────────────────
/**
 * Given the page's accent HSL and the direction's signature, return the reconciled accent.
 * - brand hue that is NOT the AI default → keep hue, move S/L into a considered band.
 * - AI-default / electric accent with no brand mandate → adopt the direction's signature hue.
 */
export function tameAccent(before: Hsl | null, sig: Hsl, band: { s: number; l: number }): { hex: string; tamed: boolean } {
  if (!before) return { hex: hslHex(sig.h, sig.s, sig.l), tamed: true };
  if (matchesAIDefaultHue(before) || isElectric(before) || (before.h >= 200 && before.h <= 300 && before.s > 0.55)) {
    return { hex: hslHex(sig.h, sig.s, sig.l), tamed: true };
  }
  // Respect the brand hue; only pull saturation + lightness into the considered band.
  return { hex: hslHex(before.h, clamp(band.s, 0.4, 0.8), clamp(band.l, 0.32, 0.52)), tamed: false };
}

// ── §7: curated directions (mood → authored type pairing + tokens) ──
export type Direction = {
  id: string;
  label: string;
  mood: string;
  summary: string;
  display: string;
  displayGF: string;   // Google Fonts family spec
  body: string;
  bodyGF: string;
  mono: string;
  monoGF: string;
  headingWeight: number;
  bodyWeight: number;
  ratio: number;       // §2 type-scale ratio
  spacingBase: number; // §3
  radius: string;
  sig: Hsl;            // signature accent when taming a generic/acid input
  band: { s: number; l: number }; // band to harmonize a decent brand hue into
  paperLight: string;
  paperDark: string;
  keywords: string[];  // matched against free-text art-direction
};

export const DIRECTIONS: Record<string, Direction> = {
  editorial: {
    id: "editorial", label: "Editorial warm", mood: "editorial, warm, characterful",
    summary: "Fraunces headlines with optical size, humanist body, one terracotta mark, depth composed not repeated.",
    display: "Fraunces", displayGF: "Fraunces:opsz,wght@9..144,500;9..144,600;9..144,900",
    body: "Public Sans", bodyGF: "Public+Sans:wght@400;500;600;700",
    mono: "Fragment Mono", monoGF: "Fragment+Mono:ital@0;1",
    headingWeight: 600, bodyWeight: 400, ratio: 1.25, spacingBase: 8, radius: "10px",
    sig: { h: 18, s: 0.58, l: 0.46 }, band: { s: 0.5, l: 0.44 },
    paperLight: "#F4EEE3", paperDark: "#17140F",
    keywords: ["editorial", "warm", "magazine", "serif", "human", "print", "considered", "elegant"],
  },
  precision: {
    id: "precision", label: "Precision instrument", mood: "technical, precise, data-forward",
    summary: "Schibsted Grotesk display, IBM Plex body + mono, measured neutrals, sharp radius, zero decorative depth.",
    display: "Schibsted Grotesk", displayGF: "Schibsted+Grotesk:wght@500;700;800",
    body: "IBM Plex Sans", bodyGF: "IBM+Plex+Sans:wght@400;500;600",
    mono: "IBM Plex Mono", monoGF: "IBM+Plex+Mono:wght@400;500",
    headingWeight: 700, bodyWeight: 400, ratio: 1.2, spacingBase: 8, radius: "4px",
    sig: { h: 205, s: 0.5, l: 0.4 }, band: { s: 0.46, l: 0.4 },
    paperLight: "#F2F1EE", paperDark: "#121316",
    keywords: ["precision", "technical", "sharp", "developer", "data", "dashboard", "minimal", "clean", "grotesk"],
  },
  "bold-contrast": {
    id: "bold-contrast", label: "Bold contrast", mood: "bold, dramatic, high-energy",
    summary: "Bricolage Grotesque at heavy weight, Figtree body, high-contrast accent, one dramatic elevation.",
    display: "Bricolage Grotesque", displayGF: "Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800",
    body: "Figtree", bodyGF: "Figtree:wght@400;500;600;700",
    mono: "JetBrains Mono", monoGF: "JetBrains+Mono:wght@400;500",
    headingWeight: 800, bodyWeight: 400, ratio: 1.333, spacingBase: 8, radius: "2px",
    sig: { h: 12, s: 0.72, l: 0.5 }, band: { s: 0.66, l: 0.48 },
    paperLight: "#F1EAE0", paperDark: "#120F0C",
    keywords: ["bold", "dramatic", "loud", "punchy", "startup", "energy", "confident", "contrast"],
  },
  "warm-minimal": {
    id: "warm-minimal", label: "Warm minimal", mood: "warm, human, calm",
    summary: "Lora headings, Karla body, gentle radius, quiet single-source depth on a warm paper.",
    display: "Lora", displayGF: "Lora:ital,wght@0,500;0,600;1,500",
    body: "Karla", bodyGF: "Karla:wght@400;500;600",
    mono: "Space Mono", monoGF: "Space+Mono:wght@400;700",
    headingWeight: 600, bodyWeight: 400, ratio: 1.25, spacingBase: 8, radius: "8px",
    sig: { h: 28, s: 0.5, l: 0.46 }, band: { s: 0.44, l: 0.44 },
    paperLight: "#F6F1E9", paperDark: "#191512",
    keywords: ["warm", "minimal", "calm", "human", "health", "education", "soft", "friendly"],
  },
  luxury: {
    id: "luxury", label: "Classic luxury", mood: "refined, premium, editorial",
    summary: "Playfair Display headlines, Source Sans body, deep authoritative accent, restrained gold-leaf depth.",
    display: "Playfair Display", displayGF: "Playfair+Display:wght@600;700",
    body: "Source Sans 3", bodyGF: "Source+Sans+3:wght@400;600",
    mono: "Fragment Mono", monoGF: "Fragment+Mono:ital@0",
    headingWeight: 700, bodyWeight: 400, ratio: 1.333, spacingBase: 8, radius: "3px",
    sig: { h: 350, s: 0.4, l: 0.34 }, band: { s: 0.4, l: 0.34 },
    paperLight: "#F5F1EB", paperDark: "#14110E",
    keywords: ["luxury", "premium", "refined", "elegant", "finance", "hospitality", "classic", "sophisticated"],
  },
  brutalist: {
    id: "brutalist", label: "Brutalist utility", mood: "utilitarian, raw, structural",
    summary: "Archivo Black display, Work Sans body, mono details, hard 0px radius, ink borders instead of shadow.",
    display: "Archivo", displayGF: "Archivo:wdth,wght@100,700;125,800",
    body: "Work Sans", bodyGF: "Work+Sans:wght@400;500;600",
    mono: "Space Mono", monoGF: "Space+Mono:wght@400;700",
    headingWeight: 800, bodyWeight: 400, ratio: 1.414, spacingBase: 8, radius: "0px",
    sig: { h: 8, s: 0.62, l: 0.46 }, band: { s: 0.58, l: 0.44 },
    paperLight: "#F0EFEA", paperDark: "#111110",
    keywords: ["brutalist", "raw", "utility", "structural", "archive", "mono", "industrial", "anti-design"],
  },
};

export const DIRECTION_ALIASES: Record<string, string> = {
  "editorial-warm": "editorial",
  "precision-instrument": "precision",
  "bold-contrast": "bold-contrast",
  "warm-minimal": "warm-minimal",
  "classic-luxury": "luxury",
  "brutalist-utility": "brutalist",
};

/** Accept reconcile ids, taste-preset ids, or free-text art-direction. §7 */
export function resolveDirection(id: string): Direction {
  const key = (id ?? "").toLowerCase().trim();
  if (DIRECTIONS[key]) return DIRECTIONS[key]!;
  if (DIRECTION_ALIASES[key]) return DIRECTIONS[DIRECTION_ALIASES[key]!]!;
  // free-text: score each direction's keywords against the phrase
  let best = { dir: DIRECTIONS.editorial!, hits: 0 };
  for (const dir of Object.values(DIRECTIONS)) {
    const hits = dir.keywords.reduce((n, k) => n + (key.includes(k) ? 1 : 0), 0);
    if (hits > best.hits) best = { dir, hits };
  }
  if (best.hits > 0) return best.dir;
  const sub = Object.keys(DIRECTIONS).find((k) => key.includes(k) || k.includes(key));
  return sub ? DIRECTIONS[sub]! : DIRECTIONS.editorial!;
}
