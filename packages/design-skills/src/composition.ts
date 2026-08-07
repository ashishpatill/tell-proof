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
  /*
   * Every SaaS / fintech marketing fold: short claim, then the product surface owns the screen.
   *
   * Measured premium-b2b, fintech-product, and art-directed references put roughly 0.7–1.0 of the
   * first viewport into drawn matter. Spanning is the default; lean changes type and density, not
   * whether the product appears.
   */
  if (siteKind === "saas-marketing" || siteKind === "fintech-marketing") return "hero-statement";
  // Studio folds are claim-over-figure — short brand event on a full composed surface.
  if (siteKind === "art-directed-studio") return "hero-statement";
  // Consumer craft leads with the product surface under a short voice claim.
  if (siteKind === "consumer-craft") return "hero-statement";
  // Foundry: hard vertical seam — paper claim | inverse type ladder. Not a stack or overfigure.
  if (siteKind === "editorial-foundry") return "hero-seam";
  if (siteKind === "research-dossier") return "hero-folio";
  if (lean === "minimal-clean") return "hero-statement";
  if (lean === "refined-story") return "hero-editorial";
  return "hero-split";
}

/** Feature presentation depends on how many capabilities there are and how they are ranked. */
function featureLayouts(count: number, p0: number, lean: AestheticLean): LayoutVariant[] {
  if (count <= 2) return ["feature-alternating"];
  if (lean === "minimal-clean") return count >= 6 ? ["feature-index", "feature-rows"] : ["feature-rows"];
  if (lean === "refined-story") return ["feature-alternating", "feature-index"];
  // Trailing bento left a sparse two-card airway before proof. Index/rows stay dense so the
  // specimen and proof stage can meet the reader without a light empty band above them.
  if (p0 >= 2 && count >= 4) return ["feature-alternating", "feature-index"];
  return count >= 5 ? ["feature-index", "feature-rows"] : ["feature-index"];
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
    // Index bonded to the shell — legend for the board above.
    plans.push({ id: "features", kind: "features", layout: "feature-index", surface: "paper", bond: true });
    // Quiet inverse specimen — a low-character valley between the dense shell and the dense matrix.
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "inverse" });
    plans.push({ id: "proof", kind: "proof", layout: "marquee-proof", surface: "inverse", bond: true });
    plans.push({ id: "figure", kind: "figure", layout: "figure-explainer", surface: "paper", columns: split.feature });
    /*
     * Specification + FAQ are the densest prose peak. Kept paper/raised against the inverse valley
     * above so section-weight variation is honest rather than empty-height.
     */
    plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: "raised" });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "inverse" });
    plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });
    return plans;
  }

  /*
   * Fintech marketing — inverse-heavy, bleed-dense.
   *
   * Measured fintech-product pages sit at invertedShare ~0.7 and bleedBands ~13 (medians). A SaaS
   * plan with one inverse proof band cannot make that rhythm. This offering stacks inverse metrics,
   * an inverse specimen stage, inverse proof, and inverse close around paper catalogues — tone
   * moves down the scroll the way money-product sites do.
   */
  if (siteKind === "fintech-marketing") {
    plans.push({ id: "hero", kind: "hero", layout: "hero-statement", surface: "paper", columns: split.hero });
    plans.push({ id: "metrics", kind: "metrics", layout: "metric-band", surface: "inverse" });
    plans.push({
      id: "features",
      kind: "features",
      layout: "feature-alternating",
      surface: "paper",
      columns: split.feature,
    });
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "inverse" });
    plans.push({ id: "features-2", kind: "features", layout: "feature-index", surface: "raised", bond: true });
    plans.push({
      id: "proof",
      kind: "proof",
      layout: "marquee-proof",
      surface: "inverse",
      columns: split.feature,
    });
    plans.push({
      id: "story",
      kind: "story",
      layout: "story-chapters",
      surface: "paper",
      bond: true,
      columns: split.wide,
    });
    if (featureCount >= 3) {
      plans.push({ id: "pricing", kind: "pricing", layout: "pricing-lanes", surface: "raised" });
      plans.push({ id: "compare", kind: "compare", layout: "compare-matrix", surface: "raised", bond: true });
    }
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "inverse" });
    plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });
    return plans;
  }

  /*
   * Art-directed studio — figure owns the fold; the scroll stays paper-led.
   *
   * Measured art-directed-studio pages sit at foldFigure ~1.0, figureArea ~0.57, invertedShare ~0,
   * and large display type. A SaaS plan (inverse metrics → pricing → inverse CTA) is the wrong
   * skeleton: selected work, method, and a quiet specimen beat replace the conversion ladder.
   */
  if (siteKind === "art-directed-studio") {
    plans.push({ id: "hero", kind: "hero", layout: "hero-statement", surface: "paper", columns: split.hero });
    // Capability register on raised — stakes without inventing dark-stage metrics theatre.
    plans.push({ id: "metrics", kind: "metrics", layout: "metric-band", surface: "raised" });
    plans.push({
      id: "features",
      kind: "features",
      layout: "feature-alternating",
      surface: "paper",
      columns: split.feature,
    });
    // Quiet type-led valley — honest weight variation without empty height.
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "sunken" });
    plans.push({
      id: "story",
      kind: "story",
      layout: "story-chapters",
      surface: "paper",
      bond: true,
      columns: split.wide,
    });
    plans.push({
      id: "figure",
      kind: "figure",
      layout: "figure-explainer",
      surface: "raised",
      columns: split.wide,
    });
    if (featureCount >= 4) {
      plans.push({ id: "features-2", kind: "features", layout: "feature-index", surface: "paper" });
    }
    // Proof stays lit and filled, but on raised paper — studio refs barely invert.
    plans.push({
      id: "proof",
      kind: "proof",
      layout: "marquee-proof",
      surface: "raised",
      bond: true,
      columns: split.feature,
    });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
    // One controlled inverse close for tonal range — not an inverse-heavy scroll.
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "inverse" });
    plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });
    return plans;
  }

  /*
   * Consumer craft — figure-dense product story, paper-led, short scroll.
   *
   * Measured consumer-craft pages sit at figureArea ~0.68, foldFigure ~0.73, invertedShare ~0,
   * and moderate display (~3.2vw). They show the thing often; they do not run a SaaS pricing
   * ladder or an inverse-heavy money-product stage set.
   */
  if (siteKind === "consumer-craft") {
    plans.push({ id: "hero", kind: "hero", layout: "hero-statement", surface: "paper", columns: split.hero });
    plans.push({ id: "metrics", kind: "metrics", layout: "metric-band", surface: "raised" });
    plans.push({
      id: "features",
      kind: "features",
      layout: "feature-alternating",
      surface: "paper",
      columns: split.feature,
    });
    // Quiet drawn valley — honest weight variation against the dense product registers.
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "sunken" });
    plans.push({
      id: "figure",
      kind: "figure",
      layout: "figure-explainer",
      surface: "raised",
      columns: split.wide,
    });
    plans.push({
      id: "features-2",
      kind: "features",
      layout: "feature-rows",
      surface: "paper",
      bond: true,
    });
    plans.push({
      id: "proof",
      kind: "proof",
      layout: "marquee-proof",
      surface: "raised",
      columns: split.feature,
    });
    plans.push({
      id: "story",
      kind: "story",
      layout: "story-chapters",
      surface: "paper",
      bond: true,
      columns: split.wide,
    });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "inverse" });
    plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });
    return plans;
  }

  /*
   * Editorial foundry — typography spine, hard-seam fold, paper-led scroll.
   *
   * Measured type-foundry / personal-craft / editorial-longform pages sit at foldFigure ~0.97,
   * figureArea ~0.38, invertedShare ~0, display ~3.3vw, alignment axes ~6. They are not SaaS
   * conversion ladders, studio selected-work grids, or consumer product plates: the argument is
   * the type system itself. Hard seam + type ladder + marginalia + colophon are the craft that
   * generic engines do not invent from a theme pack.
   */
  if (siteKind === "editorial-foundry") {
    plans.push({ id: "hero", kind: "hero", layout: "hero-seam", surface: "paper", columns: "1fr 1fr" });
    // Cut catalogue — indexed list on a shared rail, not metric theatre.
    plans.push({
      id: "features",
      kind: "features",
      layout: "feature-index",
      surface: "paper",
      columns: split.wide,
    });
    // Optical-size ladder as the teaching figure (foundry signature).
    plans.push({
      id: "figure",
      kind: "figure",
      layout: "figure-explainer",
      surface: "raised",
      columns: split.wide,
    });
    // Quiet sunken valley — honest weight variation without empty height.
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "sunken" });
    // Marginalia essay — annotations hang in the outer column (editorial-longform craft).
    plans.push({
      id: "story",
      kind: "story",
      layout: "story-marginalia",
      surface: "paper",
      bond: true,
      columns: "7fr 5fr",
    });
    if (featureCount >= 4) {
      plans.push({
        id: "features-2",
        kind: "features",
        layout: "feature-alternating",
        surface: "paper",
        columns: split.feature,
      });
    }
    // Proof stays on raised paper — foundry refs barely invert.
    plans.push({
      id: "proof",
      kind: "proof",
      layout: "marquee-proof",
      surface: "raised",
      bond: true,
      columns: split.feature,
    });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
    // Colophon close on paper — not inverse demo-booking theatre.
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "paper" });
    plans.push({ id: "footer", kind: "footer", layout: "footer-columns", surface: "paper" });
    return plans;
  }

  /*
   * Research dossier — capital briefing / research-editorial craft.
   *
   * Measured capital-brand + research-editorial + editorial-brand pages sit at high alignment
   * axes (~6–8), strong spine conformity, quiet display, and dense bleed rhythm — not SaaS
   * conversion ladders, foundry seams, or studio selected-work grids. Folio masthead + dossier
   * plate + chapter rail + verso/recto footnotes + imprint are the craft a theme pack will not
   * invent from taste controls.
   */
  if (siteKind === "research-dossier") {
    plans.push({ id: "hero", kind: "hero", layout: "hero-folio", surface: "paper", columns: split.wide });
    // Briefing index — catalog of instruments, not metric theatre.
    plans.push({
      id: "features",
      kind: "features",
      layout: "feature-index",
      surface: "paper",
      columns: split.wide,
    });
    // Teaching figure: the dossier plate redrawn with pin callouts (body slot).
    plans.push({
      id: "figure",
      kind: "figure",
      layout: "figure-explainer",
      surface: "raised",
      columns: split.wide,
    });
    // Quiet sunken valley — third surface + honest weight variation.
    plans.push({ id: "specimen", kind: "specimen", layout: "specimen-band", surface: "sunken" });
    // Verso/recto spread with footnote register (dossier signature essay).
    plans.push({
      id: "story",
      kind: "story",
      layout: "story-spread",
      surface: "paper",
      bond: true,
      columns: "1fr 1fr",
    });
    if (featureCount >= 4) {
      plans.push({
        id: "features-2",
        kind: "features",
        layout: "feature-rows",
        surface: "paper",
        columns: split.wide,
      });
    }
    // Proof on raised paper — capital/research refs rarely flood inverse.
    plans.push({
      id: "proof",
      kind: "proof",
      layout: "marquee-proof",
      surface: "raised",
      bond: true,
      columns: split.feature,
    });
    plans.push({ id: "faq", kind: "faq", layout: "faq-columns", surface: "paper", columns: "5fr 7fr", bond: true });
    // Imprint close on paper — not inverse demo theatre.
    plans.push({ id: "cta", kind: "cta", layout: "cta-band", surface: "paper" });
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
    // Dense proof board on inverse — never a lonely quote floating in a dark void.
    // Bonded to the specimen above so a light airway cannot open between drawn product and proof.
    plans.push({
      id: "proof",
      kind: "proof",
      layout: "marquee-proof",
      surface: "inverse",
      bond: true,
      columns: split.feature,
    });
  }

  plans.push({
    id: "story",
    kind: "story",
    layout: "story-chapters",
    // Raised after inverse proof so the sequence lands as a lit register, not another paper void.
    surface: "raised",
    bond: true,
    columns: split.wide,
  });

  // Fintech / studio / consumer return earlier — only SaaS reaches this pricing branch.
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
  if (siteKind === "fintech-marketing") px = 70;
  // Studio stack fold: display stays an event, but short enough that the labeled figure enters the fold.
  if (siteKind === "art-directed-studio") px = 66;
  // Consumer craft speaks in a shorter voice — product owns the fold, not a 90px headline.
  if (siteKind === "consumer-craft") px = 56;
  // Foundry display is restrained (~3.3vw / ~48px) — the ladder and seam own the fold, not a shout.
  if (siteKind === "editorial-foundry") px = 48;
  // Quiet display — capital/research editorial refs sit ~1.2–3.5vw, not SaaS shout.
  // Floor at band p10 (3.16vw @1440 ≈ 45.5px); 48 keeps room without shouting.
  if (siteKind === "research-dossier") px = 48;
  if (lean === "refined-story") px += 6;
  if (lean === "minimal-clean") px -= 6;
  if (lean === "conversion-sharp") px += 2;
  if (density === "information-rich") px -= 6;
  if (density === "sparse") px += 4;
  // Foundry clamps to the low corridor; studio may sit slightly above the general ceiling.
  if (siteKind === "editorial-foundry") return Math.max(44, Math.min(54, px));
  if (siteKind === "research-dossier") return Math.max(46, Math.min(54, px));
  const ceiling = siteKind === "art-directed-studio" ? 88 : 86;
  return Math.max(48, Math.min(ceiling, px));
}

/** Body size — corpus median 16px, with denser surfaces running smaller. */
export function bodySizeFor(density: Density, siteKind: SiteKind): number {
  // Dashboard still needs a readable prose measure on the claim/FAQ screens; 14px in a mid
  // column was reading as a 34ch body voice against a 44ch floor.
  if (siteKind === "dashboard-webapp") return density === "information-rich" ? 15 : 16;
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
