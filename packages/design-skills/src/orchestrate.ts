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
      : siteKind === "corporate-story" ||
          siteKind === "docs-educational" ||
          siteKind === "editorial-foundry" ||
          siteKind === "research-dossier" ||
          siteKind === "signal-observatory" ||
          siteKind === "archive-index" ||
          siteKind === "commerce-loom" ||
          siteKind === "field-guide" ||
          siteKind === "press-atelier"
        ? "refined-story"
        : "conversion-sharp";

  return TasteControls.parse({
    density:
      brief.taste?.density ??
      (siteKind === "docs-educational" || siteKind === "editorial-foundry" || siteKind === "research-dossier" || siteKind === "archive-index" || siteKind === "commerce-loom" || siteKind === "field-guide" || siteKind === "press-atelier"
        ? "sparse"
        : siteKind === "signal-observatory"
          ? "balanced"
        : siteKind === "dashboard-webapp"
          ? "information-rich"
          : "balanced"),
    motion:
      brief.taste?.motion ??
      (siteKind === "editorial-foundry" || siteKind === "research-dossier" || siteKind === "signal-observatory" || siteKind === "archive-index" || siteKind === "commerce-loom" || siteKind === "field-guide" || siteKind === "press-atelier"
        ? "light-scroll-reveals"
        : siteKind === "dashboard-webapp"
          ? "subtle-micro"
          : "subtle-micro"),
    aestheticLean: brief.taste?.aestheticLean ?? leanDefault,
    colorMood:
      brief.taste?.colorMood ??
      (siteKind === "editorial-foundry" || siteKind === "research-dossier" || siteKind === "signal-observatory" || siteKind === "archive-index" || siteKind === "commerce-loom" || siteKind === "field-guide" || siteKind === "press-atelier"
        ? "light-airy"
        : "neutral-professional"),
    typographyWeight:
      brief.taste?.typographyWeight ??
      (siteKind === "editorial-foundry" || siteKind === "research-dossier" || siteKind === "signal-observatory" || siteKind === "archive-index" || siteKind === "commerce-loom" || siteKind === "field-guide" || siteKind === "press-atelier"
        ? "light-elegant"
        : "medium-modern"),
    roundingDepth:
      brief.taste?.roundingDepth ??
      (siteKind === "dashboard-webapp" ||
        siteKind === "editorial-foundry" ||
        siteKind === "research-dossier" ||
        siteKind === "signal-observatory" ||
        siteKind === "archive-index" ||
        siteKind === "commerce-loom" ||
        siteKind === "field-guide" ||
        siteKind === "press-atelier"
        ? "sharp"
        : "soft"),
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
  const tokens = buildTokens(taste, analysis.siteKind, brief.brandAccent, brief.productName);
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

/** @deprecated Prefer `getTemplate` / `SHOWCASE_BRIEFS` from `./templates`. Re-exported for callers. */
export { SHOWCASE_BRIEFS } from "./templates";
