import { z } from "zod";

export const ComputedStyleSample = z.object({
  selector: z.string(),
  fontFamily: z.string(),
  fontSize: z.string(),
  fontWeight: z.string(),
  color: z.string(),
  backgroundColor: z.string(),
  borderRadius: z.string(),
  boxShadow: z.string(),
  padding: z.string(),
  textAlign: z.string(),
  lineHeight: z.string(),
  backgroundImage: z.string().default("none"),
});
export type ComputedStyleSample = z.infer<typeof ComputedStyleSample>;

export const InteractiveProbe = z.object({
  role: z.string(),
  selector: z.string(),
  hasHoverDiff: z.boolean(),
  hasFocusVisibleDiff: z.boolean(),
  hasDisabledAttr: z.boolean(),
  ariaDisabled: z.boolean(),
});
export type InteractiveProbe = z.infer<typeof InteractiveProbe>;

export const CssVariable = z.object({ name: z.string(), value: z.string() });
export type CssVariable = z.infer<typeof CssVariable>;

/** The page's *actual* rendered tokens, sampled directly from the DOM. */
export const SurfaceTokens = z.object({
  bodyBg: z.string(),
  bodyText: z.string(),
  bodyFont: z.string(),
  headingFont: z.string(),
  accent: z.string(),                       // computed color/rgb of the dominant accent
  accentSources: z.array(z.string()).default([]), // every accent-ish color found (to remap)
  radius: z.string(),
  shadow: z.string(),
});
export type SurfaceTokens = z.infer<typeof SurfaceTokens>;

export const CapturePayload = z.object({
  url: z.string(),
  capturedAt: z.string(),
  viewport: z.object({ width: z.number(), height: z.number() }),
  screenshotBase64: z.string(),
  // A sanitized, re-renderable snapshot of the page (scripts stripped, same-origin
  // CSS inlined, <base> injected). Enables a *true* before/after restyle, not a filter.
  snapshotHtml: z.string().default(""),
  cssVariables: z.array(CssVariable).default([]),
  surfaceTokens: SurfaceTokens.optional(),
  styles: z.array(ComputedStyleSample),
  probes: z.array(InteractiveProbe),
  domSummary: z.object({
    headingCount: z.number(),
    buttonCount: z.number(),
    centeredBlockRatio: z.number(),
    emojiInUiCount: z.number(),
  }),
});
export type CapturePayload = z.infer<typeof CapturePayload>;

export const DesignFingerprint = z.object({
  url: z.string(),
  generatedAt: z.string(),
  fontFamilies: z.array(z.object({ family: z.string(), count: z.number(), roles: z.array(z.string()) })),
  colors: z.array(z.object({ value: z.string(), count: z.number(), normalizedHex: z.string() })),
  shadows: z.array(z.object({ value: z.string(), count: z.number() })),
  radii: z.array(z.object({ value: z.string(), count: z.number() })),
  spacingValues: z.array(z.object({ value: z.string(), count: z.number() })),
  typeScale: z.array(z.object({ size: z.string(), count: z.number(), roles: z.array(z.string()) })),
  centeredBlockRatio: z.number(),
  emojiInUiCount: z.number(),
  gradientDetected: z.boolean(),
  gradientSamples: z.array(z.string()).default([]),
  nearDuplicateGrays: z.array(z.object({ values: z.array(z.string()), deltaE: z.number() })).default([]),
  focusRingCoverage: z.number(),
  stateCoverage: z.object({
    hover: z.number(),
    focus: z.number(),
    disabled: z.number(),
  }),
});
export type DesignFingerprint = z.infer<typeof DesignFingerprint>;

export const Verdict = z.enum(["generic", "drift", "intentional", "uncertain"]);
export type Verdict = z.infer<typeof Verdict>;

export const TellDetector = z.enum([
  "SystemFontTell",
  "GradientCrutchTell",
  "ShadowEverywhereTell",
  "RadiusMonotoneTell",
  "AcidAccentTell",
  "EmojiChromeTell",
  "CenteredEverythingTell",
  "GrayMushTell",
]);
export type TellDetector = z.infer<typeof TellDetector>;

export const DriftDetector = z.enum([
  "TokenBypass",
  "NearDuplicateValues",
  "FocusRingInconsistency",
  "TypeScaleDrift",
  "SpacingChaos",
  "StateGap",
]);
export type DriftDetector = z.infer<typeof DriftDetector>;

export const Evidence = z.object({
  kind: z.enum(["computed", "screenshot-region", "dom", "probe"]),
  label: z.string(),
  value: z.string(),
  selector: z.string().optional(),
  region: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
});
export type Evidence = z.infer<typeof Evidence>;

export const Finding = z.object({
  id: z.string(),
  family: z.enum(["tell", "drift"]),
  detector: z.union([TellDetector, DriftDetector]),
  verdictHint: Verdict,
  facts: z.record(z.any()),
  evidence: z.array(Evidence),
  severity: z.enum(["high", "medium", "low"]).default("medium"),
});
export type Finding = z.infer<typeof Finding>;

export const TasteVerdict = z.object({
  findingId: z.string(),
  verdict: Verdict,
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  intentionalReason: z.string().optional(),
});
export type TasteVerdict = z.infer<typeof TasteVerdict>;

export const ArtDirection = z.object({
  id: z.string(),
  label: z.string(),
  keywords: z.array(z.string()),
  tokenOverrides: z.record(z.string()),
  summary: z.string(),
});
export type ArtDirection = z.infer<typeof ArtDirection>;

/** One before→after token change, grounded in the real captured values. */
export const ReconTokenRow = z.object({
  key: z.string(),
  label: z.string(),
  before: z.string(),
  after: z.string(),
  note: z.string().optional(),
  swatchBefore: z.string().optional(),
  swatchAfter: z.string().optional(),
});
export type ReconTokenRow = z.infer<typeof ReconTokenRow>;

/**
 * A deterministic, page-specific redesign derived from the real fingerprint.
 * `css` is a drop-in override sheet AND the exact CSS injected into the live
 * "after" preview — so the seam shows the real restyle, not a photo filter.
 */
export const Reconciliation = z.object({
  directionId: z.string(),
  label: z.string(),
  summary: z.string(),
  rows: z.array(ReconTokenRow),
  css: z.string(),
  fontImport: z.string().default(""),
  accentBefore: z.string(),
  accentAfter: z.string(),
  surfaceAfter: z.string(),
  textAfter: z.string(),
});
export type Reconciliation = z.infer<typeof Reconciliation>;

export const RedesignProposal = z.object({
  findingId: z.string().optional(),
  direction: ArtDirection,
  reconciliation: Reconciliation.optional(),
  files: z.array(z.object({
    file: z.string(),
    unifiedDiff: z.string(),
    summary: z.string(),
  })),
});
export type RedesignProposal = z.infer<typeof RedesignProposal>;

export const TellReport = z.object({
  capture: CapturePayload,
  fingerprint: DesignFingerprint,
  findings: z.array(Finding),
  verdicts: z.array(TasteVerdict),
  score: z.object({
    total: z.number(),
    generic: z.number(),
    drift: z.number(),
    intentional: z.number(),
    uncertain: z.number(),
  }),
  activeDirection: ArtDirection.optional(),
});
export type TellReport = z.infer<typeof TellReport>;
