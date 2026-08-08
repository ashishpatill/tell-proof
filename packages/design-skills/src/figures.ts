/**
 * Figures — the drawn matter of a page.
 *
 * Measured reference pages devote roughly a quarter of their area to something drawn: an interface,
 * a chart, a diagram, a plate. Pages built only from type and rules read as manuscripts, and that
 * was the widest structural gap between this engine's output and the corpus — not a gap in tone or
 * spacing, which the scalar bands already covered, but the plain absence of anything to look at.
 *
 * Every figure here is:
 *  - derived from the brief, so it says something true about the product rather than decorating it
 *  - deterministic from a seed, so the same brief always draws the same figure
 *  - painted only in tokens, so it re-themes with the page and never contradicts the system
 *  - static, because a diagram that moves is a diagram competing with the argument beside it
 */
import type { Block, MetricSpec } from "./types";
import { FREE_PHOTOS } from "./free-assets";

/* ------------------------------------------------------------------ */
/* Deterministic values                                                */
/* ------------------------------------------------------------------ */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** xorshift — small, stable, and identical across runs and platforms. */
function rng(seed: string): () => number {
  let x = hash(seed) || 0x9e3779b9;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 0x100000000;
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Approximate glyph advance for figure labels (mono tracks wider than proportional). */
function approxAdvance(size: number, mono = false): number {
  return size * (mono ? 0.62 : 0.55);
}

/** Clip so set width stays inside a pixel budget — SVG text has no CSS ellipsis. */
function clipToWidth(s: string, maxPx: number, size: number, mono = false): string {
  const maxChars = Math.max(1, Math.floor(maxPx / approxAdvance(size, mono)));
  return clip(s, maxChars);
}

/**
 * Deal-chip copy for pipeline nodes: keep the amount readable; shorten the stage word first.
 * Long names like "Executive · 84k" blow past narrow column pills — prefer "E · 84k" over "Exe… · 84k".
 */
export function fitDealChip(stageTitle: string, amount: string, maxPx: number): string {
  const word = stageTitle.trim().split(/\s+/)[0] || "Deal";
  const sep = " · ";
  const size = FIG_MONO_PX;
  const maxChars = Math.max(4, Math.floor(maxPx / approxAdvance(size, true)));
  const full = `${word}${sep}${amount}`;
  if (full.length <= maxChars) return full;
  const wordBudget = maxChars - sep.length - amount.length;
  // Enough room for a readable stub (≥5 chars before ellipsis looks intentional).
  if (wordBudget >= Math.min(word.length, 5)) return `${clip(word, wordBudget)}${sep}${amount}`;
  const initial = `${word[0] ?? "D"}${sep}${amount}`;
  if (initial.length <= maxChars) return initial;
  return clipToWidth(amount, maxPx, size, true);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Break a sentence into lines of roughly `cols` characters.
 *
 * SVG has no line box, so any prose inside a drawing has to be broken here or set as one line that
 * runs off the edge. Breaking on words at a measured column is the same decision the page makes for
 * its body text, applied to the drawing.
 */
function wrap(s: string, cols: number, max: number): string[] {
  const words = s.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if (line.length + 1 + w.length <= cols) line += ` ${w}`;
    else {
      lines.push(line);
      line = w;
      if (lines.length === max) break;
    }
  }
  if (line && lines.length < max) lines.push(line);
  if (lines.length === max && words.join(" ").length > lines.join(" ").length) {
    lines[max - 1] = clip(`${lines[max - 1]}…`, cols + 1);
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

export type FigureKind =
  | "interface"
  | "series"
  | "flow"
  | "stack"
  | "horizon"
  | "lattice"
  | "mark"
  | "spark"
  | "signature"
  | "type-ladder"
  | "dossier-plate"
  | "signal-lattice"
  | "index-ledger"
  | "loom-weave"
  | "specimen-plate"
  | "press-sheet"
  | "path-plate"
  | "pipeline-board"
  | "queue-console"
  | "posture-grid"
  | "mechanism-plate"
  | "wire-ledger";

interface FrameOptions {
  /** Named for a screen reader; omit to mark the figure decorative. */
  label?: string;
  width: number;
  height: number;
  kind: FigureKind;
  /** Texture fields fill their band rather than preserving their drawn proportion. */
  stretch?: boolean;
  /**
   * Keep the drawing off the screen edge, as a share of its own width.
   *
   * A figure that bleeds the full viewport still has to respect the page's gutter, or its axis
   * labels sit four pixels from the edge of the screen while every other line on the page starts a
   * hundred pixels in. Widening the viewBox rather than shrinking the drawing means the inset
   * scales with the figure instead of being a fixed pixel value that is wrong at two viewports out
   * of three.
   */
  inset?: number;
  /**
   * Marks figures whose cells carry drawn page matter (not empty stroked rects).
   * Basics gate + showcase eye rely on this so empty SIG voids cannot ship again.
   */
  dense?: boolean;
}

/**
 * A figure without a label is decorative and must be hidden, because a diagram that restates the
 * paragraph beside it is noise in a screen reader even when it is the point on screen.
 */
function frame(body: string, o: FrameOptions): string {
  const a11y = o.label
    ? ` role="img" aria-label="${esc(o.label)}"`
    : ` role="presentation" aria-hidden="true" focusable="false"`;
  const par = o.stretch ? "none" : "xMidYMid meet";
  const pad = round((o.inset ?? 0) * o.width);
  const box = `${round(-pad)} 0 ${round(o.width + pad * 2)} ${o.height}`;
  const dense = o.dense ? ` data-dense="ink"` : "";
  return `<svg class="ds-fig" data-figure="${o.kind}"${dense} viewBox="${box}" preserveAspectRatio="${par}"${a11y}>${body}</svg>`;
}

/**
 * Where a figure is being asked to sit, which decides its proportion.
 *
 *  - `column` — beside fold copy, so roughly as tall as it is wide
 *  - `band`   — spanning the viewport, so wide and shallow enough to leave the fold readable
 *  - `plate`  — inside a container, between paragraphs
 */
export type FigureRole = "column" | "band" | "plate";

/**
 * How far a full-bleed drawing holds off the screen edge, as a share of its own width.
 *
 * Matched to the page gutter: at the widest container the engine sets, the content edge sits about
 * seven per cent of the viewport in from the screen. A bleeding figure whose labels start closer
 * than that reads as overflow rather than as a decision.
 */
const BLEED_INSET = 0.07;

/**
 * The height a full-bleed specimen is drawn to, in the same units as its own width.
 *
 * A quiet screen is one with almost no text on it. It is not one with almost nothing on it, and the
 * difference is the whole reason the beat exists: a wide, shallow drawing centred in a reserved
 * viewport leaves a hole a reader reads as a mistake, while a drawing that fills the screen reads as
 * the thing the screen was cleared for.
 *
 * A band renders at viewport width, so at the 1440×900 the corpus was measured on this is roughly
 * three quarters of the screen — the drawing owns the band, and the heading above it still fits.
 * Bands whose content genuinely cannot fill it are drawn shorter rather than padded to reach it,
 * because the section is now sized by its figure rather than the other way round.
 */
/*
 * Full-bleed bands target roughly three-quarters of a 900px research viewport.
 *
 * Hard-category folds (premium-b2b, art-directed studio) routinely put 0.7–1.0 of the first screen
 * into drawn matter. A 620–780 drawing left our pages at ~0.15 page-figure share; raising the
 * target grows real painted area rather than padding empty section height.
 */
const BAND_TARGET_H = 880;

/** Keep a computed dimension inside the range it is allowed to take. */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * A quantity a plotted line can honestly be the shape of.
 *
 * Briefs state their headline figures as strings, and for most products those strings are
 * capability names rather than readings — "Continuous close", "Long-hold capital". A chart drawn
 * over names is a random walk with a numeric axis under it, presented on a page selling something
 * as though it were evidence. This engine does not draw data it was not given.
 */
export function isReading(value: string): boolean {
  return /\d/.test(value) && value.replace(/[\d\s.,%×x/+-]/gi, "").length <= 3;
}

/**
 * The type ladder the drawings use.
 *
 * A page's ladder is measured across everything rendered on it, drawings included, and reference
 * pages travel between four and nine times from their smallest label to their display voice across
 * six to fourteen distinct steps. Left to accumulate, the figures here were setting eleven sizes of
 * their own — 11, 11.5, 12, 13 — differences no reader can see that spend steps a reader can. Six
 * named roles, shared by every drawing, is a ladder rather than a pile.
 *
 * `ordinal` is the ceiling, and it is deliberately below the smallest display size the engine sets
 * for any page. A drawing that can appear in the fold must never contain the largest type in the
 * fold: at 58 the stage numerals in a spanning hero were bigger than the headline beside them, and
 * both the eye and the probe read the numeral as the page's display voice.
 */
const FT = { micro: 11, small: 12, body: 15, title: 19, lead: 26, ordinal: 40 } as const;

/** Floor for every SVG mono label — below this invents an invisible type-step the probe still counts. */
export const FIG_MONO_PX = FT.micro;

const INK = "var(--surface-ink)";
const BODY = "var(--surface-body)";
const QUIET = "var(--surface-quiet)";
const LINE = "var(--surface-border)";
const PAPER = "var(--surface-bg)";
const ACCENT = "var(--c-accent)";
const ACCENT_FIELD = "var(--c-accent-surface)";

function text(
  s: string,
  x: number,
  y: number,
  opts: { size?: number; fill?: string; weight?: number; anchor?: string; mono?: boolean; track?: number } = {},
): string {
  // Mono labels share one step on the page ladder. Anything below FIG_MONO_PX is invisible craft
  // that still burns a distinctSizes slot (press atelier FT.micro=10 → type-steps 15).
  const raw = opts.size ?? FT.small;
  const size = opts.mono ? Math.max(FIG_MONO_PX, raw) : raw;
  const attrs = [
    `x="${round(x)}"`,
    `y="${round(y)}"`,
    `font-size="${size}"`,
    `fill="${opts.fill ?? BODY}"`,
  ];
  if (opts.weight) attrs.push(`font-weight="${opts.weight}"`);
  if (opts.anchor) attrs.push(`text-anchor="${opts.anchor}"`);
  if (opts.mono) attrs.push(`class="ds-fig-mono"`);
  if (opts.track) attrs.push(`letter-spacing="${opts.track}"`);
  return `<text ${attrs.join(" ")}>${esc(s)}</text>`;
}

function rule(x1: number, y1: number, x2: number, y2: number, stroke = LINE): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${stroke}" stroke-width="1"/>`;
}

function box(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { r?: number; fill?: string; stroke?: string } = {},
): string {
  return `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" rx="${opts.r ?? 0}" fill="${
    opts.fill ?? "none"
  }" stroke="${opts.stroke ?? "none"}" stroke-width="1"/>`;
}

/* ------------------------------------------------------------------ */
/* interface — the product surface, drawn                              */
/* ------------------------------------------------------------------ */

/**
 * A schematic of the working surface: a rail of views, a table of the things the product tracks,
 * and one row carrying a measured state. Rows are the real capability names, so the plate is a
 * claim about this product rather than a stock dashboard.
 */
export function interfacePlate(productName: string, rows: Block[], seed: string, role: FigureRole = "plate"): string {
  if (role === "band") return interfaceBand(productName, rows, seed);
  /*
   * In a fold column the plate is the thing a buyer is looking at, and it was being drawn at a
   * postcard's proportion inside half a screen — which put its own labels under seven pixels once
   * the browser scaled the viewBox down. Filling the column means a taller drawing with more of
   * the surface on show, not the same drawing enlarged.
   */
  const tall = role === "column";
  const W = 560;
  const H = tall ? 580 : 404;
  const railW = 150;
  const r = rng(`${seed}:interface`);
  const items = rows.slice(0, tall ? 6 : 5);
  if (!items.length) return "";

  const parts: string[] = [];
  parts.push(box(0.5, 0.5, W - 1, H - 1, { r: 10, fill: PAPER, stroke: LINE }));

  // Chrome
  parts.push(rule(0, 40, W, 40));
  for (let i = 0; i < 3; i += 1) {
    parts.push(`<circle cx="${20 + i * 13}" cy="20" r="3" fill="${LINE}"/>`);
  }
  parts.push(text(clip(productName, 22), 70, 24.5, { size: FT.micro, fill: QUIET, mono: true }));

  // Rail
  parts.push(rule(railW, 40, railW, H));
  parts.push(text("Views", 20, 66, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  items.forEach((b, i) => {
    const y = 84 + i * 30;
    if (i === 0) {
      parts.push(box(12, y - 13, railW - 24, 24, { r: 5, fill: ACCENT_FIELD }));
      parts.push(`<rect x="12" y="${y - 13}" width="2" height="24" fill="${ACCENT}"/>`);
    }
    parts.push(text(clip(b.title, 17), 22, y + 4, { size: FT.small, fill: i === 0 ? INK : BODY }));
  });

  // Table
  const tx = railW + 24;
  const tw = W - tx - 24;
  parts.push(text(clip(items[0]!.title, 30), tx, 72, { size: FT.body, fill: INK, weight: 600 }));
  parts.push(text("Live", W - 24, 70, { size: FT.micro, fill: QUIET, mono: true, anchor: "end", track: 0.6 }));
  parts.push(rule(tx, 88, W - 24, 88));

  const cols = ["Item", "State"];
  parts.push(text(cols[0]!, tx, 106, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text(cols[1]!, W - 24, 106, { size: FT.micro, fill: QUIET, mono: true, anchor: "end", track: 0.8 }));

  items.forEach((b, i) => {
    const y = 128 + i * 42;
    if (i < items.length - 1) parts.push(rule(tx, y + 26, W - 24, y + 26));
    const lead = i === 1;
    if (lead) parts.push(box(tx - 10, y - 12, tw + 20, 38, { r: 6, fill: ACCENT_FIELD }));
    parts.push(`<circle cx="${tx + 5}" cy="${y + 3}" r="3" fill="${lead ? ACCENT : LINE}"/>`);
    parts.push(text(clip(b.title, 26), tx + 18, y + 7, { size: FT.small, fill: lead ? INK : BODY }));
    parts.push(
      text(b.meta ? clip(b.meta, 12) : `${Math.round(58 + r() * 40)}%`, W - 24, y + 7, {
        size: FT.micro,
        fill: lead ? INK : QUIET,
        mono: true,
        anchor: "end",
      }),
    );
  });

  // One measured bar. A stack of them is a chart of nothing.
  const barY = 128 + items.length * 42 + 14;
  if (tall && barY < H - 130) {
    /*
     * A fold-sized plate has room below the table for the panel a working surface actually keeps
     * there: the same rows read as a trend rather than as a state. Leaving it empty is how the
     * plate ended up as a table floating in a rounded rectangle.
     */
    const py = barY + 44;
    const ph = H - py - 24;
    parts.push(box(tx, py, tw, ph, { r: 8, stroke: LINE }));
    parts.push(text("Last 12 periods", tx + 14, py + 20, { size: FT.micro, fill: QUIET, mono: true, track: 0.6 }));
    const n = 12;
    const gx = (i: number) => tx + 14 + (i / (n - 1)) * (tw - 28);
    let t = 0.3 + r() * 0.2;
    const pts: string[] = [];
    for (let i = 0; i < n; i += 1) {
      t = Math.max(0.12, Math.min(0.92, t + (r() - 0.36) * 0.2));
      pts.push(`${i === 0 ? "M" : "L"}${round(gx(i))} ${round(py + ph - 14 - t * (ph - 46))}`);
    }
    parts.push(`<path d="${pts.join(" ")}" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
    parts.push(rule(tx + 14, py + ph - 14, tx + tw - 14, py + ph - 14));
  }
  if (barY < H - 34) {
    parts.push(box(tx, barY, tw, 4, { r: 2, fill: LINE }));
    parts.push(box(tx, barY, tw * (0.52 + r() * 0.3), 4, { r: 2, fill: ACCENT }));
    parts.push(text("Coverage", tx, barY + 24, { size: FT.micro, fill: QUIET, mono: true, track: 0.6 }));
  }

  return frame(parts.join(""), { width: W, height: H, kind: "interface" });
}

/**
 * The working surface given a whole screen.
 *
 * A full-bleed product surface is the specimen beat most premium software pages build a screen
 * around, and it is the one drawing where extra width buys more product rather than more margin:
 * the rail, the table and the detail panel are all on show at once, at the proportion the surface
 * actually has, instead of a narrow plate enlarged until its own chrome looks heavy.
 */
function interfaceBand(productName: string, rows: Block[], seed: string): string {
  const items = rows.slice(0, 6);
  if (!items.length) return "";
  const W = 1240;
  const railW = 232;
  const panelW = 320;
  const r = rng(`${seed}:interface-band`);
  const parts: string[] = [];

  /*
   * The surface is as tall as it has rows to show.
   *
   * Fixed at 620 it drew a four-row table into a six-row frame, leaving a third of the panel blank
   * — the same emptiness a real product screenshot never has, and the exact thing that makes a
   * mockup read as a placeholder. Both columns declare the height they need and the taller wins.
   */
  const detailLines = items[1]?.points.length
    ? items[1]!.points.slice(0, 3).map((p) => clip(p, 40))
    : wrap(items[1]?.body ?? items[0]!.body ?? "", 40, 3);
  const gy = 158 + Math.max(detailLines.length, 1) * 22 + 28;
  // The table takes the room the band was drawn to hold. Past about 76px a row stops reading as a
  // row, so a short catalogue draws a shorter surface rather than a stretched one.
  const rowPitch = clamp(Math.round((BAND_TARGET_H - 206) / items.length), 52, 76);
  // Room for a row to say what it is, rather than a column of bare names with a state beside them.
  const rowSub = rowPitch >= 66;
  const H = Math.max(162 + items.length * rowPitch + 44, gy + 210);

  parts.push(box(0.5, 0.5, W - 1, H - 1, { r: 12, fill: PAPER, stroke: LINE }));
  parts.push(rule(0, 48, W, 48));
  for (let i = 0; i < 3; i += 1) parts.push(`<circle cx="${24 + i * 14}" cy="24" r="3.5" fill="${LINE}"/>`);
  parts.push(text(clip(productName, 30), 80, 28.5, { size: FT.micro, fill: QUIET, mono: true }));

  // Rail
  parts.push(rule(railW, 48, railW, H));
  parts.push(text("Views", 24, 82, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  items.forEach((b, i) => {
    const y = 112 + i * 38;
    if (i === 0) {
      parts.push(box(14, y - 17, railW - 28, 30, { r: 6, fill: ACCENT_FIELD }));
      parts.push(`<rect x="14" y="${y - 17}" width="2" height="30" fill="${ACCENT}"/>`);
    }
    parts.push(text(clip(b.title, 24), 28, y + 4, { size: FT.small, fill: i === 0 ? INK : BODY }));
  });

  // Table
  const tx = railW + 32;
  const tw = W - tx - panelW - 56;
  parts.push(text(clip(items[0]!.title, 40), tx, 88, { size: FT.title, fill: INK, weight: 600 }));
  parts.push(text("Live", tx + tw, 86, { size: FT.micro, fill: QUIET, mono: true, anchor: "end", track: 0.6 }));
  parts.push(rule(tx, 108, tx + tw, 108));
  parts.push(text("Item", tx, 132, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text("State", tx + tw, 132, { size: FT.micro, fill: QUIET, mono: true, anchor: "end", track: 0.8 }));
  items.forEach((b, i) => {
    const y = 162 + i * rowPitch;
    const lead = i === 1;
    if (lead) parts.push(box(tx - 12, y - 16, tw + 24, rowPitch - 6, { r: 7, fill: ACCENT_FIELD }));
    parts.push(`<circle cx="${tx + 6}" cy="${y + 4}" r="3.5" fill="${lead ? ACCENT : LINE}"/>`);
    parts.push(text(clip(b.title, 34), tx + 22, y + 9, { size: FT.body, fill: lead ? INK : BODY }));
    if (rowSub) {
      const sub = b.points[0] ?? b.body ?? "";
      if (sub) parts.push(text(clip(sub, 48), tx + 22, y + 30, { size: FT.micro, fill: QUIET }));
    }
    parts.push(
      text(b.meta ? clip(b.meta, 14) : String(i + 1).padStart(2, "0"), tx + tw, y + 9, {
        size: FT.micro,
        fill: lead ? INK : QUIET,
        mono: true,
        anchor: "end",
      }),
    );
    // No floor under the last row. A table's final separator sits between the table and nothing,
    // which is a line drawn out of habit rather than to divide two things.
    if (i < items.length - 1) parts.push(rule(tx, y + rowPitch - 22, tx + tw, y + rowPitch - 22));
  });

  // Detail panel — the thing a row opens into, which is what makes a surface a surface.
  const px = W - panelW - 24;
  parts.push(rule(px - 24, 48, px - 24, H));
  parts.push(text("Detail", px, 82, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text(clip(items[1]?.title ?? items[0]!.title, 26), px, 112, { size: FT.body, fill: INK, weight: 600 }));
  parts.push(rule(px, 130, px + panelW, 130));
  detailLines.forEach((ln, i) => parts.push(text(ln, px, 158 + i * 22, { size: FT.small, fill: BODY })));
  parts.push(box(px, gy, panelW, H - gy - 40, { r: 8, stroke: LINE }));
  parts.push(text("Last 12 periods", px + 14, gy + 22, { size: FT.micro, fill: QUIET, mono: true, track: 0.6 }));
  const n = 12;
  const plotB = H - 40 - 18;
  const plotH = plotB - (gy + 38);
  let t = 0.3 + r() * 0.2;
  const pts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    t = Math.max(0.12, Math.min(0.92, t + (r() - 0.36) * 0.2));
    pts.push(`${i === 0 ? "M" : "L"}${round(px + 14 + (i / (n - 1)) * (panelW - 28))} ${round(plotB - t * plotH)}`);
  }
  parts.push(`<path d="${pts.join(" ")}" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  parts.push(rule(px + 14, plotB, px + panelW - 14, plotB));

  return frame(parts.join(""), { width: W, height: H, kind: "interface", inset: BLEED_INSET });
}

/* ------------------------------------------------------------------ */
/* series — the outcome, plotted                                       */
/* ------------------------------------------------------------------ */

/**
 * A single series with an axis, a marked reading, and nothing else. The shape is seeded from the
 * product name, so it is stable and plausible without pretending to be data we do not have — the
 * caption names it as an illustration.
 */
export function seriesChart(label: string, periods: string[], seed: string, role: FigureRole = "column"): string {
  const W = role === "band" ? 1200 : 560;
  const H = role === "band" ? Math.round(BAND_TARGET_H * 0.72) : 320;
  const left = 46;
  const right = W - 20;
  const top = 26;
  const bottom = H - 44;
  const r = rng(`${seed}:series`);

  const n = Math.max(6, Math.min(12, periods.length * 3));
  const values: number[] = [];
  let v = 0.28 + r() * 0.12;
  for (let i = 0; i < n; i += 1) {
    v += (r() - 0.32) * 0.09;
    v = Math.max(0.12, Math.min(0.94, v + i / (n * 12)));
    values.push(v);
  }
  // End on the high note the section is claiming, without inventing a straight line to get there.
  values[n - 1] = Math.max(values[n - 1]!, Math.max(...values) * 0.98);

  const x = (i: number) => left + (i / (n - 1)) * (right - left);
  const y = (t: number) => bottom - t * (bottom - top);

  const parts: string[] = [];
  // Two gridlines, not four. A reader takes the level off the labelled ceiling and the middle; the
  // two extra lines were structure nobody used, and hairlines are a budget — measured pages spend
  // between half a rule and four per screen across the *whole* page, and a chart that spends four
  // on its own is taking the allowance the sections below it need.
  for (let g = 0; g <= 3; g += 1) {
    const gy = top + ((bottom - top) / 3) * g;
    if (g % 2 === 0) parts.push(rule(left, gy, right, gy));
    parts.push(text(`${100 - g * 30}`, left - 10, gy + 3.5, { size: FT.micro, fill: QUIET, mono: true, anchor: "end" }));
  }

  const line = values.map((t, i) => `${i === 0 ? "M" : "L"}${round(x(i))} ${round(y(t))}`).join(" ");
  parts.push(
    `<path d="${line} L${round(x(n - 1))} ${bottom} L${round(x(0))} ${bottom} Z" fill="${ACCENT_FIELD}"/>`,
  );
  parts.push(`<path d="${line}" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);

  const mark = n - 1;
  parts.push(rule(x(mark), top, x(mark), bottom));
  parts.push(`<circle cx="${round(x(mark))}" cy="${round(y(values[mark]!))}" r="4.5" fill="${PAPER}" stroke="${ACCENT}" stroke-width="2"/>`);

  parts.push(rule(left, bottom, right, bottom));
  const step = Math.max(1, Math.floor(n / Math.min(4, periods.length || 4)));
  for (let i = 0; i < n; i += step) {
    const p = periods[Math.floor(i / step) % (periods.length || 1)] ?? "";
    if (p) parts.push(text(clip(p, 9), x(i), bottom + 18, { size: FT.micro, fill: QUIET, mono: true, anchor: i === 0 ? "start" : "middle" }));
  }
  parts.push(text(clip(label, 42), left, 14, { size: FT.micro, fill: BODY }));

  return frame(parts.join(""), { width: W, height: H, kind: "series", inset: role === "band" ? BLEED_INSET : 0, label: `${label} — illustrative series` });
}

/* ------------------------------------------------------------------ */
/* flow — the sequence, as stages                                      */
/* ------------------------------------------------------------------ */

/**
 * The steps of the argument as connected stages, numbered, with the pivot marked.
 *
 * HTML buttons — never dead SVG shells that invite clicks. Selecting a stage updates
 * aria-pressed + caption via the shared preview script.
 */
export function flowDiagram(steps: Block[], seed: string, role: FigureRole = "plate"): string {
  const items = steps.slice(0, 4);
  if (items.length < 2) return "";
  const band = role === "band";
  const pivot = Math.min(items.length - 1, 1);
  void seed;

  const cards = items
    .map((b, i) => {
      const lead = i === pivot;
      const matter =
        (b.points?.[0] && String(b.points[0])) ||
        (b.body && String(b.body)) ||
        (b.meta && !/^0?\d+$/.test(String(b.meta)) ? String(b.meta) : "") ||
        `What ${b.title.toLowerCase()} covers on this path.`;
      const body = band
        ? `<span class="ds-flow-body">${esc(clip(matter, 110))}</span>`
        : b.meta && !/^0?\d+$/.test(String(b.meta))
          ? `<span class="ds-flow-meta">${esc(clip(String(b.meta), 28))}</span>`
          : "";
      const label = clip(b.body || matter || b.title, 140);
      return `<li class="ds-flow-item">
        <button type="button" class="ds-flow-card${lead ? " is-live" : ""}" data-step="${i}" data-label="${esc(label)}" aria-pressed="${lead ? "true" : "false"}">
          <span class="ds-flow-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="ds-flow-rule" aria-hidden="true"></span>
          <strong class="ds-flow-title">${esc(b.title)}</strong>
          ${body}
          <span class="ds-flow-meter" aria-hidden="true"><i style="width:${Math.round(((i + 1) / items.length) * 100)}%"></i></span>
        </button>
      </li>`;
    })
    .join(`<li class="ds-flow-arrow" aria-hidden="true"><span></span></li>`);

  const caption = items[pivot]?.body || items[pivot]?.title || "";
  return `<div class="ds-flow-track" data-figure="flow" data-dense="ink" data-role="${role}" data-instrument="flow" role="group" aria-label="Sequence: ${esc(items.map((b) => b.title).join(", "))}">
    <ol class="ds-flow-list">${cards}</ol>
    <p class="ds-flow-caption"><span class="ds-flow-caption-meta">${items.length} stages</span><span data-flow-caption>${esc(clip(caption, 140))}</span></p>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* stack — scope, as layers                                            */
/* ------------------------------------------------------------------ */

/** Tiers of scope drawn as indented layers hanging off a single spine. */
export function stackDiagram(layers: Block[], seed: string, role: FigureRole = "plate"): string {
  if (role === "band") return stackBand(layers, seed);
  const items = layers.slice(0, 5);
  if (items.length < 2) return "";
  const W = 560;
  const rowH = 62;
  const H = 34 + items.length * rowH;
  const spine = 26;
  const r = rng(`${seed}:stack`);
  const parts: string[] = [];

  parts.push(rule(spine, 22, spine, H - 20));
  items.forEach((b, i) => {
    const y = 22 + i * rowH;
    const w = (W - spine - 40) * (0.62 + r() * 0.36);
    const lead = i === 0;
    parts.push(rule(spine, y + rowH / 2, spine + 16, y + rowH / 2));
    parts.push(`<circle cx="${spine}" cy="${y + rowH / 2}" r="3.5" fill="${lead ? ACCENT : PAPER}" stroke="${lead ? ACCENT : LINE}" stroke-width="1"/>`);
    parts.push(
      box(spine + 16.5, y + 8.5, w, rowH - 22, {
        r: 6,
        fill: lead ? ACCENT_FIELD : PAPER,
        stroke: lead ? "var(--c-accent-border)" : LINE,
      }),
    );
    parts.push(text(clip(b.title, 30), spine + 32, y + rowH / 2 + 1, { size: FT.small, fill: INK, weight: 600 }));
    if (b.meta) {
      parts.push(
        text(clip(b.meta, 16), spine + 16 + w - 14, y + rowH / 2 + 1, { size: FT.micro, fill: QUIET, mono: true, anchor: "end", track: 0.6 }),
      );
    }
  });

  return frame(parts.join(""), { width: W, height: H, kind: "stack", label: `Scope: ${items.map((b) => b.title).join(", ")}` });
}

/**
 * Scope across a whole screen: one register, one row per tier, read left to right.
 *
 * The column form hangs short bars off a spine because that is what fits beside a paragraph. Given
 * the screen, the same content is better as a ledger — the tier named on the left, what it covers
 * set as prose in the middle, and the share it accounts for measured on the right. Same claim, and
 * at this width the reader gets the whole scope in one look instead of five stubs.
 */
function stackBand(layers: Block[], seed: string): string {
  const items = layers.slice(0, 5);
  if (items.length < 2) return "";
  const W = 1240;
  const head = 74;
  // Rows take the room the band was drawn to hold, up to the point where a row stops being a row
  // and becomes a card with a rule on it. Where the ledger is short, the drawing is short: the
  // section is sized by the figure, so a shallow one costs nothing but a shorter band.
  const rowH = clamp(Math.round((BAND_TARGET_H - head - 28) / items.length), 96, 132);
  const H = head + items.length * rowH + 28;
  // At the taller pitch there is a third line of room in each row, and a scope ledger that says
  // three things about a tier is worth more than one that says two and leaves the rest blank.
  const proseLines = rowH >= 116 ? 3 : 2;
  const r = rng(`${seed}:stack-band`);
  const nameW = 300;
  const proseX = nameW + 48;
  const meterX = W - 300;
  const parts: string[] = [];

  parts.push(text("Scope", 0, 22, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text("Tier", 0, head - 18, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text("What it covers", proseX, head - 18, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text("Share", W, head - 18, { size: FT.micro, fill: QUIET, mono: true, anchor: "end", track: 0.8 }));

  items.forEach((b, i) => {
    const y = head + i * rowH;
    const lead = i === 0;
    parts.push(rule(0, y, W, y));
    if (lead) parts.push(box(-16, y + 1, W + 32, rowH - 2, { fill: ACCENT_FIELD }));
    parts.push(text(String(i + 1).padStart(2, "0"), 0, y + 34, { size: FT.micro, fill: lead ? ACCENT : QUIET, mono: true, track: 0.8 }));
    parts.push(text(clip(b.title, 26), 0, y + 62, { size: FT.title, fill: INK, weight: 600 }));

    // Prose in a band that spans the screen is read at the distance the page's own body text is,
    // so it is set at the page's body size rather than at the caption size a small plate uses.
    const stated = b.points.slice(0, proseLines).map((p) => clip(p, 52));
    const prose = stated.length ? stated : wrap(b.body ?? "", 52, proseLines);
    prose.forEach((ln, j) => parts.push(text(ln, proseX, y + 40 + j * 24, { size: FT.body, fill: BODY })));

    // The share is the tier's own weight in the catalogue, not an invented percentage.
    const share = (items.length - i) / ((items.length * (items.length + 1)) / 2);
    const mw = W - meterX;
    parts.push(box(meterX, y + 50, mw, 4, { r: 2, fill: LINE }));
    parts.push(box(meterX, y + 50, mw * Math.max(0.12, share), 4, { r: 2, fill: lead ? ACCENT : "var(--c-border-strong)" }));
    parts.push(text(b.meta ? clip(b.meta, 16) : `${Math.round(share * 100)}%`, W, y + 38, { size: FT.micro, fill: QUIET, mono: true, anchor: "end" }));
  });
  void r;

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "stack",
    inset: BLEED_INSET,
    label: `Scope: ${items.map((b) => b.title).join(", ")}`,
  });
}

/* ------------------------------------------------------------------ */
/* horizon — the long view                                             */
/* ------------------------------------------------------------------ */

/**
 * A time axis with the markers a long-hold argument needs. Editorial pages use one wide horizontal
 * rule to carry a whole section; this is that move, with the near term compressed and the far term
 * given the room, which is the point being made.
 */
export function horizonPlot(marks: Block[], seed: string, role: FigureRole = "plate"): string {
  const items = marks.slice(0, 4);
  if (items.length < 2) return "";
  const band = role === "band";
  const W = band ? 1200 : 720;
  // Editorial fold bands were drawing a thin timeline into a reserved screen — studio-class folds
  // fill the viewport with one composed surface. Match the specimen target when spanning.
  const H = band ? Math.round(BAND_TARGET_H * 0.82) : 208;
  const left = band ? 16 : 8;
  const right = W - left;
  const axis = Math.round(H * 0.62);
  const r = rng(`${seed}:horizon`);
  const parts: string[] = [];

  if (band) {
    // Ticks under the axis give a wide band the sense of a measured span rather than a bare rule.
    for (let i = 0; i <= 24; i += 1) {
      const x = left + (i / 24) * (right - left);
      parts.push(rule(x, axis, x, axis + (i % 6 === 0 ? 12 : 6)));
    }
  }
  parts.push(rule(left, axis, right, axis));

  items.forEach((b, i) => {
    // Compressed near, generous far — the shape of the claim, not an even ruler.
    const t = (i / (items.length - 1)) ** 0.72;
    const x = left + t * (right - left - 8);
    const up = i % 2 === 0;
    const h = (band ? 64 : 34) + r() * (band ? 58 : 30);
    const ty = up ? axis - h : axis + h;
    parts.push(rule(x, axis, x, ty));
    parts.push(`<circle cx="${round(x)}" cy="${axis}" r="${band ? 5.5 : 4}" fill="${i === items.length - 1 ? ACCENT : PAPER}" stroke="${i === items.length - 1 ? ACCENT : LINE}" stroke-width="1.5"/>`);
    const anchor = i === items.length - 1 ? "end" : "start";
    const tx = anchor === "end" ? x - 8 : x + 10;
    parts.push(text(clip(b.title, band ? 30 : 24), tx, up ? ty - 10 : ty + 20, { size: band ? FT.title : FT.small, fill: INK, weight: 600, anchor }));
    if (b.meta) {
      parts.push(text(clip(b.meta, 18), tx, up ? ty + (band ? 12 : 8) : ty - (band ? 10 : 6), { size: FT.micro, fill: QUIET, mono: true, anchor, track: 0.6 }));
    }
    if (band) {
      b.points.slice(0, 1).forEach((p) => {
        parts.push(text(clip(p, 40), tx, up ? ty + 32 : ty - 30, { size: FT.small, fill: BODY, anchor }));
      });
    }
  });

  return frame(parts.join(""), { width: W, height: H, kind: "horizon", inset: band ? BLEED_INSET : 0, label: `Horizon: ${items.map((b) => b.title).join(", ")}` });
}

/* ------------------------------------------------------------------ */
/* mark — one capability, drawn small                                  */
/* ------------------------------------------------------------------ */

/**
 * A small schematic per capability.
 *
 * Not an icon set: the drawing is keyed to the capability's own shape — how many detail points it
 * declares and whether it leads the section — so a six-capability catalogue gets six different
 * marks that mean something rather than six variations on a rounded square. A card carrying only
 * type is a row in a list; a card carrying a mark is a product surface.
 */
export function capabilityMark(b: Block, index: number, seed: string): string {
  // Marks are small schematics, not icons — sized so a register of them still registers as drawn
  // matter on a dense B2B page (references often carry dozens of figures, not three plates).
  const W = 220;
  const H = 128;
  const r = rng(`${seed}:mark:${b.title}`);
  const n = Math.max(2, Math.min(5, b.points.length || 3));
  const lead = b.emphasis === "lead";
  const key = lead ? ACCENT : "var(--c-border-strong)";
  const parts: string[] = [];

  switch (index % 6) {
    case 0: {
      // Nested frames — scope contained inside scope.
      for (let i = 0; i < n; i += 1) {
        const inset = i * 9;
        parts.push(box(4.5 + inset, 4.5 + inset, W - 9 - inset * 2, H - 9 - inset * 2, { r: 4, stroke: i === 0 ? key : LINE }));
      }
      break;
    }
    case 1: {
      // A measured stack — quantities of unequal weight.
      for (let i = 0; i < n; i += 1) {
        const y = 12 + i * ((H - 24) / n);
        const w = (W - 24) * (0.3 + r() * 0.7);
        parts.push(box(12, y, w, 6, { r: 3, fill: i === 0 ? key : LINE }));
      }
      break;
    }
    case 2: {
      // A junction — several inputs resolving to one.
      const cx = W - 26;
      const cy = H / 2;
      for (let i = 0; i < n; i += 1) {
        const y = 16 + i * ((H - 32) / Math.max(1, n - 1));
        parts.push(`<path d="M14 ${round(y)} C ${round(W / 2)} ${round(y)}, ${round(W / 2)} ${cy}, ${cx - 8} ${cy}" fill="none" stroke="${LINE}" stroke-width="1"/>`);
        parts.push(`<circle cx="14" cy="${round(y)}" r="2.5" fill="${LINE}"/>`);
      }
      parts.push(`<circle cx="${cx}" cy="${cy}" r="6" fill="${PAPER}" stroke="${key}" stroke-width="2"/>`);
      break;
    }
    case 3: {
      // A grid with one cell claimed.
      const cols = 4;
      const rows = 3;
      const cw = (W - 24) / cols;
      const ch = (H - 24) / rows;
      const pick = Math.floor(r() * cols * rows);
      for (let i = 0; i < cols * rows; i += 1) {
        const x = 12 + (i % cols) * cw;
        const y = 12 + Math.floor(i / cols) * ch;
        parts.push(box(x + 1, y + 1, cw - 2, ch - 2, { r: 2, fill: i === pick ? key : "none", stroke: i === pick ? "none" : LINE }));
      }
      break;
    }
    case 4: {
      // A threshold — a reading crossing a line.
      const pts: string[] = [];
      const steps = 14;
      for (let i = 0; i <= steps; i += 1) {
        const x = 12 + (i / steps) * (W - 24);
        const y = H - 18 - ((i / steps) ** 1.4) * (H - 42) * (0.6 + r() * 0.5);
        pts.push(`${i === 0 ? "M" : "L"}${round(x)} ${round(Math.max(14, y))}`);
      }
      parts.push(`<line x1="12" y1="${round(H / 2)}" x2="${W - 12}" y2="${round(H / 2)}" stroke="${LINE}" stroke-width="1" stroke-dasharray="3 4"/>`);
      parts.push(`<path d="${pts.join(" ")}" fill="none" stroke="${key}" stroke-width="2" stroke-linecap="round"/>`);
      break;
    }
    default: {
      // A spine with hung entries — a register.
      parts.push(rule(20, 12, 20, H - 12));
      for (let i = 0; i < n; i += 1) {
        const y = 18 + i * ((H - 36) / Math.max(1, n - 1));
        parts.push(rule(20, y, 20 + 16, y));
        parts.push(box(40, y - 5, (W - 56) * (0.42 + r() * 0.56), 10, { r: 5, fill: i === 0 ? key : LINE }));
      }
      break;
    }
  }

  return frame(parts.join(""), { width: W, height: H, kind: "mark" });
}

/* ------------------------------------------------------------------ */
/* spark — a number, with its shape                                    */
/* ------------------------------------------------------------------ */

/** A reading has a direction. The numeral states it; this shows it, in the width of the column. */
export function metricSpark(index: number, seed: string): string {
  const W = 220;
  const H = 44;
  const r = rng(`${seed}:spark:${index}`);
  const n = 16;
  const vals: number[] = [];
  let v = 0.35 + r() * 0.3;
  for (let i = 0; i < n; i += 1) {
    v = Math.max(0.08, Math.min(0.95, v + (r() - 0.42) * 0.22));
    vals.push(v);
  }
  vals[n - 1] = Math.max(vals[n - 1]!, 0.72);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (t: number) => H - 4 - t * (H - 10);
  const d = vals.map((t, i) => `${i === 0 ? "M" : "L"}${round(x(i))} ${round(y(t))}`).join(" ");
  return frame(
    `<path d="${d}" fill="none" stroke="var(--c-border-strong)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
     <circle cx="${round(x(n - 1))}" cy="${round(y(vals[n - 1]!))}" r="3" fill="${ACCENT}"/>`,
    { width: W, height: H, kind: "spark" },
  );
}

/* ------------------------------------------------------------------ */
/* signature — the closing screen                                      */
/* ------------------------------------------------------------------ */

/**
 * The last screen of a reference page is rarely bare. It carries the mark at a scale nothing else
 * on the page uses — set in hairlines behind the closing decision, so it reads as a sign-off rather
 * than as one more panel.
 *
 * The mark is *constructed*, not typeset. A wordmark at this size is geometry on a real page — a
 * path, an outline, an image — never live text, and setting it as live text would also plant a type
 * step four times larger than the display voice, which is a ladder no reference page has.
 * The letterforms here are drawn from strokes on the same construction grid they sit on: a stem, a
 * shoulder, a bowl, a diagonal. Deterministic from the product's own initials.
 */
export function signatureMark(productName: string, seed: string): string {
  const W = 1200;
  const H = 420;
  const r = rng(`${seed}:signature`);
  const initials = productName
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const parts: string[] = [];

  // Construction grid — the lines a mark is drawn against. Verticals only: the horizontals crossed
  // the whole width of the figure, so on a page already carrying a rule under every table row and
  // every question they were three more full-width hairlines spent on texture.
  for (let i = 1; i < 10; i += 1) {
    parts.push(`<line x1="${round((W / 10) * i)}" y1="0" x2="${round((W / 10) * i)}" y2="${H}" stroke="${LINE}" stroke-width="1" opacity="${round(0.25 + r() * 0.35)}"/>`);
  }
  const cx = W * 0.5;
  const cy = H * 0.52;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${round(H * 0.4)}" fill="none" stroke="${LINE}" stroke-width="1"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${round(H * 0.28)}" fill="none" stroke="${LINE}" stroke-width="1"/>`);

  const glyphH = H * 0.42;
  const glyphW = glyphH * 0.66;
  const gap = glyphW * 0.42;
  const letters = (initials || "A").slice(0, 2).split("");
  const spanW = letters.length * glyphW + (letters.length - 1) * gap;
  let gx = cx - spanW / 2;
  for (const ch of letters) {
    parts.push(constructedGlyph(ch, gx, cy - glyphH / 2, glyphW, glyphH));
    gx += glyphW + gap;
  }
  return frame(parts.join(""), { width: W, height: H, kind: "signature" });
}

/**
 * Optical-size ladder — the foundry fold signature.
 *
 * Generic engines put a product plate or a chart on the fold. A type foundry puts the face itself:
 * the same letterform at successive optical sizes with measured labels. Drawn as *constructed
 * strokes* (not `<text>` at display px) so the page probe's type ladder stays honest — huge SVG
 * text was previously stealing the display-size / type-steps measurements.
 */
export function typeLadder(
  productName: string,
  cuts: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const W = role === "band" ? 1440 : role === "column" ? 640 : 720;
  const H = role === "band" ? 880 : role === "column" ? 720 : 520;
  const r = rng(`${seed}:ladder`);
  const parts: string[] = [];
  const padX = W * (role === "band" ? 0.08 : 0.1);
  const padY = H * 0.07;
  const steps = [
    { label: "Display", h: H * 0.2 },
    { label: "Title", h: H * 0.12 },
    { label: "Deck", h: H * 0.075 },
    { label: "Text", h: H * 0.05 },
    { label: "Caption", h: H * 0.035 },
  ];
  const initials = productName
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "AH";
  /*
   * Prefer letterforms whose construction reads at hairline weight on inverse.
   * Arc-heavy glyphs (C/G/O/S) vanish on the dark seam at specimen scale; map to clear cousins
   * so the ladder always shows a paired sample a buyer can actually see.
   */
  const clearGlyph = (ch: string): string => {
    const map: Record<string, string> = {
      B: "R",
      C: "A",
      D: "P",
      E: "F",
      G: "A",
      J: "I",
      O: "H",
      Q: "R",
      S: "Z",
      U: "H",
    };
    return map[ch] ?? ch;
  };
  const raw = (initials.length >= 2 ? initials : `${initials}H`).slice(0, 2);
  const letters = [clearGlyph(raw[0]!), clearGlyph(raw[1]!)];
  // Avoid a monogram twin when mapping collapses both letters.
  if (letters[0] === letters[1]) letters[1] = letters[0] === "A" ? "H" : "A";

  // Baseline grid — verticals only, foundry construction sheet.
  for (let i = 1; i < 8; i += 1) {
    const x = padX + ((W - padX * 2) / 8) * i;
    parts.push(
      `<line x1="${round(x)}" y1="${round(padY)}" x2="${round(x)}" y2="${round(H - padY)}" stroke="${LINE}" stroke-width="1" opacity="${round(0.18 + r() * 0.22)}" vector-effect="non-scaling-stroke"/>`,
    );
  }

  // Accent seam edge on the left of the ladder — the hard rule that marks foundry craft.
  parts.push(
    `<line x1="${round(padX)}" y1="${round(padY)}" x2="${round(padX)}" y2="${round(H - padY)}" stroke="${ACCENT}" stroke-width="3" vector-effect="non-scaling-stroke"/>`,
  );

  let y = padY + 8;
  for (let i = 0; i < steps.length; i += 1) {
    const s = steps[i]!;
    const cut = cuts[i];
    const glyphH = s.h;
    const glyphW = glyphH * 0.62;
    const gap = glyphW * 0.28;
    let gx = padX + 28;
    for (const ch of letters) {
      parts.push(constructedGlyph(ch, gx, y, glyphW, glyphH));
      gx += glyphW + gap;
    }
    const labelY = y + glyphH * 0.55;
    parts.push(
      `<text class="ds-fig-mono" x="${round(W - padX)}" y="${round(labelY)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${esc(s.label)}</text>`,
    );
    if (cut) {
      parts.push(
        `<text class="ds-fig-mono" x="${round(W - padX)}" y="${round(labelY + 14)}" font-size="${FIG_MONO_PX}" fill="var(--surface-muted)" text-anchor="end">${esc(clip(cut.title, 22))}</text>`,
      );
    }
    if (i < steps.length - 1) {
      const ruleY = y + glyphH + Math.max(10, H * 0.012);
      parts.push(
        `<line x1="${round(padX + 28)}" y1="${round(ruleY)}" x2="${round(W - padX)}" y2="${round(ruleY)}" stroke="${LINE}" stroke-width="1" opacity="0.5" vector-effect="non-scaling-stroke"/>`,
      );
      y = ruleY + Math.max(10, H * 0.014);
    }
  }

  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 28)}" y="${round(H - padY + 4)}" font-size="${FIG_MONO_PX}" fill="var(--surface-quiet)">${esc(clip(productName, 28))} · optical sizes</text>`,
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "type-ladder",
    label: `${productName} type ladder`,
    inset: role === "band" ? BLEED_INSET : 0,
  });
}

/**
 * Dossier plate — cartographic schematic for capital/research briefings.
 *
 * A coordinate grid, region contours, and pin callouts derived from the brief's capabilities.
 * Labels stay mono and tiny so the type probe does not treat them as display (foundry lesson).
 * Generic engines emit SaaS UI plates; they do not invent a folio map with pinned instruments.
 */
export function dossierPlate(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:dossier`);
  const W = role === "band" ? 1440 : role === "column" ? 640 : 920;
  const H = role === "band" ? 820 : role === "column" ? 720 : 560;
  const padX = role === "band" ? W * 0.06 : W * 0.08;
  const padY = role === "band" ? H * 0.08 : H * 0.09;
  const parts: string[] = [];

  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  const cols = 10;
  const rows = 7;
  const gridW = W - padX * 2;
  const gridH = H - padY * 2;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  for (let i = 1; i < cols; i += 1) {
    const x = padX + cellW * i;
    parts.push(
      `<line x1="${round(x)}" y1="${round(padY)}" x2="${round(x)}" y2="${round(H - padY)}" stroke="${LINE}" stroke-width="1" opacity="${round(0.22 + r() * 0.2)}" vector-effect="non-scaling-stroke"/>`,
    );
  }
  for (let j = 1; j < rows; j += 1) {
    const y = padY + cellH * j;
    parts.push(
      `<line x1="${round(padX)}" y1="${round(y)}" x2="${round(W - padX)}" y2="${round(y)}" stroke="${LINE}" stroke-width="1" opacity="${round(0.18 + r() * 0.18)}" vector-effect="non-scaling-stroke"/>`,
    );
  }

  const letters = "ABCDEFGHIJ";
  for (let i = 0; i < cols; i += 1) {
    const x = padX + cellW * (i + 0.5);
    parts.push(
      `<text class="ds-fig-mono" x="${round(x)}" y="${round(padY - 8)}" font-size="11" fill="var(--surface-quiet)" text-anchor="middle">${letters[i]}</text>`,
    );
  }
  for (let j = 0; j < rows; j += 1) {
    const y = padY + cellH * (j + 0.5);
    parts.push(
      `<text class="ds-fig-mono" x="${round(padX - 10)}" y="${round(y + 3)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${j + 1}</text>`,
    );
  }

  const regions = Math.min(4, Math.max(2, features.length - 1));
  for (let i = 0; i < regions; i += 1) {
    const cx = padX + gridW * (0.22 + r() * 0.56);
    const cy = padY + gridH * (0.25 + r() * 0.5);
    const rx = cellW * (1.4 + r() * 1.8);
    const ry = cellH * (1.1 + r() * 1.4);
    const pts: string[] = [];
    const n = 6 + Math.floor(r() * 3);
    for (let k = 0; k < n; k += 1) {
      const a = (Math.PI * 2 * k) / n + r() * 0.25;
      const jitter = 0.72 + r() * 0.35;
      pts.push(`${round(cx + Math.cos(a) * rx * jitter)},${round(cy + Math.sin(a) * ry * jitter)}`);
    }
    parts.push(
      `<polygon points="${pts.join(" ")}" fill="${ACCENT_FIELD}" stroke="${ACCENT}" stroke-width="1" opacity="${round(0.35 + r() * 0.25)}" vector-effect="non-scaling-stroke"/>`,
    );
  }

  const pins = features.slice(0, Math.min(5, features.length));
  pins.forEach((f, i) => {
    const col = 1 + Math.floor(r() * (cols - 2));
    const row = 1 + Math.floor(r() * (rows - 2));
    const x = padX + cellW * (col + 0.5);
    const y = padY + cellH * (row + 0.5);
    const coord = `${letters[col]}${row + 1}`;
    parts.push(`<circle cx="${round(x)}" cy="${round(y)}" r="5" fill="${ACCENT}" stroke="var(--surface-bg)" stroke-width="1.5"/>`);
    parts.push(
      `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x + cellW * 0.85)}" y2="${round(y - cellH * 0.55)}" stroke="${ACCENT}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    const lx = x + cellW * 0.9;
    const ly = y - cellH * 0.6;
    parts.push(
      `<text class="ds-fig-mono" x="${round(lx)}" y="${round(ly)}" font-size="11" fill="var(--surface-muted)">${esc(coord)}</text>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(lx)}" y="${round(ly + 14)}" font-size="11" fill="var(--surface-quiet)">${esc(clip(f.title, 18))}</text>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(x)}" y="${round(y + 18)}" font-size="11" fill="var(--surface-quiet)" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text>`,
    );
  });

  const scaleX = padX + 12;
  const scaleY = H - padY + 4;
  parts.push(
    `<line x1="${round(scaleX)}" y1="${round(scaleY)}" x2="${round(scaleX + cellW * 1.5)}" y2="${round(scaleY)}" stroke="${LINE}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<line x1="${round(scaleX)}" y1="${round(scaleY - 4)}" x2="${round(scaleX)}" y2="${round(scaleY + 4)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<line x1="${round(scaleX + cellW * 1.5)}" y1="${round(scaleY - 4)}" x2="${round(scaleX + cellW * 1.5)}" y2="${round(scaleY + 4)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(scaleX + cellW * 1.65)}" y="${round(scaleY + 3)}" font-size="11" fill="var(--surface-quiet)">1 briefing unit</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX)}" y="${round(scaleY + 3)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${esc(clip(productName, 28))} · dossier plate</text>`,
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "dossier-plate",
    label: `${productName} dossier plate`,
    inset: role === "band" ? BLEED_INSET : 0,
  });
}

/**
 * Signal lattice — observatory signature figure.
 *
 * A channel grid with amplitude bars and status dots. Labels stay mono ≤11px so the type probe
 * does not treat them as display (foundry SVG-text lesson). Theme packs do not invent instrument
 * lattices from a density slider.
 */
/** Corner L-brackets for a live window — instrument ticks, not a full chrome box. */
function liveWindowCorners(x: number, y: number, w: number, h: number, arm = 10): string {
  const s = `fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.85" vector-effect="non-scaling-stroke"`;
  const x2 = x + w;
  const y2 = y + h;
  return [
    `<path d="M ${round(x)} ${round(y + arm)} V ${round(y)} H ${round(x + arm)}" ${s}/>`,
    `<path d="M ${round(x2 - arm)} ${round(y)} H ${round(x2)} V ${round(y + arm)}" ${s}/>`,
    `<path d="M ${round(x)} ${round(y2 - arm)} V ${round(y2)} H ${round(x + arm)}" ${s}/>`,
    `<path d="M ${round(x2 - arm)} ${round(y2)} H ${round(x2)} V ${round(y2 - arm)}" ${s}/>`,
  ].join("");
}

export function signalLattice(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:signal-lattice:${role}`);
  const W = role === "band" ? 1280 : role === "column" ? 560 : 720;
  const H = role === "band" ? 720 : role === "column" ? 520 : 480;
  const padX = role === "band" ? 56 : 36;
  const padY = role === "band" ? 48 : 32;
  const parts: string[] = [];

  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  // Top chronometer strip — hour ticks across the plate.
  const chronY = padY + 18;
  parts.push(
    `<line x1="${round(padX + 8)}" y1="${round(chronY)}" x2="${round(W - padX - 8)}" y2="${round(chronY)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  const hours = 12;
  // "Now" sits mid-strip — a 1px-stroke bead, not thick chrome.
  const nowHour = 6;
  for (let i = 0; i <= hours; i += 1) {
    const x = padX + 8 + ((W - padX * 2 - 16) * i) / hours;
    const tall = i % 3 === 0;
    const isNow = i === nowHour;
    parts.push(
      `<line x1="${round(x)}" y1="${round(chronY - (tall ? 8 : 4))}" x2="${round(x)}" y2="${round(chronY + (tall ? 8 : 4))}" stroke="${tall || isNow ? ACCENT : LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    if (tall) {
      parts.push(
        `<text class="ds-fig-mono" x="${round(x)}" y="${round(chronY - 12)}" font-size="11" fill="var(--surface-quiet)" text-anchor="middle">${String(i).padStart(2, "0")}</text>`,
      );
    }
    if (isNow) {
      parts.push(
        `<circle cx="${round(x)}" cy="${round(chronY)}" r="2.5" fill="var(--surface-bg, var(--c-paper))" stroke="${ACCENT}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
      );
    }
  }
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 8)}" y="${round(chronY - 12)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">UTC</text>`,
  );

  const channels = features.slice(0, 6);
  const count = Math.max(4, channels.length);
  const gridTop = padY + 44;
  const gridBottom = H - padY - 28;
  const gridH = gridBottom - gridTop;
  const rowH = gridH / count;
  const labelW = Math.min(140, W * 0.16);
  const barLeft = padX + labelW + 12;
  const barRight = W - padX - 24;
  const barW = barRight - barLeft;

  // Tolerance ladder keyed to channel index — same values the calibration close echoes.
  const tolerances = ["±0.5", "±1.0", "±0.5", "±1.5", "±1.0", "±2.0"];

  for (let i = 0; i < count; i += 1) {
    const f = channels[i] ?? channels[i % Math.max(1, channels.length)]!;
    const y0 = gridTop + rowH * i;
    const mid = y0 + rowH / 2;
    // Row rule
    if (i > 0) {
      parts.push(
        `<line x1="${round(padX + 8)}" y1="${round(y0)}" x2="${round(W - padX - 8)}" y2="${round(y0)}" stroke="${LINE}" stroke-width="1" opacity="0.35" vector-effect="non-scaling-stroke"/>`,
      );
    }
    // Channel id + title (mono only)
    parts.push(
      `<text class="ds-fig-mono" x="${round(padX + 12)}" y="${round(mid - 4)}" font-size="11" fill="var(--surface-quiet)">${String(i + 1).padStart(2, "0")}</text>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(padX + 12)}" y="${round(mid + 12)}" font-size="11" fill="var(--surface-muted)">${esc(clip(f?.title ?? `ch-${i + 1}`, 16))}</text>`,
    );

    // Amplitude bars — dense instrument matter without SVG display type.
    const bars = 28;
    const gap = barW / bars;
    const ampSeed = 0.25 + r() * 0.55;
    for (let b = 0; b < bars; b += 1) {
      const h = rowH * (0.18 + ampSeed * Math.abs(Math.sin((b + i * 3) * 0.55 + r() * 0.4)) * 0.72);
      const x = barLeft + gap * b + gap * 0.15;
      const y = mid - h / 2;
      const hot = b > bars * 0.62 && b < bars * 0.78;
      parts.push(
        `<rect x="${round(x)}" y="${round(y)}" width="${round(gap * 0.55)}" height="${round(h)}" fill="${hot ? ACCENT : LINE}" opacity="${hot ? 0.85 : round(0.35 + r() * 0.35)}"/>`,
      );
    }

    // Per-channel threshold hairline across the amplitude row.
    const thrY = mid - rowH * (0.12 + (i % 3) * 0.04);
    parts.push(
      `<line x1="${round(barLeft)}" y1="${round(thrY)}" x2="${round(barRight)}" y2="${round(thrY)}" stroke="${ACCENT}" stroke-width="1" opacity="0.45" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(barLeft + 4)}" y="${round(thrY - 3)}" font-size="11" fill="var(--surface-quiet)">${tolerances[i % tolerances.length]}</text>`,
    );

    // Status dot
    const status = i % 3 === 0 ? ACCENT : LINE;
    parts.push(
      `<circle cx="${round(W - padX - 12)}" cy="${round(mid)}" r="3.5" fill="${status}"/>`,
    );
  }

  // Live window — corner ticks + WINDOW / duration legend (not a full boxed chrome).
  const winX = barLeft + barW * 0.62;
  const winW = barW * 0.16;
  const winMin = Math.max(8, Math.round((winW / barW) * 60));
  const duration = `00:${String(winMin).padStart(2, "0")}`;
  parts.push(liveWindowCorners(winX, gridTop, winW, gridH, role === "band" ? 12 : 8));
  parts.push(
    `<text class="ds-fig-mono" x="${round(winX + winW / 2)}" y="${round(gridTop - 6)}" font-size="11" fill="var(--c-accent)" text-anchor="middle">LIVE</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(winX + 6)}" y="${round(gridTop + 14)}" font-size="11" fill="var(--c-accent)">WINDOW</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(winX + winW - 6)}" y="${round(gridTop + 14)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${duration}</text>`,
  );

  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 12)}" y="${round(H - padY + 14)}" font-size="11" fill="var(--surface-quiet)">${esc(clip(productName, 28))} · signal lattice</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 8)}" y="${round(H - padY + 14)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${count} channels</text>`,
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "signal-lattice",
    label: `${productName} signal lattice`,
    inset: role === "band" ? BLEED_INSET : 0,
  });
}

/**
 * Index ledger — archive-index signature figure.
 *
 * Multi-column ruled entry rows with mono ordinals only (≤11px). The ledger IS the fold figure —
 * dense index grammar, high ink variation, no large SVG display type (foundry lesson). Theme packs
 * do not invent alphabetical ledgers from a density slider.
 */
export function indexLedger(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:index-ledger:${role}`);
  const W = role === "band" ? 1280 : role === "column" ? 560 : 720;
  /*
   * Tall plate dilutes CSS ruleDensity (rules ÷ screens). SVG strokes do not count — pack cells
   * with dual ink + stamps, keep hairlines sparse. Shrinking H to "fill voids" raised rules/screen.
   */
  const H = role === "band" ? 640 : role === "column" ? 520 : 480;
  const padX = role === "band" ? 44 : 28;
  const padY = role === "band" ? 36 : 28;
  const parts: string[] = [];

  // Outer rule — hairline only.
  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  // Header strip — register mark + product (mono ≤11px).
  const headY = padY + 16;
  parts.push(
    `<line x1="${round(padX)}" y1="${round(headY + 10)}" x2="${round(W - padX)}" y2="${round(headY + 10)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 10)}" y="${round(headY)}" font-size="11" fill="var(--surface-quiet)">REGISTER</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W / 2)}" y="${round(headY)}" font-size="11" fill="var(--surface-muted)" text-anchor="middle">${esc(clip(productName, 32))}</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 10)}" y="${round(headY)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">A–Z · INDEX</text>`,
  );

  // Build dense entry list from features + synthetic fillers for ink variation.
  const baseEntries = features.length ? features : [{ title: "Entry", body: "", meta: "001" } as Block];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const cols = 2;
  const gridTop = padY + 36;
  const gridBottom = H - padY - 22;
  const gridH = gridBottom - gridTop;
  const colGap = 22;
  const colW = (W - padX * 2 - colGap * (cols - 1)) / cols;
  /*
   * 2×6 packed cells: dual ink lines + stamps fill voids; hairline only on odd rows so the SVG
   * stays sparse. CSS bordered rows elsewhere own the ruleDensity budget — not this drawing.
   */
  const rowsPerCol = role === "band" ? 6 : 5;
  const rowH = gridH / rowsPerCol;

  for (let c = 0; c < cols; c += 1) {
    const x0 = padX + c * (colW + colGap);
    const letter = letters[Math.min(c * 8, letters.length - 1)] ?? letters[c]!;
    parts.push(
      `<text class="ds-fig-mono" x="${round(x0 + 4)}" y="${round(gridTop - 4)}" font-size="11" fill="var(--c-accent)">${letter}</text>`,
    );
    if (c > 0) {
      parts.push(
        `<line x1="${round(x0 - colGap / 2)}" y1="${round(gridTop)}" x2="${round(x0 - colGap / 2)}" y2="${round(gridBottom)}" stroke="${LINE}" stroke-width="1" opacity="0.4" vector-effect="non-scaling-stroke"/>`,
      );
    }

    for (let row = 0; row < rowsPerCol; row += 1) {
      const y = gridTop + row * rowH;
      const entryIdx = c * rowsPerCol + row;
      const f = baseEntries[entryIdx % baseEntries.length]!;
      const ordinal = String(entryIdx + 1).padStart(3, "0");
      // Sparse SVG hairlines — do not flood; CSS ruleDensity ignores these strokes anyway.
      if (row % 2 === 1 || row === rowsPerCol - 1) {
        parts.push(
          `<line x1="${round(x0)}" y1="${round(y + rowH)}" x2="${round(x0 + colW)}" y2="${round(y + rowH)}" stroke="${LINE}" stroke-width="1" opacity="0.38" vector-effect="non-scaling-stroke"/>`,
        );
      }
      parts.push(
        `<text class="ds-fig-mono" x="${round(x0 + 4)}" y="${round(y + rowH * 0.38)}" font-size="11" fill="var(--surface-quiet)">${ordinal}</text>`,
      );
      const title = clip(f.title ?? `Entry ${ordinal}`, role === "band" ? 22 : 14);
      parts.push(
        `<text class="ds-fig-mono" x="${round(x0 + 40)}" y="${round(y + rowH * 0.38)}" font-size="11" fill="var(--surface-muted)">${esc(title)}</text>`,
      );
      const sub = clip(
        f.kicker || `${letter}${row + 1} · shelf ${ordinal}`,
        role === "band" ? 22 : 16,
      );
      parts.push(
        `<text class="ds-fig-mono" x="${round(x0 + 40)}" y="${round(y + rowH * 0.72)}" font-size="11" fill="var(--surface-quiet)">${esc(sub)}</text>`,
      );
      // Accent stamp — filled mark, not an extra rule.
      if (row % 2 === 0) {
        parts.push(
          `<rect x="${round(x0 + colW - 10)}" y="${round(y + rowH * 0.28)}" width="5" height="5" fill="${ACCENT}" opacity="0.75"/>`,
        );
      }
      // Pale letter watermark — ink without hairline flood.
      if (row % 3 === 1) {
        parts.push(
          `<text class="ds-fig-mono" x="${round(x0 + colW - 14)}" y="${round(y + rowH * 0.78)}" font-size="11" fill="var(--surface-quiet)" opacity="0.35" text-anchor="end">${letter}</text>`,
        );
      }
    }
  }

  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 10)}" y="${round(H - padY + 12)}" font-size="11" fill="var(--surface-quiet)">${esc(clip(productName, 28))} · index ledger</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 10)}" y="${round(H - padY + 12)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${cols * rowsPerCol} entries</text>`,
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "index-ledger",
    label: `${productName} index ledger`,
    inset: role === "band" ? BLEED_INSET : 0,
  });
}

/**
 * Press sheet — press-atelier signature figure.
 *
 * Imposition grid where EVERY signature cell holds drawn page matter (mini layouts),
 * not empty ruled boxes. Crop marks, registration targets, densitometer strip.
 * Mono labels only (≤11px) — foundry SVG-text lesson. Theme packs restyle SaaS cards; they do
 * not invent filled press formes from a density slider.
 */
/**
 * Drawn page matter for a cell — title bar, media/prose, folio.
 * Shared so imposition grids and future cell figures cannot ship empty stroked voids
 * (`template:empty-sig-voids`). Prefer filled rects over rules to keep rule-structure in band.
 */
export function miniPageMatter(
  px: number,
  py: number,
  pw: number,
  ph: number,
  variant: number,
  folio: string,
  rnd: () => number = Math.random,
): string {
  const parts: string[] = [];
  parts.push(
    `<rect x="${round(px)}" y="${round(py)}" width="${round(pw)}" height="${round(ph)}" fill="var(--c-paper)" stroke="${LINE}" stroke-width="1" opacity="0.98" vector-effect="non-scaling-stroke"/>`,
  );
  const inset = 4;
  const ix = px + inset;
  const iy = py + inset;
  const iw = pw - inset * 2;
  parts.push(
    `<rect x="${round(ix)}" y="${round(iy)}" width="${round(iw * (0.62 + (variant % 3) * 0.1))}" height="3.5" fill="var(--surface-muted)" opacity="0.95"/>`,
  );
  parts.push(
    `<rect x="${round(ix)}" y="${round(iy + 6)}" width="${round(iw * 0.42)}" height="2" fill="var(--surface-quiet)" opacity="0.75"/>`,
  );
  const mediaH = Math.max(14, ph * (0.32 + (variant % 2) * 0.1));
  const mediaY = iy + 12;
  if (variant % 3 === 0) {
    parts.push(
      `<rect x="${round(ix)}" y="${round(mediaY)}" width="${round(iw)}" height="${round(mediaH)}" fill="${ACCENT_FIELD}" stroke="${LINE}" stroke-width="1" opacity="0.95" vector-effect="non-scaling-stroke"/>`,
    );
    for (let k = 0; k < 2; k += 1) {
      const ly = mediaY + mediaH * (0.3 + k * 0.28);
      parts.push(
        `<line x1="${round(ix + 3)}" y1="${round(ly)}" x2="${round(ix + iw - 3)}" y2="${round(ly)}" stroke="${ACCENT}" stroke-width="1" opacity="${round(0.35 + k * 0.15)}" vector-effect="non-scaling-stroke"/>`,
      );
    }
    parts.push(
      `<rect x="${round(ix + iw - 10)}" y="${round(mediaY + 3)}" width="7" height="7" fill="${ACCENT}" opacity="0.55"/>`,
    );
  } else if (variant % 3 === 1) {
    const colW = iw * 0.44;
    parts.push(
      `<rect x="${round(ix + iw - colW)}" y="${round(mediaY)}" width="${round(colW)}" height="${round(mediaH)}" fill="${ACCENT_FIELD}" stroke="${LINE}" stroke-width="1" opacity="0.85" vector-effect="non-scaling-stroke"/>`,
    );
    const proseRows = Math.max(4, Math.floor(mediaH / 4.5));
    for (let row = 0; row < proseRows; row += 1) {
      parts.push(
        `<rect x="${round(ix)}" y="${round(mediaY + row * 4.5)}" width="${round(iw * 0.48 * (0.65 + rnd() * 0.35))}" height="2.2" fill="var(--surface-quiet)" opacity="0.65"/>`,
      );
    }
  } else {
    const colGap = 3;
    const colW = (iw - colGap) / 2;
    for (let c = 0; c < 2; c += 1) {
      for (let row = 0; row < 8; row += 1) {
        const wMul = row === 0 ? 0.85 : 0.55 + rnd() * 0.4;
        parts.push(
          `<rect x="${round(ix + c * (colW + colGap))}" y="${round(mediaY + row * 4)}" width="${round(colW * wMul)}" height="2" fill="var(--surface-quiet)" opacity="${round(0.5 + (row % 3) * 0.12)}"/>`,
        );
      }
    }
  }
  const bodyY = mediaY + mediaH + 5;
  const bodyRows = Math.max(3, Math.floor((py + ph - inset - bodyY - 12) / 3.8));
  for (let row = 0; row < bodyRows; row += 1) {
    parts.push(
      `<rect x="${round(ix)}" y="${round(bodyY + row * 3.8)}" width="${round(iw * (0.55 + rnd() * 0.4))}" height="2" fill="var(--surface-quiet)" opacity="0.5"/>`,
    );
  }
  parts.push(
    `<rect x="${round(ix)}" y="${round(py + ph - 9)}" width="${round(iw * 0.35)}" height="1.5" fill="var(--surface-quiet)" opacity="0.45"/>`,
  );
  parts.push(
    text(folio, px + pw - 4, py + ph - 3, { size: FIG_MONO_PX, fill: QUIET, mono: true, anchor: "end" }),
  );
  return parts.join("");
}

/** Filled density patches (not tick rules) — reads as a densitometer without flooding rule-structure. */
export function densitometerStrip(
  x0: number,
  y0: number,
  width: number,
  patches = 8,
  labelLeft = "DENS",
): string {
  const parts: string[] = [];
  parts.push(text(labelLeft, x0, y0 + 6, { size: FIG_MONO_PX, fill: QUIET, mono: true }));
  parts.push(text("GRIP", x0, y0 + 18, { size: FIG_MONO_PX, fill: QUIET, mono: true }));
  const densStart = x0 + 42;
  const densSpan = Math.max(40, width - 42);
  for (let i = 0; i < patches; i += 1) {
    const px = densStart + (i / patches) * densSpan;
    const pw = densSpan / patches - 4;
    const op = round(0.12 + (i / Math.max(1, patches - 1)) * 0.8);
    parts.push(
      `<rect x="${round(px)}" y="${round(y0)}" width="${round(pw)}" height="12" fill="${ACCENT}" opacity="${op}"/>`,
    );
  }
  return parts.join("");
}

export function pressSheet(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:press-sheet:${role}`);
  const W = role === "band" ? 1280 : role === "column" ? 560 : 720;
  const H = role === "band" ? 860 : role === "column" ? 560 : 520;
  const padX = role === "band" ? 48 : 28;
  const padY = role === "band" ? 40 : 28;
  const parts: string[] = [];

  // Soft paper wash behind the forme — kills the empty white void look.
  parts.push(
    `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--c-paper-raised, var(--surface-raised))" opacity="0.55"/>`,
  );

  const crop = (x: number, y: number, dx: number, dy: number) => {
    parts.push(
      `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x + dx)}" y2="${round(y)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x)}" y2="${round(y + dy)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
  };
  const cLen = 16;
  crop(padX - 20, padY - 20, cLen, 0);
  crop(padX - 20, padY - 20, 0, cLen);
  crop(W - padX + 20, padY - 20, -cLen, 0);
  crop(W - padX + 20, padY - 20, 0, cLen);
  crop(padX - 20, H - padY + 20, cLen, 0);
  crop(padX - 20, H - padY + 20, 0, -cLen);
  crop(W - padX + 20, H - padY + 20, -cLen, 0);
  crop(W - padX + 20, H - padY + 20, 0, -cLen);

  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="var(--c-paper)" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  const headY = padY + 16;
  parts.push(text("PRESS SHEET", padX + 12, headY, { size: FIG_MONO_PX, fill: QUIET, mono: true }));
  parts.push(
    text(clip(productName, 28), W / 2, headY, {
      size: FIG_MONO_PX,
      fill: "var(--surface-muted)",
      mono: true,
      anchor: "middle",
    }),
  );
  parts.push(
    text("SIG A–H · FORME 16", W - padX - 12, headY, {
      size: FIG_MONO_PX,
      fill: QUIET,
      mono: true,
      anchor: "end",
    }),
  );
  parts.push(
    `<line x1="${round(padX)}" y1="${round(headY + 8)}" x2="${round(W - padX)}" y2="${round(headY + 8)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  const reg = (cx: number, cy: number) => {
    parts.push(
      `<circle cx="${round(cx)}" cy="${round(cy)}" r="6" fill="none" stroke="${ACCENT}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<circle cx="${round(cx)}" cy="${round(cy)}" r="1.8" fill="${ACCENT}" opacity="0.9"/>`,
    );
    parts.push(
      `<line x1="${round(cx - 11)}" y1="${round(cy)}" x2="${round(cx + 11)}" y2="${round(cy)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<line x1="${round(cx)}" y1="${round(cy - 11)}" x2="${round(cx)}" y2="${round(cy + 11)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
  };
  reg(W / 2, padY + 30);
  reg(padX + 22, H / 2);
  reg(W - padX - 22, H / 2);

  const base = features.length ? features : [{ title: "Signature", body: "", meta: "A" } as Block];
  const cols = role === "band" ? 4 : 3;
  const rows = 2;
  const gridTop = padY + 42;
  const densitometerH = 32;
  const gridBottom = H - padY - densitometerH - 14;
  const gridW = W - padX * 2 - 36;
  const gridH = gridBottom - gridTop;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const gridX = padX + 18;
  const sigs = "ABCDEFGH".split("");

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const i = row * cols + col;
      const x = gridX + col * cellW;
      const y = gridTop + row * cellH;
      const f = base[i % base.length]!;
      const sig = sigs[i] ?? String(i + 1);
      const cellPad = 5;
      const cx = x + cellPad;
      const cy = y + cellPad;
      const cw = cellW - cellPad * 2;
      const ch = cellH - cellPad * 2;

      parts.push(
        `<rect x="${round(cx)}" y="${round(cy)}" width="${round(cw)}" height="${round(ch)}" fill="color-mix(in srgb, var(--c-paper) 88%, var(--c-accent) 12%)" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
      );
      parts.push(
        `<rect x="${round(cx)}" y="${round(cy)}" width="${round(cw)}" height="20" fill="color-mix(in srgb, var(--c-accent) 16%, var(--c-paper))" opacity="0.98"/>`,
      );
      parts.push(text(`SIG ${sig}`, cx + 6, cy + 13, { size: FIG_MONO_PX, fill: ACCENT, mono: true }));
      parts.push(
        text(clip(f.title ?? `Plate ${sig}`, 14), cx + cw - 6, cy + 13, {
          size: FIG_MONO_PX,
          fill: QUIET,
          mono: true,
          anchor: "end",
        }),
      );

      const pageTop = cy + 24;
      const pageAreaH = ch - 30;
      const gap = 4;
      const pageW = (cw - 12 - gap) / 2;
      const pageH = (pageAreaH - gap) / 2;
      const pageX0 = cx + 6;
      for (let pr = 0; pr < 2; pr += 1) {
        for (let pc = 0; pc < 2; pc += 1) {
          const pi = pr * 2 + pc;
          const folio = String(i * 4 + pi + 1).padStart(2, "0");
          parts.push(
            miniPageMatter(
              pageX0 + pc * (pageW + gap),
              pageTop + pr * (pageH + gap),
              pageW,
              pageH,
              (i * 3 + pi + Math.floor(r() * 3)) % 6,
              folio,
              r,
            ),
          );
        }
      }
      // Soft fold cue — one accent tick only (not a full cross) to keep rule density in band.
      parts.push(
        `<rect x="${round(cx + cw / 2 - 4)}" y="${round(cy + 22)}" width="8" height="2" fill="${ACCENT}" opacity="0.4"/>`,
      );
    }
  }

  const densY = H - padY - densitometerH;
  parts.push(
    `<line x1="${round(padX)}" y1="${round(densY)}" x2="${round(W - padX)}" y2="${round(densY)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(densitometerStrip(padX + 10, densY + 8, W - padX * 2 - 20, 8));

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "press-sheet",
    label: `${productName} press sheet`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Path plate — lantern-path signature figure.
 *
 * Night cartograph: elevation ribbon, winding path, five lantern waypoints with filled
 * silhouette near-planes (gate / pine / stone). Dense ink — not empty dark voids or soft glow cards.
 * Mono labels only (≤11px). Theme packs restyle dark heroes; they do not invent a citeable night atlas.
 */
export function pathPlate(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:path-plate:${role}`);
  const W = role === "band" ? 1280 : role === "column" ? 560 : 720;
  const H = role === "band" ? 860 : role === "column" ? 560 : 520;
  const padX = role === "band" ? 40 : 24;
  const padY = role === "band" ? 36 : 24;
  const parts: string[] = [];

  // Night field — filled matter, not an empty void.
  parts.push(
    `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--c-ink)" opacity="0.92"/>`,
  );
  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="color-mix(in srgb, var(--c-ink) 88%, var(--c-accent) 12%)" stroke="${LINE}" stroke-width="1" opacity="0.98" vector-effect="non-scaling-stroke"/>`,
  );

  const headY = padY + 18;
  parts.push(text("PATH ATLAS", padX + 14, headY, { size: FIG_MONO_PX, fill: "color-mix(in srgb, var(--c-paper) 55%, transparent)", mono: true }));
  parts.push(
    text(clip(productName, 26), W / 2, headY, {
      size: FIG_MONO_PX,
      fill: "color-mix(in srgb, var(--c-paper) 70%, transparent)",
      mono: true,
      anchor: "middle",
    }),
  );
  parts.push(
    text("CH I–V · NIGHT WALK", W - padX - 14, headY, {
      size: FIG_MONO_PX,
      fill: "color-mix(in srgb, var(--c-paper) 45%, transparent)",
      mono: true,
      anchor: "end",
    }),
  );

  // Moon — simple filled disc, no glow stack.
  const moonX = W - padX - 72;
  const moonY = padY + 72;
  parts.push(`<circle cx="${round(moonX)}" cy="${round(moonY)}" r="22" fill="color-mix(in srgb, var(--c-paper) 82%, ${ACCENT} 18%)" opacity="0.9"/>`);
  parts.push(`<circle cx="${round(moonX + 8)}" cy="${round(moonY - 4)}" r="22" fill="color-mix(in srgb, var(--c-ink) 88%, var(--c-accent) 12%)" opacity="0.95"/>`);

  // Horizon haze band.
  parts.push(
    `<rect x="${round(padX + 8)}" y="${round(H * 0.38)}" width="${round(W - padX * 2 - 16)}" height="${round(H * 0.12)}" fill="color-mix(in srgb, var(--c-paper) 8%, transparent)" opacity="0.9"/>`,
  );

  const chapterNames = ["Threshold", "Gardens", "Craft", "Rituals", "Afterlight"];
  const n = 5;
  const pathTop = padY + 56;
  const pathBottom = H - padY - 110;
  const pathLeft = padX + 48;
  const pathRight = W - padX - 48;

  // Elevation ribbon under the path — filled contour, not hairline flood.
  const elevPts: string[] = [];
  const elevFill: string[] = [`${round(pathLeft)},${round(pathBottom + 36)}`];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const x = pathLeft + t * (pathRight - pathLeft);
    const y =
      pathBottom +
      8 +
      Math.sin(t * Math.PI * 2.2) * 14 +
      Math.cos(t * Math.PI * 1.1) * 8 +
      (r() - 0.5) * 4;
    elevPts.push(`${round(x)},${round(y)}`);
    elevFill.push(`${round(x)},${round(y)}`);
  }
  elevFill.push(`${round(pathRight)},${round(pathBottom + 36)}`);
  parts.push(
    `<polygon points="${elevFill.join(" ")}" fill="color-mix(in srgb, var(--c-paper) 10%, transparent)" opacity="0.95"/>`,
  );
  parts.push(
    `<polyline points="${elevPts.join(" ")}" fill="none" stroke="color-mix(in srgb, var(--c-paper) 28%, transparent)" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(text("ELEV", pathLeft, pathBottom + 52, { size: FIG_MONO_PX, fill: "color-mix(in srgb, var(--c-paper) 40%, transparent)", mono: true }));

  // Winding path + lantern waypoints — fixed chapter names (not truncated feature titles).
  const waypoints: { x: number; y: number; title: string; roman: string }[] = [];
  const romans = ["I", "II", "III", "IV", "V"];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const x = pathLeft + t * (pathRight - pathLeft);
    const y =
      pathTop +
      48 +
      Math.sin(t * Math.PI) * (pathBottom - pathTop - 100) * 0.52 +
      (i % 2 === 0 ? 22 : -16);
    waypoints.push({
      x,
      y,
      title: chapterNames[i]!,
      roman: romans[i]!,
    });
  }

  // Path stroke as thick filled underlay + thin edge (rule-light).
  const pathD = waypoints
    .map((w, i) => `${i === 0 ? "M" : "L"}${round(w.x)} ${round(w.y)}`)
    .join(" ");
  parts.push(
    `<path d="${pathD}" fill="none" stroke="color-mix(in srgb, var(--c-paper) 18%, transparent)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  parts.push(
    `<path d="${pathD}" fill="none" stroke="${ACCENT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" vector-effect="non-scaling-stroke"/>`,
  );

  for (let i = 0; i < waypoints.length; i += 1) {
    const w = waypoints[i]!;
    // Lantern body — filled rect + flame, not a glow blur stack.
    parts.push(
      `<rect x="${round(w.x - 5)}" y="${round(w.y - 18)}" width="10" height="14" rx="1" fill="color-mix(in srgb, ${ACCENT} 70%, var(--c-paper) 30%)" opacity="0.95"/>`,
    );
    parts.push(
      `<rect x="${round(w.x - 3)}" y="${round(w.y - 26)}" width="6" height="8" fill="${ACCENT}" opacity="0.9"/>`,
    );
    parts.push(`<circle cx="${round(w.x)}" cy="${round(w.y - 28)}" r="3.5" fill="${ACCENT}" opacity="0.85"/>`);
    parts.push(`<circle cx="${round(w.x)}" cy="${round(w.y)}" r="3" fill="var(--c-paper)" opacity="0.75"/>`);
    parts.push(
      text(`CH ${w.roman}`, w.x, w.y + 18, {
        size: FIG_MONO_PX,
        fill: "color-mix(in srgb, var(--c-paper) 75%, transparent)",
        mono: true,
        anchor: "middle",
      }),
    );
    parts.push(
      text(clip(w.title, 12), w.x, w.y + 32, {
        size: FIG_MONO_PX,
        fill: "color-mix(in srgb, var(--c-paper) 55%, transparent)",
        mono: true,
        anchor: "middle",
      }),
    );
  }

  // Terrain fill under path — denser night matter so the atlas is not a thin polyline.
  const terrain: string[] = [`${round(pathLeft)},${round(pathBottom + 8)}`];
  for (const w of waypoints) {
    terrain.push(`${round(w.x)},${round(w.y + 28)}`);
  }
  terrain.push(`${round(pathRight)},${round(pathBottom + 8)}`);
  parts.push(
    `<polygon points="${terrain.join(" ")}" fill="color-mix(in srgb, ${ACCENT} 8%, transparent)" opacity="0.55"/>`,
  );

  // Feature legend chips — citeable matter from the brief, parked under waypoints (not as labels).
  const legend = (features.length ? features : [{ title: "Waypoint" } as Block]).slice(0, 3);
  legend.forEach((f, i) => {
    const lx = padX + 20 + i * 160;
    const ly = pathTop + 8;
    parts.push(
      `<rect x="${round(lx)}" y="${round(ly)}" width="140" height="22" fill="color-mix(in srgb, var(--c-paper) 8%, transparent)" stroke="color-mix(in srgb, var(--c-paper) 22%, transparent)" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      text(clip(f.title, 18), lx + 8, ly + 15, {
        size: FIG_MONO_PX,
        fill: "color-mix(in srgb, var(--c-paper) 60%, transparent)",
        mono: true,
      }),
    );
  });

  // Silhouette near-plane matter along the foot — gate, pines, stones (filled).
  const silY = H - padY - 28;
  const silBase = H - padY - 4;
  // Gate silhouette — denser filled matter
  parts.push(
    `<path d="M${round(padX + 28)} ${round(silBase)} L${round(padX + 28)} ${round(silY - 48)} L${round(padX + 52)} ${round(silY - 68)} L${round(padX + 76)} ${round(silY - 48)} L${round(padX + 76)} ${round(silBase)} Z" fill="color-mix(in srgb, var(--c-ink) 55%, #000 45%)" opacity="0.98"/>`,
  );
  parts.push(
    `<rect x="${round(padX + 40)}" y="${round(silY - 28)}" width="24" height="28" fill="color-mix(in srgb, ${ACCENT} 35%, transparent)" opacity="0.7"/>`,
  );
  // Pines — denser bank
  for (let p = 0; p < 6; p += 1) {
    const px = padX + 110 + p * ((W - padX * 2 - 220) / 5);
    const ph = 56 + (p % 3) * 12 + r() * 10;
    parts.push(
      `<path d="M${round(px)} ${round(silBase)} L${round(px - 18)} ${round(silBase - ph * 0.45)} L${round(px - 9)} ${round(silBase - ph * 0.45)} L${round(px - 22)} ${round(silBase - ph * 0.75)} L${round(px - 7)} ${round(silBase - ph * 0.75)} L${round(px)} ${round(silBase - ph)} L${round(px + 7)} ${round(silBase - ph * 0.75)} L${round(px + 22)} ${round(silBase - ph * 0.75)} L${round(px + 9)} ${round(silBase - ph * 0.45)} L${round(px + 18)} ${round(silBase - ph * 0.45)} Z" fill="color-mix(in srgb, var(--c-ink) 60%, #000 40%)" opacity="0.95"/>`,
    );
  }
  // Stones
  for (let s = 0; s < 7; s += 1) {
    const sx = padX + 80 + s * 42 + r() * 12;
    parts.push(
      `<ellipse cx="${round(sx)}" cy="${round(silBase - 7)}" rx="${round(16 + r() * 10)}" ry="${round(6 + r() * 3)}" fill="color-mix(in srgb, var(--c-paper) 14%, #000 86%)" opacity="0.92"/>`,
    );
  }
  parts.push(
    text("NEAR PLANE · SILHOUETTE", padX + 14, H - padY + 2, {
      size: FIG_MONO_PX,
      fill: "color-mix(in srgb, var(--c-paper) 35%, transparent)",
      mono: true,
    }),
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "path-plate",
    label: `${productName} path atlas`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Pipeline board — SaaS-marketing fold instrument.
 * Stage columns with deal nodes and a sticky-rail-friendly ordinal strip. Not interfacePlate.
 */
export function pipelineBoard(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const items = features.slice(0, 5);
  const W = role === "band" ? 1440 : role === "column" ? 720 : 920;
  const H = role === "band" ? 780 : role === "column" ? 640 : 560;
  const r = rng(`${seed}:pipeline`);
  const pad = role === "band" ? W * 0.05 : W * 0.07;
  const parts: string[] = [];
  const stages = items.length >= 3 ? items : [
    { title: "Inbound", body: "Accounts entering the pipe" },
    { title: "Qualified", body: "Fit scored live" },
    { title: "Working", body: "Owner + next action" },
    { title: "Commit", body: "Forecast-ready" },
  ];
  const n = Math.min(5, Math.max(3, stages.length));
  const colW = (W - pad * 2 - 12 * (n - 1)) / n;
  parts.push(
    text("PIPELINE", pad, pad + 4, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 1.2 }),
  );
  parts.push(
    text(clip(productName, 28), W - pad, pad + 4, {
      size: FIG_MONO_PX,
      fill: QUIET,
      mono: true,
      anchor: "end",
    }),
  );
  for (let i = 0; i < n; i += 1) {
    const x = pad + i * (colW + 12);
    const y = pad + 36;
    const s = stages[i]!;
    const colInset = 12;
    const contentW = Math.max(40, colW - colInset * 2);
    parts.push(box(x, y, colW, H - y - pad - 28, { r: 0, fill: PAPER, stroke: LINE }));
    parts.push(
      text(String(i + 1).padStart(2, "0"), x + colInset, y + 28, {
        size: 22,
        fill: i === 1 ? ACCENT : "var(--c-border-strong)",
        mono: true,
        weight: 500,
      }),
    );
    parts.push(
      text(clipToWidth(s.title, contentW, 14, false), x + colInset, y + 56, {
        size: 14,
        fill: INK,
        weight: 600,
      }),
    );
    const bodyCols = Math.max(8, Math.floor(contentW / approxAdvance(FIG_MONO_PX, true)));
    const matter = wrap(s.body || s.title, bodyCols, 3);
    matter.forEach((ln, j) => {
      parts.push(text(ln, x + colInset, y + 84 + j * 18, { size: FIG_MONO_PX, fill: BODY }));
    });
    // Deal nodes — chip width and label share one budget so text never escapes the pill.
    const nodeCount = 2 + Math.floor(r() * 3);
    const nodeInset = 10;
    const nw = contentW;
    for (let k = 0; k < nodeCount; k += 1) {
      const ny = y + 160 + k * 52;
      if (ny > H - pad - 48) break;
      const amount = `${10 + Math.floor(r() * 80)}k`;
      const label = fitDealChip(s.title, amount, nw - nodeInset * 2);
      parts.push(box(x + colInset, ny, nw, 36, { r: 4, fill: i === 1 ? ACCENT_FIELD : "var(--c-paper-raised)", stroke: LINE }));
      parts.push(
        text(label, x + colInset + nodeInset, ny + 22, {
          size: FIG_MONO_PX,
          fill: INK,
          mono: true,
        }),
      );
    }
    if (i < n - 1) {
      const cx = x + colW;
      const cy = y + 48;
      parts.push(rule(cx + 2, cy, cx + 10, cy, LINE));
    }
  }
  parts.push(rule(pad, H - pad - 10, W - pad, H - pad - 10));
  parts.push(
    text(`${n} stages · live pipe`, pad, H - pad + 6, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 0.6 }),
  );
  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "pipeline-board",
    label: `${productName} pipeline board`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Queue console — dashboard fold instrument. Dense operator chrome, not flow stage cards.
 */
export function queueConsole(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const items = features.slice(0, 6);
  const W = role === "band" ? 1440 : role === "column" ? 720 : 920;
  const H = role === "band" ? 760 : role === "column" ? 640 : 540;
  const r = rng(`${seed}:queue`);
  const pad = W * 0.04;
  const parts: string[] = [];
  const railW = W * 0.18;
  parts.push(box(pad, pad, railW, H - pad * 2, { r: 0, fill: "var(--c-paper-raised)", stroke: LINE }));
  parts.push(text("PRIORITY", pad + 16, pad + 28, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 1 }));
  items.forEach((b, i) => {
    const y = pad + 56 + i * 44;
    const lead = i === 1;
    if (lead) parts.push(box(pad + 8, y - 18, railW - 16, 36, { r: 4, fill: ACCENT_FIELD, stroke: "var(--c-accent-border)" }));
    parts.push(
      text(String(i + 1).padStart(2, "0"), pad + 16, y, {
        size: FIG_MONO_PX,
        fill: lead ? ACCENT : QUIET,
        mono: true,
      }),
    );
    parts.push(text(clip(b.title, 16), pad + 48, y, { size: 13, fill: INK, weight: lead ? 600 : 500 }));
    const delta = lead ? "+3" : r() > 0.5 ? "−1" : "0";
    parts.push(
      text(delta, pad + railW - 20, y, {
        size: FIG_MONO_PX,
        fill: lead ? ACCENT : QUIET,
        mono: true,
        anchor: "end",
      }),
    );
  });
  const mainX = pad + railW + 20;
  const mainW = W - mainX - pad;
  parts.push(box(mainX, pad, mainW, H - pad * 2, { r: 0, fill: PAPER, stroke: LINE }));
  parts.push(text(clip(productName, 24), mainX + 20, pad + 28, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text("Operator console", mainX + 20, pad + 56, { size: 18, fill: INK, weight: 600 }));
  // Dense rows
  for (let i = 0; i < 8; i += 1) {
    const y = pad + 88 + i * 52;
    if (y > H - pad - 40) break;
    const feat = items[i % Math.max(1, items.length)]!;
    parts.push(rule(mainX + 16, y - 12, mainX + mainW - 16, y - 12));
    parts.push(text(clip(feat.title, 28), mainX + 20, y + 8, { size: 13, fill: INK, weight: 600 }));
    const sub = wrap(feat.body || feat.title, Math.max(20, Math.round(mainW / 10)), 2);
    sub.forEach((ln, j) => {
      parts.push(text(ln, mainX + 20, y + 28 + j * 16, { size: FIG_MONO_PX, fill: BODY }));
    });
    parts.push(
      text(`${40 + Math.floor(r() * 55)}m`, mainX + mainW - 24, y + 8, {
        size: FIG_MONO_PX,
        fill: QUIET,
        mono: true,
        anchor: "end",
      }),
    );
  }
  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "queue-console",
    label: `${productName} queue console`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Posture grid — corporate diligence fold. Principles × outcomes matrix, not horizon ticks.
 */
export function postureGrid(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const items = features.slice(0, 4);
  const W = role === "band" ? 1440 : role === "column" ? 680 : 920;
  const H = role === "band" ? 720 : role === "column" ? 640 : 520;
  void seed;
  const pad = W * 0.06;
  const parts: string[] = [];
  parts.push(text("DILIGENCE POSTURE", pad, pad + 8, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 1.4 }));
  parts.push(
    text(clip(productName, 32), W - pad, pad + 8, { size: FIG_MONO_PX, fill: QUIET, mono: true, anchor: "end" }),
  );
  parts.push(rule(pad, pad + 28, W - pad, pad + 28));
  const cols = 2;
  const rows = 2;
  const gap = 28;
  const cellW = (W - pad * 2 - gap) / cols;
  const cellH = (H - pad * 2 - 56 - gap) / rows;
  items.slice(0, 4).forEach((b, i) => {
    const c = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + c * (cellW + gap);
    const y = pad + 48 + row * (cellH + gap);
    parts.push(box(x, y, cellW, cellH, { r: 0, fill: PAPER, stroke: LINE }));
    parts.push(
      text(String(i + 1).padStart(2, "0"), x + 20, y + 36, {
        size: 28,
        fill: i === 3 ? ACCENT : "var(--c-border-strong)",
        mono: true,
        weight: 500,
      }),
    );
    parts.push(text(clip(b.title, 28), x + 20, y + 72, { size: 18, fill: INK, weight: 600 }));
    const lines = wrap(b.body || b.title, Math.max(18, Math.round(cellW / 11)), 4);
    lines.forEach((ln, j) => {
      parts.push(text(ln, x + 20, y + 104 + j * 22, { size: 14, fill: BODY }));
    });
    parts.push(rule(x + 20, y + cellH - 36, x + cellW - 20, y + cellH - 36));
    parts.push(
      text(b.meta || `Principle ${String(i + 1).padStart(2, "0")}`, x + 20, y + cellH - 16, {
        size: FIG_MONO_PX,
        fill: QUIET,
        mono: true,
      }),
    );
  });
  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "posture-grid",
    label: `${productName} diligence posture`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Mechanism plate — educational fold instrument (scrub drives stages). Cost-axis stack, not empty flow cards.
 */
export function mechanismPlate(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const items = features.slice(0, 4);
  const W = role === "band" ? 1440 : role === "column" ? 720 : 920;
  const H = role === "band" ? 700 : role === "column" ? 620 : 520;
  void seed;
  const pad = W * 0.06;
  const parts: string[] = [];
  parts.push(text("COST · CUMULATIVE", pad, pad + 8, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 1.2 }));
  parts.push(
    text(clip(productName, 28), W - pad, pad + 8, { size: FIG_MONO_PX, fill: QUIET, mono: true, anchor: "end" }),
  );
  const axisX = pad + 48;
  const axisY = pad + 48;
  const axisH = H - pad * 2 - 80;
  const axisW = W - pad * 2 - 64;
  parts.push(rule(axisX, axisY, axisX, axisY + axisH));
  parts.push(rule(axisX, axisY + axisH, axisX + axisW, axisY + axisH));
  [100, 70, 40, 10].forEach((v, i) => {
    const y = axisY + (axisH * i) / 3;
    parts.push(rule(axisX, y, axisX + axisW, y, "var(--surface-border)"));
    parts.push(
      text(String(v), axisX - 12, y + 4, { size: FIG_MONO_PX, fill: QUIET, mono: true, anchor: "end" }),
    );
  });
  const n = Math.max(2, items.length);
  items.forEach((b, i) => {
    const x = axisX + ((i + 0.5) / n) * axisW;
    const y = axisY + axisH * (1 - (0.25 + (i / Math.max(1, n - 1)) * 0.65));
    if (i > 0) {
      const px = axisX + ((i - 0.5) / n) * axisW;
      const py = axisY + axisH * (1 - (0.25 + ((i - 1) / Math.max(1, n - 1)) * 0.65));
      parts.push(
        `<path d="M${round(px)} ${round(py)} L${round(x)} ${round(y)}" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round"/>`,
      );
    }
    const lead = i === 1;
    parts.push(
      `<circle cx="${round(x)}" cy="${round(y)}" r="${lead ? 7 : 5}" fill="${lead ? PAPER : ACCENT}" stroke="${ACCENT}" stroke-width="2"/>`,
    );
    parts.push(
      text(clip(b.title, 16), x, axisY - 4, {
        size: FIG_MONO_PX,
        fill: lead ? ACCENT : QUIET,
        mono: true,
        anchor: "middle",
      }),
    );
    parts.push(
      text(String(i + 1).padStart(2, "0"), x, axisY + axisH + 22, {
        size: FIG_MONO_PX,
        fill: QUIET,
        mono: true,
        anchor: "middle",
      }),
    );
  });
  const active = items[1] ?? items[0];
  if (active) {
    parts.push(
      text(clip(active.body || active.title, 64), axisX + 12, axisY + 28, {
        size: 13,
        fill: BODY,
      }),
    );
  }
  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "mechanism-plate",
    label: `${productName} mechanism`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Wire ledger — fintech fold instrument. Multi-entity ruled ledger with cutoff ticks.
 */
export function wireLedger(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const items = features.slice(0, 5);
  const W = role === "band" ? 1440 : role === "column" ? 720 : 920;
  const H = role === "band" ? 760 : role === "column" ? 640 : 540;
  const r = rng(`${seed}:wire`);
  const pad = W * 0.05;
  const parts: string[] = [];
  parts.push(text("WIRE LEDGER", pad, pad + 8, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 1.4 }));
  parts.push(
    text(clip(productName, 28), W - pad, pad + 8, { size: FIG_MONO_PX, fill: QUIET, mono: true, anchor: "end" }),
  );
  // Cutoff ticks
  const cutoffs = ["09:00", "12:00", "15:00", "17:00"];
  cutoffs.forEach((c, i) => {
    const x = pad + 80 + i * ((W - pad * 2 - 100) / 3);
    parts.push(rule(x, pad + 28, x, pad + 48));
    parts.push(text(c, x, pad + 64, { size: FIG_MONO_PX, fill: QUIET, mono: true, anchor: "middle" }));
  });
  parts.push(rule(pad, pad + 80, W - pad, pad + 80));
  const headers = ["Entity", "Path", "Status", "FX"];
  const colW = [0.28, 0.32, 0.2, 0.2].map((f) => (W - pad * 2) * f);
  let hx = pad;
  headers.forEach((h, i) => {
    parts.push(text(h, hx + 8, pad + 104, { size: FIG_MONO_PX, fill: QUIET, mono: true, track: 0.8 }));
    hx += colW[i]!;
  });
  parts.push(rule(pad, pad + 116, W - pad, pad + 116));
  items.forEach((b, i) => {
    const y = pad + 148 + i * 72;
    const lead = i === 1;
    if (lead) parts.push(box(pad, y - 28, W - pad * 2, 64, { r: 0, fill: ACCENT_FIELD, stroke: "none" }));
    let x = pad;
    const cells = [
      clip(b.title, 22),
      clip(b.body || "Same-day path", 28),
      lead ? "CLEARING" : i === 0 ? "QUEUED" : "POSTED",
      `${(0.8 + r() * 1.4).toFixed(2)}`,
    ];
    cells.forEach((cell, ci) => {
      parts.push(
        text(cell, x + 8, y, {
          size: ci === 0 ? 14 : FIG_MONO_PX,
          fill: lead && ci === 2 ? ACCENT : INK,
          weight: ci === 0 ? 600 : 400,
          mono: ci !== 0,
        }),
      );
      x += colW[ci]!;
    });
    parts.push(rule(pad, y + 28, W - pad, y + 28));
  });
  parts.push(
    text("Tolerance ±0.4% · illustrative", pad, H - pad + 4, {
      size: FIG_MONO_PX,
      fill: QUIET,
      mono: true,
    }),
  );
  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "wire-ledger",
    label: `${productName} wire ledger`,
    inset: role === "band" ? BLEED_INSET : 0,
    dense: true,
  });
}

/**
 * Loom weave — commerce-loom signature figure.
 *
 * Warp threads + weft SKU cells with copyright-free textile photographs clipped into the weave.
 * Mono SKU / size labels only (≤11px). Theme packs invent soft card grids; they do not invent a
 * warp/weft merchandising press with size-tape chrome.
 */
export function loomWeave(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:loom-weave:${role}`);
  const W = role === "band" ? 1280 : role === "column" ? 560 : 720;
  const H = role === "band" ? 720 : role === "column" ? 520 : 480;
  const padX = role === "band" ? 40 : 24;
  const padY = role === "band" ? 36 : 24;
  const parts: string[] = [];
  const photos = [FREE_PHOTOS.textileA, FREE_PHOTOS.textileB, FREE_PHOTOS.textileC];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // Outer loom frame — hairline.
  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  // Header — LOOM + product (mono ≤11px).
  const headY = padY + 14;
  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 10)}" y="${round(headY)}" font-size="11" fill="var(--surface-quiet)">Loom · warp × weft</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W / 2)}" y="${round(headY)}" font-size="11" fill="var(--surface-muted)" text-anchor="middle">${esc(clip(productName, 28))}</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 10)}" y="${round(headY)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">Size tape</text>`,
  );
  parts.push(
    `<line x1="${round(padX)}" y1="${round(headY + 8)}" x2="${round(W - padX)}" y2="${round(headY + 8)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  // Size tape along left — chrome ticks, not thick bars.
  const tapeX = padX + 8;
  const tapeTop = padY + 36;
  const tapeBot = H - padY - 28;
  for (let i = 0; i < sizes.length; i += 1) {
    const y = tapeTop + (i / (sizes.length - 1)) * (tapeBot - tapeTop);
    parts.push(
      `<line x1="${round(tapeX)}" y1="${round(y)}" x2="${round(tapeX + 10)}" y2="${round(y)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(tapeX + 14)}" y="${round(y + 3)}" font-size="11" fill="var(--surface-quiet)">${sizes[i]}</text>`,
    );
  }

  // Weave field — warp lines + weft photo cells.
  const fieldX = padX + 56;
  const fieldY = padY + 32;
  const fieldW = W - padX - 16 - fieldX;
  const fieldH = H - padY - 28 - fieldY;
  const cols = 3;
  const rows = role === "band" ? 2 : 2;
  const gap = 10;
  const cellW = (fieldW - gap * (cols - 1)) / cols;
  const cellH = (fieldH - gap * (rows - 1)) / rows;
  const base = features.length ? features : [{ title: "SKU", body: "", meta: "001" } as Block];

  // Warp threads behind cells (sparse — avoid rule flood).
  const warps = 7;
  for (let i = 0; i < warps; i += 1) {
    const x = fieldX + ((i + 0.5) / warps) * fieldW;
    parts.push(
      `<line x1="${round(x)}" y1="${round(fieldY)}" x2="${round(x)}" y2="${round(fieldY + fieldH)}" stroke="${LINE}" stroke-width="1" opacity="${round(0.18 + (i % 3) * 0.08)}" vector-effect="non-scaling-stroke"/>`,
    );
  }

  // Shuttle path — unreplicable loom craft (theme packs do not invent a flying shuttle).
  const shuttleY = fieldY + fieldH * 0.48;
  parts.push(
    `<path d="M ${round(fieldX + 8)} ${round(shuttleY)} C ${round(fieldX + fieldW * 0.35)} ${round(shuttleY - 18)}, ${round(fieldX + fieldW * 0.65)} ${round(shuttleY + 18)}, ${round(fieldX + fieldW - 8)} ${round(shuttleY)}" fill="none" stroke="${ACCENT}" stroke-width="1" opacity="0.55" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<ellipse cx="${round(fieldX + fieldW * 0.62)}" cy="${round(shuttleY + 2)}" rx="14" ry="5" fill="none" stroke="${ACCENT}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(fieldX + fieldW * 0.62)}" y="${round(shuttleY - 10)}" font-size="11" fill="var(--surface-quiet)" text-anchor="middle">Shuttle</text>`,
  );

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = fieldX + col * (cellW + gap);
      const y = fieldY + row * (cellH + gap);
      const idx = row * cols + col;
      const f = base[idx % base.length]!;
      const photo = photos[idx % photos.length]!;
      const clipId = `loom-clip-${idx}`;
      parts.push(`<defs><clipPath id="${clipId}"><rect x="${round(x)}" y="${round(y)}" width="${round(cellW)}" height="${round(cellH * 0.72)}"/></clipPath></defs>`);
      parts.push(
        `<image href="${photo}" x="${round(x)}" y="${round(y)}" width="${round(cellW)}" height="${round(cellH * 0.72)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" opacity="0.92"/>`,
      );
      // Weft rule under photo.
      parts.push(
        `<rect x="${round(x)}" y="${round(y)}" width="${round(cellW)}" height="${round(cellH)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
      );
      parts.push(
        `<line x1="${round(x)}" y1="${round(y + cellH * 0.72)}" x2="${round(x + cellW)}" y2="${round(y + cellH * 0.72)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
      );
      const sku = String(100 + idx).padStart(3, "0");
      parts.push(
        `<text class="ds-fig-mono" x="${round(x + 6)}" y="${round(y + cellH * 0.72 + 14)}" font-size="11" fill="var(--surface-quiet)">Sku ${sku}</text>`,
      );
      parts.push(
        `<text class="ds-fig-mono" x="${round(x + 6)}" y="${round(y + cellH - 8)}" font-size="11" fill="var(--surface-muted)">${esc(clip(f.title ?? "Line", 18))}</text>`,
      );
      // Accent pin on lead cell.
      if (idx === 0) {
        parts.push(
          `<rect x="${round(x + cellW - 10)}" y="${round(y + 6)}" width="4" height="4" fill="${ACCENT}" opacity="0.85"/>`,
        );
      }
      void r; // seed reserved for future weave jitter without rule flood
    }
  }

  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 10)}" y="${round(H - padY + 12)}" font-size="11" fill="var(--surface-quiet)">${esc(clip(productName, 24))} · loom weave</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 10)}" y="${round(H - padY + 12)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${cols * rows} cells · free textile stock</text>`,
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "loom-weave",
    label: `${productName} loom weave`,
    inset: role === "band" ? BLEED_INSET : 0,
  });
}

/**
 * Specimen plate — field-guide signature figure.
 *
 * Pressed-leaf silhouette + copyright-free botanical photo inset in a voucher window, taxonomic
 * mono labels ≤11px, range ticks. Soft theme packs float glass cards; they do not invent a
 * herbarium voucher with pressed geometry and a taxon rail.
 */
export function specimenPlate(
  productName: string,
  features: Block[],
  seed: string,
  role: FigureRole = "band",
): string {
  const r = rng(`${seed}:specimen-plate:${role}`);
  const W = role === "band" ? 1280 : role === "column" ? 560 : 720;
  const H = role === "band" ? 720 : role === "column" ? 520 : 480;
  const padX = role === "band" ? 44 : 26;
  const padY = role === "band" ? 36 : 24;
  const parts: string[] = [];
  const photos = [FREE_PHOTOS.botanicalA, FREE_PHOTOS.botanicalB, FREE_PHOTOS.botanicalC];
  const ranks = ["K", "P", "C", "O", "F", "G", "S"];

  parts.push(
    `<rect x="${round(padX)}" y="${round(padY)}" width="${round(W - padX * 2)}" height="${round(H - padY * 2)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  const headY = padY + 14;
  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 10)}" y="${round(headY)}" font-size="11" fill="var(--surface-quiet)">Voucher · herbarium</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W / 2)}" y="${round(headY)}" font-size="11" fill="var(--surface-muted)" text-anchor="middle">${esc(clip(productName, 28))}</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 10)}" y="${round(headY)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">Specimen</text>`,
  );
  parts.push(
    `<line x1="${round(padX)}" y1="${round(headY + 8)}" x2="${round(W - padX)}" y2="${round(headY + 8)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );

  // Taxon rank ticks along left.
  const rankTop = padY + 36;
  const rankBot = H - padY - 28;
  for (let i = 0; i < ranks.length; i += 1) {
    const y = rankTop + (i / (ranks.length - 1)) * (rankBot - rankTop);
    parts.push(
      `<line x1="${round(padX + 8)}" y1="${round(y)}" x2="${round(padX + 16)}" y2="${round(y)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(padX + 20)}" y="${round(y + 3)}" font-size="11" fill="var(--surface-quiet)">${ranks[i]}</text>`,
    );
  }

  // Pressed silhouette (constructed leaf — not SVG display type).
  const leafX = padX + 70;
  const leafY = padY + 40;
  const leafW = W * 0.42;
  const leafH = H - padY * 2 - 70;
  const midX = leafX + leafW * 0.45;
  const midY = leafY + leafH * 0.5;
  // Stem
  parts.push(
    `<line x1="${round(midX)}" y1="${round(leafY + leafH * 0.08)}" x2="${round(midX)}" y2="${round(leafY + leafH * 0.92)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  // Leaf outline as paired arcs / polylines
  const lobes = 5;
  for (let i = 0; i < lobes; i += 1) {
    const t0 = 0.12 + (i / lobes) * 0.7;
    const y0 = leafY + leafH * t0;
    const spread = leafW * (0.18 + 0.12 * Math.sin(i * 1.2 + r() * 0.2));
    parts.push(
      `<path d="M ${round(midX)} ${round(y0)} Q ${round(midX - spread)} ${round(y0 + leafH * 0.06)} ${round(midX)} ${round(y0 + leafH * 0.14)}" fill="none" stroke="${LINE}" stroke-width="1" opacity="0.75" vector-effect="non-scaling-stroke"/>`,
    );
    parts.push(
      `<path d="M ${round(midX)} ${round(y0)} Q ${round(midX + spread * 0.9)} ${round(y0 + leafH * 0.05)} ${round(midX)} ${round(y0 + leafH * 0.13)}" fill="none" stroke="${LINE}" stroke-width="1" opacity="0.55" vector-effect="non-scaling-stroke"/>`,
    );
  }
  // Pressing pin marks (corners of silhouette field).
  for (const [px, py] of [
    [leafX + 8, leafY + 8],
    [leafX + leafW - 20, leafY + 8],
    [leafX + 8, leafY + leafH - 16],
    [leafX + leafW - 20, leafY + leafH - 16],
  ] as const) {
    parts.push(`<circle cx="${round(px)}" cy="${round(py)}" r="2.5" fill="none" stroke="${ACCENT}" stroke-width="1"/>`);
  }
  // Pressing blot — unreplicable herbarium craft (theme packs do not invent a blot + pin register).
  parts.push(
    `<ellipse cx="${round(midX + leafW * 0.08)}" cy="${round(midY + leafH * 0.12)}" rx="22" ry="14" fill="${ACCENT_FIELD}" opacity="0.35"/>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(midX + leafW * 0.08)}" y="${round(midY + leafH * 0.12 + 3)}" font-size="11" fill="var(--surface-quiet)" text-anchor="middle">Blot</text>`,
  );

  // Photo voucher window on the right.
  const winX = leafX + leafW + 16;
  const winY = leafY + 12;
  const winW = W - padX - 16 - winX;
  const winH = leafH * 0.62;
  const clipId = "spec-photo-clip";
  parts.push(`<defs><clipPath id="${clipId}"><rect x="${round(winX)}" y="${round(winY)}" width="${round(winW)}" height="${round(winH)}"/></clipPath></defs>`);
  parts.push(
    `<image href="${photos[0]}" x="${round(winX)}" y="${round(winY)}" width="${round(winW)}" height="${round(winH)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" opacity="0.94"/>`,
  );
  parts.push(
    `<rect x="${round(winX)}" y="${round(winY)}" width="${round(winW)}" height="${round(winH)}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(winX + 8)}" y="${round(winY + 16)}" font-size="11" fill="var(--surface-quiet)">Plate A</text>`,
  );

  // Feature callouts under photo — sparse mono.
  const base = features.length ? features : [{ title: "Trait", body: "", meta: "01" } as Block];
  const callTop = winY + winH + 18;
  for (let i = 0; i < Math.min(3, base.length); i += 1) {
    const y = callTop + i * 22;
    const f = base[i]!;
    parts.push(
      `<text class="ds-fig-mono" x="${round(winX + 8)}" y="${round(y)}" font-size="11" fill="var(--surface-quiet)">${String(i + 1).padStart(2, "0")}</text>`,
    );
    parts.push(
      `<text class="ds-fig-mono" x="${round(winX + 36)}" y="${round(y)}" font-size="11" fill="var(--surface-muted)">${esc(clip(f.title, 22))}</text>`,
    );
    // Tiny secondary photo chips for remaining stock — ink without card collage.
    if (i > 0 && photos[i]) {
      const chip = 28;
      const cx = winX + winW - chip - 6;
      const cy = callTop + (i - 1) * (chip + 6);
      const cid = `spec-chip-${i}`;
      parts.push(`<defs><clipPath id="${cid}"><rect x="${round(cx)}" y="${round(cy)}" width="${chip}" height="${chip}"/></clipPath></defs>`);
      parts.push(
        `<image href="${photos[i]}" x="${round(cx)}" y="${round(cy)}" width="${chip}" height="${chip}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})" opacity="0.85"/>`,
      );
      parts.push(
        `<rect x="${round(cx)}" y="${round(cy)}" width="${chip}" height="${chip}" fill="none" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
      );
    }
  }

  // Range ticks under leaf.
  const rangeY = leafY + leafH - 4;
  for (let i = 0; i < 6; i += 1) {
    const x = leafX + 20 + (i / 5) * (leafW - 40);
    parts.push(
      `<line x1="${round(x)}" y1="${round(rangeY)}" x2="${round(x)}" y2="${round(rangeY + 8)}" stroke="${LINE}" stroke-width="1" vector-effect="non-scaling-stroke"/>`,
    );
  }
  parts.push(
    `<text class="ds-fig-mono" x="${round(leafX + 20)}" y="${round(rangeY + 20)}" font-size="11" fill="var(--surface-quiet)">Range · W → E</text>`,
  );

  parts.push(
    `<text class="ds-fig-mono" x="${round(padX + 10)}" y="${round(H - padY + 12)}" font-size="11" fill="var(--surface-quiet)">${esc(clip(productName, 24))} · specimen plate</text>`,
  );
  parts.push(
    `<text class="ds-fig-mono" x="${round(W - padX - 10)}" y="${round(H - padY + 12)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">free botanical stock</text>`,
  );

  return frame(parts.join(""), {
    width: W,
    height: H,
    kind: "specimen-plate",
    label: `${productName} specimen plate`,
    inset: role === "band" ? BLEED_INSET : 0,
  });
}

/**
 * One letterform drawn as strokes rather than typeset. Not a typeface — a construction, the way a
 * mark is drawn before it is drawn properly: stems on the vertical, a shoulder or a bowl where the
 * letter needs one, a diagonal where it needs that instead.
 */
function constructedGlyph(ch: string, x: number, y: number, w: number, h: number): string {
  const S = `stroke="var(--c-border-strong)" stroke-width="1.5" fill="none" stroke-linecap="square"`;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ${S}/>`;
  const arc = (x1: number, y1: number, x2: number, y2: number, rad: number, sweep = 1) =>
    `<path d="M ${round(x1)} ${round(y1)} A ${round(rad)} ${round(rad)} 0 0 ${sweep} ${round(x2)} ${round(y2)}" ${S}/>`;

  const l = x;
  const rt = x + w;
  const t = y;
  const b = y + h;
  const mid = y + h / 2;
  const half = w / 2;

  switch (ch) {
    case "A":
      return line(l, b, x + half, t) + line(x + half, t, rt, b) + line(l + w * 0.22, mid + h * 0.18, rt - w * 0.22, mid + h * 0.18);
    case "B":
      return line(l, t, l, b) + line(l, t, x + w * 0.6, t) + arc(x + w * 0.6, t, x + w * 0.6, mid, h / 4) +
        line(l, mid, x + w * 0.6, mid) + arc(x + w * 0.6, mid, x + w * 0.6, b, h / 4) + line(l, b, x + w * 0.6, b);
    case "C":
      return arc(rt, t + h * 0.2, rt, b - h * 0.2, h / 2, 0);
    case "D":
      return line(l, t, l, b) + line(l, t, x + w * 0.45, t) + arc(x + w * 0.45, t, x + w * 0.45, b, h / 2) + line(l, b, x + w * 0.45, b);
    case "E":
      return line(l, t, l, b) + line(l, t, rt, t) + line(l, mid, rt - w * 0.2, mid) + line(l, b, rt, b);
    case "F":
      return line(l, t, l, b) + line(l, t, rt, t) + line(l, mid, rt - w * 0.2, mid);
    case "G":
      return arc(rt, t + h * 0.2, rt, b - h * 0.2, h / 2, 0) + line(rt, mid, rt, b - h * 0.2) + line(x + half, mid, rt, mid);
    case "H":
      return line(l, t, l, b) + line(rt, t, rt, b) + line(l, mid, rt, mid);
    case "I":
      return line(x + half, t, x + half, b) + line(l, t, rt, t) + line(l, b, rt, b);
    case "J":
      return line(rt, t, rt, b - h * 0.2) + arc(rt, b - h * 0.2, l, b - h * 0.2, w / 2, 0);
    case "K":
      return line(l, t, l, b) + line(rt, t, l, mid) + line(l, mid, rt, b);
    case "L":
      return line(l, t, l, b) + line(l, b, rt, b);
    case "M":
      return line(l, b, l, t) + line(l, t, x + half, mid) + line(x + half, mid, rt, t) + line(rt, t, rt, b);
    case "N":
      return line(l, b, l, t) + line(l, t, rt, b) + line(rt, b, rt, t);
    case "O":
    case "Q":
      return arc(x + half, t, x + half, b, h / 2) + arc(x + half, b, x + half, t, h / 2) +
        (ch === "Q" ? line(x + half, mid + h * 0.14, rt, b) : "");
    case "P":
      return line(l, t, l, b) + line(l, t, x + w * 0.6, t) + arc(x + w * 0.6, t, x + w * 0.6, mid, h / 4) + line(l, mid, x + w * 0.6, mid);
    case "R":
      return line(l, t, l, b) + line(l, t, x + w * 0.6, t) + arc(x + w * 0.6, t, x + w * 0.6, mid, h / 4) +
        line(l, mid, x + w * 0.6, mid) + line(x + w * 0.45, mid, rt, b);
    case "S":
      return arc(rt, t + h * 0.18, l, mid, h / 3.4, 0) + arc(l, mid, rt, b - h * 0.18, h / 3.4, 0);
    case "T":
      return line(l, t, rt, t) + line(x + half, t, x + half, b);
    case "U":
      return line(l, t, l, b - h * 0.22) + arc(l, b - h * 0.22, rt, b - h * 0.22, w / 2, 0) + line(rt, t, rt, b - h * 0.22);
    case "V":
      return line(l, t, x + half, b) + line(x + half, b, rt, t);
    case "W":
      return line(l, t, x + w * 0.28, b) + line(x + w * 0.28, b, x + half, mid) +
        line(x + half, mid, rt - w * 0.28, b) + line(rt - w * 0.28, b, rt, t);
    case "X":
      return line(l, t, rt, b) + line(rt, t, l, b);
    case "Y":
      return line(l, t, x + half, mid) + line(rt, t, x + half, mid) + line(x + half, mid, x + half, b);
    case "Z":
      return line(l, t, rt, t) + line(rt, t, l, b) + line(l, b, rt, b);
    default:
      // Ampersands, digits, anything else: a bracket, which is what a construction sheet uses for
      // a character it has not drawn yet.
      return line(x + w * 0.3, t, l, t) + line(l, t, l, b) + line(l, b, x + w * 0.3, b) +
        line(rt - w * 0.3, t, rt, t) + line(rt, t, rt, b) + line(rt, b, rt - w * 0.3, b);
  }
}

/* ------------------------------------------------------------------ */
/* lattice — texture, not decoration                                   */
/* ------------------------------------------------------------------ */

/**
 * A field of hairlines behind a quiet band. Its only job is to stop a full-screen statement from
 * being an empty rectangle; it carries no information and is hidden from assistive technology.
 */
export function latticeField(seed: string): string {
  const W = 720;
  const H = 280;
  const r = rng(`${seed}:lattice`);
  const parts: string[] = [];
  const cols = 12;
  const step = W / cols;
  // Verticals carry the field on their own. The horizontals turned it into graph paper, and four
  // screen-wide hairlines behind a sentence is a quarter of a page's whole rule budget spent on a
  // texture the reader is not meant to look at.
  for (let i = 1; i < cols; i += 1) {
    parts.push(`<line x1="${round(i * step)}" y1="0" x2="${round(i * step)}" y2="${H}" stroke="${LINE}" stroke-width="1" opacity="${round(0.3 + r() * 0.5)}"/>`);
  }
  // A handful of marked intersections, so the field reads as a plotted grid rather than graph paper.
  for (let i = 0; i < 7; i += 1) {
    const cx = Math.round(1 + r() * (cols - 2)) * step;
    const cy = Math.round(1 + r() * 3) * (H / 5);
    parts.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="2.5" fill="${i === 3 ? ACCENT : LINE}"/>`);
  }
  // The field is a surface, not a picture: it fills the band it sits behind rather than floating a
  // fixed proportion in the middle of it with unpainted screen above and below.
  return frame(parts.join(""), { width: W, height: H, kind: "lattice", stretch: true });
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

export interface FigurePlan {
  /** Drawn in the fold — beside the copy on a split, or spanning the screen beneath it. */
  hero: string;
  /** True when the fold figure spans the viewport rather than sitting in a column. */
  heroSpans: boolean;
  /** Drawn once in the body, in whichever section owns the explanation. */
  body: string;
  /** The full-bleed specimen band: one drawing given a screen and a single line of caption. */
  band: string;
  /** Texture for the quiet full-screen band. */
  field: string;
  /** The mark behind the closing decision. */
  closing: string;
  /** One small schematic per capability, in catalogue order. */
  marks: string[];
  /** One reading shape per stated outcome, in metric order. */
  sparks: string[];
}

type Kind =
  | "interface"
  | "series"
  | "flow"
  | "stack"
  | "horizon"
  | "type-ladder"
  | "dossier-plate"
  | "signal-lattice"
  | "index-ledger"
  | "loom-weave"
  | "specimen-plate"
  | "press-sheet"
  | "path-plate"
  | "pipeline-board"
  | "queue-console"
  | "posture-grid"
  | "mechanism-plate"
  | "wire-ledger";

/**
 * Which drawing goes where.
 *
 * The kind is a content decision, not a style one: a product with an interface shows the interface,
 * an argument about outcomes plots them, a sequence is drawn as stages, a scope is stacked, and a
 * long-hold thesis gets a horizon. The order below is per site kind, and the three big slots — the
 * fold, the body, the specimen band — take the first three that can actually be drawn from this
 * brief. No kind is used twice on a page; repeating a diagram is the same failure as repeating a
 * paragraph.
 */
const ORDER: Record<string, Kind[]> = {
  "dashboard-webapp": ["series", "flow", "stack", "interface"],
  "corporate-story": ["horizon", "stack", "series", "flow"],
  // Educational: layer stack owns the fold (mechanism), flow stays in body — never twin studio's flow hero.
  "docs-educational": ["stack", "flow", "interface", "series"],
  // SaaS: product surface on the fold; series as specimen — not the same band stack as fintech.
  "saas-marketing": ["interface", "series", "flow", "stack"],
  // Fintech: horizon cash timeline on the fold (always drawable); interface is the working surface in body.
  // Series is preferred when metrics carry readings, but must not fall through to twin SaaS interface hero.
  "fintech-marketing": ["horizon", "series", "interface", "flow"],
  // Studio: filled flow stages on the fold (selected-work method) — not twin corporate/fintech horizon
  // or educational stack. Horizon stays available as a quieter specimen beat.
  "art-directed-studio": ["flow", "horizon", "stack", "series"],
  // Consumer craft is product-surface first; horizon specimen stays type-quiet for rhythm.
  "consumer-craft": ["interface", "horizon", "flow", "stack"],
  // Foundry: optical-size ladder owns the fold; horizon/stack keep scroll beats distinct.
  "editorial-foundry": ["type-ladder", "horizon", "stack", "flow"],
  // Dossier: cartographic plate owns the fold; denser stack specimen keeps ink-variation honest.
  "research-dossier": ["dossier-plate", "stack", "horizon", "flow"],
  // Observatory: signal lattice owns the fold; denser stack specimen keeps ink-variation honest.
  "signal-observatory": ["signal-lattice", "stack", "horizon", "flow"],
  // Archive: ledger owns the fold; horizon specimen stays rule-light (stack was flooding rules/screen).
  "archive-index": ["index-ledger", "horizon", "flow", "stack"],
  // Commerce loom: weave owns the fold; horizon specimen stays quiet vs soft card grids.
  "commerce-loom": ["loom-weave", "horizon", "flow", "stack"],
  // Field guide: specimen plate owns the fold; horizon keeps scroll rhythm.
  "field-guide": ["specimen-plate", "horizon", "flow", "stack"],
  "press-atelier": ["press-sheet", "flow", "stack", "horizon"],
  // Lantern path: night cartograph owns the fold; horizon keeps scroll rhythm.
  "lantern-path": ["path-plate", "horizon", "flow", "stack"],
};

export function planFigures(input: {
  productName: string;
  siteKind: string;
  /** A split fold has a column to fill; every other fold is spanned by its figure. */
  heroLayout: string;
  /** The page renders a working application shell, so it must not also draw a schematic of one. */
  hasAppShell: boolean;
  features: Block[];
  steps: Block[];
  metrics: MetricSpec[];
}): FigurePlan {
  const seed = input.productName;
  const periods = ["Q1", "Q2", "Q3", "Q4"];
  /*
   * Figure legends are often title+ordinal only (scrub labels). Flow/stack/horizon bands still need
   * real matter under each stage — merge catalogue bodies by title so cards never ship empty.
   */
  const byTitle = new Map(input.features.map((b) => [b.title, b] as const));
  const fillMatter = (steps: Block[]): Block[] =>
    steps.map((s) => {
      const f = byTitle.get(s.title);
      if (!f) return s;
      const body = (s.body && s.body.trim()) || f.body || "";
      const points = s.points?.length ? s.points : f.points ?? [];
      return body === s.body && points === s.points ? s : { ...s, body, points };
    });
  const sequence =
    input.steps.length >= 2 ? fillMatter(input.steps) : fillMatter(input.features);

  const draw = (kind: Kind, role: FigureRole): string => {
    switch (kind) {
      case "interface":
        return interfacePlate(input.productName, input.features, seed, role);
      case "series":
        return seriesChart(readings[0]?.label ?? "Measured outcome", periods, seed, role);
      case "flow":
        return flowDiagram(sequence, seed, role);
      case "stack":
        return stackDiagram(input.features, seed, role);
      case "horizon":
        return horizonPlot(sequence, seed, role);
      case "type-ladder":
        return typeLadder(input.productName, input.features, seed, role);
      case "dossier-plate":
        return dossierPlate(input.productName, input.features, seed, role);
      case "signal-lattice":
        return signalLattice(input.productName, input.features, seed, role);
      case "index-ledger":
        return indexLedger(input.productName, input.features, seed, role);
      case "loom-weave":
        return loomWeave(input.productName, input.features, seed, role);
      case "specimen-plate":
        return specimenPlate(input.productName, input.features, seed, role);
      case "press-sheet":
        return pressSheet(input.productName, input.features, seed, role);
      case "path-plate":
        return pathPlate(input.productName, input.features, seed, role);
      case "pipeline-board":
        return pipelineBoard(input.productName, input.features, seed, role);
      case "queue-console":
        return queueConsole(input.productName, input.features, seed, role);
      case "posture-grid":
        return postureGrid(input.productName, input.features, seed, role);
      case "mechanism-plate":
        return mechanismPlate(input.productName, input.features, seed, role);
      case "wire-ledger":
        return wireLedger(input.productName, input.features, seed, role);
      default:
        return "";
    }
  };

  /*
   * Kinds have a proportion, and a slot has a shape. A sequence drawn as four stages is three times
   * as wide as it is tall; dropped into half a fold it renders at a sixth of the area it needs and
   * its labels go under seven pixels. So the slot picks from the kinds that can hold its shape,
   * and only falls back to the site kind's order when none can.
   */
  const SPANNING: Kind[] = ["path-plate", "press-sheet", "specimen-plate", "loom-weave", "index-ledger", "signal-lattice", "dossier-plate", "type-ladder", "flow", "horizon", "series", "interface", "stack"];
  const COLUMNAR: Kind[] = ["path-plate", "press-sheet", "specimen-plate", "loom-weave", "index-ledger", "signal-lattice", "dossier-plate", "type-ladder", "interface", "stack", "series"];

  const heroSpans = input.heroLayout !== "hero-split";
  /*
   * Which drawings this brief can honestly support.
   *
   * A plotted series needs a reading to plot; without one the kind is unavailable and the slot
   * falls through. A page that renders its application shell already shows the interface, so a
   * schematic of an interface set on the same page is the same diagram twice with different line
   * weights. Both are content decisions and both are made here, once, rather than being encoded in
   * the per-site-kind ordering where they were previously only implied.
   */
  const readings = input.metrics.filter((m) => isReading(m.value));
  const order = (ORDER[input.siteKind] ?? ORDER["saas-marketing"]!).filter((k) => {
    if (k === "series") return readings.length > 0;
    if (k === "interface") return !input.hasAppShell;
    return true;
  });
  const shaped = (pool: Kind[], from: Kind[]): Kind | undefined => from.find((k) => pool.includes(k));

  // Foundry hard-seam fold: the ladder always owns the inverse column — never fall through to a plate.
  // Dossier folio fold: the cartographic plate always owns the spanning field.
  // Observatory chrono fold: the signal lattice always owns the spanning field.
  // Archive register fold: the index ledger always owns the spanning field.
  // Commerce loom fold: the warp/weft weave always owns the spanning field.
  // Field guide fold: the specimen plate always owns the spanning field.
  const heroKind =
    input.siteKind === "editorial-foundry"
      ? ("type-ladder" as Kind)
      : input.siteKind === "research-dossier"
        ? ("dossier-plate" as Kind)
        : input.siteKind === "signal-observatory"
          ? ("signal-lattice" as Kind)
          : input.siteKind === "archive-index"
            ? ("index-ledger" as Kind)
            : input.siteKind === "commerce-loom"
              ? ("loom-weave" as Kind)
              : input.siteKind === "field-guide"
                ? ("specimen-plate" as Kind)
            : input.siteKind === "press-atelier"
              ? ("press-sheet" as Kind)
            : input.siteKind === "lantern-path"
              ? ("path-plate" as Kind)
            : input.siteKind === "saas-marketing"
              ? ("pipeline-board" as Kind)
            : input.siteKind === "dashboard-webapp"
              ? ("queue-console" as Kind)
            : input.siteKind === "corporate-story"
              ? ("posture-grid" as Kind)
            : input.siteKind === "docs-educational"
              ? ("mechanism-plate" as Kind)
            : input.siteKind === "fintech-marketing"
              ? ("wire-ledger" as Kind)
      : shaped(heroSpans ? SPANNING : COLUMNAR, order) ?? order[0]!;
  const afterHero = order.filter((k) => k !== heroKind);
  const bandKind = shaped(SPANNING, afterHero);
  const remaining = afterHero.filter((k) => k !== bandKind);
  const bodyKind = shaped(COLUMNAR, remaining) ?? remaining[0];

  // Seam + first-five marketing folds draw the instrument as a column (half viewport),
  // never a full-bleed band parked under a tall left-only claim.
  const columnFold = new Set([
    "hero-seam",
    "hero-pipeline",
    "hero-diligence",
    "hero-queue",
    "hero-wire",
    "hero-mechanism",
  ]);
  const heroRole: FigureRole = columnFold.has(input.heroLayout)
    ? "column"
    : heroSpans
      ? "band"
      : "column";
  const hero = draw(heroKind, heroRole);
  const body = bodyKind ? draw(bodyKind, "plate") : "";
  const band = bandKind ? draw(bandKind, "band") : "";

  return {
    hero,
    heroSpans,
    body,
    band,
    field: latticeField(seed),
    closing: signatureMark(input.productName, seed),
    marks: input.features.map((b, i) => capabilityMark(b, i, seed)),
    sparks: input.metrics.map((_, i) => metricSpark(i, seed)),
  };
}
