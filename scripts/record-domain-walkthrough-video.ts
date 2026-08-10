#!/usr/bin/env tsx
/** Local-only walkthrough video for videoReview (gitignored under research/boards/). */
import { mkdirSync, renameSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

async function dismiss(page: Page) {
  for (const sel of [
    'button:has-text("CONFIRM")',
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    '[aria-label="Close"]',
  ]) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 500 })) await loc.click({ timeout: 1500 });
    } catch {
      /* next */
    }
  }
  try {
    await page.keyboard.press("Escape");
  } catch {
    /* ignore */
  }
}

async function main() {
  const outDir = "/workspace/research/boards/crease-multipage/video";
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const stops = [
    "https://www.cricket.com.au/",
    "https://www.cricket.com.au/matches",
    "https://www.cricket.com.au/series",
    "https://www.cricket.com.au/news",
    "https://www.icc-cricket.com/",
    "https://www.icc-cricket.com/rankings/team-rankings/mens/test",
    "https://www.icc-cricket.com/news",
  ];
  for (const u of stops) {
    await page.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(800);
    await dismiss(page);
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollBy(0, 420));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
  }
  await context.close();
  await browser.close();
  const files = readdirSync(outDir).filter((f) => f.endsWith(".webm"));
  if (files[0]) {
    renameSync(join(outDir, files[0]), join(outDir, "walkthrough.webm"));
    console.log("Wrote", join(outDir, "walkthrough.webm"));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
