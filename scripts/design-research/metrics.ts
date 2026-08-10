/**
 * Shared metric extraction for design research.
 *
 * The forensics probe emits a deep record per reference. Everything downstream — corpus
 * aggregation and self-critique — works on a flat `path -> number` map so that adding a probe
 * field automatically flows into the statistics and the craft-gap scorecard.
 */

export type FlatMetrics = Record<string, number>;

const SKIP_KEYS = new Set(["sizes", "stepRatios", "bands", "backgrounds", "textColors", "families", "topSizesByArea", "gaps", "sectionPaddingTop", "sectionPaddingBottom", "radii", "topEasings", "columnCounts", "ctaHeights"]);

function walk(node: unknown, prefix: string, out: FlatMetrics): void {
  if (node === null || node === undefined) return;
  if (typeof node === "number" && Number.isFinite(node)) {
    out[prefix] = node;
    return;
  }
  if (typeof node === "boolean") {
    out[prefix] = node ? 1 : 0;
    return;
  }
  if (Array.isArray(node)) {
    out[`${prefix}.count`] = node.length;
    return;
  }
  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (SKIP_KEYS.has(key)) {
        if (Array.isArray(value)) out[`${prefix}${prefix ? "." : ""}${key}.count`] = value.length;
        continue;
      }
      walk(value, `${prefix}${prefix ? "." : ""}${key}`, out);
    }
  }
}

export interface ForensicsView {
  viewport: string;
  loadMs?: number;
  paint?: Record<string, unknown>;
  network?: Record<string, unknown>;
  initial?: Record<string, unknown>;
  error?: string;
}

export interface ForensicsRecord {
  ref: string;
  category: string;
  role?: string | null;
  views: ForensicsView[];
}

/** Flatten one reference's desktop view into comparable numbers. */
export function flatten(record: ForensicsRecord, viewport = "desktop"): FlatMetrics {
  const view = record.views.find((v) => v.viewport === viewport);
  if (!view || !view.initial) return {};
  const out: FlatMetrics = {};
  walk(view.initial, "", out);
  if (typeof view.loadMs === "number") out["perf.loadMs"] = view.loadMs;
  walk(view.paint ?? {}, "perf", out);
  walk(view.network ?? {}, "net", out);
  // Derived ratios that matter more than either raw number alone.
  const sizes = (view.initial as { typography?: { sizes?: number[] } }).typography?.sizes;
  if (sizes && sizes.length > 1) {
    const first = sizes[0]!;
    const last = sizes[sizes.length - 1]!;
    out["typography.rangeRatio"] = Number((last / first).toFixed(3));
  }
  const bands = (view.initial as { bands?: Array<{ chars: number; inkRatio?: number }> }).bands;
  if (bands && bands.length) {
    const cv = (values: number[]): number | null => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      if (mean <= 0) return null;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      return Number((Math.sqrt(variance) / mean).toFixed(3));
    };
    const charCv = cv(bands.map((b) => b.chars));
    if (charCv !== null) out["bands.charVariationCoef"] = charCv;
    const inks = bands.map((b) => b.inkRatio).filter((v): v is number => typeof v === "number");
    if (inks.length === bands.length) {
      const inkCv = cv(inks);
      if (inkCv !== null) out["bands.inkVariationCoef"] = inkCv;
    }
    out["bands.count"] = bands.length;
  }
  return out;
}

export interface Stat {
  n: number;
  min: number;
  p10: number;
  median: number;
  p90: number;
  max: number;
  mean: number;
}

export function stat(values: number[]): Stat | null {
  const v = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const at = (q: number) => v[Math.min(v.length - 1, Math.max(0, Math.floor(q * (v.length - 1))))]!;
  return {
    n: v.length,
    min: v[0]!,
    p10: at(0.1),
    median: at(0.5),
    p90: at(0.9),
    max: v[v.length - 1]!,
    mean: Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(3)),
  };
}

/**
 * Craft dimensions the loop optimises. Each names a measurable path and the band a page must
 * land in to read as considered rather than defaulted. Bands are filled from the corpus at
 * aggregation time; the fallbacks here only matter before the first corpus run.
 */
export interface CraftDimension {
  id: string;
  label: string;
  path: string;
  /** How to score: inside band = 1, outside = falls off linearly over `tolerance`. */
  band: [number, number];
  tolerance: number;
  why: string;
  /**
   * How the band is calibrated from the corpus:
   *  - `corridor`  p20…p80 — the value should sit in the middle of the distribution
   *  - `atMost`    0…p75   — less is better, but zero is allowed (restraint dimensions)
   *  - `atLeast`   p25…max — more is better up to the corpus ceiling (quality floors)
   */
  mode?: "corridor" | "atMost" | "atLeast";
}

/**
 * A measurement is only usable if the page actually rendered. Consent walls, bot walls, and
 * client-rendered shells that never hydrated in headless Chromium produce records that would
 * otherwise drag every band toward zero.
 */
export function isUsable(m: FlatMetrics): { ok: boolean; reason?: string } {
  const chars = m["semantics.textChars"];
  const nodes = m["semantics.domNodes"];
  const sizes = m["typography.distinctSizes"];
  if (nodes !== undefined && nodes < 60) return { ok: false, reason: "DOM too small to be a real page" };
  if (chars !== undefined && chars < 250) return { ok: false, reason: "almost no rendered text — wall or splash" };
  if (sizes !== undefined && sizes < 2) return { ok: false, reason: "no type ladder — wall or shell" };
  return { ok: true };
}

/**
 * Some computed values are not measurements of design:
 *  - percentage radii resolve to enormous pixel counts
 *  - shadow alpha occasionally parses out of the colour channel instead of the alpha channel
 *  - scroll-hijacked pages report a document height of one viewport regardless of their length,
 *    so that single metric is dropped rather than the whole reference (those pages are otherwise
 *    some of the most useful art-direction references in the corpus)
 */
export function sanitize(m: FlatMetrics): FlatMetrics {
  const out = { ...m };
  for (const key of ["shape.medianRadius", "shape.maxRadius"]) {
    const v = out[key];
    if (v !== undefined && v > 400) out[key] = 400;
  }
  const alpha = out["shape.medianShadowAlpha"];
  if (alpha !== undefined && alpha > 1) out["shape.medianShadowAlpha"] = Number((alpha / 255).toFixed(3));
  const height = out["layout.documentHeightVh"];
  if (height !== undefined && height <= 1.25) delete out["layout.documentHeightVh"];
  return out;
}

export const CRAFT_DIMENSIONS: CraftDimension[] = [
  { id: "type-scale-range", label: "Type scale range", path: "typography.rangeRatio", band: [4, 9], tolerance: 3, mode: "corridor", why: "Premium pages travel a long way between the smallest label and the display voice." },
  { id: "type-steps", label: "Distinct type sizes", path: "typography.distinctSizes", band: [8, 16], tolerance: 5, mode: "corridor", why: "Too few steps reads as a template; too many reads as unmanaged." },
  { id: "display-scale", label: "Display size vs viewport", path: "hero.displayVwRatio", band: [3.2, 6.5], tolerance: 1.6, mode: "corridor", why: "The headline must own the fold without shouting." },
  { id: "display-leading", label: "Display line height", path: "hero.displayLineHeight", band: [0.92, 1.14], tolerance: 0.12, mode: "corridor", why: "Tight leading is the single clearest signal of typographic intent." },
  { id: "display-measure", label: "Display measure (ch)", path: "hero.displayMeasureCh", band: [14, 30], tolerance: 8, mode: "corridor", why: "Headlines break on purpose; long single lines read as unconsidered." },
  { id: "body-measure", label: "Body measure (ch)", path: "typography.body.measureCh", band: [45, 85], tolerance: 15, mode: "corridor", why: "Readable prose stays inside a controlled measure." },
  { id: "body-leading", label: "Body line height", path: "typography.body.lineHeight", band: [1.4, 1.75], tolerance: 0.2, mode: "corridor", why: "Comfortable leading for sustained reading." },
  { id: "weight-range", label: "Weights in play", path: "typography.distinctWeights.count", band: [3, 6], tolerance: 2, mode: "atLeast", why: "A weight system, not a single default." },
  { id: "surface-layers", label: "Surface layers", path: "color.distinctBackgrounds", band: [5, 16], tolerance: 4, mode: "atLeast", why: "Depth comes from layered surfaces, not from shadows." },
  { id: "text-tones", label: "Text tones", path: "color.distinctTextColors", band: [4, 12], tolerance: 3, mode: "atLeast", why: "Primary / secondary / tertiary ink instead of one grey." },
  { id: "hue-discipline", label: "Hue discipline", path: "color.distinctHues", band: [1, 8], tolerance: 4, mode: "atMost", why: "Restrained hue count keeps a page expensive-looking." },
  { id: "neutral-temperature", label: "Neutral temperature", path: "color.medianNeutralSat", band: [1.5, 10], tolerance: 3, mode: "corridor", why: "Pure #808080 greys are the loudest AI tell; premium neutrals carry a hue." },
  { id: "contrast-floor", label: "Median text contrast", path: "color.medianTextContrast", band: [7, 21], tolerance: 3, mode: "atLeast", why: "Readable by default, not just at the largest sizes." },
  { id: "section-rhythm", label: "Section padding", path: "space.medianSectionPadding", band: [72, 160], tolerance: 40, mode: "corridor", why: "Vertical breathing room separates chapters of the argument." },
  { id: "grid-conformity", label: "Spacing grid conformity", path: "space.fourPointConformity", band: [0.75, 1], tolerance: 0.25, mode: "atLeast", why: "Spacing that lands on a scale rather than on arbitrary numbers." },
  { id: "container-control", label: "Container ratio", path: "space.containerRatio", band: [0.6, 0.95], tolerance: 0.2, mode: "corridor", why: "Content is framed, not stretched edge to edge." },
  { id: "layout-asymmetry", label: "Asymmetric grids", path: "layout.asymmetryRatio", band: [0.08, 0.7], tolerance: 0.2, mode: "atLeast", why: "Equal-width card rows everywhere is the template signature." },
  { id: "scroll-length", label: "Document height (vh)", path: "layout.documentHeightVh", band: [5, 15], tolerance: 4, mode: "corridor", why: "Enough argument to earn the sale, not an endless scroll." },
  { id: "band-variation", label: "Section weight variation", path: "bands.charVariationCoef", band: [0.4, 1.5], tolerance: 0.3, mode: "corridor", why: "Sections should differ in density; uniform bands read as generated." },
  { id: "band-ink-variation", label: "Section coverage variation", path: "bands.inkVariationCoef", band: [0.2, 1.2], tolerance: 0.25, mode: "corridor", why: "How much of each screen is painted should change as you scroll — a quiet band next to a dense one." },
  { id: "radius-system", label: "Radius steps", path: "shape.distinctRadii", band: [3, 10], tolerance: 3, mode: "atLeast", why: "A radius scale, not one rounded value on everything." },
  { id: "shadow-restraint", label: "Shadow coverage", path: "shape.shadowRatio", band: [0, 0.04], tolerance: 0.04, mode: "atMost", why: "Shadow-on-everything is the clearest generic tell." },
  { id: "hairlines", label: "Hairline borders", path: "shape.hairlineRatio", band: [0.8, 1], tolerance: 0.25, mode: "atLeast", why: "Structure carried by 1px rules rather than heavy chrome." },
  { id: "motion-restraint", label: "Transition coverage", path: "motion.transitionRatio", band: [0.005, 0.12], tolerance: 0.06, mode: "corridor", why: "Motion on the things you touch, not on everything." },
  { id: "motion-speed", label: "Median transition (ms)", path: "motion.medianDurationMs", band: [140, 320], tolerance: 100, mode: "corridor", why: "Fast enough to feel responsive, slow enough to read as intentional." },
  { id: "motion-presence", label: "Reveal grammar presence", path: "motion.revealNodes", band: [2, 40], tolerance: 4, mode: "atLeast", why: "A page can sit in the restraint band and still feel lifeless — missable choreography needs reveal nodes in the DOM." },
  { id: "motion-choreography", label: "Stagger / chapter markers", path: "motion.choreographyScore", band: [3, 40], tolerance: 4, mode: "atLeast", why: "Hero entrance, staggered children, or a scroll chapter — at least one intentional beat beyond hover." },
  { id: "token-system", label: "Declared tokens", path: "tokens.declared", band: [40, 500], tolerance: 25, mode: "atLeast", why: "A real design system is declared, not hard-coded." },
  { id: "nav-restraint", label: "Nav links", path: "semantics.navLinks", band: [3, 16], tolerance: 6, mode: "corridor", why: "A navigable spine, not a sitemap in the header." },
  { id: "cta-discipline", label: "Above-fold CTAs", path: "hero.ctaButtons", band: [1, 4], tolerance: 3, mode: "corridor", why: "One primary decision, at most one alternative." },
  { id: "fold-density", label: "Above-fold characters", path: "hero.totalChars", band: [180, 1300], tolerance: 400, mode: "corridor", why: "Enough to orient a buyer, little enough to be read." },
  { id: "heading-depth", label: "Headings on page", path: "semantics.headingCount", band: [8, 50], tolerance: 8, mode: "atLeast", why: "A real argument has named parts; two headings means a stub." },
  { id: "micro-labels", label: "Uppercase micro-labels", path: "typography.uppercaseLabels", band: [2, 40], tolerance: 8, mode: "corridor", why: "Small tracked labels are how sections announce themselves without shouting." },

  /* Composition — the shapes a page makes, rather than the quantities it uses.
   * Everything above can be satisfied by a page that still reads as assembled. These cannot. */
  { id: "width-tiers", label: "Content width tiers", path: "composition.widthTiers", band: [3, 8], tolerance: 2, mode: "atLeast", why: "One container width for every section is the clearest structural tell there is." },
  { id: "alignment-axes", label: "Alignment axes", path: "composition.alignmentAxes", band: [2, 7], tolerance: 2, mode: "corridor", why: "A grid a reader can feel needs more than one left edge and fewer than a dozen." },
  { id: "bleed", label: "Full-bleed bands", path: "composition.bleedRatio", band: [0.1, 0.7], tolerance: 0.2, mode: "corridor", why: "Something has to reach the edge of the screen, or the page is a document in a frame." },
  { id: "tonal-range", label: "Tonal range down the scroll", path: "composition.toneSpread", band: [8, 90], tolerance: 15, mode: "atLeast", why: "Premium pages change tone as you scroll; one paper stock end to end reads as a template." },
  { id: "shape-variety", label: "Section shape variety", path: "composition.shapeVariety", band: [3, 7], tolerance: 1.5, mode: "atLeast", why: "Split, grid, list, table, media — a page that makes one shape is a page nobody composed." },
  { id: "shape-repetition", label: "Repeated shape run", path: "composition.shapeRunRatio", band: [0, 0.4], tolerance: 0.2, mode: "atMost", why: "Three card grids in a row is the single most recognisable generated-page signature." },
  { id: "figure-weight", label: "Drawn matter (share of page)", path: "composition.figureAreaRatio", band: [0.05, 0.4], tolerance: 0.08, mode: "corridor", why: "Type alone is a manuscript. Diagrams, charts, and product surfaces are what a buyer looks at." },
  { id: "fold-figure", label: "Drawn matter above the fold", path: "composition.foldFigureRatio", band: [0.08, 0.9], tolerance: 0.15, mode: "atLeast", why: "The fold has to show the thing, not only describe it." },
  { id: "layering", label: "Layered elements", path: "composition.layeredElements", band: [1, 40], tolerance: 4, mode: "atLeast", why: "Overlap across a boundary is depth that costs nothing in performance." },
  { id: "accent-coverage", label: "Accent coverage", path: "composition.accentAreaRatio", band: [0.002, 0.25], tolerance: 0.05, mode: "corridor", why: "Colour has to appear somewhere beyond a button, without becoming the page." },
  { id: "rule-structure", label: "Rules per screen", path: "composition.ruleDensity", band: [0.5, 12], tolerance: 3, mode: "corridor", why: "Hairline rules are how editorial pages carry structure without boxes." },
];

/** Score a page's flat metrics against the craft dimensions. 0..1 per dimension. */
export function scoreCraft(
  metrics: FlatMetrics,
  dimensions: CraftDimension[] = CRAFT_DIMENSIONS,
): { total: number; rows: Array<{ id: string; label: string; value: number | null; band: [number, number]; score: number; why: string }> } {
  const rows = dimensions.map((d) => {
    const value = metrics[d.path];
    if (value === undefined) {
      return { id: d.id, label: d.label, value: null, band: d.band, score: 0, why: d.why };
    }
    const [lo, hi] = d.band;
    let score = 1;
    if (value < lo) score = Math.max(0, 1 - (lo - value) / d.tolerance);
    else if (value > hi) score = Math.max(0, 1 - (value - hi) / d.tolerance);
    return { id: d.id, label: d.label, value, band: d.band, score: Number(score.toFixed(3)), why: d.why };
  });
  const total = rows.reduce((a, r) => a + r.score, 0) / (rows.length || 1);
  return { total: Number(total.toFixed(4)), rows };
}
