import { describe, expect, it } from "vitest";
import { analyzeFeatures } from "../analyze";
import { designFromFeatures } from "../orchestrate";
import { resolveRequestedCraft, routeSkills } from "../route";
import { assertBasics } from "../basics-checklist";
import { DesignBrief, SHOWCASE_BRIEFS } from "../index";
import { resolveTaste } from "../orchestrate";

describe("template skill wiring", () => {
  it("every showcase template carries researchPlan + responsive-performance", () => {
    for (const [key, brief] of Object.entries(SHOWCASE_BRIEFS)) {
      const { spec, previewHtml } = designFromFeatures(brief!);
      expect(spec.routedSkills[0], key).toBe("website-domain-research");
      expect(spec.routedSkills, key).toContain("responsive-performance");
      expect(spec.researchPlan.researchNodes[0], key).toBe("load-prior-domain");
      expect(spec.researchPlan.researchNodes, key).toContain("emit-training-episode");
      expect(previewHtml, key).toMatch(/data-responsive-performance="required"/);
      expect(previewHtml, key).toMatch(/data-research-domain=/);
      const basics = assertBasics(spec, previewHtml);
      const wiring = basics.findings.filter((f) =>
        ["research-plan-wired", "responsive-performance-wired", "sport-research-follow-on"].includes(
          f.id,
        ),
      );
      for (const f of wiring) {
        expect(f.ok, `${key}: ${f.id} — ${f.detail}`).toBe(true);
      }
    }
  });

  it("merges followOnCraft into routedSkills for sport briefs", () => {
    const brief = DesignBrief.parse({
      productName: "CREASE",
      features: [{ id: "live", name: "Live scores", description: "Ball-by-ball" }],
      siteKind: "consumer-craft",
      sportId: "cricket",
      primaryCta: "Open live",
    });
    const { spec, previewHtml } = designFromFeatures(brief);
    expect(spec.researchPlan.researchNodes).toContain("sport-site-research");
    expect(spec.researchPlan.followOnCraft).toEqual(
      expect.arrayContaining(["sport-matchday-web", "sport-vernacular-craft"]),
    );
    expect(spec.routedSkills).toEqual(
      expect.arrayContaining(["sport-matchday-web", "sport-vernacular-craft", "editorial-chapter-craft"]),
    );
    // Pack nav should surface Core-six paths, not only hash anchors.
    const nav = spec.sections.find((s) => s.kind === "nav");
    expect(nav?.navItems.some((n) => n.href.startsWith("/crease"))).toBe(true);
    expect(previewHtml).toMatch(/data-research-nodes="[^"]*sport-site-research/);
  });

  it("expands agency craft aliases into engine SkillNodeIds", () => {
    const brief = DesignBrief.parse({
      productName: "Lensroom",
      features: [{ id: "p1", name: "Sessions" }],
      siteKind: "art-directed-studio",
      primaryCta: "Book a call",
      craftNodes: ["image-first-fold", "agency-minimal-grid"],
    });
    const resolved = resolveRequestedCraft(brief);
    expect(resolved).toEqual(
      expect.arrayContaining(["hero-section", "editorial-chapter-craft", "paper-technical-frame"]),
    );
    const analysis = analyzeFeatures(brief);
    const taste = resolveTaste(brief);
    const skills = routeSkills(analysis, taste, { brief });
    expect(skills).toContain("hero-section");
    expect(skills).toContain("paper-technical-frame");
    expect(skills).toContain("responsive-performance");
  });

  it("parses craft nodes from constraints string when craftNodes field empty", () => {
    const brief = DesignBrief.parse({
      productName: "Acme",
      features: [{ id: "f1", name: "Capture" }],
      siteKind: "saas-marketing",
      primaryCta: "Book a demo",
      constraints: ["craft nodes: conversion-landing-craft, product-proof-stage"],
    });
    expect(resolveRequestedCraft(brief)).toEqual(
      expect.arrayContaining(["conversion-landing-craft", "product-proof-stage"]),
    );
  });
});
