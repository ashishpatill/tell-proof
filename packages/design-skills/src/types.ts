import { z } from "zod";

/** Aesthetic lean profiles — principle codes only (no external person/brand names). */
export const AestheticLean = z.enum([
  "minimal-clean",
  "conversion-sharp",
  "system-crafted",
  "refined-story",
]);
export type AestheticLean = z.infer<typeof AestheticLean>;

export const Density = z.enum(["sparse", "balanced", "information-rich"]);
export type Density = z.infer<typeof Density>;

export const MotionLevel = z.enum(["none", "subtle-micro", "light-scroll-reveals"]);
export type MotionLevel = z.infer<typeof MotionLevel>;

export const ColorMood = z.enum([
  "neutral-professional",
  "soft-brand-accent",
  "dark-premium",
  "light-airy",
]);
export type ColorMood = z.infer<typeof ColorMood>;

export const TypeWeight = z.enum(["light-elegant", "medium-modern", "bold-confident"]);
export type TypeWeight = z.infer<typeof TypeWeight>;

export const RoundingDepth = z.enum(["sharp", "soft", "soft-elevation"]);
export type RoundingDepth = z.infer<typeof RoundingDepth>;

export const TasteControls = z.object({
  density: Density.default("balanced"),
  motion: MotionLevel.default("subtle-micro"),
  aestheticLean: AestheticLean.default("conversion-sharp"),
  colorMood: ColorMood.default("neutral-professional"),
  typographyWeight: TypeWeight.default("medium-modern"),
  roundingDepth: RoundingDepth.default("soft"),
});
export type TasteControls = z.infer<typeof TasteControls>;

export const SiteKind = z.enum([
  "saas-marketing",
  "dashboard-webapp",
  "corporate-story",
  "docs-educational",
  /** Money-movement / treasury marketing — inverse-heavy, bleed-dense, calibrated to fintech-product. */
  "fintech-marketing",
]);
export type SiteKind = z.infer<typeof SiteKind>;

export const SkillNodeId = z.enum([
  "analyze-features-requirements",
  "design-system-foundation",
  "hero-section",
  "features-benefits",
  "pricing-or-plans",
  "navigation-header-footer",
  "content-storytelling-pages",
  "forms-ctas-conversion",
  "restrained-motion-micro",
  "dashboard-or-webapp-ui",
  "responsive-performance",
]);
export type SkillNodeId = z.infer<typeof SkillNodeId>;

export const FeatureSpec = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  priority: z.enum(["p0", "p1", "p2"]).default("p1"),
});
export type FeatureSpec = z.infer<typeof FeatureSpec>;

export const DesignBrief = z.object({
  productName: z.string().min(1),
  tagline: z.string().default(""),
  audience: z.string().default("B2B buyers"),
  businessGoal: z.enum(["leads", "demos", "trust", "sales", "activation"]).default("demos"),
  siteKind: SiteKind.default("saas-marketing"),
  /** When true, do not auto-detect site kind from feature language. */
  lockSiteKind: z.boolean().default(false),
  features: z.array(FeatureSpec).min(1),
  constraints: z.array(z.string()).default([
    "totally customized to content",
    "not distracting with too many animations",
    "multi-million-dollar business quality",
  ]),
  /** Optional brand accent — hex only (#RGB / #RRGGBB / #RRGGBBAA). Rejects CSS injection. */
  brandAccent: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "brandAccent must be a hex color")
    .optional(),
  taste: TasteControls.partial().optional(),
});
export type DesignBrief = z.infer<typeof DesignBrief>;

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

export const ColorTokens = z.object({
  paper: z.string(),
  paperRaised: z.string(),
  paperSunken: z.string(),
  inverse: z.string(),
  inverseInk: z.string(),
  inverseInkMuted: z.string(),
  ink: z.string(),
  /**
   * The ink prose is read at.
   *
   * Declared by the palette and consumed all over the stylesheet, but missing from this schema —
   * so zod stripped it on the way through and `--c-ink-body` was never emitted. Every
   * `var(--c-ink-body)` on the page was an invalid reference, which HTML text survived by falling
   * back to inherited primary ink, and which SVG text did not: an invalid `fill` resolves to the
   * initial value, so drawn prose was rendering black on the dark bands.
   */
  inkBody: z.string(),
  inkSecondary: z.string(),
  inkTertiary: z.string(),
  inkQuiet: z.string(),
  accent: z.string(),
  accentHover: z.string(),
  accentInk: z.string(),
  accentSurface: z.string(),
  accentBorder: z.string(),
  border: z.string(),
  borderStrong: z.string(),
  signal: z.string(),
  signalSurface: z.string(),
});
export type ColorTokens = z.infer<typeof ColorTokens>;

export const TypeToken = z.object({
  name: z.string(),
  px: z.number(),
  css: z.string(),
  lineHeight: z.number(),
  trackingEm: z.number(),
  weight: z.number(),
});
export type TypeToken = z.infer<typeof TypeToken>;

export const DesignTokens = z.object({
  color: ColorTokens,
  type: z.array(TypeToken),
  space: z.array(z.object({ name: z.string(), px: z.number() })),
  radius: z.record(z.string()),
  shadow: z.record(z.string()),
  motion: z.record(z.string()),
  fontDisplay: z.string(),
  fontBody: z.string(),
  fontMono: z.string(),
  /** Google Fonts family specs to load (family + weight axis). */
  fontRequests: z.array(z.string()),
  contentMax: z.string(),
  contentWide: z.string(),
  proseMax: z.string(),
  sectionY: z.string(),
  sectionYTight: z.string(),
  gutter: z.string(),
  contrast: z.record(z.number()),
  /** Count of declared custom properties — measured as the "declared token system" signal. */
  declared: z.number(),
});
export type DesignTokens = z.infer<typeof DesignTokens>;

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export const SurfaceLevel = z.enum(["paper", "raised", "sunken", "inverse", "accent"]);
export type SurfaceLevel = z.infer<typeof SurfaceLevel>;

export const LayoutVariant = z.enum([
  "nav",
  "hero-editorial",
  "hero-split",
  "hero-statement",
  "metric-band",
  "specimen-band",
  "marquee-proof",
  "feature-alternating",
  "feature-bento",
  "feature-index",
  "feature-rows",
  "figure-explainer",
  "story-chapters",
  "pullquote",
  "pricing-lanes",
  "compare-matrix",
  "faq-columns",
  "cta-band",
  "footer-columns",
  "app-shell",
]);
export type LayoutVariant = z.infer<typeof LayoutVariant>;

export const Block = z.object({
  title: z.string(),
  body: z.string().default(""),
  /** Small tracked label above the block title. */
  kicker: z.string().optional(),
  /** Right-aligned or trailing metadata. */
  meta: z.string().optional(),
  emphasis: z.enum(["lead", "normal", "quiet"]).default("normal"),
  /** Optional bullet detail lines. */
  points: z.array(z.string()).default([]),
});
export type Block = z.infer<typeof Block>;

export const MetricSpec = z.object({
  value: z.string(),
  label: z.string(),
  note: z.string().default(""),
});
export type MetricSpec = z.infer<typeof MetricSpec>;

export const SectionSpec = z.object({
  id: z.string(),
  kind: z.enum([
    "nav",
    "hero",
    "metrics",
    "features",
    "specimen",
    "figure",
    "story",
    "proof",
    "pricing",
    "compare",
    "faq",
    "cta",
    "footer",
    "app",
  ]),
  layout: LayoutVariant,
  surface: SurfaceLevel.default("paper"),
  skillNode: SkillNodeId,
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.string().default(""),
  blocks: z.array(Block).default([]),
  aside: z.array(Block).default([]),
  metrics: z.array(MetricSpec).default([]),
  /** Column ratio for split layouts, e.g. "7fr 5fr". Asymmetry is a measured craft signal. */
  columns: z.string().optional(),
  /** True when this section continues the previous one's subject and shares its screen. */
  bond: z.boolean().default(false),
  ctaLabel: z.string().optional(),
  ctaNote: z.string().optional(),
  secondaryLabel: z.string().optional(),
  quote: z.string().optional(),
  quoteAttribution: z.string().optional(),
  figureCaption: z.string().optional(),
  brandLabel: z.string().optional(),
  navItems: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  inspirationNotes: z.array(z.string()).default([]),
});
export type SectionSpec = z.infer<typeof SectionSpec>;

export const DesignSpec = z.object({
  brief: DesignBrief,
  taste: TasteControls,
  routedSkills: z.array(SkillNodeId),
  tokens: DesignTokens,
  tellDirectionId: z.string(),
  informationArchitecture: z.array(z.string()),
  sections: z.array(SectionSpec),
  motionNotes: z.array(z.string()),
  customizationHints: z.array(z.string()),
  /** Evidence corridors this composition was built against. */
  evidenceNotes: z.array(z.string()).default([]),
  summary: z.string(),
});
export type DesignSpec = z.infer<typeof DesignSpec>;

export const DesignFromFeaturesRequest = z.object({
  brief: DesignBrief,
  /** Prior spec when regenerating — features still win; used for redesign continuity hints. */
  redesignFrom: DesignSpec.optional(),
});
export type DesignFromFeaturesRequest = z.infer<typeof DesignFromFeaturesRequest>;

export const DesignFromFeaturesResponse = z.object({
  spec: DesignSpec,
  previewHtml: z.string(),
  /** True when this response was produced as a redesign of a prior spec. */
  redesigned: z.boolean().default(false),
});
export type DesignFromFeaturesResponse = z.infer<typeof DesignFromFeaturesResponse>;
