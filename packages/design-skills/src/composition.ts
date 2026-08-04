/**
 * Composition — what sections exist, in what order, on which surface, in which layout.
 *
 * This is where art direction lives. Two briefs that route to the same site kind should still
 * produce visibly different pages, because the section plan responds to how many capabilities were
 * declared, how they are prioritised, and what the business goal is.
 *
 * Measured corridors this targets (docs/10_DESIGN_EVIDENCE.md):
 *  - page height 6.65–12.9 viewports → the argument needs 8–11 real sections, not 5 stubs
 *  - ≥ 16 headings → every section names its parts
 *  - section density variation 0.54–1.14 → bands must differ in weight, so layouts must differ
 *  - asymmetric grid share ≥ 0.08 → split layouts use unequal columns on purpose
 *  - ≥ 4 surface levels in play → surfaces alternate rather than sitting flat
 */
import type { AestheticLean, Density, LayoutVariant, SiteKind, SurfaceLevel } from "./types";

export interface SectionPlan {
  id: string;
  kind:
    | "nav"
    | "hero"
    | "metrics"
    | "features"
    | "figure"
    | "story"
    | "proof"
    | "pricing"
    | "compare"
    | "faq"
    | "cta"
    | "footer"
    | "app";
  layout: LayoutVariant;
  surface: SurfaceLevel;
  columns?: string;
}

export interface CompositionInput {
  siteKind: SiteKind;
  lean: AestheticLean;
  density: Density;
  featureCount: number;
  p0Count: number;
  goal: "leads" | "demos" | "trust" | "sales" | "activation";
}

/**
 * Column ratios per lean. Equal columns everywhere is the single clearest template signature, so
 * every split layout in the system carries an intentional imbalance.
 */
const SPLIT: Record<AestheticLean, { hero: string; feature: string; wide: string }> = {
  "minimal-clean": { hero: "6fr 4fr", feature: "5fr 7fr", wide: "3fr 9fr" },
  "conversion-sharp": { hero: "7fr 5fr", feature: "6fr 6fr", wide: "8fr 4fr" },
  "system-crafted": { hero: "8fr 4fr", feature: "7fr 5fr", wide: "5fr 7fr" },
  "refined-story": { hero: "9fr 3fr", feature: "4fr 8fr", wide: "2fr 10fr" },
};

function heroLayout(siteKind: SiteKind, lean: AestheticLean): LayoutVariant {
  if (siteKind === "corporate-story") return lean === "conversion-sharp" ? "hero-editorial" : "hero-statement";
  if (siteKind === "docs-educational") return "hero-editorial";
  if (lean === "minimal-clean") return "hero-statement";
  if (lean === "refined-story") return "hero-editorial";
  return "hero-split";
}

/** Feature presentation depends on how many capabilities there are and how they are ranked. */
function featureLayouts(count: number, p0: number, lean: AestheticLean): LayoutVariant[] {
  if (count <= 2) return ["feature-alternating"];
  if (lean === "minimal-clean") return count >= 6 ? ["feature-index", "feature-rows"] : ["feature-rows"];
  if (lean === "refined-story") return ["feature-alternating", "feature-index"];
  if (p0 >= 2 && count >= 4) return ["feature-alternating", "feature-bento"];
  return count >= 5 ? ["feature-bento", "feature-rows"] : ["feature-bento"];
}

export function planSections(input: CompositionInput): SectionPlan[] {
  const { siteKind, lean, featureCount, p0Count, goal, density } = input;
  const split = SPLIT[lean];
  const plans: SectionPlan[] = [];

  plans.push({ id: "nav", kind: "nav", layout: "nav", surface: "paper" });

  if (siteKind === "dashboard-webapp") {
    plans.push({ id: "app", kind: "app", layout: "app-shell", surface: "paper", columns: "260px 1fr" });
    plans.push({ id: "metrics", kind: "metrics", layout: "metric-band", surface: "raised" });
    plans.push({ id: "features", kind: "features", layout: "feature-index", surface: "paper" });
    plans.push({ id: "figure", kind: "figure", layout: "figure-explainer", surface: "sunken", columns: split.feature });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr" });
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "inverse" });
    plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });
    return plans;
  }

  plans.push({ id: "hero", kind: "hero", layout: heroLayout(siteKind, lean), surface: "paper", columns: split.hero });

  // A metric band immediately after the fold is how premium pages state the stakes without
  // asking the reader to scroll through the whole argument first.
  if (siteKind !== "docs-educational" || density !== "sparse") {
    plans.push({ id: "metrics", kind: "metrics", layout: "metric-band", surface: lean === "refined-story" ? "raised" : "inverse" });
  }

  if (siteKind === "docs-educational") {
    plans.push({ id: "figure", kind: "figure", layout: "figure-explainer", surface: "raised", columns: split.wide });
  }

  const featureVariants = featureLayouts(featureCount, p0Count, lean);
  featureVariants.forEach((layout, i) => {
    plans.push({
      id: i === 0 ? "features" : `features-${i + 1}`,
      kind: "features",
      layout,
      surface: i === 0 ? "paper" : "raised",
      columns: layout === "feature-alternating" ? split.feature : undefined,
    });
  });

  if (siteKind !== "docs-educational") {
    plans.push({ id: "proof", kind: "proof", layout: "pullquote", surface: lean === "refined-story" ? "inverse" : "sunken" });
  }

  plans.push({
    id: "story",
    kind: "story",
    layout: "story-chapters",
    surface: siteKind === "corporate-story" ? "paper" : "paper",
    columns: split.wide,
  });

  if (siteKind === "saas-marketing" && featureCount >= 3) {
    if (goal === "sales" || goal === "leads" || goal === "demos") {
      plans.push({ id: "pricing", kind: "pricing", layout: "pricing-lanes", surface: "raised" });
    }
    plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: "paper" });
  }

  if (siteKind === "corporate-story" || siteKind === "docs-educational") {
    plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: "raised" });
  }

  plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr" });
  plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "inverse" });
  plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });

  return plans;
}

/**
 * Display size in px at 1440, chosen per site kind and lean.
 * Corpus corridor: 3.19–6.11 % of viewport width, i.e. roughly 46–88px at this width.
 */
export function displaySizeFor(siteKind: SiteKind, lean: AestheticLean, density: Density): number {
  let px = 68;
  if (siteKind === "corporate-story") px = 78;
  if (siteKind === "docs-educational") px = 60;
  if (siteKind === "dashboard-webapp") px = 52;
  if (lean === "refined-story") px += 6;
  if (lean === "minimal-clean") px -= 6;
  if (lean === "conversion-sharp") px += 2;
  if (density === "information-rich") px -= 6;
  if (density === "sparse") px += 4;
  // Keep both ends of the measured corridor in view (46–88px at 1440).
  return Math.max(48, Math.min(86, px));
}

/** Body size — corpus median 16px, with denser surfaces running smaller. */
export function bodySizeFor(density: Density, siteKind: SiteKind): number {
  if (siteKind === "dashboard-webapp") return density === "information-rich" ? 14 : 15;
  if (density === "information-rich") return 16;
  if (density === "sparse") return 18;
  return 17;
}

/** Modular ratio between the large steps of the type ladder. */
export function typeRatioFor(lean: AestheticLean, density: Density): number {
  if (lean === "refined-story") return 1.5;
  if (lean === "minimal-clean") return 1.32;
  if (density === "information-rich") return 1.3;
  return 1.414;
}
