/**
 * Phase 0 — instrument Studio honesty blind spot.
 *
 * The 98.9 critique score measures grammar on 17 showcase pages, not whether two
 * ordinary products that share siteKind + businessGoal look authored. This suite
 * runs real `designFromFeatures` HTML (not fixtures) on ordinary briefs and
 * reports phrase-overlap + brief-vocabulary specificity on Design Expert's
 * authored-node list only.
 *
 * Scored nodes (Design Expert lock) — ONLY these:
 * - CTA: ctaFor() primary + secondary + note, plus riskReversal() (CTA band)
 * - FAQ: every questions() title + body (incl. corporate/fintech approve pair)
 * - Proof: workflow stage labels + gate copy when hasApprovalWorkflowSignal;
 *   else marquee ds-proof-claim / data-proof-board items (from real HTML)
 *
 * Not scored: nav/footer chrome, Privacy/Terms/Careers, eyebrows(), headline/heroLede,
 * pullQuote (outside the proof claim), plan-lane titles (Core / Standard / Full).
 *
 * Measured on master (Freightlane / Willowvet / Scalehouse, saas-marketing + demos):
 * authored-node phrase overlap ≈ 57.1% (16/28 shared÷min) with ctaFor().note scored
 * even when craftFold omits it from HTML. Residual CTA/FAQ scaffolding expected;
 * operator/approve workflow narrative must not be shared after PR 69. Ceiling 70%.
 */
import { describe, expect, it } from "vitest";
import { analyzeFeatures } from "../analyze";
import { ctaFor, questions, riskReversal } from "../copy";
import { designFromFeatures } from "../orchestrate";
import { DesignBrief, type DesignBrief as DesignBriefT } from "../types";

/** Ordinary, non-showcase briefs — no draft/approve language, not SHOWCASE_BRIEFS. */
function ordinaryBriefs(): DesignBriefT[] {
  return [
    DesignBrief.parse({
      productName: "Freightlane",
      tagline: "Lane booking and dock windows for regional carriers",
      audience: "fleet managers at mid-size carriers",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Lane board", description: "See open lanes by region and dock hour", priority: "p0" },
        { id: "f2", name: "Dock windows", description: "Book arrival slots without phone tag", priority: "p0" },
        { id: "f3", name: "Carrier roster", description: "Keep preferred carriers ranked by on-time rate", priority: "p1" },
        { id: "f4", name: "Exception log", description: "Flag missed windows with a reason code", priority: "p1" },
        { id: "f5", name: "Route notes", description: "Attach yard notes that travel with the load", priority: "p2" },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "light-scroll-reveals",
        colorMood: "neutral-professional",
      },
    }),
    DesignBrief.parse({
      productName: "Willowvet",
      tagline: "Appointment and treatment notes for neighborhood clinics",
      audience: "veterinary practice managers",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "v1", name: "Visit schedule", description: "Day board of appointments by room and clinician", priority: "p0" },
        { id: "v2", name: "Treatment notes", description: "Record vaccines and meds against the patient chart", priority: "p0" },
        { id: "v3", name: "Client reminders", description: "Send visit reminders before the appointment", priority: "p1" },
        { id: "v4", name: "Inventory count", description: "Track clinic stock for vaccines and consumables", priority: "p1" },
        { id: "v5", name: "Referral packet", description: "Package history when sending to a specialist", priority: "p2" },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "light-scroll-reveals",
        colorMood: "neutral-professional",
      },
    }),
    DesignBrief.parse({
      productName: "Scalehouse",
      tagline: "Lesson plans and practice logs for private music teachers",
      audience: "independent music teachers",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "m1", name: "Lesson plan", description: "Outline repertoire and drills for each student week", priority: "p0" },
        { id: "m2", name: "Practice log", description: "Students log minutes and what they worked", priority: "p0" },
        { id: "m3", name: "Recital list", description: "Track pieces ready for the next recital", priority: "p1" },
        { id: "m4", name: "Parent note", description: "Share a short progress note after each lesson", priority: "p1" },
        { id: "m5", name: "Studio calendar", description: "Hold lesson slots and make-up windows", priority: "p2" },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "light-scroll-reveals",
        colorMood: "neutral-professional",
      },
    }),
  ];
}

function normalizeNode(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Strip script/style so `>text<` walks page copy only. */
function stripChrome(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

function textBetweenTags(chunk: string): string[] {
  const out: string[] = [];
  const re = />([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk))) {
    const t = m[1]!.replace(/\s+/g, " ").trim();
    if (t.length >= 3) out.push(t);
  }
  return out;
}

export type AuthoredBuckets = {
  cta: string[];
  faq: string[];
  proof: string[];
};

/**
 * Design Expert authored nodes.
 * CTA + FAQ from copy helpers (exact locked list). Proof from real designFromFeatures HTML.
 */
export function extractAuthoredNodes(
  brief: DesignBriefT,
  html: string,
  hasApprovalWorkflow: boolean,
): AuthoredBuckets {
  const ctaCfg = ctaFor(brief.businessGoal, brief.siteKind, brief.primaryCta);
  const cta = [ctaCfg.primary, ctaCfg.secondary, ctaCfg.note, riskReversal(brief)];
  const faq = questions(brief, brief.features).flatMap((q) => [q.title, q.body]);

  const page = stripChrome(html);
  const proof: string[] = [];
  const proofSection =
    page.match(/<section[^>]*\bds-proof\b[^>]*>[\s\S]*?<\/section>/)?.[0] ??
    page.match(/<section[^>]*\bdata-workflow-proof\b[^>]*>[\s\S]*?<\/section>/)?.[0] ??
    "";

  if (hasApprovalWorkflow && /data-workflow-proof/.test(proofSection)) {
    // Workflow stage labels + gate copy
    for (const m of proofSection.matchAll(/data-workflow-step="[^"]*"[^>]*>([^<]+)/g)) {
      proof.push(m[1]!.trim());
    }
    for (const m of proofSection.matchAll(/class="ds-proof-claim"[^>]*>([^<]+)/g)) {
      proof.push(m[1]!.trim());
    }
    for (const m of proofSection.matchAll(/class="ds-proof-foot"[^>]*>([^<]+)/g)) {
      proof.push(m[1]!.trim());
    }
    for (const m of proofSection.matchAll(/<li[^>]*data-workflow-step[\s\S]*?<\/li>/g)) {
      proof.push(...textBetweenTags(m[0]!));
    }
  } else {
    // Marquee: ds-proof-claim + data-proof-board items only (not pullQuote attribution foot)
    for (const m of proofSection.matchAll(/class="ds-proof-claim"[^>]*>([^<]+)/g)) {
      proof.push(m[1]!.trim());
    }
    for (const m of proofSection.matchAll(/<li class="ds-proof-cell[\s\S]*?<\/li>/g)) {
      proof.push(...textBetweenTags(m[0]!));
    }
  }

  const clean = (xs: string[]) => xs.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t.length >= 3);
  return { cta: clean(cta), faq: clean(faq), proof: clean(proof) };
}

function authoredNodeSet(buckets: AuthoredBuckets): Set<string> {
  return new Set([...buckets.cta, ...buckets.faq, ...buckets.proof].map(normalizeNode));
}

/** Phrase-overlap = |A ∩ B| / min(|A|, |B|) on normalized authored nodes. */
export function phraseOverlapRatio(a: Set<string>, b: Set<string>): {
  ratio: number;
  shared: string[];
  sharedCount: number;
} {
  const shared = [...a].filter((x) => b.has(x)).sort();
  const denom = Math.min(a.size, b.size) || 1;
  return { ratio: shared.length / denom, shared, sharedCount: shared.length };
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
  "your",
  "that",
  "this",
  "into",
  "from",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "is",
  "are",
  "be",
  "it",
  "as",
  "so",
  "you",
  "we",
  "they",
  "their",
  "our",
  "who",
  "what",
  "how",
  "when",
  "does",
  "need",
  "before",
  "after",
  "than",
  "then",
  "also",
  "only",
  "not",
  "yes",
  "all",
]);

/** Tokens from brief productName / tagline / features[].name / description (≥4 chars, no stopwords). */
export function briefVocabulary(brief: DesignBriefT): Set<string> {
  const raw = [
    brief.productName,
    brief.tagline,
    ...brief.features.flatMap((f) => [f.name, f.description]),
  ].join(" ");
  return new Set(
    raw
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOP.has(t)),
  );
}

function lineSharesBriefToken(line: string, vocab: Set<string>): boolean {
  return line
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((t) => t.length >= 4 && vocab.has(t));
}

/**
 * Content-specificity metric: share of authored lines that share ≥1 brief vocabulary token.
 * Goal-keyed CTA/FAQ scaffolding may score low — that is the next PR, not a Phase 0 fail.
 */
export function contentSpecificity(
  buckets: AuthoredBuckets,
  brief: DesignBriefT,
): {
  ratio: number;
  hits: number;
  total: number;
  featureProofHits: number;
  featureProofTotal: number;
  featureFaqHits: number;
  featureFaqTotal: number;
} {
  const vocab = briefVocabulary(brief);
  const all = [...buckets.cta, ...buckets.faq, ...buckets.proof];
  const hits = all.filter((l) => lineSharesBriefToken(l, vocab)).length;

  const featureNames = brief.features.map((f) => f.name.toLowerCase());
  const proofLines = buckets.proof;
  const featureProof = proofLines.filter((l) =>
    featureNames.some((n) => l.toLowerCase().includes(n)),
  );
  const featureFaq = buckets.faq.filter((l) =>
    featureNames.some((n) => l.toLowerCase().includes(n)),
  );

  return {
    ratio: all.length ? hits / all.length : 0,
    hits,
    total: all.length,
    featureProofHits: featureProof.filter((l) => lineSharesBriefToken(l, vocab)).length,
    featureProofTotal: featureProof.length,
    featureFaqHits: featureFaq.filter((l) => lineSharesBriefToken(l, vocab)).length,
    featureFaqTotal: featureFaq.length,
  };
}

/** Operator/approve workflow narrative that ordinary briefs must not share after PR 69. */
const APPROVAL_NARRATIVE = [
  "operators approve",
  "human approves before apply",
  "nothing auto-applies",
  "named approval",
  "draft until a named",
  "explicit gate — never auto-apply",
];

/** Honest ceiling: measured ≈57.1% (16/28) on these briefs with ctaFor().note scored. */
const OVERLAP_CEILING = 0.7;

describe("cross-brief distinctiveness (Phase 0 honesty)", () => {
  it("authored-node phrase overlap ≤70% on ordinary saas-marketing/demos (measured ~57.1%; residual CTA/FAQ scaffolding expected)", () => {
    const briefs = ordinaryBriefs();
    const pages = briefs.map((brief) => {
      const analysis = analyzeFeatures(brief);
      expect(analysis.hasApprovalWorkflow, `${brief.productName} must not trigger approval workflow`).toBe(
        false,
      );
      const { previewHtml, spec } = designFromFeatures(brief);
      expect(previewHtml.length, `${brief.productName} must emit real HTML`).toBeGreaterThan(500);
      expect(spec.brief.siteKind).toBe("saas-marketing");
      expect(spec.brief.businessGoal).toBe("demos");
      expect(spec.sections.some((s) => s.layout === "workflow-proof")).toBe(false);
      expect(spec.sections.some((s) => s.layout === "marquee-proof")).toBe(true);

      const buckets = extractAuthoredNodes(brief, previewHtml, analysis.hasApprovalWorkflow);
      expect(buckets.cta.length, `${brief.productName} CTA nodes`).toBe(4);
      expect(buckets.faq.length, `${brief.productName} FAQ nodes`).toBeGreaterThan(0);
      expect(buckets.proof.length, `${brief.productName} proof nodes`).toBeGreaterThan(0);

      // Real generation still emits primary / secondary / riskReversal into HTML.
      const ctaCfg = ctaFor(brief.businessGoal, brief.siteKind, brief.primaryCta);
      expect(previewHtml).toContain(ctaCfg.primary);
      expect(previewHtml).toContain(ctaCfg.secondary);
      expect(previewHtml).toContain(riskReversal(brief));

      return {
        brief,
        buckets,
        nodes: authoredNodeSet(buckets),
        html: previewHtml,
      };
    });

    const reports: string[] = [];
    let maxRatio = 0;

    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        const left = pages[i]!;
        const right = pages[j]!;
        const { ratio, shared, sharedCount } = phraseOverlapRatio(left.nodes, right.nodes);
        maxRatio = Math.max(maxRatio, ratio);
        reports.push(
          `${left.brief.productName} vs ${right.brief.productName}: ${(ratio * 100).toFixed(1)}% shared (${sharedCount}/${Math.min(left.nodes.size, right.nodes.size)})`,
        );

        // After PR 69, ordinary briefs must not share the operator/approve workflow story.
        for (const phrase of APPROVAL_NARRATIVE) {
          expect(
            shared.some((s) => s.includes(phrase)),
            `shared approval narrative "${phrase}" between ${left.brief.productName} and ${right.brief.productName}`,
          ).toBe(false);
        }

        expect(
          ratio,
          `phrase overlap too high for ${left.brief.productName} vs ${right.brief.productName}: ${reports.join("; ")}`,
        ).toBeLessThanOrEqual(OVERLAP_CEILING);
      }
    }

    // Surface measured overlap in the failure message / assertion context.
    expect(
      maxRatio,
      `measured max authored-node overlap among ordinary demos briefs: ${reports.join("; ")}`,
    ).toBeLessThanOrEqual(OVERLAP_CEILING);
    // Sanity: residual scaffolding overlap is expected (not near-zero yet).
    expect(maxRatio).toBeGreaterThan(0.2);
  });

  it("content-specificity metric exists; feature proof board + feature FAQ rows share brief vocabulary", () => {
    for (const brief of ordinaryBriefs()) {
      const analysis = analyzeFeatures(brief);
      const { previewHtml } = designFromFeatures(brief);
      const buckets = extractAuthoredNodes(brief, previewHtml, analysis.hasApprovalWorkflow);
      const metric = contentSpecificity(buckets, brief);

      expect(Number.isFinite(metric.ratio), `${brief.productName} specificity ratio`).toBe(true);
      expect(metric.total).toBeGreaterThan(0);

      // Feature-derived proof board cells (feature names) must hit brief vocab.
      expect(
        metric.featureProofTotal,
        `${brief.productName} expected feature names on proof board`,
      ).toBeGreaterThan(0);
      expect(metric.featureProofHits).toBe(metric.featureProofTotal);

      // Feature FAQ rows (Is <feature>… / Do we need <feature>…) must hit brief vocab.
      expect(
        metric.featureFaqTotal,
        `${brief.productName} expected feature-named FAQ rows`,
      ).toBeGreaterThan(0);
      expect(metric.featureFaqHits).toBe(metric.featureFaqTotal);

      // Do not fail on overall ratio — goal-keyed CTA/FAQ scaffolding is still generic (next PR).
      expect(metric.ratio).toBeGreaterThanOrEqual(0);
    }
  });

  it("scores corporate/fintech “Who approves irreversible actions?” FAQ when questions() emits it", () => {
    const corporate = DesignBrief.parse({
      productName: "Boardpack",
      tagline: "Diligence packs for mid-market boards",
      audience: "corporate secretaries",
      businessGoal: "trust",
      siteKind: "corporate-story",
      lockSiteKind: true,
      features: [
        { id: "c1", name: "Board pack", description: "Assemble the packet the board actually opens", priority: "p0" },
        { id: "c2", name: "Sign-off log", description: "Named approvals before irreversible sends", priority: "p0" },
        { id: "c3", name: "Exception path", description: "Surface failures with a rollback note", priority: "p1" },
      ],
      taste: { aestheticLean: "system-crafted", motion: "subtle-micro", colorMood: "neutral-professional" },
    });
    const fintech = DesignBrief.parse({
      productName: "Wiredesk",
      tagline: "Treasury controls for mid-market cash",
      audience: "treasury operators",
      businessGoal: "demos",
      siteKind: "fintech-marketing",
      lockSiteKind: true,
      features: [
        { id: "w1", name: "Wire queue", description: "Queue outbound wires with dual control", priority: "p0" },
        { id: "w2", name: "Wallet map", description: "See balances across banks in one surface", priority: "p0" },
        { id: "w3", name: "Audit export", description: "Export who approved each payment", priority: "p1" },
      ],
      taste: { aestheticLean: "conversion-sharp", motion: "light-scroll-reveals", colorMood: "neutral-professional" },
    });

    for (const brief of [corporate, fintech]) {
      const analysis = analyzeFeatures(brief);
      const { previewHtml } = designFromFeatures(brief);
      const buckets = extractAuthoredNodes(brief, previewHtml, analysis.hasApprovalWorkflow);
      expect(
        buckets.faq.some((l) => /who approves irreversible actions/i.test(l)),
        `${brief.productName} must score the approve FAQ title`,
      ).toBe(true);
      expect(
        buckets.faq.some((l) => /operators approve/i.test(l)),
        `${brief.productName} must score the approve FAQ body`,
      ).toBe(true);
      expect(previewHtml).toMatch(/Who approves irreversible actions/i);
    }
  });
});
