import { analyzeFeatures, inferSiteKind } from "./analyze";
import { renderPreviewHtml } from "./render";
import { routeSkills } from "./route";
import { buildSections } from "./sections";
import { AESTHETIC_PROFILES, buildTokens, tellDirectionForLean } from "./tokens";
import {
  DesignBrief,
  DesignFromFeaturesResponse,
  DesignSpec,
  TasteControls,
} from "./types";

export function resolveTaste(brief: DesignBrief): TasteControls {
  const siteKind = inferSiteKind(brief);
  const leanDefault =
    siteKind === "dashboard-webapp"
      ? "minimal-clean"
      : siteKind === "corporate-story" || siteKind === "docs-educational"
        ? "refined-story"
        : "conversion-sharp";

  return TasteControls.parse({
    density: brief.taste?.density ?? (siteKind === "docs-educational" ? "sparse" : siteKind === "dashboard-webapp" ? "information-rich" : "balanced"),
    motion: brief.taste?.motion ?? (siteKind === "dashboard-webapp" ? "none" : "subtle-micro"),
    aestheticLean: brief.taste?.aestheticLean ?? leanDefault,
    colorMood: brief.taste?.colorMood ?? "neutral-professional",
    typographyWeight: brief.taste?.typographyWeight ?? "medium-modern",
    roundingDepth: brief.taste?.roundingDepth ?? (siteKind === "dashboard-webapp" ? "sharp" : "soft"),
  });
}

export type DesignFromFeaturesOptions = {
  /** Prior DesignSpec — regenerates from the new brief; prior features never leak. */
  redesignFrom?: DesignSpec;
};

/**
 * Main skill entry: analyze → route → tokens → sections → preview HTML.
 * Deterministic. No LLM. Safe for demos without keys.
 * Pass `redesignFrom` to mark a redesign while still building from scratch from the brief.
 */
export function designFromFeatures(
  briefInput: DesignBrief,
  options: DesignFromFeaturesOptions = {},
): DesignFromFeaturesResponse {
  const brief = DesignBrief.parse(briefInput);
  const prior = options.redesignFrom ? DesignSpec.parse(options.redesignFrom) : undefined;
  const taste = resolveTaste(brief);
  const analysis = analyzeFeatures(brief);
  const effectiveBrief: DesignBrief = { ...brief, siteKind: analysis.siteKind };
  const routedSkills = routeSkills(analysis, taste);
  const tokens = buildTokens(taste, brief.brandAccent);
  const sections = buildSections(effectiveBrief, analysis, taste);
  const profile = AESTHETIC_PROFILES[taste.aestheticLean];

  const motionNotes =
    taste.motion === "none"
      ? ["Motion disabled — static affordances only"]
      : taste.motion === "light-scroll-reveals"
        ? ["Light section reveals only; respects prefers-reduced-motion"]
        : ["Subtle hover/focus transitions on controls and cards only"];

  const customizationHints = [
    `Density: ${taste.density}`,
    `Motion: ${taste.motion}`,
    `Aesthetic lean: ${profile.label}`,
    `Color mood: ${taste.colorMood}`,
    `Typography: ${taste.typographyWeight}`,
    `Rounding: ${taste.roundingDepth}`,
    "Reply with Taste Controls to regenerate without changing features.",
  ];

  if (prior) {
    customizationHints.push(
      `Redesign from ${prior.brief.productName} (${prior.brief.siteKind}) → ${effectiveBrief.productName} (${analysis.siteKind})`,
    );
  }

  const summary = [
    `${effectiveBrief.productName}: ${analysis.siteKind} surface`,
    `Lean ${profile.label.toLowerCase()} with ${taste.motion} motion`,
    `Routed ${routedSkills.length} skill nodes; ${sections.length} sections`,
    profile.principles[0],
  ].join(". ");

  const spec = DesignSpec.parse({
    brief: effectiveBrief,
    taste,
    routedSkills,
    tokens,
    tellDirectionId: tellDirectionForLean(taste.aestheticLean),
    informationArchitecture: analysis.recommendedSections,
    sections,
    motionNotes,
    customizationHints,
    summary,
  });

  return DesignFromFeaturesResponse.parse({
    spec,
    previewHtml: renderPreviewHtml(spec),
    redesigned: Boolean(prior),
  });
}

/** Preset briefs for showcase sites — used by /showcase/* and Playwright. */
export const SHOWCASE_BRIEFS: Record<string, DesignBrief> = {
  saas: DesignBrief.parse({
    productName: "Northstar",
    tagline: "Revenue intelligence your sellers actually open",
    audience: "B2B SaaS sales leaders",
    businessGoal: "demos",
    siteKind: "saas-marketing",
    lockSiteKind: true,
    features: [
      { id: "f1", name: "Account scoring", description: "Ranks accounts by fit and intent", priority: "p0" },
      { id: "f2", name: "Pipeline coaching", description: "Flags stalled deals with next actions", priority: "p0" },
      { id: "f3", name: "CRM sync", description: "Bi-directional sync with your system of record", priority: "p1" },
      { id: "f4", name: "Executive digest", description: "Weekly narrative for leadership", priority: "p1" },
    ],
    taste: { aestheticLean: "conversion-sharp", motion: "subtle-micro", colorMood: "neutral-professional" },
  }),
  dashboard: DesignBrief.parse({
    productName: "Northstar",
    tagline: "Seller workspace",
    audience: "Account executives",
    businessGoal: "activation",
    siteKind: "dashboard-webapp",
    lockSiteKind: true,
    features: [
      { id: "d1", name: "Priority queue", description: "Today’s accounts ranked by urgency", priority: "p0" },
      { id: "d2", name: "Deal room", description: "Context, stakeholders, and risks", priority: "p0" },
      { id: "d3", name: "Playbooks", description: "Guided steps for common motions", priority: "p1" },
      { id: "d4", name: "Activity feed", description: "Signals from email and CRM", priority: "p1" },
    ],
    taste: { aestheticLean: "minimal-clean", density: "information-rich", motion: "none", roundingDepth: "sharp" },
  }),
  corporate: DesignBrief.parse({
    productName: "Northstar",
    tagline: "Clarity for teams that sell complexity",
    audience: "Enterprise operators and investors",
    businessGoal: "trust",
    siteKind: "corporate-story",
    lockSiteKind: true,
    features: [
      { id: "c1", name: "Brand system", description: "One visual language across every surface", priority: "p0" },
      { id: "c2", name: "Trust narrative", description: "Security, privacy, and operating principles", priority: "p0" },
      { id: "c3", name: "Customer outcomes", description: "Measured lifts without vanity metrics", priority: "p1" },
    ],
    taste: { aestheticLean: "refined-story", density: "sparse", motion: "light-scroll-reveals", colorMood: "light-airy" },
  }),
  educational: DesignBrief.parse({
    productName: "Signal Path",
    tagline: "How the system actually works",
    audience: "Technical readers and operators",
    businessGoal: "trust",
    siteKind: "docs-educational",
    lockSiteKind: true,
    features: [
      { id: "e1", name: "Interactive diagram", description: "Scrub the mechanism in place", priority: "p0" },
      { id: "e2", name: "Chapter narrative", description: "Calm long-form explanation", priority: "p0" },
      { id: "e3", name: "Callout labels", description: "Precise part names without chrome", priority: "p1" },
    ],
    taste: { aestheticLean: "refined-story", density: "sparse", motion: "subtle-micro", colorMood: "neutral-professional" },
  }),
};
