/**
 * Playwright-driven product demo for README media.
 * Usage (servers already up, from repo root):
 *   pnpm exec tsx scripts/record-readme-demo.ts
 */
import { chromium, type Page } from "playwright";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.TELL_E2E_BASE ?? "http://127.0.0.1:3000";
const FIXTURE = process.env.TELL_FIXTURE_URL ?? "http://127.0.0.1:3001";
const OUT_DIR = path.join(REPO_ROOT, "docs/media");
const TMP_DIR = "/tmp/tell-readme-demo";
const ARTIFACTS_DIR = "/opt/cursor/artifacts";

async function pause(page: Page, ms = 1600) {
  await page.waitForTimeout(ms);
}

async function main() {
  await mkdir(TMP_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: { dir: TMP_DIR, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  try {
    // 1) Tell Report capture loop
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await pause(page, 1800);
    const urlInput = page.locator('input[type="url"], input[placeholder*="http"], input').first();
    await urlInput.click({ clickCount: 3 });
    await urlInput.fill(FIXTURE);
    await pause(page, 900);
    const captureBtn = page.getByRole("button", { name: /capture|set up|diagnose/i }).first();
    await captureBtn.click();
    await page.getByText(/finding|generic|drift|tell/i).first().waitFor({ timeout: 90_000 }).catch(() => {});
    await pause(page, 2200);
    await page.mouse.wheel(0, 700);
    await pause(page, 1800);
    await page.mouse.wheel(0, 700);
    await pause(page, 1600);
    // try seam drag if present
    const seam = page.locator('[data-testid*="seam"], .seam-handle, [aria-label*="seam" i]').first();
    if (await seam.count()) {
      const box = await seam.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, { steps: 12 });
        await pause(page, 900);
        await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 12 });
        await page.mouse.up();
        await pause(page, 1200);
      }
    }
    // art-direction chip if present
    const chip = page.getByRole("button", { name: /editorial|warmer|precision|explainer|bold/i }).first();
    if (await chip.count()) {
      await chip.click().catch(() => {});
      await pause(page, 1600);
    }

    // 2) Studio create / redesign / magic / viewport
    await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("studio-frame").waitFor({ timeout: 30_000 });
    await pause(page, 2000);
    for (const preset of ["dashboard", "corporate", "educational", "saas"] as const) {
      await page.getByTestId(`preset-${preset}`).click();
      await page.waitForTimeout(2200);
    }
    await page.getByTestId("taste-lean").selectOption("minimal-clean");
    await page.getByTestId("taste-motion").selectOption("none");
    await page.getByTestId("btn-generate").click();
    await page.waitForTimeout(2200);
    await page.getByTestId("input-magic").fill("redesign as dashboard workspace, minimal-clean, no motion");
    await page.getByTestId("btn-magic").click();
    await page.waitForTimeout(2400);
    await page.getByTestId("viewport-390").click();
    await pause(page, 1600);
    await page.getByTestId("viewport-1280").click();
    await pause(page, 1600);

    // 3) Showcases
    await page.goto(`${BASE}/showcase/saas`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("showcase-frame").waitFor({ timeout: 20_000 });
    await pause(page, 2200);
    await page.goto(`${BASE}/showcase/educational`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("showcase-frame").waitFor({ timeout: 20_000 });
    await pause(page, 2400);
    await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("studio-frame").waitFor({ timeout: 20_000 });
    await pause(page, 2200);
  } finally {
    await context.close();
    await browser.close();
  }

  const files = (await readdir(TMP_DIR)).filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
  if (!files.length) throw new Error("No Playwright video produced");
  const raw = path.join(TMP_DIR, files[0]!);
  const mp4Out = path.join(OUT_DIR, "tell-proof-demo.mp4");
  const gifOut = path.join(OUT_DIR, "tell-proof-demo.gif");

  // Normalize to H.264 mp4 + compact gif for README
  const mp4 = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      raw,
      "-vf",
      "scale=1280:-2:flags=lanczos,fps=20",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4Out,
    ],
    { encoding: "utf8" },
  );
  if (mp4.status !== 0) {
    console.error(mp4.stderr);
    throw new Error("ffmpeg mp4 failed");
  }

  const gif = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      mp4Out,
      "-vf",
      "fps=10,scale=880:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
      "-loop",
      "0",
      gifOut,
    ],
    { encoding: "utf8" },
  );
  if (gif.status !== 0) {
    console.error(gif.stderr);
    throw new Error("ffmpeg gif failed");
  }

  await mkdir(ARTIFACTS_DIR, { recursive: true });
  spawnSync("cp", ["-f", mp4Out, path.join(ARTIFACTS_DIR, "tell-proof-demo.mp4")]);
  spawnSync("cp", ["-f", gifOut, path.join(ARTIFACTS_DIR, "tell-proof-demo.gif")]);

  console.log("Wrote", mp4Out);
  console.log("Wrote", gifOut);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
