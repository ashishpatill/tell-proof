/**
 * Harsh eye capture — desktop + mobile for every offering + showcase.
 * Usage: pnpm -F @tell/core exec tsx ../../scripts/eye-templates.ts
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { designFromFeatures, getTemplate, listTemplates } from "../packages/design-skills/src/index";

const OUT = "/opt/cursor/artifacts/screenshots";
const BASE = process.env.TELL_WEB_URL ?? "http://127.0.0.1:3000";

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const t of listTemplates()) {
    const html = designFromFeatures(t.brief).previewHtml;
    for (const vp of [
      { w: 1440, h: 900 },
      { w: 390, h: 844 },
    ]) {
      const page = await browser.newPage({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: 1,
      });
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.waitForTimeout(350);
      await page.screenshot({ path: resolve(OUT, `eye-${t.key}-fold-${vp.w}.png`) });
      await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 0.95)));
      await page.waitForTimeout(250);
      await page.screenshot({ path: resolve(OUT, `eye-${t.key}-mid-${vp.w}.png`) });
      // third beat deeper
      await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 2.1)));
      await page.waitForTimeout(250);
      await page.screenshot({ path: resolve(OUT, `eye-${t.key}-deep-${vp.w}.png`) });
      await page.close();
      console.log(`html ${t.key} @${vp.w}`);
    }
  }

  for (const path of ["showcase", "showcase/educational", "showcase/archive"]) {
    for (const vp of [
      { w: 1440, h: 900 },
      { w: 390, h: 844 },
    ]) {
      const page = await browser.newPage({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      await page.goto(`${BASE}/${path}`, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(1400);
      const slug = path.replace("/", "-");
      await page.screenshot({ path: resolve(OUT, `eye-page-${slug}-fold-${vp.w}.png`) });
      await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.9)));
      await page.waitForTimeout(700);
      await page.screenshot({ path: resolve(OUT, `eye-page-${slug}-scroll-${vp.w}.png`) });
      await page.close();
      console.log(`page ${path} @${vp.w}`);
    }
  }

  await browser.close();
  console.log("eye done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
