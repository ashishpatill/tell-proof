/**
 * Self-critique — run the design engine's own output through the corpus probe and score the gap.
 *
 * This is the convergence instrument for the research loop: it renders a matrix of briefs
 * (site kinds × aesthetic leans), measures each rendered page exactly the way reference pages
 * were measured, and scores it against the bands calibrated from the corpus.
 *
 * Usage: pnpm research:critique [-- --open]
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { DesignBrief } from "../../packages/design-skills/src/types";
import { PROBE } from "./forensics";
import { CRAFT_DIMENSIONS, flatten, scoreCraft, type CraftDimension } from "./metrics";

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

/* ------------------------------------------------------------------ */
/* Briefs under test — deliberately different products, not variations */
/* ------------------------------------------------------------------ */

const RAW_BRIEFS: Array<{ id: string; brief: unknown }> = [
  {
    id: "saas-conversion",
    brief: {
      productName: "Ledgerline",
      tagline: "Close the month before the month closes you",
      audience: "controllers at 200–2000 person companies",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Continuous close", description: "Reconciliations run every night, so the close is a review instead of a scramble.", priority: "p0" },
        { id: "f2", name: "Variance explain", description: "Every unexpected number arrives with the transactions that caused it.", priority: "p0" },
        { id: "f3", name: "Audit trail", description: "Immutable history of who changed what, exportable the way auditors ask for it.", priority: "p1" },
        { id: "f4", name: "Entity consolidation", description: "Multi-entity roll-ups with intercompany elimination handled in the model.", priority: "p1" },
        { id: "f5", name: "Policy guardrails", description: "Approval thresholds enforced at entry, not discovered in review.", priority: "p2" },
      ],
      constraints: ["totally customized to content", "restrained motion", "enterprise finance buyers"],
      taste: { aestheticLean: "conversion-sharp", motion: "subtle-micro", density: "balanced", colorMood: "neutral-professional" },
    },
  },
  {
    id: "dashboard-app",
    brief: {
      productName: "Signalfloor",
      tagline: "The operations surface for freight teams",
      audience: "dispatch and operations leads",
      businessGoal: "activation",
      siteKind: "dashboard-webapp",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Live board", description: "Every load, driver, and exception on one board that updates without a refresh.", priority: "p0" },
        { id: "f2", name: "Exception queue", description: "Only the shipments that need a human, ranked by cost of delay.", priority: "p0" },
        { id: "f3", name: "Margin view", description: "Per-load economics visible while the decision is still reversible.", priority: "p1" },
        { id: "f4", name: "Carrier scorecards", description: "On-time, damage, and responsiveness history behind every assignment.", priority: "p1" },
        { id: "f5", name: "Shift handoff", description: "State of the board written down automatically at shift change.", priority: "p2" },
      ],
      constraints: ["information dense", "no decorative motion"],
      taste: { aestheticLean: "system-crafted", motion: "subtle-micro", density: "information-rich", colorMood: "dark-premium" },
    },
  },
  {
    id: "corporate-story",
    brief: {
      productName: "Northbank Partners",
      tagline: "Capital for companies that outlive their founders",
      audience: "founders and boards of family-held businesses",
      businessGoal: "trust",
      siteKind: "corporate-story",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Long-hold capital", description: "We buy to keep, so the plan is measured in decades rather than quarters.", priority: "p0" },
        { id: "f2", name: "Operating bench", description: "Former operators who have run the same problems at larger scale.", priority: "p0" },
        { id: "f3", name: "Succession design", description: "Ownership transitions structured so the business does not wobble.", priority: "p1" },
        { id: "f4", name: "Board craft", description: "Boards that ask better questions instead of more questions.", priority: "p2" },
      ],
      constraints: ["editorial", "quiet", "no spectacle"],
      taste: { aestheticLean: "refined-story", motion: "light-scroll-reveals", density: "sparse", colorMood: "soft-brand-accent", typographyWeight: "light-elegant" },
    },
  },
  {
    id: "docs-educational",
    brief: {
      productName: "Substrate",
      tagline: "How the scheduler actually decides",
      audience: "platform engineers evaluating the runtime",
      businessGoal: "trust",
      siteKind: "docs-educational",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Placement model", description: "Bin-packing with fairness constraints, explained with the real cost function.", priority: "p0" },
        { id: "f2", name: "Preemption ladder", description: "What gets evicted first, and the guarantees that survive eviction.", priority: "p0" },
        { id: "f3", name: "Backpressure", description: "How queue depth translates into admission decisions upstream.", priority: "p1" },
        { id: "f4", name: "Failure domains", description: "Spread rules and what they cost you in packing efficiency.", priority: "p1" },
      ],
      constraints: ["teaching-first", "figures over screenshots"],
      taste: { aestheticLean: "minimal-clean", motion: "none", density: "balanced", colorMood: "light-airy" },
    },
  },
];

/**
 * Holdout. The matrix above is four briefs, and it is easy to tune the engine until those four
 * score well and everything else quietly regresses. This one is deliberately unlike them — a
 * different industry, an information-rich commerce surface, a brand accent supplied by the client —
 * and it is scored separately. If it trails the matrix average by more than a few points, the last
 * loop tuned the briefs rather than the engine.
 */
const HOLDOUT_BRIEF = {
  id: "holdout-commerce",
  brief: {
    productName: "Bramble & Fold",
    tagline: "Wholesale ordering that does not need a phone call",
    audience: "independent grocers and their suppliers",
    businessGoal: "sales",
    siteKind: "saas-marketing",
    lockSiteKind: true,
    brandAccent: "#7A4B2A",
    features: [
      { id: "h1", name: "Standing orders", description: "Recurring baskets that adjust to the season instead of repeating last week by rote.", priority: "p0" },
      { id: "h2", name: "Substitution rules", description: "Say once what may replace what, and stop approving the same swap every Tuesday.", priority: "p0" },
      { id: "h3", name: "Delivery windows", description: "Cut-off times a supplier can actually hold, published where buyers see them.", priority: "p1" },
      { id: "h4", name: "Credit terms", description: "Terms, limits, and outstanding balance visible on the order screen, not in an email chain.", priority: "p1" },
      { id: "h5", name: "Shortfall alerts", description: "Notice of a short delivery early enough to source elsewhere.", priority: "p1" },
      { id: "h6", name: "Price history", description: "What each line cost across the last twelve weeks, so a rise is a conversation.", priority: "p2" },
    ],
    constraints: ["information dense", "no decorative motion", "trade buyers"],
    taste: { aestheticLean: "system-crafted", motion: "subtle-micro", density: "information-rich", colorMood: "soft-brand-accent", typographyWeight: "bold-confident", roundingDepth: "soft-elevation" },
  },
};

export const CRITIQUE_BRIEFS = RAW_BRIEFS.map((entry) => ({ id: entry.id, brief: DesignBrief.parse(entry.brief) }));
export const HOLDOUT = { id: HOLDOUT_BRIEF.id, brief: DesignBrief.parse(HOLDOUT_BRIEF.brief) };

interface Calibrated extends CraftDimension {
  calibrated?: boolean;
}

function loadBands(): CraftDimension[] {
  const aggPath = resolve(root, "research/aggregate.json");
  if (!existsSync(aggPath)) return CRAFT_DIMENSIONS;
  const agg = JSON.parse(readFileSync(aggPath, "utf8")) as { calibrated?: Calibrated[] };
  if (!agg.calibrated?.length) return CRAFT_DIMENSIONS;
  return agg.calibrated.map((c) => ({
    id: c.id,
    label: c.label,
    path: c.path,
    band: c.band,
    tolerance: c.tolerance,
    why: c.why,
  }));
}

async function main(): Promise<void> {
  const bands = loadBands();
  const pages = [...CRITIQUE_BRIEFS, HOLDOUT].map((entry) => {
    const { spec, previewHtml } = designFromFeatures(entry.brief);
    return { id: entry.id, html: previewHtml, motion: spec.taste.motion, holdout: entry.id === HOLDOUT.id };
  });

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.id === id);
    if (!page) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4321, "127.0.0.1", r));

  const browser = await chromium.launch();
  const results: Array<{ id: string; total: number; holdout: boolean; rows: ReturnType<typeof scoreCraft>["rows"]; metrics: Record<string, number> }> = [];

  for (const page of pages) {
    // A page whose developer chose "no motion" has no transitions to time. Scoring it against a
    // transition corridor would be scoring it for obeying a taste control, so those two dimensions
    // are dropped for that page rather than counted as zero.
    const applicable = page.motion === "none" ? bands.filter((d) => !d.id.startsWith("motion-")) : bands;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await context.newPage();
    await p.goto(`http://127.0.0.1:4321/${page.id}`, { waitUntil: "networkidle", timeout: 30_000 });
    await p.waitForTimeout(600);
    // Scroll the page so reveal-gated content is measured the way a reader would see it.
    await p.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(400);
    const probe = (await p.evaluate(PROBE)) as Record<string, unknown>;
    const metrics = flatten({ ref: page.id, category: "self", views: [{ viewport: "desktop", initial: probe }] });
    const scored = scoreCraft(metrics, applicable);
    results.push({ id: page.id, total: scored.total, holdout: page.holdout, rows: scored.rows, metrics });
    await context.close();
  }

  await browser.close();
  server.close();

  const matrix = results.filter((r) => !r.holdout);
  const holdout = results.find((r) => r.holdout) ?? null;
  const overall = Number((matrix.reduce((a, r) => a + r.total, 0) / (matrix.length || 1)).toFixed(4));
  const holdoutGap = holdout ? Number((overall - holdout.total).toFixed(4)) : null;

  // Rank dimensions by how much room is left, so a loop knows what to fix next.
  const worst = bands
    .map((d) => {
      // Only average over the pages the dimension was scored on, so an intentionally inapplicable
      // dimension does not masquerade as a failure in the ranking.
      const scores = results.flatMap((r) => {
        const row = r.rows.find((x) => x.id === d.id);
        return row ? [row.score] : [];
      });
      const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
      return {
        id: d.id,
        label: d.label,
        band: d.band,
        mean: Number(mean.toFixed(3)),
        scoredOn: scores.length,
        values: results.map((r) => ({ page: r.id, value: r.rows.find((row) => row.id === d.id)?.value ?? null })),
      };
    })
    .sort((a, b) => a.mean - b.mean);

  const outDir = resolve(root, "research");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "critique.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        overall,
        holdout: holdout ? { id: holdout.id, total: holdout.total, gap: holdoutGap } : null,
        pages: results.map(({ id, total, holdout: isHoldout, rows }) => ({ id, total, holdout: isHoldout, rows })),
        worst,
      },
      null,
      2,
    ),
  );

  console.log(`\ncraft score ${(overall * 100).toFixed(1)} / 100`);
  for (const r of matrix) console.log(`  ${r.id.padEnd(20)} ${(r.total * 100).toFixed(1)}`);
  if (holdout) {
    const verdict = (holdoutGap ?? 0) <= 0.03 ? "generalises" : "OVERFIT — matrix is being tuned, not the engine";
    console.log(`  ${holdout.id.padEnd(20)} ${(holdout.total * 100).toFixed(1)}  (holdout, gap ${((holdoutGap ?? 0) * 100).toFixed(1)} pts — ${verdict})`);
  }
  console.log("\nweakest dimensions:");
  for (const w of worst.slice(0, 12)) {
    const vals = w.values.map((v) => `${v.page}=${v.value ?? "—"}`).join(" ");
    console.log(`  ${(w.mean * 100).toFixed(0).padStart(3)}  ${w.label.padEnd(28)} band ${w.band[0]}–${w.band[1]}  ${vals}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
