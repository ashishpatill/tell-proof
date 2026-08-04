import { designFromFeatures, SHOWCASE_BRIEFS } from "@tell/design-skills";

export const dynamic = "force-static";

/** Refined-story corporate showcase. */
export default function CorporateShowcasePage() {
  const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
  return (
    <main data-testid="showcase-corporate">
      <iframe
        title="Corporate story showcase"
        srcDoc={previewHtml}
        className="h-screen w-full border-0"
        data-testid="showcase-frame"
      />
    </main>
  );
}
