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
    | "specimen"
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
  /**
   * This section continues the previous one's subject rather than changing it.
   *
   * Every section here used to get the same break above it, which is why a page of twelve
   * defensible sections read as twelve sections: each one took a screen, and each screen carried
   * about the same weight as the one before it. Measured, reference pages of the same overall
   * volume put roughly twice their average weight into one screen and a fifth of it into another —
   * the spread is the rhythm, and it does not come from writing more, it comes from deciding which
   * things belong on a screen together.
   *
   * A bonded section keeps the surface it inherits and drops the break, so a plan row and the table
   * that details it arrive as one chapter with two movements instead of two chapters that happen to
   * be about the same thing.
   */
  bond?: boolean;
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
/*
 * The `wide` ratio feeds layouts whose narrow track holds a section introduction, so it cannot be
 * arbitrarily extreme. At `2fr 10fr` inside a 940px container that track is 170px, which sets a
 * heading one word per line and runs its lede at sixteen characters. Asymmetry is still the point;
 * it just has to leave a readable column behind.
 */
/*
 * Hero ratios are stated from the copy's side. On a split fold the second track holds the product
 * surface, and a quarter of the screen is not enough to show one — the drawing scales down until
 * its own labels are under seven pixels, which is how a fold ends up describing a product instead
 * of showing it. Measured reference folds are between a third and all drawn matter, so the figure
 * track gets at least four twelfths wherever a split fold is chosen.
 */
const SPLIT: Record<AestheticLean, { hero: string; feature: string; wide: string }> = {
  "minimal-clean": { hero: "6fr 5fr", feature: "5fr 7fr", wide: "4fr 8fr" },
  // Conversion fold gives the figure the majority — the product has to be visible above the fold,
  // and a copy column at five twelfths still holds a 16rem floor so the headline does not collapse.
  "conversion-sharp": { hero: "5fr 7fr", feature: "5fr 7fr", wide: "7fr 5fr" },
  "system-crafted": { hero: "7fr 5fr", feature: "7fr 5fr", wide: "5fr 7fr" },
  "refined-story": { hero: "7fr 4fr", feature: "4fr 8fr", wide: "4fr 8fr" },
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
    /*
     * A product surface still opens with a claim. Leading straight into the application shell was
     * the engine's worst-scoring composition: the fold filled with navigation affordances instead
     * of a decision, the largest type on the page was a table header, and the whole document came
     * in under five viewports. The interface is the proof, so it arrives second.
     */
    plans.push({ id: "hero", kind: "hero", layout: "hero-statement", surface: "paper", columns: split.hero });
    plans.push({ id: "metrics", kind: "metrics", layout: "metric-band", surface: "inverse" });
    plans.push({ id: "app", kind: "app", layout: "app-shell", surface: "paper", columns: "260px 1fr" });
    // The index is the legend for the surface above it. On its own screen it read as a second
    // feature list; bonded, the reader sees the board and what is on the board at once.
    plans.push({ id: "features", kind: "features", layout: "feature-index", surface: "paper", bond: true });
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "sunken" });
    // The quiet beat sits between the drawn specimen and the specification table — a valley the
    // denser screens on either side are measured against. At the end of the page it was only a
    // soft landing into the FAQ, and every strip of the document weighed the same.
    plans.push({ id: "proof", kind: "proof", layout: "pullquote", surface: "sunken" });
    plans.push({ id: "figure", kind: "figure", layout: "figure-explainer", surface: "paper", columns: split.feature });
    /*
     * A product page still has to answer "what do I get". The specification table is also the one
     * genuinely dense screen a webapp page has; without it every band from the interface down
     * carries the same weight, which is the rhythm a reader reads as generated.
     */
    plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: "raised" });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
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
    /*
     * A drawn screen between the catalogue and whatever follows it.
     *
     * Reference pages put a beat here: something that reaches the edges of the screen, carries one
     * line of text, and separates two dense screens so both read as dense. Without it every band on
     * the page weighs the same, which is the structural signature this engine was measured against
     * and lost on.
     */
    if (i === 0) {
      plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "sunken" });
    }
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
    const lanes = goal === "sales" || goal === "leads" || goal === "demos";
    if (lanes) plans.push({ id: "pricing", kind: "pricing", layout: "pricing-lanes", surface: "raised" });
    // The matrix is what the lanes mean, not a second subject. Bonded, the two arrive as the one
    // screen a reader compares on; separated, they were two screens asking the same question twice.
    plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: lanes ? "raised" : "paper", bond: lanes });
  }

  if (siteKind === "corporate-story" || siteKind === "docs-educational") {
    plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: "raised" });
  }

  // FAQ answers the table above it. Bonded, the compare+faq pair is the densest beat on the page —
  // the peak the quiet statement band is measured against. Separated, both were medium screens and
  // the rhythm flattened.
  plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
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
  if (siteKind === "dashboard-webapp") px = 62;
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
