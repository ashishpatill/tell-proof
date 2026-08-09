import { readFile, writeFile } from "node:fs/promises";
import { loadAllEpisodes } from "../collect/ingest.js";
import type { DesignEpisode } from "../schema/episode.js";
import { retentionBucket } from "../reward/score.js";
import { scrubJson } from "../scrub/scrub.js";
import { ensureDataDirs } from "../util/paths.js";

export type ConvertStats = {
  episodes: number;
  sft: number;
  dpo: number;
  corrections: number;
  dropped: number;
};

function taskKey(ep: DesignEpisode): string {
  const brief = (ep.brief || "").trim().toLowerCase();
  const url = (ep.url || "").split("?")[0] ?? "";
  return `${url}::${brief}`;
}

function sftRow(ep: DesignEpisode): Record<string, unknown> {
  const findings = (ep.report.findings ?? []).slice(0, 12).map((f) => ({
    detector: f["detector"],
    severity: f["severity"],
    verdictHint: f["verdictHint"],
    facts: f["facts"],
  }));
  const direction = ep.direction ?? ep.report.activeDirection;
  const user = {
    role: "user",
    content: [
      ep.brief ? `Brief: ${ep.brief}` : null,
      `URL: ${ep.url}`,
      direction ? `Direction: ${JSON.stringify(direction)}` : null,
      `Findings: ${JSON.stringify(findings)}`,
      ep.report.measures
        ? `Measures: score=${ep.report.measures.score} band=${ep.report.measures.band}`
        : null,
      "Produce a distinctive, reviewable redesign (tokens/CSS/diff). Never auto-apply.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
  const assistantPayload = {
    summary: direction?.["summary"] ?? "Redesign toward clearer hierarchy and fewer generic tells.",
    direction,
    proposal: ep.proposal,
    final_artifact: ep.final_artifact,
    reconciliation_hint: ep.report.measures,
  };
  return scrubJson({
    episode_id: ep.episode_id,
    task_id: taskKey(ep),
    bucket: retentionBucket(ep),
    reward: ep.reward.total,
    messages: [
      {
        role: "system",
        content:
          "You are a design critic and restyler. Prefer measured contrast, intentional type, and anti-generic composition. Output reviewable patches only.",
      },
      user,
      { role: "assistant", content: JSON.stringify(assistantPayload) },
    ],
  });
}

/**
 * Same-task DPO: chosen = best reward; rejected ≈ μ−2σ of task rewards (not absolute min).
 */
function buildDpoPairs(episodes: DesignEpisode[]): Record<string, unknown>[] {
  const byTask = new Map<string, DesignEpisode[]>();
  for (const ep of episodes) {
    const bucket = retentionBucket(ep);
    if (bucket === "junk") continue;
    const key = taskKey(ep);
    const list = byTask.get(key) ?? [];
    list.push(ep);
    byTask.set(key, list);
  }

  const pairs: Record<string, unknown>[] = [];
  for (const [task_id, list] of byTask) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => b.reward.total - a.reward.total);
    const rewards = sorted.map((e) => e.reward.total);
    const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const variance = rewards.reduce((a, b) => a + (b - mean) ** 2, 0) / rewards.length;
    const std = Math.sqrt(variance);
    const target = mean - 2 * std;
    const chosen = sorted[0]!;
    let rejected = sorted[sorted.length - 1]!;
    let bestDist = Math.abs(rejected.reward.total - target);
    for (const cand of sorted.slice(1)) {
      const d = Math.abs(cand.reward.total - target);
      if (d < bestDist) {
        bestDist = d;
        rejected = cand;
      }
    }
    if (chosen.episode_id === rejected.episode_id) continue;
    if (chosen.reward.total - rejected.reward.total < 0.05) continue;

    const chosenRow = sftRow(chosen);
    const rejectedRow = sftRow(rejected);
    pairs.push(
      scrubJson({
        task_id,
        pair_rule: "same_task_mu_minus_2sigma",
        reward_chosen: chosen.reward.total,
        reward_rejected: rejected.reward.total,
        chosen: chosenRow["messages"],
        rejected: rejectedRow["messages"],
        chosen_episode_id: chosen.episode_id,
        rejected_episode_id: rejected.episode_id,
      }),
    );
  }
  return pairs;
}

export async function convertAll(home?: string): Promise<ConvertStats> {
  const paths = await ensureDataDirs(home);
  const holdout = await loadHoldout(paths.holdout);
  const episodes = (await loadAllEpisodes(home)).filter((e) => !holdout.has(e.episode_id));

  const sft: Record<string, unknown>[] = [];
  const corrections: Record<string, unknown>[] = [];
  let dropped = 0;

  for (const ep of episodes) {
    const bucket = retentionBucket(ep);
    if (bucket === "junk") {
      dropped += 1;
      continue;
    }
    if (bucket === "gold" || bucket === "strong") {
      sft.push(sftRow(ep));
    }
    if (ep.outcome === "edited" && (ep.final_artifact || ep.proposal_artifact)) {
      corrections.push(
        scrubJson({
          episode_id: ep.episode_id,
          task_id: taskKey(ep),
          proposal_artifact: ep.proposal_artifact,
          human_artifact: ep.final_artifact,
          reward: ep.reward.total,
        }),
      );
    }
  }

  // Keep top fraction of strong (LIMA / rejection-sampling spirit): already filtered by bucket.
  const dpo = buildDpoPairs(episodes);

  await writeFile(paths.curated + "/sft.jsonl", sft.map((r) => JSON.stringify(r)).join("\n") + (sft.length ? "\n" : ""), "utf8");
  await writeFile(paths.curated + "/dpo.jsonl", dpo.map((r) => JSON.stringify(r)).join("\n") + (dpo.length ? "\n" : ""), "utf8");
  await writeFile(
    paths.curated + "/corrections.jsonl",
    corrections.map((r) => JSON.stringify(r)).join("\n") + (corrections.length ? "\n" : ""),
    "utf8",
  );

  return {
    episodes: episodes.length,
    sft: sft.length,
    dpo: dpo.length,
    corrections: corrections.length,
    dropped,
  };
}

async function loadHoldout(file: string): Promise<Set<string>> {
  try {
    const raw = JSON.parse(await readFile(file, "utf8")) as { ids?: string[] };
    return new Set(raw.ids ?? []);
  } catch {
    return new Set();
  }
}

export async function scrubCurated(home?: string): Promise<void> {
  const paths = await ensureDataDirs(home);
  for (const name of ["sft.jsonl", "dpo.jsonl", "corrections.jsonl"] as const) {
    const file = `${paths.curated}/${name}`;
    try {
      const text = await readFile(file, "utf8");
      const lines = text
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.stringify(scrubJson(JSON.parse(line))));
      await writeFile(file, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");
    } catch {
      // missing file ok
    }
  }
}
