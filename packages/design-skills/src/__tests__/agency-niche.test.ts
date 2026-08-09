import { describe, expect, it } from "vitest";
import {
  briefFromNiche,
  directionMarkdown,
  matchNiche,
  slugifyRunId,
} from "../../../../scripts/agency-pipeline/niche";
import { DesignBrief } from "../index";

describe("agency niche → brief", () => {
  it("matches photography / saas / fintech queries", () => {
    expect(matchNiche("freelance photographer booking site").key).toBe("photography");
    expect(matchNiche("B2B SaaS demo landing for pipeline").key).toBe("saas");
    expect(matchNiche("fintech treasury payments walkthrough").key).toBe("fintech");
    expect(matchNiche("creative studio art direction portfolio").key).toBe("agency");
  });

  it("falls back to photography default for unknown queries", () => {
    expect(matchNiche("completely unrelated widget").key).toBe("photography");
  });

  it("builds a parseable DesignBrief with CTA + craft constraints", () => {
    const preset = matchNiche("portrait photographer sessions");
    const brief = briefFromNiche(preset, {
      query: "portrait photographer sessions",
      productName: "Daylight Co",
      primaryCta: "Reserve a session",
    });
    const parsed = DesignBrief.parse(brief);
    expect(parsed.productName).toBe("Daylight Co");
    expect(parsed.primaryCta).toBe("Reserve a session");
    expect(parsed.siteKind).toBe("art-directed-studio");
    expect(parsed.constraints?.some((c) => c.includes("agency-minimal-grid"))).toBe(true);
  });

  it("slugifies run ids and fills DIRECTION rigor fields", () => {
    expect(slugifyRunId("Daylight Co!!")).toBe("daylight-co");
    const md = directionMarkdown(matchNiche("saas product demo"), "saas demo", "corridor-fallback");
    expect(md).toMatch(/Visual thesis/i);
    expect(md).toMatch(/Compositional lane/i);
    expect(md).toContain("conversion-landing-craft");
  });
});
