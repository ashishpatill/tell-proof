import { describe, expect, it } from "vitest";
import { analyzeFeatures } from "../analyze";
import { designFromFeatures } from "../orchestrate";
import { SHOWCASE_BRIEFS, listTemplates } from "../templates";
import { assertBasics } from "../basics-checklist";
import { contrastHex } from "../color";
import { renderCss } from "../css";
import { ACCENT_HUE_VARIANTS, buildPalette, pickAccentHue } from "../palette";
import { buildTypeLadder } from "../scale";
import { DesignBrief, SkillNodeId, type ColorMood } from "../types";
import { pathPlate } from "../figures";

/** Approval-language SaaS brief — still earns the interactive workflow-proof stage. */
function ledgerkeepBrief() {
  return DesignBrief.parse({
    productName: "Ledgerkeep",
    tagline: "Month-end drafts wait for a named approval before anything posts",
    audience: "controllers who sign the close",
    businessGoal: "demos",
    siteKind: "saas-marketing",
    lockSiteKind: true,
    features: [
      {
        id: "lk1",
        name: "Close drafts",
        description: "Every posting stays a draft until a named owner approves it",
        priority: "p0",
      },
      {
        id: "lk2",
        name: "Approval queue",
        description: "Controllers approve exceptions; nothing auto-applies behind the close",
        priority: "p0",
      },
      {
        id: "lk3",
        name: "Audit trail",
        description: "Who signed, when, and which draft they released",
        priority: "p1",
      },
      {
        id: "lk4",
        name: "Reversal path",
        description: "A failed posting returns to draft instead of vanishing",
        priority: "p1",
      },
      {
        id: "lk5",
        name: "Period lock",
        description: "Once approved, the period cannot silently reopen",
        priority: "p2",
      },
    ],
    taste: { aestheticLean: "conversion-sharp", motion: "light-scroll-reveals", colorMood: "neutral-professional" },
  });
}

const hasLiveWorkflow = (html: string) => /<section[^>]*\bdata-workflow-proof\b/.test(html);
const hasLiveBoard = (html: string) => /<ul[^>]*\bdata-proof-board\b/.test(html);

/** Brace depth at `index` — `{` +1, `}` −1. Nested `body[data-mood]` would compile to `body body[data-mood]`. */
function braceDepthAt(css: string, index: number): number {
  let depth = 0;
  for (let i = 0; i < index; i++) {
    const ch = css[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
  }
  return depth;
}

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
  "hero-entrance-once",
  "section-stagger-enter",
  "scroll-narrative-craft",
  "authored-motion-slot",
  "motion-stack-craft",
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
  "sport-vernacular-craft",
  "website-domain-research",
  "sport-matchday-web",
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
    expect(spec.routedSkills[0]).toBe("website-domain-research");
    expect(spec.customizationHints.some((h) => h.startsWith("Research gate:"))).toBe(true);
    expect(spec.sections.some((s) => s.kind === "hero")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "marquee-proof")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "workflow-proof")).toBe(false);
    expect(previewHtml).toContain("Northstar");
    expect(previewHtml).toContain("Account scoring");
    expect(previewHtml).toContain('data-motion="light-scroll-reveals"');
    expect(previewHtml).toContain("ds-enter");
    expect(previewHtml).toContain("animation-timeline:view()");
    expect(previewHtml).toContain(":focus-visible");
    expect(previewHtml).toContain("Skip to content");
    expect(hasLiveBoard(previewHtml)).toBe(true);
    expect(hasLiveWorkflow(previewHtml)).toBe(false);
    expect(previewHtml).not.toContain("htmx.org");
    expect(previewHtml).not.toContain("Sample workflow");
    expect(previewHtml).not.toContain("Human gate");
    expect(previewHtml).not.toContain('data-workflow-step="approve"');
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

  it("keeps the historical accent hue when no variant seed is passed", () => {
    for (const mood of MOODS) {
      expect(pickAccentHue(mood)).toBe(ACCENT_HUE_VARIANTS[mood]![0]);
      expect(buildPalette(mood).accent).toBe(buildPalette(mood, undefined, undefined).accent);
    }
  });

  it("varies accent hex by brief seed so ordinary products do not share one colour", () => {
    const seeds = ["Freightlane|accent", "Willowvet|accent", "Scalehouse|accent"];
    const accents = seeds.map((s) => buildPalette("neutral-professional", undefined, s).accent);
    expect(new Set(accents).size).toBeGreaterThan(1);
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

  it("emits soft-brand-accent mood as a top-level body sibling, not nested under body{}", () => {
    const { spec } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    const css = renderCss(spec);
    const needle = 'body[data-mood="soft-brand-accent"]';
    let from = 0;
    let found = 0;
    while (from < css.length) {
      const idx = css.indexOf(needle, from);
      if (idx < 0) break;
      found += 1;
      expect(braceDepthAt(css, idx), `nested ${needle} at index ${idx} would compile to body ${needle}`).toBe(0);
      from = idx + needle.length;
    }
    expect(found, "soft-brand-accent mood selector missing from generated CSS").toBeGreaterThan(0);
    expect(css).toContain(
      "radial-gradient(ellipse 90% 55% at 80% -8%,color-mix(in srgb,var(--c-accent) 5%,transparent),transparent 60%)",
    );
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
    // Ban universal `* { transition }` — not child combinators like `.ds-stagger > *`.
    expect(previewHtml).not.toMatch(/(?:^|[,{;])\s*\*\s*\{[^}]*\btransition\s*:/m);
    expect(previewHtml).not.toMatch(/\*,\*?::before,\*?::after\{[^}]*\btransition\s*:/);
    expect(previewHtml).not.toContain("animation-iteration-count:infinite");
  });

  it("ships distinct motion signatures per site kind", () => {
    const saas = designFromFeatures(SHOWCASE_BRIEFS.saas!).previewHtml;
    const consumer = designFromFeatures(SHOWCASE_BRIEFS.consumer!).previewHtml;
    const foundry = designFromFeatures(SHOWCASE_BRIEFS.foundry!).previewHtml;
    const fintech = designFromFeatures(SHOWCASE_BRIEFS.fintech!).previewHtml;
    expect(saas).toContain("ds-saas-in");
    expect(consumer).toContain("ds-consumer-in");
    expect(consumer).toContain("ds-consumer-in-alt");
    expect(foundry).toContain("ds-foundry-mask");
    expect(fintech).toContain("ds-fin-in");
    expect(saas).not.toContain("ds-consumer-in");
    expect(consumer).not.toContain("ds-fin-in");
    expect(foundry).not.toContain("ds-saas-in");
  });

  it("ships hero entrance + stagger + view-timeline for scroll reveals", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(spec.taste.motion).toBe("light-scroll-reveals");
    expect(spec.routedSkills).toContain("hero-entrance-once");
    expect(spec.routedSkills).toContain("section-stagger-enter");
    expect(previewHtml).toContain("ds-reveal");
    expect(previewHtml).toContain("ds-stagger");
    expect(previewHtml).toContain("--m-stagger");
    expect(previewHtml).toContain("--enter-i:");
  });

  it("pins one scroll chapter for narrative motion", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.studio!);
    expect(spec.taste.motion).toBe("scroll-narrative");
    expect(spec.routedSkills).toContain("scroll-narrative-craft");
    expect(previewHtml).toContain("ds-chapter-pin");
    expect(previewHtml).toContain("ds-chapter-progress");
  });

  it("reserves authored motion slot for immersive tier", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.lantern!);
    expect(spec.taste.motion).toBe("immersive");
    expect(spec.routedSkills).toContain("authored-motion-slot");
    expect(previewHtml).toContain('data-authored-slot="empty"');
  });

  it("routes motion-stack-craft and ships product instruments", () => {
    const saas = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    const observatory = designFromFeatures(SHOWCASE_BRIEFS.observatory!);
    const edu = designFromFeatures(SHOWCASE_BRIEFS.educational!);
    const lantern = designFromFeatures(SHOWCASE_BRIEFS.lantern!);
    const dash = designFromFeatures(SHOWCASE_BRIEFS.dashboard!);
    const fintech = designFromFeatures(SHOWCASE_BRIEFS.fintech!);
    const foundry = designFromFeatures(SHOWCASE_BRIEFS.foundry!);
    const corporate = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
    expect(saas.spec.routedSkills).toContain("motion-stack-craft");
    expect(dash.spec.routedSkills).toContain("motion-stack-craft");
    expect(saas.previewHtml).toMatch(/class="ds-draw"/);
    expect(fintech.previewHtml).toMatch(/class="ds-draw"/);
    expect(foundry.previewHtml).toMatch(/class="ds-draw"/);
    expect(corporate.previewHtml).toMatch(/class="ds-draw"/);
    expect(observatory.previewHtml).toContain("ds-lattice-bar");
    expect(edu.previewHtml).toMatch(/ds-draw|data-scrub/);
    expect(lantern.previewHtml).toContain('data-motion-instrument="field"');
    expect(saas.previewHtml).toContain("stroke-dashoffset");
    // No ambient infinite loops in the motion system (loom shuttle is once).
    expect(saas.previewHtml).not.toMatch(/animation:ds-shuttle-fly[^;]*infinite/);
    expect(designFromFeatures(SHOWCASE_BRIEFS.loom!).previewHtml).not.toMatch(
      /animation:ds-shuttle-fly[^;]*infinite/,
    );
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
    expect(templates).toHaveLength(16);
    expect(templates.map((t) => t.key).sort()).toEqual([
      "archive",
      "clinic",
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
    const clinic = templates.find((t) => t.key === "clinic")!;
    expect(clinic.siteKind).toBe("care-pathway");
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
    expect(previewHtml).toContain('data-figure="work-board"');
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
    expect(previewHtml).toContain("ds-cut-slips");
    expect(previewHtml).toContain("Colophon");
    expect(previewHtml).toContain("The cuts");
    expect(spec.sections.some((s) => s.id === "features-2")).toBe(false);
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

  it("gives signal observatory a chrono waterfall + lattice plan distinct from dossier and SaaS", () => {
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
    expect(previewHtml).toContain('class="ds-chrono-desk"');
    expect(previewHtml).toContain('aria-label="Event waterfall"');
    expect(previewHtml).toContain('class="ds-chrono-waterfall"');
    expect(previewHtml).not.toContain('class="ds-chrono-aside"');
    expect(previewHtml).not.toContain('class="ds-range-ladder"');
    expect(previewHtml).not.toContain('class="ds-gather-forme"');
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
    expect(spec.sections.some((s) => s.layout === "feature-rows")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "marquee-proof")).toBe(false);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="archive-index"');
    expect(previewHtml).toContain("ds-hero-register");
    expect(previewHtml).toContain("ds-register-masthead");
    expect(previewHtml).toContain("ds-alpha-rail");
    expect(previewHtml).toContain('data-figure="index-ledger"');
    expect(previewHtml).toContain("ds-entry");
    expect(previewHtml).toContain("ds-cross-stamps");
    expect(previewHtml).toContain("ds-stamp-seal");
    expect(previewHtml).toContain("ds-entry-aside-kicker");
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
    expect(previewHtml).toContain('class="ds-hang-tape"');
    expect(previewHtml).toContain('aria-label="Care tag stack"');
    expect(previewHtml).toContain('class="ds-hang-stack"');
    expect(previewHtml).not.toContain('class="ds-hang-aside"');
    expect(previewHtml).not.toContain('class="ds-ember-trail"');
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Care label");
    expect(previewHtml).toContain("The lines");
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
    expect(previewHtml).not.toContain('aria-label="Dichotomous key"');
  });

  it("gives field guide a glassine press + binomial + dichotomous key distinct from glass hero collages", () => {
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
    expect(previewHtml).toContain('class="ds-range-ladder"');
    expect(previewHtml).toContain('aria-label="Dichotomous key"');
    expect(previewHtml).toContain('class="ds-range-sheets"');
    expect(previewHtml).toContain("ds-range-couplet");
    expect(previewHtml).not.toContain('class="ds-range-aside"');
    expect(previewHtml).not.toContain('class="ds-gather-stack"');
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Voucher");
    expect(previewHtml).toContain("The traits");
    expect(previewHtml).not.toContain('aria-label="Size treadles"');
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
  });

  it("gives press atelier a registration + press sheet + forme stack distinct from archive and dossier", () => {
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
    expect(previewHtml).toContain('class="ds-gather-stack"');
    expect(previewHtml).toContain('aria-label="Signature stack"');
    expect(previewHtml).toContain('class="ds-gather-forme"');
    expect(previewHtml).toContain('class="ds-gather-densito"');
    expect(previewHtml).not.toContain('class="ds-gather-aside"');
    expect(previewHtml).not.toContain('class="ds-range-ladder"');
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

  it("keeps field-guide and press-atelier mid-page instruments from cloning essay+aside", () => {
    const herb = designFromFeatures(SHOWCASE_BRIEFS.herbarium!).previewHtml;
    const press = designFromFeatures(SHOWCASE_BRIEFS.press!).previewHtml;
    expect(herb).toContain('class="ds-range-ladder"');
    expect(press).toContain('class="ds-gather-forme"');
    expect(herb).not.toContain('class="ds-gather-forme"');
    expect(press).not.toContain('class="ds-range-ladder"');
    expect(herb).not.toContain('class="ds-range-aside"');
    expect(press).not.toContain('class="ds-gather-aside"');
  });

  it("gives lantern path a waypoint rail + path plate + night trail distinct from press and soft dark heroes", () => {
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
    expect(previewHtml).toContain('class="ds-ember-trail"');
    expect(previewHtml).toContain('aria-label="Night trail"');
    expect(previewHtml).not.toContain('class="ds-ember-aside"');
    expect(previewHtml).not.toContain('class="ds-chrono-waterfall"');
    expect(previewHtml).toContain("ds-path-near");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Ember");
    expect(previewHtml).toContain("The chapters");
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
    expect(previewHtml).not.toContain('class="ds-sig-rail"');
    expect(previewHtml).not.toContain('class="ds-scrub-rail"');
    const svgSizes = [...previewHtml.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
    expect(svgSizes.every((n) => n >= 11)).toBe(true);
    expect(previewHtml).toMatch(/class="ds-bleed ds-path-field"[^>]*>[\s\S]*?class="ds-way-rail"/);
    const plate = previewHtml.match(/<svg[^>]*data-figure="path-plate"[^>]*>[\s\S]*?<\/svg>/)?.[0] ?? "";
    expect(plate).toContain("CH I");
    expect(plate).toContain("Threshold");
    expect(plate).toContain('class="ds-draw"');
    expect(plate).not.toContain('stroke-width="10"');
    const drawn = pathPlate("Ember Gate", [], "ember-gate-atlas", "band");
    expect(drawn).toContain("PATH ATLAS");
    expect(drawn).toContain("CH I");
    expect(drawn).toContain("Threshold");
    expect(drawn).toContain('class="ds-draw"');
    expect(drawn).not.toContain('stroke-width="10"');
    const basics = assertBasics(spec, previewHtml);
    expect(basics.findings.filter((f) => !f.ok).map((f) => f.id)).not.toContain("path-plate-walk-not-scribble");
  });

  it("gives care pathway a stage rail + care plate + rounds ladder distinct from lantern and SaaS pipelines", () => {
    const { spec, previewHtml } = designFromFeatures(SHOWCASE_BRIEFS.clinic!);
    expect(spec.brief.siteKind).toBe("care-pathway");
    expect(spec.sections.some((s) => s.kind === "pricing")).toBe(false);
    expect(spec.sections.some((s) => s.kind === "metrics")).toBe(false);
    expect(spec.sections.some((s) => s.layout === "hero-rounds")).toBe(true);
    expect(spec.sections.some((s) => s.layout === "story-rounds")).toBe(true);
    const inverse = spec.sections.filter((s) => s.surface === "inverse");
    expect(inverse.length).toBe(0);
    expect(previewHtml).toContain('data-sitekind="care-pathway"');
    expect(previewHtml).toContain("ds-hero-rounds");
    expect(previewHtml).toContain("ds-care-masthead");
    expect(previewHtml).toContain("ds-care-rail");
    expect(previewHtml).toContain('data-figure="care-plate"');
    expect(previewHtml).toContain('data-dense="ink"');
    expect(previewHtml).toMatch(/data-figure="care-plate"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="care-plate"/);
    expect(previewHtml).toContain("PATHWAY");
    expect(previewHtml).toContain("STAGES 01–05");
    expect(previewHtml).toContain("ds-rounds");
    expect(previewHtml).toContain('class="ds-rounds-ladder"');
    expect(previewHtml).toContain('aria-label="Rounds ladder"');
    expect(previewHtml).not.toContain('class="ds-rounds-aside"');
    expect(previewHtml).not.toContain('class="ds-ember-trail"');
    expect(previewHtml).not.toContain('class="ds-way-rail"');
    expect(previewHtml).not.toContain('data-figure="path-plate"');
    expect(previewHtml).toContain("ds-care-imprint");
    expect(previewHtml).toContain("ds-handoff-strip");
    expect(previewHtml).not.toContain("ds-care-near");
    expect(previewHtml).not.toContain("ds-chart-clip");
    expect(previewHtml).toContain("ds-bleed-rule");
    expect(previewHtml).toContain("Chart");
    expect(previewHtml).toContain("The rounds");
    expect(previewHtml).not.toContain('class="ds-alpha-rail"');
    expect(previewHtml).not.toContain('class="ds-stage-rail"');
    expect(previewHtml).not.toContain('class="ds-pipeline-board"');
    expect(previewHtml).not.toContain('class="ds-index"');
    const svgSizes = [...previewHtml.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
    expect(svgSizes.every((n) => n >= 11)).toBe(true);
    const report = assertBasics(spec, previewHtml);
    const failed = report.findings.filter((f) => !f.ok).map((f) => f.id);
    expect(failed, failed.join(", ")).toEqual([]);
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

  it("fits pipeline deal chips and stage titles inside narrow column pills", async () => {
    const { fitDealChip, pipelineBoard, FIG_MONO_PX } = await import("../figures");
    // ~66px budget (narrow column pill minus insets) must keep amount, shorten word.
    expect(fitDealChip("Executive digest", "84k", 66)).toMatch(/84k/);
    expect(fitDealChip("Executive digest", "84k", 66)).toBe("E · 84k");
    expect(fitDealChip("CRM sync", "41k", 66)).toBe("CRM · 41k");
    expect(fitDealChip("Account scoring", "18k", 120)).toBe("Account · 18k");

    const features = [
      { name: "Account scoring", description: "Ranks every open account." },
      { name: "Pipeline coaching", description: "Flags deals that went quiet." },
      { name: "CRM sync", description: "Writes back without a second sheet." },
      { name: "Executive digest", description: "A weekly read for the room." },
      { name: "Territory modelling", description: "Test a patch before you hire." },
    ];
    const svg = pipelineBoard(
      "Northstar",
      features.map((f) => ({
        title: f.name,
        body: f.description,
        emphasis: "normal" as const,
        points: [] as string[],
      })),
      "overflow-audit",
      "column",
    );
    // Deal chips: no full long stage words that previously escaped the pill.
    expect(svg).not.toContain(">Executive · ");
    expect(svg).not.toContain(">Territory · ");
    expect(svg).not.toContain(">Pipeline coaching</text>");
    expect(svg).not.toMatch(/>[A-Za-z]{3}… · \d+k</);
    // Amounts still present on chips.
    expect(svg).toMatch(/· \d+k</);
    // Mono floor preserved.
    expect(svg).toContain(`font-size="${FIG_MONO_PX}"`);
  });

  it("keeps craft bleeds clear of left rails and press regs off the claim", () => {
    const { previewHtml: press } = designFromFeatures(SHOWCASE_BRIEFS.press!);
    expect(press).toMatch(/--craft-rail:var\(--sig-rail\)/);
    expect(press).toMatch(/width:calc\(100vw - var\(--craft-rail,0px\)\)/);
    expect(press).toMatch(/class="ds-bleed ds-press-field">[\s\S]*?ds-press-regs/);
    expect(press).not.toMatch(/\.ds-press-regs\{[^}]*z-index:3/);
    expect(press).toMatch(/\[data-sitekind="press-atelier"\] \.ds-press-masthead\{[^}]*padding-bottom:var\(--s-xs/);
  });

  it("keeps craft fold claims from pulling labeled fields underneath", () => {
    for (const key of ["lantern", "press", "observatory", "dossier", "archive"] as const) {
      const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS[key]!);
      expect(previewHtml, key).not.toMatch(
        /\.ds-(?:path|press|chrono|folio|register)-field\{[^}]*margin-top:calc\([^)]*\*\s*-/,
      );
    }
    const { previewHtml: clinic } = designFromFeatures(SHOWCASE_BRIEFS.clinic!);
    expect(clinic).not.toMatch(/\.ds-care-field\{[^}]*margin-top:calc\([^)]*\*\s*-/);
    const { previewHtml: lantern } = designFromFeatures(SHOWCASE_BRIEFS.lantern!);
    expect(lantern).toMatch(/\[data-sitekind="lantern-path"\] \.ds-path-claim\{[^}]*background:var\(--c-paper\)/);
    expect(lantern).toMatch(/\[data-sitekind="lantern-path"\] \.ds-path-field\{[^}]*margin-top:0/);
    // animation-name-only zeroes duration/fill-mode — require full enter shorthand (care lesson).
    expect(lantern).toMatch(
      /\[data-sitekind="lantern-path"\] \.ds-enter\{[^}]*animation:ds-lantern-in var\(--m-entrance/,
    );
    expect(lantern).toMatch(/\[data-sitekind="lantern-path"\] \.ds-path-masthead\{[^}]*padding-top:var\(--s-xs/);
    const { previewHtml: archive } = designFromFeatures(SHOWCASE_BRIEFS.archive!);
    expect(archive).toMatch(
      /\[data-sitekind="archive-index"\] \.ds-enter\{[^}]*animation:ds-archive-in var\(--m-entrance/,
    );
    expect(archive).toMatch(/\[data-sitekind="archive-index"\] \.ds-register-masthead\{[^}]*padding-top:var\(--s-xs/);
    expect(archive).toContain("ds-story-fill");
    expect(archive).not.toContain("ds-entry-shelf-rule");
    expect(clinic).toMatch(/\[data-sitekind="care-pathway"\] \.ds-care-claim\{[^}]*background:var\(--c-paper\)/);
    expect(clinic).toMatch(/\[data-sitekind="care-pathway"\] \.ds-care-field\{[^}]*margin-top:0/);
  });

  it("fills wrap-wide vacancy with opaque slabs instead of CSS-bordered shelf rows", () => {
    for (const key of ["dossier", "archive", "loom"] as const) {
      const { previewHtml } = designFromFeatures(SHOWCASE_BRIEFS[key]!);
      expect(previewHtml, key).toContain('class="ds-story-fill"');
      expect(previewHtml, key).toContain("ds-story-fill-plate");
      expect(previewHtml, key).not.toContain("ds-entry-shelf-rule");
      expect(previewHtml, key).not.toContain("ds-spread-fill-rule");
    }
    const { previewHtml: dossier } = designFromFeatures(SHOWCASE_BRIEFS.dossier!);
    expect(dossier).toMatch(
      /\[data-sitekind="research-dossier"\] \.ds-folio-masthead\{[^}]*padding-top:var\(--s-xs/,
    );
    const { previewHtml: lantern } = designFromFeatures(SHOWCASE_BRIEFS.lantern!);
    expect(lantern).toMatch(/\.ds-ember-bead\{[^}]*border:1px solid var\(--c-paper\)/);
    expect(lantern).toMatch(/\.ds-bleed-rule\{[^}]*height:1px/);
    expect(lantern).toContain('[data-sitekind="lantern-path"]');
    expect(lantern).toMatch(/\.ds-faq\{\s*grid-template-columns:1fr/);
  });

  it("keeps story Note labels from sliding under capability marks", () => {
    const noteKinds = ["observatory", "archive", "loom", "herbarium", "press", "lantern", "clinic"] as const;
    for (const key of noteKinds) {
      const brief = SHOWCASE_BRIEFS[key];
      if (!brief) continue;
      const { previewHtml } = designFromFeatures(brief);
      expect(previewHtml, key).toMatch(/Note 0\d/);
      expect(previewHtml, key).not.toMatch(
        /\.ds-(?:chrono|entry|hang|range|gather|ember|spread|marginalia|rounds)-mark\{[^}]*margin-top:calc\(var\(--s-(?:sm|xs|md)\) \* -1\)/,
      );
    }
    const { previewHtml: rounds } = designFromFeatures(SHOWCASE_BRIEFS.clinic!);
    expect(rounds).toMatch(/Note 0\d/);
    expect(rounds).toMatch(/\.ds-rounds-note \+ \.ds-rounds-mark\{[^}]*margin-top:var\(--s-lg\)/);
    const { previewHtml: chrono } = designFromFeatures(SHOWCASE_BRIEFS.observatory!);
    expect(chrono).toMatch(/\.ds-chrono-note \+ \.ds-chrono-mark\{[^}]*margin-top:var\(--s-lg\)/);
    const { previewHtml: ember } = designFromFeatures(SHOWCASE_BRIEFS.lantern!);
    expect(ember).toMatch(/\.ds-ember-note \+ \.ds-ember-mark\{[^}]*margin-top:var\(--s-lg\)/);
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

  it("keeps the workflow lit plate from hanging into the swap panel", () => {
    const { previewHtml } = designFromFeatures(ledgerkeepBrief());
    expect(hasLiveWorkflow(previewHtml)).toBe(true);
    expect(previewHtml).toMatch(/\.ds-workflow-field \.ds-proof-figure\{transform:none/);
    expect(previewHtml).toMatch(/\.ds-workflow-field\{[^}]*gap:var\(--s-xl\)/);
    expect(previewHtml).toMatch(/\.ds-proof\.ds-workflow\{[^}]*margin-bottom:0/);
    expect(previewHtml).toMatch(/\.ds-workflow-rail ol\{[^}]*gap:var\(--s-sm\)/);
  });

  it("gives Northstar a feature-evidence board and Ledgerkeep the approval workflow stage", () => {
    const northstar = analyzeFeatures(SHOWCASE_BRIEFS.saas!);
    expect(northstar.hasApprovalWorkflow).toBe(false);
    const north = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(hasLiveBoard(north.previewHtml)).toBe(true);
    expect(hasLiveWorkflow(north.previewHtml)).toBe(false);
    expect(north.previewHtml).not.toContain("htmx.org");
    expect(north.previewHtml).not.toContain('data-workflow-step="approve"');

    const ledgerAnalysis = analyzeFeatures(ledgerkeepBrief());
    expect(ledgerAnalysis.hasApprovalWorkflow).toBe(true);
    const ledger = designFromFeatures(ledgerkeepBrief());
    expect(hasLiveWorkflow(ledger.previewHtml)).toBe(true);
    expect(ledger.previewHtml).toContain("htmx.org");
    expect(ledger.previewHtml).toContain('data-workflow-step="approve"');
    expect(ledger.spec.sections.some((s) => s.layout === "workflow-proof")).toBe(true);
  });

  it("fills marketing proof bands with dense evidence — ordinary SaaS uses a board, approval briefs use workflow", () => {
    const saas = designFromFeatures(SHOWCASE_BRIEFS.saas!);
    expect(hasLiveBoard(saas.previewHtml)).toBe(true);
    expect(hasLiveWorkflow(saas.previewHtml)).toBe(false);
    expect(saas.previewHtml).toContain("ds-proof-claim");
    expect(saas.previewHtml).toContain("ds-story");
    expect(saas.previewHtml).not.toContain("How to read this page");
    expect(saas.previewHtml).not.toContain("min-height:min(140vh");

    const ledger = designFromFeatures(ledgerkeepBrief());
    expect(hasLiveWorkflow(ledger.previewHtml)).toBe(true);
    expect(hasLiveBoard(ledger.previewHtml)).toBe(false);

    const fintech = designFromFeatures(SHOWCASE_BRIEFS.fintech!);
    expect(hasLiveBoard(fintech.previewHtml)).toBe(true);
    expect(fintech.previewHtml).toContain("ds-proof-board-wire");
    expect(fintech.previewHtml).toContain("ds-proof-cell");
    const cells = fintech.previewHtml.match(/ds-proof-cell/g) ?? [];
    expect(cells.length).toBeGreaterThanOrEqual(4);

    const dashboard = designFromFeatures(SHOWCASE_BRIEFS.dashboard!);
    expect(dashboard.previewHtml).toContain("ds-proof-board-stack");

    const corporate = designFromFeatures(SHOWCASE_BRIEFS.corporate!);
    expect(corporate.previewHtml).toContain("ds-proof-board-spine");
  });

  it("does not bolt the shared marquee-proof board onto craft templates", () => {
    const craftKeys = [
      "studio",
      "consumer",
      "foundry",
      "dossier",
      "observatory",
      "archive",
      "loom",
      "herbarium",
      "press",
      "lantern",
      "clinic",
    ] as const;
    const sharedPhrases = [
      "Why teams keep it",
      "earns trust in review",
      "declared scope · ships together",
      "capabilities · declared scope",
    ];
    const hasLiveBoard = (html: string) => /<ul[^>]*\bdata-proof-board\b/.test(html);
    for (const key of craftKeys) {
      const brief = SHOWCASE_BRIEFS[key];
      expect(brief, `missing showcase brief ${key}`).toBeTruthy();
      const { spec, previewHtml } = designFromFeatures(brief!);
      expect(spec.sections.some((s) => s.layout === "marquee-proof"), `${key} still has marquee-proof`).toBe(
        false,
      );
      expect(hasLiveBoard(previewHtml), `${key} still renders shared proof board`).toBe(false);
      for (const phrase of sharedPhrases) {
        expect(previewHtml.includes(phrase), `${key} still shares copy "${phrase}"`).toBe(false);
      }
    }
    // Archive keeps its unique entry essay — not a SaaS proof board with Stamp Roll features.
    const archive = designFromFeatures(SHOWCASE_BRIEFS.archive!);
    expect(archive.previewHtml).toContain("ds-entry");
    expect(archive.previewHtml).toContain("Alpha jump");
    expect(archive.spec.sections.some((s) => s.layout === "story-entry")).toBe(true);
  });
});
