import { designFromFeatures, SHOWCASE_BRIEFS } from "@tell/design-skills";

export const dynamic = "force-static";

/** Fintech trust marketing showcase — inverse-heavy, bleed-dense product landing. */
export default function FintechShowcasePage() {
  const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.fintech!);
  return (
    <main data-testid="showcase-fintech">
      <iframe
        title="Fintech trust showcase"
        srcDoc={previewHtml}
        className="h-screen w-full border-0"
        data-testid="showcase-frame"
      />
    </main>
  );
}
