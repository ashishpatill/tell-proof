#!/usr/bin/env tsx
/**
 * Generic multipage domain capture — domain-agnostic walkthrough screenshots.
 *
 * Reads category seeds from research/boards.seeds.local.json (gitignored).
 * Writes under research/boards/<outDir>/refs/ (gitignored) — never commit hosts.
 *
 * Usage:
 *   pnpm exec tsx scripts/multipage-domain-capture.ts --domain sport-cricket --category sport-cricket-multipage
 *   pnpm exec tsx scripts/multipage-domain-capture.ts --domain saas-marketing --category saas-landing
 *
 * Env:
 *   TELL_CAPTURE_OUT   override output root under research/boards/
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import { CRICKET_CORE_SIX_ROUTES } from "../packages/design-skills/src/domain-research";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

type SeedPortal = {
  id: string;
  baseUrl: string;
  paths?: string[];
  label?: string;
};

type SeedsFile = {
  categories?: Record<string, SeedPortal[] | string[]>;
};

type CaptureTarget = "hero" | "mid" | "footer" | "mobile-nav" | "mobile-footer";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function defaultPathsForDomain(domain: string): string[] {
  if (domain.includes("cricket") || domain.includes("sport")) {
    return CRICKET_CORE_SIX_ROUTES.map((r) => {
      // Seed paths are relative to portal root — use route class stubs when no pack paths
      const stub: Record<string, string> = {
        home: "/",
        "live-match": "/live",
        scorecard: "/scorecard",
        series: "/series",
        rankings: "/rankings",
        notebook: "/news",
      };
      return stub[r.routeClass] ?? "/";
    });
  }
  return ["/", "/pricing"];
}

function normalizePortal(raw: SeedPortal | string, index: number): SeedPortal | null {
  if (typeof raw === "string") {
    try {
      const u = new URL(raw);
      return { id: `portal-${index + 1}`, baseUrl: u.origin, paths: [u.pathname || "/"] };
    } catch {
      return null;
    }
  }
  if (!raw?.baseUrl) return null;
  return {
    id: raw.id || `portal-${index + 1}`,
    baseUrl: raw.baseUrl.replace(/\/$/, ""),
    paths: raw.paths?.length ? raw.paths : undefined,
    label: raw.label,
  };
}

async function dismissBlockingOverlays(page: Page): Promise<void> {
  const candidates = [
    'button:has-text("CONFIRM")',
    'button:has-text("Confirm")',
    'button:has-text("OK")',
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("I Agree")',
    'button:has-text("Got it")',
    '[aria-label="Close"]',
    'button:has-text("×")',
  ];
  for (const sel of candidates) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 400 })) {
        await loc.click({ timeout: 1500 });
        await page.waitForTimeout(400);
      }
    } catch {
      /* try next */
    }
  }
  // Esc / click backdrop for stubborn CMPs
  try {
    await page.keyboard.press("Escape");
  } catch {
    /* ignore */
  }
}

async function shot(
  page: Page,
  outPath: string,
  target: CaptureTarget,
): Promise<void> {
  mkdirSync(dirname(outPath), { recursive: true });
  if (target === "hero") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: outPath, fullPage: false });
    return;
  }
  if (target === "mid") {
    await page.evaluate(() => window.scrollTo(0, Math.floor(document.body.scrollHeight * 0.4)));
    await page.screenshot({ path: outPath, fullPage: false });
    return;
  }
  if (target === "footer") {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: outPath, fullPage: false });
    return;
  }
  // mobile-nav / mobile-footer — viewport already mobile when called
  if (target === "mobile-nav") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: outPath, fullPage: false });
    return;
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: outPath, fullPage: false });
}

async function capturePortal(
  browser: Browser,
  portal: SeedPortal,
  paths: string[],
  outRoot: string,
): Promise<{ ok: number; fail: number; notes: string[] }> {
  const notes: string[] = [];
  let ok = 0;
  let fail = 0;
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const deskPage = await desktop.newPage();
  const mobPage = await mobile.newPage();

  for (let i = 0; i < paths.length; i++) {
    const pathPart = paths[i].startsWith("/") ? paths[i] : `/${paths[i]}`;
    const url = `${portal.baseUrl}${pathPart}`;
    const routeId = `route-${i + 1}`;
    const deskDir = join(outRoot, portal.id, "desktop", routeId);
    const mobDir = join(outRoot, portal.id, "mobile", routeId);

    try {
      const res = await deskPage.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      if (!res || res.status() >= 400) {
        notes.push(`${portal.id} ${pathPart} status=${res?.status() ?? "none"}`);
        fail++;
        continue;
      }
      await deskPage.waitForTimeout(1200);
      await dismissBlockingOverlays(deskPage);
      await deskPage.waitForTimeout(400);
      for (const t of ["hero", "mid", "footer"] as CaptureTarget[]) {
        await shot(deskPage, join(deskDir, `${t}.png`), t);
      }
      writeFileSync(
        join(deskDir, "meta.json"),
        JSON.stringify({ path: pathPart, capturedAt: new Date().toISOString() }, null, 2),
      );

      await mobPage.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await mobPage.waitForTimeout(1000);
      await dismissBlockingOverlays(mobPage);
      await mobPage.waitForTimeout(400);
      for (const t of ["mobile-nav", "mobile-footer"] as CaptureTarget[]) {
        await shot(mobPage, join(mobDir, `${t}.png`), t);
      }
      ok++;
    } catch (err) {
      fail++;
      notes.push(`${portal.id} ${pathPart}: ${(err as Error).message}`);
    }
  }

  await desktop.close();
  await mobile.close();
  return { ok, fail, notes };
}

async function main(): Promise<void> {
  const domain = argValue("--domain") ?? "sport-cricket";
  const category = argValue("--category") ?? "sport-cricket-multipage";
  const seedsPath =
    argValue("--seeds") ?? join(repoRoot, "research/boards.seeds.local.json");
  const outName =
    process.env.TELL_CAPTURE_OUT?.trim() ||
    argValue("--out") ||
    (domain.includes("cricket") ? "crease-multipage" : `${domain}-multipage`);
  const outRoot = join(repoRoot, "research/boards", outName, "refs");

  if (!existsSync(seedsPath)) {
    console.error(
      `Missing seeds at ${seedsPath}. Copy research/boards.seeds.local.example.json → boards.seeds.local.json and add portal baseUrl + paths (gitignored).`,
    );
    process.exit(1);
  }

  const seeds = JSON.parse(readFileSync(seedsPath, "utf8")) as SeedsFile;
  const rawList = seeds.categories?.[category] ?? [];
  const portals = rawList
    .map((r, i) => normalizePortal(r as SeedPortal | string, i))
    .filter((p): p is SeedPortal => Boolean(p));

  if (portals.length < 1) {
    console.error(`No portals in category "${category}". Add ≥1 (prefer ≥2) entries with baseUrl + paths.`);
    process.exit(1);
  }

  const defaultPaths = defaultPathsForDomain(domain);
  mkdirSync(outRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ledger: Record<string, unknown> = {
    domain,
    category,
    capturedAt: new Date().toISOString(),
    portals: [] as unknown[],
  };

  try {
    for (const portal of portals) {
      const paths = portal.paths?.length ? portal.paths : defaultPaths;
      console.log(`Capturing ${portal.id} × ${paths.length} paths → ${outRoot}/${portal.id}`);
      const result = await capturePortal(browser, portal, paths, outRoot);
      (ledger.portals as unknown[]).push({
        id: portal.id,
        pathCount: paths.length,
        ...result,
        // host omitted from ledger copy that may be committed — keep only in gitignored board
        hostPresent: true,
      });
      console.log(`  ok=${result.ok} fail=${result.fail}`);
      for (const n of result.notes) console.log(`  note: ${n}`);
    }
  } finally {
    await browser.close();
  }

  const ledgerPath = join(repoRoot, "research/boards", outName, "capture-ledger.json");
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`Wrote ledger → ${ledgerPath} (gitignored under research/boards/)`);
  console.log("Next: emit training episode + write anonymised findings to SPORT_SITE_VERNACULAR / DIRECTION.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
