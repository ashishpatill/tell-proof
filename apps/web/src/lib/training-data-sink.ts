import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./repo-root";

/**
 * Local-only training-data sink.
 * Writes Tell session artifacts into a sibling `tell-design-data` checkout:
 *   {TELL_DESIGN_DATA_REPO}/training-data/...
 *
 * Never runs on Vercel unless TELL_TRAINING_DATA=1 is forced.
 * Auto-enables in local/dev when the sibling repo (or env path) exists.
 */

export type TrainingSinkKind = "diagnose" | "voice" | "redesign";

type SinkPaths = {
  repo: string;
  root: string;
  rawEpisodes: string;
  rawShots: string;
  rawVoice: string;
  rawRedesign: string;
  sessions: string;
  meta: string;
  ledger: string;
};

let cached: SinkPaths | null | undefined;
let lastSessionId: string | null = null;

function disabledExplicitly(): boolean {
  const flag = process.env.TELL_TRAINING_DATA?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return true;
  return false;
}

function forcedOn(): boolean {
  const flag = process.env.TELL_TRAINING_DATA?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

function looksLikeDesignDataRepo(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const pkg = path.join(dir, "package.json");
  if (existsSync(pkg)) {
    try {
      const raw = JSON.parse(readFileSync(pkg, "utf8")) as { name?: string };
      if (raw.name === "tell-design-data") return true;
    } catch {
      /* fall through */
    }
  }
  return (
    existsSync(path.join(dir, "training-data")) ||
    existsSync(path.join(dir, "src", "cli", "index.ts")) ||
    existsSync(path.join(dir, "README.md"))
  );
}

/** Resolve tell-design-data checkout. */
export function resolveDesignDataRepo(): string | null {
  const fromEnv = process.env.TELL_DESIGN_DATA_REPO?.trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    return existsSync(resolved) ? resolved : null;
  }

  const candidates = [
    path.resolve(repoRoot(), "..", "tell-design-data"),
    path.resolve("/volumes/developer/workspace/tell-design-data"),
    path.resolve(process.cwd(), "..", "..", "..", "tell-design-data"),
  ];
  for (const c of candidates) {
    if (looksLikeDesignDataRepo(c)) return c;
  }
  return null;
}

export function resolveTrainingSink(): SinkPaths | null {
  if (cached !== undefined) return cached;

  if (disabledExplicitly()) {
    cached = null;
    return cached;
  }

  // Production SaaS: off unless forced
  if (process.env.VERCEL && !forcedOn()) {
    cached = null;
    return cached;
  }

  const repo = resolveDesignDataRepo();
  if (!repo) {
    cached = null;
    return cached;
  }

  const root = path.join(repo, "training-data");
  cached = {
    repo,
    root,
    rawEpisodes: path.join(root, "raw", "episodes"),
    rawShots: path.join(root, "raw", "shots"),
    rawVoice: path.join(root, "raw", "voice"),
    rawRedesign: path.join(root, "raw", "redesign"),
    sessions: path.join(root, "sessions"),
    meta: path.join(root, "meta"),
    ledger: path.join(root, "meta", "ledger.jsonl"),
  };
  return cached;
}

async function ensureDirs(sink: SinkPaths): Promise<void> {
  await Promise.all([
    mkdir(sink.rawEpisodes, { recursive: true }),
    mkdir(sink.rawShots, { recursive: true }),
    mkdir(sink.rawVoice, { recursive: true }),
    mkdir(sink.rawRedesign, { recursive: true }),
    mkdir(sink.sessions, { recursive: true }),
    mkdir(sink.meta, { recursive: true }),
    mkdir(path.join(sink.root, "curated"), { recursive: true }),
    mkdir(path.join(sink.root, "inbox"), { recursive: true }),
  ]);
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

function newSessionId(): string {
  return `sess_${stamp()}_${randomUUID().slice(0, 8)}`;
}

function stripHeavyCapture(report: Record<string, unknown>): {
  report: Record<string, unknown>;
  screenshotBase64?: string;
} {
  const clone = structuredClone(report) as Record<string, unknown>;
  const capture = clone.capture as Record<string, unknown> | undefined;
  let screenshotBase64: string | undefined;
  if (capture && typeof capture.screenshotBase64 === "string") {
    screenshotBase64 = capture.screenshotBase64;
    capture.screenshotBase64 = `[external:shots]`;
    // Keep HTML but cap extreme size
    if (typeof capture.snapshotHtml === "string" && capture.snapshotHtml.length > 400_000) {
      capture.snapshotHtml = `${capture.snapshotHtml.slice(0, 400_000)}\n<!-- truncated for training-data sink -->`;
    }
  }
  return { report: clone, screenshotBase64 };
}

async function appendLedger(
  sink: SinkPaths,
  row: Record<string, unknown>,
): Promise<void> {
  await appendFile(sink.ledger, `${JSON.stringify({ at: new Date().toISOString(), ...row })}\n`, "utf8");
}

/**
 * Fire-and-forget safe writer. Never throws into the request path.
 */
export function recordTrainingEvent(
  kind: TrainingSinkKind,
  payload: Record<string, unknown>,
  meta: Record<string, unknown> = {},
): void {
  void writeTrainingEvent(kind, payload, meta).catch((err) => {
    console.warn("[training-data-sink]", err instanceof Error ? err.message : err);
  });
}

export async function writeTrainingEvent(
  kind: TrainingSinkKind,
  payload: Record<string, unknown>,
  meta: Record<string, unknown> = {},
): Promise<{ sessionId: string; path: string } | null> {
  const sink = resolveTrainingSink();
  if (!sink) return null;
  await ensureDirs(sink);

  const sessionId =
    (typeof meta.sessionId === "string" && meta.sessionId) ||
    lastSessionId ||
    newSessionId();
  lastSessionId = sessionId;

  const id = `${kind}_${stamp()}_${hash({ kind, payload: Object.keys(payload) })}`;
  const sessionDir = path.join(sink.sessions, sessionId);
  await mkdir(sessionDir, { recursive: true });

  if (kind === "diagnose") {
    const reportIn = (payload.report as Record<string, unknown> | undefined) ?? payload;
    const { report, screenshotBase64 } = stripHeavyCapture(reportIn);
    let shotPath: string | undefined;
    if (screenshotBase64) {
      const raw = screenshotBase64.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(raw, "base64");
      shotPath = path.join(sink.rawShots, `${id}.png`);
      await writeFile(shotPath, buf);
      await writeFile(path.join(sessionDir, "shot.png"), buf);
    }

    const episode = {
      episode_id: id,
      session_id: sessionId,
      kind,
      created_at: new Date().toISOString(),
      source: "tell-proof",
      url: (report.capture as { url?: string } | undefined)?.url ?? meta.url ?? "",
      meta: { ...meta, shotPath: shotPath ? path.relative(sink.root, shotPath) : undefined },
      report,
    };
    const episodePath = path.join(sink.rawEpisodes, `${id}.json`);
    await writeFile(episodePath, JSON.stringify(episode, null, 2), "utf8");
    await writeFile(path.join(sessionDir, "diagnose.json"), JSON.stringify(episode, null, 2), "utf8");
    // Drop a copy in inbox for tell-design-data watch/convert
    await writeFile(
      path.join(sink.root, "inbox", `${id}.json`),
      JSON.stringify({ report, meta: episode.meta }, null, 2),
      "utf8",
    );
    await appendLedger(sink, {
      kind,
      session_id: sessionId,
      episode_id: id,
      path: path.relative(sink.root, episodePath),
      live: meta.live,
      url: episode.url,
    });
    return { sessionId, path: episodePath };
  }

  const outDir = kind === "voice" ? sink.rawVoice : sink.rawRedesign;
  const outPath = path.join(outDir, `${id}.json`);
  const body = {
    id,
    session_id: sessionId,
    kind,
    created_at: new Date().toISOString(),
    source: "tell-proof",
    meta,
    payload,
  };
  await writeFile(outPath, JSON.stringify(body, null, 2), "utf8");
  await writeFile(path.join(sessionDir, `${kind}.json`), JSON.stringify(body, null, 2), "utf8");
  await appendLedger(sink, {
    kind,
    session_id: sessionId,
    id,
    path: path.relative(sink.root, outPath),
  });
  return { sessionId, path: outPath };
}

/** Test helper — clear memoization. */
export function resetTrainingSinkCache(): void {
  cached = undefined;
  lastSessionId = null;
}
