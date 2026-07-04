import { ArtDirection, RedesignProposal, TellReport } from "@tell/schema";

export interface RedesignGenerator {
  propose(report: TellReport, direction: ArtDirection, findingId?: string): Promise<RedesignProposal>;
}

export class OfflineRedesignGenerator implements RedesignGenerator {
  async propose(report: TellReport, direction: ArtDirection, findingId?: string): Promise<RedesignProposal> {
    const target = findingId ? report.findings.find((finding) => finding.id === findingId) : undefined;
    const summary = target
      ? `Apply ${direction.label} to resolve ${target.detector}.`
      : `Apply ${direction.label} as the product-wide art direction.`;

    return RedesignProposal.parse({
      findingId,
      direction,
      files: [
        {
          file: "apps/web/src/app/globals.css",
          summary,
          unifiedDiff: buildTokenDiff(direction),
        },
      ],
    });
  }
}

function buildTokenDiff(direction: ArtDirection): string {
  const accent = direction.tokenOverrides["--accent"] ?? "#D4714A";
  const display = direction.tokenOverrides["--font-display"] ?? "Instrument Serif";
  const radius = direction.tokenOverrides["--radius-card"] ?? "16px";
  const shadow = direction.tokenOverrides["--shadow-card"] ?? "0 2px 8px rgba(0,0,0,.25)";

  return `diff --git a/apps/web/src/app/globals.css b/apps/web/src/app/globals.css
--- a/apps/web/src/app/globals.css
+++ b/apps/web/src/app/globals.css
@@
 :root {
-  --accent: #8B5CF6;
-  --font-display: Inter;
-  --radius-card: 8px;
-  --shadow-card: 0 10px 25px rgba(0,0,0,.35);
+  --accent: ${accent};
+  --font-display: ${display};
+  --radius-card: ${radius};
+  --shadow-card: ${shadow};
 }`;
}
