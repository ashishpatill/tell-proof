/**
 * Personal design-data companion checkout (gitignored pointer).
 *
 * Operator keeps a private/local repo of seeds, anonymised measurements,
 * aggregate bands, and engine memory. Tell reads it on agency:run and
 * write-backs memory after agency:learn — without copying third-party URLs
 * into committed Tell files.
 *
 * Pointer: research/design-data.local.json  OR  env TELL_DESIGN_DATA=/abs/path
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve, join, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import {
  type EngineMemory,
  EMPTY_MEMORY,
  loadMemory,
  mergeUniqueStrings,
  saveMemory,
} from "./memory";

export type DesignDataPointer = {
  /** Absolute or repo-relative path to the checkout root */
  path: string;
  /** Optional clone URL — used only when path is missing and pull/clone is allowed */
  repoUrl?: string;
  /** When true, `git pull --ff-only` before read (default true if path is a git repo) */
  pull?: boolean;
};

export type DesignDataSeeds = {
  categories?: Record<string, Array<{ url: string; note?: string }>>;
};

export type DesignDataStatus = {
  ok: boolean;
  root: string | null;
  source: "env" | "local-json" | "missing";
  pulled: boolean;
  seedsCategories: string[];
  hasAggregate: boolean;
  hasMemory: boolean;
  hasMeasurements: boolean;
  detail: string;
};

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

function pointerPath(root: string): string {
  return resolve(root, "research/design-data.local.json");
}

export function readPointer(root = repoRoot()): DesignDataPointer | null {
  const env = process.env.TELL_DESIGN_DATA?.trim();
  if (env) {
    return {
      path: env,
      pull: process.env.TELL_DESIGN_DATA_PULL !== "0",
    };
  }
  const path = pointerPath(root);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as DesignDataPointer;
    if (!raw.path || typeof raw.path !== "string") return null;
    return raw;
  } catch {
    return null;
  }
}

export function resolveDesignDataRoot(root = repoRoot()): {
  root: string | null;
  source: DesignDataStatus["source"];
  pointer: DesignDataPointer | null;
} {
  const pointer = readPointer(root);
  if (!pointer) return { root: null, source: "missing", pointer: null };
  const abs = isAbsolute(pointer.path)
    ? pointer.path
    : resolve(root, pointer.path);
  const source: DesignDataStatus["source"] = process.env.TELL_DESIGN_DATA
    ? "env"
    : "local-json";
  return { root: abs, source, pointer };
}

function tryCloneOrPull(
  tellRoot: string,
  pointer: DesignDataPointer,
  abs: string,
): { pulled: boolean; detail: string } {
  const wantPull = pointer.pull !== false;
  if (!existsSync(abs)) {
    if (!pointer.repoUrl) {
      return {
        pulled: false,
        detail: `design-data path missing: ${abs} (set repoUrl to clone, or create the checkout)`,
      };
    }
    mkdirSync(dirname(abs), { recursive: true });
    const clone = spawnSync("git", ["clone", "--depth", "1", pointer.repoUrl, abs], {
      cwd: tellRoot,
      encoding: "utf8",
    });
    if (clone.status !== 0) {
      return {
        pulled: false,
        detail: `git clone failed: ${(clone.stderr || clone.stdout || "").slice(0, 240)}`,
      };
    }
    return { pulled: true, detail: `cloned into ${abs}` };
  }
  if (!wantPull || !existsSync(resolve(abs, ".git"))) {
    return { pulled: false, detail: `using existing checkout ${abs}` };
  }
  const pull = spawnSync("git", ["pull", "--ff-only"], {
    cwd: abs,
    encoding: "utf8",
  });
  if (pull.status !== 0) {
    return {
      pulled: false,
      detail: `checkout present; pull skipped/failed: ${(pull.stderr || "").slice(0, 160)}`,
    };
  }
  return { pulled: true, detail: `pulled ${abs}` };
}

/** Prefer common filenames inside the personal data repo. */
function firstExisting(root: string, names: string[]): string | null {
  for (const name of names) {
    const p = resolve(root, name);
    if (existsSync(p)) return p;
  }
  return null;
}

export function ensureDesignData(tellRoot = repoRoot()): DesignDataStatus {
  const { root, source, pointer } = resolveDesignDataRoot(tellRoot);
  if (!pointer || !root) {
    return {
      ok: false,
      root: null,
      source: "missing",
      pulled: false,
      seedsCategories: [],
      hasAggregate: false,
      hasMemory: false,
      hasMeasurements: false,
      detail:
        "No design-data pointer. Create research/design-data.local.json or set TELL_DESIGN_DATA.",
    };
  }
  const { pulled, detail } = tryCloneOrPull(tellRoot, pointer, root);
  const seedsPath = firstExisting(root, [
    "boards.seeds.json",
    "boards.seeds.local.json",
    "seeds.json",
  ]);
  let seedsCategories: string[] = [];
  if (seedsPath) {
    try {
      const seeds = JSON.parse(readFileSync(seedsPath, "utf8")) as DesignDataSeeds;
      seedsCategories = Object.keys(seeds.categories ?? {});
    } catch {
      /* ignore */
    }
  }
  return {
    ok: existsSync(root),
    root: existsSync(root) ? root : null,
    source,
    pulled,
    seedsCategories,
    hasAggregate: Boolean(firstExisting(root, ["aggregate.json", "research/aggregate.json"])),
    hasMemory: Boolean(
      firstExisting(root, ["agency-engine-memory.json", "research/agency-engine-memory.json"]),
    ),
    hasMeasurements: existsSync(resolve(root, "measurements")) ||
      existsSync(resolve(root, "research/measurements")),
    detail,
  };
}

export function loadDesignDataSeeds(
  category: string,
  tellRoot = repoRoot(),
): { refs: Array<{ url: string; note?: string }>; mode: string } {
  const status = ensureDesignData(tellRoot);
  if (!status.root) return { refs: [], mode: "design-data:missing" };
  const seedsPath = firstExisting(status.root, [
    "boards.seeds.json",
    "boards.seeds.local.json",
    "seeds.json",
  ]);
  if (!seedsPath) return { refs: [], mode: "design-data:no-seeds-file" };
  try {
    const seeds = JSON.parse(readFileSync(seedsPath, "utf8")) as DesignDataSeeds;
    const pool =
      seeds.categories?.[category] ??
      seeds.categories?.default ??
      [];
    return {
      refs: pool.slice(0, 3),
      mode: `design-data:${category} (${Math.min(pool.length, 3)} from ${basenameSafe(seedsPath)})`,
    };
  } catch {
    return { refs: [], mode: "design-data:seeds-parse-error" };
  }
}

function basenameSafe(p: string): string {
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1] || p;
}

/** Merge personal-data memory under Tell memory (Tell wins on conflicts for bans already present). */
export function mergeDesignDataMemory(tellRoot = repoRoot()): EngineMemory {
  const tellMem = loadMemory(tellRoot);
  const status = ensureDesignData(tellRoot);
  if (!status.root || !status.hasMemory) return tellMem;
  const memPath = firstExisting(status.root, [
    "agency-engine-memory.json",
    "research/agency-engine-memory.json",
  ]);
  if (!memPath) return tellMem;
  try {
    const raw = JSON.parse(readFileSync(memPath, "utf8")) as Partial<EngineMemory>;
    const foreign: EngineMemory = {
      ...EMPTY_MEMORY(),
      ...raw,
      version: 1,
      bansExtra: Array.isArray(raw.bansExtra) ? raw.bansExtra : [],
      nicheBoosts: Array.isArray(raw.nicheBoosts) ? raw.nicheBoosts : [],
      craftHints: Array.isArray(raw.craftHints) ? raw.craftHints : [],
      pipelineNotes: Array.isArray(raw.pipelineNotes) ? raw.pipelineNotes : [],
      seenPatternKeys: Array.isArray(raw.seenPatternKeys) ? raw.seenPatternKeys : [],
    };
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      bansExtra: mergeUniqueStrings(foreign.bansExtra, tellMem.bansExtra),
      nicheBoosts: [...foreign.nicheBoosts, ...tellMem.nicheBoosts].slice(-40),
      craftHints: [...foreign.craftHints, ...tellMem.craftHints].slice(-40),
      pipelineNotes: [...foreign.pipelineNotes, ...tellMem.pipelineNotes].slice(-50),
      seenPatternKeys: mergeUniqueStrings(foreign.seenPatternKeys, tellMem.seenPatternKeys),
    };
  } catch {
    return tellMem;
  }
}

export type CorridorDigest = {
  category: string;
  source: "design-data" | "tell" | "none";
  notes: string[];
};

/** Pull a few anonymised band medians for DIRECTION corridor honesty. */
export function corridorDigest(
  category: string,
  tellRoot = repoRoot(),
): CorridorDigest {
  const paths: Array<{ path: string; source: CorridorDigest["source"] }> = [];
  const status = ensureDesignData(tellRoot);
  if (status.root) {
    const p = firstExisting(status.root, ["aggregate.json", "research/aggregate.json"]);
    if (p) paths.push({ path: p, source: "design-data" });
  }
  const tellAgg = resolve(tellRoot, "research/aggregate.json");
  if (existsSync(tellAgg)) paths.push({ path: tellAgg, source: "tell" });

  for (const { path, source } of paths) {
    try {
      const agg = JSON.parse(readFileSync(path, "utf8")) as {
        byCategory?: Record<string, Record<string, { median?: number; n?: number }>>;
      };
      const bucket = agg.byCategory?.[category];
      if (!bucket) continue;
      const notes: string[] = [];
      const pick = (key: string, label: string) => {
        const s = bucket[key];
        if (s && typeof s.median === "number") {
          notes.push(`${label} median≈${Number(s.median).toFixed(2)} (n=${s.n ?? "?"})`);
        }
      };
      pick("typography.rangeRatio", "type range");
      pick("typography.distinctSizes", "type sizes");
      pick("layout.foldFigureShare", "fold figure share");
      pick("color.chromaticCount", "chromatic count");
      if (notes.length) return { category, source, notes: notes.slice(0, 4) };
    } catch {
      /* try next */
    }
  }
  return { category, source: "none", notes: [] };
}

/** After learn, mirror engine memory (+ optional LEARN.md) into the personal data repo. */
export function writeBackDesignData(
  tellRoot: string,
  opts: { runId: string; learnMarkdown?: string },
): string {
  const status = ensureDesignData(tellRoot);
  if (!status.root) return "design-data write-back skipped (no checkout)";
  const mem = loadMemory(tellRoot);
  saveMemory(tellRoot, mem); // ensure Tell copy is current
  const outMem = resolve(status.root, "agency-engine-memory.json");
  writeFileSync(outMem, `${JSON.stringify(mem, null, 2)}\n`, "utf8");

  const learningsSrc = resolve(tellRoot, "research/LEARNINGS.md");
  if (existsSync(learningsSrc)) {
    cpSync(learningsSrc, resolve(status.root, "LEARNINGS.md"));
  }
  if (opts.learnMarkdown) {
    const runsDir = resolve(status.root, "runs", opts.runId);
    mkdirSync(runsDir, { recursive: true });
    writeFileSync(resolve(runsDir, "LEARN.md"), opts.learnMarkdown, "utf8");
  }

  // Best-effort commit in the data repo (never fails the Tell run)
  if (existsSync(resolve(status.root, ".git")) && process.env.TELL_DESIGN_DATA_COMMIT !== "0") {
    spawnSync("git", ["add", "agency-engine-memory.json", "LEARNINGS.md", "runs"], {
      cwd: status.root,
      encoding: "utf8",
    });
    spawnSync(
      "git",
      [
        "commit",
        "-m",
        `learn: agency run ${opts.runId}`,
      ],
      { cwd: status.root, encoding: "utf8" },
    );
  }
  return `wrote memory (+ learnings) → ${status.root}`;
}

export function listMeasurementRefs(
  categoryHint: string,
  tellRoot = repoRoot(),
): string[] {
  const status = ensureDesignData(tellRoot);
  if (!status.root) return [];
  const dir =
    [
      resolve(status.root, "measurements"),
      resolve(status.root, "research/measurements"),
    ].find((d) => existsSync(d)) ?? null;
  if (!dir) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json")
    .filter((f) => {
      try {
        const rec = JSON.parse(readFileSync(join(dir, f), "utf8")) as {
          category?: string;
        };
        return !categoryHint || rec.category === categoryHint;
      } catch {
        return false;
      }
    })
    .slice(0, 12);
}
