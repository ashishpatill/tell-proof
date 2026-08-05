/**
 * Offering catalog — depth-first, research-backed.
 *
 * Templates are the horizontal surface of the product: one per site kind we have measured against
 * the expert corpus. Studio and MCP name offerings from this list.
 *
 *   Source of truth for QUALITY:  design-research-loop → LOOP_LEDGER → docs/10_DESIGN_EVIDENCE.md
 *   Source of truth for PLUMBING: basics-checklist.ts (implementation floors only)
 *
 * Open-source design builders are not used to invent or restyle these offerings. They are used
 * only when the engine is stuck on a working detail (landmarks, focus, stacking, token emission)
 * that those builders already solved as engineering.
 *
 * Expansion rule: add an offering only when a measured demand gap appears that no current kind
 * covers (e.g. fintech inverse/bleed rhythm ≠ SaaS conversion). Then deepen via the research loop.
 */

import { DesignBrief, type SiteKind } from "./types";

export type TemplateKey = "saas" | "dashboard" | "corporate" | "educational" | "fintech" | "studio";

export interface DesignTemplate {
  /** Stable key used by /showcase/*, /studio presets, and GET /api/design?showcase= */
  key: TemplateKey;
  label: string;
  /** One-line market job — why this offering exists, not how it looks. */
  marketJob: string;
  siteKind: SiteKind;
  /**
   * Research notes that justify keeping this offering in the catalog.
   * Updated when the design-research loop changes what "good" means for this kind.
   */
  researchBasis: string;
  brief: DesignBrief;
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    key: "saas",
    label: "SaaS conversion",
    marketJob:
      "Demo-booking landing for B2B teams — one primary conversion path, feature-grounded proof.",
    siteKind: "saas-marketing",
    researchBasis:
      "Calibrated against premium-b2b-saas, art-directed-studio, fintech-product, brand-agency, and personal-craft corridors (fold figure ~0.7–1.0, page figure ~0.4+, dense bleeds/layers; craft sites for alignment axes). Locked craft: spanning product fold for every SaaS lean, lit inverse proof stage, spined sequence with large capability marks — deepen uniqueness; no lonely pullquote voids, sparse bento airways, or chromatic page floods.",
    brief: DesignBrief.parse({
      productName: "Northstar",
      tagline: "Know which accounts are moving before the forecast call",
      audience: "revenue leaders at B2B software companies",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        {
          id: "f1",
          name: "Account scoring",
          description: "Ranks every account by fit and live intent, so the top of the list is the list worth working",
          priority: "p0",
        },
        {
          id: "f2",
          name: "Pipeline coaching",
          description: "Flags deals that have gone quiet and names the next action that unsticks them",
          priority: "p0",
        },
        {
          id: "f3",
          name: "CRM sync",
          description: "Writes back to your system of record both ways, so nobody keeps a second spreadsheet",
          priority: "p1",
        },
        {
          id: "f4",
          name: "Executive digest",
          description: "A weekly narrative leadership actually reads instead of a dashboard they never open",
          priority: "p1",
        },
        {
          id: "f5",
          name: "Territory modelling",
          description: "Test a coverage change against last year's pipeline before you announce it",
          priority: "p2",
        },
      ],
      taste: { aestheticLean: "conversion-sharp", motion: "subtle-micro", colorMood: "neutral-professional" },
    }),
  },
  {
    key: "dashboard",
    label: "Operator console",
    marketJob:
      "Daily workspace for operators — dense shell, priority queue, empty states included.",
    siteKind: "dashboard-webapp",
    researchBasis:
      "Calibrated against design-tool / enterprise-observability density bands; system-crafted + dark-premium.",
    brief: DesignBrief.parse({
      productName: "Northstar",
      tagline: "The seller workspace",
      audience: "account executives",
      businessGoal: "activation",
      siteKind: "dashboard-webapp",
      lockSiteKind: true,
      features: [
        {
          id: "d1",
          name: "Priority queue",
          description: "Today's accounts ranked by what changed overnight, not by alphabetical order",
          priority: "p0",
        },
        {
          id: "d2",
          name: "Deal room",
          description: "Context, stakeholders, and open risks for one deal on a single surface",
          priority: "p0",
        },
        {
          id: "d3",
          name: "Playbooks",
          description: "Guided steps for the motions your team already wins with",
          priority: "p1",
        },
        {
          id: "d4",
          name: "Activity feed",
          description: "Signals from email and the CRM, filtered to the ones that change a decision",
          priority: "p1",
        },
        {
          id: "d5",
          name: "Handoff notes",
          description: "State of an account written down automatically when ownership changes",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "system-crafted",
        density: "information-rich",
        motion: "subtle-micro",
        roundingDepth: "sharp",
        colorMood: "dark-premium",
      },
    }),
  },
  {
    key: "corporate",
    label: "Trust narrative",
    marketJob:
      "Enterprise credibility page — editorial story and measured outcomes for long sales cycles.",
    siteKind: "corporate-story",
    researchBasis:
      "Calibrated against enterprise-corporate / art-directed-studio bands; refined-story lean.",
    brief: DesignBrief.parse({
      productName: "Northstar",
      tagline: "Clarity for teams that sell complexity",
      audience: "enterprise operators and their boards",
      businessGoal: "trust",
      siteKind: "corporate-story",
      lockSiteKind: true,
      features: [
        {
          id: "c1",
          name: "One visual language",
          description: "A single system across product, sales material, and the contract you sign",
          priority: "p0",
        },
        {
          id: "c2",
          name: "Operating principles",
          description: "How decisions get made here, written down before you have to test them",
          priority: "p0",
        },
        {
          id: "c3",
          name: "Measured outcomes",
          description: "Results reported with their denominators, including the ones that did not move",
          priority: "p1",
        },
        {
          id: "c4",
          name: "Security posture",
          description: "Where data lives, who can reach it, and what happens when someone leaves",
          priority: "p1",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "soft-brand-accent",
        typographyWeight: "light-elegant",
      },
    }),
  },
  {
    key: "educational",
    label: "Mechanism explainer",
    marketJob:
      "Technical evaluation doc — scrubbable figure and chapter narrative for architecture decisions.",
    siteKind: "docs-educational",
    researchBasis:
      "Calibrated against docs-product / design-system-docs bands; minimal-clean teaching surface.",
    brief: DesignBrief.parse({
      productName: "Signal Path",
      tagline: "How the routing layer actually decides",
      audience: "engineers evaluating the runtime",
      businessGoal: "trust",
      siteKind: "docs-educational",
      lockSiteKind: true,
      features: [
        {
          id: "e1",
          name: "Placement model",
          description: "The real cost function, including the fairness constraint most schedulers leave out",
          priority: "p0",
        },
        {
          id: "e2",
          name: "Preemption ladder",
          description: "What gets evicted first, and which guarantees survive an eviction",
          priority: "p0",
        },
        {
          id: "e3",
          name: "Backpressure",
          description: "How queue depth turns into admission decisions upstream of the scheduler",
          priority: "p1",
        },
        {
          id: "e4",
          name: "Failure domains",
          description: "Spread rules, and what they cost you in packing efficiency",
          priority: "p1",
        },
      ],
      taste: { aestheticLean: "minimal-clean", density: "balanced", motion: "subtle-micro", colorMood: "light-airy" },
    }),
  },
  {
    key: "fintech",
    label: "Fintech trust",
    marketJob:
      "Money-product landing — inverse-heavy proof, bleed product stages, conversion for treasury buyers.",
    siteKind: "fintech-marketing",
    researchBasis:
      "Calibrated against fintech-product corridors (invertedShare ~0.7, bleedBands ~13, fold figure ~0.88, accent used as stage not flood). Distinct from SaaS conversion: more inverse bands, specimen on inverse, denser metric register. Keep spanning product fold; deepen uniqueness without empty-height rhythm hacks.",
    brief: DesignBrief.parse({
      productName: "Clearwire",
      tagline: "Treasury that moves at the speed of the invoice",
      audience: "finance leads at mid-market companies running multi-entity cash",
      businessGoal: "demos",
      siteKind: "fintech-marketing",
      lockSiteKind: true,
      features: [
        {
          id: "t1",
          name: "Same-day wires",
          description: "Domestic wires that leave before the cut-off you can actually see, not the one in a PDF",
          priority: "p0",
        },
        {
          id: "t2",
          name: "Entity wallets",
          description: "Cash per entity with intercompany moves that post both ledgers in one action",
          priority: "p0",
        },
        {
          id: "t3",
          name: "Approval paths",
          description: "Thresholds and dual control enforced at send time, not discovered in the bank portal",
          priority: "p0",
        },
        {
          id: "t4",
          name: "FX at quote",
          description: "A locked rate on the payment screen so the P&L match is not a surprise tomorrow",
          priority: "p1",
        },
        {
          id: "t5",
          name: "Audit export",
          description: "Every send, approval, and fail as a package auditors open without a screenshare",
          priority: "p1",
        },
        {
          id: "t6",
          name: "Cash forecast",
          description: "Thirteen-week view built from open bills and scheduled pays, not a spreadsheet guess",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        density: "balanced",
        motion: "subtle-micro",
        colorMood: "neutral-professional",
        typographyWeight: "bold-confident",
        roundingDepth: "soft",
      },
    }),
  },
  {
    key: "studio",
    label: "Art-directed studio",
    marketJob:
      "Selected-work studio landing — figure-owned fold, method narrative, paper-led proof for creative buyers.",
    siteKind: "art-directed-studio",
    researchBasis:
      "Calibrated against art-directed-studio corridors (foldFigure median 1.0, figureArea ~0.57, invertedShare ~0, display ~high corridor, alignment axes ~4). Distinct from SaaS/fintech: no pricing ladder, almost no inverse bands, selected-work alternating register + method figure + raised proof. Keep spanning overfigure fold; deepen uniqueness without empty-height rhythm hacks.",
    brief: DesignBrief.parse({
      productName: "Fieldmark",
      tagline: "Art direction that survives the handoff",
      audience: "brand and product leads hiring a studio for a system, not a deck",
      businessGoal: "trust",
      siteKind: "art-directed-studio",
      lockSiteKind: true,
      features: [
        {
          id: "s1",
          name: "Identity systems",
          description: "Type, colour, and motion rules that still hold when five vendors touch the brand",
          priority: "p0",
        },
        {
          id: "s2",
          name: "Product surfaces",
          description: "Interfaces composed as chapters of the same system, not a separate UI kit",
          priority: "p0",
        },
        {
          id: "s3",
          name: "Launch films",
          description: "Short motion pieces cut to the same grid the site and product already use",
          priority: "p0",
        },
        {
          id: "s4",
          name: "Editorial sites",
          description: "Marketing pages paced like print — tension, rest, and a real visual event",
          priority: "p1",
        },
        {
          id: "s5",
          name: "Handoff kits",
          description: "Tokens, specimens, and do-nots packaged so engineering does not invent a second brand",
          priority: "p1",
        },
        {
          id: "s6",
          name: "Critique loops",
          description: "Structured reviews that name the tell, not a vibe, before the next round of work",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "soft-brand-accent",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
];

const BY_KEY = Object.fromEntries(DESIGN_TEMPLATES.map((t) => [t.key, t])) as Record<
  TemplateKey,
  DesignTemplate
>;

export function getTemplate(key: string): DesignTemplate | undefined {
  return Object.prototype.hasOwnProperty.call(BY_KEY, key) ? BY_KEY[key as TemplateKey] : undefined;
}

export function listTemplates(): DesignTemplate[] {
  return DESIGN_TEMPLATES.slice();
}

/** Studio / API form of a template — features as editable lines, taste flattened. */
export function templateToStudioPreset(key: TemplateKey) {
  const t = BY_KEY[key]!;
  const taste = t.brief.taste ?? {};
  return {
    key: t.key,
    label: t.label,
    marketJob: t.marketJob,
    productName: t.brief.productName,
    tagline: t.brief.tagline,
    audience: t.brief.audience,
    siteKind: t.siteKind,
    businessGoal: t.brief.businessGoal,
    featuresText: t.brief.features
      .map((f) => `${f.name} — ${f.description}`)
      .join("\n"),
    aestheticLean: taste.aestheticLean ?? "conversion-sharp",
    motion: taste.motion ?? "subtle-micro",
    density: taste.density ?? "balanced",
    colorMood: taste.colorMood ?? "neutral-professional",
    typographyWeight: taste.typographyWeight ?? "medium-modern",
    roundingDepth: taste.roundingDepth ?? "soft",
  };
}

/**
 * Backward-compatible map used by showcase routes and existing tests.
 * Prefer `getTemplate(key).brief` in new code.
 */
export const SHOWCASE_BRIEFS: Record<string, DesignBrief> = Object.fromEntries(
  DESIGN_TEMPLATES.map((t) => [t.key, t.brief]),
);
