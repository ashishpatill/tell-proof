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
      ? "system-crafted"
      : siteKind === "corporate-story" || siteKind === "docs-educational"
        ? "refined-story"
        : "conversion-sharp";

  return TasteControls.parse({
    density:
      brief.taste?.density ??
      (siteKind === "docs-educational" ? "balanced" : siteKind === "dashboard-webapp" ? "information-rich" : "balanced"),
    motion: brief.taste?.motion ?? (siteKind === "dashboard-webapp" ? "subtle-micro" : "subtle-micro"),
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
 * Main skill entry: analyze → route → tokens → compose → render.
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
  const tokens = buildTokens(taste, analysis.siteKind, brief.brandAccent);
  const sections = buildSections(effectiveBrief, analysis, taste);
  const profile = AESTHETIC_PROFILES[taste.aestheticLean];

  const motionNotes =
    taste.motion === "none"
      ? ["Motion disabled — every affordance reads as static, and no transition is emitted"]
      : taste.motion === "light-scroll-reveals"
        ? [
            "Sections fade in once at 8% visibility, then never animate again",
            "Interactive elements keep 120–260ms transitions; nothing else moves",
            "prefers-reduced-motion removes reveals entirely",
          ]
        : [
            "Transitions apply only to elements the reader can touch",
            "120–260ms with a single easing curve across the whole page",
            "prefers-reduced-motion collapses every duration to zero",
          ];

  const customizationHints = [
    `Density: ${taste.density}`,
    `Motion: ${taste.motion}`,
    `Aesthetic lean: ${profile.label}`,
    `Color mood: ${taste.colorMood}`,
    `Typography: ${taste.typographyWeight}`,
    `Rounding: ${taste.roundingDepth}`,
    "Reply with Taste Controls to regenerate without changing features.",
  ];

  const evidenceNotes = [
    `Display type ${tokens.type[0]?.px}px at 1440 (measured corridor 46–88px)`,
    `Body ${tokens.type.find((t) => t.name === "body")?.px}px at ${tokens.type.find((t) => t.name === "body")?.lineHeight} leading (corridor 1.25–1.5)`,
    `${tokens.declared} declared design tokens (corridor ≥ 100)`,
    `Body contrast ${tokens.contrast.bodyOnPaper}:1, secondary ${tokens.contrast.secondaryOnPaper}:1 (corridor ≥ 11 median)`,
    `${sections.length} sections across ${new Set(sections.map((s) => s.surface)).size} surface levels`,
  ];

  if (prior) {
    customizationHints.push(
      `Redesign from ${prior.brief.productName} (${prior.brief.siteKind}) → ${effectiveBrief.productName} (${analysis.siteKind})`,
    );
  }

  const summary = [
    `${effectiveBrief.productName}: ${analysis.siteKind} surface for ${effectiveBrief.audience}`,
    `${profile.label} lean with ${taste.motion} motion`,
    `${sections.length} sections built from ${effectiveBrief.features.length} declared capabilities`,
    profile.principles[0],
  ].join(". ");

  const spec = DesignSpec.parse({
    brief: effectiveBrief,
    taste,
    routedSkills,
    tokens,
    tellDirectionId: tellDirectionForLean(taste.aestheticLean),
    informationArchitecture: sections.map((s) => s.id),
    sections,
    motionNotes,
    customizationHints,
    evidenceNotes,
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
    tagline: "Know which accounts are moving before the forecast call",
    audience: "revenue leaders at B2B software companies",
    businessGoal: "demos",
    siteKind: "saas-marketing",
    lockSiteKind: true,
    features: [
      { id: "f1", name: "Account scoring", description: "Ranks every account by fit and live intent, so the top of the list is the list worth working", priority: "p0" },
      { id: "f2", name: "Pipeline coaching", description: "Flags deals that have gone quiet and names the next action that unsticks them", priority: "p0" },
      { id: "f3", name: "CRM sync", description: "Writes back to your system of record both ways, so nobody keeps a second spreadsheet", priority: "p1" },
      { id: "f4", name: "Executive digest", description: "A weekly narrative leadership actually reads instead of a dashboard they never open", priority: "p1" },
      { id: "f5", name: "Territory modelling", description: "Test a coverage change against last year's pipeline before you announce it", priority: "p2" },
    ],
    taste: { aestheticLean: "conversion-sharp", motion: "subtle-micro", colorMood: "neutral-professional" },
  }),
  dashboard: DesignBrief.parse({
    productName: "Northstar",
    tagline: "The seller workspace",
    audience: "account executives",
    businessGoal: "activation",
    siteKind: "dashboard-webapp",
    lockSiteKind: true,
    features: [
      { id: "d1", name: "Priority queue", description: "Today's accounts ranked by what changed overnight, not by alphabetical order", priority: "p0" },
      { id: "d2", name: "Deal room", description: "Context, stakeholders, and open risks for one deal on a single surface", priority: "p0" },
      { id: "d3", name: "Playbooks", description: "Guided steps for the motions your team already wins with", priority: "p1" },
      { id: "d4", name: "Activity feed", description: "Signals from email and the CRM, filtered to the ones that change a decision", priority: "p1" },
      { id: "d5", name: "Handoff notes", description: "State of an account written down automatically when ownership changes", priority: "p2" },
    ],
    taste: { aestheticLean: "system-crafted", density: "information-rich", motion: "subtle-micro", roundingDepth: "sharp", colorMood: "dark-premium" },
  }),
  corporate: DesignBrief.parse({
    productName: "Northstar",
    tagline: "Clarity for teams that sell complexity",
    audience: "enterprise operators and their boards",
    businessGoal: "trust",
    siteKind: "corporate-story",
    lockSiteKind: true,
    features: [
      { id: "c1", name: "One visual language", description: "A single system across product, sales material, and the contract you sign", priority: "p0" },
      { id: "c2", name: "Operating principles", description: "How decisions get made here, written down before you have to test them", priority: "p0" },
      { id: "c3", name: "Measured outcomes", description: "Results reported with their denominators, including the ones that did not move", priority: "p1" },
      { id: "c4", name: "Security posture", description: "Where data lives, who can reach it, and what happens when someone leaves", priority: "p1" },
    ],
    taste: { aestheticLean: "refined-story", density: "sparse", motion: "light-scroll-reveals", colorMood: "soft-brand-accent", typographyWeight: "light-elegant" },
  }),
  educational: DesignBrief.parse({
    productName: "Signal Path",
    tagline: "How the routing layer actually decides",
    audience: "engineers evaluating the runtime",
    businessGoal: "trust",
    siteKind: "docs-educational",
    lockSiteKind: true,
    features: [
      { id: "e1", name: "Placement model", description: "The real cost function, including the fairness constraint most schedulers leave out", priority: "p0" },
      { id: "e2", name: "Preemption ladder", description: "What gets evicted first, and which guarantees survive an eviction", priority: "p0" },
      { id: "e3", name: "Backpressure", description: "How queue depth turns into admission decisions upstream of the scheduler", priority: "p1" },
      { id: "e4", name: "Failure domains", description: "Spread rules, and what they cost you in packing efficiency", priority: "p1" },
    ],
    taste: { aestheticLean: "minimal-clean", density: "balanced", motion: "subtle-micro", colorMood: "light-airy" },
  }),
};
