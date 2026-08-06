import { designFromFeatures, getTemplate } from "@tell/design-skills";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const dynamic = "force-static";

/** Educational / docs mechanism showcase. */
export default function EducationalShowcasePage() {
  const template = getTemplate("educational")!;
  const { previewHtml } = designFromFeatures(template.brief);
  return (
    <ShowcaseFrame
      offeringKey={template.key}
      title={template.label}
      marketJob={template.marketJob}
      previewHtml={previewHtml}
      testId="showcase-educational"
    />
  );
}
