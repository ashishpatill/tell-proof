/**
 * Perceptual colour for the design engine.
 *
 * Ramps are built in OKLCh so that a step in lightness looks like a step in lightness, then
 * converted to sRGB hex for output. Flat hand-picked palettes are the reason generated pages read
 * as generic: every surface sits at the same perceived depth and every neutral is the same
 * temperature. Ramps fix both, and let contrast be solved for rather than hoped for.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Oklch {
  /** Perceptual lightness, 0..1 */
  l: number;
  /** Chroma, 0..~0.37 in sRGB gamut */
  c: number;
  /** Hue in degrees */
  h: number;
}

/* ------------------------------------------------------------------ */
/* sRGB <-> OKLab                                                      */
/* ------------------------------------------------------------------ */

function srgbToLinear(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
}

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = l - 0.0894841775 * A - 1.291485548 * B;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const lr = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const lg = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const lb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  return { r: linearToSrgb(lr), g: linearToSrgb(lg), b: linearToSrgb(lb) };
}

/** Reduce chroma until the colour is representable in sRGB without clipping. */
export function gamutClamp(color: Oklch): Oklch {
  let c = color.c;
  for (let i = 0; i < 24; i += 1) {
    const { r, g, b } = oklchToRgb({ ...color, c });
    const back = rgbToOklch({ r, g, b });
    const drift = Math.abs(back.l - color.l) + Math.abs(back.c - c) / 2;
    if (drift < 0.012 || c <= 0.001) break;
    c *= 0.88;
  }
  return { ...color, c };
}

export function hexToRgb(hex: string): Rgb | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const [r, g, b] = clean.split("");
    return { r: parseInt(r! + r!, 16), g: parseInt(g! + g!, 16), b: parseInt(b! + b!, 16) };
  }
  if (clean.length === 6 || clean.length === 8) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function oklchToHex(color: Oklch): string {
  return rgbToHex(oklchToRgb(gamutClamp(color)));
}

/* ------------------------------------------------------------------ */
/* Contrast                                                            */
/* ------------------------------------------------------------------ */

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function contrastHex(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 1;
  return Number(contrastRatio(ra, rb).toFixed(2));
}

/**
 * Move `color` along its own lightness axis until it clears `min` contrast against `against`.
 * Preserves hue and chroma so the result still belongs to the palette rather than degrading to
 * black or white.
 */
export function ensureContrast(color: Oklch, against: string, min: number): Oklch {
  const bg = hexToRgb(against);
  if (!bg) return color;
  const bgLum = relativeLuminance(bg);
  const goDarker = bgLum > 0.35;
  let candidate = { ...color };
  for (let i = 0; i < 40; i += 1) {
    const rgb = oklchToRgb(gamutClamp(candidate));
    if (contrastRatio(rgb, bg) >= min) return candidate;
    candidate = {
      ...candidate,
      l: goDarker ? Math.max(0.02, candidate.l - 0.022) : Math.min(0.99, candidate.l + 0.022),
      // Deep and very light colours cannot hold much chroma; ease it off as we travel.
      c: candidate.c * 0.985,
    };
  }
  return candidate;
}

/** Even lightness ladder around a hue, used for surfaces and ink ramps. */
export function ramp(hue: number, chroma: number, lightnesses: number[], chromaCurve?: (t: number) => number): string[] {
  return lightnesses.map((l, i) => {
    const t = lightnesses.length > 1 ? i / (lightnesses.length - 1) : 0;
    const c = chroma * (chromaCurve ? chromaCurve(t) : 1);
    return oklchToHex({ l, c, h: hue });
  });
}

/** Mix two hex colours perceptually. `amount` is how much of `b` lands in the result. */
export function mixHex(a: string, b: string, amount: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  const oa = rgbToOklch(ra);
  const ob = rgbToOklch(rb);
  let dh = ob.h - oa.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return oklchToHex({
    l: oa.l + (ob.l - oa.l) * amount,
    c: oa.c + (ob.c - oa.c) * amount,
    h: oa.h + dh * amount,
  });
}
