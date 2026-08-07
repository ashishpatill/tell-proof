/**
 * Capture /showcase + top template craft beats for README + agent walkthrough.
 *
 * - Showcase routes: real Tell Specimens UI (featured cinema + filmstrip).
 * - Template folds: full-bleed HTML from designFromFeatures at 1440×900 (no chrome).
 * - Writes display-sized WebP (hero 1100w, beats 720w).
 *
 * Requires `@tell/web` on :3000 for showcase frames.
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

/** Newest / most distinctive offerings featured on the README — plus fixed first-five marketing kinds. */
const TEMPLATES: Array<{
  key: string;
  beats: Array<{ id: string; sel: string; yPad?: number }>;
}> = [
  {
    key: "archive",
    beats: [
      { id: "fold", sel: ".ds-register-ledger, .ds-hero .ds-plate-bleed, .ds-hero", yPad: 8 },
      { id: "entry", sel: ".ds-entry, [data-section='story']", yPad: 36 },
      { id: "registry", sel: ".ds-closing, .ds-closing-colophon, #cta", yPad: 24 },
    ],
  },
  {
    key: "observatory",
    beats: [
      { id: "fold", sel: ".ds-chrono-lattice, .ds-hero .ds-plate-bleed, .ds-hero", yPad: 8 },
      { id: "chrono", sel: ".ds-chrono, [data-section='story']", yPad: 36 },
      { id: "calibration", sel: ".ds-closing, .ds-cal-strip, #cta", yPad: 24 },
    ],
  },
  {
    key: "dossier",
    beats: [
      { id: "fold", sel: ".ds-folio-plate, .ds-hero .ds-plate-bleed, .ds-hero", yPad: 8 },
      { id: "spread", sel: ".ds-spread, [data-section='story']", yPad: 36 },
      { id: "imprint", sel: ".ds-closing, .ds-closing-colophon, #cta", yPad: 24 },
    ],
  },
  {
    key: "foundry",
    beats: [
      { id: "fold", sel: ".ds-seam-figure, .ds-hero .ds-plate-bleed, .ds-hero", yPad: 8 },
      { id: "marginalia", sel: ".ds-marginalia, [data-section='story']", yPad: 36 },
    ],
  },
  {
    key: "saas",
    beats: [
      { id: "fold", sel: ".ds-pipeline-field, .ds-hero-pipeline, .ds-hero", yPad: 8 },
      { id: "features", sel: "#features, [data-section='features']", yPad: 36 },
      { id: "proof", sel: "#proof, [data-section='proof']", yPad: 36 },
    ],
  },
  {
    key: "dashboard",
    beats: [
      { id: "fold", sel: ".ds-queue-field, .ds-hero-queue, .ds-hero", yPad: 8 },
      { id: "shell", sel: "#app, .ds-app-band, .ds-app", yPad: 20 },
      { id: "proof", sel: "#proof, [data-section='proof']", yPad: 36 },
    ],
  },
  {
    key: "corporate",
    beats: [
      { id: "fold", sel: ".ds-diligence-field, .ds-hero-diligence, .ds-hero", yPad: 8 },
      { id: "story", sel: "#story, [data-section='story']", yPad: 36 },
      { id: "proof", sel: "#proof, [data-section='proof']", yPad: 36 },
    ],
  },
  {
    key: "educational",
    beats: [
      { id: "fold", sel: ".ds-mechanism-stage, .ds-hero-mechanism, .ds-hero", yPad: 8 },
      { id: "scrub", sel: ".ds-mechanism-grid, #features", yPad: 28 },
      { id: "features", sel: "#features, [data-section='features']", yPad: 36 },
    ],
  },
  {
    key: "fintech",
    beats: [
      { id: "fold", sel: ".ds-wire-field, .ds-hero-wire, .ds-hero", yPad: 8 },
      { id: "features", sel: "#features, [data-section='features']", yPad: 36 },
      { id: "proof", sel: "#proof, [data-section='proof']", yPad: 36 },
    ],
  },
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
  await page.waitForTimeout(900);
  await shot(page, "01-showcase-featured");

  await page.locator("#reels, .sx-filmstrip").first().scrollIntoViewIfNeeded();
  await page
    .waitForSelector(".sx-filmstrip [data-ready='true']", { timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(600);
  await shot(page, "02-showcase-gallery");

  // ——— Full-bleed template craft ———
  for (const t of pages) {
    await page.goto(`http://127.0.0.1:4323/${t.key}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForSelector(".ds-hero, h1, [data-sitekind]", { timeout: 20_000 });
    await page.waitForTimeout(500);

    for (const beat of t.beats) {
      if (beat.id === "fold") {
        // Prefer figure-owned fold: scroll so ledger/lattice/plate is in the first viewport.
        const figOk = await scrollTo(page, beat.sel, beat.yPad ?? 8);
        if (!figOk) {
          await page.evaluate(() => {
            const nav = document.querySelector(".ds-nav");
            const h = nav ? Math.round((nav as HTMLElement).getBoundingClientRect().height) : 0;
            window.scrollTo(0, Math.max(0, h - 4));
          });
          await page.waitForTimeout(200);
        }
        // If still mostly claim, nudge further into the plate.
        const y = await page.evaluate(() => window.scrollY);
        if (y < 120) {
          const plate = await page.evaluate(() => {
            const el = document.querySelector(
              ".ds-register-ledger, .ds-chrono-lattice, .ds-folio-plate, .ds-seam-figure, .ds-plate-bleed",
            );
            if (!el) return null;
            return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - 48));
          });
          if (plate != null && plate > y) {
            await page.evaluate((top) => window.scrollTo(0, top), plate);
            await page.waitForTimeout(240);
          }
        }
      } else {
        const ok = await scrollTo(page, beat.sel, beat.yPad ?? 28);
        if (!ok) {
          console.warn(`[readme-shots] miss ${t.key}/${beat.id}`);
          continue;
        }
      }
      await shot(page, `${t.key}-${beat.id}`);
    }
  }

  await browser.close();
  server.close();
  console.log(`[readme-shots] wrote frames to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
