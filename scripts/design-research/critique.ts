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
import { CRITIQUE_BRIEFS, HOLDOUT } from "./briefs";
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
