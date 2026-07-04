import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { TellReport } from "@tell/schema";

const execFileAsync = promisify(execFile);

function repoRoot() {
  return path.resolve(process.cwd(), "../..");
}

export async function runDiagnose(url: string): Promise<TellReport> {
  const root = repoRoot();
  const tsxCli = path.join(root, "node_modules/.pnpm/tsx@4.23.0/node_modules/tsx/dist/cli.mjs");
  const diagnoseScript = path.join(root, "packages/core/src/scripts/diagnose-url.ts");

  const { stdout } = await execFileAsync(
    process.execPath,
    [tsxCli, diagnoseScript, url],
    {
      cwd: root,
      timeout: 45_000,
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
    },
  );
  return TellReport.parse(JSON.parse(stdout));
}
