import type { FeatureAnalysis } from "./analyze";
import type { DomainResearchRoutePlan } from "./domain-research";
import { routeDomainResearchSkills } from "./domain-research";
import type { DesignBrief, SkillNodeId, TasteControls } from "./types";
import { SkillNodeId as SkillNodeIdSchema } from "./types";

/**
 * Agency niche craft names that are not SkillNodeIds — expand to engine nodes
 * so agency:run craft hints actually affect routing (not just DIRECTION.md text).
 */
const AGENCY_CRAFT_ALIASES: Record<string, SkillNodeId[]> = {
  "image-first-fold": ["hero-section", "editorial-chapter-craft", "content-storytelling-pages"],
  "agency-minimal-grid": ["paper-technical-frame", "indexed-detail-markers", "elevation-depth-tokens"],
};

/** Expand brief.craftNodes + constraint "craft nodes: a, b" into SkillNodeIds. */
export function resolveRequestedCraft(brief: DesignBrief): SkillNodeId[] {
  const raw = new Set<string>(brief.craftNodes ?? []);
  for (const c of brief.constraints ?? []) {
    const m = c.match(/craft nodes?:\s*(.+)/i);
    if (!m?.[1]) continue;
    for (const part of m[1].split(/[,|/]/)) {
      const id = part.trim().replace(/`/g, "");
      if (id) raw.add(id);
    }
  }

  const out = new Set<SkillNodeId>();
  for (const id of raw) {
    const parsed = SkillNodeIdSchema.safeParse(id);
    if (parsed.success) {
      out.add(parsed.data);
      continue;
    }
    const aliases = AGENCY_CRAFT_ALIASES[id];
    if (aliases) {
      for (const a of aliases) out.add(a);
    }
  }
  return [...out];
}

export type RouteSkillsOptions = {
  /** When provided, merge followOnCraft instead of re-calling and discarding the plan. */
  researchPlan?: DomainResearchRoutePlan;
  brief?: DesignBrief;
};

/**
 * Map analyzed features / site kind to skill-graph nodes.
 * Always prepends `website-domain-research` (general research gate).
 * Always includes `responsive-performance` (media budgets — agent + media:site).
 * Sport briefs also route `sport-matchday-web` + `sport-vernacular-craft`.
 * Merges research `followOnCraft` and brief/agency `craftNodes`.
 */
export function routeSkills(
  analysis: FeatureAnalysis,
  taste: TasteControls,
  options: RouteSkillsOptions = {},
): SkillNodeId[] {
  const nodes = new Set<SkillNodeId>([
    "website-domain-research",
    "analyze-features-requirements",
    "design-system-foundation",
    "navigation-header-footer",
    "responsive-performance",
    "indexed-detail-markers",
    "edge-fade-craft",
    "elevation-depth-tokens",
  ]);

  const sportCoreSix =
    analysis.sportId === "cricket" || analysis.sportId === "tennis"
      ? (["home", "live-match", "scorecard", "series", "rankings", "notebook"] as const)
      : undefined;

  const researchPlan =
    options.researchPlan ??
    routeDomainResearchSkills({
      domainId: analysis.sportId ? `sport:${analysis.sportId}` : analysis.siteKind,
      brief: options.brief,
      requiredRouteClasses: sportCoreSix ? [...sportCoreSix] : undefined,
    });

  for (const craft of researchPlan.followOnCraft) {
    nodes.add(craft);
  }

  if (options.brief) {
    for (const craft of resolveRequestedCraft(options.brief)) {
      nodes.add(craft);
    }
  }

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
    nodes.add("motion-stack-craft");
  } else if (taste.motion === "scroll-narrative" || taste.motion === "immersive") {
    nodes.add("scroll-reveal-once");
    nodes.add("hero-entrance-once");
    nodes.add("section-stagger-enter");
    nodes.add("scroll-narrative-craft");
    nodes.add("restrained-motion-micro");
    nodes.add("motion-stack-craft");
    if (taste.motion === "immersive") nodes.add("authored-motion-slot");
  } else if (taste.motion !== "none") {
    nodes.add("restrained-motion-micro");
    nodes.add("motion-stack-craft");
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

  if (taste.colorMood === "dark-premium") {
    nodes.add("ambient-atmosphere-craft");
    nodes.add("signal-beam-craft");
    nodes.add("glass-shell-craft");
    nodes.add("container-tech-shell");
  }

  if (analysis.sportId) {
    nodes.add("sport-matchday-web");
    nodes.add("sport-vernacular-craft");
    nodes.add("editorial-chapter-craft");
    nodes.add("dashboard-or-webapp-ui");
  }

  const order: SkillNodeId[] = [
    "website-domain-research",
    "sport-matchday-web",
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
    "sport-vernacular-craft",
    "scroll-reveal-once",
    "hero-entrance-once",
    "section-stagger-enter",
    "scroll-narrative-craft",
    "authored-motion-slot",
    "motion-stack-craft",
    "restrained-motion-micro",
    "edge-fade-craft",
    "elevation-depth-tokens",
    "responsive-performance",
  ];

  return order.filter((id) => nodes.has(id));
}
