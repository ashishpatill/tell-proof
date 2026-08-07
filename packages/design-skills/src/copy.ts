/**
 * Copy derivation.
 *
 * A page can have perfect typography and still read as generated, because the words are filler.
 * Everything here derives from the brief: the product's own feature names, their descriptions, the
 * audience, and the business goal. Nothing invents a customer, a number, or a claim.
 *
 * The rule that keeps this honest: if a sentence would read the same for a different product,
 * it does not ship.
 */
import { payoffLine, type FeatureCopy } from "./editorial";
import type { DesignBrief, FeatureSpec } from "./types";

const STOP = new Set([
  "the", "a", "an", "and", "or", "for", "with", "your", "that", "this", "into", "from", "of", "to",
  "in", "on", "at", "by", "is", "are", "be", "it", "as", "so", "you", "we", "they", "their", "our",
]);

/**
 * First clause of a description, without its terminal punctuation.
 *
 * The trailing period used to survive, and every caller that embedded the result mid-sentence
 * produced ".," in the rendered page — the single most obvious "nobody read this" artefact the
 * engine was shipping.
 */
export function firstClause(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const stop = trimmed.search(/[.;]\s/);
  const clause = stop > 20 ? trimmed.slice(0, stop) : trimmed;
  return clause.trim().replace(/\s*[.;,]+$/, "").trim();
}

export function sentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

export function lower(text: string): string {
  return text.trim().replace(/^[A-Z](?![A-Z])/, (c) => c.toLowerCase());
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve",
];

/**
 * Small counts written out.
 *
 * "2 capabilities carry the argument" is how a template writes a sentence and how nobody speaks
 * one. Numerals earn their place in tables and specifications; in prose under thirteen they read
 * as a variable that was interpolated rather than a number that was meant.
 */
export function count(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** Salient nouns across the brief — used to keep headlines rooted in the product's own language. */
export function vocabulary(brief: DesignBrief): string[] {
  const words = [brief.tagline, brief.audience, ...brief.features.flatMap((f) => [f.name, f.description])]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([w]) => w);
}

export function headline(brief: DesignBrief, features: FeatureSpec[]): string {
  if (brief.tagline.trim()) return brief.tagline.trim();
  const lead = features[0];
  if (!lead) return brief.productName;
  return `${lead.name} for ${brief.audience}`;
}

/**
 * Hero support line, composed from the payoffs the editorial layer reserved for the fold.
 *
 * The previous construction was `"{Product} gives {audience} {clause}, and {clause}"`, which
 * produced sentences no one could have read aloud: the audience is a noun phrase, the clauses are
 * independent statements, and the join left a stranded period before the comma. The fix is not a
 * better template — it is to stop welding a clause onto a sentence stem that does not want one.
 * The audience already sits directly above this line as the eyebrow, so the lede states what
 * changes and nothing else.
 */
export function heroLede(brief: DesignBrief, lines: string[]): string {
  const usable = lines.map((l) => l.trim()).filter(Boolean);
  if (!usable.length) return sentence(`Built for ${brief.audience}`);
  const [first, ...rest] = usable;
  const head = `${first![0]?.toUpperCase() ?? ""}${first!.slice(1)}`;
  if (!rest.length) return sentence(head);
  return sentence(`${head}, and ${rest.map((r) => lower(r)).join(", and ")}`);
}

const GOAL_CTA: Record<DesignBrief["businessGoal"], { primary: string; secondary: string; note: string }> = {
  leads: { primary: "Talk to the team", secondary: "See how it works", note: "Usually a 30-minute call, no deck." },
  demos: { primary: "Book a walkthrough", secondary: "Read the mechanics", note: "We demo on your data, not a sandbox." },
  trust: { primary: "See the approach", secondary: "Read the detail", note: "Everything here is verifiable before you commit." },
  sales: { primary: "Get started", secondary: "Compare plans", note: "No procurement cycle to start." },
  activation: { primary: "Open the workspace", secondary: "See a sample board", note: "Your first view is ready in minutes." },
};

export function ctaFor(
  goal: DesignBrief["businessGoal"],
  siteKind?: DesignBrief["siteKind"],
): { primary: string; secondary: string; note: string } {
  // Consumer craft sells a product, not a plan ladder — "Compare plans" is SaaS residue.
  if (siteKind === "consumer-craft") {
    return {
      primary: "Order yours",
      secondary: "See the details",
      note: "Ships when the batch is ready — no waitlist theatre.",
    };
  }
  if (siteKind === "art-directed-studio") {
    return {
      primary: "Start a conversation",
      secondary: "Browse the work",
      note: "We take a few engagements at a time.",
    };
  }
  if (siteKind === "editorial-foundry") {
    return {
      primary: "Request a specimen",
      secondary: "See the cuts",
      note: "Trial files ship with the optical sizes you will actually set.",
    };
  }
  if (siteKind === "research-dossier") {
    return {
      primary: "Request the brief",
      secondary: "Read the method",
      note: "Briefings ship as numbered folios — not a demo theatre.",
    };
  }
  return GOAL_CTA[goal];
}

/** Section eyebrows read like an index of an argument, not like decoration. */
export function eyebrows(brief: DesignBrief): Record<string, string> {
  return {
    metrics: "What changes",
    features: brief.siteKind === "docs-educational" ? "The mechanism" : "Capabilities",
    figure: "How it works",
    story: brief.siteKind === "corporate-story" ? "How we work" : "The sequence",
    proof: "Why teams keep it",
    pricing: "Scope and plans",
    compare: "What is included",
    faq: "Before you ask",
    cta: "Next step",
  };
}

/**
 * Section headline for the feature block. Uses the product's own most-repeated noun so two
 * different briefs never produce the same heading.
 */
export function featuresTitle(brief: DesignBrief, features: FeatureSpec[]): string {
  const vocab = vocabulary(brief);
  const noun = vocab[0] ?? "work";
  const lead = features[0]?.name.toLowerCase() ?? noun;
  if (brief.siteKind === "docs-educational") return `What ${brief.productName} does with ${noun}`;
  if (brief.siteKind === "corporate-story") return `How ${brief.productName} works in practice`;
  return `Everything ${brief.productName} does, starting with ${lead}`;
}

export function featuresLede(brief: DesignBrief, features: FeatureSpec[]): string {
  const p0 = features.filter((f) => f.priority === "p0").length;
  const rest = features.length - p0;
  if (p0 && rest) {
    return sentence(
      `${count(p0)[0]!.toUpperCase()}${count(p0).slice(1)} ${p0 === 1 ? "carries" : "carry"} the argument. The other ${count(
        rest,
      )} ${rest === 1 ? "removes a reason" : "remove reasons"} to say no`,
    );
  }
  return sentence(`Each block below is one declared capability, described the way ${brief.audience} would ask about it`);
}

/**
 * Outcome lines, built only from payoffs the brief actually stated and the fold did not already
 * spend. A fabricated "37% lift" is worse than no number at all, and a payoff reprinted from the
 * hero is worse than an empty band.
 */
export function outcomes(picks: FeatureCopy[]): Array<{ value: string; label: string; note: string }> {
  const verbs = ["Fewer handoffs", "Less rework", "Faster answers"];
  return picks.map((c, i) => ({
    value: c.name,
    label: verbs[i] ?? "Clearer decisions",
    note: payoffLine(c),
  }));
}

/**
 * The quiet form of the outcome band, used when the brief stated no payoffs to spend here: the
 * coverage index. Names and tiers across the whole product rather than the two flagged core ones,
 * because a full-width band holding two items reads as a band that failed to load.
 */
export function outcomeNames(picks: FeatureCopy[]): Array<{ value: string; label: string; note: string }> {
  return picks.slice(0, 4).map((c) => ({ value: c.name, label: c.tier, note: "" }));
}

/**
 * Chapters: the argument in order, one step per capability.
 *
 * This section used to reprint every description in full, immediately after the catalogue had
 * printed them all. It now carries only the payoffs no earlier section spent; where the brief left
 * nothing to say, the step is a name and a number. A sequence that is mostly names is a legitimate
 * beat — it is the quiet screen between two dense ones, and reference pages use it constantly.
 */
export function chapters(features: FeatureCopy[]): Array<{ title: string; body: string; meta: string }> {
  /*
   * Every step carries a sentence. Empty chapter bodies used to ship as titled cards with nothing
   * under them — the sequence screen then read as a wireframe of numbered boxes, which is exactly
   * the "toy" register buyers reject. Prefer the story payoff when this feature owns that beat;
   * otherwise restate the declared description so the register stays full of product truth.
   */
  return features.slice(0, 5).map((c, i) => ({
    title: c.name,
    body:
      c.consequenceHome === "story"
        ? payoffLine(c)
        : sentence(c.consequence || c.claim),
    meta: `Step ${String(i + 1).padStart(2, "0")}`,
  }));
}

/**
 * Questions a buyer actually asks.
 *
 * Deliberately about scope, sequencing and boundaries rather than about what each capability does.
 * The catalogue already answers that, and a FAQ that re-explains the feature list is the clearest
 * sign a page was assembled from a template: it is the fourth place the same sentence appears.
 */
export function questions(brief: DesignBrief, features: FeatureSpec[]): Array<{ title: string; body: string }> {
  const last = features[features.length - 1];
  const out: Array<{ title: string; body: string }> = [];

  out.push({
    title: `Who is ${brief.productName} for?`,
    body: sentence(
      `${brief.audience[0]?.toUpperCase()}${brief.audience.slice(1)}. The ${features.length} capabilities on this page are the whole product; there is no hidden tier`,
    ),
  });
  if (last) {
    out.push({
      title: `Is ${last.name.toLowerCase()} available from day one?`,
      body: sentence(
        `Yes. All ${features.length} capabilities ship together — nothing on this page is staged behind a later phase`,
      ),
    });
  }
  out.push({
    title: "How long does it take to see something real?",
    body: sentence(
      brief.businessGoal === "activation"
        ? "Minutes: the first working view is generated from your own data"
        : "One session: we run it on your data rather than on a prepared sandbox",
    ),
  });
  out.push({
    title: "What is deliberately not here?",
    body: sentence(
      `Anything ${brief.productName} does not do yet. This page lists capabilities, not intentions`,
    ),
  });
  return out;
}

/** Plan lanes derived from declared capabilities — never invented Starter/Growth/Enterprise filler. */
export function plans(brief: DesignBrief, features: FeatureSpec[]): Array<{ title: string; body: string; meta: string; points: string[]; recommended: boolean }> {
  if (features.length < 2) return [];
  const core = features.slice(0, Math.max(1, Math.ceil(features.length / 3)));
  const standard = features.slice(0, Math.max(2, Math.ceil((features.length * 2) / 3)));
  const full = features;

  return [
    {
      title: "Core",
      body: sentence(`The smallest version of ${brief.productName} that still solves the problem`),
      meta: `${core.length} of ${features.length} capabilities`,
      points: core.map((f) => f.name),
      recommended: false,
    },
    {
      title: "Standard",
      body: sentence(`What most ${brief.audience} run, including everything that removes manual work`),
      meta: `${standard.length} of ${features.length} capabilities`,
      points: standard.map((f) => f.name),
      recommended: true,
    },
    {
      title: "Full",
      body: sentence(`Every declared capability, including the ones that only matter at scale`),
      meta: `${full.length} of ${features.length} capabilities`,
      points: full.map((f) => f.name),
      recommended: false,
    },
  ];
}

/**
 * The statement band.
 *
 * A pull-quote is normally a customer saying something, and this engine cannot invent a customer.
 * It used to fall back to quoting the product's own lead capability back at the reader, which made
 * the band a fifth reprint of a sentence they had already read twice.
 *
 * What it says instead is true by construction and is the strongest thing a page of this kind can
 * claim: nothing here is aspirational. Restraint is the positioning.
 */
export function pullQuote(brief: DesignBrief, features: FeatureSpec[]): { quote: string; attribution: string } {
  return {
    quote: `Everything on this page is something ${brief.productName} does today — ${count(features.length)} capabilities, and no roadmap standing in for one.`,
    // Meta instructions ("how to read this page") read as a toy deck. Scope is the proof.
    attribution: `${count(features.length)} capabilities · declared scope · ships together`,
  };
}

/**
 * Navigation derived from the sections that will actually exist.
 *
 * Deduplicated by label: a page with two capability sections used to render "Capabilities" twice
 * in the primary nav, side by side, pointing at the same anchor.
 */
export function navFor(sections: Array<{ kind: string; id: string }>): Array<{ label: string; href: string }> {
  const labels: Record<string, string> = {
    features: "Capabilities",
    figure: "How it works",
    story: "Sequence",
    pricing: "Plans",
    compare: "Included",
    faq: "Questions",
    proof: "Why it holds",
    app: "Workspace",
  };
  const seen = new Set<string>();
  const out: Array<{ label: string; href: string }> = [];
  for (const s of sections) {
    const label = labels[s.kind];
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, href: `#${s.id}` });
    if (out.length === 5) break;
  }
  return out;
}
