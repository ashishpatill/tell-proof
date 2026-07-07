import { captureUrl, diagnoseCapture, loadDesignDoc } from "@tell/core";
import { TellReport } from "@tell/schema";

/** Run capture + diagnose in-process (reliable in Docker / Vercel). */
export async function runDiagnose(url: string): Promise<TellReport> {
  try {
    const designDoc = await loadDesignDoc();
    const report = diagnoseCapture(await captureUrl(url), undefined, designDoc);
    return TellReport.parse(report);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Capture pipeline failed: ${detail}`, { cause: error });
  }
}
