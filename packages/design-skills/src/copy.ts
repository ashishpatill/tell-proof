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
import type { DesignBrief, FeatureSpec } from "./types";

const STOP = new Set([
  "the", "a", "an", "and", "or", "for", "with", "your", "that", "this", "into", "from", "of", "to",
  "in", "on", "at", "by", "is", "are", "be", "it", "as", "so", "you", "we", "they", "their", "our",
]);

/** First clause of a description — descriptions are often two sentences of very different value. */
export function firstClause(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const stop = trimmed.search(/[.;]\s/);
  return (stop > 20 ? trimmed.slice(0, stop) : trimmed).trim();
}

export function sentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

export function lower(text: string): string {
  return text.trim().replace(/^[A-Z](?![A-Z])/, (c) => c.toLowerCase());
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
 * Hero support line. Names the two capabilities that carry the argument and the audience they
 * serve, in the product's own words.
 */
export function heroLede(brief: DesignBrief, features: FeatureSpec[]): string {
  const [a, b] = features;
  if (a && b) {
    return sentence(
      `${brief.productName} gives ${brief.audience} ${lower(firstClause(a.description) || a.name)}, and ${lower(
        firstClause(b.description) || b.name,
      )}`,
    );
  }
  if (a) return sentence(`${brief.productName} gives ${brief.audience} ${lower(firstClause(a.description) || a.name)}`);
  return sentence(`Built for ${brief.audience}`);
}

const GOAL_CTA: Record<DesignBrief["businessGoal"], { primary: string; secondary: string; note: string }> = {
  leads: { primary: "Talk to the team", secondary: "See how it works", note: "Usually a 30-minute call, no deck." },
  demos: { primary: "Book a walkthrough", secondary: "Read the mechanics", note: "We demo on your data, not a sandbox." },
  trust: { primary: "See the approach", secondary: "Read the detail", note: "Everything here is verifiable before you commit." },
  sales: { primary: "Get started", secondary: "Compare plans", note: "No procurement cycle to start." },
  activation: { primary: "Open the workspace", secondary: "See a sample board", note: "Your first view is ready in minutes." },
};

export function ctaFor(goal: DesignBrief["businessGoal"]): { primary: string; secondary: string; note: string } {
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
      `${p0} ${p0 === 1 ? "capability carries" : "capabilities carry"} the argument for ${brief.audience}; the other ${rest} ${
        rest === 1 ? "removes a reason" : "remove reasons"
      } to say no`,
    );
  }
  return sentence(`Each block below is one declared capability, described the way ${brief.audience} would ask about it`);
}

/**
 * Outcome lines. These are deliberately framed as consequences of a named capability rather than
 * as invented statistics — a fabricated "37% lift" is worse than no number at all.
 */
export function outcomes(brief: DesignBrief, features: FeatureSpec[]): Array<{ value: string; label: string; note: string }> {
  const picks = features.slice(0, 3);
  const verbs = ["Fewer handoffs", "Less rework", "Faster answers"];
  return picks.map((f, i) => ({
    value: f.name,
    label: verbs[i] ?? "Clearer decisions",
    note: sentence(firstClause(f.description) || `A declared capability of ${brief.productName}`),
  }));
}

/** Chapters: the argument in order, one per capability, phrased as a step in a sequence. */
export function chapters(brief: DesignBrief, features: FeatureSpec[]): Array<{ title: string; body: string; meta: string }> {
  return features.slice(0, 5).map((f, i) => ({
    title: f.name,
    body: sentence(f.description || `${f.name} is part of how ${brief.productName} serves ${brief.audience}`),
    meta: `Step ${String(i + 1).padStart(2, "0")}`,
  }));
}

/** Questions a buyer actually asks, derived from the shape of the brief. */
export function questions(brief: DesignBrief, features: FeatureSpec[]): Array<{ title: string; body: string }> {
  const lead = features[0];
  const last = features[features.length - 1];
  const out: Array<{ title: string; body: string }> = [];

  if (lead) {
    out.push({
      title: `What does ${lead.name.toLowerCase()} actually change day to day?`,
      body: sentence(
        `${firstClause(lead.description) || lead.name} — which means ${brief.audience} stop doing that work by hand`,
      ),
    });
  }
  out.push({
    title: `Who is ${brief.productName} for?`,
    body: sentence(
      `${brief.audience[0]?.toUpperCase()}${brief.audience.slice(1)}. The ${features.length} capabilities on this page are the whole product; there is no hidden tier`,
    ),
  });
  if (last && last !== lead) {
    out.push({
      title: `Is ${last.name.toLowerCase()} available from day one?`,
      body: sentence(
        `Yes. ${firstClause(last.description) || last.name} ships with everything else, not as a later phase`,
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

/** A quote drawn from the product's own promise — attributed to the role, never to a fake person. */
export function pullQuote(brief: DesignBrief, features: FeatureSpec[]): { quote: string; attribution: string } {
  const lead = features[0];
  const quote = lead
    ? `${firstClause(lead.description) || lead.name}. That is the whole pitch, and it is the part ${brief.audience} check first.`
    : `${brief.productName} exists to make one job smaller for ${brief.audience}.`;
  return { quote, attribution: `The problem ${brief.productName} was built for` };
}

/** Navigation derived from the sections that will actually exist. */
export function navFor(sections: string[]): Array<{ label: string; href: string }> {
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
  return sections
    .filter((s) => labels[s])
    .slice(0, 5)
    .map((s) => ({ label: labels[s]!, href: `#${s}` }));
}
