/**
 * Editorial allocation — decide where each thing gets said, and say it only there.
 *
 * The engine used to hand the same feature list to every section that could take one. A five
 * capability brief produced a page where each description appeared six or seven times: once in the
 * hero strip, once in the outcome band, once in the capability catalogue, once beside the figure,
 * once as a story chapter, once in the comparison matrix, once in the pull-quote support. Every
 * individual section looked defensible. The page read as filler, because a reader who has met
 * "reconciliations run every night" three times has learned that the page has nothing else to say.
 *
 * Reference pages do the opposite. A capability is introduced once, at full strength, in the place
 * where it lands hardest, and every later appearance is a shorter, differently-shaped reference —
 * a name in a matrix, a step label on a diagram, a line in a footer. That asymmetry is most of what
 * separates an authored page from an assembled one, and no typographic metric can see it.
 *
 * So the copy for a feature is split into parts that are allowed to appear in different places:
 *
 *   claim        the mechanism — what the product does
 *   consequence  the payoff the brief itself stated — what stops happening
 *   name         a proper noun, free to repeat
 *
 * Each part is spent by exactly one section. `claim` belongs to the capability catalogue, because
 * that is the section a reader scans to answer "does it do X". `consequence` belongs to whichever
 * outcome-shaped section claims the feature first. Sections that need to gesture at a capability
 * without re-explaining it get the name alone.
 */
import type { FeatureSpec } from "./types";

/** Where a feature's stated payoff is allowed to be spent. */
export type ConsequenceHome = "hero" | "metrics" | "story" | "none";

export interface FeatureCopy {
  id: string;
  name: string;
  priority: FeatureSpec["priority"];
  /** The mechanism clause. Always a complete phrase — never cut mid-word. */
  claim: string;
  /** The payoff clause the brief stated, or "" when it stated none. Never invented. */
  consequence: string;
  /** Tier word for matrices and kickers. */
  tier: string;
  /** The section allowed to print `consequence`. */
  consequenceHome: ConsequenceHome;
}

export interface Editorial {
  features: FeatureCopy[];
  /** The one or two lines the fold is allowed to make. Nothing below the fold repeats them. */
  heroLines: string[];
  /** Features whose payoff the outcome band may print, in order. */
  outcomeFeatures: FeatureCopy[];
  /** Features whose payoff the sequence section may print, in order. */
  sequenceFeatures: FeatureCopy[];
  /**
   * True when the brief stated payoffs for enough capabilities to make an outcome band honest.
   * When false the band still runs, but as names and tiers only — a tighter, quieter beat rather
   * than three paragraphs of invented benefit.
   */
  outcomesAreStated: boolean;
}

/**
 * Patterns that separate a mechanism from its payoff in a single declarative sentence. These are
 * the joins people actually write in feature descriptions; anything more elaborate is left whole
 * rather than guessed at, because a bad split reads worse than no split.
 *
 * Strong joins announce a consequence and effectively cannot appear inside a list, so a short
 * mechanism ahead of one is still a real split — "We buy to keep, so the plan is measured in
 * decades" is exactly the sentence this exists to take apart. The weak join is a bare relative
 * pronoun, which does turn up mid-list, so it needs a longer run-up before it is believed.
 */
const STRONG_JOIN = /(?:,|;)\s+(?:so that|so|which means|and stops?)\s+/i;
const WEAK_JOIN = /(?:,|;)\s+which\s+/i;

/** Trailing sentence punctuation, removed so clauses can be recomposed without producing ".," */
function stripTerminal(text: string): string {
  return text.trim().replace(/\s*[.;,]+$/, "").trim();
}

function lowerFirst(text: string): string {
  return text.replace(/^[A-Z](?![A-Z])/, (c) => c.toLowerCase());
}

function tierWord(priority: FeatureSpec["priority"]): string {
  return priority === "p0" ? "Core" : priority === "p1" ? "Included" : "At scale";
}

/**
 * Split a description into mechanism and payoff.
 *
 * A description with no recognised join is all mechanism. That is the honest reading: the brief
 * described what the thing does and did not claim an outcome, and the page should not invent one.
 */
export function splitDescription(description: string): { claim: string; consequence: string } {
  const text = description.trim();
  if (!text) return { claim: "", consequence: "" };

  for (const [pattern, minLeft] of [
    [STRONG_JOIN, 10],
    [WEAK_JOIN, 24],
  ] as const) {
    const match = pattern.exec(text);
    // A join too close to either end is punctuation, not structure — "Terms, limits, and balance
    // visible on the order screen" should stay one clause.
    if (match && match.index >= minLeft && text.length - (match.index + match[0].length) > 16) {
      return {
        claim: stripTerminal(text.slice(0, match.index)),
        consequence: stripTerminal(text.slice(match.index + match[0].length)),
      };
    }
  }
  return { claim: stripTerminal(text), consequence: "" };
}

/**
 * Allocate the copy budget across sections.
 *
 * The fold is served first, because it is the only part of the page most readers see and it should
 * get the strongest material the brief contains — a stated payoff where there is one. Whatever the
 * fold does not spend funds the outcome band, and whatever survives that funds the sequence
 * section, so no two sections ever print the same line.
 *
 * The capability catalogue is deliberately outside this competition. It prints every mechanism,
 * because it is the section a reader scans to answer "does it do X", and an incomplete catalogue
 * is a worse failure than a sentence appearing twice.
 */
export function editorialize(features: FeatureSpec[], heroSlots = 2): Editorial {
  const copies: FeatureCopy[] = features.map((f) => {
    const { claim, consequence } = splitDescription(f.description);
    return {
      id: f.id,
      name: f.name,
      priority: f.priority,
      claim: claim || f.name,
      consequence,
      tier: tierWord(f.priority),
      consequenceHome: "none" as ConsequenceHome,
    };
  });

  const heroLines: string[] = [];
  for (const c of copies.slice(0, Math.max(0, heroSlots))) {
    if (!c.consequence) continue;
    c.consequenceHome = "hero";
    heroLines.push(c.consequence);
  }
  // A brief that stated no payoffs at all still needs a fold. Fall back to the lead mechanism,
  // which the catalogue will also carry — one honest repetition rather than an invented promise.
  if (!heroLines.length && copies[0]) heroLines.push(copies[0].claim);

  const unspent = copies.filter((c) => c.consequence && c.consequenceHome === "none");
  const outcomeFeatures = unspent.slice(0, 3);
  for (const c of outcomeFeatures) c.consequenceHome = "metrics";

  const sequenceFeatures = unspent.slice(3);
  for (const c of sequenceFeatures) c.consequenceHome = "story";

  return {
    features: copies,
    heroLines,
    outcomeFeatures,
    sequenceFeatures,
    outcomesAreStated: outcomeFeatures.length >= 2,
  };
}

/**
 * The full sentence for a capability in its home section: mechanism, then the payoff if this
 * feature's payoff was not already spent above the fold.
 */
export function catalogueBody(c: FeatureCopy): string {
  const claim = c.claim;
  if (!claim) return "";
  if (c.consequence && c.consequenceHome === "none") {
    return `${claim}, so ${lowerFirst(c.consequence)}.`;
  }
  return `${claim}.`;
}

/** The payoff as a standalone line, for whichever section owns it. */
export function payoffLine(c: FeatureCopy): string {
  if (!c.consequence) return "";
  const t = c.consequence;
  return `${t[0]?.toUpperCase() ?? ""}${t.slice(1)}.`;
}
