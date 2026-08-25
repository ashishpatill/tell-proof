/**
 * Capture README loop stills under docs/media/step-*.webp.
 * Requires web on :3000 and fixture on :3001.
 *
 *   step-capture.webp
 *   step-detect.webp
 *   step-art-direct.webp
 *   step-repair.webp
 *   step-prove.webp
 */
import { chromium, type Page } from "playwright";
import { spawnSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.TELL_E2E_BASE ?? "http://127.0.0.1:3000";
const FIXTURE = process.env.TELL_FIXTURE_URL ?? "http://127.0.0.1:3001";
const OUT = resolve(__dirname, "../docs/media");

function toWebp(png: string, webp: string, maxw = 1100) {
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
  if (r.status !== 0) throw new Error(r.stderr || "ffmpeg");
  unlinkSync(png);
  console.log("wrote", webp);
}

async function shot(page: Page, name: string): Promise<void> {
  const png = resolve(OUT, `${name}.png`);
  await page.screenshot({ path: png, type: "png" });
  toWebp(png, resolve(OUT, `${name}.webp`));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1200);
  const liveUrlMode = page.getByRole("button", { name: /live url/i });
  if (await liveUrlMode.count()) {
    await liveUrlMode.click();
    await page.waitForTimeout(400);
  }
  const composer = page.locator("textarea.tell-composer__input, [data-testid='capture-url']").first();
  await composer.waitFor({ timeout: 20_000 });
  await composer.click({ clickCount: 3 });
  await composer.fill(FIXTURE);
  await page.waitForTimeout(600);
  await shot(page, "step-capture");

  const captureBtn = page
    .locator(".tell-composer__submit, [data-testid='capture-submit']")
    .or(page.getByRole("button", { name: /capture|set up|diagnose|start/i }))
    .first();
  await captureBtn.click();
  await page
    .locator("text=Capturing rendered surface")
    .first()
    .waitFor({ state: "hidden", timeout: 90_000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /share/i })
    .first()
    .waitFor({ timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, "step-detect");

  const direction = page.getByPlaceholder(/warmer, more editorial/i);
  await direction.waitFor({ timeout: 20_000 });
  await direction.fill("Warmer, more editorial, less shadow");
  const editorial = page.getByRole("button", { name: /^editorial$/i }).first();
  if (await editorial.count()) {
    await editorial.click();
  }
  await page.waitForTimeout(900);
  await direction.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, "step-art-direct");

  const draft = page.getByRole("button", { name: /draft fix|plan source fix/i }).first();
  await draft.click();
  await page
    .getByRole("button", { name: /copy patch/i })
    .waitFor({ timeout: 60_000 });
  await page.waitForTimeout(600);
  const diff = page.locator("pre").filter({ has: page.locator("code") }).first();
  if (await diff.count()) {
    await diff.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
  }
  await shot(page, "step-repair");

  const more = page.getByText(/more — brand dna/i).first();
  if (await more.count()) {
    await more.click();
    await page.waitForTimeout(400);
  }
  const seam = page.locator(".seam-frame").first();
  if (await seam.count()) {
    await seam.scrollIntoViewIfNeeded();
    await seam.dblclick();
    await page.waitForTimeout(400);
  }
  await shot(page, "step-prove");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
