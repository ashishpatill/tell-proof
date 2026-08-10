/**
 * Aggregate anonymised forensics records into corpus statistics and calibrated craft bands.
 *
 * Outputs:
 *   research/aggregate.json      machine-readable distributions + calibrated bands
 *   docs/10_DESIGN_EVIDENCE.md   the human-readable evidence brief the design engine is built on
 *
 * Nothing here emits a host, URL, brand, or person. References are ref ids and category buckets.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CRAFT_DIMENSIONS, flatten, isUsable, sanitize, stat, type ForensicsRecord, type Stat } from "./metrics";

function repoRoot(from = process.cwd()): string {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

const root = repoRoot();
const measurementsDir = resolve(root, "research/measurements");

function load(): ForensicsRecord[] {
  if (!existsSync(measurementsDir)) return [];
  return readdirSync(measurementsDir)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json")
    .map((f) => JSON.parse(readFileSync(resolve(measurementsDir, f), "utf8")) as ForensicsRecord)
    .filter((r) => r.views?.some((v) => v.initial));
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 100) return String(Math.round(n));
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function statRow(label: string, s: Stat | null): string {
  if (!s) return `| ${label} | — | — | — | — | — |`;
  return `| ${label} | ${fmt(s.p10)} | ${fmt(s.median)} | ${fmt(s.p90)} | ${fmt(s.min)}–${fmt(s.max)} | ${s.n} |`;
}

const HEADLINE_PATHS: Array<[string, string]> = [
  ["typography.rangeRatio", "Smallest→largest type ratio"],
  ["typography.distinctSizes", "Distinct type sizes"],
  ["typography.familyCount", "Type families in play"],
  ["typography.distinctWeights.count", "Distinct weights"],
  ["typography.displayToBodyRatio", "Display ÷ body size"],
  ["typography.fluidType", "Uses fluid type (share)"],
  ["typography.uppercaseLabels", "Uppercase micro-labels"],
  ["hero.displayPx", "Hero display size (px @1440)"],
  ["hero.displayVwRatio", "Hero display as % of viewport width"],
  ["hero.displayLineHeight", "Hero display line height"],
  ["hero.displayMeasureCh", "Hero display measure (ch)"],
  ["hero.displayChars", "Hero headline length (chars)"],
  ["hero.totalChars", "Above-fold characters"],
  ["hero.ctaButtons", "Above-fold CTA buttons"],
  ["hero.navHeight", "Nav bar height (px)"],
  ["typography.body.px", "Body size (px)"],
  ["typography.body.lineHeight", "Body line height"],
  ["typography.body.measureCh", "Body measure (ch)"],
  ["typography.h1.letterSpacingEm", "Display tracking (em)"],
  ["color.distinctBackgrounds", "Distinct surface colours"],
  ["color.distinctTextColors", "Distinct ink tones"],
  ["color.distinctHues", "Distinct hues"],
  ["color.maxSaturation", "Peak saturation (%)"],
  ["color.medianNeutralSat", "Neutral saturation (%)"],
  ["color.medianTextContrast", "Median text contrast"],
  ["color.isDark", "Dark page (share)"],
  ["color.gradientCount", "Gradient elements"],
  ["space.medianSectionPadding", "Section padding (px)"],
  ["space.containerMax", "Container width (px)"],
  ["space.containerRatio", "Container ÷ viewport"],
  ["space.fourPointConformity", "Spacing on 4px grid (share)"],
  ["space.eightPointConformity", "Spacing on 8px grid (share)"],
  ["space.distinctSpacingValues", "Distinct spacing values"],
  ["layout.sections", "Section-level regions"],
  ["layout.gridContainers", "Grid containers"],
  ["layout.asymmetryRatio", "Asymmetric grid share"],
  ["layout.documentHeightVh", "Page height (viewports)"],
  ["layout.aboveFoldInkRatio", "Above-fold painted ratio"],
  ["layout.stickyElements", "Sticky/fixed elements"],
  ["bands.charVariationCoef", "Section density variation"],
  ["bands.inkVariationCoef", "Section coverage variation"],
  ["composition.widthTiers", "Content width tiers"],
  ["composition.alignmentAxes", "Alignment axes"],
  ["composition.edgeGutterPx", "Edge gutter (px)"],
  ["composition.spineConformity", "Share on the top 3 axes"],
  ["composition.bleedRatio", "Full-bleed band share"],
  ["composition.toneSpread", "Tonal range down the scroll"],
  ["composition.invertedShare", "Inverted band share"],
  ["composition.shapeVariety", "Distinct section shapes"],
  ["composition.shapeRunRatio", "Longest repeated shape run"],
  ["composition.figures", "Figures (drawn matter)"],
  ["composition.figureAreaRatio", "Drawn matter ÷ page area"],
  ["composition.foldFigureRatio", "Drawn matter above the fold"],
  ["composition.layeredElements", "Layered / overlapping elements"],
  ["composition.accentAreaRatio", "Accent coverage"],
  ["composition.ruleDensity", "Rules per screen"],
  ["composition.ordinalMarks", "Ordinal marks"],
  ["composition.mixedDisplayBlocks", "Mixed-voice display lines"],
  ["shape.distinctRadii", "Distinct radii"],
  ["shape.medianRadius", "Median radius (px)"],
  ["shape.maxRadius", "Largest non-pill radius (px)"],
  ["shape.pillCount", "Pill-shaped elements"],
  ["shape.shadowRatio", "Elements with shadow (share)"],
  ["shape.medianShadowAlpha", "Median shadow alpha"],
  ["shape.hairlineRatio", "Borders ≤1px (share)"],
  ["motion.transitionRatio", "Elements with transitions (share)"],
  ["motion.medianDurationMs", "Median transition (ms)"],
  ["motion.p90DurationMs", "p90 transition (ms)"],
  ["motion.animatedElements", "Keyframe-animated elements"],
  ["motion.infiniteAnimations", "Infinite animations"],
  ["motion.reducedMotionRules", "reduced-motion rules"],
  ["motion.choreographyScore", "Choreography markers (enter+stagger+pin+reveals)"],
  ["motion.staggerGroups", "Stagger groups"],
  ["motion.enterBeats", "Hero/enter beats"],
  ["motion.chapterPins", "Pinned scroll chapters"],
  ["tokens.declared", "Declared CSS custom properties"],
  ["tokens.color", "Colour tokens"],
  ["tokens.space", "Spacing tokens"],
  ["media.images", "Images"],
  ["media.svgInline", "Inline SVG nodes"],
  ["media.imageAreaRatio", "Image area ÷ page area"],
  ["semantics.navLinks", "Nav links"],
  ["semantics.headingCount", "Headings"],
  ["semantics.domNodes", "DOM nodes"],
  ["semantics.textChars", "Page text (chars)"],
  ["semantics.focusVisibleRules", ":focus-visible rules"],
  ["perf.fcpMs", "First contentful paint (ms)"],
  ["net.requests", "Requests"],
  ["net.fontFiles", "Font files"],
];

function main(): void {
  const records = load();
  if (!records.length) {
    console.error("No measurements found. Run `pnpm research:forensics` first.");
    process.exit(2);
  }

  const rawDesktop = records.map((r) => ({ ref: r.ref, category: r.category, m: sanitize(flatten(r, "desktop")) }));
  const excluded = rawDesktop
    .map((d) => ({ ref: d.ref, category: d.category, ...isUsable(d.m) }))
    .filter((d) => !d.ok);
  const excludedRefs = new Set(excluded.map((e) => e.ref));
  const desktop = rawDesktop.filter((d) => !excludedRefs.has(d.ref));
  const mobile = records
    .filter((r) => !excludedRefs.has(r.ref))
    .map((r) => ({ ref: r.ref, category: r.category, m: sanitize(flatten(r, "mobile")) }));

  if (excluded.length) {
    console.log(`[aggregate] excluded ${excluded.length} unrenderable references:`);
    for (const e of excluded) console.log(`  ${e.ref} (${e.category}) — ${e.reason}`);
  }

  const allPaths = Array.from(new Set(desktop.flatMap((d) => Object.keys(d.m)))).sort();
  const overall: Record<string, Stat | null> = {};
  for (const p of allPaths) overall[p] = stat(desktop.map((d) => d.m[p]!).filter((v) => v !== undefined));

  const mobileStats: Record<string, Stat | null> = {};
  for (const p of allPaths) mobileStats[p] = stat(mobile.map((d) => d.m[p]!).filter((v) => v !== undefined));

  const categories = Array.from(new Set(desktop.map((d) => d.category))).sort();
  const byCategory: Record<string, Record<string, Stat | null>> = {};
  for (const c of categories) {
    const rows = desktop.filter((d) => d.category === c);
    byCategory[c] = {};
    for (const p of allPaths) {
      byCategory[c]![p] = stat(rows.map((d) => d.m[p]!).filter((v) => v !== undefined));
    }
  }

  // Calibrate craft bands from the corpus. `corridor` dimensions take the trimmed middle of the
  // distribution; restraint dimensions are capped from below at zero; quality floors run from the
  // lower quartile up to the corpus ceiling.
  const quantile = (path: string, q: number): number | null => {
    const values = desktop.map((d) => d.m[path]!).filter((v) => v !== undefined).sort((a, b) => a - b);
    if (!values.length) return null;
    return values[Math.min(values.length - 1, Math.max(0, Math.floor(q * (values.length - 1))))]!;
  };

  const calibrated = CRAFT_DIMENSIONS.map((d) => {
    const s = overall[d.path];
    if (!s || s.n < 8) return { ...d, calibrated: false, corpusN: s?.n ?? 0 };
    const mode = d.mode ?? "corridor";
    let lo: number;
    let hi: number;
    if (mode === "atMost") {
      lo = 0;
      hi = quantile(d.path, 0.75) ?? s.median;
    } else if (mode === "atLeast") {
      lo = quantile(d.path, 0.3) ?? s.p10;
      hi = Math.max(s.max, lo);
    } else {
      lo = quantile(d.path, 0.2) ?? s.p10;
      hi = quantile(d.path, 0.8) ?? s.p90;
    }
    // A band that collapsed to a point cannot discriminate; keep the hand-set fallback.
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return { ...d, calibrated: false, corpusN: s.n };
    const spread = Math.max(hi - lo, Math.abs(hi) * 0.15, 0.01);
    return {
      ...d,
      band: [Number(lo.toFixed(3)), Number(hi.toFixed(3))] as [number, number],
      tolerance: Number((spread * (mode === "corridor" ? 0.5 : 0.6)).toFixed(3)),
      calibrated: true,
      corpusN: s.n,
    };
  });

  writeFileSync(
    resolve(root, "research/aggregate.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        references: records.length,
        usable: desktop.length,
        excluded,
        categories,
        overall,
        mobile: mobileStats,
        byCategory,
        calibrated,
      },
      null,
      2,
    ),
  );

  /* ---------------- evidence brief ---------------- */
  const lines: string[] = [];
  lines.push("# 10 — Design evidence (measured)");
  lines.push("");
  lines.push("> Generated by `pnpm research:aggregate` from `research/measurements/`.");
  lines.push("> Every number below was measured from a rendered page in a real browser at 1440×900.");
  lines.push("> References are anonymised by design: only a `ref` id and a category bucket are retained.");
  lines.push("> Do not add names, hosts, or URLs to this file — the corpus list is deliberately local-only.");
  lines.push("");
  lines.push(
    `**Corpus:** ${desktop.length} usable references across ${categories.length} categories ` +
      `(${excluded.length} measured but excluded — consent walls, bot walls, and client shells that never hydrated headless).`,
  );
  lines.push("");
  lines.push("| Category | References |");
  lines.push("|---|---|");
  for (const c of categories) {
    lines.push(`| \`${c}\` | ${desktop.filter((d) => d.category === c).length} |`);
  }
  lines.push("");
  lines.push("## Measured distributions (desktop, 1440×900)");
  lines.push("");
  lines.push("| Measure | p10 | median | p90 | range | n |");
  lines.push("|---|---|---|---|---|---|");
  for (const [path, label] of HEADLINE_PATHS) lines.push(statRow(label, overall[path] ?? null));
  lines.push("");
  lines.push("## Mobile deltas (390×844)");
  lines.push("");
  lines.push("| Measure | p10 | median | p90 | range | n |");
  lines.push("|---|---|---|---|---|---|");
  for (const path of [
    "hero.displayPx",
    "hero.displayVwRatio",
    "typography.body.px",
    "typography.body.measureCh",
    "space.medianSectionPadding",
    "space.containerRatio",
    "layout.documentHeightVh",
    "hero.totalChars",
  ]) {
    const label = HEADLINE_PATHS.find(([p]) => p === path)?.[1] ?? path;
    lines.push(statRow(label, mobileStats[path] ?? null));
  }
  lines.push("");
  lines.push("## Calibrated craft bands");
  lines.push("");
  lines.push("These are the corridors the generator is scored against by `pnpm research:critique`.");
  lines.push("A page inside every band is not automatically good, but a page outside them is reliably");
  lines.push("readable as templated or unconsidered.");
  lines.push("");
  lines.push("| Dimension | Band (p10–p90) | Why it matters |");
  lines.push("|---|---|---|");
  for (const d of calibrated) {
    lines.push(`| ${d.label} | ${fmt(d.band[0])} – ${fmt(d.band[1])} | ${d.why} |`);
  }
  lines.push("");
  lines.push("## Category signatures");
  lines.push("");
  const signaturePaths: Array<[string, string]> = [
    ["hero.displayVwRatio", "display %vw"],
    ["color.distinctBackgrounds", "surfaces"],
    ["color.isDark", "dark share"],
    ["space.medianSectionPadding", "section pad"],
    ["shape.medianRadius", "radius"],
    ["shape.shadowRatio", "shadow share"],
    ["motion.transitionRatio", "motion share"],
    ["layout.documentHeightVh", "page vh"],
  ];
  lines.push(`| Category | ${signaturePaths.map(([, l]) => l).join(" | ")} |`);
  lines.push(`|---|${signaturePaths.map(() => "---").join("|")}|`);
  for (const c of categories) {
    const cells = signaturePaths.map(([p]) => fmt(byCategory[c]?.[p]?.median ?? null));
    lines.push(`| \`${c}\` | ${cells.join(" | ")} |`);
  }
  lines.push("");

  const outPath = resolve(root, "docs/10_DESIGN_EVIDENCE.md");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${lines.join("\n")}\n`);

  console.log(`[aggregate] ${records.length} references → research/aggregate.json + docs/10_DESIGN_EVIDENCE.md`);
}

main();
