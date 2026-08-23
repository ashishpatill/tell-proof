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
  ctaFor,
  deterministicAuthored,
  designFromFeatures,
  designFromFeaturesAuthored,
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

  it("authorConnectiveTissue without key returns deterministic tissue and never throws", async () => {
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

  it("ctaFor always returns a fresh object (GOAL_CTA singleton cannot leak across briefs)", () => {
    const first = ctaFor("demos", "saas-marketing");
    const originalNote = first.note;
    first.note = "Ropewalk ships first — poisoned singleton note that must not leak into Petal.";
    const second = ctaFor("demos", "saas-marketing");
    expect(second.note).toBe(originalNote);
    expect(second.note).not.toContain("Ropewalk");
    expect(second).not.toBe(first);
    second.note = "Fretboard append";
    expect(ctaFor("demos", "saas-marketing").note).toBe(originalNote);
  });

  it("deterministic CTA notes differ across same-goal products and reach no-key HTML", async () => {
    const briefs = [freightlane(), willowvet(), scalehouse()];
    const notes: string[] = [];
    for (const brief of briefs) {
      const tissue = deterministicAuthored(brief);
      const lead = brief.features[0]!.name;
      expect(tissue.cta.note.toLowerCase()).toContain(lead.split(/\s+/)[0]!.toLowerCase());
      expect(tissue.cta.note.length).toBeLessThanOrEqual(240);
      notes.push(tissue.cta.note);

      const { previewHtml } = await designFromFeaturesAuthored(brief, {});
      expect(previewHtml).toContain(tissue.cta.note);
    }
    expect(notes[0]).not.toBe(notes[1]);
    expect(notes[1]).not.toBe(notes[2]);
    expect(notes[0]).not.toBe(notes[2]);

    // Regression: second HTML must not carry the first product's lead feature name in the CTA note.
    const firstLead = briefs[0]!.features[0]!.name;
    const { previewHtml: secondHtml } = await designFromFeaturesAuthored(briefs[1]!, {});
    const secondNote = deterministicAuthored(briefs[1]!).cta.note;
    expect(secondHtml).toContain(secondNote);
    expect(secondNote).not.toContain(firstLead);
  });

  it("grounds workflow stage roles in feature names when approval signal is present", async () => {
    const payments = DesignBrief.parse({
      productName: "Paygate",
      tagline: "Draft payment instructions with human approval before send",
      audience: "finance ops leads",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "p1", name: "Payment draft", description: "Draft ACH instructions from invoice lines", priority: "p0" },
        { id: "p2", name: "Risk screen", description: "Flag unusual payees before review", priority: "p0" },
        { id: "p3", name: "Approver queue", description: "Route drafts to a named approver", priority: "p1" },
        { id: "p4", name: "Send ledger", description: "Record approved sends with a timestamp", priority: "p1" },
        { id: "p5", name: "Exception tray", description: "Hold rejected drafts for rework", priority: "p2" },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "light-scroll-reveals",
        colorMood: "neutral-professional",
      },
    });
    const moderation = DesignBrief.parse({
      productName: "Moddesk",
      tagline: "Draft trust decisions and approve before anything auto-applies",
      audience: "trust and safety leads",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "m1", name: "Report intake", description: "Capture abuse reports with evidence links", priority: "p0" },
        { id: "m2", name: "Policy match", description: "Score reports against published policies", priority: "p0" },
        { id: "m3", name: "Moderator draft", description: "Draft a take-down or warn action", priority: "p1" },
        { id: "m4", name: "Approval gate", description: "Require a second human before apply", priority: "p1" },
        { id: "m5", name: "Appeal log", description: "Record appeals against prior decisions", priority: "p2" },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "light-scroll-reveals",
        colorMood: "neutral-professional",
      },
    });

    const sharedLegacy = "Capture what the operator already knows";
    for (const brief of [payments, moderation]) {
      const tissue = deterministicAuthored(brief);
      expect(tissue.proof.stages).toHaveLength(5);
      for (const stage of tissue.proof.stages!) {
        expect(stage.role).not.toBe(sharedLegacy);
        expect(stage.role.length).toBeLessThanOrEqual(140);
        expect(
          brief.features.some((f) => stage.role.includes(f.name)),
          `${brief.productName} role "${stage.role}" must name a feature`,
        ).toBe(true);
      }
      const { previewHtml } = await designFromFeaturesAuthored(brief, {});
      expect(previewHtml).not.toContain(sharedLegacy);
      for (const stage of tissue.proof.stages!) {
        expect(previewHtml).toContain(stage.role);
      }
    }

    const payRoles = deterministicAuthored(payments).proof.stages!.map((s) => s.role).join("\n");
    const modRoles = deterministicAuthored(moderation).proof.stages!.map((s) => s.role).join("\n");
    expect(payRoles).not.toBe(modRoles);
    expect(payRoles).toMatch(/Payment draft|Risk screen|Approver queue/i);
    expect(modRoles).toMatch(/Report intake|Policy match|Moderator draft/i);
    expect(payRoles).not.toMatch(/Report intake/);
    expect(modRoles).not.toMatch(/Payment draft/);
  });

  it("ordinary briefs without approval language still get the evidence board, not approve stages", async () => {
    const tissue = deterministicAuthored(freightlane());
    expect(tissue.proof.stages).toBeUndefined();
    expect(tissue.proof.gateCopy).toBeUndefined();
    const { previewHtml, spec } = await designFromFeaturesAuthored(freightlane(), {});
    expect(previewHtml).not.toContain("Capture what the operator already knows");
    expect(spec.sections.some((s) => s.layout === "workflow-proof")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "marquee-proof" || s.kind === "proof")).toBe(true);
  });

});
