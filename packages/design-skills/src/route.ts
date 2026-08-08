import type { FeatureAnalysis } from "./analyze";
import type { SkillNodeId, TasteControls } from "./types";

/** Map analyzed features / site kind to skill-graph nodes (always includes foundation + responsive). */
export function routeSkills(analysis: FeatureAnalysis, taste: TasteControls): SkillNodeId[] {
  const nodes = new Set<SkillNodeId>([
    "analyze-features-requirements",
    "design-system-foundation",
    "navigation-header-footer",
    "responsive-performance",
    "indexed-detail-markers",
    "edge-fade-craft",
    "elevation-depth-tokens",
  ]);

  for (const section of analysis.recommendedSections) {
    if (section === "hero") nodes.add("hero-section");
    if (section === "features") nodes.add("features-benefits");
    if (section === "pricing") {
      nodes.add("pricing-or-plans");
      nodes.add("pricing-decision-craft");
    }
    if (section === "story" || section === "figure") nodes.add("content-storytelling-pages");
    if (section === "cta" || section === "proof") nodes.add("forms-ctas-conversion");
    if (section === "workflow-proof") nodes.add("product-proof-stage");
    if (section === "dashboard-shell" || section === "dashboard-main") {
      nodes.add("dashboard-or-webapp-ui");
    }
  }

  if (analysis.siteKind === "saas-marketing") {
    nodes.add("product-proof-stage");
    nodes.add("conversion-landing-craft");
    nodes.add("forms-ctas-conversion");
    nodes.add("honest-integration-marks");
    if (analysis.prioritized.length >= 3) {
      nodes.add("pricing-or-plans");
      nodes.add("pricing-decision-craft");
    }
  }

  if (
    analysis.siteKind === "saas-marketing" ||
    analysis.siteKind === "docs-educational" ||
    analysis.siteKind === "corporate-story" ||
    analysis.siteKind === "fintech-marketing"
  ) {
    nodes.add("split-panel-technical");
  }

  if (
    taste.colorMood === "light-airy" ||
    taste.aestheticLean === "system-crafted" ||
    taste.colorMood === "neutral-professional"
  ) {
    nodes.add("paper-technical-frame");
  }

  if (taste.motion === "light-scroll-reveals") {
    nodes.add("scroll-reveal-once");
    nodes.add("restrained-motion-micro");
  } else if (taste.motion !== "none") {
    nodes.add("restrained-motion-micro");
  }

  const order: SkillNodeId[] = [
    "analyze-features-requirements",
    "design-system-foundation",
    "paper-technical-frame",
    "navigation-header-footer",
    "hero-section",
    "split-panel-technical",
    "features-benefits",
    "indexed-detail-markers",
    "product-proof-stage",
    "honest-integration-marks",
    "conversion-landing-craft",
    "pricing-or-plans",
    "pricing-decision-craft",
    "content-storytelling-pages",
    "forms-ctas-conversion",
    "dashboard-or-webapp-ui",
    "scroll-reveal-once",
    "restrained-motion-micro",
    "edge-fade-craft",
    "elevation-depth-tokens",
    "responsive-performance",
  ];

  return order.filter((id) => nodes.has(id));
}
