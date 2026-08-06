import { designFromFeatures, getTemplate } from "@tell/design-skills";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const dynamic = "force-static";

/** Consumer craft showcase. */
export default function ConsumerShowcasePage() {
  const template = getTemplate("consumer")!;
  const { previewHtml } = designFromFeatures(template.brief);
  return (
    <ShowcaseFrame
      offeringKey={template.key}
      title={template.label}
      marketJob={template.marketJob}
      previewHtml={previewHtml}
      testId="showcase-consumer"
    />
  );
}
