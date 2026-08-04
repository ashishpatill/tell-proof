/**
 * Render the critique briefs to images so a loop can be judged by eye as well as by score.
 *
 * The craft score is a ruler, not a verdict. A page can sit inside every band and still read as
 * assembled rather than authored, and the only way to catch that is to look at it. This writes a
 * full-page shot plus a fold-only shot per brief into research/shots/ (git-ignored).
 *
 * Usage: pnpm research:shots
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
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

  const pages = [...CRITIQUE_BRIEFS, HOLDOUT].map((entry) => ({
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
    console.log(`[shots] ${page.id}`);
    await context.close();
  }
  await browser.close();
  server.close();
  console.log(`[shots] wrote ${pages.length * 2} images to research/shots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
