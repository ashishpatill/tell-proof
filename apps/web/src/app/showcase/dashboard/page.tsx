import { designFromFeatures, SHOWCASE_BRIEFS } from "@tell/design-skills";

export const dynamic = "force-static";

/** Minimal-clean dashboard webapp showcase. */
export default function DashboardShowcasePage() {
  const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.dashboard!);
  return (
    <main data-testid="showcase-dashboard">
      <iframe
        title="Dashboard webapp showcase"
        srcDoc={previewHtml}
        className="h-screen w-full border-0"
        data-testid="showcase-frame"
      />
    </main>
  );
}
