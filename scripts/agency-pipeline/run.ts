/**
 * Agency-quality site pipeline — ONE PHASE AT A TIME.
 *
 * Quality compounds only when each phase starts from the previous phase's
 * passed artifacts and is looped until its own gates pass. Do NOT run --all
 * for craft work; --all is a smoke path that skips human eye loops.
 *
 * Usage:
 *   pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/lensroom.json --status
 *   pnpm agency:pipeline -- --brief … --phase 1-refs
 *   pnpm agency:pipeline -- --brief … --phase 2-build
 *   pnpm agency:pipeline -- --brief … --phase 3a-typography
 *   pnpm agency:pipeline -- --brief … --phase 3a-typography --reshoot
 *   pnpm agency:pipeline -- --brief … --mark-pass 3a-typography
 *   pnpm agency:pipeline -- --brief … --phase next
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
  type DesignSpec,
} from "../../packages/design-skills/src/index";
import { PHASE_ORDER, type PhaseId } from "./phases";

export { PHASE_ORDER, type PhaseId };

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
  status: "pass" | "fail" | "skip" | "loop";
  detail: string;
  attempt?: number;
  shots?: string[];
  at: string;
};

type RunState = {
  runId: string;
  briefPath: string;
  passed: PhaseId[];
  /** Next phase the agent must work on. */
  current: PhaseId;
  attempts: Partial<Record<PhaseId, number>>;
  /** Working HTML path relative to outDir — always the latest improved artifact. */
  currentHtml: string;
  /** Last phase that produced currentHtml. */
  currentHtmlFrom: PhaseId | null;
  updatedAt: string;
};

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function now(): string {
  return new Date().toISOString();
}

function isPhaseId(value: string): value is PhaseId {
  return (PHASE_ORDER as readonly string[]).includes(value);
}

function prerequisite(phase: PhaseId): PhaseId | null {
  const i = PHASE_ORDER.indexOf(phase);
  return i <= 0 ? null : PHASE_ORDER[i - 1]!;
}

function loadState(outDir: string, runId: string, briefPath: string): RunState {
  const path = resolve(outDir, "STATE.json");
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8")) as RunState;
  }
  return {
    runId,
    briefPath,
    passed: [],
    current: "1-refs",
    attempts: {},
    currentHtml: "current.html",
    currentHtmlFrom: null,
    updatedAt: now(),
  };
}

function saveState(outDir: string, state: RunState): void {
  state.updatedAt = now();
  writeFileSync(resolve(outDir, "STATE.json"), JSON.stringify(state, null, 2), "utf8");
}

function appendLedger(outDir: string, row: LedgerRow): void {
  const path = resolve(outDir, "PHASE_LEDGER.md");
  const line = `| ${row.at.slice(0, 19)} | ${row.phase} | ${row.status} | a${row.attempt ?? 1} | ${row.detail.replace(/\|/g, "/")} |\n`;
  if (!existsSync(path)) {
    writeFileSync(
      path,
      `# Agency phase ledger — ${basename(outDir)}\n\nOne row per attempt. Advance only after a phase is marked pass.\n\n| At | Phase | Status | Attempt | Detail |\n|---|---|---|---|---|\n`,
      "utf8",
    );
  }
  writeFileSync(path, readFileSync(path, "utf8") + line, "utf8");
}

function readCurrentHtml(outDir: string, state: RunState): string {
  const path = resolve(outDir, state.currentHtml);
  if (!existsSync(path)) {
    throw new Error(
      `Missing ${state.currentHtml}. Finish and pass the previous phase before ${state.current}.`,
    );
  }
  return readFileSync(path, "utf8");
}

function writeCurrentHtml(outDir: string, state: RunState, html: string, from: PhaseId): void {
  writeFileSync(resolve(outDir, state.currentHtml), html, "utf8");
  writeFileSync(resolve(outDir, `${from}.html`), html, "utf8");
  state.currentHtmlFrom = from;
}

async function shotSet(page: Page, outDir: string, prefix: string): Promise<string[]> {
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

async function withServer<T>(
  html: string,
  fn: (goto: (viewport: { width: number; height: number; dpr?: number }) => Promise<Page>) => Promise<T>,
): Promise<T> {
  const browser = await chromium.launch();
  const serveHtml = { current: html };
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(serveHtml.current);
  });
  await new Promise<void>((r) => server.listen(4331, "127.0.0.1", r));
  try {
    const goto = async (viewport: { width: number; height: number; dpr?: number }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.dpr ?? 1,
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4331/", { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(400);
      return page;
    };
    return await fn(goto);
  } finally {
    await browser.close();
    server.close();
  }
}

async function captureRefs(refs: NonNullable<BoardsLocal["refs"]>, outDir: string): Promise<LedgerRow> {
  if (refs.length === 0) {
    writeFileSync(
      resolve(outDir, "BOARD_STATUS.md"),
      [
        "# Board status",
        "",
        "mode: corridor-fallback",
        "reason: no refs in boards.local.json (fill research/boards.seeds.local.json locally)",
        "honesty: Phase 1 craft board is thin — DIRECTION must name corridor bands + subject vernacular.",
        "",
      ].join("\n"),
      "utf8",
    );
    return {
      phase: "1-refs",
      status: "skip",
      detail:
        "No refs in boards.local.json — corridor-fallback. Write DIRECTION.md from measured corridors + subject vernacular.",
      at: now(),
    };
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

  const directionPath = resolve(outDir, "DIRECTION.md");
  if (!existsSync(directionPath)) {
    writeFileSync(
      directionPath,
      [
        "# Direction note",
        "",
        "Match the typography scale, spacing rhythm, and motion of the reference board.",
        "Do not copy the layouts.",
        "",
        "Fill after eye review (see DESIGN_RIGOR.md):",
        "- Visual thesis: …",
        "- Compositional lane: minimal editorial grid | nested premium shells | image-first stage | documentary chapters | conversion landing",
        "- Craft nodes (1–2 Tell skills): …",
        "- Type: …",
        "- Spacing: …",
        "- Motion: …",
        "- Signature to invent for THIS subject (not cloned): …",
        "- Asset honesty: …",
        "",
      ].join("\n"),
      "utf8",
    );
  }

  const ok = shots.length >= 6;
  writeFileSync(
    resolve(outDir, "BOARD_STATUS.md"),
    [
      "# Board status",
      "",
      `mode: ${ok ? "live-board" : "thin-board"}`,
      `frames: ${shots.length}`,
      failures.length ? `issues: ${failures.join("; ")}` : "issues: none",
      ok
        ? "honesty: live reference frames captured — fill DIRECTION from eye, do not clone layouts."
        : "honesty: thin board — use measured corridor bands + subject vernacular; fill seeds locally next time.",
      "",
    ].join("\n"),
    "utf8",
  );
  return {
    phase: "1-refs",
    status: ok ? "pass" : "fail",
    detail: ok
      ? `Captured ${shots.length} frames from ${picked.length} sites.${failures.length ? ` Issues: ${failures.join("; ")}` : ""} Fill DIRECTION.md before Phase 2.`
      : `Need ≥6 frames (hero/mid/footer × refs). Got ${shots.length}. corridor-fallback recommended. ${failures.join("; ")}`,
    shots,
    at: now(),
  };
}

function assertCanRun(state: RunState, phase: PhaseId): void {
  const prev = prerequisite(phase);
  if (prev && !state.passed.includes(prev)) {
    throw new Error(
      `Cannot run ${phase}: prerequisite ${prev} is not marked pass. ` +
        `Finish ${prev} (goal → loop until green → --mark-pass ${prev}). ` +
        `Passed so far: [${state.passed.join(", ") || "none"}].`,
    );
  }
}

function printStatus(state: RunState, outDir: string): void {
  console.log(`Agency run: ${state.runId}`);
  console.log(`Brief: ${state.briefPath}`);
  console.log(`Current phase (work here): ${state.current}`);
  console.log(`Passed: ${state.passed.join(" → ") || "(none)"}`);
  console.log(`current.html from: ${state.currentHtmlFrom ?? "(none yet)"}`);
  console.log(`Attempts: ${JSON.stringify(state.attempts)}`);
  console.log(`Out: ${outDir}`);
  console.log("");
  console.log("Next agent step:");
  console.log(`  1. Paste Goal prompt for ${state.current} from agency-quality-site SKILL.md`);
  console.log(`  2. pnpm agency:pipeline -- --brief ${state.briefPath} --phase ${state.current}`);
  console.log(`  3. Read screenshots + paste Loop prompt; improve ONLY that axis; --reshoot`);
  console.log(`  4. When gates+eye pass: --mark-pass ${state.current}`);
}

async function runPhase(opts: {
  phase: PhaseId;
  brief: ReturnType<typeof DesignBrief.parse>;
  outDir: string;
  state: RunState;
  boardsLocal: BoardsLocal;
  reshoot: boolean;
  artifactDir: string;
}): Promise<{ row: LedgerRow; spec?: DesignSpec }> {
  const { phase, brief, outDir, state, boardsLocal, reshoot, artifactDir } = opts;
  assertCanRun(state, phase);
  const attempt = (state.attempts[phase] ?? 0) + 1;
  state.attempts[phase] = attempt;
  const prefix = `${phase}-a${attempt}`;

  if (phase === "1-refs") {
    const row = await captureRefs(boardsLocal.refs ?? [], outDir);
    row.attempt = attempt;
    return { row };
  }

  if (phase === "2-build") {
    let html: string;
    let builtSpec: DesignSpec;
    if (reshoot && existsSync(resolve(outDir, state.currentHtml))) {
      html = readCurrentHtml(outDir, state);
      builtSpec = JSON.parse(readFileSync(resolve(outDir, "spec.json"), "utf8")) as DesignSpec;
      writeFileSync(resolve(outDir, "2-build.html"), html, "utf8");
      state.currentHtmlFrom = "2-build";
    } else {
      const built = designFromFeatures(brief);
      html = built.previewHtml;
      builtSpec = built.spec;
      writeCurrentHtml(outDir, state, html, "2-build");
      writeFileSync(resolve(outDir, "spec.json"), JSON.stringify(built.spec, null, 2), "utf8");
    }
    const basics = assertBasics(builtSpec, html);
    const delivery = assertAgencyDelivery(builtSpec, html);
    const shots = await withServer(html, async (goto) => {
      const page = await goto({ width: 1440, height: 900 });
      const s = await shotSet(page, outDir, prefix);
      await page.context().close();
      return s;
    });
    copyFileSync(shots[0]!, resolve(artifactDir, `agency-${state.runId}-${phase}-fold.png`));
    const ok = basics.passed && delivery.passed;
    return {
      spec: builtSpec,
      row: {
        phase,
        status: ok ? "loop" : "fail",
        attempt,
        detail: ok
          ? `Build ok. READ ${prefix}-fold.png + refs + DIRECTION.md. Loop: fix content/layout only if eye fails; then --mark-pass when ready.`
          : `basics/delivery failed: ${[...basics.findings, ...delivery.findings]
              .filter((f) => !f.ok)
              .map((f) => f.id)
              .join(",")}`,
        shots,
        at: now(),
      },
    };
  }

  if (phase === "3a-typography" || phase === "3b-spacing" || phase === "3c-motion") {
    const axis = phase.slice(3) as AgencyPolishAxis;
    let html = readCurrentHtml(outDir, state);
    if (!reshoot) {
      html = applyAgencyPolish(html, axis);
      writeCurrentHtml(outDir, state, html, phase);
    } else {
      // Agent already edited current.html for this axis — only re-screenshot + gate.
      writeFileSync(resolve(outDir, `${phase}.html`), html, "utf8");
      state.currentHtmlFrom = phase;
    }
    const spec = JSON.parse(readFileSync(resolve(outDir, "spec.json"), "utf8")) as DesignSpec;
    const shots = await withServer(html, async (goto) => {
      const page = await goto({ width: 1440, height: 900 });
      const s = await shotSet(page, outDir, prefix);
      await page.context().close();
      return s;
    });
    copyFileSync(shots[0]!, resolve(artifactDir, `agency-${state.runId}-${phase}-fold.png`));
    const gate = assertAgencyDelivery(spec, html, { requirePolishAxes: false });
    return {
      spec,
      row: {
        phase,
        status: gate.passed ? "loop" : "fail",
        attempt,
        detail: gate.passed
          ? `${axis} attempt ${attempt}. READ fold+slices vs previous phase. Improve ONLY ${axis}; --reshoot; --mark-pass when eye+gates green.`
          : `Delivery failed: ${gate.findings
              .filter((f) => !f.ok)
              .map((f) => f.id)
              .join(",")}`,
        shots,
        at: now(),
      },
    };
  }

  if (phase === "3d-mobile") {
    const html = readCurrentHtml(outDir, state);
    const spec = JSON.parse(readFileSync(resolve(outDir, "spec.json"), "utf8")) as DesignSpec;
    const result = await withServer(html, async (goto) => {
      const page = await goto({ width: 375, height: 812, dpr: 2 });
      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      const fold = resolve(outDir, `${prefix}-fold.png`);
      const full = resolve(outDir, `${prefix}-full.png`);
      await page.screenshot({ path: fold });
      await page.screenshot({ path: full, fullPage: true });
      await page.context().close();
      return { overflowX, shots: [fold, full] };
    });
    copyFileSync(result.shots[0]!, resolve(artifactDir, `agency-${state.runId}-mobile-375-fold.png`));
    writeFileSync(resolve(outDir, "3d-mobile.html"), html, "utf8");
    const delivery = assertAgencyDelivery(spec, html, { requirePolishAxes: true });
    const ok = !result.overflowX && delivery.passed;
    return {
      spec,
      row: {
        phase,
        status: ok ? "loop" : "fail",
        attempt,
        detail: ok
          ? `375 OK attempt ${attempt}. READ mobile shots; fix only responsive breaks; --reshoot; --mark-pass when eye green.`
          : `${result.overflowX ? "horizontal overflow; " : ""}${delivery.findings
              .filter((f) => !f.ok)
              .map((f) => f.id)
              .join(",")}`,
        shots: result.shots,
        at: now(),
      },
    };
  }

  // 4-ship
  const html = readCurrentHtml(outDir, state);
  writeFileSync(resolve(outDir, "phase4-final.html"), html, "utf8");
  writeFileSync(resolve(outDir, "SHIP.html"), html, "utf8");
  return {
    row: {
      phase,
      status: "loop",
      attempt,
      detail: "Ship bundle written (SHIP.html + phase4-final.html). Run design-skills tests; --mark-pass 4-ship when evidence posted.",
      at: now(),
    },
  };
}

function markPass(state: RunState, phase: PhaseId): void {
  if (state.current !== phase && !state.passed.includes(phase)) {
    // Allow mark-pass only for current phase (or re-mark).
    if (state.current !== phase) {
      throw new Error(`Can only --mark-pass the current phase (${state.current}), not ${phase}.`);
    }
  }
  if (state.current !== phase) {
    throw new Error(`Can only --mark-pass the current phase (${state.current}), not ${phase}.`);
  }
  if (!state.passed.includes(phase)) state.passed.push(phase);
  const i = PHASE_ORDER.indexOf(phase);
  const next = PHASE_ORDER[i + 1];
  if (next) {
    state.current = next;
  }
}

async function main(): Promise<void> {
  const briefPath = argValue("--brief");
  if (!briefPath) {
    console.error(
      "Usage: pnpm agency:pipeline -- --brief <path> [--status | --phase <id> | --mark-pass <id>] [--reshoot]\n" +
        `Phases: ${PHASE_ORDER.join(", ")}`,
    );
    process.exit(1);
  }

  const absBrief = resolve(root, briefPath);
  const rawBrief = JSON.parse(readFileSync(absBrief, "utf8")) as Record<string, unknown>;
  const brief = DesignBrief.parse(rawBrief);
  const fileStem = basename(briefPath, ".json");
  const runId =
    (typeof rawBrief.runId === "string" && rawBrief.runId.trim()) ||
    (fileStem === "brief" ? basename(dirname(absBrief)) : fileStem);
  const outDir = resolve(root, "research/boards", runId);
  mkdirSync(outDir, { recursive: true });
  const artifactDir = "/opt/cursor/artifacts/screenshots";
  mkdirSync(artifactDir, { recursive: true });

  const state = loadState(outDir, runId, briefPath);
  state.briefPath = briefPath;

  const boardsLocalPath = resolve(root, "research/boards.local.json");
  let boardsLocal: BoardsLocal = {};
  if (existsSync(boardsLocalPath)) {
    boardsLocal = JSON.parse(readFileSync(boardsLocalPath, "utf8")) as BoardsLocal;
  }

  if (hasFlag("--status") || (!argValue("--phase") && !argValue("--mark-pass") && !hasFlag("--all"))) {
    printStatus(state, outDir);
    saveState(outDir, state);
    return;
  }

  const mark = argValue("--mark-pass");
  if (mark) {
    if (!isPhaseId(mark)) {
      console.error(`Unknown phase ${mark}`);
      process.exit(1);
    }
    markPass(state, mark);
    appendLedger(outDir, {
      phase: mark,
      status: "pass",
      detail: `Marked pass. Advanced current → ${state.current}`,
      attempt: state.attempts[mark],
      at: now(),
    });
    saveState(outDir, state);
    printStatus(state, outDir);

    // Automatic learn when a manual pipeline run completes 4-ship
    if (mark === "4-ship" && process.env.AGENCY_SKIP_LEARN !== "1") {
      try {
        const { learnFromRun } = await import("./learn");
        const { writeBackDesignData } = await import("./design-data");
        const learned = learnFromRun({ runId });
        console.log(
          `\nagency:learn (automatic after 4-ship): ${learned.signals.length} signals; LEARNINGS: ${learned.writtenLearnings.join(", ") || "(none new)"}`,
        );
        const learnMd = existsSync(resolve(outDir, "LEARN.md"))
          ? readFileSync(resolve(outDir, "LEARN.md"), "utf8")
          : undefined;
        console.log(writeBackDesignData(root, { runId, learnMarkdown: learnMd }));
      } catch (err) {
        console.warn(
          `agency:learn after 4-ship failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    return;
  }

  if (hasFlag("--all")) {
    console.error(
      "Refusing craft --all. Run one --phase at a time with Goal/Loop prompts so quality compounds.\n" +
        "For CI smoke only, set AGENCY_ALLOW_ALL=1.",
    );
    if (process.env.AGENCY_ALLOW_ALL !== "1") process.exit(2);
  }

  let phaseArg = argValue("--phase");
  if (phaseArg === "next") phaseArg = state.current;
  if (!phaseArg || !isPhaseId(phaseArg)) {
    console.error(`Need --phase <${PHASE_ORDER.join("|")}|next>`);
    process.exit(1);
  }
  if (phaseArg !== state.current) {
    console.error(
      `Refusing to run ${phaseArg} while current phase is ${state.current}. ` +
        `Finish the current phase first (or --mark-pass ${state.current} if it already passed eye+gates).`,
    );
    process.exit(2);
  }

  const reshoot = hasFlag("--reshoot");
  const { row } = await runPhase({
    phase: phaseArg,
    brief,
    outDir,
    state,
    boardsLocal,
    reshoot,
    artifactDir,
  });
  appendLedger(outDir, row);
  saveState(outDir, state);

  console.log("");
  console.log(`Phase ${phaseArg} attempt ${row.attempt ?? 1}: ${row.status}`);
  console.log(row.detail);
  if (row.shots?.length) {
    console.log(`Shots: ${row.shots.map((s) => basename(s)).join(", ")}`);
  }
  console.log("");
  console.log("Do NOT advance yet. Paste the Loop prompt, read the screenshots, improve this axis only,");
  console.log(`then: pnpm agency:pipeline -- --brief ${briefPath} --phase ${phaseArg} --reshoot`);
  console.log(`When eye + gates pass: pnpm agency:pipeline -- --brief ${briefPath} --mark-pass ${phaseArg}`);
  printStatus(state, outDir);

  if (row.status === "fail") process.exitCode = 1;
}

const invokedDirectly =
  typeof process.argv[1] === "string" &&
  /agency-pipeline[/\\]run\.(ts|js|mjs|cjs)$/.test(process.argv[1]);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
