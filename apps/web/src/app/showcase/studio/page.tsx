import { designFromFeatures, SHOWCASE_BRIEFS } from "@tell/design-skills";

export const dynamic = "force-static";

/** Art-directed studio showcase — figure-owned fold, paper-led selected work. */
export default function StudioShowcasePage() {
  const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.studio!);
  return (
    <main data-testid="showcase-studio">
      <iframe
        title="Art-directed studio showcase"
        srcDoc={previewHtml}
        className="h-screen w-full border-0"
        data-testid="showcase-frame"
      />
    </main>
  );
}
