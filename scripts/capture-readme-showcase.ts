/**
 * Capture /showcase + one fold still per specimen for README.
 *
 * One still per offering — do not also capture a reel still of the same fold
 * (GitHub shows the reel's first frame, which duplicated every template).
 *
 * - Showcase routes: live Tell Specimens UI (featured cinema + filmstrip).
 * - Sport: live /crease and /baseline.
 * - Engine templates: full-bleed HTML from designFromFeatures at 1440×900.
 *
 * Requires `@tell/web` on :3000 for showcase + sport frames.
 *
 * Usage: pnpm capture:readme-showcase
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { chromium, type Page } from "playwright";
import { designFromFeatures, getTemplate } from "../packages/design-skills/src/index";

const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "docs/media/showcase");
const ARTIFACTS = "/opt/cursor/artifacts/screenshots";
const BASE = process.env.TELL_WEB_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 1440, height: 900 };

function webpWidthFor(name: string): number {
  if (name === "01-showcase-featured" || name === "02-showcase-gallery") return 1100;
  return 720;
}

/** One fold selector per engine offering — the unreplicable first-viewport instrument. */
const TEMPLATES: Array<{ key: string; fold: string }> = [
  { key: "saas", fold: ".ds-pipeline-fold, .ds-hero-pipeline" },
  { key: "dashboard", fold: ".ds-queue-fold, .ds-hero-queue" },
  { key: "corporate", fold: ".ds-diligence-fold, .ds-hero-diligence" },
  { key: "educational", fold: ".ds-mechanism-fold, .ds-hero-mechanism" },
  { key: "fintech", fold: ".ds-wire-fold, .ds-hero-wire" },
  { key: "studio", fold: ".ds-hero-overfigure, .ds-hero-stackfold, .ds-hero" },
  { key: "consumer", fold: ".ds-hero-overfigure, .ds-hero-stackfold, .ds-hero" },
  { key: "foundry", fold: ".ds-seam-figure, .ds-hero-seam, .ds-hero" },
  { key: "dossier", fold: ".ds-folio-plate, .ds-hero-folio, .ds-hero" },
  { key: "observatory", fold: ".ds-chrono-lattice, .ds-hero-chrono, .ds-hero" },
  { key: "archive", fold: ".ds-register-ledger, .ds-hero-register, .ds-hero" },
  { key: "loom", fold: ".ds-loom-plate, .ds-hero-loom, .ds-hero" },
  { key: "herbarium", fold: ".ds-hero-glassine, .ds-press-plate, .ds-hero-tray" },
  { key: "press", fold: ".ds-press-sheet, .ds-hero-press" },
  { key: "lantern", fold: ".ds-path-plate, .ds-hero-path, .ds-hero" },
  { key: "clinic", fold: ".ds-care-plate, .ds-hero-rounds, .ds-hero" },
  { key: "harness", fold: ".ds-helm-fold, .ds-permit-plate, .ds-hero-helm" },
];

const LIVE_FOLDS: Array<{ name: string; path: string; wait: string }> = [
  { name: "crease-fold", path: "/crease", wait: "[data-testid='crease-site'], .cr-hero" },
  { name: "baseline-fold", path: "/baseline", wait: "[data-testid='baseline-site'], .bl-hero" },
];

async function shot(page: Page, name: string): Promise<void> {
  const png = resolve(OUT, `${name}.png`);
  const webp = resolve(OUT, `${name}.webp`);
  await page.screenshot({ path: png, type: "png" });
  const maxw = webpWidthFor(name);
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      png,
      "-vf",
      `scale='min(${maxw},iw)':-2:flags=lanczos`,
      "-c:v",
      "libwebp",
      "-quality",
      "78",
      "-compression_level",
      "6",
      webp,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr || `webp ${name}`);
  unlinkSync(png);
  if (existsSync(ARTIFACTS)) {
    try {
      copyFileSync(webp, resolve(ARTIFACTS, `readme-${name}.webp`));
    } catch {
      /* best-effort */
    }
  }
  console.log(`[readme-shots] ${name}.webp @${maxw}w`);
}

async function scrollTo(page: Page, sel: string, yPad: number): Promise<boolean> {
  const y = await page.evaluate(
    ({ selector, pad }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - pad));
    },
    { selector: sel, pad: yPad },
  );
  if (y == null) return false;
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(280);
  return true;
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  if (existsSync(ARTIFACTS)) mkdirSync(ARTIFACTS, { recursive: true });

  const pages = TEMPLATES.map((t) => {
    const template = getTemplate(t.key);
    if (!template) throw new Error(`missing template ${t.key}`);
    return {
      ...t,
      html: designFromFeatures(template.brief).previewHtml,
    };
  });

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.key === id);
    if (!page) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4323, "127.0.0.1", r));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // ——— Showcase gallery (live app) ———
  await page.goto(`${BASE}/showcase`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="showcase-featured-preview"][data-ready="true"]', {
    timeout: 45_000,
  });
  await page.waitForTimeout(1400);
  await shot(page, "01-showcase-featured");

  await page.locator("#reels, .sx-filmstrip").first().scrollIntoViewIfNeeded();
  await page
    .waitForSelector(".sx-filmstrip [data-ready='true']", { timeout: 30_000 })
    .catch(() => undefined);
  // Let at least two filmstrip cells paint so Crease is not copied into Baseline.
  await page.waitForTimeout(1800);
  await shot(page, "02-showcase-gallery");

  // ——— Sport matchday (live app, one fold each) ———
  for (const live of LIVE_FOLDS) {
    await page.goto(`${BASE}${live.path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector(live.wait, { timeout: 30_000 });
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await shot(page, live.name);
  }

  // ——— Engine templates: one fold still each ———
  for (const t of pages) {
    await page.goto(`http://127.0.0.1:4323/${t.key}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForSelector(".ds-hero, h1, [data-sitekind]", { timeout: 20_000 });
    await page.waitForTimeout(500);

    const figOk = await scrollTo(page, t.fold, 8);
    if (!figOk) {
      await page.evaluate(() => {
        const nav = document.querySelector(".ds-nav");
        const h = nav ? Math.round((nav as HTMLElement).getBoundingClientRect().height) : 0;
        window.scrollTo(0, Math.max(0, h - 4));
      });
      await page.waitForTimeout(200);
    }
    await shot(page, `${t.key}-fold`);
  }

  await browser.close();
  server.close();
  console.log(`[readme-shots] wrote one fold per offering to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
