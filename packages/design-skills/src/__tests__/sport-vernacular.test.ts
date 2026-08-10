import { describe, expect, it } from "vitest";
import { DesignBrief } from "../types";
import { analyzeFeatures } from "../analyze";
import { routeSkills } from "../route";
import { resolveTaste } from "../orchestrate";
import {
  getSportPack,
  listSportPacks,
  matchSportFromQuery,
  sportResearchBriefTemplate,
} from "../sport-vernacular";

describe("sport vernacular engine", () => {
  it("ships four sport packs with glance primary facts", () => {
    const packs = listSportPacks();
    expect(packs.map((p) => p.id)).toEqual(["cricket", "football", "hockey", "tennis"]);
    for (const pack of packs) {
      expect(pack.primaryFacts.length).toBeGreaterThanOrEqual(3);
      expect(pack.formatLenses.length).toBeGreaterThanOrEqual(2);
      expect(pack.uxRules.length).toBeGreaterThanOrEqual(2);
      expect(pack.craftNodes[0]).toBe("sport-vernacular-craft");
    }
  });

  it("matches cricket query language and exposes over/situation facts", () => {
    const pack = matchSportFromQuery("build a cricket live scores site with T20 and Test");
    expect(pack?.id).toBe("cricket");
    const cricket = getSportPack("cricket");
    expect(cricket.primaryFacts.some((f) => /situation/i.test(f.label))).toBe(true);
    expect(cricket.primaryFacts.some((f) => /this-over|over trail/i.test(f.label))).toBe(true);
    expect(cricket.formatLenses.map((f) => f.id)).toEqual(
      expect.arrayContaining(["test", "odi", "t20"]),
    );
  });

  it("routes sport-vernacular-craft when brief.sportId is set", () => {
    const brief = DesignBrief.parse({
      productName: "CREASE",
      tagline: "Scores between overs",
      audience: "cricket fans",
      businessGoal: "activation",
      siteKind: "dashboard-webapp",
      lockSiteKind: true,
      sportId: "cricket",
      features: [
        {
          id: "c1",
          name: "Score spine",
          description: "Stable runs and wickets",
          priority: "p0",
        },
      ],
    });
    const analysis = analyzeFeatures(brief);
    expect(analysis.sportId).toBe("cricket");
    const taste = resolveTaste(brief);
    const skills = routeSkills(analysis, taste);
    expect(skills[0]).toBe("website-domain-research");
    expect(skills).toContain("sport-matchday-web");
    expect(skills).toContain("sport-vernacular-craft");
  });

  it("infers sport from feature language without explicit sportId", () => {
    const brief = DesignBrief.parse({
      productName: "BASELINE",
      tagline: "Court board",
      audience: "tennis fans",
      businessGoal: "activation",
      siteKind: "art-directed-studio",
      lockSiteKind: true,
      features: [
        {
          id: "t1",
          name: "Break point board",
          description: "Sets games points with tie-break pressure",
          priority: "p0",
        },
      ],
    });
    const analysis = analyzeFeatures(brief);
    expect(analysis.sportId).toBe("tennis");
  });

  it("emits a research brief template that gates design", () => {
    const md = sportResearchBriefTemplate("cricket");
    expect(md).toContain("Do not design or code");
    expect(md).toContain("Format lenses");
    expect(md).toContain("Category gaps");
  });
});
