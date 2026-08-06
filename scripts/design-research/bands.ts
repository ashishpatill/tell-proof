/**
 * Band bench — print the vertical rhythm of one generated page.
 *
 * `bands.charVariationCoef` is the hardest dimension in the scorecard to move blind, because the
 * measurement slices the document into equal-height bands and a section that is visually sparse can
 * still land in a band with a dense neighbour. This prints the slices so a loop can see which beats
 * are actually quiet.
 *
 * Usage: pnpm -F @tell/design-skills exec tsx ../../scripts/design-research/bands.ts [briefId]
 */
import { createServer } from "node:http";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS } from "./briefs";
import { PROBE } from "./forensics";

async function main(): Promise<void> {
  const only = process.argv[2];
  const entries = CRITIQUE_BRIEFS.filter((e) => !only || e.id === only);
  const pages = entries.map((e) => ({ id: e.id, html: designFromFeatures(e.brief).previewHtml }));

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
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await context.newPage();
    await p.goto(`http://127.0.0.1:4322/${page.id}`, { waitUntil: "networkidle" });
    await p.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    const probe = (await p.evaluate(PROBE)) as {
      bands: Array<{ index: number; elements: number; chars: number; maxFontPx: number }>;
      layout: { documentHeightVh: number };
    };
    const chars = probe.bands.map((b) => b.chars);
    const mean = chars.reduce((a, b) => a + b, 0) / chars.length;
    const cv = Math.sqrt(chars.reduce((a, b) => a + (b - mean) ** 2, 0) / chars.length) / mean;
    console.log(`\n${page.id}  height=${probe.layout.documentHeightVh}vh  bands=${chars.length}  cv=${cv.toFixed(3)}`);
    for (const b of probe.bands) {
      const bar = "#".repeat(Math.round((b.chars / Math.max(...chars)) * 44));
      console.log(`  ${String(b.index).padStart(2)}  chars=${String(b.chars).padStart(6)}  el=${String(b.elements).padStart(4)}  max=${String(b.maxFontPx).padStart(5)}  ${bar}`);
    }
    await context.close();
  }
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
