/**
 * Committed, machine-readable memory for the agency design engine.
 * Fed by `agency:learn` after each run; consumed on the next `agency:run`.
 * Narrative twin: research/LEARNINGS.md (human). No third-party hosts here.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type NicheBoost = {
  nicheKey: string;
  /** Source for RegExp — must be safe, no flags with side effects */
  pattern: string;
  fromRun: string;
  reason: string;
};

export type CraftHint = {
  siteKind: string;
  note: string;
  fromRun: string;
};

export type PipelineNote = {
  key: string;
  detail: string;
  fromRun: string;
  at: string;
};

export type EngineMemory = {
  version: 1;
  updatedAt: string;
  /** Extra ban phrases merged into every auto brief */
  bansExtra: string[];
  /** Soft niche classifiers learned from query→outcome runs */
  nicheBoosts: NicheBoost[];
  /** siteKind craft reminders injected into DIRECTION.md */
  craftHints: CraftHint[];
  /** Durable pipeline observations (retries, thin boards, gate ids) */
  pipelineNotes: PipelineNote[];
  /** Pattern keys already written to LEARNINGS.md */
  seenPatternKeys: string[];
};

export const EMPTY_MEMORY = (): EngineMemory => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  bansExtra: [],
  nicheBoosts: [],
  craftHints: [],
  pipelineNotes: [],
  seenPatternKeys: [],
});

export function memoryPath(root: string): string {
  return resolve(root, "research/agency-engine-memory.json");
}

export function loadMemory(root: string): EngineMemory {
  const path = memoryPath(root);
  if (!existsSync(path)) return EMPTY_MEMORY();
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<EngineMemory>;
    return {
      ...EMPTY_MEMORY(),
      ...raw,
      version: 1,
      bansExtra: Array.isArray(raw.bansExtra) ? raw.bansExtra : [],
      nicheBoosts: Array.isArray(raw.nicheBoosts) ? raw.nicheBoosts : [],
      craftHints: Array.isArray(raw.craftHints) ? raw.craftHints : [],
      pipelineNotes: Array.isArray(raw.pipelineNotes) ? raw.pipelineNotes : [],
      seenPatternKeys: Array.isArray(raw.seenPatternKeys) ? raw.seenPatternKeys : [],
    };
  } catch {
    return EMPTY_MEMORY();
  }
}

export function saveMemory(root: string, memory: EngineMemory): void {
  const path = memoryPath(root);
  mkdirSync(dirname(path), { recursive: true });
  memory.updatedAt = new Date().toISOString();
  memory.version = 1;
  writeFileSync(path, `${JSON.stringify(memory, null, 2)}\n`, "utf8");
}

export function mergeUniqueStrings(existing: string[], next: string[]): string[] {
  const out = [...existing];
  for (const item of next) {
    const t = item.trim();
    if (!t) continue;
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out;
}

/** Safe RegExp from a stored pattern — returns null if invalid / too broad. */
export function compileBoost(pattern: string): RegExp | null {
  const p = pattern.trim();
  if (p.length < 3 || p.length > 80) return null;
  if (/^\.\*$/.test(p) || p === ".") return null;
  try {
    return new RegExp(p, "i");
  } catch {
    return null;
  }
}
