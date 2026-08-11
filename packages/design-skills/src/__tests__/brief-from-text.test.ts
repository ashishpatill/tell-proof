import { describe, expect, it } from "vitest";
import { DesignBrief, briefFromFreeText, designFromFeatures } from "../index";

describe("briefFromFreeText", () => {
  it("builds a saas brief from a demo-oriented query", () => {
    const { brief, plan } = briefFromFreeText(
      "B2B SaaS demo landing for pipeline coaching — warmer editorial, less shadow",
    );
    expect(DesignBrief.parse(brief).siteKind).toBe("saas-marketing");
    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
    const result = designFromFeatures(brief);
    expect(result.previewHtml.length).toBeGreaterThan(500);
    expect(result.spec.routedSkills.length).toBeGreaterThan(0);
  });

  it("routes photography language to art-directed studio", () => {
    const { brief } = briefFromFreeText("portrait photographer booking site with selected work");
    expect(brief.siteKind).toBe("art-directed-studio");
  });

  it("rejects empty query", () => {
    expect(() => briefFromFreeText("   ")).toThrow(/Describe the site/);
  });
});
