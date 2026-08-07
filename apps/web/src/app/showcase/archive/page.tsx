import { designFromFeatures, getTemplate } from "@tell/design-skills";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const dynamic = "force-static";

/** Archive index showcase — register + index ledger craft beat. */
export default function ArchiveShowcasePage() {
  const template = getTemplate("archive")!;
  const { previewHtml } = designFromFeatures(template.brief);
  return (
    <ShowcaseFrame
      offeringKey={template.key}
      title={template.label}
      marketJob={template.marketJob}
      previewHtml={previewHtml}
      testId="showcase-archive"
    />
  );
}
