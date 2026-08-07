import { designFromFeatures, getTemplate } from "@tell/design-skills";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const dynamic = "force-static";

/** Signal observatory showcase — chronometer + signal lattice craft beat. */
export default function ObservatoryShowcasePage() {
  const template = getTemplate("observatory")!;
  const { previewHtml } = designFromFeatures(template.brief);
  return (
    <ShowcaseFrame
      offeringKey={template.key}
      title={template.label}
      marketJob={template.marketJob}
      previewHtml={previewHtml}
      testId="showcase-observatory"
    />
  );
}
