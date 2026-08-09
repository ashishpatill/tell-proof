import { appendFile, readFile, rename, unlink, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  DesignEpisode,
  LooseTellReport,
  Outcome,
  contentHash,
  newEpisodeId,
} from "../schema/episode.js";
import { scoreDesignArtifact, scoreReport, isRetainable } from "../reward/score.js";
import { scrubJson } from "../scrub/scrub.js";
import { ensureDataDirs, type DataPaths } from "../util/paths.js";

export type IngestOptions = {
  source: DesignEpisode["source"];
  outcome?: Outcome;
  brief?: string;
  direction?: Record<string, unknown>;
  proposal?: Record<string, unknown>;
  finalArtifact?: string;
  proposalArtifact?: string;
  meta?: Record<string, unknown>;
  home?: string;
};

export async function ingestReportJson(
  raw: unknown,
  opts: IngestOptions,
): Promise<DesignEpisode> {
  const paths = await ensureDataDirs(opts.home);
  const report = LooseTellReport.parse(raw);
  const outcome = opts.outcome ?? "unknown";
  const reward = scoreReport(report, outcome);
  const url = report.capture?.url ?? "";
  const episode = DesignEpisode.parse(
    scrubJson({
      episode_id: report.id ? `ep_${contentHash(report.id)}_${contentHash(url)}` : newEpisodeId(contentHash(url || report)),
      created_at: new Date().toISOString(),
      source: opts.source,
      brief: opts.brief ?? "",
      url,
      viewport: report.capture?.viewport,
      outcome,
      reward,
      report,
      direction: opts.direction ?? report.activeDirection,
      proposal: opts.proposal,
      final_artifact: opts.finalArtifact,
      proposal_artifact: opts.proposalArtifact,
      meta: {
        retainable: true,
        ...opts.meta,
      },
    }),
  );
  episode.meta.retainable = isRetainable(episode);
  await persistEpisode(paths, episode);
  await appendFile(
    paths.ledger,
    `${JSON.stringify({
      at: episode.created_at,
      episode_id: episode.episode_id,
      source: episode.source,
      url: episode.url,
      outcome: episode.outcome,
      reward: episode.reward.total,
      retainable: episode.meta.retainable,
    })}\n`,
    "utf8",
  );
  return episode;
}

export async function ingestReportFile(filePath: string, opts: IngestOptions): Promise<DesignEpisode> {
  const text = await readFile(filePath, "utf8");
  const json = JSON.parse(text) as unknown;
  // Allow { report, meta } API envelopes
  const payload =
    json && typeof json === "object" && "report" in (json as object)
      ? (json as { report: unknown; meta?: Record<string, unknown> }).report
      : json;
  const meta =
    json && typeof json === "object" && "meta" in (json as object)
      ? ((json as { meta?: Record<string, unknown> }).meta ?? {})
      : {};
  return ingestReportJson(payload, {
    ...opts,
    meta: { ...meta, ingested_from: path.resolve(filePath), ...opts.meta },
  });
}

export type DesignIngestInput = {
  brief?: string | Record<string, unknown>;
  spec?: Record<string, unknown>;
  previewHtml?: string;
  showcaseKey?: string;
  siteKind?: string;
  productName?: string;
  source?: DesignEpisode["source"];
  outcome?: Outcome;
  meta?: Record<string, unknown>;
  home?: string;
};

function briefText(brief: DesignIngestInput["brief"]): string {
  if (!brief) return "";
  if (typeof brief === "string") return brief;
  const product = typeof brief.productName === "string" ? brief.productName : "";
  const tagline = typeof brief.tagline === "string" ? brief.tagline : "";
  const siteKind = typeof brief.siteKind === "string" ? brief.siteKind : "";
  const features = Array.isArray(brief.features)
    ? brief.features
        .map((f) => (f && typeof f === "object" && "name" in f ? String((f as { name: unknown }).name) : ""))
        .filter(Boolean)
        .join(", ")
    : "";
  return [product, tagline, siteKind && `siteKind=${siteKind}`, features && `features=${features}`]
    .filter(Boolean)
    .join(" | ");
}

/** Ingest a studio/template/website design artifact (DesignSpec + HTML). */
export async function ingestDesignArtifact(input: DesignIngestInput): Promise<DesignEpisode> {
  const paths = await ensureDataDirs(input.home);
  const html = input.previewHtml ?? "";
  const siteKind =
    input.siteKind ||
    (input.spec && typeof input.spec.brief === "object" && input.spec.brief && "siteKind" in input.spec.brief
      ? String((input.spec.brief as { siteKind?: string }).siteKind ?? "")
      : "") ||
    (typeof input.brief === "object" && input.brief && typeof input.brief.siteKind === "string"
      ? input.brief.siteKind
      : "");
  const productName =
    input.productName ||
    (typeof input.brief === "object" && input.brief && typeof input.brief.productName === "string"
      ? input.brief.productName
      : "") ||
    "design";
  const showcase = input.showcaseKey ?? (siteKind || "design");
  const url = `tell://design/${showcase}`;
  const outcome = input.outcome ?? "accepted";
  const reward = scoreDesignArtifact({
    outcome,
    siteKind: siteKind || undefined,
    htmlBytes: html.length,
  });
  const episodeId = newEpisodeId(contentHash({ showcase, productName, siteKind, htmlLen: html.length }));

  let artifactPath: string | undefined;
  if (html) {
    artifactPath = path.join("raw", "design", `${episodeId}.html`);
    await writeFile(path.join(paths.home, artifactPath), html, "utf8");
  }

  // Slim spec for JSON (drop nothing critical; HTML is external)
  const slimSpec = input.spec
    ? scrubJson({
        ...input.spec,
        // avoid duplicating huge fields if any appear later
      })
    : undefined;

  const episode = DesignEpisode.parse(
    scrubJson({
      episode_id: episodeId,
      created_at: new Date().toISOString(),
      source: input.source ?? "design",
      artifact_kind: "design",
      brief: briefText(input.brief),
      url,
      outcome,
      reward,
      report: {
        findings: [],
        verdicts: [],
        capture: { url },
        measures: { score: 25, band: "distinctive" },
        score: { total: 0, generic: 0, drift: 0, intentional: 0, uncertain: 0 },
      },
      proposal: slimSpec ? { spec: slimSpec } : undefined,
      final_artifact: html ? `[external:${artifactPath}]` : undefined,
      artifact_path: artifactPath,
      meta: {
        artifact_kind: "design",
        retainable: true,
        showcaseKey: input.showcaseKey ?? null,
        siteKind: siteKind || null,
        productName,
        htmlBytes: html.length,
        ...input.meta,
      },
    }),
  );
  episode.meta.retainable = isRetainable(episode);
  await persistEpisode(paths, episode);
  await appendFile(
    paths.ledger,
    `${JSON.stringify({
      at: episode.created_at,
      episode_id: episode.episode_id,
      source: episode.source,
      artifact_kind: "design",
      url: episode.url,
      outcome: episode.outcome,
      reward: episode.reward.total,
      retainable: episode.meta.retainable,
    })}\n`,
    "utf8",
  );
  return episode;
}

function isDesignInboxPayload(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const obj = json as Record<string, unknown>;
  if (obj.kind === "design" || obj.artifact_kind === "design") return true;
  const payload = obj.payload;
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (typeof p.previewHtml === "string" || p.spec || p.htmlPath) return true;
  }
  if ((typeof obj.previewHtml === "string" || obj.htmlPath) && obj.spec) return true;
  return false;
}

/** Route inbox JSON → diagnose report ingest or design artifact ingest. */
export async function ingestInboxFile(
  filePath: string,
  opts: { home?: string; source?: DesignEpisode["source"] } = {},
): Promise<DesignEpisode> {
  const text = await readFile(filePath, "utf8");
  const json = JSON.parse(text) as unknown;
  if (isDesignInboxPayload(json)) {
    const obj = json as Record<string, unknown>;
    const payload =
      obj.payload && typeof obj.payload === "object"
        ? (obj.payload as Record<string, unknown>)
        : obj;
    const meta = (obj.meta && typeof obj.meta === "object" ? obj.meta : {}) as Record<string, unknown>;
    let previewHtml = typeof payload.previewHtml === "string" ? payload.previewHtml : undefined;
    const htmlPath =
      (typeof payload.htmlPath === "string" && payload.htmlPath) ||
      (typeof meta.htmlPath === "string" && meta.htmlPath) ||
      undefined;
    if (!previewHtml && htmlPath && opts.home) {
      try {
        previewHtml = await readFile(path.join(opts.home, htmlPath), "utf8");
      } catch {
        /* missing html ok — still record spec */
      }
    }
    const briefFromMeta =
      typeof meta.brief === "string" || (meta.brief && typeof meta.brief === "object")
        ? (meta.brief as DesignIngestInput["brief"])
        : undefined;
    return ingestDesignArtifact({
      brief: (payload.brief as DesignIngestInput["brief"]) ?? briefFromMeta,
      spec: (payload.spec as Record<string, unknown> | undefined) ?? undefined,
      previewHtml,
      showcaseKey:
        (typeof payload.showcaseKey === "string" && payload.showcaseKey) ||
        (typeof meta.showcaseKey === "string" && meta.showcaseKey) ||
        undefined,
      siteKind: typeof payload.siteKind === "string" ? payload.siteKind : undefined,
      productName: typeof payload.productName === "string" ? payload.productName : undefined,
      source: opts.source ?? "watch",
      outcome: "accepted",
      meta: { ...meta, ingested_from: path.resolve(filePath), htmlPath },
      home: opts.home,
    });
  }
  return ingestReportFile(filePath, {
    source: opts.source ?? "watch",
    home: opts.home,
  });
}

/** Process every pending inbox/*.json then optionally remove them. */
export async function processInbox(home?: string): Promise<{ ingested: number; errors: string[] }> {
  const paths = await ensureDataDirs(home);
  const files = (await readdir(paths.inbox)).filter((f) => f.endsWith(".json"));
  let ingested = 0;
  const errors: string[] = [];
  for (const file of files) {
    const full = path.join(paths.inbox, file);
    try {
      await ingestInboxFile(full, { home: paths.home, source: "watch" });
      ingested += 1;
      const doneDir = path.join(paths.inbox, ".done");
      await writeFile(path.join(paths.meta, `inbox-processed-${file}`), new Date().toISOString(), "utf8").catch(
        () => undefined,
      );
      // Move aside so watch/sync do not re-ingest forever
      try {
        await rename(full, path.join(paths.meta, `inbox-${file}`));
      } catch {
        await unlink(full).catch(() => undefined);
      }
      void doneDir;
    } catch (err) {
      errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { ingested, errors };
}

async function persistEpisode(paths: DataPaths, episode: DesignEpisode): Promise<void> {
  const out = path.join(paths.rawEpisodes, `${episode.episode_id}.json`);
  await writeFile(out, JSON.stringify(episode, null, 2), "utf8");
}

export async function loadAllEpisodes(home?: string): Promise<DesignEpisode[]> {
  const paths = await ensureDataDirs(home);
  const files = (await readdir(paths.rawEpisodes)).filter((f) => f.endsWith(".json"));
  const episodes: DesignEpisode[] = [];
  for (const file of files) {
    const text = await readFile(path.join(paths.rawEpisodes, file), "utf8");
    episodes.push(DesignEpisode.parse(JSON.parse(text)));
  }
  return episodes;
}

export async function updateOutcome(
  episodeId: string,
  outcome: Outcome,
  extras?: { finalArtifact?: string; home?: string },
): Promise<DesignEpisode> {
  const paths = await ensureDataDirs(extras?.home);
  const file = path.join(paths.rawEpisodes, `${episodeId}.json`);
  const ep = DesignEpisode.parse(JSON.parse(await readFile(file, "utf8")));
  const next = DesignEpisode.parse({
    ...ep,
    outcome,
    final_artifact: extras?.finalArtifact ?? ep.final_artifact,
    reward: scoreReport(ep.report, outcome),
  });
  next.meta.retainable = isRetainable(next);
  await persistEpisode(paths, next);
  return next;
}
