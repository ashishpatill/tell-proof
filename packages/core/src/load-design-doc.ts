import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** Only apply Tell's root DESIGN.md when diagnosing Tell's own surfaces. */
export function shouldApplyDesignDoc(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
    if ((host === "localhost" || host === "127.0.0.1") && port === "3000") return true;
    if (host === "tell-five.vercel.app") return true;
    return false;
  } catch {
    return false;
  }
}

/** Best-effort read of DESIGN.md from repo root or cwd (local scans only). */
export async function loadDesignDoc(repoRoot = defaultRepoRoot): Promise<string | undefined> {
  const candidates = [
    path.join(repoRoot, "DESIGN.md"),
    path.join(process.cwd(), "DESIGN.md"),
    path.join(process.cwd(), "..", "DESIGN.md"),
    path.join(process.cwd(), "..", "..", "DESIGN.md"),
  ];
  for (const candidate of [...new Set(candidates)]) {
    try {
      return await readFile(candidate, "utf8");
    } catch {
      /* try next candidate */
    }
  }
  return undefined;
}
