import { captureUrl, diagnoseCapture } from "@tell/core";
import { TellReport } from "@tell/schema";

/** Run capture + diagnose in-process (reliable in Docker / Vercel). */
export async function runDiagnose(url: string): Promise<TellReport> {
  const report = diagnoseCapture(await captureUrl(url));
  return TellReport.parse(report);
}
