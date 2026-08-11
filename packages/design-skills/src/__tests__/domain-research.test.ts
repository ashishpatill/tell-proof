import { describe, expect, it } from "vitest";
import {
  CRICKET_CORE_SIX_ROUTES,
  DomainResearchPack,
  getSportPack,
  loadPriorDomain,
  requirementGapDiff,
  routeDomainResearchSkills,
  sportPackToDomainResearch,
} from "../index";
import { DesignBrief } from "../types";

describe("DomainResearchPack (general)", () => {
  it("loads saas-marketing without sportId", () => {
    const pack = loadPriorDomain("saas-marketing");
    expect(pack).toBeDefined();
    expect(pack!.domainId).toBe("saas-marketing");
    expect(pack!.multiPageRoutes.length).toBeGreaterThan(0);
    expect(() => DomainResearchPack.parse(pack)).not.toThrow();
  });

  it("routeDomainResearchSkills works for generic website brief", () => {
    const brief = DesignBrief.parse({
      productName: "Northline",
      features: [{ id: "f1", name: "Capture" }],
      siteKind: "saas-marketing",
      primaryCta: "Book a demo",
    });
    const plan = routeDomainResearchSkills({ brief });
    expect(plan.domainId).toBe("saas-marketing");
    expect(plan.researchNodes[0]).toBe("load-prior-domain");
    expect(plan.researchNodes).toContain("emit-training-episode");
    expect(plan.followOnCraft).not.toContain("sport-vernacular-craft");
  });

  it("loads signal-observatory desk pack for craft redesign", () => {
    const pack = loadPriorDomain("signal-observatory");
    expect(pack).toBeDefined();
    expect(pack!.siteKindHint).toBe("signal-observatory");
    expect(pack!.uxRules.some((r) => /Instrument time/i.test(r))).toBe(true);
    expect(pack!.categoryGaps.some((g) => /Essay\+aside/i.test(g))).toBe(true);
    const gap = requirementGapDiff("signal-observatory");
    expect(gap.packFound).toBe(true);
    expect(gap.needsWalkthrough).toBe(false);
  });
});

describe("DomainResearchPack (sport / cricket)", () => {
  it("maps cricket vernacular into DomainResearchPack with Core six + secondary directory", () => {
    const sport = getSportPack("cricket");
    expect(sport.multiPageRoutes?.length).toBe(10);
    const domain = sportPackToDomainResearch(sport);
    expect(domain.domainId).toBe("sport:cricket");
    expect(domain.multiPageRoutes.map((r) => r.routeClass)).toEqual(
      expect.arrayContaining(CRICKET_CORE_SIX_ROUTES.map((r) => r.routeClass)),
    );
    expect(domain.multiPageRoutes.map((r) => r.routeClass)).toEqual(
      expect.arrayContaining(["fixtures", "teams", "players", "stats"]),
    );
    expect(domain.navInventory).toHaveLength(6);
    expect(domain.shellContract.primaryNavMaxItems).toBe(6);
    expect(domain.shellContract.stickyRegions).toContain("score-spine");
    expect(() => DomainResearchPack.parse(domain)).not.toThrow();
  });

  it("loadPriorDomain accepts sport:cricket and cricket", () => {
    expect(loadPriorDomain("sport:cricket")?.label).toBe("Cricket");
    expect(loadPriorDomain("cricket")?.multiPageRoutes.length).toBe(10);
  });

  it("routes sport brief through research then sport craft", () => {
    const brief = DesignBrief.parse({
      productName: "CREASE",
      features: [{ id: "live", name: "Live scores" }],
      siteKind: "consumer-craft",
      sportId: "cricket",
      primaryCta: "Open live",
    });
    const plan = routeDomainResearchSkills({
      brief,
      requiredRouteClasses: ["home", "live-match", "scorecard", "series", "rankings", "notebook"],
    });
    expect(plan.gap.packFound).toBe(true);
    expect(plan.gap.needsWalkthrough).toBe(false);
    expect(plan.researchNodes).toEqual([
      "load-prior-domain",
      "requirement-gap-diff",
      "ia-shell-synthesis",
      "variant-lens",
      "emit-training-episode",
    ]);
    expect(plan.followOnCraft).toContain("sport-matchday-web");
    expect(plan.followOnCraft).toContain("sport-vernacular-craft");
  });

  it("flags walkthrough when required route class missing", () => {
    const gap = requirementGapDiff("sport:football", {
      requiredRouteClasses: ["notebook"],
    });
    expect(gap.needsWalkthrough).toBe(true);
    expect(gap.gaps.some((g) => g.includes("notebook"))).toBe(true);
  });
});
