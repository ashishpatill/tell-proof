/**
 * Render the critique briefs to images so a loop can be judged by eye as well as by score.
 *
 * The craft score is a ruler, not a verdict. A page can sit inside every band and still read as
 * assembled rather than authored, and the only way to catch that is to look at it. This writes
 * three things per brief into research/shots/ (git-ignored):
 *
 *   <id>-fold.png     the first screen, which is the only one most visitors see
 *   <id>-full.png     the whole page, for rhythm — useful as a thumbnail, useless for detail
 *   <id>-s<n>.png     one screen-sized slice per scroll position, which is how the page is read
 *
 * The slices matter most. A full-page shot of a ten-screen page is 1440x9000, and at the size it
 * can actually be viewed every defect disappears. Reviewing by slice is reviewing at reading size.
 *
 * Usage: pnpm research:shots [-- --page saas-conversion]
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS, HOLDOUT } from "./briefs";

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

async function main(): Promise<void> {
  const outDir = resolve(root, "research/shots");
  mkdirSync(outDir, { recursive: true });
  // Stale shots from an earlier engine are worse than none: they get reviewed as if current.
  for (const f of readdirSync(outDir)) if (f.endsWith(".png")) rmSync(resolve(outDir, f));

  const only = process.argv.includes("--page") ? process.argv[process.argv.indexOf("--page") + 1] : null;
  const pages = [...CRITIQUE_BRIEFS, HOLDOUT]
    .filter((entry) => !only || entry.id === only)
    .map((entry) => ({
      id: entry.id,
      html: designFromFeatures(entry.brief).previewHtml,
    }));

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.id === id);
    if (!page) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4322, "127.0.0.1", r));

  const browser = await chromium.launch();
  let shots = 0;
  for (const page of pages) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const p = await context.newPage();
    await p.goto(`http://127.0.0.1:4322/${page.id}`, { waitUntil: "networkidle", timeout: 30_000 });
    await p.waitForTimeout(500);
    await p.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(300);
    await p.screenshot({ path: resolve(outDir, `${page.id}-fold.png`) });
    await p.screenshot({ path: resolve(outDir, `${page.id}-full.png`), fullPage: true });

    const height = await p.evaluate(() => document.body.scrollHeight);
    const screens = Math.min(12, Math.ceil(height / 900));
    for (let i = 1; i < screens; i += 1) {
      const y = Math.min(i * 900, height - 900);
      await p.evaluate((top) => window.scrollTo(0, top), y);
      await p.waitForTimeout(220);
      await p.screenshot({ path: resolve(outDir, `${page.id}-s${i}.png`) });
      shots += 1;
    }
    shots += 2;
    console.log(`[shots] ${page.id} — ${screens} screens`);
    await context.close();
  }
  await browser.close();
  server.close();
  console.log(`[shots] wrote ${shots} images to research/shots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
