/**
 * Shared DesignControls catalogs — Tell-owned SiteKind + taste codes only.
 * Maps friendly UI labels ↔ DesignBrief / TasteControls fields.
 * Never list third-party product brands as options.
 */
import type {
  AestheticLean,
  ColorMood,
  Density,
  MotionLevel,
  RoundingDepth,
  SiteKind,
  TypeWeight,
} from "@tell/design-skills";

export type BusinessGoal = "leads" | "demos" | "trust" | "sales" | "activation";

/** UI fidelity ladder — composer/session field; applied when building a brief. */
export type DesignFidelity = "wire" | "craft" | "proof";

/** Tell palette accent tokens (hex only — matches DesignBrief.brandAccent). */
export type AccentToken = "terracotta" | "ink" | "forest" | "ocean";

export type DesignControlOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
};

export type DesignControlsValue = {
  siteKind: SiteKind;
  businessGoal: BusinessGoal;
  fidelity: DesignFidelity;
  aestheticLean: AestheticLean;
  colorMood: ColorMood;
  motion: MotionLevel;
  density: Density;
  typographyWeight: TypeWeight;
  roundingDepth: RoundingDepth;
  accentToken: AccentToken;
};

export const ACCENT_HEX: Record<AccentToken, string> = {
  terracotta: "#D4714A",
  ink: "#2A2622",
  forest: "#2F5D50",
  ocean: "#1F4B6E",
};

/** Curated Surfaces for home chip bar (Tell specimens / SiteKind only). */
export const SURFACE_OPTIONS_COMPACT: readonly DesignControlOption<SiteKind>[] = [
  { value: "care-pathway", label: "Care pathway", hint: "clinic · Roundspool specimen" },
  { value: "saas-marketing", label: "Marketing landing", hint: "story · conversion" },
  { value: "docs-educational", label: "Product docs", hint: "clarity · dense type" },
  { value: "dashboard-webapp", label: "Ops dashboard", hint: "density · scan" },
  { value: "editorial-foundry", label: "Editorial magazine", hint: "story · typography" },
  { value: "commerce-loom", label: "Booking / commerce", hint: "trust · flow" },
] as const;

/** Full SiteKind catalog for Studio sidebar. */
export const SURFACE_OPTIONS_FULL: readonly DesignControlOption<SiteKind>[] = [
  { value: "care-pathway", label: "Care pathway", hint: "clinic · Roundspool" },
  { value: "saas-marketing", label: "Marketing landing", hint: "conversion" },
  { value: "dashboard-webapp", label: "Ops dashboard", hint: "scan density" },
  { value: "corporate-story", label: "Corporate story", hint: "trust narrative" },
  { value: "docs-educational", label: "Product docs", hint: "clarity" },
  { value: "fintech-marketing", label: "Fintech marketing", hint: "treasury" },
  { value: "art-directed-studio", label: "Art-directed studio", hint: "selected work" },
  { value: "consumer-craft", label: "Consumer craft", hint: "everyday product" },
  { value: "editorial-foundry", label: "Editorial magazine", hint: "type craft" },
  { value: "research-dossier", label: "Research dossier", hint: "capital briefing" },
  { value: "signal-observatory", label: "Signal observatory", hint: "telemetry" },
  { value: "archive-index", label: "Archive index", hint: "A–Z register" },
  { value: "commerce-loom", label: "Booking / commerce", hint: "merch press" },
  { value: "field-guide", label: "Field guide", hint: "specimen" },
  { value: "press-atelier", label: "Press atelier", hint: "imposition" },
  { value: "lantern-path", label: "Lantern path", hint: "night walk" },
] as const;

export const GOAL_OPTIONS: readonly DesignControlOption<BusinessGoal>[] = [
  { value: "trust", label: "Trust" },
  { value: "demos", label: "Convert" },
  { value: "activation", label: "Clarify" },
  { value: "leads", label: "Leads" },
  { value: "sales", label: "Sales" },
] as const;

export const FIDELITY_OPTIONS: readonly DesignControlOption<DesignFidelity>[] = [
  { value: "wire", label: "Wire", hint: "structure first" },
  { value: "craft", label: "Craft", hint: "agency finish" },
  { value: "proof", label: "Proof", hint: "product-as-proof" },
] as const;

/** Home Lean chips: Story / Product / Ops → aestheticLean codes. */
export const LEAN_OPTIONS_COMPACT: readonly DesignControlOption<AestheticLean>[] = [
  { value: "refined-story", label: "Story" },
  { value: "conversion-sharp", label: "Product" },
  { value: "system-crafted", label: "Ops" },
] as const;

export const LEAN_OPTIONS_FULL: readonly DesignControlOption<AestheticLean>[] = [
  { value: "refined-story", label: "Story", hint: "refined-story" },
  { value: "conversion-sharp", label: "Product", hint: "conversion-sharp" },
  { value: "system-crafted", label: "Ops", hint: "system-crafted" },
  { value: "minimal-clean", label: "Minimal", hint: "minimal-clean" },
] as const;

export const MOOD_OPTIONS: readonly DesignControlOption<ColorMood>[] = [
  { value: "neutral-professional", label: "Neutral" },
  { value: "soft-brand-accent", label: "Soft accent" },
  { value: "light-airy", label: "Airy" },
  { value: "dark-premium", label: "Dark" },
] as const;

/** Compact motion set for home chip bar. */
export const MOTION_OPTIONS_COMPACT: readonly DesignControlOption<MotionLevel>[] = [
  { value: "none", label: "None" },
  { value: "light-scroll-reveals", label: "Scroll reveals" },
  { value: "subtle-micro", label: "Micro" },
] as const;

export const MOTION_OPTIONS_FULL: readonly DesignControlOption<MotionLevel>[] = [
  { value: "none", label: "None" },
  { value: "subtle-micro", label: "Micro" },
  { value: "light-scroll-reveals", label: "Scroll reveals" },
  { value: "scroll-narrative", label: "Scroll narrative" },
  { value: "immersive", label: "Immersive" },
] as const;

export const DENSITY_OPTIONS: readonly DesignControlOption<Density>[] = [
  { value: "sparse", label: "Sparse" },
  { value: "balanced", label: "Balanced" },
  { value: "information-rich", label: "Dense" },
] as const;

export const TYPE_OPTIONS: readonly DesignControlOption<TypeWeight>[] = [
  { value: "light-elegant", label: "Editorial" },
  { value: "medium-modern", label: "Product" },
  { value: "bold-confident", label: "Mono-lean" },
] as const;

export const ROUNDING_OPTIONS: readonly DesignControlOption<RoundingDepth>[] = [
  { value: "soft", label: "Soft" },
  { value: "soft-elevation", label: "Balanced" },
  { value: "sharp", label: "Sharp" },
] as const;

export const ACCENT_OPTIONS: readonly DesignControlOption<AccentToken>[] = [
  { value: "terracotta", label: "Terracotta" },
  { value: "ink", label: "Ink" },
  { value: "forest", label: "Forest" },
  { value: "ocean", label: "Ocean" },
] as const;

export const DEFAULT_DESIGN_CONTROLS: DesignControlsValue = {
  siteKind: "care-pathway",
  businessGoal: "trust",
  fidelity: "craft",
  aestheticLean: "refined-story",
  colorMood: "neutral-professional",
  motion: "light-scroll-reveals",
  density: "sparse",
  typographyWeight: "light-elegant",
  roundingDepth: "soft",
  accentToken: "terracotta",
};

export function labelForOption<T extends string>(
  options: readonly DesignControlOption<T>[],
  value: T,
  fallback?: string,
): string {
  return options.find((o) => o.value === value)?.label ?? fallback ?? value;
}

export function accentHex(token: AccentToken): string {
  return ACCENT_HEX[token];
}

/** Flatten controls into the taste + brief fields Studio /api/design already consume. */
export function designControlsToBriefFields(value: DesignControlsValue) {
  return {
    siteKind: value.siteKind,
    businessGoal: value.businessGoal,
    brandAccent: accentHex(value.accentToken),
    lockSiteKind: true as const,
    taste: {
      density: value.density,
      motion: value.motion,
      aestheticLean: value.aestheticLean,
      colorMood: value.colorMood,
      typographyWeight: value.typographyWeight,
      roundingDepth: value.roundingDepth,
    },
    /** Fidelity → craftNodes hint when Proof; Wire softens motion/density. */
    craftNodes: value.fidelity === "proof" ? (["product-proof-stage"] as string[]) : ([] as string[]),
  };
}

/** Apply Wire/Craft/Proof nudges onto a controls value (pure). */
export function applyFidelityNudges(value: DesignControlsValue): DesignControlsValue {
  if (value.fidelity === "wire") {
    return {
      ...value,
      motion: "none",
      density: value.density === "information-rich" ? "balanced" : value.density,
      aestheticLean: value.aestheticLean === "refined-story" ? "system-crafted" : value.aestheticLean,
    };
  }
  if (value.fidelity === "proof") {
    return {
      ...value,
      motion: value.motion === "none" ? "subtle-micro" : value.motion,
    };
  }
  return value;
}

export function serializeDesignControls(value: DesignControlsValue): string {
  return new URLSearchParams({
    siteKind: value.siteKind,
    goal: value.businessGoal,
    fidelity: value.fidelity,
    lean: value.aestheticLean,
    mood: value.colorMood,
    motion: value.motion,
    density: value.density,
    type: value.typographyWeight,
    rounding: value.roundingDepth,
    accent: value.accentToken,
  }).toString();
}

export function parseDesignControls(
  params: URLSearchParams | Record<string, string | null | undefined>,
  fallback: DesignControlsValue = DEFAULT_DESIGN_CONTROLS,
): DesignControlsValue {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const v = params[key];
    return v == null || v === "" ? undefined : v;
  };

  const pick = <T extends string>(
    raw: string | undefined,
    options: readonly DesignControlOption<T>[],
    current: T,
  ): T => {
    if (!raw) return current;
    const hit = options.find((o) => o.value === raw);
    return hit ? hit.value : current;
  };

  return {
    siteKind: pick(get("siteKind"), SURFACE_OPTIONS_FULL, fallback.siteKind),
    businessGoal: pick(get("goal"), GOAL_OPTIONS, fallback.businessGoal),
    fidelity: pick(get("fidelity"), FIDELITY_OPTIONS, fallback.fidelity),
    aestheticLean: pick(get("lean"), LEAN_OPTIONS_FULL, fallback.aestheticLean),
    colorMood: pick(get("mood"), MOOD_OPTIONS, fallback.colorMood),
    motion: pick(get("motion"), MOTION_OPTIONS_FULL, fallback.motion),
    density: pick(get("density"), DENSITY_OPTIONS, fallback.density),
    typographyWeight: pick(get("type"), TYPE_OPTIONS, fallback.typographyWeight),
    roundingDepth: pick(get("rounding"), ROUNDING_OPTIONS, fallback.roundingDepth),
    accentToken: pick(get("accent"), ACCENT_OPTIONS, fallback.accentToken),
  };
}

/** All user-visible option labels (for denylist tests). */
export function allDesignControlLabels(): string[] {
  const packs = [
    SURFACE_OPTIONS_FULL,
    GOAL_OPTIONS,
    FIDELITY_OPTIONS,
    LEAN_OPTIONS_FULL,
    MOOD_OPTIONS,
    MOTION_OPTIONS_FULL,
    DENSITY_OPTIONS,
    TYPE_OPTIONS,
    ROUNDING_OPTIONS,
    ACCENT_OPTIONS,
  ];
  const labels: string[] = [];
  for (const pack of packs) {
    for (const opt of pack) {
      labels.push(opt.label);
      if (opt.hint) labels.push(opt.hint);
    }
  }
  return labels;
}
