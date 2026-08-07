/**
 * Craft-reel animated WebPs for the first five marketing templates (fold → mid beat → proof/features).
 * Encodes at 480w for README table cells. Usage: pnpm -F @tell/core exec tsx ../../scripts/capture-first5-reels.ts
 */
import { createServer } from "node:http";
import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { designFromFeatures, getTemplate } from "../packages/design-skills/src/index";

const OUT = resolve(__dirname, "../docs/media/showcase");
const ARTIFACTS = "/opt/cursor/artifacts/screenshots";
const TMP = resolve("/tmp/tell-first5-reels");
const VIEWPORT = { width: 1440, height: 900 };

const KEYS = [
  { key: "saas", beats: [".ds-pipeline-field, .ds-hero-pipeline", "#features", "#proof"] },
  { key: "dashboard", beats: [".ds-queue-field, .ds-hero-queue", "#app, .ds-app", "#proof"] },
  { key: "corporate", beats: [".ds-diligence-field, .ds-hero-diligence", "#story", "#proof"] },
  { key: "educational", beats: [".ds-mechanism-stage, .ds-hero-mechanism", ".ds-mechanism-grid", "#features"] },
  { key: "fintech", beats: [".ds-wire-field, .ds-hero-wire", "#features", "#proof"] },
];

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  if (existsSync(ARTIFACTS)) mkdirSync(ARTIFACTS, { recursive: true });

  const pages = KEYS.map((t) => {
    const template = getTemplate(t.key);
    if (!template) throw new Error(`missing ${t.key}`);
    return { ...t, html: designFromFeatures(template.brief).previewHtml };
  });

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.key === id);
    if (!page) {
      res.writeHead(404).end("nf");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4325, "127.0.0.1", r));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  for (const t of pages) {
    const dir = join(TMP, t.key);
    mkdirSync(dir, { recursive: true });
    await page.goto(`http://127.0.0.1:4325/${t.key}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForSelector(".ds-hero, h1", { timeout: 20_000 });
    let frame = 0;
    for (const sel of t.beats) {
      await page.evaluate(({ selector }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const y = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - 24));
        window.scrollTo(0, y);
      }, { selector: sel });
      await page.waitForTimeout(350);
      for (let hold = 0; hold < 8; hold += 1) {
        await page.screenshot({
          path: join(dir, `f${String(frame).padStart(3, "0")}.png`),
          type: "png",
        });
        frame += 1;
      }
    }
    const pattern = join(dir, "f%03d.png");
    // README table cells ~400px; 480w animated WebP is the delivery asset.
    const webp = join(OUT, `${t.key}-reel.webp`);
    const r = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-framerate",
        "6",
        "-i",
        pattern,
        "-vf",
        "fps=6,scale=480:-2:flags=lanczos",
        "-c:v",
        "libwebp",
        "-quality",
        "68",
        "-compression_level",
        "6",
        "-loop",
        "0",
        webp,
      ],
      { encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(r.stderr || `webp ${t.key}`);
    if (existsSync(ARTIFACTS)) copyFileSync(webp, join(ARTIFACTS, `${t.key}-reel.webp`));
    console.log(`[first5-reels] ${t.key} → ${webp}`);
  }

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
