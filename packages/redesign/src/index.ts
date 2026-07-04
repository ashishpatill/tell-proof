import { ArtDirection, RedesignProposal, TellReport } from "@tell/schema";
import { buildOverridesPatch, reconcile, resolveDirection } from "./reconcile";

export * from "./reconcile";

export interface RedesignGenerator {
  propose(report: TellReport, direction: ArtDirection, findingId?: string): Promise<RedesignProposal>;
}

/**
 * Deterministic, page-grounded generator. It reconciles the *real* captured
 * tokens into the chosen direction and emits a drop-in override sheet — the
 * same CSS the live "after" preview injects, so the patch and the preview agree.
 */
export class OfflineRedesignGenerator implements RedesignGenerator {
  async propose(report: TellReport, direction: ArtDirection, findingId?: string): Promise<RedesignProposal> {
    const dir = resolveDirection(direction.id) ?? resolveDirection("editorial");
    const recon = reconcile(report.capture, report.fingerprint, report.findings, dir.id);
    const files = buildOverridesPatch(recon, report.capture.url);

    return RedesignProposal.parse({
      findingId,
      direction,
      reconciliation: recon,
      files,
    });
  }
}
