import { homedir } from "node:os";
import path from "node:path";
import { mkdir } from "node:fs/promises";

export type DataPaths = {
  home: string;
  inbox: string;
  rawEpisodes: string;
  curated: string;
  meta: string;
  ledger: string;
  holdout: string;
};

export function resolveDataHome(override?: string): string {
  return (
    override?.trim() ||
    process.env.TELL_DESIGN_DATA_HOME?.trim() ||
    path.join(homedir(), ".tell-design-data")
  );
}

export function pathsFor(home = resolveDataHome()): DataPaths {
  return {
    home,
    inbox: path.join(home, "inbox"),
    rawEpisodes: path.join(home, "raw", "episodes"),
    curated: path.join(home, "curated"),
    meta: path.join(home, "meta"),
    ledger: path.join(home, "meta", "ledger.jsonl"),
    holdout: path.join(home, "meta", "holdout.json"),
  };
}

export async function ensureDataDirs(home = resolveDataHome()): Promise<DataPaths> {
  const p = pathsFor(home);
  await mkdir(p.inbox, { recursive: true });
  await mkdir(p.rawEpisodes, { recursive: true });
  await mkdir(p.curated, { recursive: true });
  await mkdir(p.meta, { recursive: true });
  return p;
}
