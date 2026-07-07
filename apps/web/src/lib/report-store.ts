import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TellReport } from "@tell/schema";

const STORE_DIR = path.join(process.cwd(), "data", "shared-reports");

export async function saveSharedReport(report: TellReport): Promise<string> {
  const id = randomBytes(8).toString("hex");
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(path.join(STORE_DIR, `${id}.json`), JSON.stringify(report), "utf8");
  return id;
}

export async function loadSharedReport(id: string): Promise<TellReport | null> {
  if (!/^[a-f0-9]{16}$/.test(id)) return null;
  try {
    const raw = await readFile(path.join(STORE_DIR, `${id}.json`), "utf8");
    return TellReport.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
