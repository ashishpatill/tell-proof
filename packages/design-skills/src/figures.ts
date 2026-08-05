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
  | "signature";

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
    parts.push(rule(tx, y + 26, W - 24, y + 26));
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
  const H = role === "band" ? 340 : 320;
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
  for (let g = 0; g <= 3; g += 1) {
    const gy = top + ((bottom - top) / 3) * g;
    parts.push(rule(left, gy, right, gy));
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
   * Every stage is drawn to the same height, set by the wordiest one, because stages of different
   * heights in a row read as a broken grid rather than as a sequence.
   *
   * Most sequences have no prose to give: the copy allocator states each claim exactly once, and it
   * states it where the capability is explained, not again in the diagram. A stage that is only a
   * name is drawn as a name — set large, with its ordinal set larger — rather than as a title over
   * two hundred units of reserved emptiness, which is what a card with a rule and nothing under it
   * looks like at reading size.
   */
  const cols = Math.max(18, Math.round(nodeW / 6.6));
  const detail = items.map((b) => {
    if (!band) return [] as string[];
    const points = b.points.slice(0, 2).map((p) => clip(p, cols));
    return points.length ? points : wrap(b.body ?? "", cols, 3);
  });
  const lines = Math.max(...detail.map((d) => d.length), 0);
  const typeLed = band && lines === 0;
  const nodeH = band ? (typeLed ? 252 : 118 + lines * 21 + 30) : 104;
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

    if (typeLed) {
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
      parts.push(text(clip(b.title, band ? 26 : 20), x + 16, top + (band ? 66 : 56), { size: band ? FT.title : FT.small, fill: INK, weight: 600 }));
      if (b.meta) parts.push(text(clip(b.meta, 24), x + 16, top + (band ? 92 : 80), { size: FT.micro, fill: QUIET, mono: true }));
    }

    if (band && !typeLed) {
      parts.push(rule(x + 16, top + 106, x + nodeW - 16, top + 106));
      detail[i]!.forEach((p, j) => {
        parts.push(text(p, x + 16, top + 128 + j * 21, { size: FT.small, fill: BODY }));
      });
      const meterY = top + nodeH - 22;
      const meterW = nodeW - 32;
      parts.push(box(x + 16, meterY, meterW, 3, { r: 2, fill: LINE }));
      parts.push(box(x + 16, meterY, meterW * ((i + 1) / items.length), 3, { r: 2, fill: lead ? ACCENT : "var(--c-border-strong)" }));
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
export function stackDiagram(layers: Block[], seed: string): string {
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
  const H = band ? 320 : 208;
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
  const W = 168;
  const H = 96;
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

  // Construction grid — the lines a mark is drawn against.
  for (let i = 1; i < 10; i += 1) {
    parts.push(`<line x1="${round((W / 10) * i)}" y1="0" x2="${round((W / 10) * i)}" y2="${H}" stroke="${LINE}" stroke-width="1" opacity="${round(0.25 + r() * 0.35)}"/>`);
  }
  for (let i = 1; i < 4; i += 1) {
    parts.push(`<line x1="0" y1="${round((H / 4) * i)}" x2="${W}" y2="${round((H / 4) * i)}" stroke="${LINE}" stroke-width="1" opacity="0.3"/>`);
  }
  const cx = W * 0.5;
  const cy = H * 0.52;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${round(H * 0.4)}" fill="none" stroke="${LINE}" stroke-width="1"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${round(H * 0.28)}" fill="none" stroke="${LINE}" stroke-width="1"/>`);
  parts.push(rule(cx - H * 0.4, cy, cx + H * 0.4, cy));

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
  for (let i = 1; i < cols; i += 1) {
    parts.push(`<line x1="${round(i * step)}" y1="0" x2="${round(i * step)}" y2="${H}" stroke="${LINE}" stroke-width="1" opacity="${round(0.3 + r() * 0.5)}"/>`);
  }
  for (let i = 1; i < 5; i += 1) {
    const y = (H / 5) * i;
    parts.push(`<line x1="0" y1="${round(y)}" x2="${W}" y2="${round(y)}" stroke="${LINE}" stroke-width="1" opacity="0.4"/>`);
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

type Kind = "interface" | "series" | "flow" | "stack" | "horizon";

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
  // A page with an application shell already shows the interface, rendered rather than drawn. A
  // schematic of an interface set inside one is the same diagram twice with different line weights.
  "dashboard-webapp": ["series", "flow", "stack", "interface"],
  "corporate-story": ["horizon", "stack", "series", "flow"],
  "docs-educational": ["flow", "interface", "stack", "series"],
  "saas-marketing": ["interface", "flow", "series", "stack"],
};

export function planFigures(input: {
  productName: string;
  siteKind: string;
  /** A split fold has a column to fill; every other fold is spanned by its figure. */
  heroLayout: string;
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
        return seriesChart(input.metrics[0]?.label ?? "Measured outcome", periods, seed, role);
      case "flow":
        return flowDiagram(sequence, seed, role);
      case "stack":
        return stackDiagram(input.features, seed);
      case "horizon":
        return horizonPlot(sequence, seed, role);
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
  const SPANNING: Kind[] = ["flow", "horizon", "series"];
  const COLUMNAR: Kind[] = ["interface", "stack"];

  const heroSpans = input.heroLayout !== "hero-split";
  const order = ORDER[input.siteKind] ?? ORDER["saas-marketing"]!;
  const shaped = (pool: Kind[], from: Kind[]): Kind | undefined => from.find((k) => pool.includes(k));

  const heroKind = shaped(heroSpans ? SPANNING : COLUMNAR, order) ?? order[0]!;
  const afterHero = order.filter((k) => k !== heroKind);
  const bandKind = shaped(SPANNING, afterHero);
  const remaining = afterHero.filter((k) => k !== bandKind);
  const bodyKind = shaped(COLUMNAR, remaining) ?? remaining[0];

  const hero = draw(heroKind, heroSpans ? "band" : "column");
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
