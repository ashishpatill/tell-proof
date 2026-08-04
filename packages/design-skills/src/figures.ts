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

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

export type FigureKind = "interface" | "series" | "flow" | "stack" | "horizon" | "lattice";

interface FrameOptions {
  /** Named for a screen reader; omit to mark the figure decorative. */
  label?: string;
  width: number;
  height: number;
  kind: FigureKind;
}

/**
 * A figure without a label is decorative and must be hidden, because a diagram that restates the
 * paragraph beside it is noise in a screen reader even when it is the point on screen.
 */
function frame(body: string, o: FrameOptions): string {
  const a11y = o.label
    ? ` role="img" aria-label="${esc(o.label)}"`
    : ` role="presentation" aria-hidden="true" focusable="false"`;
  return `<svg class="ds-fig" data-figure="${o.kind}" viewBox="0 0 ${o.width} ${o.height}" preserveAspectRatio="xMidYMid meet"${a11y}>${body}</svg>`;
}

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
    `font-size="${opts.size ?? 13}"`,
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
export function interfacePlate(productName: string, rows: Block[], seed: string): string {
  const W = 560;
  const H = 404;
  const railW = 150;
  const r = rng(`${seed}:interface`);
  const items = rows.slice(0, 5);
  if (!items.length) return "";

  const parts: string[] = [];
  parts.push(box(0.5, 0.5, W - 1, H - 1, { r: 10, fill: PAPER, stroke: LINE }));

  // Chrome
  parts.push(rule(0, 40, W, 40));
  for (let i = 0; i < 3; i += 1) {
    parts.push(`<circle cx="${20 + i * 13}" cy="20" r="3" fill="${LINE}"/>`);
  }
  parts.push(text(clip(productName, 22), 70, 24.5, { size: 11, fill: QUIET, mono: true }));

  // Rail
  parts.push(rule(railW, 40, railW, H));
  parts.push(text("Views", 20, 66, { size: 10, fill: QUIET, mono: true, track: 0.8 }));
  items.forEach((b, i) => {
    const y = 84 + i * 30;
    if (i === 0) {
      parts.push(box(12, y - 13, railW - 24, 24, { r: 5, fill: ACCENT_FIELD }));
      parts.push(`<rect x="12" y="${y - 13}" width="2" height="24" fill="${ACCENT}"/>`);
    }
    parts.push(text(clip(b.title, 17), 22, y + 4, { size: 11.5, fill: i === 0 ? INK : BODY }));
  });

  // Table
  const tx = railW + 24;
  const tw = W - tx - 24;
  parts.push(text(clip(items[0]!.title, 30), tx, 72, { size: 15, fill: INK, weight: 600 }));
  parts.push(text("Live", W - 24, 70, { size: 10, fill: QUIET, mono: true, anchor: "end", track: 0.6 }));
  parts.push(rule(tx, 88, W - 24, 88));

  const cols = ["Item", "State"];
  parts.push(text(cols[0]!, tx, 106, { size: 10, fill: QUIET, mono: true, track: 0.8 }));
  parts.push(text(cols[1]!, W - 24, 106, { size: 10, fill: QUIET, mono: true, anchor: "end", track: 0.8 }));

  items.forEach((b, i) => {
    const y = 128 + i * 42;
    parts.push(rule(tx, y + 26, W - 24, y + 26));
    const lead = i === 1;
    if (lead) parts.push(box(tx - 10, y - 12, tw + 20, 38, { r: 6, fill: ACCENT_FIELD }));
    parts.push(`<circle cx="${tx + 5}" cy="${y + 3}" r="3" fill="${lead ? ACCENT : LINE}"/>`);
    parts.push(text(clip(b.title, 26), tx + 18, y + 7, { size: 12, fill: lead ? INK : BODY }));
    parts.push(
      text(b.meta ? clip(b.meta, 12) : `${Math.round(58 + r() * 40)}%`, W - 24, y + 7, {
        size: 11,
        fill: lead ? INK : QUIET,
        mono: true,
        anchor: "end",
      }),
    );
  });

  // One measured bar. A stack of them is a chart of nothing.
  const barY = 128 + items.length * 42 + 14;
  if (barY < H - 34) {
    parts.push(box(tx, barY, tw, 4, { r: 2, fill: LINE }));
    parts.push(box(tx, barY, tw * (0.52 + r() * 0.3), 4, { r: 2, fill: ACCENT }));
    parts.push(text("Coverage", tx, barY + 24, { size: 10, fill: QUIET, mono: true, track: 0.6 }));
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
export function seriesChart(label: string, periods: string[], seed: string): string {
  const W = 560;
  const H = 320;
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
    parts.push(text(`${100 - g * 30}`, left - 10, gy + 3.5, { size: 10, fill: QUIET, mono: true, anchor: "end" }));
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
    if (p) parts.push(text(clip(p, 9), x(i), bottom + 18, { size: 10, fill: QUIET, mono: true, anchor: i === 0 ? "start" : "middle" }));
  }
  parts.push(text(clip(label, 42), left, 14, { size: 11, fill: BODY }));

  return frame(parts.join(""), { width: W, height: H, kind: "series", label: `${label} — illustrative series` });
}

/* ------------------------------------------------------------------ */
/* flow — the sequence, as stages                                      */
/* ------------------------------------------------------------------ */

/** The steps of the argument as connected stages, numbered, with the pivot marked. */
export function flowDiagram(steps: Block[], seed: string): string {
  const items = steps.slice(0, 4);
  if (items.length < 2) return "";
  const W = 720;
  const H = 216;
  const gap = 26;
  const nodeW = (W - 8 - gap * (items.length - 1)) / items.length;
  const top = 44;
  const nodeH = 104;
  const pivot = Math.min(items.length - 1, 1);
  const parts: string[] = [];

  parts.push(text("Sequence", 4, 16, { size: 10, fill: QUIET, mono: true, track: 0.8 }));

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
    parts.push(text(String(i + 1).padStart(2, "0"), x + 16, top + 28, { size: 10, fill: lead ? ACCENT : QUIET, mono: true, track: 0.8 }));
    parts.push(text(clip(b.title, 20), x + 16, top + 56, { size: 14, fill: INK, weight: 600 }));
    if (b.meta) parts.push(text(clip(b.meta, 24), x + 16, top + 80, { size: 11, fill: QUIET, mono: true }));

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
  parts.push(text(clip(`${items.length} stages`, 20), 4, H - 6, { size: 10, fill: QUIET, mono: true, track: 0.6 }));
  void seed;
  return frame(parts.join(""), { width: W, height: H, kind: "flow", label: `Sequence: ${items.map((b) => b.title).join(", ")}` });
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
    parts.push(text(clip(b.title, 30), spine + 32, y + rowH / 2 + 1, { size: 13, fill: INK, weight: 600 }));
    if (b.meta) {
      parts.push(
        text(clip(b.meta, 16), spine + 16 + w - 14, y + rowH / 2 + 1, { size: 10, fill: QUIET, mono: true, anchor: "end", track: 0.6 }),
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
export function horizonPlot(marks: Block[], seed: string): string {
  const items = marks.slice(0, 4);
  if (items.length < 2) return "";
  const W = 720;
  const H = 208;
  const left = 8;
  const right = W - 8;
  const axis = 132;
  const r = rng(`${seed}:horizon`);
  const parts: string[] = [];

  parts.push(rule(left, axis, right, axis));
  items.forEach((b, i) => {
    // Compressed near, generous far — the shape of the claim, not an even ruler.
    const t = (i / (items.length - 1)) ** 0.72;
    const x = left + t * (right - left - 8);
    const up = i % 2 === 0;
    const h = 34 + r() * 30;
    const ty = up ? axis - h : axis + h;
    parts.push(rule(x, axis, x, ty));
    parts.push(`<circle cx="${round(x)}" cy="${axis}" r="4" fill="${i === items.length - 1 ? ACCENT : PAPER}" stroke="${i === items.length - 1 ? ACCENT : LINE}" stroke-width="1.5"/>`);
    const anchor = i === items.length - 1 ? "end" : "start";
    const tx = anchor === "end" ? x - 6 : x + 8;
    parts.push(text(clip(b.title, 24), tx, up ? ty - 8 : ty + 16, { size: 13, fill: INK, weight: 600, anchor }));
    if (b.meta) {
      parts.push(text(clip(b.meta, 18), tx, up ? ty + 8 : ty - 6, { size: 10, fill: QUIET, mono: true, anchor, track: 0.6 }));
    }
  });

  return frame(parts.join(""), { width: W, height: H, kind: "horizon", label: `Horizon: ${items.map((b) => b.title).join(", ")}` });
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
  return frame(parts.join(""), { width: W, height: H, kind: "lattice" });
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

export interface FigurePlan {
  /** Drawn beside the fold copy. */
  hero: string;
  /** Drawn once in the body, in whichever section owns the explanation. */
  body: string;
  /** Texture for the quiet full-screen band. */
  field: string;
}

/**
 * Which figure a page gets is a content decision, not a style one: a product with an interface
 * shows the interface, an argument about outcomes plots them, a sequence is drawn as stages, and a
 * long-hold thesis gets a horizon. Each kind appears at most once per page — repeating a diagram is
 * the same failure as repeating a paragraph.
 */
export function planFigures(input: {
  productName: string;
  siteKind: string;
  features: Block[];
  steps: Block[];
  metrics: MetricSpec[];
}): FigurePlan {
  const seed = input.productName;
  const periods = ["Q1", "Q2", "Q3", "Q4"];
  const plate = () => interfacePlate(input.productName, input.features, seed);
  const chart = () => seriesChart(input.metrics[0]?.label ?? "Measured outcome", periods, seed);
  const flow = () => flowDiagram(input.steps.length >= 2 ? input.steps : input.features, seed);
  const stack = () => stackDiagram(input.features, seed);
  const horizon = () => horizonPlot(input.steps.length >= 2 ? input.steps : input.features, seed);

  switch (input.siteKind) {
    case "dashboard-webapp":
      return { hero: chart(), body: plate(), field: latticeField(seed) };
    case "corporate-story":
      return { hero: horizon(), body: stack(), field: latticeField(seed) };
    case "docs-educational":
      return { hero: flow(), body: plate(), field: latticeField(seed) };
    default:
      return { hero: plate(), body: flow(), field: latticeField(seed) };
  }
}
