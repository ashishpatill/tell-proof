import type { DesignBrief, FeatureSpec, SiteKind } from "./types";
import type { SportId } from "./sport-vernacular";
import { matchSportFromQuery } from "./sport-vernacular";

export type FeatureAnalysis = {
  prioritized: FeatureSpec[];
  siteKind: SiteKind;
  recommendedSections: string[];
  goals: string[];
  /** True when tagline/features name a draft → approval / human-gate workflow. */
  hasApprovalWorkflow: boolean;
  /** Resolved sport pack when brief.sportId set or query language matches. */
  sportId?: SportId;
};

/**
 * Brief language that asks for the interactive sample-path stage
 * (input → process → draft → review → approve). Ordinary SaaS briefs
 * without this signal keep a feature-evidence board instead.
 */
export const APPROVAL_WORKFLOW_SIGNAL =
  /\b(?:approv(?:e|ed|al|als|ing)|drafts?|human\s+gate|auto-?apply)\b/i;

/** Scan tagline + declared features only — not product name or audience. */
export function hasApprovalWorkflowSignal(brief: DesignBrief): boolean {
  const blob = [brief.tagline, ...brief.features.map((f) => `${f.name} ${f.description}`)].join(" ");
  return APPROVAL_WORKFLOW_SIGNAL.test(blob);
}

/** Infer site kind from brief + feature language unless locked. */
export function inferSiteKind(brief: DesignBrief): SiteKind {
  if (brief.lockSiteKind) return brief.siteKind;

  const blob = [
    brief.tagline,
    brief.audience,
    brief.siteKind,
    ...brief.features.map((f) => `${f.name} ${f.description}`),
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(dashboard|analytics|workspace|inbox|settings|admin|console)\b/.test(blob)) {
    return "dashboard-webapp";
  }
  if (/\b(chapter|docs|tutorial|explainer|textbook|education|diagram)\b/.test(blob)) {
    return "docs-educational";
  }
  if (/\b(enterprise|corporate|brand|story|about us|investors)\b/.test(blob)) {
    return "corporate-story";
  }
  if (/\b(archive|alphabetical index|index register|stamp catalog|registry close|alpha.?rail|entry folio|award.?index)\b/.test(blob)) {
    return "archive-index";
  }
  if (/\b(press.?room|press.?sheet|imposition|signature rail|densitometer|forme desk|gather essay|registration mark|crop mark|press atelier)\b/.test(blob)) {
    return "press-atelier";
  }
  if (/\b(lantern.?path|night.?walk|chapter waypoint|path cartograph|ember essay|silhouette near.?plane|ember gate|afterlight)\b/.test(blob)) {
    return "lantern-path";
  }
  if (/\b(care.?pathway|clinical pathway|handoff bead|rounds ladder|ward ledger|chart close|triage stage|discharge stage|roundspool)\b/.test(blob)) {
    return "care-pathway";
  }
  if (
    /\b(agent.?harness|turn tape|tool permit|steer pin|done-?when|allow once|local session|harness engineer|coding agent|tiller|eval close|mid-run redirect)\b/.test(
      blob,
    )
  ) {
    return "agent-harness";
  }
  if (/\b(fintech|treasury|payments?|banking|ledger|payroll|expense|card|wire|ach|fx|currency)\b/.test(blob)) {
    return "fintech-marketing";
  }
  if (/\b(studio|portfolio|art.?direction|selected work|creative technolog|brand system|atelier)\b/.test(blob)) {
    return "art-directed-studio";
  }
  if (/\b(consumer|shoppers?|everyday|lifestyle|direct.?to.?consumer|dtc|retail brand)\b/.test(blob)) {
    return "consumer-craft";
  }
  if (/\b(foundry|typeface|type.?specimen|optical size|glyph|typography studio|editorial foundry)\b/.test(blob)) {
    return "editorial-foundry";
  }
  if (/\b(dossier|briefing|research desk|capital brief|memo|imprint|folio|thesis desk)\b/.test(blob)) {
    return "research-dossier";
  }
  if (/\b(observatory|telemetry|signal desk|channel lattice|scrub rail|incident timeline|sre desk|on.?call)\b/.test(blob)) {
    return "signal-observatory";
  }
  if (brief.siteKind !== "saas-marketing") return brief.siteKind;
  return "saas-marketing";
}

export function analyzeFeatures(brief: DesignBrief): FeatureAnalysis {
  const siteKind = inferSiteKind(brief);
  const hasApprovalWorkflow = hasApprovalWorkflowSignal(brief);
  const prioritized = [...brief.features].sort((a, b) => {
    const rank = { p0: 0, p1: 1, p2: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });

  const saasMarketingSections = hasApprovalWorkflow
    ? ["nav", "hero", "features", "workflow-proof", "proof", "pricing", "cta", "footer"]
    : ["nav", "hero", "features", "proof", "pricing", "cta", "footer"];

  const recommendedSections =
    siteKind === "dashboard-webapp"
      ? ["nav", "dashboard-shell", "cta", "footer"]
      : siteKind === "docs-educational"
        ? ["nav", "hero", "figure", "story", "features", "cta", "footer"]
        : siteKind === "corporate-story"
          ? ["nav", "hero", "story", "proof", "features", "cta", "footer"]
          : siteKind === "fintech-marketing"
            ? ["nav", "hero", "metrics", "features", "specimen", "proof", "pricing", "cta", "footer"]
            : siteKind === "art-directed-studio"
              ? ["nav", "hero", "features", "specimen", "story", "figure", "proof", "cta", "footer"]
              : siteKind === "consumer-craft"
                ? ["nav", "hero", "metrics", "features", "specimen", "proof", "story", "cta", "footer"]
                : siteKind === "editorial-foundry"
                  ? ["nav", "hero", "features", "figure", "specimen", "story", "proof", "cta", "footer"]
                  : siteKind === "research-dossier"
                    ? ["nav", "hero", "features", "figure", "specimen", "story", "proof", "cta", "footer"]
                    : siteKind === "signal-observatory"
                      ? ["nav", "hero", "features", "figure", "specimen", "story", "proof", "cta", "footer"]
                      : siteKind === "archive-index" || siteKind === "commerce-loom" || siteKind === "field-guide"
                        ? ["nav", "hero", "features", "figure", "specimen", "story", "proof", "cta", "footer"]
                        : siteKind === "press-atelier" ||
                            siteKind === "lantern-path" ||
                            siteKind === "care-pathway" ||
                            siteKind === "agent-harness"
                          ? ["nav", "hero", "features", "figure", "specimen", "story", "proof", "cta", "footer"]
                : saasMarketingSections;

  const goals = [
    `Serve ${brief.audience}`,
    `Optimize for ${brief.businessGoal}`,
    "Customize layout and copy to declared features",
    "Keep motion restrained and purposeful",
  ];

  const blob = [
    brief.productName,
    brief.tagline,
    brief.audience,
    ...brief.features.map((f) => `${f.name} ${f.description}`),
  ].join(" ");
  const sportId =
    brief.sportId ?? matchSportFromQuery(blob)?.id;

  if (sportId) {
    goals.push(`Honor ${sportId} vernacular — research gate + score-spine / format lens`);
  }

  return { prioritized, siteKind, recommendedSections, goals, hasApprovalWorkflow, sportId };
}
