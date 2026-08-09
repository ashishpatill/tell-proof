/**
 * Autonomous agency orchestrator.
 *
 * query → niche preset → brief + DIRECTION → seed refs (local) →
 * phase loop with verify / retry / auto mark-pass until 4-ship.
 *
 * Usage:
 *   pnpm agency:run -- --query "freelance photographer booking site"
 *   pnpm agency:run -- --query "B2B SaaS demo landing" --product Acme --cta "Book a demo"
 *   pnpm agency:run -- --brief scripts/agency-pipeline/briefs/lensroom.json
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve, basename } from "node:path";
import {
  briefFromNiche,
  directionMarkdown,
  matchNiche,
  slugifyRunId,
  type NichePreset,
} from "./niche";
import { PHASE_ORDER, type PhaseId } from "./phases";
import { loadMemory } from "./memory";
import { learnFromRun } from "./learn";

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

type SeedFile = {
  categories?: Record<string, Array<{ url: string; note?: string }>>;
};

type RunState = {
  runId: string;
  briefPath: string;
  passed: PhaseId[];
  current: PhaseId;
  attempts: Partial<Record<PhaseId, number>>;
};

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function pipeline(args: string[]): { ok: boolean; output: string } {
  const result = spawnSync(
    "pnpm",
    ["-F", "@tell/design-skills", "exec", "tsx", "../../scripts/agency-pipeline/run.ts", "--", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return { ok: result.status === 0, output };
}

function loadState(outDir: string): RunState | null {
  const path = resolve(outDir, "STATE.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as RunState;
}

function writeBrief(runId: string, brief: ReturnType<typeof briefFromNiche>): string {
  const dir = resolve(root, "research/boards", runId);
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, "brief.json");
  const payload = {
    runId,
    ...brief,
    referenceBoardPaths: [
      `research/boards/${runId}/ref-1-hero.png`,
      `research/boards/${runId}/ref-2-hero.png`,
      `research/boards/${runId}/ref-3-hero.png`,
    ],
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  // Runner resolves brief paths from repo root.
  return `research/boards/${runId}/brief.json`;
}

function selectAndWriteRefs(preset: NichePreset, runId: string): string {
  const seedsPath = resolve(root, "research/boards.seeds.local.json");
  let refs: Array<{ id: string; url: string; note?: string }> = [];
  let mode = "corridor-fallback";

  if (existsSync(seedsPath)) {
    const seeds = JSON.parse(readFileSync(seedsPath, "utf8")) as SeedFile;
    const pool =
      seeds.categories?.[preset.seedCategory] ??
      seeds.categories?.default ??
      [];
    refs = pool.slice(0, 3).map((entry, i) => ({
      id: `ref-${i + 1}`,
      url: entry.url,
      note: entry.note ?? preset.seedCategory,
    }));
    if (refs.length > 0) mode = `seeds:${preset.seedCategory} (${refs.length})`;
  }

  const boardsLocal = {
    runId,
    niche: preset.key,
    direction:
      "Match the typography scale, spacing rhythm, and motion of these references. Do not copy the layouts.",
    corridorHint: preset.corridorHint,
    refs,
  };
  writeFileSync(
    resolve(root, "research/boards.local.json"),
    `${JSON.stringify(boardsLocal, null, 2)}\n`,
    "utf8",
  );
  return mode;
}

function writePlan(outDir: string, preset: NichePreset, query: string, refMode: string): void {
  const lines = [
    `# Agency auto-plan — ${preset.productName}`,
    "",
    `Query: ${query}`,
    `Niche: ${preset.key}`,
    `Lane: ${preset.lane}`,
    `Craft: ${preset.craftNodes.join(", ")}`,
    `Site kind: ${preset.siteKind}`,
    `Ref mode: ${refMode}`,
    `Seed category: ${preset.seedCategory}`,
    "",
    "## Phase plan",
    "",
    ...PHASE_ORDER.map((p, i) => `${i + 1}. \`${p}\` — run → verify gates → retry ≤3 → mark-pass`),
    "",
    "Auto-advance when deterministic gates are green. Live refs optional via local seeds.",
    "After ship: `agency:learn` updates engine memory + LEARNINGS.",
    "",
  ];
  writeFileSync(resolve(outDir, "AUTO_PLAN.md"), lines.join("\n"), "utf8");
}

function phaseSucceeded(outDir: string, phase: PhaseId, output: string): boolean {
  if (phase === "1-refs") {
    const shots = existsSync(outDir)
      ? readdirSync(outDir).filter((f) => /^ref-\d+-(hero|mid|footer)\.png$/.test(f))
      : [];
    const directionOk =
      existsSync(resolve(outDir, "DIRECTION.md")) &&
      /Visual thesis/i.test(readFileSync(resolve(outDir, "DIRECTION.md"), "utf8"));
    if (/Phase .+ attempt \d+: skip/i.test(output) && directionOk) return true;
    // Live board (≥6 frames) or thin board with direction already filled for corridor fallback.
    return directionOk && (shots.length >= 6 || /No refs in boards\.local|corridor/i.test(output));
  }
  if (phase === "4-ship") {
    return existsSync(resolve(outDir, "SHIP.html"));
  }
  // build / polish / mobile: runner prints "loop" when gates green, "fail" otherwise
  if (/Phase .+ attempt \d+: fail/i.test(output)) return false;
  if (/Phase .+ attempt \d+: loop/i.test(output)) return true;
  if (/Phase .+ attempt \d+: pass/i.test(output)) return true;
  const state = loadState(outDir);
  return Boolean(state && state.currentHtmlFrom === phase);
}

function ensureDirection(
  outDir: string,
  preset: NichePreset,
  query: string,
  refMode: string,
): void {
  const memory = loadMemory(root);
  writeFileSync(
    resolve(outDir, "DIRECTION.md"),
    directionMarkdown(preset, query, refMode, memory),
    "utf8",
  );
}

function adaptBriefPaths(briefRel: string, runId: string): void {
  const abs = resolve(root, briefRel);
  const brief = JSON.parse(readFileSync(abs, "utf8")) as Record<string, unknown>;
  brief.referenceBoardPaths = [
    `research/boards/${runId}/ref-1-hero.png`,
    `research/boards/${runId}/ref-2-hero.png`,
    `research/boards/${runId}/ref-3-hero.png`,
  ];
  const memory = loadMemory(root);
  if (memory.bansExtra.length) {
    const existing = Array.isArray(brief.banList)
      ? (brief.banList as string[])
      : [];
    const merged = [...existing];
    for (const ban of memory.bansExtra) {
      if (!merged.some((b) => b.toLowerCase() === ban.toLowerCase())) merged.push(ban);
    }
    brief.banList = merged;
  }
  writeFileSync(abs, `${JSON.stringify(brief, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const query = argValue("--query") ?? "";
  const briefArg = argValue("--brief");
  const maxAttempts = Number(argValue("--max-attempts") ?? "3");
  const productName = argValue("--product") ?? undefined;
  const primaryCta = argValue("--cta") ?? undefined;
  const audience = argValue("--audience") ?? undefined;
  const runIdArg = argValue("--run-id");
  const fresh = hasFlag("--fresh");

  const skipLearn = hasFlag("--skip-learn");
  const memory = loadMemory(root);

  if (!query && !briefArg) {
    console.error(
      'Usage: pnpm agency:run -- --query "freelance photographer booking site"\n' +
        "       pnpm agency:run -- --brief scripts/agency-pipeline/briefs/lensroom.json",
    );
    process.exit(1);
  }

  const preset = matchNiche(query || "photography portfolio booking", memory);
  let runId = runIdArg ?? "";
  if (!runId && briefArg) {
    const stem = basename(briefArg, ".json");
    runId =
      stem === "brief" ? basename(dirname(resolve(root, briefArg))) : stem;
  }
  if (!runId) runId = slugifyRunId(productName || preset.productName);

  const outDir = resolve(root, "research/boards", runId);
  mkdirSync(outDir, { recursive: true });

  if (fresh && existsSync(resolve(outDir, "STATE.json"))) {
    writeFileSync(
      resolve(outDir, "STATE.json"),
      `${JSON.stringify(
        {
          runId,
          briefPath: "",
          passed: [],
          current: "1-refs",
          attempts: {},
          currentHtml: "current.html",
          currentHtmlFrom: null,
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  }

  let briefRel: string;
  if (briefArg) {
    briefRel = briefArg;
  } else {
    const brief = briefFromNiche(preset, {
      query,
      productName,
      primaryCta,
      audience,
      memory,
    });
    briefRel = writeBrief(runId, brief);
  }
  adaptBriefPaths(briefRel, runId);

  const refMode = selectAndWriteRefs(preset, runId);
  ensureDirection(outDir, preset, query || `brief:${briefRel}`, refMode);
  writePlan(outDir, preset, query || briefRel, refMode);

  console.log(`\n=== agency:run ===`);
  console.log(`runId: ${runId}`);
  console.log(`niche: ${preset.key} · lane: ${preset.lane}`);
  console.log(`craft: ${preset.craftNodes.join(", ")}`);
  console.log(`brief: ${briefRel}`);
  console.log(`refs:  ${refMode}`);
  console.log(`memory bans: ${memory.bansExtra.length} · boosts: ${memory.nicheBoosts.length}`);
  console.log(`plan:  research/boards/${runId}/AUTO_PLAN.md\n`);

  const orchLog: string[] = [
    `# Orchestrator log — ${runId}`,
    "",
    `| Phase | Attempt | Result |`,
    `|---|---|---|`,
  ];

  let stoppedEarly = false;
  for (const phase of PHASE_ORDER) {
    const state = loadState(outDir);
    if (state?.passed.includes(phase)) {
      console.log(`skip ${phase} (already passed)`);
      orchLog.push(`| ${phase} | - | already-passed |`);
      continue;
    }
    // Align current pointer if needed
    if (state && state.current !== phase && !state.passed.includes(phase)) {
      // Force current by rewriting state when resuming mid-plan after fresh brief
      if (state.passed.length === PHASE_ORDER.indexOf(phase)) {
        state.current = phase;
        writeFileSync(resolve(outDir, "STATE.json"), `${JSON.stringify(state, null, 2)}\n`, "utf8");
      }
    }

    let success = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      console.log(`\n--- ${phase} attempt ${attempt}/${maxAttempts} ---`);
      // Auto mode never --reshoot: retries re-run deterministic craft (polish re-applies; build regenerates).
      const args = ["--brief", briefRel, "--phase", phase];
      const result = pipeline(args);
      // Keep DIRECTION filled (runner may stub on first refs)
      ensureDirection(outDir, preset, query || `brief:${briefRel}`, refMode);
      success = phaseSucceeded(outDir, phase, result.output);
      console.log(result.output.split("\n").slice(-18).join("\n"));
      orchLog.push(`| ${phase} | ${attempt} | ${success ? "gates-ok" : "fail"} |`);
      if (success) break;
      if (phase === "2-build" && attempt < maxAttempts) {
        // next attempt regenerates without --reshoot
        continue;
      }
    }

    if (!success) {
      // 1-refs: allow corridor-only progress when seeds/URLs blocked
      if (phase === "1-refs") {
        ensureDirection(outDir, preset, query || `brief:${briefRel}`, `${refMode} + corridor-fallback`);
        console.log("1-refs: continuing with DIRECTION + corridor fallback (live board thin).");
        success = true;
        orchLog.push(`| ${phase} | - | corridor-fallback |`);
      } else {
        writeFileSync(resolve(outDir, "ORCH_LOG.md"), `${orchLog.join("\n")}\n`, "utf8");
        console.error(`\nStopped on ${phase} after ${maxAttempts} attempts.`);
        stoppedEarly = true;
        break;
      }
    }

    const mark = pipeline(["--brief", briefRel, "--mark-pass", phase]);
    console.log(mark.output.split("\n").slice(-12).join("\n"));
    if (!mark.ok && phase !== "4-ship") {
      // mark-pass may fail if current pointer drifted — try status
      const st = pipeline(["--brief", briefRel, "--status"]);
      console.log(st.output);
    }
  }

  orchLog.push(
    "",
    stoppedEarly
      ? "Stopped early — learn still runs to capture gate pressure."
      : "Done: all phases marked or corridor-fallback applied.",
    "",
  );
  writeFileSync(resolve(outDir, "ORCH_LOG.md"), `${orchLog.join("\n")}\n`, "utf8");

  if (!skipLearn) {
    try {
      const learned = learnFromRun({
        runId,
        query: query || undefined,
        nicheKey: preset.key,
        siteKind: preset.siteKind,
        seedCategory: preset.seedCategory,
      });
      console.log(`\n=== agency:learn ===`);
      console.log(
        `signals: ${learned.signals.length} · LEARNINGS: ${learned.writtenLearnings.join(", ") || "(none new)"}`,
      );
      console.log(`memory: research/agency-engine-memory.json`);
      console.log(`board:  research/boards/${runId}/LEARN.md`);
    } catch (err) {
      console.warn(
        `agency:learn skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const final = loadState(outDir);
  console.log(`\n=== complete ===`);
  console.log(`passed: ${final?.passed.join(" → ") ?? "(unknown)"}`);
  console.log(`artifacts: research/boards/${runId}/`);
  console.log(`ship: research/boards/${runId}/SHIP.html`);
  if (stoppedEarly) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
