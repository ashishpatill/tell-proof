/**
 * Agency-quality site pipeline — article phases as a runnable Cursor loop.
 *
 * Phase 1: capture up to 3 reference boards (URLs from gitignored boards.local.json)
 * Phase 2: constrained designFromFeatures build
 * Phase 3a–3c: typography → spacing → motion polish (axis-isolated)
 * Phase 3d: mobile 375 screenshots + horizontal-scroll gate
 * Phase 4: ledger + copy craft shots to artifacts
 *
 * Usage:
 *   pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/lensroom.json
 *   pnpm agency:pipeline -- --brief … --skip-refs
 */
import { createServer } from "node:http";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { chromium, type Page } from "playwright";
import {
  DesignBrief,
  designFromFeatures,
  assertBasics,
  assertAgencyDelivery,
  applyAgencyPolish,
  type AgencyPolishAxis,
} from "../../packages/design-skills/src/index";

function repoRoot(from = process.cwd()): string {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

const root = repoRoot();

type BoardsLocal = {
  runId?: string;
  refs?: Array<{ id: string; url: string; note?: string }>;
};

type LedgerRow = {
  phase: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  shots?: string[];
};

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

async function shotSet(
  page: Page,
  outDir: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  const fold = resolve(outDir, `${prefix}-fold.png`);
  const full = resolve(outDir, `${prefix}-full.png`);
  await page.screenshot({ path: fold });
  paths.push(fold);
  await page.screenshot({ path: full, fullPage: true });
  paths.push(full);
  const height = await page.evaluate(() => document.body.scrollHeight);
  const vh = 900;
  let slice = 0;
  for (let y = 0; y < Math.min(height, vh * 4); y += Math.floor(vh * 0.85)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
    const p = resolve(outDir, `${prefix}-s${slice}.png`);
    await page.screenshot({ path: p });
    paths.push(p);
    slice += 1;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return paths;
}

async function captureRefs(
  refs: NonNullable<BoardsLocal["refs"]>,
  outDir: string,
  ledger: LedgerRow[],
): Promise<void> {
  if (refs.length === 0) {
    ledger.push({
      phase: "1-refs",
      status: "skip",
      detail: "No refs in boards.local.json — using measured corridor fallback / subject vernacular.",
    });
    return;
  }
  const browser = await chromium.launch();
  const shots: string[] = [];
  const failures: string[] = [];
  const picked = refs.slice(0, 3);
  for (const ref of picked) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    try {
      await page.goto(ref.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(1200);
      const title = (await page.title()).toLowerCase();
      const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 400).toLowerCase();
      if (
        title.includes("access denied") ||
        bodyText.includes("access denied") ||
        bodyText.includes("just a moment") ||
        bodyText.includes("cf-browser-verification")
      ) {
        failures.push(`${ref.id}: bot wall`);
        await context.close();
        continue;
      }
      const hero = resolve(outDir, `${ref.id}-hero.png`);
      await page.screenshot({ path: hero });
      shots.push(hero);
      await page.evaluate(() => window.scrollTo(0, Math.floor(window.innerHeight * 1.2)));
      await page.waitForTimeout(400);
      const mid = resolve(outDir, `${ref.id}-mid.png`);
      await page.screenshot({ path: mid });
      shots.push(mid);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const footer = resolve(outDir, `${ref.id}-footer.png`);
      await page.screenshot({ path: footer });
      shots.push(footer);
    } catch (err) {
      failures.push(`${ref.id}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
  const ok = shots.length >= 6 && failures.length === 0;
  ledger.push({
    phase: "1-refs",
    status: ok ? "pass" : shots.length > 0 ? "pass" : "fail",
    detail: ok
      ? `Captured ${shots.length} reference frames from ${picked.length} sites. Match type/spacing/motion — do not copy layouts.`
      : shots.length > 0
        ? `Partial board: ${shots.length} frames; issues: ${failures.join("; ") || "none"}. Continue with captured refs + corridor fallback.`
        : `No reference frames captured. ${failures.join("; ")}`,
    shots,
  });
}

async function main(): Promise<void> {
  const briefPath = argValue("--brief");
  if (!briefPath) {
    console.error("Usage: pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/<id>.json");
    process.exit(1);
  }
  const skipRefs = process.argv.includes("--skip-refs");
  const absBrief = resolve(root, briefPath);
  const briefJson = JSON.parse(readFileSync(absBrief, "utf8"));
  const brief = DesignBrief.parse(briefJson);
  const runId = basename(briefPath, ".json");
  const outDir = resolve(root, "research/boards", runId);
  mkdirSync(outDir, { recursive: true });
  const artifactDir = "/opt/cursor/artifacts/screenshots";
  mkdirSync(artifactDir, { recursive: true });

  const ledger: LedgerRow[] = [];
  const boardsLocalPath = resolve(root, "research/boards.local.json");
  let boardsLocal: BoardsLocal = {};
  if (existsSync(boardsLocalPath)) {
    boardsLocal = JSON.parse(readFileSync(boardsLocalPath, "utf8")) as BoardsLocal;
  }

  // Phase 1
  if (!skipRefs) {
    await captureRefs(boardsLocal.refs ?? [], outDir, ledger);
  } else {
    ledger.push({ phase: "1-refs", status: "skip", detail: "--skip-refs" });
  }

  // Phase 2 — constrained build
  const built = designFromFeatures(brief);
  let html = built.previewHtml;
  const basics = assertBasics(built.spec, html);
  const delivery = assertAgencyDelivery(built.spec, html);
  writeFileSync(resolve(outDir, "phase2-build.html"), html, "utf8");
  ledger.push({
    phase: "2-build",
    status: basics.passed && delivery.passed ? "pass" : "fail",
    detail: `basics=${basics.passed} delivery=${delivery.passed}; failed=${[...basics.findings, ...delivery.findings]
      .filter((f) => !f.ok)
      .map((f) => f.id)
      .join(",") || "none"}`,
  });
  if (!basics.passed || !delivery.passed) {
    console.error("Phase 2 gates failed", ledger.at(-1));
  }

  const browser = await chromium.launch();
  const serveHtml = { current: html };
  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(serveHtml.current);
  });
  await new Promise<void>((r) => server.listen(4331, "127.0.0.1", r));

  async function openDesktop(): Promise<Page> {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4331/", { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(400);
    return page;
  }

  // Phase 2 screenshots
  {
    const page = await openDesktop();
    const shots = await shotSet(page, outDir, "phase2");
    for (const s of shots.slice(0, 2)) {
      copyFileSync(s, resolve(artifactDir, `agency-${runId}-${basename(s)}`));
    }
    ledger.push({
      phase: "2-shots",
      status: "pass",
      detail: "Desktop fold + scroll slices after constrained build.",
      shots,
    });
    await page.context().close();
  }

  // Phase 3a–3c — axis-isolated polish
  const axes: AgencyPolishAxis[] = ["typography", "spacing", "motion"];
  for (const axis of axes) {
    html = applyAgencyPolish(html, axis);
    serveHtml.current = html;
    writeFileSync(resolve(outDir, `phase3-${axis}.html`), html, "utf8");
    const page = await openDesktop();
    const shots = await shotSet(page, outDir, `phase3-${axis}`);
    copyFileSync(shots[0]!, resolve(artifactDir, `agency-${runId}-phase3-${axis}-fold.png`));
    const gate = assertAgencyDelivery(built.spec, html, { requirePolishAxes: false });
    ledger.push({
      phase: `3-${axis}`,
      status: gate.passed ? "pass" : "fail",
      detail: `Applied ${axis}-only polish. Touch nothing else.`,
      shots,
    });
    await page.context().close();
  }

  // Final delivery gate requiring all polish axes
  const finalDelivery = assertAgencyDelivery(built.spec, html, { requirePolishAxes: true });
  ledger.push({
    phase: "3-delivery",
    status: finalDelivery.passed ? "pass" : "fail",
    detail: finalDelivery.findings.filter((f) => !f.ok).map((f) => f.id).join(",") || "all agency delivery gates green",
  });

  // Phase 3d — mobile 375
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    serveHtml.current = html;
    await page.goto("http://127.0.0.1:4331/", { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(400);
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    const fold = resolve(outDir, "phase3d-mobile-fold.png");
    const full = resolve(outDir, "phase3d-mobile-full.png");
    await page.screenshot({ path: fold });
    await page.screenshot({ path: full, fullPage: true });
    copyFileSync(fold, resolve(artifactDir, `agency-${runId}-mobile-375-fold.png`));
    ledger.push({
      phase: "3d-mobile-375",
      status: overflowX ? "fail" : "pass",
      detail: overflowX
        ? "Horizontal overflow at 375px — fix stacking / gutters."
        : "No horizontal overflow at 375px.",
      shots: [fold, full],
    });
    await context.close();
  }

  writeFileSync(resolve(outDir, "phase4-final.html"), html, "utf8");
  await browser.close();
  server.close();

  const failed = ledger.filter((r) => r.status === "fail");
  const md = [
    `# Agency pipeline ledger — ${runId}`,
    "",
    `Product: **${brief.productName}**`,
    `Audience: ${brief.audience}`,
    `One CTA: ${brief.primaryCta ?? "(from sections)"}`,
    "",
    "| Phase | Status | Detail |",
    "|---|---|---|",
    ...ledger.map(
      (r) =>
        `| ${r.phase} | ${r.status} | ${r.detail.replace(/\|/g, "/")} |`,
    ),
    "",
    failed.length === 0
      ? "All required gates passed (or skipped with note)."
      : `Failed phases: ${failed.map((f) => f.phase).join(", ")}`,
    "",
    "Direction: Match typography scale, spacing rhythm, and motion of references. Do not copy layouts.",
  ].join("\n");
  writeFileSync(resolve(outDir, "LEDGER.md"), md, "utf8");
  console.log(md);
  if (failed.some((f) => f.phase !== "1-refs")) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
