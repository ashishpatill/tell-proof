/**
 * Playwright-driven product demo for README media.
 * Follows USER_STORY.md / tell-demo-script 5 beats, then a short Studio + Showcase coda.
 *
 * Usage (servers already up, from repo root):
 *   pnpm exec tsx scripts/record-readme-demo.ts
 *   pnpm record:readme-demo
 */
import { chromium, type Page } from "playwright";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

/** Always resolve from this file so cwd (e.g. package exec) cannot misplace media. */
const REPO_ROOT = path.resolve(__dirname, "..");
const BASE = process.env.TELL_E2E_BASE ?? "http://127.0.0.1:3000";
const FIXTURE = process.env.TELL_FIXTURE_URL ?? "http://127.0.0.1:3001";
const OUT_DIR = path.join(REPO_ROOT, "docs/media");
const TMP_DIR = "/tmp/tell-readme-demo";
const ARTIFACTS_DIR = "/opt/cursor/artifacts";

async function pause(page: Page, ms = 1600) {
  await page.waitForTimeout(ms);
}

async function injectDemoChrome(page: Page) {
  await page.evaluate(() => {
    if (document.getElementById("tell-demo-chrome")) return;
    const style = document.createElement("style");
    style.id = "tell-demo-chrome";
    style.textContent = `
      #tell-demo-caption {
        position: fixed;
        left: 28px;
        right: 28px;
        bottom: 22px;
        z-index: 2147483646;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 720px;
        padding: 12px 16px 14px;
        border: 1px solid rgba(212, 113, 74, 0.35);
        background: rgba(24, 22, 20, 0.88);
        color: #f3ede4;
        font-family: "Source Sans 3", "Source Sans Pro", ui-sans-serif, system-ui, sans-serif;
        box-shadow: 0 12px 40px rgba(24, 22, 20, 0.35);
      }
      #tell-demo-caption .beat {
        font-family: ui-monospace, "IBM Plex Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #e8926f;
      }
      #tell-demo-caption .line {
        font-family: "Instrument Serif", "Iowan Old Style", Georgia, serif;
        font-size: 22px;
        line-height: 1.25;
        color: #faf7f2;
      }
      #tell-demo-title {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        background: #181614;
        color: #faf7f2;
        text-align: center;
        padding: 48px;
        pointer-events: auto;
      }
      #tell-demo-title[hidden] {
        display: none !important;
        pointer-events: none !important;
      }
      #tell-demo-title .kicker {
        font-family: ui-monospace, "IBM Plex Mono", monospace;
        font-size: 12px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #e8926f;
        margin-bottom: 18px;
      }
      #tell-demo-title h1 {
        font-family: "Instrument Serif", "Iowan Old Style", Georgia, serif;
        font-size: 52px;
        font-weight: 400;
        line-height: 1.1;
        margin: 0;
      }
      #tell-demo-title .sub {
        margin-top: 18px;
        font-family: "Source Sans 3", "Source Sans Pro", ui-sans-serif, system-ui, sans-serif;
        font-size: 18px;
        color: #d4c9ba;
        max-width: 36rem;
        margin-left: auto;
        margin-right: auto;
      }
    `;
    document.documentElement.appendChild(style);
    const caption = document.createElement("div");
    caption.id = "tell-demo-caption";
    caption.innerHTML = `<div class="beat"></div><div class="line"></div>`;
    caption.hidden = true;
    document.documentElement.appendChild(caption);
  });
}

async function setCaption(page: Page, beat: string, line: string) {
  await injectDemoChrome(page);
  await page.evaluate(
    ({ beat, line }) => {
      const el = document.getElementById("tell-demo-caption");
      if (!el) return;
      el.hidden = false;
      const beatEl = el.querySelector(".beat");
      const lineEl = el.querySelector(".line");
      if (beatEl) beatEl.textContent = beat;
      if (lineEl) lineEl.textContent = line;
    },
    { beat, line },
  );
}

async function hideCaption(page: Page) {
  await page.evaluate(() => {
    const el = document.getElementById("tell-demo-caption");
    if (el) el.hidden = true;
  });
}

async function showTitle(page: Page, kicker: string, title: string, sub: string) {
  await injectDemoChrome(page);
  await page.evaluate(
    ({ kicker, title, sub }) => {
      let el = document.getElementById("tell-demo-title");
      if (!el) {
        el = document.createElement("div");
        el.id = "tell-demo-title";
        document.documentElement.appendChild(el);
      }
      el.innerHTML = `<div class="kicker"></div><h1></h1><p class="sub"></p>`;
      el.querySelector(".kicker")!.textContent = kicker;
      el.querySelector("h1")!.textContent = title;
      el.querySelector(".sub")!.textContent = sub;
      el.hidden = false;
    },
    { kicker, title, sub },
  );
}

async function hideTitle(page: Page) {
  await page.evaluate(() => {
    document.getElementById("tell-demo-title")?.remove();
  });
}

async function maybeClick(page: Page, locator: ReturnType<Page["locator"]>, ms = 400) {
  if (await locator.count()) {
    await locator.first().click({ timeout: 4000, force: true }).catch(() => {});
    await pause(page, ms);
    return true;
  }
  return false;
}

async function loadReport(page: Page) {
  if (!page.url().startsWith(BASE)) {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  }
  await injectDemoChrome(page);
  await setCaption(page, "1 · Setup", "Shipped in a weekend with AI. Looks familiar.");
  await pause(page, 2200);

  const liveUrlMode = page.getByRole("button", { name: /live url/i });
  if (await liveUrlMode.count()) {
    const already = await liveUrlMode.first().getAttribute("data-active");
    if (already !== "true") {
      await liveUrlMode.click();
      await pause(page, 500);
    }
  }

  const composer = page.locator("textarea.tell-composer__input, [data-testid='capture-url']").first();
  await composer.click({ clickCount: 3 });
  await composer.fill("");
  await composer.pressSequentially(FIXTURE, { delay: 28 });
  await pause(page, 700);

  await setCaption(page, "2 · Capture", "Tell reads the rendered page - not the repo.");
  const captureBtn = page
    .locator(".tell-composer__submit, [data-testid='capture-submit']")
    .or(page.getByRole("button", { name: /capture|set up|diagnose|start/i }))
    .first();
  await captureBtn.click();

  const findingsReady = page.getByText(/SystemFontTell|finding|generic|drift/i).first();
  const foundLive = await findingsReady.waitFor({ timeout: 90_000 }).then(() => true).catch(() => false);

  if (!foundLive) {
    await setCaption(page, "2 · Capture", "Live capture timed out - loading the committed fixture.");
    const offline = page.getByRole("button", { name: /offline fixture/i });
    if (await offline.count()) {
      await offline.click();
      await pause(page, 400);
      await captureBtn.click();
      await findingsReady.waitFor({ timeout: 20_000 }).catch(() => {});
    } else {
      const fallback = page.getByRole("button", { name: /load offline fixture/i });
      await maybeClick(page, fallback, 800);
      await findingsReady.waitFor({ timeout: 20_000 }).catch(() => {});
    }
  }

  await pause(page, 1800);
  await setCaption(page, "2 · Diagnose", "Named tells. Evidence on the real surface.");
  await pause(page, 1800);

  await setCaption(page, "3 · Taste", "SystemFontTell - Inter on every role. The default AI type stack.");
  const systemFont = page.getByRole("button", { name: /SystemFontTell/i }).first();
  if (await systemFont.count()) {
    await systemFont.click();
    await pause(page, 2400);
  }

  const brutalistFinding = page.getByRole("button", { name: /AcidAccentTell|EmojiChromeTell|CenteredEverythingTell/i }).first();
  if (await brutalistFinding.count()) {
    await setCaption(page, "3 · Taste", "Generic vs drift - named, evidenced, not a vibe check.");
    await brutalistFinding.click();
    await pause(page, 1400);
    if (await systemFont.count()) await systemFont.click();
    await pause(page, 800);
  }

  await setCaption(page, "4 · Before / after", "Drag the seam. Contrast floor stays readable.");
  const seam = page.locator('[aria-label*="seam" i], .seam-handle').first();
  if (await seam.count()) {
      await seam.scrollIntoViewIfNeeded().catch(() => {});
      await pause(page, 400);
      const box = await seam.boundingBox();
    if (box) {
      const y = box.y + box.height / 2;
      const x = box.x + box.width / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x - 280, y, { steps: 24 });
      await pause(page, 1100);
      await page.mouse.move(x + 240, y, { steps: 24 });
      await pause(page, 1100);
      await page.mouse.move(x, y, { steps: 16 });
      await page.mouse.up();
      await pause(page, 1400);
    }
  }

  await setCaption(page, "5 · Voice", "Warmer, more editorial, less shadow.");
  const voice = page.getByPlaceholder(/warmer, more editorial/i).first();
  if (await voice.count()) {
    await voice.scrollIntoViewIfNeeded().catch(() => {});
    await voice.click({ clickCount: 3 });
    await voice.fill("");
    await voice.pressSequentially("Warmer, more editorial, less shadow.", { delay: 24 });
    await pause(page, 1600);
  }
  const editorial = page.getByRole("button", { name: /^editorial$/i }).first();
  await maybeClick(page, editorial, 1400);

  await setCaption(page, "5 · Reconcile", "Draft the fix. Human applies it in Cursor.");
  const draft = page.getByRole("button", { name: /draft fix|plan source fix/i }).first();
  if (await draft.count()) {
    await draft.click();
    await page.getByText(/copy patch|send to cursor|deterministic patch|source-grounded/i).first().waitFor({ timeout: 45_000 }).catch(() => {});
    await pause(page, 1800);
    await maybeClick(page, page.getByRole("button", { name: /send to cursor/i }), 1200);
  }
}

async function studioCoda(page: Page) {
  await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
  await injectDemoChrome(page);
  await setCaption(page, "Studio", "Author a distinctive layout from a feature brief - not another generic kit.");
  const existingPreview = page.getByTestId("preview-frame");
  if (await existingPreview.count()) {
    await pause(page, 1400);
  }

  await page.getByTestId("input-sitekind").selectOption("saas-marketing");
  await page.getByTestId("taste-lean").selectOption("refined-story");
  await page.getByTestId("btn-generate").click();
  await page.getByTestId("preview-frame").waitFor({ timeout: 45_000 });
  await pause(page, 2200);

  await page.getByTestId("input-magic").fill("warmer editorial landing, less shadow, no violet");
  await page.getByTestId("btn-magic").click();
  await pause(page, 2200);
  await page.getByTestId("viewport-mobile").click();
  await pause(page, 1400);
  await page.getByTestId("viewport-desktop").click();
  await pause(page, 1400);
}

async function showcaseCoda(page: Page) {
  await page.goto(`${BASE}/showcase`, { waitUntil: "domcontentloaded" });
  await injectDemoChrome(page);
  await setCaption(page, "Specimens", "Nineteen offerings. Distinct fold grammar - not one restyled kit.");
  await page
    .locator('[data-testid="showcase-featured-preview"][data-ready="true"]')
    .waitFor({ timeout: 45_000 })
    .catch(() => {});
  await pause(page, 2400);
  const filmstrip = page.locator("#reels, .sx-filmstrip").first();
  if (await filmstrip.count()) {
    await filmstrip.scrollIntoViewIfNeeded().catch(() => {});
    await pause(page, 1600);
  }
  await page.goto(`${BASE}/showcase/lantern`, { waitUntil: "domcontentloaded" });
  await injectDemoChrome(page);
  await setCaption(page, "Close", "Tell runs on itself: zero tells.");
  await page.getByTestId("showcase-frame").waitFor({ timeout: 20_000 }).catch(() => {});
  await pause(page, 2200);
}

async function encodeOutputs(raw: string) {
  const mp4Out = path.join(OUT_DIR, "tell-proof-demo.mp4");
  const posterOut = path.join(OUT_DIR, "tell-proof-demo-poster.webp");

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
      "-crf",
      "23",
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

  const poster = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      "14",
      "-i",
      mp4Out,
      "-frames:v",
      "1",
      "-vf",
      "scale=1100:-2:flags=lanczos",
      "-c:v",
      "libwebp",
      "-quality",
      "82",
      "-compression_level",
      "6",
      posterOut,
    ],
    { encoding: "utf8" },
  );
  if (poster.status !== 0) {
    console.error(poster.stderr);
    throw new Error("ffmpeg poster webp failed");
  }

  await mkdir(ARTIFACTS_DIR, { recursive: true });
  spawnSync("cp", ["-f", mp4Out, path.join(ARTIFACTS_DIR, "tell-product-demo.mp4")]);
  spawnSync("cp", ["-f", mp4Out, path.join(ARTIFACTS_DIR, "tell-proof-demo.mp4")]);
  spawnSync("cp", ["-f", posterOut, path.join(ARTIFACTS_DIR, "tell-proof-demo-poster.webp")]);

  console.log("Wrote", mp4Out);
  console.log("Wrote", posterOut);
}

async function main() {
  await mkdir(TMP_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: { dir: TMP_DIR, size: { width: 1280, height: 800 } },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await showTitle(
      page,
      "Tell Proof",
      "Every AI-built UI has a tell.",
      "Capture the rendered page. Name what is generic. Art-direct a direction. Apply the fix in Cursor.",
    );
    await pause(page, 2800);
    await hideTitle(page);

    await loadReport(page);
    await studioCoda(page);
    await showcaseCoda(page);

    await hideCaption(page);
    await showTitle(
      page,
      "Ashish's loop",
      "Capture → name → seam → voice → Cursor.",
      "Tell runs on itself: zero tells.",
    );
    await pause(page, 2600);
    await hideTitle(page);
  } finally {
    await context.close();
    await browser.close();
  }

  const files = (await readdir(TMP_DIR)).filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
  if (!files.length) throw new Error("No Playwright video produced");
  const raw = path.join(TMP_DIR, files[0]!);
  await encodeOutputs(raw);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
