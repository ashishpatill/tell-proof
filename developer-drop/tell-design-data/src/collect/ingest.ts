import { appendFile, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  DesignEpisode,
  LooseTellReport,
  Outcome,
  contentHash,
  newEpisodeId,
} from "../schema/episode.js";
import { scoreReport, isRetainable } from "../reward/score.js";
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
