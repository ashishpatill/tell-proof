import { ArtDirection, BrandDNA, RedesignProposal, TellReport } from "@tell/schema";
import { buildOverridesPatch, reconcile, resolveDirection } from "./reconcile";

export * from "./reconcile";
export * from "./scales";
export * from "./measures";
export { learnBrandDNA } from "./dna";
export { buildRestylePlan, emitRestyleCss, afterAxes } from "./restyle";
export type { RestylePlan, ElOp } from "./restyle";
export * as color from "./color";

export interface RedesignGenerator {
  propose(report: TellReport, direction: ArtDirection, findingId?: string, dna?: BrandDNA): Promise<RedesignProposal>;
}

/**
 * Deterministic, page-grounded generator. It reconciles the *real* captured
 * tokens into the chosen direction and emits a drop-in override sheet — the
 * same CSS the live "after" preview injects, so the patch and the preview agree.
 * When a Brand DNA is supplied, it becomes the target and scoring yardstick.
 */
export class OfflineRedesignGenerator implements RedesignGenerator {
  async propose(report: TellReport, direction: ArtDirection, findingId?: string, dna?: BrandDNA): Promise<RedesignProposal> {
    const dir = resolveDirection(direction.id) ?? resolveDirection("editorial");
    const recon = reconcile(report.capture, report.fingerprint, report.findings, dir.id, dna);
    const files = buildOverridesPatch(recon, report.capture.url);

    return RedesignProposal.parse({
      findingId,
      direction,
      reconciliation: recon,
      files,
    });
  }
}
