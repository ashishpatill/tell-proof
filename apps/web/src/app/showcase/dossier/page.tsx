import { designFromFeatures, getTemplate } from "@tell/design-skills";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const dynamic = "force-static";

/** Research dossier showcase — folio + dossier plate craft beat. */
export default function DossierShowcasePage() {
  const template = getTemplate("dossier")!;
  const { previewHtml } = designFromFeatures(template.brief);
  return (
    <ShowcaseFrame
      offeringKey={template.key}
      title={template.label}
      marketJob={template.marketJob}
      previewHtml={previewHtml}
      testId="showcase-dossier"
    />
  );
}
