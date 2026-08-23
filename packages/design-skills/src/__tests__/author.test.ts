/**
 * Phase 1 connective-tissue author — Gemini reflection + fallback tests.
 * Mocks fetch; never hits a live API. Missing GEMINI_API_KEY must not fail CI.
 */
import { describe, expect, it } from "vitest";
import {
  GeminiContentAuthor,
  authorConnectiveTissue,
  briefFactTokens,
  contentContextFromBrief,
  contradictionReason,
  createContentAuthor,
  deterministicAuthored,
  designFromFeatures,
  isConnectiveAuthorEligible,
  sentenceSharesFactToken,
  type AuthoredConnectiveTissue,
} from "../index";
import { DesignBrief } from "../types";
import {
  contentSpecificity,
  extractAuthoredNodes,
  phraseOverlapRatio,
} from "./cross-brief-distinctiveness.test";

function freightlane() {
  return DesignBrief.parse({
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
  });
}

function willowvet() {
  return DesignBrief.parse({
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
  });
}

function scalehouse() {
  return DesignBrief.parse({
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
  });
}

function fakeFetch(modelJson: Record<string, unknown>): typeof fetch {
  return (async () => ({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(modelJson) }] } }],
    }),
  })) as unknown as typeof fetch;
}

function groundedAuthorJson(brief: ReturnType<typeof freightlane>): Record<string, unknown> {
  const name = brief.productName;
  const lead = brief.features[0]!.name;
  return {
    cta: {
      primary: `Book a ${name} walkthrough on your ${lead.toLowerCase()}`,
      secondary: `See how ${name} books ${brief.features[1]!.name.toLowerCase()}`,
      note: `${name} demos on your data — cancel the hold anytime.`,
      riskReversal: `Walk ${name} on your own ${lead.toLowerCase()} — no annual lock to try.`,
    },
    faq: [
      {
        title: `Who is ${name} for?`,
        body: `${brief.audience}. ${lead} and the other capabilities on this page are the whole ${name} product.`,
      },
      {
        title: `Is ${brief.features[brief.features.length - 1]!.name.toLowerCase()} available from day one?`,
        body: `Yes. Every ${name} capability ships together — including ${lead}.`,
      },
      {
        title: `How long before ${name} shows a real ${lead.toLowerCase()}?`,
        body: `One session: ${name} runs on your data rather than a sandbox.`,
      },
      {
        title: `What is deliberately not in ${name}?`,
        body: `Anything ${name} does not do yet. This page lists ${lead} and declared scope only.`,
      },
      {
        title: `Can we pause ${name} without a long contract?`,
        body: `Yes — start on a reversible ${name} path. Cancel anytime.`,
      },
      {
        title: `What happens if we hit a ${name} limit?`,
        body: `Crossing a lane means adding the next named ${name} capability — not an opaque overage.`,
      },
    ],
    proof: {
      claim: `${name} earns the second meeting because ${lead} is live scope — not a forecast.`,
    },
  };
}

function normalizeNode(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function authoredBucketsFromTissue(
  tissue: AuthoredConnectiveTissue,
  brief: ReturnType<typeof freightlane>,
  html: string,
) {
  // Prefer tissue CTA/FAQ (what designFromFeatures renders when injected);
  // proof still comes from HTML so marquee board cells stay measured.
  const fromHtml = extractAuthoredNodes(brief, html, false);
  return {
    cta: [tissue.cta.primary, tissue.cta.secondary, tissue.cta.note, tissue.cta.riskReversal],
    faq: tissue.faq.flatMap((q) => [q.title, q.body]),
    proof: fromHtml.proof,
  };
}

describe("Phase 1 connective author", () => {
  it("gates eligibility to saas-marketing + demos only", () => {
    expect(isConnectiveAuthorEligible(freightlane())).toBe(true);
    expect(
      isConnectiveAuthorEligible(
        DesignBrief.parse({
          ...freightlane(),
          businessGoal: "leads",
        }),
      ),
    ).toBe(false);
    expect(
      isConnectiveAuthorEligible(
        DesignBrief.parse({
          ...freightlane(),
          siteKind: "corporate-story",
          lockSiteKind: true,
          businessGoal: "trust",
        }),
      ),
    ).toBe(false);
  });

  it("createContentAuthor without a key returns deterministic copy.ts tissue", async () => {
    const author = createContentAuthor(undefined);
    const tissue = await author.author(freightlane());
    const fallback = deterministicAuthored(freightlane());
    expect(tissue.source).toBe("deterministic");
    expect(tissue.cta).toEqual(fallback.cta);
    expect(tissue.faq).toEqual(fallback.faq);
  });

  it("rejects model copy that shares no brief fact token and falls back", async () => {
    const engine = new GeminiContentAuthor({
      apiKey: "test",
      fetchImpl: fakeFetch({
        cta: {
          primary: "Book a walkthrough",
          secondary: "Read the mechanics",
          note: "We demo on your data, not a sandbox.",
          riskReversal: "Book a working session — cancel anytime",
        },
        faq: [
          { title: "How long does it take?", body: "One session on a prepared sandbox." },
          { title: "Can we cancel?", body: "Yes — start on a reversible path." },
          { title: "What is missing?", body: "Anything we do not do yet." },
          { title: "Who do we talk to?", body: "Use the primary path on this page." },
        ],
        proof: { claim: "Five named states earn the second meeting." },
      }),
    });
    const tissue = await engine.author(freightlane());
    expect(tissue.source).toBe("deterministic");
    expect(tissue.cta.primary).toBe(deterministicAuthored(freightlane()).cta.primary);
  });

  it("accepts grounded model copy and wires it through designFromFeatures", async () => {
    const brief = freightlane();
    const engine = new GeminiContentAuthor({
      apiKey: "test",
      fetchImpl: fakeFetch(groundedAuthorJson(brief)),
    });
    const tissue = await engine.author(brief);
    expect(tissue.source).toBe("gemini");
    expect(tissue.cta.primary).toMatch(/Freightlane/i);
    expect(tissue.cta.primary).toMatch(/Lane board/i);

    const { previewHtml } = designFromFeatures(brief, { authored: tissue });
    expect(previewHtml).toContain(tissue.cta.primary);
    expect(previewHtml).toContain(tissue.cta.secondary);
    expect(previewHtml).toContain(tissue.cta.riskReversal);
    expect(previewHtml).toContain(tissue.faq[0]!.title);
    if (tissue.proof.claim) expect(previewHtml).toContain(tissue.proof.claim);
  });

  it("authored injection is more brief-specific than deterministic copy.ts (no live API)", async () => {
    const briefs = [freightlane(), willowvet(), scalehouse()];
    const deterministicPages = briefs.map((brief) => {
      const { previewHtml } = designFromFeatures(brief);
      const tissue = deterministicAuthored(brief);
      const buckets = authoredBucketsFromTissue(tissue, brief, previewHtml);
      return {
        brief,
        buckets,
        nodes: new Set(
          [...buckets.cta, ...buckets.faq, ...buckets.proof].map(normalizeNode),
        ),
      };
    });

    const authoredPages = await Promise.all(
      briefs.map(async (brief) => {
        const engine = new GeminiContentAuthor({
          apiKey: "test",
          fetchImpl: fakeFetch(groundedAuthorJson(brief)),
        });
        const tissue = await engine.author(brief);
        expect(tissue.source).toBe("gemini");
        const { previewHtml } = designFromFeatures(brief, { authored: tissue });
        const buckets = authoredBucketsFromTissue(tissue, brief, previewHtml);
        const metric = contentSpecificity(buckets, brief);
        // Authored CTA+FAQ lines must hit brief vocabulary far above goal scaffolding.
        expect(metric.ratio, `${brief.productName} authored specificity`).toBeGreaterThan(0.55);
        return {
          brief,
          buckets,
          nodes: new Set(
            [...buckets.cta, ...buckets.faq, ...buckets.proof].map(normalizeNode),
          ),
          metric,
        };
      }),
    );

    // Deterministic path keeps residual overlap (Phase 0 ceiling 70%).
    let detMax = 0;
    for (let i = 0; i < deterministicPages.length; i++) {
      for (let j = i + 1; j < deterministicPages.length; j++) {
        const { ratio } = phraseOverlapRatio(deterministicPages[i]!.nodes, deterministicPages[j]!.nodes);
        detMax = Math.max(detMax, ratio);
      }
    }
    expect(detMax).toBeLessThanOrEqual(0.7);

    // Stubbed authored path should share less CTA/FAQ scaffolding across products.
    let authMax = 0;
    for (let i = 0; i < authoredPages.length; i++) {
      for (let j = i + 1; j < authoredPages.length; j++) {
        const { ratio } = phraseOverlapRatio(authoredPages[i]!.nodes, authoredPages[j]!.nodes);
        authMax = Math.max(authMax, ratio);
      }
    }
    expect(authMax).toBeLessThan(detMax);
    expect(authMax).toBeLessThan(0.45);
  });

  it("authorConnectiveTissue without key matches copy.ts and never throws", async () => {
    const tissue = await authorConnectiveTissue(freightlane(), {});
    expect(tissue.source).toBe("deterministic");
    expect(
      sentenceSharesFactToken(
        "Freightlane lane board",
        briefFactTokens(contentContextFromBrief(freightlane())),
      ),
    ).toBe(true);
    expect(
      contradictionReason(contentContextFromBrief(freightlane()), {
        cta: { primary: "Hello world", secondary: "x", note: "y", riskReversal: "z" },
      }),
    ).toMatch(/shares no token/);
  });

  it("does not invent workflow stages when the brief lacks approval language", async () => {
    const brief = freightlane();
    const engine = new GeminiContentAuthor({
      apiKey: "test",
      fetchImpl: fakeFetch({
        ...groundedAuthorJson(brief),
        proof: {
          claim: "Freightlane earns the second meeting because Lane board is live scope.",
          gateCopy: "Human approves before apply",
          stages: [
            { id: "input", title: "Input", role: "Capture Freightlane lane data" },
            { id: "process", title: "Process", role: "Run Freightlane dock windows" },
            { id: "draft", title: "Draft", role: "Surface Freightlane draft" },
            { id: "review", title: "Review", role: "Review Freightlane result" },
            { id: "approve", title: "Approve", role: "Approve Freightlane change" },
          ],
        },
      }),
    });
    const tissue = await engine.author(brief);
    // Draft rejected for invented workflow → deterministic fallback
    expect(tissue.source).toBe("deterministic");
    expect(tissue.proof.stages).toBeUndefined();
    expect(tissue.proof.gateCopy).toBeUndefined();
  });
});
