import type { FeatureAnalysis } from "./analyze";
import type { SkillNodeId, TasteControls } from "./types";

/** Map analyzed features / site kind to skill-graph nodes (always includes foundation + responsive). */
export function routeSkills(analysis: FeatureAnalysis, taste: TasteControls): SkillNodeId[] {
  const nodes = new Set<SkillNodeId>([
    "analyze-features-requirements",
    "design-system-foundation",
    "navigation-header-footer",
    "responsive-performance",
  ]);

  for (const section of analysis.recommendedSections) {
    if (section === "hero") nodes.add("hero-section");
    if (section === "features") nodes.add("features-benefits");
    if (section === "pricing") nodes.add("pricing-or-plans");
    if (section === "story" || section === "figure") nodes.add("content-storytelling-pages");
    if (section === "cta" || section === "proof") nodes.add("forms-ctas-conversion");
    if (section === "dashboard-shell" || section === "dashboard-main") {
      nodes.add("dashboard-or-webapp-ui");
    }
  }

  if (taste.motion !== "none") nodes.add("restrained-motion-micro");

  const order: SkillNodeId[] = [
    "analyze-features-requirements",
    "design-system-foundation",
    "navigation-header-footer",
    "hero-section",
    "features-benefits",
    "pricing-or-plans",
    "content-storytelling-pages",
    "forms-ctas-conversion",
    "dashboard-or-webapp-ui",
    "restrained-motion-micro",
    "responsive-performance",
  ];

  return order.filter((id) => nodes.has(id));
}
