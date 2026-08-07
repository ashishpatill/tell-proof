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
  | "index-ledger";

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
  return `<svg class="ds-fig" data-figure="${o.kind}" viewBox="${box}" preserveAspectRatio="${par}"${a11y}>${body}</svg>`;
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
const FT = { micro: 10, small: 12, body: 15, title: 19, lead: 26, ordinal: 40 } as const;

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
  const attrs = [
    `x="${round(x)}"`,
    `y="${round(y)}"`,
    `font-size="${opts.size ?? FT.small}"`,
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
 * In band role this drawing is the whole screen, so the stages carry what the stage actually says
 * rather than a title over reserved empty space. The card height is measured from the copy each
 * stage has: a stage with two points is taller than a stage with none, and neither leaves a gap
 * where a reader expects something to be.
 */
export function flowDiagram(steps: Block[], seed: string, role: FigureRole = "plate"): string {
  const items = steps.slice(0, 4);
  if (items.length < 2) return "";
  const band = role === "band";
  const W = band ? 1200 : 720;
  const gap = band ? 40 : 26;
  const nodeW = (W - 8 - gap * (items.length - 1)) / items.length;
  const top = band ? 62 : 44;
  const pivot = Math.min(items.length - 1, 1);
  const parts: string[] = [];

  /*
   * Band role is the quiet screen — titles + ordinals only. Capability bodies in stage cards
   * flattened section-weight variation by filling the specimen beat with paragraph characters.
   * Plate role stays compact: name + meta, no body prose.
   */
  const nodeH = band ? 252 : 104;
  const H = band ? top + nodeH + 44 : 216;

  parts.push(text("Sequence", 4, 16, { size: FT.micro, fill: QUIET, mono: true, track: 0.8 }));

  items.forEach((b, i) => {
    const x = 4 + i * (nodeW + gap);
    const lead = i === pivot;
    parts.push(
      box(x + 0.5, top + 0.5, nodeW - 1, nodeH - 1, {
        r: 8,
        fill: lead ? ACCENT_FIELD : PAPER,
        stroke: lead ? "var(--c-accent-border)" : LINE,
      }),
    );

    if (band) {
      const nameLines = wrap(b.title, Math.max(9, Math.round(nodeW / 15)), 3);
      parts.push(text(String(i + 1).padStart(2, "0"), x + 24, top + 74, { size: FT.ordinal, fill: lead ? ACCENT : "var(--c-border-strong)", weight: 300 }));
      parts.push(rule(x + 24, top + 100, x + nodeW - 24, top + 100));
      nameLines.forEach((ln, j) => {
        parts.push(text(ln, x + 24, top + 140 + j * 30, { size: FT.lead, fill: INK, weight: 600 }));
      });
      if (b.meta) parts.push(text(clip(b.meta, 24), x + 24, top + nodeH - 30, { size: FT.micro, fill: QUIET, mono: true }));
      const meterY = top + nodeH - 18;
      const meterW = nodeW - 48;
      parts.push(box(x + 24, meterY, meterW, 3, { r: 2, fill: LINE }));
      parts.push(box(x + 24, meterY, meterW * ((i + 1) / items.length), 3, { r: 2, fill: lead ? ACCENT : "var(--c-border-strong)" }));
    } else {
      parts.push(text(String(i + 1).padStart(2, "0"), x + 16, top + 28, { size: FT.micro, fill: lead ? ACCENT : QUIET, mono: true, track: 0.8 }));
      parts.push(text(clip(b.title, 20), x + 16, top + 56, { size: FT.small, fill: INK, weight: 600 }));
      if (b.meta) parts.push(text(clip(b.meta, 24), x + 16, top + 80, { size: FT.micro, fill: QUIET, mono: true }));
    }

    if (i < items.length - 1) {
      const cx = x + nodeW;
      const cy = top + nodeH / 2;
      parts.push(rule(cx + 5, cy, cx + gap - 11, cy, LINE));
      parts.push(
        `<path d="M${round(cx + gap - 13)} ${cy - 3.5} L${round(cx + gap - 7)} ${cy} L${round(cx + gap - 13)} ${cy + 3.5}" fill="none" stroke="${LINE}" stroke-width="1"/>`,
      );
    }
  });

  parts.push(rule(4, H - 22, W - 4, H - 22));
  parts.push(text(clip(`${items.length} stages`, 20), 4, H - 6, { size: FT.micro, fill: QUIET, mono: true, track: 0.6 }));
  void seed;
  return frame(parts.join(""), { width: W, height: H, kind: "flow", inset: band ? BLEED_INSET : 0, label: `Sequence: ${items.map((b) => b.title).join(", ")}` });
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
        `<text class="ds-fig-mono" x="${round(W - padX)}" y="${round(labelY + 14)}" font-size="10" fill="var(--surface-muted)" text-anchor="end">${esc(clip(cut.title, 22))}</text>`,
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
    `<text class="ds-fig-mono" x="${round(padX + 28)}" y="${round(H - padY + 4)}" font-size="10" fill="var(--surface-quiet)">${esc(clip(productName, 28))} · optical sizes</text>`,
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
  const H = role === "band" ? 720 : role === "column" ? 520 : 480;
  const padX = role === "band" ? 48 : 28;
  const padY = role === "band" ? 40 : 28;
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
   * Density without rule flood: 2 cols × 5 rows (rules/screen ≤4.33) with TWO ink lines
   * per cell so voids never read empty. Extra stamps/watermarks add ink without hairlines.
   */
  const rowsPerCol = role === "band" ? 5 : 4;
  const rowH = gridH / rowsPerCol;

  for (let c = 0; c < cols; c += 1) {
    const x0 = padX + c * (colW + colGap);
    // Column letter marker
    const letter = letters[Math.min(c * 8, letters.length - 1)] ?? letters[c]!;
    parts.push(
      `<text class="ds-fig-mono" x="${round(x0 + 4)}" y="${round(gridTop - 4)}" font-size="11" fill="var(--c-accent)">${letter}</text>`,
    );
    // Vertical column rule (except first)
    if (c > 0) {
      parts.push(
        `<line x1="${round(x0 - colGap / 2)}" y1="${round(gridTop)}" x2="${round(x0 - colGap / 2)}" y2="${round(gridBottom)}" stroke="${LINE}" stroke-width="1" opacity="0.45" vector-effect="non-scaling-stroke"/>`,
      );
    }

    for (let row = 0; row < rowsPerCol; row += 1) {
      const y = gridTop + row * rowH;
      const entryIdx = c * rowsPerCol + row;
      const f = baseEntries[entryIdx % baseEntries.length]!;
      const ordinal = String(entryIdx + 1).padStart(3, "0");
      // Ruled row — one hairline per entry (no double underlines).
      parts.push(
        `<line x1="${round(x0)}" y1="${round(y + rowH)}" x2="${round(x0 + colW)}" y2="${round(y + rowH)}" stroke="${LINE}" stroke-width="1" opacity="${round(0.32 + (row % 3) * 0.1)}" vector-effect="non-scaling-stroke"/>`,
      );
      parts.push(
        `<text class="ds-fig-mono" x="${round(x0 + 4)}" y="${round(y + rowH * 0.38)}" font-size="11" fill="var(--surface-quiet)">${ordinal}</text>`,
      );
      const title = clip(f.title ?? `Entry ${ordinal}`, role === "band" ? 22 : 14);
      parts.push(
        `<text class="ds-fig-mono" x="${round(x0 + 40)}" y="${round(y + rowH * 0.38)}" font-size="11" fill="var(--surface-muted)">${esc(title)}</text>`,
      );
      // Second ink line — short meta only (never long body → mid-word ellipsis debris).
      const sub = clip(
        f.meta || f.kicker || `${letter}${row + 1} · ${ordinal}`,
        role === "band" ? 22 : 16,
      );
      parts.push(
        `<text class="ds-fig-mono" x="${round(x0 + 40)}" y="${round(y + rowH * 0.72)}" font-size="10" fill="var(--surface-quiet)">${esc(sub)}</text>`,
      );
      // Accent stamp — small filled mark, not an extra rule.
      if (row % 2 === 0) {
        parts.push(
          `<rect x="${round(x0 + colW - 10)}" y="${round(y + rowH * 0.28)}" width="5" height="5" fill="${ACCENT}" opacity="0.75"/>`,
        );
      }
      // Pale letter watermark in the cell — ink without hairline flood.
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

type Kind = "interface" | "series" | "flow" | "stack" | "horizon" | "type-ladder" | "dossier-plate" | "signal-lattice" | "index-ledger";

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
  "docs-educational": ["flow", "interface", "stack", "series"],
  "saas-marketing": ["interface", "flow", "series", "stack"],
  // Money products lead with the working surface and a plotted reading — fintech refs are figure-heavy.
  "fintech-marketing": ["interface", "series", "flow", "stack"],
  // Studio folds need a dense composed surface (flow), then a quieter horizon as specimen beat.
  "art-directed-studio": ["flow", "horizon", "stack", "series"],
  // Consumer craft is product-surface first; horizon specimen stays type-quiet for rhythm.
  "consumer-craft": ["interface", "horizon", "flow", "stack"],
  // Foundry: optical-size ladder owns the fold; horizon/stack keep scroll beats distinct.
  "editorial-foundry": ["type-ladder", "horizon", "stack", "flow"],
  // Dossier: cartographic plate owns the fold; denser stack specimen keeps ink-variation honest.
  "research-dossier": ["dossier-plate", "stack", "horizon", "flow"],
  // Observatory: signal lattice owns the fold; denser stack specimen keeps ink-variation honest.
  "signal-observatory": ["signal-lattice", "stack", "horizon", "flow"],
  // Archive: index ledger owns the fold; denser stack specimen keeps ink-variation honest.
  // Archive: ledger owns the fold; horizon specimen stays rule-light (stack was flooding rules/screen).
  "archive-index": ["index-ledger", "horizon", "flow", "stack"],
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
  const sequence = input.steps.length >= 2 ? input.steps : input.features;

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
  const SPANNING: Kind[] = ["index-ledger", "signal-lattice", "dossier-plate", "type-ladder", "flow", "horizon", "series", "interface", "stack"];
  const COLUMNAR: Kind[] = ["index-ledger", "signal-lattice", "dossier-plate", "type-ladder", "interface", "stack", "series"];

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
  const heroKind =
    input.siteKind === "editorial-foundry"
      ? ("type-ladder" as Kind)
      : input.siteKind === "research-dossier"
        ? ("dossier-plate" as Kind)
        : input.siteKind === "signal-observatory"
          ? ("signal-lattice" as Kind)
          : input.siteKind === "archive-index"
            ? ("index-ledger" as Kind)
      : shaped(heroSpans ? SPANNING : COLUMNAR, order) ?? order[0]!;
  const afterHero = order.filter((k) => k !== heroKind);
  const bandKind = shaped(SPANNING, afterHero);
  const remaining = afterHero.filter((k) => k !== bandKind);
  const bodyKind = shaped(COLUMNAR, remaining) ?? remaining[0];

  // Seam fold draws the ladder as a column (half viewport), not a full-bleed band.
  const heroRole: FigureRole =
    input.heroLayout === "hero-seam" ? "column" : heroSpans ? "band" : "column";
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
