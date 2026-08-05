import { designFromFeatures, SHOWCASE_BRIEFS } from "@tell/design-skills";

export const dynamic = "force-static";

/** Consumer craft showcase — figure-dense product story, paper-led conversion. */
export default function ConsumerShowcasePage() {
  const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.consumer!);
  return (
    <main data-testid="showcase-consumer">
      <iframe
        title="Consumer craft showcase"
        srcDoc={previewHtml}
        className="h-screen w-full border-0"
        data-testid="showcase-frame"
      />
    </main>
  );
}
