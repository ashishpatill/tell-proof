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

export const MotionLevel = z.enum([
  "none",
  "subtle-micro",
  "light-scroll-reveals",
  /** Pinned/scrub chapter + hero entrance + stagger (CSS-native; no heavy deps). */
  "scroll-narrative",
  /** Gated metaphor tier — still CSS-first; WebGL only behind explicit brief flags later. */
  "immersive",
]);
export type MotionLevel = z.infer<typeof MotionLevel>;

/** Once-only section enters + hero entrance (not micro-only). */
export function motionHasReveals(motion: MotionLevel): boolean {
  return (
    motion === "light-scroll-reveals" ||
    motion === "scroll-narrative" ||
    motion === "immersive"
  );
}

/** Scroll chapters / pin grammar. */
export function motionHasNarrative(motion: MotionLevel): boolean {
  return motion === "scroll-narrative" || motion === "immersive";
}

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
  /**
   * Art-directed studio / selected-work marketing — figure-owned fold, paper-led scroll,
   * calibrated to art-directed-studio (fold figure ~1.0, little inverse, large display).
   */
  "art-directed-studio",
  /**
   * Voice-led consumer craft marketing — figure-dense product story, moderate display,
   * calibrated to consumer-craft (figureArea ~0.68, fold figure ~0.73, little inverse).
   */
  "consumer-craft",
  /**
   * Editorial foundry / type-craft marketing — hard-seam fold, typographic spine,
   * type-ladder specimen, marginalia essay. Calibrated to type-foundry + personal-craft
   * + editorial-longform (fold figure ~0.97, figureArea ~0.38, invertedShare ~0,
   * display ~3.3vw, alignment axes ~6). Not a recolored SaaS/studio skeleton.
   */
  "editorial-foundry",
  /**
   * Research dossier / capital briefing — folio masthead, chapter rail, dossier plate,
   * verso/recto spread with footnote register, bleed rules, imprint close.
   * Calibrated to capital-brand + research-editorial + editorial-brand
   * (alignment axes ~6–8, spineConformity ~0.5–0.75, quiet display, dense bleeds,
   * layered matter). Not a recolored SaaS, foundry, or studio skeleton.
   */
  "research-dossier",
  /**
   * Signal observatory / enterprise telemetry marketing — chronometer fold, scrub rail,
   * signal-lattice instrument plate, chrono essay with tick beads, calibration close.
   * Calibrated to enterprise-observability + enterprise-data + award-index
   * (figureArea ~0.4–0.78, foldFigure ~0.23–0.57, alignment axes ~3–6, spine ~0.2–0.8,
   * dense instrument matter, quiet-to-moderate display). Not a recolored dashboard shell
   * or SaaS conversion ladder.
   */
  "signal-observatory",
  /**
   * Archive index / award-index craft — quiet register masthead, sticky A–Z alpha rail,
   * index-ledger figure owning the fold, story-entry essay with hanging folio, Registry close.
   * Calibrated to award-index (foldFigure ~0.54, figureArea ~0.58, invertedShare ~0,
   * display ~1–3vw quiet, alignment axes ~3, spineConformity ~0.82, high ink variation).
   * Not SaaS, foundry, dossier, or observatory.
   */
  "archive-index",
  /**
   * Commerce loom / merchandising press — drawloom fold (claim woven as weft through warp),
   * size treadles, free textile photo cloth, hangtag essay, Care label close.
   * Calibrated to commerce-platform + brand-product-agency (figure-forward, quiet-to-moderate
   * display, dense product matter, low inverse). Not SaaS conversion, not soft card grids.
   */
  "commerce-loom",
  /**
   * Field guide / herbarium craft — glassine press fold (specimen under peeled sheet + museum
   * label), binomial strip, free botanical plate, range essay, Voucher close.
   * Calibrated to personal-craft + brand-agency + consumer-craft (figureArea high, quiet display,
   * paper-led, layered specimen matter). Not soft glass hero collages or theme-pack card stacks.
   */
  "field-guide",
  /**
   * Press atelier / brand-agency production craft — registration-framed fold, sticky signature
   * rail, press-sheet imposition figure owning the fold, gather essay with fold ticks,
   * Pressroom close. Calibrated to brand-agency + brand-product-agency + editorial-longform
   * (foldFigure ~0.9–1.0, figureArea ~0.4–0.52, invertedShare ~0, display ~1.5–3.8vw,
   * alignment axes ~3–6, dense bleeds). Not SaaS, foundry, dossier, observatory, or archive.
   */
  "press-atelier",
  /**
   * Lantern path / cinematic night-walk craft — chapter waypoint rail, path masthead,
   * spanning path-plate cartograph owning the fold (elevation + lanterns + silhouettes),
   * ember essay with bead ticks, Ember close. Calibrated to art-directed-studio +
   * editorial-longform + personal-craft (foldFigure high, figureArea ~0.4–0.7, invertedShare ~0,
   * quiet-to-moderate display, dense plate matter, paper-led page with a night atlas figure).
   * Not a soft dark SaaS glow page, not WebGL tourism chrome, not press/archive/loom.
   */
  "lantern-path",
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
  /**
   * Product-as-proof workflow stage — input → process → draft → review → approve.
   * SaaS-marketing signature proof; HTMX-swapped panels; never invents metrics.
   */
  "product-proof-stage",
  /** Single-offer conversion landing craft — FAQ objections + CTA risk notes. */
  "conversion-landing-craft",
  /** Pricing as decision support — cadence toggle, recommended lane, risk note. */
  "pricing-decision-craft",
  /** Once-only scroll reveals — no blur spectacle; reduced-motion settles immediately. */
  "scroll-reveal-once",
  /** Hero brand→claim→CTA entrance once on load. */
  "hero-entrance-once",
  /** Staggered children inside revealed sections. */
  "section-stagger-enter",
  /** CSS sticky chapter + progress for scroll-narrative / immersive. */
  "scroll-narrative-craft",
  /** Optional authored vector mount (Rive/Lottie) — poster frame when empty. */
  "authored-motion-slot",
  /**
   * Motion stack craft — Three/D3/GSAP-class/OSS-template judgment + product instruments.
   * Native CSS/SVG first; heavy libs only when metaphor or data earns them.
   */
  "motion-stack-craft",
  /** Quiet 01–0N mono markers for process / feature rhythm. */
  "indexed-detail-markers",
  /** Declared integration/capability marks only — never fake logo walls. */
  "honest-integration-marks",
  /** Warm paper surfaces + technical bracket framing. */
  "paper-technical-frame",
  /** Framed dual-panel splits with mono metadata rails. */
  "split-panel-technical",
  /** Edge alpha fades for overflowing rails / marquees. */
  "edge-fade-craft",
  /** Neutral layered elevation tokens for soft-elevation depth. */
  "elevation-depth-tokens",
  /** Editorial chapter pacing — proof before explanation; decisive close. */
  "editorial-chapter-craft",
  /** Step/scrub instruments for educational mechanism folds. */
  "scrub-sequence-craft",
  /** Governance beats — approval, audit, rollback — corporate/fintech. */
  "operational-governance-craft",
  /** Sparse diagnostic annotations for system-crafted specimens. */
  "wireframe-annotation-craft",
  /** Section-bounded ambient atmosphere (static default; full sim in skill). */
  "ambient-atmosphere-craft",
  /** Brand-accent beam/vignette atmosphere. */
  "signal-beam-craft",
  /** At-most-one frosted glass shell. */
  "glass-shell-craft",
  /** Container-led technical shell hierarchy. */
  "container-tech-shell",
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
  /**
   * Single primary action the whole site repeats (agency brief block "The 1 action").
   * Example: "Book a discovery call".
   */
  primaryCta: z.string().min(1).optional(),
  /**
   * Explicit ban list — constraints beat vibes. Merged with agency delivery defaults.
   */
  banList: z.array(z.string()).default([]),
  /**
   * Local paths to reference-board screenshots (gitignored boards). Match type/spacing/motion;
   * never copy layouts. URLs live only in research/boards.local.json.
   */
  referenceBoardPaths: z.array(z.string()).default([]),
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
  /** Hard vertical seam: paper claim | inverse type ladder — foundry signature fold. */
  "hero-seam",
  /**
   * Folio masthead + quiet claim + spanning dossier plate — research-dossier signature fold.
   * Magazine volume/issue running head; not overfigure, not seam, not SaaS split.
   */
  "hero-folio",
  /**
   * Chronometer fold — vertical time ticks + claim + spanning signal lattice.
   * Sticky scrub rail for time windows. Signal-observatory signature; not folio, seam, or SaaS.
   */
  "hero-chrono",
  /**
   * Quiet register masthead + dense numbered index owning the fold — archive-index signature.
   * The index-ledger IS the figure (not a product plate below the claim). Sticky A–Z alpha rail.
   * Not folio, chrono, seam, or SaaS split.
   */
  "hero-register",
  /**
   * Press fold — registration/crop marks frame + compact claim + spanning press-sheet.
   * Sticky signature rail (Sig A–H). Press-atelier signature; not register, folio, chrono, or SaaS.
   */
  "hero-press",
  /**
   * Pipeline fold — sticky stage rail + compact claim + spanning pipeline board.
   * SaaS-marketing signature; not stackfold, seam, or generic feature grid.
   */
  "hero-pipeline",
  /**
   * Queue fold — sticky priority rail + compact claim + spanning operator console plate.
   * Dashboard-webapp signature; app-shell remains the density peak below.
   */
  "hero-queue",
  /**
   * Diligence fold — sticky principle spine + hard measure rule + spanning posture grid.
   * Corporate-story signature; paper-led, not foundry inverse seam.
   */
  "hero-diligence",
  /**
   * Mechanism fold — scrub instrument owns the fold (stage list + range + mechanism plate).
   * Docs-educational signature; not stackfold with a scrub buried mid-page.
   */
  "hero-mechanism",
  /**
   * Wire fold — sticky cutoff rail + spanning multi-entity wire ledger + tolerance strip.
   * Fintech-marketing signature; not SaaS stackfold with more inverse bands.
   */
  "hero-wire",
  "metric-band",
  "specimen-band",
  "marquee-proof",
  /**
   * Interactive product-proof workflow — stage chips swap HTMX panels
   * (input → process → draft → review → approve). SaaS-marketing proof signature.
   */
  "workflow-proof",
  "feature-alternating",
  "feature-bento",
  "feature-index",
  "feature-rows",
  "figure-explainer",
  "story-chapters",
  /** Essay register with outer-margin annotations — editorial-longform craft. */
  "story-marginalia",
  /**
   * Verso/recto book opening with center gutter + footnote register — dossier craft.
   * Hard for a theme pack to invent: paired pages, superscript refs, bottom register.
   */
  "story-spread",
  /**
   * Chrono essay — vertical event track with tick beads + outer time labels.
   * Signal-observatory signature; not chapters, marginalia, or verso/recto.
   */
  "story-chrono",
  /**
   * Single-entry essay with hanging folio number + ruled measure — archive-index craft.
   * Not chapters, marginalia, verso/recto, or chrono beads.
   */
  "story-entry",
  /**
   * Loom fold — size-tape rail + compact claim + spanning warp/weft SKU loom with photo cells.
   * Commerce-loom signature; not register, chrono, folio, or soft card collage.
   */
  "hero-loom",
  /**
   * Voucher fold — taxon rail + voucher masthead + spanning specimen plate with photo inset.
   * Field-guide signature; not loom, register, or glassmorphism hero.
   */
  "hero-voucher",
  /**
   * Hangtag essay — string/eyelet mark + ruled hangtag body + outer size index.
   * Commerce-loom craft; not entry folio or chrono beads.
   */
  "story-hangtag",
  /**
   * Range essay — distribution beads + outer taxon index + voucher footnotes.
   * Field-guide craft; not hangtag, entry, or verso/recto.
   */
  "story-range",
  /**
   * Gather essay — folded signature ticks + outer plate index — press-atelier craft.
   * Not entry folios, chrono beads, verso/recto, or marginalia.
   */
  "story-gather",
  /**
   * Path fold — sticky chapter waypoint rail + compact claim + spanning night path-plate.
   * Lantern-path signature; not press forme, archive ledger, or soft dark hero collage.
   */
  "hero-path",
  /**
   * Ember essay — lantern bead ticks + outer chapter index — lantern-path craft.
   * Not gather signatures, range beads, hangtag, or chrono track.
   */
  "story-ember",
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
