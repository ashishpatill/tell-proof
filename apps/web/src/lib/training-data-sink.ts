import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./repo-root";

/**
 * Local-only training-data sink.
 * Writes Tell session + design artifacts into a sibling `tell-design-data` checkout,
 * then triggers that repo's `sync` (inbox ingest + curated JSONL convert).
 */

export type TrainingSinkKind =
  | "diagnose"
  | "voice"
  | "redesign"
  | "restyle"
  | "proof"
  | "matrix"
  | "design";

type SinkPaths = {
  repo: string;
  root: string;
  rawEpisodes: string;
  rawShots: string;
  rawVoice: string;
  rawRedesign: string;
  rawRestyle: string;
  rawProof: string;
  rawMatrix: string;
  rawDesign: string;
  sessions: string;
  byDay: string;
  meta: string;
  ledger: string;
};

let cached: SinkPaths | null | undefined;
let lastSessionId: string | null = null;
let loggedReady = false;
let harnessTimer: ReturnType<typeof setTimeout> | null = null;
let harnessRunning = false;

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

  const root = repoRoot();
  const candidates = [
    path.resolve(root, "..", "tell-design-data"),
    path.resolve("/volumes/developer/workspace/tell-design-data"),
    path.resolve(root, "tell-design-data"),
    path.resolve(process.cwd(), "..", "tell-design-data"),
    path.resolve(process.cwd(), "..", "..", "tell-design-data"),
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
    rawRestyle: path.join(root, "raw", "restyle"),
    rawProof: path.join(root, "raw", "proof"),
    rawMatrix: path.join(root, "raw", "matrix"),
    rawDesign: path.join(root, "raw", "design"),
    sessions: path.join(root, "sessions"),
    byDay: path.join(root, "by-day"),
    meta: path.join(root, "meta"),
    ledger: path.join(root, "meta", "ledger.jsonl"),
  };

  if (!loggedReady) {
    loggedReady = true;
    console.info(`[training-data-sink] writing → ${cached.root}`);
  }

  return cached;
}

export function trainingSinkStatus(): {
  enabled: boolean;
  repo: string | null;
  root: string | null;
  reason: string;
} {
  if (disabledExplicitly()) {
    return { enabled: false, repo: null, root: null, reason: "TELL_TRAINING_DATA=0" };
  }
  if (process.env.VERCEL && !forcedOn()) {
    return { enabled: false, repo: null, root: null, reason: "vercel_default_off" };
  }
  const repo = resolveDesignDataRepo();
  if (!repo) {
    return {
      enabled: false,
      repo: null,
      root: null,
      reason: "tell-design-data_not_found",
    };
  }
  return {
    enabled: true,
    repo,
    root: path.join(repo, "training-data"),
    reason: "ok",
  };
}

async function ensureDirs(sink: SinkPaths): Promise<void> {
  await Promise.all([
    mkdir(sink.rawEpisodes, { recursive: true }),
    mkdir(sink.rawShots, { recursive: true }),
    mkdir(sink.rawVoice, { recursive: true }),
    mkdir(sink.rawRedesign, { recursive: true }),
    mkdir(sink.rawRestyle, { recursive: true }),
    mkdir(sink.rawProof, { recursive: true }),
    mkdir(sink.rawMatrix, { recursive: true }),
    mkdir(sink.rawDesign, { recursive: true }),
    mkdir(sink.sessions, { recursive: true }),
    mkdir(sink.byDay, { recursive: true }),
    mkdir(sink.meta, { recursive: true }),
    mkdir(path.join(sink.root, "curated"), { recursive: true }),
    mkdir(path.join(sink.root, "inbox"), { recursive: true }),
  ]);
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
    if (typeof capture.snapshotHtml === "string" && capture.snapshotHtml.length > 400_000) {
      capture.snapshotHtml = `${capture.snapshotHtml.slice(0, 400_000)}\n<!-- truncated for training-data sink -->`;
    }
  }
  return { report: clone, screenshotBase64 };
}

function slimReport(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  if (obj.capture && typeof obj.capture === "object") {
    const { report } = stripHeavyCapture(obj);
    return report;
  }
  return value;
}

async function appendLedger(
  sink: SinkPaths,
  row: Record<string, unknown>,
): Promise<void> {
  await appendFile(sink.ledger, `${JSON.stringify({ at: new Date().toISOString(), ...row })}\n`, "utf8");
}

async function mirrorByDay(
  sink: SinkPaths,
  kind: string,
  id: string,
  body: unknown,
): Promise<void> {
  const dir = path.join(sink.byDay, dayKey(), kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.json`), JSON.stringify(body, null, 2), "utf8");
}

/**
 * Debounced spawn of `tell-design-data sync` so inbox → curated JSONL stays fresh
 * whenever Tell creates designs or session artifacts.
 */
export function scheduleDesignDataHarness(sink: SinkPaths = resolveTrainingSink()!): void {
  if (!sink) return;
  if (process.env.TELL_TRAINING_DATA_SYNC === "0") return;

  if (harnessTimer) clearTimeout(harnessTimer);
  harnessTimer = setTimeout(() => {
    harnessTimer = null;
    void runDesignDataHarness(sink);
  }, 1200);
}

function resolveHarnessCommand(repo: string): { cmd: string; args: string[]; cwd: string } | null {
  const home = path.join(repo, "training-data");
  const distCli = path.join(repo, "dist", "cli", "index.js");
  const srcCli = path.join(repo, "src", "cli", "index.ts");
  const tsxBin = path.join(repo, "node_modules", ".bin", "tsx");

  if (existsSync(distCli)) {
    return { cmd: process.execPath, args: [distCli, "sync", "--home", home], cwd: repo };
  }
  if (existsSync(tsxBin) && existsSync(srcCli)) {
    return { cmd: tsxBin, args: [srcCli, "sync", "--home", home], cwd: repo };
  }
  if (existsSync(srcCli)) {
    // Last resort: npx tsx from the harness repo
    return {
      cmd: "npx",
      args: ["--yes", "tsx", srcCli, "sync", "--home", home],
      cwd: repo,
    };
  }
  return null;
}

export function runDesignDataHarness(sink: SinkPaths): Promise<void> {
  if (harnessRunning) {
    scheduleDesignDataHarness(sink);
    return Promise.resolve();
  }

  // Nested tell-design-data needs its own install; skip sync when deps are missing.
  const chokidarPath = path.join(sink.repo, "node_modules", "chokidar");
  if (!existsSync(chokidarPath)) {
    console.warn(
      "[training-data-sink] tell-design-data deps missing (chokidar); raw episode written, sync skipped. Run pnpm install in the design-data repo.",
    );
    return Promise.resolve();
  }

  const launch = resolveHarnessCommand(sink.repo);
  if (!launch) {
    console.warn("[training-data-sink] tell-design-data CLI not found; raw files written only");
    return Promise.resolve();
  }

  harnessRunning = true;
  return new Promise((resolve) => {
    const child = spawn(launch.cmd, launch.args, {
      cwd: launch.cwd,
      env: {
        ...process.env,
        TELL_DESIGN_DATA_HOME: sink.root,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      harnessRunning = false;
      console.warn("[training-data-sink] harness spawn failed:", err.message);
      resolve();
    });
    child.on("close", (code) => {
      harnessRunning = false;
      if (code === 0) {
        console.info("[training-data-sink] tell-design-data sync ok");
      } else {
        console.warn(
          `[training-data-sink] tell-design-data sync exit ${code}${stderr ? `: ${stderr.slice(0, 400)}` : ""}`,
        );
      }
      resolve();
    });
  });
}

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
    await writeFile(
      path.join(sink.root, "inbox", `${id}.json`),
      JSON.stringify({ report, meta: episode.meta }, null, 2),
      "utf8",
    );
    await mirrorByDay(sink, "episodes", id, episode);
    await appendLedger(sink, {
      kind,
      session_id: sessionId,
      episode_id: id,
      path: path.relative(sink.root, episodePath),
      live: meta.live,
      url: episode.url,
    });
    scheduleDesignDataHarness(sink);
    return { sessionId, path: episodePath };
  }

  if (kind === "design") {
    const previewHtml = typeof payload.previewHtml === "string" ? payload.previewHtml : "";
    const spec = (payload.spec as Record<string, unknown> | undefined) ?? undefined;
    const brief = payload.brief;
    let htmlRel: string | undefined;
    if (previewHtml) {
      const htmlPath = path.join(sink.rawDesign, `${id}.html`);
      await writeFile(htmlPath, previewHtml, "utf8");
      htmlRel = path.relative(sink.root, htmlPath);
      await writeFile(path.join(sessionDir, "preview.html"), previewHtml, "utf8");
    }

    const body = {
      id,
      session_id: sessionId,
      kind: "design" as const,
      artifact_kind: "design" as const,
      created_at: new Date().toISOString(),
      source: "tell-proof",
      meta: {
        ...meta,
        artifact_kind: "design",
        htmlPath: htmlRel,
        htmlBytes: previewHtml.length,
      },
      payload: {
        brief,
        spec,
        showcaseKey: payload.showcaseKey ?? meta.showcaseKey ?? null,
        siteKind: payload.siteKind ?? meta.siteKind ?? null,
        productName: payload.productName ?? meta.productName ?? null,
        // Prefer path over embedding huge HTML twice in inbox
        previewHtml: previewHtml.length <= 80_000 ? previewHtml : undefined,
        htmlPath: htmlRel,
      },
    };

    const outPath = path.join(sink.rawDesign, `${id}.json`);
    await writeFile(outPath, JSON.stringify(body, null, 2), "utf8");
    await writeFile(path.join(sessionDir, "design.json"), JSON.stringify(body, null, 2), "utf8");
    await writeFile(path.join(sink.root, "inbox", `${id}.json`), JSON.stringify(body, null, 2), "utf8");
    await mirrorByDay(sink, "design", id, { ...body, payload: { ...body.payload, previewHtml: undefined } });
    await appendLedger(sink, {
      kind,
      session_id: sessionId,
      id,
      path: path.relative(sink.root, outPath),
      showcaseKey: body.payload.showcaseKey,
    });
    scheduleDesignDataHarness(sink);
    return { sessionId, path: outPath };
  }

  const outDir =
    kind === "voice"
      ? sink.rawVoice
      : kind === "redesign"
        ? sink.rawRedesign
        : kind === "restyle"
          ? sink.rawRestyle
          : kind === "proof"
            ? sink.rawProof
            : sink.rawMatrix;

  const slimPayload: Record<string, unknown> = { ...payload };
  for (const key of ["report", "beforeReport", "afterReport", "matrix"] as const) {
    if (key in slimPayload) {
      slimPayload[key] = slimReport(slimPayload[key]);
    }
  }
  if (kind === "matrix" && slimPayload.matrix && typeof slimPayload.matrix === "object") {
    const matrix = slimPayload.matrix as Record<string, unknown>;
    if (Array.isArray(matrix.cells)) {
      matrix.cells = matrix.cells.map((cell) => {
        if (!cell || typeof cell !== "object") return cell;
        const c = { ...(cell as Record<string, unknown>) };
        if (c.report) c.report = slimReport(c.report);
        if (typeof c.screenshotBase64 === "string") c.screenshotBase64 = "[external:shots]";
        return c;
      });
    }
  }

  const outPath = path.join(outDir, `${id}.json`);
  const body = {
    id,
    session_id: sessionId,
    kind,
    created_at: new Date().toISOString(),
    source: "tell-proof",
    meta,
    payload: slimPayload,
  };
  await writeFile(outPath, JSON.stringify(body, null, 2), "utf8");
  await writeFile(path.join(sessionDir, `${kind}.json`), JSON.stringify(body, null, 2), "utf8");
  await mirrorByDay(sink, kind, id, body);
  // Inbox is only for harness ingest (TellReport envelopes + design artifacts).
  await appendLedger(sink, {
    kind,
    session_id: sessionId,
    id,
    path: path.relative(sink.root, outPath),
  });
  scheduleDesignDataHarness(sink);
  return { sessionId, path: outPath };
}

/** Test helper — clear memoization. */
export function resetTrainingSinkCache(): void {
  cached = undefined;
  lastSessionId = null;
  loggedReady = false;
  if (harnessTimer) {
    clearTimeout(harnessTimer);
    harnessTimer = null;
  }
}
