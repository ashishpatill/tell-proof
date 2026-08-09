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
    nodes.add("hero-entrance-once");
    nodes.add("section-stagger-enter");
    nodes.add("restrained-motion-micro");
  } else if (taste.motion === "scroll-narrative" || taste.motion === "immersive") {
    nodes.add("scroll-reveal-once");
    nodes.add("hero-entrance-once");
    nodes.add("section-stagger-enter");
    nodes.add("scroll-narrative-craft");
    nodes.add("restrained-motion-micro");
    if (taste.motion === "immersive") nodes.add("authored-motion-slot");
  } else if (taste.motion !== "none") {
    nodes.add("restrained-motion-micro");
  }

  if (
    analysis.siteKind === "art-directed-studio" ||
    analysis.siteKind === "corporate-story" ||
    analysis.siteKind === "consumer-craft" ||
    analysis.siteKind === "editorial-foundry" ||
    taste.aestheticLean === "refined-story"
  ) {
    nodes.add("editorial-chapter-craft");
    nodes.add("content-storytelling-pages");
  }

  if (analysis.siteKind === "docs-educational") {
    nodes.add("scrub-sequence-craft");
  }

  if (analysis.siteKind === "corporate-story" || analysis.siteKind === "fintech-marketing") {
    nodes.add("operational-governance-craft");
  }

  if (taste.aestheticLean === "system-crafted" || taste.colorMood === "dark-premium") {
    nodes.add("wireframe-annotation-craft");
  }

  // Formerly "skipped" crafts — routed as constrained defaults for dark-premium.
  if (taste.colorMood === "dark-premium") {
    nodes.add("ambient-atmosphere-craft");
    nodes.add("signal-beam-craft");
    nodes.add("glass-shell-craft");
    nodes.add("container-tech-shell");
  }

  const order: SkillNodeId[] = [
    "analyze-features-requirements",
    "design-system-foundation",
    "paper-technical-frame",
    "container-tech-shell",
    "ambient-atmosphere-craft",
    "signal-beam-craft",
    "glass-shell-craft",
    "navigation-header-footer",
    "hero-section",
    "split-panel-technical",
    "scrub-sequence-craft",
    "features-benefits",
    "indexed-detail-markers",
    "wireframe-annotation-craft",
    "product-proof-stage",
    "honest-integration-marks",
    "conversion-landing-craft",
    "editorial-chapter-craft",
    "operational-governance-craft",
    "pricing-or-plans",
    "pricing-decision-craft",
    "content-storytelling-pages",
    "forms-ctas-conversion",
    "dashboard-or-webapp-ui",
    "scroll-reveal-once",
    "hero-entrance-once",
    "section-stagger-enter",
    "scroll-narrative-craft",
    "authored-motion-slot",
    "restrained-motion-micro",
    "edge-fade-craft",
    "elevation-depth-tokens",
    "responsive-performance",
  ];

  return order.filter((id) => nodes.has(id));
}
