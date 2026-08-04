/**
 * Palette bench — print every token in a palette as hex + HSL saturation.
 *
 * The corpus probe classifies any colour with HSL saturation <= 12 as a "neutral" and reports the
 * median of that set. So the only way to hit the measured neutral corridor is to know which of our
 * tokens land inside that set, which this prints.
 */
import { buildPalette } from "../../packages/design-skills/src/palette";
import { hexToRgb } from "../../packages/design-skills/src/color";
import type { ColorMood } from "../../packages/design-skills/src/types";

function hsl(hex: string): { s: number; l: number } {
  const c = hexToRgb(hex)!;
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }
  return { s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
}

const MOODS: ColorMood[] = ["neutral-professional", "soft-brand-accent", "dark-premium", "light-airy"];
const KEYS = [
  "paper",
  "paperRaised",
  "paperSunken",
  "ink",
  "inkBody",
  "inkSecondary",
  "inkTertiary",
  "inkQuiet",
  "border",
  "borderStrong",
  "inverse",
  "inverseInk",
  "inverseInkMuted",
  "accent",
  "accentHover",
  "accentInk",
  "accentSurface",
  "accentBorder",
  "signal",
  "signalSurface",
] as const;

for (const mood of MOODS) {
  const p = buildPalette(mood) as unknown as Record<string, string>;
  const rows = KEYS.map((k) => ({ k, hex: p[k]!, ...hsl(p[k]!) }));
  const neutrals = rows.filter((r) => r.s <= 12).map((r) => r.s).sort((a, b) => a - b);
  const median = neutrals.length ? neutrals[Math.floor(neutrals.length / 2)] : null;
  console.log(`\n${mood}  neutralMedianSat=${median}  neutrals=[${neutrals.join(", ")}]`);
  console.log(JSON.stringify(buildPalette(mood).contrast));
  for (const r of rows) console.log(`  ${r.k.padEnd(16)} ${r.hex}  s=${String(r.s).padStart(5)}  l=${r.l}`);
}
