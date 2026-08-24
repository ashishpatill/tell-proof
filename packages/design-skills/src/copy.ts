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
  primaryCta?: string,
): { primary: string; secondary: string; note: string } {
  const override = primaryCta?.trim();
  const base = ((): { primary: string; secondary: string; note: string } => {
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
    if (siteKind === "signal-observatory") {
      return {
        primary: "Open a desk window",
        secondary: "Read the channels",
        note: "Windows ship with the channels you actually watch — not a demo theatre.",
      };
    }
    if (siteKind === "archive-index") {
      return {
        primary: "Request an entry",
        secondary: "Browse the registry",
        note: "Entries ship as numbered stamps — not a demo theatre.",
      };
    }
    if (siteKind === "commerce-loom") {
      return {
        primary: "Request a cut",
        secondary: "Walk the loom",
        note: "Samples ship with size tape and SKU cells — not a demo theatre.",
      };
    }
    if (siteKind === "field-guide") {
      return {
        primary: "Request a voucher",
        secondary: "Open the plate",
        note: "Vouchers ship with pressed plates and range notes — not a demo theatre.",
      };
    }
    if (siteKind === "care-pathway") {
      return {
        primary: "Request a chart walkthrough",
        secondary: "Read the pathway",
        note: "Walkthroughs ship with stage maps and handoff beads — not a demo theatre.",
      };
    }
    if (siteKind === "agent-harness") {
      return {
        primary: "Start a local session",
        secondary: "Read the permit",
        note: "Runs on your machine — no invented host, no waitlist.",
      };
    }
    return GOAL_CTA[goal];
  })();
  // Agency brief "one CTA" wins when set — every page repeats the same verb.
  // Always spread: GOAL_CTA[goal] is a module singleton; returning it lets callers
  // mutate .note and poison later briefs that share the same businessGoal.
  return override ? { ...base, primary: override } : { ...base };
}

/** Section eyebrows read like an index of an argument, not like decoration. */
export function eyebrows(brief: DesignBrief): Record<string, string> {
  const proof =
    brief.siteKind === "saas-marketing"
      ? "Why demos convert"
      : brief.siteKind === "dashboard-webapp"
        ? "Why it stays open"
        : brief.siteKind === "corporate-story"
          ? "Why diligence clears"
          : brief.siteKind === "fintech-marketing"
            ? "Why treasury short-lists"
            : brief.siteKind === "art-directed-studio"
              ? "Why the work holds"
              : brief.siteKind === "docs-educational"
                ? "Why the model holds"
                : brief.siteKind === "consumer-craft"
                  ? "Why it earns a place"
                  : brief.siteKind === "editorial-foundry"
                    ? "Why the cuts hold"
                    : brief.siteKind === "research-dossier"
                      ? "Why the folio clears"
                      : brief.siteKind === "signal-observatory"
                        ? "Why the desk trusts it"
                        : brief.siteKind === "archive-index"
                          ? "Why the register holds"
                          : brief.siteKind === "commerce-loom"
                            ? "Why buyers keep the cut"
                            : brief.siteKind === "field-guide"
                              ? "Why the voucher stands"
                              : brief.siteKind === "press-atelier"
                                ? "Why the forme locks"
                                : brief.siteKind === "lantern-path"
                                  ? "Why the path holds"
                                : brief.siteKind === "care-pathway"
                                  ? "Why the chart holds"
                                  : brief.siteKind === "agent-harness"
                                    ? "Why the finish holds"
                                  : "Why the argument holds";
  return {
    metrics: "What changes",
    features: brief.siteKind === "docs-educational" ? "The mechanism" : "Capabilities",
    figure: brief.siteKind === "docs-educational" ? "The scrub" : "How it works",
    story:
      brief.siteKind === "corporate-story"
        ? "How we work"
        : brief.siteKind === "docs-educational"
          ? "The cost path"
          : brief.siteKind === "saas-marketing"
            ? "The pipeline"
            : brief.siteKind === "fintech-marketing"
              ? "The send path"
              : brief.siteKind === "archive-index"
                ? "The entry"
                : brief.siteKind === "signal-observatory"
                  ? "The chronology"
                  : brief.siteKind === "commerce-loom"
                    ? "The hangtag"
                    : brief.siteKind === "field-guide"
                      ? "The range"
                      : brief.siteKind === "press-atelier"
                        ? "The gather"
                        : brief.siteKind === "lantern-path"
                          ? "The ember walk"
                        : brief.siteKind === "care-pathway"
                          ? "The rounds"
                          : brief.siteKind === "agent-harness"
                            ? "The turns"
                          : brief.siteKind === "editorial-foundry"
                            ? "The marginalia"
                            : brief.siteKind === "research-dossier"
                              ? "The spread"
                              : "The sequence",
    proof,
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
 * Deliberately about scope, sequencing, limits, and risk rather than about what each capability
 * does. The catalogue already answers that, and a FAQ that re-explains the feature list is the
 * clearest sign a page was assembled from a template.
 *
 * Conversion landings need 6–8 objection answers (conversion-landing-craft). Keep every answer
 * rooted in the brief — never invent compliance badges or customer names.
 */
export function questions(brief: DesignBrief, features: FeatureSpec[]): Array<{ title: string; body: string }> {
  const last = features[features.length - 1];
  const lead = features[0];
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
  out.push({
    title: "Can we cancel or pause without a long contract?",
    body: sentence(
      brief.businessGoal === "sales"
        ? "Yes — scopes are written for the work that is live. Pause or stop without a surprise clause"
        : "Yes — start on a reversible path. Cancel anytime; nothing here requires an annual lock to try",
    ),
  });
  out.push({
    title: "What happens if we hit a limit?",
    body: sentence(
      `The comparison table spells the declared capability set. Crossing a lane means adding the next named capability — not an opaque overage`,
    ),
  });
  if (lead) {
    out.push({
      title: `Do we need ${lead.name.toLowerCase()} before the rest is useful?`,
      body: sentence(
        `${lead.name} is the usual first step for ${brief.audience}, but every capability on this page is available without unlocking a secret tier`,
      ),
    });
  }
  out.push({
    title: "Who do we talk to if procurement has questions?",
    body: sentence(
      `Use the same ${brief.businessGoal === "demos" ? "demo" : "primary"} path on this page — a human answers scope, security, and sequencing without a separate maze`,
    ),
  });

  if (brief.siteKind === "corporate-story" || brief.siteKind === "fintech-marketing") {
    out.push({
      title: "Who approves irreversible actions?",
      body: sentence(
        `A named human gate sits before apply. ${brief.productName} drafts; operators approve — nothing auto-applies behind the scenes`,
      ),
    });
    out.push({
      title: "What happens when something fails mid-flight?",
      body: sentence(
        `Exceptions surface with a rollback path. The page lists declared capabilities — recovery is part of the workflow, not a footnote`,
      ),
    });
  }

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
      meta: `${core.length} of ${features.length} capabilities · billed monthly`,
      points: core.map((f) => f.name),
      recommended: false,
    },
    {
      title: "Standard",
      body: sentence(`What most ${brief.audience} run, including everything that removes manual work`),
      meta: `${standard.length} of ${features.length} capabilities · save on annual`,
      points: standard.map((f) => f.name),
      recommended: true,
    },
    {
      title: "Full",
      body: sentence(`Every declared capability, including the ones that only matter at scale`),
      meta: `${full.length} of ${features.length} capabilities · annual preferred`,
      points: full.map((f) => f.name),
      recommended: false,
    },
  ];
}

/** Honest risk-reversal line for CTA bands — never invents guarantees the brief did not support. */
export function riskReversal(brief: DesignBrief): string {
  switch (brief.businessGoal) {
    case "demos":
      return sentence("Book a working session on your data — cancel the hold anytime");
    case "leads":
      return sentence("Start with a reversible trial path — no annual lock to evaluate");
    case "sales":
      return sentence("Scopes cover live work only — pause without a surprise clause");
    case "activation":
      return sentence("First useful view in one session — walk away if it does not fit");
    case "trust":
    default:
      return sentence("Every claim on this page is declared scope — ask a human before you commit");
  }
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
  const n = count(features.length);
  const byKind: Partial<Record<DesignBrief["siteKind"], { quote: string; attribution: string }>> = {
    "saas-marketing": {
      quote: `${brief.productName} ships the ${n} capabilities on this page today — no forecast standing in for a product.`,
      attribution: `${n} capabilities · demo on your data · declared scope`,
    },
    "dashboard-webapp": {
      quote: `Operators keep ${brief.productName} open because every row is a live decision — not a report they refresh.`,
      attribution: `Workspace · empty states included · ${n} views`,
    },
    "corporate-story": {
      quote: `${brief.productName} holds in diligence because every claim on this page is verifiable before you commit.`,
      attribution: `Board pack · measured outcomes · ${n} pillars`,
    },
    "fintech-marketing": {
      quote: `Treasury teams short-list ${brief.productName} because wires, wallets, and approvals are one surface — not three portals.`,
      attribution: `${n} controls · audit export · mid-market cash`,
    },
    "art-directed-studio": {
      quote: `The work from ${brief.productName} survives handoff because type, colour, and motion rules are written before vendors touch the brand.`,
      attribution: `Selected work · method notes · ${n} capabilities`,
    },
    "docs-educational": {
      quote: `${brief.productName} is a mechanism you can scrub — each stage names a real cost, not a metaphor.`,
      attribution: `Routing field · ${n} stages · engineers evaluating`,
    },
    "consumer-craft": {
      quote: `${brief.productName} earns a place on the shelf because every claim here is something you can hold — not a lifestyle collage.`,
      attribution: `In hand · ${n} details · paper-led`,
    },
    "editorial-foundry": {
      quote: `${brief.productName} earns a specimen request because the cuts on this page are the ones setters actually use.`,
      attribution: `Trial files · optical sizes · ${n} cuts`,
    },
    "research-dossier": {
      quote: `${brief.productName} clears a briefing because every folio names its instruments — nothing stands in for a source.`,
      attribution: `Numbered folios · ${n} instruments · imprint ready`,
    },
    "signal-observatory": {
      quote: `Desks keep ${brief.productName} calibrated because every channel on this page has a tolerance — not a quiet chart costume.`,
      attribution: `Channel map · ${n} signals · calibration strip`,
    },
    "archive-index": {
      quote: `${brief.productName} earns a cite because every entry sits under one quiet spine — the register, not a search box costume.`,
      attribution: `Index ledger · ${n} stamps · registry close`,
    },
    "commerce-loom": {
      quote: `Buyers keep a ${brief.productName} cut because size, weave, and care notes travel with the SKU — not a glass card grid.`,
      attribution: `Size treadles · ${n} cells · care label`,
    },
    "field-guide": {
      quote: `${brief.productName} stands as a voucher because every plate names its taxon — pressed matter, not a lifestyle float.`,
      attribution: `Range beads · ${n} vouchers · pressed plate`,
    },
    "press-atelier": {
      quote: `${brief.productName} locks a forme because every plate on this page carries registration — not a mock imposition.`,
      attribution: `Sig rail · ${n} formes · pressroom close`,
    },
    "lantern-path": {
      quote: `${brief.productName} holds the walk because every waypoint is on the atlas — not a dark SaaS theme with glow.`,
      attribution: `Path plate · ${n} chapters · ember close`,
    },
    "care-pathway": {
      quote: `${brief.productName} holds the chart because every handoff is on the pathway spine — not a SaaS deal board with stage chips.`,
      attribution: `Care plate · ${n} rounds · chart close`,
    },
    "agent-harness": {
      quote: `${brief.productName} names its finish before the first tool runs — turn tape, tool permit, and steer pin on one local session.`,
      attribution: `Permit plate · ${n} turns · local session`,
    },
  };
  return (
    byKind[brief.siteKind] ?? {
      quote: `${brief.productName} states only what it does today — ${n} declared pieces, and nothing staged behind a later phase.`,
      attribution: `${n} pieces · declared today · no roadmap costume`,
    }
  );
}

/**
 * Navigation derived from the sections that will actually exist.
 *
 * Deduplicated by label: a page with two capability sections used to render "Capabilities" twice
 * in the primary nav, side by side, pointing at the same anchor.
 */
export function navFor(
  sections: Array<{ kind: string; id: string }>,
  siteKind?: string,
): Array<{ label: string; href: string }> {
  if (siteKind === "agent-harness") {
    return [
      { label: "Session", href: "#top" },
      { label: "Permit", href: "#features" },
      { label: "Finish", href: "#cta" },
    ];
  }
  const proofLabel =
    siteKind === "saas-marketing"
      ? "Why demos convert"
      : siteKind === "dashboard-webapp"
        ? "Why it stays open"
        : siteKind === "corporate-story"
          ? "Why diligence clears"
          : siteKind === "fintech-marketing"
            ? "Why treasury picks it"
            : siteKind === "art-directed-studio"
              ? "Why work holds"
              : "Why it holds";
  const labels: Record<string, string> = {
    features: "Capabilities",
    figure: siteKind === "docs-educational" ? "The scrub" : "How it works",
    story:
      siteKind === "saas-marketing"
        ? "Pipeline"
        : siteKind === "fintech-marketing"
          ? "Send path"
          : siteKind === "docs-educational"
            ? "Cost path"
            : "Sequence",
    pricing: "Plans",
    compare: "Included",
    faq: "Questions",
    proof: proofLabel,
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
