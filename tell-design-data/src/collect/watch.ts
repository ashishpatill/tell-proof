import path from "node:path";
import { watch } from "chokidar";
import { ingestInboxFile } from "./ingest.js";
import { convertAll } from "../convert/to-jsonl.js";
import { ensureDataDirs, resolveDataHome } from "../util/paths.js";

export type WatchOptions = {
  home?: string;
  autoConvert?: boolean;
};

export async function watchInbox(opts: WatchOptions = {}): Promise<void> {
  const home = resolveDataHome(opts.home);
  const paths = await ensureDataDirs(home);
  const autoConvert = opts.autoConvert !== false;

  console.log(`[tell-design-data] watching ${paths.inbox}`);
  console.log(`[tell-design-data] data home ${paths.home}`);

  const watcher = watch(path.join(paths.inbox, "*.json"), {
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
  });

  watcher.on("add", async (file) => {
    try {
      const ep = await ingestInboxFile(file, { home, source: "watch" });
      console.log(
        `[ingest] ${ep.episode_id} kind=${ep.artifact_kind} reward=${ep.reward.total} url=${ep.url}`,
      );
      if (autoConvert) {
        const stats = await convertAll(home);
        console.log(
          `[convert] sft=${stats.sft} dpo=${stats.dpo} corrections=${stats.corrections} dropped=${stats.dropped}`,
        );
      }
    } catch (err) {
      console.error(`[ingest-error] ${file}`, err);
    }
  });
}
