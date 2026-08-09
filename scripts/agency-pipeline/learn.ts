/**
 * Post-run learning for the agency pipeline.
 *
 * Reads a completed (or failed) board run → extracts signals → updates
 * research/agency-engine-memory.json + research/LEARNINGS.md → writes LEARN.md
 * on the board. Safe improvements feed the next agency:run via memory.
 *
 * Usage:
 *   pnpm agency:learn -- --run-id orch-proof
 *   pnpm agency:learn -- --run-id orch-proof --query "…" --niche photography
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  compileBoost,
  loadMemory,
  mergeUniqueStrings,
  saveMemory,
  type EngineMemory,
  type PipelineNote,
} from "./memory";

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

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

type RunSignal = {
  patternKey: string;
  severity: "info" | "improve" | "encode";
  failure: string;
  fix: string;
  doNot: string;
  bansExtra?: string[];
  nicheBoost?: { nicheKey: string; pattern: string; reason: string };
  craftHint?: { siteKind: string; note: string };
  pipelineNote?: Omit<PipelineNote, "fromRun" | "at">;
  /** High-confidence HTML anti-patterns worth a delivery gate reminder */
  gateIds?: string[];
};

type StateJson = {
  runId?: string;
  passed?: string[];
  attempts?: Record<string, number>;
  current?: string;
  briefPath?: string;
};

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractGateIds(text: string): string[] {
  const ids = new Set<string>();
  const re = /\b(?:ban|rigor|polish|craft|basics)[-a-z0-9]+\b/gi;
  for (const m of text.match(re) ?? []) ids.add(m.toLowerCase());
  return [...ids];
}

/** Heuristic scans on SHIP / current HTML for engine gaps. */
function scanShipHtml(html: string): RunSignal[] {
  const signals: RunSignal[] = [];

  if (/linear-gradient\([^)]*#(?:7c3aed|8b5cf6|a855f7|6366f1)/i.test(html)) {
    signals.push({
      patternKey: "agency:ship-purple-gradient",
      severity: "encode",
      failure: "Shipped HTML still carries a purple/violet gradient cluster.",
      fix: "Keep ban-purple-gradient hard-fail; add phrase to memory.bansExtra for briefs.",
      doNot: "Treat violet brand washes as 'premium' by default.",
      bansExtra: ["purple/violet gradient washes"],
      gateIds: ["ban-purple-gradient"],
    });
  }

  if (
    /trusted by (thousands|millions|fortune)/i.test(html) ||
    /award[- ]winning/i.test(html)
  ) {
    signals.push({
      patternKey: "agency:ship-trust-theater",
      severity: "encode",
      failure: "Ship copy includes award/trust theater strings.",
      fix: "Rigor gates must stay on; reinforce ban list on auto briefs.",
      doNot: "Use trophy copy as a substitute for proof.",
      bansExtra: ["award claims without evidence", "fake logo-wall theater"],
      gateIds: ["rigor-no-award-claims", "rigor-no-fake-trust"],
    });
  }

  // Three equal feature cards — common AI layout tell
  const cardBlocks = html.match(/class="[^"]*\bds-(?:card|feature-card|tile)\b/gi) ?? [];
  if (cardBlocks.length >= 3 && /grid-template-columns:\s*repeat\(3/i.test(html)) {
    signals.push({
      patternKey: "agency:ship-equal-triptych",
      severity: "improve",
      failure: "Ship HTML uses an equal three-column feature card grid.",
      fix: "Prefer asymmetric proof / one hero feature; keep equal-triptych on ban list.",
      doNot: "Default marketing layouts to three equal cards.",
      bansExtra: ["equal three-card feature grids"],
    });
  }

  if (!/prefers-reduced-motion/.test(html)) {
    signals.push({
      patternKey: "agency:ship-missing-reduced-motion",
      severity: "encode",
      failure: "Ship HTML missing prefers-reduced-motion.",
      fix: "Motion polish pass must inject reduced-motion finals before 4-ship.",
      doNot: "Ship motion without an accessibility final.",
      gateIds: ["reduced-motion", "polish-motion"],
    });
  }

  return signals;
}

function signalsFromRun(opts: {
  outDir: string;
  runId: string;
  query: string;
  nicheKey: string;
  siteKind: string;
  seedCategory: string;
}): RunSignal[] {
  const { outDir, runId, query, nicheKey, siteKind, seedCategory } = opts;
  const signals: RunSignal[] = [];
  const state = readJson<StateJson>(resolve(outDir, "STATE.json"));
  const orch = existsSync(resolve(outDir, "ORCH_LOG.md"))
    ? readFileSync(resolve(outDir, "ORCH_LOG.md"), "utf8")
    : "";
  const ledger = existsSync(resolve(outDir, "PHASE_LEDGER.md"))
    ? readFileSync(resolve(outDir, "PHASE_LEDGER.md"), "utf8")
    : "";
  const autoPlan = existsSync(resolve(outDir, "AUTO_PLAN.md"))
    ? readFileSync(resolve(outDir, "AUTO_PLAN.md"), "utf8")
    : "";
  const direction = existsSync(resolve(outDir, "DIRECTION.md"))
    ? readFileSync(resolve(outDir, "DIRECTION.md"), "utf8")
    : "";

  const attempts = state?.attempts ?? {};
  for (const [phase, n] of Object.entries(attempts)) {
    if (typeof n === "number" && n > 1) {
      signals.push({
        patternKey: `agency:phase-retry:${phase}`,
        severity: "improve",
        failure: `Phase ${phase} needed ${n} attempts before gates/advance.`,
        fix: `Tighten ${phase} first-pass output or encode the fail mode into assertAgencyDelivery / polish.`,
        doNot: `Rubber-stamp ${phase} after a soft first attempt without reading shots.`,
        pipelineNote: {
          key: `retry:${phase}`,
          detail: `${phase} took ${n} attempts on run ${runId}`,
        },
        gateIds: extractGateIds(ledger),
      });
    }
  }

  if (/corridor-fallback|No refs in boards\.local|seeds:/i.test(orch + autoPlan + direction)) {
    const liveRefs = existsSync(outDir)
      ? readdirSync(outDir).filter((f) => /^ref-\d+-hero\.png$/.test(f)).length
      : 0;
    if (liveRefs < 3) {
      signals.push({
        patternKey: `agency:thin-board:${seedCategory || nicheKey}`,
        severity: "improve",
        failure: `Run ${runId} advanced with a thin/corridor reference board (category ${seedCategory || nicheKey}).`,
        fix: "Fill research/boards.seeds.local.json for this category; keep corridor bands as fallback only.",
        doNot: "Treat empty seeds as a finished Phase 1 craft board.",
        pipelineNote: {
          key: `thin-board:${seedCategory || nicheKey}`,
          detail: `Corridor/thin board for ${seedCategory || nicheKey}`,
        },
      });
    }
  }

  if (/\| [^|]+ \| \d+ \| fail \|/i.test(orch) || /\|\s*fail\s*\|/i.test(ledger)) {
    const gates = extractGateIds(orch + "\n" + ledger);
    signals.push({
      patternKey: `agency:gate-pressure:${gates[0] ?? "generic"}`,
      severity: "improve",
      failure: `Run log shows gate/loop pressure${gates.length ? ` (${gates.slice(0, 5).join(", ")})` : ""}.`,
      fix: "Encode the failing id into delivery/basics if it repeats; otherwise document in LEARNINGS only.",
      doNot: "Weaken the gate to make the run green.",
      gateIds: gates,
      pipelineNote: {
        key: `gates:${gates[0] ?? "generic"}`,
        detail: gates.join(",") || "unspecified gate fail",
      },
    });
  }

  // Query tokens that look niche-specific but niche fell to default photography
  if (query && nicheKey === "photography") {
    const saasLike = /\b(saas|b2b|demo|pipeline|subscription)\b/i.test(query);
    const finLike = /\b(fintech|treasury|payments?|banking)\b/i.test(query);
    const agencyLike = /\b(agency|art.?direct|brand system)\b/i.test(query);
    if (saasLike || finLike || agencyLike) {
      const prefer = saasLike ? "saas" : finLike ? "fintech" : "agency";
      const token = (query.match(/\b[a-z]{4,}\b/gi) ?? [])
        .filter((w) => !/freelance|website|landing|site|page|with|that|from|this/i.test(w))
        .slice(0, 3)
        .join("|");
      if (token) {
        signals.push({
          patternKey: `agency:niche-miss:${prefer}`,
          severity: "encode",
          failure: `Query suggested ${prefer} but matcher returned photography.`,
          fix: `Boost niche classifier for /${token}/i → ${prefer}.`,
          doNot: "Force every unknown query into photography forever.",
          nicheBoost: {
            nicheKey: prefer,
            pattern: token,
            reason: `learned from query on run ${runId}`,
          },
        });
      }
    }
  }

  // Positive craft hint when DIRECTION names a lane — reinforce for siteKind
  const lane = direction.match(/\*\*Compositional lane:\*\*\s*([^\n]+)/i)?.[1]?.trim();
  if (lane && siteKind) {
    signals.push({
      patternKey: `agency:lane-reinforce:${siteKind}`,
      severity: "info",
      failure: `(observation) ${siteKind} ran with lane “${lane}”.`,
      fix: `Keep craftHints for ${siteKind} pointing at that lane when auto-generating DIRECTION.`,
      doNot: "Swap lanes mid-run without a new DIRECTION.",
      craftHint: {
        siteKind,
        note: `Prefer compositional lane “${lane.replace(/\s+/g, " ").slice(0, 80)}” when query maps here.`,
      },
    });
  }

  const shipPath = [
    resolve(outDir, "SHIP.html"),
    resolve(outDir, "current.html"),
    resolve(outDir, "phase4-final.html"),
  ].find((p) => existsSync(p));
  if (shipPath) {
    signals.push(...scanShipHtml(readFileSync(shipPath, "utf8")));
  }

  return signals;
}

function appendLearnings(rootDir: string, signals: RunSignal[], memory: EngineMemory): string[] {
  const path = resolve(rootDir, "research/LEARNINGS.md");
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(
      path,
      "# Tell learnings (recursive improve)\n\nPersistent lessons across sessions.\n\n---\n",
      "utf8",
    );
  }
  let body = readFileSync(path, "utf8");
  const written: string[] = [];
  for (const s of signals) {
    if (s.severity === "info") continue;
    if (memory.seenPatternKeys.includes(s.patternKey)) continue;
    if (body.includes(`\`${s.patternKey}\``)) {
      memory.seenPatternKeys = mergeUniqueStrings(memory.seenPatternKeys, [s.patternKey]);
      continue;
    }
    const block = [
      "",
      `## ${today()} — \`${s.patternKey}\``,
      "",
      `- **Failure:** ${s.failure}`,
      `- **Fix:** ${s.fix}`,
      `- **Do not:** ${s.doNot}`,
      "",
    ].join("\n");
    body += block;
    written.push(s.patternKey);
    memory.seenPatternKeys = mergeUniqueStrings(memory.seenPatternKeys, [s.patternKey]);
  }
  if (written.length) writeFileSync(path, body, "utf8");
  return written;
}

function applySignalsToMemory(
  memory: EngineMemory,
  signals: RunSignal[],
  runId: string,
): EngineMemory {
  const next: EngineMemory = { ...memory };
  for (const s of signals) {
    if (s.bansExtra?.length) {
      next.bansExtra = mergeUniqueStrings(next.bansExtra, s.bansExtra);
    }
    if (s.nicheBoost) {
      const exists = next.nicheBoosts.some(
        (b) =>
          b.nicheKey === s.nicheBoost!.nicheKey &&
          b.pattern.toLowerCase() === s.nicheBoost!.pattern.toLowerCase(),
      );
      if (!exists && compileBoost(s.nicheBoost.pattern)) {
        next.nicheBoosts.push({
          ...s.nicheBoost,
          fromRun: runId,
        });
      }
    }
    if (s.craftHint) {
      const exists = next.craftHints.some(
        (c) => c.siteKind === s.craftHint!.siteKind && c.note === s.craftHint!.note,
      );
      if (!exists) {
        next.craftHints.push({ ...s.craftHint, fromRun: runId });
      }
    }
    if (s.pipelineNote) {
      const exists = next.pipelineNotes.some((p) => p.key === s.pipelineNote!.key);
      if (!exists) {
        next.pipelineNotes.push({
          ...s.pipelineNote,
          fromRun: runId,
          at: new Date().toISOString(),
        });
      }
    }
  }
  // Cap growth
  next.pipelineNotes = next.pipelineNotes.slice(-40);
  next.craftHints = next.craftHints.slice(-30);
  next.nicheBoosts = next.nicheBoosts.slice(-30);
  next.bansExtra = next.bansExtra.slice(-40);
  next.seenPatternKeys = next.seenPatternKeys.slice(-200);
  return next;
}

export function learnFromRun(opts: {
  runId: string;
  query?: string;
  nicheKey?: string;
  siteKind?: string;
  seedCategory?: string;
  skipLearningsFile?: boolean;
}): {
  signals: RunSignal[];
  writtenLearnings: string[];
  memoryPath: string;
  learnPath: string;
} {
  const runId = opts.runId;
  const outDir = resolve(root, "research/boards", runId);
  if (!existsSync(outDir)) {
    throw new Error(`No board dir for run-id ${runId} at ${outDir}`);
  }

  const brief = readJson<{ siteKind?: string; productName?: string }>(
    resolve(outDir, "brief.json"),
  );
  const autoPlan = existsSync(resolve(outDir, "AUTO_PLAN.md"))
    ? readFileSync(resolve(outDir, "AUTO_PLAN.md"), "utf8")
    : "";
  const nicheFromPlan = autoPlan.match(/Niche:\s*(\S+)/)?.[1];
  const queryFromPlan = autoPlan.match(/Query:\s*(.+)/)?.[1]?.trim();

  const signals = signalsFromRun({
    outDir,
    runId,
    query: opts.query ?? queryFromPlan ?? "",
    nicheKey: opts.nicheKey ?? nicheFromPlan ?? "photography",
    siteKind: opts.siteKind ?? brief?.siteKind ?? "art-directed-studio",
    seedCategory: opts.seedCategory ?? "",
  });

  let memory = loadMemory(root);
  memory = applySignalsToMemory(memory, signals, runId);
  const writtenLearnings = opts.skipLearningsFile
    ? []
    : appendLearnings(root, signals, memory);
  saveMemory(root, memory);

  const learnMd = [
    `# Learn — ${runId}`,
    "",
    `At: ${new Date().toISOString()}`,
    `Signals: ${signals.length}`,
    `LEARNINGS appended: ${writtenLearnings.join(", ") || "(none new)"}`,
    "",
    "## Signals",
    "",
    ...signals.map(
      (s) =>
        `- **${s.severity}** \`${s.patternKey}\` — ${s.failure} → ${s.fix}`,
    ),
    "",
    "## Memory delta",
    "",
    `- bansExtra: ${memory.bansExtra.length}`,
    `- nicheBoosts: ${memory.nicheBoosts.length}`,
    `- craftHints: ${memory.craftHints.length}`,
    `- pipelineNotes: ${memory.pipelineNotes.length}`,
    "",
    "Next `agency:run` merges memory into brief bans + DIRECTION + niche matching.",
    "",
  ].join("\n");
  const learnPath = resolve(outDir, "LEARN.md");
  writeFileSync(learnPath, learnMd, "utf8");

  return {
    signals,
    writtenLearnings,
    memoryPath: resolve(root, "research/agency-engine-memory.json"),
    learnPath,
  };
}

async function main(): Promise<void> {
  const runId = argValue("--run-id");
  if (!runId) {
    console.error(
      "Usage: pnpm agency:learn -- --run-id <id> [--query …] [--niche …] [--site-kind …]",
    );
    process.exit(1);
  }
  const result = learnFromRun({
    runId,
    query: argValue("--query") ?? undefined,
    nicheKey: argValue("--niche") ?? undefined,
    siteKind: argValue("--site-kind") ?? undefined,
    seedCategory: argValue("--seed-category") ?? undefined,
    skipLearningsFile: hasFlag("--memory-only"),
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        signals: result.signals.map((s) => ({
          key: s.patternKey,
          severity: s.severity,
        })),
        writtenLearnings: result.writtenLearnings,
        memory: "research/agency-engine-memory.json",
        learn: `research/boards/${runId}/LEARN.md`,
      },
      null,
      2,
    ),
  );
}

const invokedDirectly =
  typeof process.argv[1] === "string" &&
  /agency-pipeline[/\\]learn\.(ts|js|mjs|cjs)$/.test(process.argv[1]);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
