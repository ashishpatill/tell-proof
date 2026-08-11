import { getTemplate } from "@tell/design-skills";
import { ShowcaseFrame } from "@/components/showcase/ShowcaseFrame";

export const dynamic = "force-static";

const KEY = "clinic";

export default function ShowcaseSpecimenPage() {
  const template = getTemplate(KEY)!;
  return (
    <ShowcaseFrame
      offeringKey={template.key}
      title={template.label}
      marketJob={template.marketJob}
      testId={`showcase-${template.key}`}
    />
  );
}
