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

export const SiteKind = z.enum(["saas-marketing", "dashboard-webapp", "corporate-story", "docs-educational"]);
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
  brandAccent: z.string().optional(),
  taste: TasteControls.partial().optional(),
});
export type DesignBrief = z.infer<typeof DesignBrief>;

export const DesignTokens = z.object({
  paper: z.string(),
  paperAlt: z.string(),
  ink: z.string(),
  inkMuted: z.string(),
  accent: z.string(),
  accentInk: z.string(),
  border: z.string(),
  radius: z.string(),
  shadow: z.string(),
  fontDisplay: z.string(),
  fontBody: z.string(),
  contentMax: z.string(),
  sectionY: z.string(),
});
export type DesignTokens = z.infer<typeof DesignTokens>;

export const SectionSpec = z.object({
  id: z.string(),
  kind: z.enum([
    "nav",
    "hero",
    "features",
    "pricing",
    "proof",
    "story",
    "cta",
    "footer",
    "dashboard-shell",
    "dashboard-main",
    "figure",
  ]),
  skillNode: SkillNodeId,
  title: z.string(),
  body: z.string().default(""),
  items: z.array(z.string()).default([]),
  /** Sidebar / chrome labels (dashboard shell, quiet edu nav extras). */
  asideItems: z.array(z.string()).default([]),
  /** Hero-level brand wordmark when distinct from the headline. */
  brandLabel: z.string().optional(),
  /** Figure / instrument caption for educational surfaces. */
  figureCaption: z.string().optional(),
  ctaLabel: z.string().optional(),
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
