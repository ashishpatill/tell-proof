#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { ingestReportFile, loadAllEpisodes, updateOutcome } from "../collect/ingest.js";
import { watchInbox } from "../collect/watch.js";
import { startProxy } from "../collect/proxy.js";
import { convertAll, scrubCurated } from "../convert/to-jsonl.js";
import { retentionBucket } from "../reward/score.js";
import { Outcome } from "../schema/episode.js";
import { ensureDataDirs, resolveDataHome } from "../util/paths.js";

function usage(): never {
  console.log(`tell-design-data — local design training-data harness (not part of Tell)

Usage:
  tell-design-data ingest <report.json> [--outcome accepted|discarded|edited|unknown] [--brief "..."]
  tell-design-data watch [--home DIR]
  tell-design-data proxy [--listen 3100] [--target http://127.0.0.1:3000]
  tell-design-data convert [--home DIR]
  tell-design-data outcome <episode_id> <accepted|discarded|edited> [--final path]
  tell-design-data status [--home DIR]
  tell-design-data scrub [--home DIR]

Env:
  TELL_DESIGN_DATA_HOME   default ~/.tell-design-data
  TELL_REPO               optional path to Tell checkout (docs only)
`);
  process.exit(1);
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return undefined;
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === "-h" || cmd === "--help") usage();

  const home = argValue(rest, "--home") ?? resolveDataHome();

  if (cmd === "ingest") {
    const file = rest.find((a) => !a.startsWith("--"));
    if (!file) usage();
    const outcomeRaw = argValue(rest, "--outcome") ?? "unknown";
    const outcome = Outcome.parse(outcomeRaw);
    const brief = argValue(rest, "--brief") ?? "";
    const ep = await ingestReportFile(file!, {
      source: "ingest",
      outcome,
      brief,
      home,
    });
    console.log(JSON.stringify({ episode_id: ep.episode_id, reward: ep.reward, bucket: retentionBucket(ep) }, null, 2));
    return;
  }

  if (cmd === "watch") {
    await watchInbox({ home });
    return;
  }

  if (cmd === "proxy") {
    const listen = Number(argValue(rest, "--listen") ?? 3100);
    const target = argValue(rest, "--target") ?? "http://127.0.0.1:3000";
    await startProxy({ listen, target, home });
    return;
  }

  if (cmd === "convert") {
    const stats = await convertAll(home);
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  if (cmd === "outcome") {
    const id = rest[0];
    const outcome = Outcome.parse(rest[1] ?? "unknown");
    if (!id) usage();
    const finalPath = argValue(rest, "--final");
    const finalArtifact = finalPath ? await readFile(finalPath, "utf8") : undefined;
    const ep = await updateOutcome(id!, outcome, { finalArtifact, home });
    console.log(JSON.stringify({ episode_id: ep.episode_id, outcome: ep.outcome, reward: ep.reward }, null, 2));
    return;
  }

  if (cmd === "status") {
    const paths = await ensureDataDirs(home);
    const episodes = await loadAllEpisodes(home);
    const buckets = { gold: 0, strong: 0, near_miss: 0, junk: 0 };
    for (const ep of episodes) buckets[retentionBucket(ep)] += 1;
    console.log(
      JSON.stringify(
        {
          home: paths.home,
          episodes: episodes.length,
          buckets,
          rewards: episodes.map((e) => e.reward.total).sort((a, b) => a - b),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "scrub") {
    await scrubCurated(home);
    console.log("scrubbed curated jsonl");
    return;
  }

  usage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
