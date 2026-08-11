import { describe, expect, it } from "vitest";
import { briefFromNiche, matchNiche } from "../../../../scripts/agency-pipeline/niche";
import {
  assertBasics,
  assertSkillWiring,
  designFromFeatures,
  formatResearchGateMarkdown,
  listTemplates,
  SHOWCASE_BRIEFS,
} from "../index";

describe("assertSkillWiring (RSI gate)", () => {
  it("passes for every showcase template", () => {
    for (const [key, brief] of Object.entries(SHOWCASE_BRIEFS)) {
      const { spec, previewHtml } = designFromFeatures(brief!);
      const wiring = assertSkillWiring(spec, previewHtml);
      expect(wiring.passed, `${key}: ${wiring.findings.filter((f) => !f.ok).map((f) => f.id).join(",")}`).toBe(
        true,
      );
      expect(wiring.executeChecklist.some((c) => c.includes("responsive-performance"))).toBe(true);
      const md = formatResearchGateMarkdown(spec, wiring);
      expect(md).toMatch(/## Execute \(required every run\)/);
      expect(md).toContain("load-prior-domain");
    }
  });

  it("passes for every DESIGN_TEMPLATES entry via assertBasics", () => {
    for (const t of listTemplates()) {
      const { spec, previewHtml } = designFromFeatures(t.brief);
      const basics = assertBasics(spec, previewHtml);
      const wiringFails = basics.findings.filter((f) => f.id.startsWith("wiring-") && !f.ok);
      expect(wiringFails, t.key).toEqual([]);
    }
  });

  it("fails when followOnCraft is stripped from routedSkills (regression lock)", () => {
    const { spec, previewHtml } = designFromFeatures(
      SHOWCASE_BRIEFS.saas ?? {
        productName: "X",
        features: [{ id: "1", name: "A" }],
        primaryCta: "Go",
      },
    );
    const broken = {
      ...spec,
      routedSkills: spec.routedSkills.filter((s) => s !== "responsive-performance"),
    };
    const wiring = assertSkillWiring(broken, previewHtml.replace(/data-responsive-performance="required"/g, ""));
    expect(wiring.passed).toBe(false);
    expect(wiring.findings.some((f) => f.id === "wiring-responsive" && !f.ok)).toBe(true);
  });

  it("agency niche briefs keep craftNodes merged and RESEARCH_GATE-ready", () => {
    for (const query of [
      "freelance photographer booking site",
      "B2B SaaS demo landing",
      "cricket live scores T20",
      "tennis break point tie-break",
    ]) {
      const preset = matchNiche(query);
      const brief = briefFromNiche(preset, { query });
      const { spec, previewHtml } = designFromFeatures(brief);
      const wiring = assertSkillWiring(spec, previewHtml);
      expect(wiring.passed, query).toBe(true);
      expect(spec.brief.craftNodes?.length).toBeGreaterThan(0);
      if (preset.sportId) {
        expect(spec.researchPlan.researchNodes).toContain("sport-site-research");
      }
    }
  });
});
