import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { SourceFile } from "@tell/redesign";
import type { TellReport } from "@tell/schema";
import { getJob, getJobWorkspace } from "./repo-runner";

const SOURCE_EXTENSIONS = new Set([
  ".css", ".scss", ".sass", ".less",
  ".tsx", ".jsx", ".ts", ".js",
  ".html", ".vue", ".svelte",
]);
const SKIP_DIRS = new Set([".git", ".next", ".nuxt", ".output", "node_modules", "dist", "build", "coverage", "public"]);
const MAX_FILES = 180;
const MAX_FILE_BYTES = 140_000;
const MAX_TOTAL_BYTES = 1_400_000;
const PROOF_PATCH_MARKER = "tell-proof.patch";

type AppliedPatch = {
  patch: string;
  files: string[];
  appliedAt: number;
};

interface ProofRegistry {
  applied: Map<string, AppliedPatch>;
}

const g = globalThis as unknown as { __tellProofRegistry?: ProofRegistry };
const registry = g.__tellProofRegistry ?? (g.__tellProofRegistry = { applied: new Map() });

function sourcePriority(file: string): number {
  const name = file.toLowerCase();
  if (/globals?\.css$|app\.css$|styles?\.css$|tailwind\.config/.test(name)) return 0;
  if (/\/(page|layout|app|index)\.(tsx|jsx|vue|svelte)$/.test(name)) return 1;
  if (/\/components?\//.test(name)) return 2;
  if (/\.(css|scss|sass|less)$/.test(name)) return 3;
  return 4;
}

async function walk(dir: string, root: string, out: string[]): Promise<void> {
  if (out.length >= MAX_FILES * 2) return;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (out.length >= MAX_FILES * 2) return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) await walk(full, root, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (SOURCE_EXTENSIONS.has(ext) || /^tailwind\.config\./.test(entry.name)) {
      out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
}

export async function collectProjectSources(jobId: string): Promise<{
  files: SourceFile[];
  scannedFiles: number;
  totalBytes: number;
}> {
  const workspace = getJobWorkspace(jobId);
  const job = getJob(jobId);
  if (!workspace || !job) throw new Error("The repo workspace is unavailable. Set up the repo again.");

  const candidates: string[] = [];
  await walk(workspace.appDir, workspace.repoDir, candidates);
  candidates.sort((a, b) => sourcePriority(a) - sourcePriority(b) || a.localeCompare(b));

  const files: SourceFile[] = [];
  let totalBytes = 0;
  for (const relative of candidates.slice(0, MAX_FILES)) {
    const absolute = path.resolve(workspace.repoDir, relative);
    if (!absolute.startsWith(`${path.resolve(workspace.repoDir)}${path.sep}`)) continue;
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat || stat.size > MAX_FILE_BYTES || totalBytes + stat.size > MAX_TOTAL_BYTES) continue;
    const contents = await fs.readFile(absolute, "utf8").catch(() => "");
    if (!contents || contents.includes("\u0000")) continue;
    files.push({ path: relative, contents });
    totalBytes += Buffer.byteLength(contents);
  }

  return { files, scannedFiles: candidates.length, totalBytes };
}

/** Rank source by literal evidence observed in the rendered page, then by likely UI ownership. */
export function rankSourcesForReport(files: SourceFile[], report: TellReport): {
  files: SourceFile[];
  matchedFiles: number;
} {
  const signals = new Set<string>();
  for (const variable of report.capture.cssVariables.slice(0, 80)) {
    signals.add(variable.name.toLowerCase());
    if (variable.value.length >= 3 && variable.value.length <= 80) signals.add(variable.value.toLowerCase());
  }
  for (const color of report.fingerprint.colors.slice(0, 12)) signals.add(color.normalizedHex.toLowerCase());
  for (const font of report.fingerprint.fontFamilies.slice(0, 6)) {
    const family = font.family.replace(/["']/g, "").trim().toLowerCase();
    if (family.length >= 3) signals.add(family);
  }
  for (const style of report.capture.styles.slice(0, 120)) {
    for (const token of style.selector.match(/[.#][a-zA-Z][\w-]+/g) ?? []) signals.add(token.slice(1).toLowerCase());
  }
  const radius = report.capture.surfaceTokens?.radius?.toLowerCase();
  if (radius && radius !== "0px") signals.add(radius);

  const scored = files.map((file, index) => {
    const haystack = file.contents.toLowerCase();
    let score = Math.max(0, 8 - sourcePriority(file.path) * 2);
    let literalMatches = 0;
    for (const signal of signals) {
      if (!haystack.includes(signal)) continue;
      literalMatches++;
      score += signal.startsWith("--") ? 6 : signal.startsWith("#") ? 5 : 2;
    }
    return { file, score, literalMatches, index };
  });
  const matchedFiles = scored.filter((item) => item.literalMatches > 0).length;
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return { files: scored.map((item) => item.file), matchedFiles };
}

function patchFiles(patch: string): string[] {
  const files = new Set<string>();
  for (const line of patch.split("\n")) {
    const match = line.match(/^(?:---|\+\+\+) (?:[ab]\/)?(.+)$/);
    if (!match || match[1] === "/dev/null") continue;
    const file = match[1]!.trim();
    if (path.isAbsolute(file) || file.split(/[\\/]/).includes("..")) {
      throw new Error(`Unsafe patch path: ${file}`);
    }
    files.add(file);
  }
  if (!files.size) throw new Error("The proposal does not contain a valid unified diff.");
  return Array.from(files);
}

function gitApply(cwd: string, patch: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["apply", "--whitespace=nowarn", ...args, "-"], {
      cwd,
      env: process.env,
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `git apply exited with code ${code ?? "unknown"}`));
    });
    child.stdin.end(patch);
  });
}

export async function applyPatchToWorkspace(jobId: string, patch: string): Promise<AppliedPatch> {
  const workspace = getJobWorkspace(jobId);
  const job = getJob(jobId);
  if (!workspace || !job || !job.url) throw new Error("The repo must be running before Tell can prove a patch.");
  if (!patch.trim() || Buffer.byteLength(patch) > 1_000_000) throw new Error("The patch is empty or too large to apply safely.");
  if (registry.applied.has(jobId)) throw new Error("A proof patch is already applied. Keep it or revert it before trying another.");

  const files = patchFiles(patch);
  const allowedSources = await collectProjectSources(jobId);
  const allowedPaths = new Set(allowedSources.files.map((source) => source.path));
  const blocked = files.filter((file) => !allowedPaths.has(file));
  if (blocked.length) {
    throw new Error(`The patch tried to change files outside its reviewed UI source context: ${blocked.join(", ")}`);
  }
  await gitApply(workspace.repoDir, patch, ["--check"]);
  await gitApply(workspace.repoDir, patch, []);
  try {
    await fs.writeFile(path.join(workspace.repoDir, ".git", PROOF_PATCH_MARKER), patch, "utf8");
  } catch (error) {
    await gitApply(workspace.repoDir, patch, ["--reverse"]).catch(() => {});
    throw error;
  }
  const applied = { patch, files, appliedAt: Date.now() };
  registry.applied.set(jobId, applied);
  return applied;
}

export async function revertWorkspacePatch(jobId: string): Promise<{ reverted: boolean; files: string[] }> {
  const workspace = getJobWorkspace(jobId);
  const applied = registry.applied.get(jobId);
  if (!workspace || !applied) return { reverted: false, files: [] };
  await gitApply(workspace.repoDir, applied.patch, ["--reverse"]);
  await fs.rm(path.join(workspace.repoDir, ".git", PROOF_PATCH_MARKER), { force: true });
  registry.applied.delete(jobId);
  return { reverted: true, files: applied.files };
}

export function getAppliedPatch(jobId: string): AppliedPatch | undefined {
  return registry.applied.get(jobId);
}
