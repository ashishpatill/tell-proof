import { describe, expect, it } from "vitest";
import { designFromFeatures } from "../orchestrate";
import { SHOWCASE_BRIEFS, listTemplates } from "../templates";
import { assertBasics } from "../basics-checklist";
import { contrastHex } from "../color";
import { buildPalette } from "../palette";
import { buildTypeLadder } from "../scale";
import { DesignBrief, SkillNodeId, type ColorMood } from "../types";

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
  "product-proof-stage",
  "conversion-landing-craft",
  "pricing-decision-craft",
  "scroll-reveal-once",
  "indexed-detail-markers",
  "honest-integration-marks",
  "paper-technical-frame",
  "split-panel-technical",
  "edge-fade-craft",
  "elevation-depth-tokens",
  "editorial-chapter-craft",
  "scrub-sequence-craft",
  "operational-governance-craft",
  "wireframe-annotation-craft",
  "ambient-atmosphere-craft",
  "signal-beam-craft",
  "glass-shell-craft",
  "container-tech-shell",
];

const MOODS: ColorMood[] = ["neutral-professional", "soft-brand-accent", "dark-premium", "light-airy"];

describe("premium-content-custom-web engine", () => {
  it("builds a saas marketing design with routed skills and preview html", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(spec.brief.siteKind).toBe("saas-marketing");
    expect(spec.routedSkills).toContain("hero-section");
    expect(spec.routedSkills).toContain("pricing-or-plans");
    expect(spec.routedSkills).toContain("design-system-foundation");
    expect(spec.routedSkills).toContain("product-proof-stage");
    expect(spec.sections.some((s) => s.kind === "hero")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "workflow-proof")).toBe(true);
    expect(previewHtml).toContain("Northstar");
    expect(previewHtml).toContain("Account scoring");
    expect(previewHtml).toContain('data-motion="subtle-micro"');
    expect(previewHtml).toContain(":focus-visible");
    expect(previewHtml).toContain("Skip to content");
    expect(previewHtml).toContain("data-workflow-proof");
    expect(previewHtml).toContain("htmx.org");
    expect(previewHtml).toContain("Sample workflow");
    expect(previewHtml).toContain("Human gate");
    expect(previewHtml).toContain('data-workflow-step="approve"');
    expect(spec.routedSkills).toContain("conversion-landing-craft");
    expect(spec.routedSkills).toContain("pricing-decision-craft");
    expect(previewHtml).toContain("data-pricing-cadence");
    expect(previewHtml).toContain("ds-cadence");
    expect(previewHtml).toContain("ds-index-mark");
    expect(previewHtml).toContain("ds-tech-brackets");
    expect(previewHtml).toMatch(/Can we cancel|reversible|Cancel anytime/i);
  });

  it("builds a dashboard webapp around a real application shell", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.dashboard!);
    expect(spec.brief.siteKind).toBe("dashboard-webapp");
    expect(spec.routedSkills).toContain("dashboard-or-webapp-ui");
    expect(spec.routedSkills).not.toContain("pricing-or-plans");
    expect(spec.routedSkills).toContain("ambient-atmosphere-craft");
    expect(spec.routedSkills).toContain("signal-beam-craft");
    expect(spec.routedSkills).toContain("glass-shell-craft");
    expect(spec.sections.filter((s) => s.layout === "app-shell")).toHaveLength(1);
    expect(previewHtml).toContain("Priority queue");
    expect(previewHtml).toContain("ds-app-side");
    expect(previewHtml).toContain('aria-current="page"');
    expect(previewHtml).toContain('data-app-shell');
    expect(previewHtml).toContain('data-rail="priority"');
    expect(previewHtml).toContain('ds-priority-chip');
    expect(previewHtml).toMatch(/<button[^>]*class="[^"]*ds-priority-chip/);
    expect(previewHtml).toMatch(/<button[^>]*class="[^"]*ds-app-nav-item[^"]*"[^>]*data-view=/);
    // Dense product surfaces still need an empty state, not just a happy path.
    expect(previewHtml).toContain("ds-empty");
    // Constrained atmosphere learned from particle/beam crafts — static, not spectacle.
    expect(previewHtml).toContain('data-atmosphere="static"');
    expect(previewHtml).toContain("ds-atmosphere-motes");
    expect(previewHtml).toContain("ds-accent-beam");
  });

  it("builds a corporate story surface with editorial chapters", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
    expect(spec.brief.siteKind).toBe("corporate-story");
    expect(spec.taste.aestheticLean).toBe("refined-story");
    expect(spec.tellDirectionId).toBe("explainer");
    expect(spec.sections.some((s) => s.kind === "story")).toBe(true);
    expect(previewHtml).toContain("ds-chapter");
    expect(previewHtml).toContain("IntersectionObserver");
  });

  it("builds an educational surface with a teaching figure", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.educational!);
    expect(spec.brief.siteKind).toBe("docs-educational");
    expect(spec.sections.some((s) => s.layout === "hero-mechanism")).toBe(true);
    expect(previewHtml).toContain("Signal Path");
    expect(previewHtml).toContain('data-instrument="scrub"');
    expect(previewHtml).toContain('data-figure="mechanism-plate"');
    expect(previewHtml).toContain("<figcaption data-scrub-caption>");
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

  it("honors taste control overrides", () => {
    const brief = DesignBrief.parse({
      ...SHOWCASE_BRIEFS.saas!,
      taste: { aestheticLean: "minimal-clean", motion: "none", density: "sparse", colorMood: "dark-premium" },
    });
    const { spec, previewHtml } = designFromFeatures(brief);
    expect(spec.taste.aestheticLean).toBe("minimal-clean");
    expect(spec.taste.motion).toBe("none");
    expect(previewHtml).toContain('data-lean="minimal-clean"');
    expect(spec.routedSkills).not.toContain("restrained-motion-micro");
  });

  it("customizes content to declared features only", () => {
    const brief = DesignBrief.parse({
      productName: "Ledgerly",
      tagline: "Close books without the chase",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "1", name: "Bank match", description: "Auto-matches transactions against the ledger", priority: "p0" },
        { id: "2", name: "Close checklist", description: "The month-end workflow with owners attached", priority: "p0" },
        { id: "3", name: "Accrual rules", description: "Recurring accruals posted without a reminder", priority: "p1" },
      ],
    });
    const { previewHtml, spec } = designFromFeatures(brief);
    expect(previewHtml).toContain("Bank match");
    expect(previewHtml).toContain("Close checklist");
    expect(previewHtml).not.toContain("Account scoring");
    expect(spec.brief.features.map((f) => f.name)).toEqual(["Bank match", "Close checklist", "Accrual rules"]);
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
          { id: "1", name: "Stock heatmaps", description: "Shows aging inventory before it becomes a writedown", priority: "p0" },
          { id: "2", name: "Reorder alerts", description: "Fires on lead time, not on a fixed threshold", priority: "p0" },
          { id: "3", name: "Supplier scorecards", description: "On-time and quality history behind every reorder", priority: "p1" },
        ],
        taste: { aestheticLean: "system-crafted", motion: "subtle-micro" },
      }),
      { redesignFrom: first.spec },
    );
    expect(second.previewHtml).toContain("Harbor");
    expect(second.previewHtml).toContain("Stock heatmaps");
    expect(second.previewHtml).not.toContain("Account scoring");
    expect(second.spec.taste.aestheticLean).toBe("system-crafted");
    expect(second.redesigned).toBe(true);
    expect(second.spec.customizationHints.some((h) => h.includes("Redesign from Northstar"))).toBe(true);
  });

  it("auto-detects dashboard from feature language when unlocked", () => {
    const { spec } = designFromFeatures(
      DesignBrief.parse({
        productName: "Ops",
        tagline: "Daily console",
        siteKind: "saas-marketing",
        lockSiteKind: false,
        features: [{ id: "1", name: "Admin console", description: "Workspace analytics dashboard", priority: "p0" }],
      }),
    );
    expect(spec.brief.siteKind).toBe("dashboard-webapp");
    expect(spec.routedSkills).toContain("dashboard-or-webapp-ui");
  });

  it("rejects CSS-injecting brandAccent", () => {
    expect(() =>
      DesignBrief.parse({
        productName: "Safe",
        siteKind: "saas-marketing",
        lockSiteKind: true,
        features: [{ id: "1", name: "One", description: "Only", priority: "p0" }],
        brandAccent: "red;} body{display:none} .x{",
      }),
    ).toThrow();
  });
});

describe("measured craft floors", () => {
  it("solves ink ramps against the page so every tone clears its contrast floor", () => {
    for (const mood of MOODS) {
      const p = buildPalette(mood);
      expect(p.contrast.bodyOnPaper, `${mood} body`).toBeGreaterThanOrEqual(11);
      expect(p.contrast.secondaryOnPaper, `${mood} secondary`).toBeGreaterThanOrEqual(6.5);
      expect(p.contrast.tertiaryOnPaper, `${mood} tertiary`).toBeGreaterThanOrEqual(4.5);
      expect(p.contrast.inkOnAccent, `${mood} on accent`).toBeGreaterThanOrEqual(4.5);
      expect(p.contrast.inkOnInverse, `${mood} inverse`).toBeGreaterThanOrEqual(11);
    }
  });

  it("keeps surfaces distinguishable without relying on shadow", () => {
    for (const mood of MOODS) {
      const p = buildPalette(mood);
      const levels = [p.paper, p.paperRaised, p.paperSunken, p.inverse];
      expect(new Set(levels).size).toBe(4);
      // Adjacent surfaces must differ enough to be seen, but not so much that they read as bands.
      expect(contrastHex(p.paper, p.paperRaised)).toBeGreaterThan(1.01);
      expect(contrastHex(p.paper, p.paperRaised)).toBeLessThan(1.6);
    }
  });

  it("adopts a supplied brand accent without breaking the contrast floor", () => {
    const p = buildPalette("light-airy", "#B23A1F");
    expect(p.contrast.inkOnAccent).toBeGreaterThanOrEqual(4.5);
    expect(p.contrast.bodyOnPaper).toBeGreaterThanOrEqual(11);
  });

  it("builds a type ladder inside the measured range and step corridors", () => {
    const ladder = buildTypeLadder({
      density: "balanced",
      typographyWeight: "medium-modern",
      displayPx: 68,
      bodyPx: 17,
      ratio: 1.414,
    });
    expect(ladder.steps.length).toBeGreaterThanOrEqual(9);
    expect(ladder.rangeRatio).toBeGreaterThanOrEqual(4);
    expect(ladder.rangeRatio).toBeLessThanOrEqual(9);
    // Display leading under 1.15 is the clearest single signal of typographic intent.
    expect(ladder.byName.display!.lineHeight).toBeLessThanOrEqual(1.14);
    expect(ladder.byName.body!.lineHeight).toBeGreaterThanOrEqual(1.4);
    expect(ladder.byName.display!.trackingEm).toBeLessThan(0);
    expect(ladder.byName.micro!.trackingEm).toBeGreaterThan(0);
  });

  it("declares a token system rather than hard-coding values", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(spec.tokens.declared).toBeGreaterThanOrEqual(100);
    const declaredInCss = (previewHtml.match(/--[a-z0-9-]+\s*:/g) ?? []).length;
    expect(declaredInCss).toBeGreaterThanOrEqual(100);
  });

  it("gives every site kind a long enough argument and enough named parts", () => {
    for (const [name, brief] of Object.entries(SHOWCASE_BRIEFS)) {
      const { spec, previewHtml } = designFromFeatures(brief);
      expect(spec.sections.length, `${name} sections`).toBeGreaterThanOrEqual(7);
      const headings = (previewHtml.match(/<h[1-4][\s>]/g) ?? []).length;
      expect(headings, `${name} headings`).toBeGreaterThanOrEqual(16);
      expect(new Set(spec.sections.map((s) => s.surface)).size, `${name} surfaces`).toBeGreaterThanOrEqual(3);
      expect(new Set(spec.sections.map((s) => s.layout)).size, `${name} layouts`).toBeGreaterThanOrEqual(6);
    }
  });

  it("keeps motion off anything the reader cannot touch", () => {
    const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(previewHtml).toContain("prefers-reduced-motion");
    expect(previewHtml).not.toMatch(/\*\s*\{[^}]*transition:/);
    expect(previewHtml).not.toContain("animation-iteration-count:infinite");
  });

  it("emits no raw hex outside the token block", () => {
    const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
    const styleBlock = previewHtml.slice(previewHtml.indexOf("<style>"), previewHtml.indexOf("</style>"));
    const afterRoot = styleBlock.slice(styleBlock.indexOf("}"));
    expect(afterRoot).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("uses asymmetric columns on split layouts", () => {
    const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    const splits = previewHtml.match(/style="grid-template-columns:[^";]+/g) ?? [];
    expect(splits.length).toBeGreaterThan(0);
    const asymmetric = splits.filter((s) => {
      const fr = Array.from(s.matchAll(/(\d+(?:\.\d+)?)fr/g)).map((m) => Number(m[1]));
      return fr.length === 2 && fr[0] !== fr[1];
    });
    expect(asymmetric.length).toBeGreaterThan(0);
  });

  it("gives every split column a floor so text cannot be squeezed to one word per line", () => {
    const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
    const splits = previewHtml.match(/style="grid-template-columns:[^";]+/g) ?? [];
    const bare = splits.filter((s) => /\d+fr\s+\d+fr/.test(s));
    expect(bare).toEqual([]);
  });
});

describe("research-backed offerings + implementation basics", () => {
  it("keeps a depth-first offering catalog with measured gap kinds filled", () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(15);
    expect(templates.map((t) => t.key).sort()).toEqual([
      "archive",
      "consumer",
      "corporate",
      "dashboard",
      "dossier",
      "educational",
      "fintech",
      "foundry",
      "herbarium",
      "lantern",
      "loom",
      "observatory",
      "press",
      "saas",
      "studio",
    ]);
    for (const t of templates) {
      expect(t.marketJob.length).toBeGreaterThan(20);
      expect(t.researchBasis.length).toBeGreaterThan(20);
    }
    const fintech = templates.find((t) => t.key === "fintech")!;
    expect(fintech.siteKind).toBe("fintech-marketing");
    const studio = templates.find((t) => t.key === "studio")!;
    expect(studio.siteKind).toBe("art-directed-studio");
    const consumer = templates.find((t) => t.key === "consumer")!;
    expect(consumer.siteKind).toBe("consumer-craft");
    const foundry = templates.find((t) => t.key === "foundry")!;
    expect(foundry.siteKind).toBe("editorial-foundry");
    const dossier = templates.find((t) => t.key === "dossier")!;
    expect(dossier.siteKind).toBe("research-dossier");
    const observatory = templates.find((t) => t.key === "observatory")!;
    expect(observatory.siteKind).toBe("signal-observatory");
    const archive = templates.find((t) => t.key === "archive")!;
    expect(archive.siteKind).toBe("archive-index");
    const loom = templates.find((t) => t.key === "loom")!;
    expect(loom.siteKind).toBe("commerce-loom");
    const herbarium = templates.find((t) => t.key === "herbarium")!;
    expect(herbarium.siteKind).toBe("field-guide");
    const press = templates.find((t) => t.key === "press")!;
    expect(press.siteKind).toBe("press-atelier");
    const lantern = templates.find((t) => t.key === "lantern")!;
    expect(lantern.siteKind).toBe("lantern-path");
  });

  it("gives fintech an inverse-heavy plan distinct from SaaS conversion", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.fintech!);
    expect(spec.brief.siteKind).toBe("fintech-marketing");
    const inverse = spec.sections.filter((s) => s.surface === "inverse").map((s) => s.kind);
    expect(inverse.filter((k) => k === "metrics" || k === "specimen" || k === "proof" || k === "cta").length).toBeGreaterThanOrEqual(3);
    expect(previewHtml).toContain('data-sitekind="fintech-marketing"');
    expect(previewHtml).toContain("ds-hero-overfigure");
    expect(previewHtml).toContain("ds-proof-board");
  });

  it("gives studio a paper-led selected-work plan distinct from SaaS and fintech", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.studio!);
    expect(spec.brief.siteKind).toBe("art-directed-studio");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "feature-alternating")).toBe(true);
    expect(spec.sections.some((s) => s.kind === "story")).toBe(true);
    expect(spec.sections.some((s) => s.kind === "figure")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBeLessThanOrEqual(1);
    expect(previewHtml).toContain('data-sitekind="art-directed-studio"');
    expect(previewHtml).toContain("ds-hero-stackfold");
    expect(previewHtml).toContain("ds-hero-claimband");
    expect(previewHtml).toMatch(/<section id="top"[^>]*ds-hero-stackfold/);
    expect(previewHtml).not.toMatch(/<section id="top"[^>]*ds-hero-overfigure/);
    expect(previewHtml).toContain("Selected work");
  });

  it("gives consumer craft a figure-forward plan without a SaaS pricing ladder", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.consumer!);
    expect(spec.brief.siteKind).toBe("consumer-craft");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "feature-alternating")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBeLessThanOrEqual(1);
    expect(previewHtml).toContain('data-sitekind="consumer-craft"');
    expect(previewHtml).toContain("ds-hero-claimband");
    expect(previewHtml).toContain("ds-hero-stackfold");
    expect(previewHtml).toContain("In hand");
  });

  it("gives editorial foundry a hard-seam + type-ladder plan distinct from studio and SaaS", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.foundry!);
    expect(spec.brief.siteKind).toBe("editorial-foundry");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-seam")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-marginalia")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="editorial-foundry"');
    expect(previewHtml).toContain("ds-hero-seam");
    expect(previewHtml).toContain("ds-spine");
    expect(previewHtml).toContain('data-figure="type-ladder"');
    expect(previewHtml).toContain("ds-marginalia");
    expect(previewHtml).toContain("Colophon");
    expect(previewHtml).toContain("The cuts");
  });

  it("gives research dossier a folio + plate + spread plan distinct from foundry and SaaS", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.dossier!);
    expect(spec.brief.siteKind).toBe("research-dossier");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-folio")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-spread")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="research-dossier"');
    expect(previewHtml).toContain("ds-hero-folio");
    expect(previewHtml).toContain("ds-folio-masthead");
    expect(previewHtml).toContain("ds-chapter-rail");
    expect(previewHtml).toContain('data-figure="dossier-plate"');
    expect(previewHtml).toContain("ds-spread");
    expect(previewHtml).toContain("ds-footnote-register");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Imprint");
    expect(previewHtml).toContain("The instruments");
  });

  it("gives signal observatory a chrono + lattice plan distinct from dossier and SaaS", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.observatory!);
    expect(spec.brief.siteKind).toBe("signal-observatory");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-chrono")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-chrono")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="signal-observatory"');
    expect(previewHtml).toContain("ds-hero-chrono");
    expect(previewHtml).toContain("ds-chronometer");
    expect(previewHtml).toContain("ds-scrub-rail");
    expect(previewHtml).toContain('data-figure="signal-lattice"');
    expect(previewHtml).toContain("ds-chrono");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Calibration");
    expect(previewHtml).toContain("The channels");
  });

  it("gives archive index a register + ledger + entry plan distinct from dossier and observatory", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.archive!);
    expect(spec.brief.siteKind).toBe("archive-index");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-register")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-entry")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="archive-index"');
    expect(previewHtml).toContain("ds-hero-register");
    expect(previewHtml).toContain("ds-register-masthead");
    expect(previewHtml).toContain("ds-alpha-rail");
    expect(previewHtml).toContain('data-figure="index-ledger"');
    expect(previewHtml).toContain("ds-entry");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Registry");
    expect(previewHtml).toContain("The entries");
    expect(previewHtml).not.toContain('class="ds-chapter-rail"');
    expect(previewHtml).not.toContain('class="ds-scrub-rail"');
    expect(previewHtml).not.toContain('class="ds-chronometer"');
  });

  it("gives commerce loom a drawloom weft + treadles + hangtag plan distinct from soft card grids", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.loom!);
    expect(spec.brief.siteKind).toBe("commerce-loom");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-loom")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-hangtag")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="commerce-loom"');
    expect(previewHtml).toContain("ds-hero-drawloom");
    expect(previewHtml).toContain("ds-shed");
    expect(previewHtml).toContain("ds-shuttle");
    expect(previewHtml).toContain("ds-fell");
    expect(previewHtml).toContain("ds-weft-pick");
    expect(previewHtml).toContain("ds-treadles");
    expect(previewHtml).toContain('data-figure="loom-weave"');
    expect(previewHtml).toContain("ds-hangtag");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Care label");
    expect(previewHtml).toContain("The lines");
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
    expect(previewHtml).not.toContain('aria-label="Dichotomous key"');
  });

  it("gives field guide a glassine press + binomial + range plan distinct from glass hero collages", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.herbarium!);
    expect(spec.brief.siteKind).toBe("field-guide");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-voucher")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-range")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="field-guide"');
    expect(previewHtml).toContain("ds-hero-glassine");
    expect(previewHtml).toContain("ds-dissecting-tray");
    expect(previewHtml).toContain("ds-glassine-lid");
    expect(previewHtml).toContain("ds-specimen-tag");
    expect(previewHtml).toContain("ds-epin");
    expect(previewHtml).toContain("ds-binomial-strip");
    expect(previewHtml).toContain('data-figure="specimen-plate"');
    expect(previewHtml).toContain("ds-range");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Voucher");
    expect(previewHtml).toContain("The traits");
    expect(previewHtml).not.toContain('aria-label="Size treadles"');
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
  });

  it("gives press atelier a registration + press sheet + gather plan distinct from archive and dossier", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.press!);
    expect(spec.brief.siteKind).toBe("press-atelier");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-press")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-gather")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="press-atelier"');
    expect(previewHtml).toContain("ds-hero-press");
    expect(previewHtml).toContain("ds-press-masthead");
    expect(previewHtml).toContain("ds-sig-rail");
    expect(previewHtml).toContain('data-figure="press-sheet"');
    expect(previewHtml).toContain('data-dense="ink"');
    expect(previewHtml).toMatch(/data-figure="press-sheet"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="press-sheet"/);
    // Mini page folios — densify helper left page matter, not empty SIG voids.
    expect(previewHtml).toContain(">01</text>");
    expect(previewHtml).toContain("ds-gather");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Pressroom");
    expect(previewHtml).toContain("The plates");
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
    expect(previewHtml).not.toContain('class="ds-chapter-rail"');
    expect(previewHtml).not.toContain('class="ds-scrub-rail"');
    // Engine mono floor — no SVG figure labels below 11px.
    const svgSizes = [...previewHtml.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
    expect(svgSizes.every((n) => n >= 11)).toBe(true);
  });

  it("gives lantern path a waypoint rail + path plate + ember plan distinct from press and soft dark heroes", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.lantern!);
    expect(spec.brief.siteKind).toBe("lantern-path");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-path")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-ember")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="lantern-path"');
    expect(previewHtml).toContain("ds-hero-path");
    expect(previewHtml).toContain("ds-path-masthead");
    expect(previewHtml).toContain("ds-way-rail");
    expect(previewHtml).toContain('data-figure="path-plate"');
    expect(previewHtml).toContain('data-dense="ink"');
    expect(previewHtml).toMatch(/data-figure="path-plate"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="path-plate"/);
    expect(previewHtml).toContain("PATH ATLAS");
    expect(previewHtml).toContain("ds-ember");
    expect(previewHtml).toContain("ds-path-near");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Ember");
    expect(previewHtml).toContain("The chapters");
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
    expect(previewHtml).not.toContain('class="ds-sig-rail"');
    expect(previewHtml).not.toContain('class="ds-scrub-rail"');
    const svgSizes = [...previewHtml.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
    expect(svgSizes.every((n) => n >= 11)).toBe(true);
  });

  it("exposes reusable densify helpers for cell-grid figures", async () => {
    const { miniPageMatter, densitometerStrip, FIG_MONO_PX } = await import("../figures");
    expect(FIG_MONO_PX).toBe(11);
    const page = miniPageMatter(0, 0, 80, 100, 0, "07", () => 0.5);
    expect(page).toContain("var(--surface-muted)");
    expect(page).toContain(">07</text>");
    expect(page).toContain(`font-size="${FIG_MONO_PX}"`);
    const dens = densitometerStrip(0, 0, 200, 4);
    expect(dens).toContain("DENS");
    expect(dens).toContain("GRIP");
  });

  it("clears the implementation basics gate on every offering", () => {
    for (const t of listTemplates()) {
      const { spec, previewHtml } = designFromFeatures(t.brief);
      const report = assertBasics(spec, previewHtml);
      const failed = report.findings.filter((f) => !f.ok).map((f) => `${t.key}:${f.id} — ${f.detail}`);
      expect(failed, failed.join("\n")).toEqual([]);
    }
  });

  it("paints paper-technical footers opaque so paper ink never sits on the inverse outer field", () => {
    for (const key of ["saas", "dashboard"] as const) {
      const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS[key]!);
      expect(previewHtml).toContain('data-frame="paper-technical"');
      expect(previewHtml).toContain('<footer class="ds-footer"');
      expect(previewHtml).toMatch(/body\[data-frame="paper-technical"\][\s\S]*?\.ds-footer/);
      expect(previewHtml).not.toMatch(
        /body\[data-frame="paper-technical"\] #main,\s*body\[data-frame="paper-technical"\] \.ds-nav,\s*body\[data-frame="paper-technical"\] footer\.ds-section\{/,
      );
    }
  });

  it("fills the proof band with a dense evidence board instead of a lonely quote", () => {
    const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(previewHtml).toContain("ds-proof-board");
    expect(previewHtml).toContain("ds-proof-cell");
    expect(previewHtml).toContain("ds-proof-claim");
    expect(previewHtml).toContain("ds-story");
    expect(previewHtml).not.toContain("How to read this page");
    expect(previewHtml).not.toContain("min-height:min(140vh");
    const cells = previewHtml.match(/ds-proof-cell/g) ?? [];
    expect(cells.length).toBeGreaterThanOrEqual(4);
  });
});
