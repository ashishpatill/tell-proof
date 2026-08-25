/**
 * Measured shell contrast probe — do not ship chrome on vision alone.
 *
 * Samples computed colors from the product sidebar and fails if text/background
 * WCAG contrast is below 4.5:1.
 *
 *   pnpm eye:shell
 *
 * Closes `chrome:rail-ghost-contrast`.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.TELL_WEB_URL ?? "http://127.0.0.1:3000";
const FLOOR = 4.5;

type Rgb = { r: number; g: number; b: number; a: number };

function parseCssColor(input: string): Rgb | null {
  const s = input.trim();
  const m = s.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:(?:\s*,\s*|\s*\/\s*)([\d.]+%?))?\s*\)$/i,
  );
  if (!m) return null;
  const aRaw = m[4];
  const a =
    aRaw === undefined ? 1 : aRaw.endsWith("%") ? Number(aRaw.slice(0, -1)) / 100 : Number(aRaw);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
}

function srgbToLin(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function composite(fg: Rgb, bg: Rgb): Rgb {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

type RawSample = { label: string; color: string; backgrounds: string[] };

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = `${BASE}/showcase`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForSelector('[data-testid="product-sidebar"]', { timeout: 30_000 });

  const raw = (await page.$eval('[data-testid="product-sidebar"]', (root) => {
    const sels =
      ".tell-rail__brand-name, .tell-rail__brand-meta, .tell-rail__label, .tell-rail__section-label, .tell-rail__link";
    const nodes = Array.from(root.querySelectorAll(sels));
    return nodes.map((el) => {
      const cs = getComputedStyle(el);
      const backgrounds: string[] = [];
      let node: Element | null = el;
      while (node) {
        backgrounds.push(getComputedStyle(node).backgroundColor);
        node = node.parentElement;
      }
      return {
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 48),
        color: cs.color,
        backgrounds,
      };
    });
  })) as RawSample[];

  try {
    mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/eye-shell-contrast-showcase.png",
      fullPage: false,
    });
  } catch {
    // Artifact dir is optional outside Cursor Cloud.
  }
  await browser.close();

  if (!raw.length) {
    console.error("eye:shell FAIL - no sidebar text samples found");
    process.exit(1);
  }

  const fails: { label: string; ratio: number; fg: string; bg: string }[] = [];
  console.log(`eye:shell ${url} - ${raw.length} samples, floor ${FLOOR}:1`);

  for (const sample of raw) {
    const fg = parseCssColor(sample.color);
    if (!fg) continue;
    let bg: Rgb = { r: 255, g: 255, b: 255, a: 1 };
    const stack: Rgb[] = [];
    for (const b of sample.backgrounds) {
      const parsed = parseCssColor(b);
      if (parsed && parsed.a > 0.01) stack.push(parsed);
      if (parsed && parsed.a >= 0.99) break;
    }
    for (let i = stack.length - 1; i >= 0; i -= 1) bg = composite(stack[i]!, bg);
    const painted = composite(fg, bg);
    const ratio = contrastRatio(painted, bg);
    const mark = ratio >= FLOOR ? "ok" : "FAIL";
    const bgCss = `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`;
    console.log(`  [${mark}] ${ratio.toFixed(2)}:1  "${sample.label}"  fg=${sample.color}  bg=${bgCss}`);
    if (ratio < FLOOR) fails.push({ label: sample.label, ratio, fg: sample.color, bg: bgCss });
  }

  if (fails.length) {
    console.error(
      `\neye:shell FAIL - ${fails.length} sample(s) under ${FLOOR}:1 (chrome:rail-ghost-contrast)`,
    );
    process.exit(1);
  }
  console.log("eye:shell PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
