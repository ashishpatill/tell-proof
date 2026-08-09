import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export type DataPaths = {
  home: string;
  inbox: string;
  rawEpisodes: string;
  rawDesign: string;
  curated: string;
  meta: string;
  ledger: string;
  holdout: string;
};

export function resolveDataHome(override?: string): string {
  const fromArg = override?.trim();
  if (fromArg) return fromArg;
  if (process.env.TELL_DESIGN_DATA_HOME?.trim()) {
    return process.env.TELL_DESIGN_DATA_HOME.trim();
  }
  // Prefer repo-local training-data/ when cwd is the tell-design-data checkout
  const here = path.resolve(process.cwd(), "training-data");
  if (existsSync(path.join(process.cwd(), "package.json")) && existsSync(here)) {
    return here;
  }
  return path.join(homedir(), ".tell-design-data");
}

export function pathsFor(home = resolveDataHome()): DataPaths {
  return {
    home,
    inbox: path.join(home, "inbox"),
    rawEpisodes: path.join(home, "raw", "episodes"),
    rawDesign: path.join(home, "raw", "design"),
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
  await mkdir(p.rawDesign, { recursive: true });
  await mkdir(p.curated, { recursive: true });
  await mkdir(p.meta, { recursive: true });
  return p;
}
