#!/usr/bin/env tsx
/**
 * Emit an anonymised design/research training episode.
 *
 * Prefer sibling tell-design-data checkout when present; otherwise write a
 * stub under research/training.local/ (gitignored). Never commit JSONL hosts.
 *
 * Usage:
 *   pnpm exec tsx scripts/emit-design-training-episode.ts --kind research --domain sport:cricket --ledger research/boards/crease-multipage/capture-ledger.json
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function looksLikeDesignDataRepo(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const pkg = join(dir, "package.json");
  if (existsSync(pkg)) {
    try {
      const raw = JSON.parse(readFileSync(pkg, "utf8")) as { name?: string };
      if (raw.name === "tell-design-data") return true;
    } catch {
      /* fall through */
    }
  }
  return existsSync(join(dir, "training-data"));
}

function resolveDesignDataRepo(): string | null {
  const fromEnv = process.env.TELL_DESIGN_DATA_REPO?.trim();
  if (fromEnv && existsSync(fromEnv)) return resolve(fromEnv);
  const candidates = [
    resolve(repoRoot, "..", "tell-design-data"),
    resolve(repoRoot, "tell-design-data"),
  ];
  for (const c of candidates) {
    if (looksLikeDesignDataRepo(c)) return c;
  }
  return null;
}

function stripHosts(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/https?:\/\/[^\s"'<>]+/gi, "[redacted-url]");
  }
  if (Array.isArray(value)) return value.map(stripHosts);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/url|host|href|base/i.test(k) && typeof v === "string") {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = stripHosts(v);
    }
    return out;
  }
  return value;
}

async function main(): Promise<void> {
  const kind = (argValue("--kind") ?? "research") as "research" | "design";
  const domain = argValue("--domain") ?? "sport:cricket";
  const ledgerArg = argValue("--ledger");
  const note = argValue("--note") ?? "website-domain-research phase0";

  let ledger: unknown = null;
  if (ledgerArg) {
    const ledgerPath = resolve(repoRoot, ledgerArg);
    if (existsSync(ledgerPath)) {
      ledger = stripHosts(JSON.parse(readFileSync(ledgerPath, "utf8")));
    }
  }

  const episode = {
    id: randomUUID(),
    kind,
    domain,
    note,
    createdAt: new Date().toISOString(),
    schema: "tell.design-training.episode.v1",
    anonymised: true,
    researchNodes: [
      "load-prior-domain",
      "requirement-gap-diff",
      "multipage-walkthrough",
      "category-gap-audit",
      "ia-shell-synthesis",
      "variant-lens",
      "emit-training-episode",
    ],
    ledger,
  };

  const payload = `${JSON.stringify(episode)}\n`;
  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 12);

  const designData = resolveDesignDataRepo();
  let dest: string;
  if (designData) {
    const day = new Date().toISOString().slice(0, 10);
    const dir = join(designData, "training-data", "raw", "research", day);
    mkdirSync(dir, { recursive: true });
    dest = join(dir, `${domain.replace(/[^a-z0-9_-]+/gi, "_")}-${hash}.jsonl`);
    appendFileSync(dest, payload);
  } else {
    const dir = join(repoRoot, "research/training.local");
    mkdirSync(dir, { recursive: true });
    dest = join(dir, `episode-${kind}-${hash}.jsonl`);
    writeFileSync(dest, payload);
  }

  // Committable ledger pointer (no hosts) — under research/ if boards is gitignored,
  // write a tiny status into research/training.local and echo path for Phase 0 gate.
  const statusDir = join(repoRoot, "research/training.local");
  mkdirSync(statusDir, { recursive: true });
  const statusPath = join(statusDir, "phase0-research-emit.json");
  writeFileSync(
    statusPath,
    `${JSON.stringify(
      {
        ok: true,
        kind,
        domain,
        hash,
        dest: designData ? "[tell-design-data]" : "[research/training.local]",
        emittedAt: episode.createdAt,
        note,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Emitted episode hash=${hash}`);
  console.log(`Wrote → ${dest}`);
  console.log(`Status → ${statusPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
