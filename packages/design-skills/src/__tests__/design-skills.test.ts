import { describe, expect, it } from "vitest";
import { designFromFeatures, SHOWCASE_BRIEFS } from "../orchestrate";
import { DesignBrief, SkillNodeId } from "../types";

const ALL_SKILLS: SkillNodeId[] = [
  "analyze-features-requirements",
  "design-system-foundation",
  "hero-section",
  "features-benefits",
  "pricing-or-plans",
  "navigation-header-footer",
  "content-storytelling-pages",
  "forms-ctas-conversion",
  "restrained-motion-micro",
  "dashboard-or-webapp-ui",
  "responsive-performance",
];

describe("premium-content-custom-web engine", () => {
  it("builds a saas marketing design with routed skills and preview html", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(spec.brief.siteKind).toBe("saas-marketing");
    expect(spec.routedSkills).toContain("hero-section");
    expect(spec.routedSkills).toContain("pricing-or-plans");
    expect(spec.routedSkills).toContain("design-system-foundation");
    expect(spec.routedSkills).toContain("forms-ctas-conversion");
    expect(spec.routedSkills).toContain("restrained-motion-micro");
    expect(spec.sections.some((s) => s.kind === "hero")).toBe(true);
    expect(previewHtml).toContain("Northstar");
    expect(previewHtml).toContain("Account scoring");
    expect(previewHtml).toContain('data-motion="subtle-micro"');
    expect(previewHtml).toContain("ds-brand-mark");
    expect(previewHtml).toContain(":focus-visible");
    expect(previewHtml).not.toContain("Starter — core features");
    expect(previewHtml).not.toContain("Growth — recommended");
  });

  it("builds a dashboard webapp as one shell composition", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.dashboard!);
    expect(spec.brief.siteKind).toBe("dashboard-webapp");
    expect(spec.routedSkills).toContain("dashboard-or-webapp-ui");
    expect(spec.routedSkills).not.toContain("pricing-or-plans");
    expect(spec.routedSkills).not.toContain("hero-section");
    expect(spec.sections.filter((s) => s.kind === "dashboard-shell")).toHaveLength(1);
    expect(spec.sections.some((s) => s.kind === "dashboard-main")).toBe(false);
    expect(previewHtml).toContain("Priority queue");
    expect(previewHtml).toContain('data-motion="none"');
    expect(previewHtml).toContain('class="ds-wrap ds-dash-grid"');
    expect(previewHtml).toContain("ds-side");
    expect(previewHtml).toContain("ds-main");
    expect((previewHtml.match(/class="ds-wrap ds-dash-grid"/g) || []).length).toBe(1);
  });

  it("builds a corporate story surface with refined lean chapters", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
    expect(spec.brief.siteKind).toBe("corporate-story");
    expect(spec.taste.aestheticLean).toBe("refined-story");
    expect(spec.tellDirectionId).toBe("explainer");
    expect(spec.routedSkills).toContain("content-storytelling-pages");
    expect(spec.sections.some((s) => s.kind === "story")).toBe(true);
    expect(previewHtml).toContain("Trust narrative");
    expect(previewHtml).toContain("ds-chapter");
    expect(previewHtml).toContain("IntersectionObserver");
  });

  it("builds an educational docs surface with a teaching figure", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.educational!);
    expect(spec.brief.siteKind).toBe("docs-educational");
    expect(spec.routedSkills).toContain("content-storytelling-pages");
    expect(spec.routedSkills).toContain("features-benefits");
    expect(spec.routedSkills).not.toContain("pricing-or-plans");
    expect(spec.sections.some((s) => s.kind === "figure")).toBe(true);
    expect(previewHtml).toContain("Interactive diagram");
    expect(previewHtml).toContain("Signal Path");
    expect(previewHtml).toContain('data-instrument="scrub"');
    expect(previewHtml).toContain("<figcaption>");
    expect(previewHtml).toContain('id="figure"');
  });

  it("covers every skill node across showcase kinds", () => {
    const seen = new Set<string>();
    for (const brief of Object.values(SHOWCASE_BRIEFS)) {
      const { spec } = designFromFeatures(brief);
      for (const skill of spec.routedSkills) seen.add(skill);
    }
    for (const skill of ALL_SKILLS) {
      expect(seen.has(skill), `missing skill coverage: ${skill}`).toBe(true);
    }
  });

  it("honors taste control overrides and lean layout divergence", () => {
    const brief = DesignBrief.parse({
      ...SHOWCASE_BRIEFS.saas!,
      taste: {
        aestheticLean: "minimal-clean",
        motion: "none",
        density: "sparse",
        colorMood: "dark-premium",
      },
    });
    const { spec, previewHtml } = designFromFeatures(brief);
    expect(spec.taste.aestheticLean).toBe("minimal-clean");
    expect(spec.taste.motion).toBe("none");
    expect(spec.tokens.paper).toBe("#121212");
    expect(previewHtml).toContain('data-aesthetic="minimal-clean"');
    expect(previewHtml).toContain('data-layout="minimal-clean"');
    expect(previewHtml).toContain("ds-stack");
    expect(spec.routedSkills).not.toContain("restrained-motion-micro");
  });

  it("customizes feature cards to declared product features only", () => {
    const brief = DesignBrief.parse({
      productName: "Ledgerly",
      tagline: "Close books without the chase",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "1", name: "Bank match", description: "Auto-match transactions", priority: "p0" },
        { id: "2", name: "Close checklist", description: "Month-end workflow", priority: "p0" },
      ],
    });
    const { previewHtml, spec } = designFromFeatures(brief);
    expect(previewHtml).toContain("Bank match");
    expect(previewHtml).toContain("Close checklist");
    expect(previewHtml).not.toContain("Account scoring");
    expect(previewHtml).toContain("ds-brand-mark");
    expect(spec.brief.features.map((f) => f.name)).toEqual(["Bank match", "Close checklist"]);
    expect(previewHtml).toContain('data-plan="Core"');
    expect(previewHtml).toContain("Bank match, Close checklist");
  });

  it("redesigns from scratch when features change", () => {
    const first = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    const second = designFromFeatures(
      DesignBrief.parse({
        productName: "Harbor",
        tagline: "Inventory clarity for operators",
        siteKind: "saas-marketing",
        lockSiteKind: true,
        features: [
          { id: "1", name: "Stock heatmaps", description: "See aging inventory instantly", priority: "p0" },
          { id: "2", name: "Reorder alerts", description: "Never miss a replenishment", priority: "p0" },
        ],
        taste: { aestheticLean: "system-crafted", motion: "subtle-micro" },
      }),
      { redesignFrom: first.spec },
    );
    expect(second.previewHtml).toContain("Harbor");
    expect(second.previewHtml).toContain("Stock heatmaps");
    expect(second.previewHtml).not.toContain("Account scoring");
    expect(first.previewHtml).toContain("Account scoring");
    expect(second.spec.taste.aestheticLean).toBe("system-crafted");
    expect(second.redesigned).toBe(true);
    expect(first.redesigned).toBe(false);
    expect(second.spec.customizationHints.some((h) => h.includes("Redesign from Northstar"))).toBe(true);
    expect(second.previewHtml).toContain("ds-token-strip");
  });

  it("auto-detects dashboard from feature language when unlocked", () => {
    const brief = DesignBrief.parse({
      productName: "Ops",
      tagline: "Daily console",
      siteKind: "saas-marketing",
      lockSiteKind: false,
      features: [{ id: "1", name: "Admin console", description: "Workspace analytics dashboard", priority: "p0" }],
    });
    const { spec } = designFromFeatures(brief);
    expect(spec.brief.siteKind).toBe("dashboard-webapp");
    expect(spec.routedSkills).toContain("dashboard-or-webapp-ui");
  });

  it("locks site kind when requested", () => {
    const brief = DesignBrief.parse({
      productName: "Ops",
      tagline: "Daily console",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [{ id: "1", name: "Admin console", description: "Workspace analytics dashboard", priority: "p0" }],
    });
    const { spec } = designFromFeatures(brief);
    expect(spec.brief.siteKind).toBe("saas-marketing");
    expect(spec.routedSkills).toContain("pricing-or-plans");
  });

  it("derives proof copy from features instead of stock filler", () => {
    const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(previewHtml).toContain("Outcome: Account scoring");
    expect(previewHtml).not.toContain("Case outcome tied to a real feature");
  });
});
