/**
 * Domain research packs — general website IA / shell / multipage research.
 * Domain-agnostic: SaaS, consumer, fintech, sport, etc. customize via domainId.
 * Sport packs implement this shape; do not fork a second research methodology.
 *
 * Principle-only: no third-party product/host names in pack fields.
 */

import { z } from "zod";
import {
  getSportPack,
  listSportPacks,
  type SportId,
  type SportVernacularPack,
} from "./sport-vernacular";
import type { DesignBrief, SkillNodeId } from "./types";

export const DomainShellContract = z.object({
  stickyRegions: z.array(z.string()).default([]),
  primaryNavMaxItems: z.number().int().positive().default(6),
  liveSurface: z.string().optional(),
  mobileNavPattern: z.string().default("bottom-or-drawer"),
  footerDepth: z.enum(["minimal", "utility", "directory"]).default("utility"),
});
export type DomainShellContract = z.infer<typeof DomainShellContract>;

export const DomainNavItem = z.object({
  id: z.string(),
  label: z.string(),
  routeClass: z.string(),
  priority: z.enum(["primary", "secondary", "utility"]).default("primary"),
});
export type DomainNavItem = z.infer<typeof DomainNavItem>;

export const DomainFooterColumn = z.object({
  id: z.string(),
  title: z.string(),
  links: z.array(z.string()).default([]),
});
export type DomainFooterColumn = z.infer<typeof DomainFooterColumn>;

export const DomainControlSpec = z.object({
  id: z.string(),
  role: z.string(),
  states: z.array(z.string()).default(["default", "hover", "focus-visible", "disabled"]),
});
export type DomainControlSpec = z.infer<typeof DomainControlSpec>;

export const DomainVariantLens = z.object({
  id: z.string(),
  label: z.string(),
  changesFacts: z.array(z.string()).default([]),
});
export type DomainVariantLens = z.infer<typeof DomainVariantLens>;

export const DomainMultiPageRoute = z.object({
  id: z.string(),
  path: z.string(),
  routeClass: z.string(),
  purpose: z.string(),
  captureTargets: z
    .array(z.enum(["hero", "mid", "footer", "mobile-nav", "mobile-footer"]))
    .default(["hero", "mid", "footer"]),
});
export type DomainMultiPageRoute = z.infer<typeof DomainMultiPageRoute>;

export const DomainResearchTasteSeed = z.object({
  aestheticLean: z.enum([
    "minimal-clean",
    "conversion-sharp",
    "system-crafted",
    "refined-story",
  ]),
  density: z.enum(["sparse", "balanced", "information-rich"]),
  motion: z.enum(["none", "subtle-micro", "light-scroll-reveals"]),
  colorMood: z.enum([
    "neutral-professional",
    "soft-brand-accent",
    "dark-premium",
    "light-airy",
  ]),
  typographyWeight: z.enum(["light-elegant", "medium-modern", "bold-confident"]),
  roundingDepth: z.enum(["sharp", "soft", "soft-elevation"]),
});
export type DomainResearchTasteSeed = z.infer<typeof DomainResearchTasteSeed>;

/** Base pack for any website domain research. */
export const DomainResearchPack = z.object({
  domainId: z.string().min(1),
  label: z.string().min(1),
  siteKindHint: z.string().optional(),
  culturalThesis: z.string().optional(),
  multiPageRoutes: z.array(DomainMultiPageRoute).default([]),
  shellContract: DomainShellContract.default({}),
  navInventory: z.array(DomainNavItem).default([]),
  footerInventory: z.array(DomainFooterColumn).default([]),
  controlTaxonomy: z.array(DomainControlSpec).default([]),
  variantLenses: z.array(DomainVariantLens).default([]),
  categoryGaps: z.array(z.string()).default([]),
  uxRules: z.array(z.string()).default([]),
  tasteSeed: DomainResearchTasteSeed.optional(),
});
export type DomainResearchPack = z.infer<typeof DomainResearchPack>;

/** Cricket Core six — shared route classes for specimen + capture. */
export const CRICKET_CORE_SIX_ROUTES: DomainMultiPageRoute[] = [
  {
    id: "home",
    path: "/crease",
    routeClass: "home",
    purpose: "Match list + live entry + series pulse",
    captureTargets: ["hero", "mid", "footer", "mobile-nav", "mobile-footer"],
  },
  {
    id: "live",
    path: "/crease/live",
    routeClass: "live-match",
    purpose: "Glance-live score spine + this-over + situation",
    captureTargets: ["hero", "mid", "footer", "mobile-nav"],
  },
  {
    id: "scorecard",
    path: "/crease/scorecard",
    routeClass: "scorecard",
    purpose: "Full batting/bowling tables after-play depth",
    captureTargets: ["hero", "mid", "footer"],
  },
  {
    id: "series",
    path: "/crease/series",
    routeClass: "series",
    purpose: "Series / competition arc and fixtures",
    captureTargets: ["hero", "mid", "footer"],
  },
  {
    id: "rankings",
    path: "/crease/rankings",
    routeClass: "rankings",
    purpose: "Team and player ranking tables",
    captureTargets: ["hero", "mid", "footer"],
  },
  {
    id: "notebook",
    path: "/crease/notebook",
    routeClass: "notebook",
    purpose: "Sit-with editorial / ball-by-ball notes",
    captureTargets: ["hero", "mid", "footer", "mobile-nav"],
  },
];

const CRICKET_SHELL: DomainShellContract = {
  stickyRegions: ["top-status", "score-spine", "live-rail"],
  primaryNavMaxItems: 6,
  liveSurface: "sticky score spine + optional live rail",
  mobileNavPattern: "primary six in header overflow + sticky live chip",
  footerDepth: "directory",
};

const CRICKET_NAV: DomainNavItem[] = [
  { id: "home", label: "Home", routeClass: "home", priority: "primary" },
  { id: "live", label: "Live", routeClass: "live-match", priority: "primary" },
  { id: "scorecard", label: "Scorecard", routeClass: "scorecard", priority: "primary" },
  { id: "series", label: "Series", routeClass: "series", priority: "primary" },
  { id: "rankings", label: "Rankings", routeClass: "rankings", priority: "primary" },
  { id: "notebook", label: "Notebook", routeClass: "notebook", priority: "primary" },
];

const CRICKET_FOOTER: DomainFooterColumn[] = [
  {
    id: "match",
    title: "Match",
    links: ["Live", "Scorecard", "This over", "Partnerships"],
  },
  {
    id: "compete",
    title: "Compete",
    links: ["Series", "Fixtures", "Rankings", "Teams"],
  },
  {
    id: "read",
    title: "Read",
    links: ["Notebook", "Features", "Archives"],
  },
  {
    id: "utility",
    title: "Utility",
    links: ["Latency", "Accessibility", "About"],
  },
];

const CRICKET_CONTROLS: DomainControlSpec[] = [
  {
    id: "format-chip",
    role: "Toggle Test / ODI / T20 lens",
    states: ["default", "selected", "hover", "focus-visible"],
  },
  {
    id: "live-chip",
    role: "Jump to live match",
    states: ["default", "live-pulse", "hover", "focus-visible"],
  },
  {
    id: "rankings-tab",
    role: "Switch ranking tables",
    states: ["default", "selected", "hover", "focus-visible"],
  },
  {
    id: "primary-cta",
    role: "Open scorecard / follow match",
    states: ["default", "hover", "focus-visible", "disabled"],
  },
];

/** Map a sport vernacular pack into the general DomainResearchPack shape. */
export function sportPackToDomainResearch(pack: SportVernacularPack): DomainResearchPack {
  const multipage =
    pack.multiPageRoutes?.map((r) => ({
      id: r.id,
      path: r.path,
      routeClass: r.routeClass,
      purpose: r.purpose,
      captureTargets: ["hero", "mid", "footer"] as const,
    })) ?? (pack.id === "cricket" ? CRICKET_CORE_SIX_ROUTES : []);

  const shell = pack.shellContract
    ? DomainShellContract.parse(pack.shellContract)
    : pack.id === "cricket"
      ? CRICKET_SHELL
      : DomainShellContract.parse({
          stickyRegions: ["score-spine"],
          primaryNavMaxItems: 5,
          liveSurface: "score spine",
          mobileNavPattern: "header + sticky status",
          footerDepth: "utility",
        });

  const nav =
    pack.navInventory ??
    (pack.id === "cricket"
      ? CRICKET_NAV
      : [
          { id: "home", label: "Home", routeClass: "home", priority: "primary" as const },
          { id: "live", label: "Live", routeClass: "live-match", priority: "primary" as const },
          { id: "results", label: "Results", routeClass: "results", priority: "primary" as const },
        ]);

  const footer = pack.footerInventory ?? (pack.id === "cricket" ? CRICKET_FOOTER : []);
  const controls = pack.controlTaxonomy ?? (pack.id === "cricket" ? CRICKET_CONTROLS : []);

  return DomainResearchPack.parse({
    domainId: `sport:${pack.id}`,
    label: pack.label,
    siteKindHint: "sport-matchday",
    culturalThesis: pack.culturalThesis,
    multiPageRoutes: multipage,
    shellContract: shell,
    navInventory: nav,
    footerInventory: footer,
    controlTaxonomy: controls,
    variantLenses: pack.formatLenses.map((f) => ({
      id: f.id,
      label: f.label,
      changesFacts: [...f.emphasize, ...f.demote.map((d) => `demote:${d}`)],
    })),
    categoryGaps: pack.categoryGaps,
    uxRules: pack.uxRules,
    tasteSeed: pack.tasteSeed,
  });
}

const GENERIC_PACKS: Record<string, DomainResearchPack> = {
  "saas-marketing": DomainResearchPack.parse({
    domainId: "saas-marketing",
    label: "SaaS marketing",
    siteKindHint: "saas-marketing",
    culturalThesis: "Prove the product path before selling atmosphere.",
    multiPageRoutes: [
      {
        id: "home",
        path: "/",
        routeClass: "home",
        purpose: "Promise + proof entry",
        captureTargets: ["hero", "mid", "footer"],
      },
      {
        id: "pricing",
        path: "/pricing",
        routeClass: "pricing",
        purpose: "Plan decision support",
        captureTargets: ["hero", "mid", "footer"],
      },
    ],
    shellContract: {
      stickyRegions: ["header"],
      primaryNavMaxItems: 5,
      mobileNavPattern: "drawer",
      footerDepth: "directory",
    },
    navInventory: [
      { id: "product", label: "Product", routeClass: "home", priority: "primary" },
      { id: "pricing", label: "Pricing", routeClass: "pricing", priority: "primary" },
    ],
    footerInventory: [
      { id: "product", title: "Product", links: ["Features", "Pricing", "Docs"] },
    ],
    controlTaxonomy: [
      {
        id: "primary-cta",
        role: "Primary conversion",
        states: ["default", "hover", "focus-visible", "disabled"],
      },
    ],
    variantLenses: [
      { id: "plans", label: "Plan cadence", changesFacts: ["monthly", "annual"] },
    ],
    categoryGaps: [
      "Generic hero without product proof",
      "Equal feature cards with no priority",
    ],
    uxRules: ["Proof before decoration", "One primary CTA per fold"],
    tasteSeed: {
      aestheticLean: "system-crafted",
      density: "balanced",
      motion: "subtle-micro",
      colorMood: "neutral-professional",
      typographyWeight: "medium-modern",
      roundingDepth: "soft",
    },
  }),
  "signal-observatory": DomainResearchPack.parse({
    domainId: "signal-observatory",
    label: "Enterprise observability desk",
    siteKindHint: "signal-observatory",
    culturalThesis:
      "On-call desks read time as a shared instrument — spans and thresholds before narrative essays.",
    multiPageRoutes: [
      {
        id: "home",
        path: "/",
        routeClass: "home",
        purpose: "Live window + lattice entry",
        captureTargets: ["hero", "mid", "footer"],
      },
      {
        id: "incident",
        path: "/incident",
        routeClass: "detail",
        purpose: "Event waterfall for one window",
        captureTargets: ["hero", "mid"],
      },
    ],
    shellContract: {
      stickyRegions: ["header", "scrub-rail"],
      primaryNavMaxItems: 4,
      mobileNavPattern: "bottom-tabs",
      footerDepth: "minimal",
    },
    navInventory: [
      { id: "desk", label: "Desk", routeClass: "home", priority: "primary" },
      { id: "channels", label: "Channels", routeClass: "home", priority: "primary" },
      { id: "handoff", label: "Handoff", routeClass: "detail", priority: "secondary" },
    ],
    footerInventory: [
      { id: "desk", title: "Desk", links: ["Live window", "Calibration"] },
    ],
    controlTaxonomy: [
      {
        id: "scrub-window",
        role: "Time bracket scrub",
        states: ["default", "hover", "focus-visible", "active"],
      },
      {
        id: "span-row",
        role: "Event span on waterfall",
        states: ["default", "hover", "focus-visible"],
      },
    ],
    variantLenses: [
      { id: "window", label: "Time bracket", changesFacts: ["1h", "6h", "24h"] },
    ],
    categoryGaps: [
      "Essay+aside mid-page that could be any craft template",
      "Metric theatre instead of instrument spans",
      "Inverse SaaS proof board on a paper desk",
    ],
    uxRules: [
      "Instrument time before prose",
      "Spans show duration on a shared ruler",
      "Calibration marks travel with the close",
    ],
    tasteSeed: {
      aestheticLean: "refined-story",
      density: "balanced",
      motion: "light-scroll-reveals",
      colorMood: "light-airy",
      typographyWeight: "light-elegant",
      roundingDepth: "sharp",
    },
  }),
  "lantern-path": DomainResearchPack.parse({
    domainId: "lantern-path",
    label: "Cinematic night-walk atlas",
    siteKindHint: "lantern-path",
    culturalThesis:
      "Night paths are walked chapter by chapter — zigzag waypoints on a spine, not essay+aside indexes.",
    multiPageRoutes: [
      {
        id: "home",
        path: "/",
        routeClass: "home",
        purpose: "Path atlas fold + trail entry",
        captureTargets: ["hero", "mid", "footer"],
      },
      {
        id: "chapter",
        path: "/chapter",
        routeClass: "detail",
        purpose: "Single waypoint reading",
        captureTargets: ["hero", "mid"],
      },
    ],
    shellContract: {
      stickyRegions: ["header", "way-rail"],
      primaryNavMaxItems: 4,
      mobileNavPattern: "drawer",
      footerDepth: "minimal",
    },
    navInventory: [
      { id: "path", label: "Path", routeClass: "home", priority: "primary" },
      { id: "chapters", label: "Chapters", routeClass: "detail", priority: "primary" },
    ],
    footerInventory: [
      { id: "atlas", title: "Atlas", links: ["Path plate", "Ember"] },
    ],
    controlTaxonomy: [
      {
        id: "waypoint",
        role: "Chapter waypoint on trail",
        states: ["default", "hover", "focus-visible", "active"],
      },
    ],
    variantLenses: [
      { id: "hour", label: "Night hour", changesFacts: ["dusk", "midnight", "afterlight"] },
    ],
    categoryGaps: [
      "Essay+aside mid-page clone of other craft templates",
      "Soft dark glow WebGL chrome without path grammar",
      "Inverse SaaS proof board on a paper night walk",
    ],
    uxRules: [
      "Path plate owns the fold",
      "Chapters zigzag on a center spine",
      "Silhouette near-plane enters the first viewport",
    ],
    tasteSeed: {
      aestheticLean: "refined-story",
      density: "balanced",
      motion: "light-scroll-reveals",
      colorMood: "light-airy",
      typographyWeight: "light-elegant",
      roundingDepth: "sharp",
    },
  }),
  "commerce-loom": DomainResearchPack.parse({
    domainId: "commerce-loom",
    label: "Merchandising loom press",
    siteKindHint: "commerce-loom",
    culturalThesis:
      "SKU lines hang as care tags on a size tape — physical swing tickets, not essay+aside indexes.",
    multiPageRoutes: [
      {
        id: "home",
        path: "/",
        routeClass: "home",
        purpose: "Drawloom fold + care tags",
        captureTargets: ["hero", "mid", "footer"],
      },
      {
        id: "care",
        path: "/care",
        routeClass: "detail",
        purpose: "Care label reading",
        captureTargets: ["hero", "mid"],
      },
    ],
    shellContract: {
      stickyRegions: ["header"],
      primaryNavMaxItems: 4,
      mobileNavPattern: "drawer",
      footerDepth: "minimal",
    },
    navInventory: [
      { id: "weave", label: "Weave", routeClass: "home", priority: "primary" },
      { id: "sizes", label: "Sizes", routeClass: "home", priority: "primary" },
      { id: "care", label: "Care", routeClass: "detail", priority: "secondary" },
    ],
    footerInventory: [
      { id: "loom", title: "Loom", links: ["Drawloom", "Care label"] },
    ],
    controlTaxonomy: [
      {
        id: "size-chip",
        role: "Size tape chip",
        states: ["default", "hover", "focus-visible", "active"],
      },
    ],
    variantLenses: [
      { id: "size", label: "Size run", changesFacts: ["XS", "M", "XL"] },
    ],
    categoryGaps: [
      "Essay+aside mid-page clone of other craft templates",
      "Soft glass card collage instead of woven plate",
      "Pricing theatre on a merchandising press",
    ],
    uxRules: [
      "Drawloom owns the fold",
      "Size tape before prose",
      "Care tags stack like swing tickets",
    ],
    tasteSeed: {
      aestheticLean: "refined-story",
      density: "balanced",
      motion: "subtle-micro",
      colorMood: "soft-brand-accent",
      typographyWeight: "medium-modern",
      roundingDepth: "sharp",
    },
  }),
};

/** Load prior domain pack by id (sport:cricket, saas-marketing, …). */
export function loadPriorDomain(domainId: string): DomainResearchPack | undefined {
  const normalized = domainId.trim().toLowerCase();
  if (GENERIC_PACKS[normalized]) return GENERIC_PACKS[normalized];

  const sportMatch = normalized.match(/^sport:(cricket|football|hockey|tennis)$/);
  if (sportMatch) {
    return sportPackToDomainResearch(getSportPack(sportMatch[1] as SportId));
  }

  if (normalized === "cricket" || normalized === "football" || normalized === "hockey" || normalized === "tennis") {
    return sportPackToDomainResearch(getSportPack(normalized));
  }

  for (const pack of listSportPacks()) {
    if (`sport:${pack.id}` === normalized || pack.id === normalized) {
      return sportPackToDomainResearch(pack);
    }
  }

  return undefined;
}

export function listDomainResearchPacks(): DomainResearchPack[] {
  return [...Object.values(GENERIC_PACKS), ...listSportPacks().map(sportPackToDomainResearch)];
}

export type RequirementGapDiff = {
  domainId: string;
  packFound: boolean;
  reuse: string[];
  gaps: string[];
  needsWalkthrough: boolean;
};

/** Diff user brief vs existing pack — forbid blank-slate when pack exists. */
export function requirementGapDiff(
  domainId: string,
  requirement: {
    requiredRouteClasses?: string[];
    requiredShellBits?: string[];
    notes?: string;
  } = {},
): RequirementGapDiff {
  const pack = loadPriorDomain(domainId);
  if (!pack) {
    return {
      domainId,
      packFound: false,
      reuse: [],
      gaps: [
        "No DomainResearchPack — full multipage walkthrough required before design",
        ...(requirement.notes ? [requirement.notes] : []),
      ],
      needsWalkthrough: true,
    };
  }

  const reuse: string[] = [
    `Pack ${pack.domainId} (${pack.label})`,
    ...(pack.culturalThesis ? [`Thesis: ${pack.culturalThesis}`] : []),
    ...pack.multiPageRoutes.map((r) => `Route ${r.routeClass} → ${r.path}`),
    ...pack.navInventory.map((n) => `Nav ${n.label}`),
    ...pack.uxRules.slice(0, 4).map((r) => `UX: ${r}`),
  ];

  const gaps: string[] = [];
  const haveClasses = new Set(pack.multiPageRoutes.map((r) => r.routeClass));
  for (const rc of requirement.requiredRouteClasses ?? []) {
    if (!haveClasses.has(rc)) gaps.push(`Missing route class: ${rc}`);
  }
  if (pack.multiPageRoutes.length === 0) {
    gaps.push("Pack has no multiPageRoutes — walkthrough to fill IA");
  }
  if (pack.navInventory.length === 0) gaps.push("Empty navInventory");
  if (pack.footerInventory.length === 0) gaps.push("Empty footerInventory");
  if (pack.shellContract.stickyRegions.length === 0) {
    gaps.push("Shell sticky regions unspecified");
  }
  for (const bit of requirement.requiredShellBits ?? []) {
    const blob = JSON.stringify(pack.shellContract).toLowerCase();
    if (!blob.includes(bit.toLowerCase())) gaps.push(`Shell gap: ${bit}`);
  }

  return {
    domainId: pack.domainId,
    packFound: true,
    reuse,
    gaps,
    needsWalkthrough: gaps.length > 0,
  };
}

/** Research skill node ids (string graph — not all are SkillNodeId craft nodes). */
export const DOMAIN_RESEARCH_NODE_IDS = [
  "load-prior-domain",
  "requirement-gap-diff",
  "multipage-walkthrough",
  "category-gap-audit",
  "ia-shell-synthesis",
  "variant-lens",
  "emit-training-episode",
] as const;

export type DomainResearchNodeId = (typeof DOMAIN_RESEARCH_NODE_IDS)[number];

export type DomainResearchRoutePlan = {
  domainId: string;
  pack?: DomainResearchPack;
  gap: RequirementGapDiff;
  researchNodes: DomainResearchNodeId[];
  /** Craft SkillNodeIds to run after research (when brief available). */
  followOnCraft: SkillNodeId[];
};

/**
 * Always prepend the general research subgraph for website builds.
 * Sport briefs add sport-vernacular-craft after research.
 */
export function routeDomainResearchSkills(
  input: {
    domainId?: string;
    brief?: DesignBrief;
    requiredRouteClasses?: string[];
  } = {},
): DomainResearchRoutePlan {
  const brief = input.brief;
  const domainId =
    input.domainId ??
    (brief?.sportId ? `sport:${brief.sportId}` : undefined) ??
    brief?.siteKind ??
    "saas-marketing";

  const gap = requirementGapDiff(domainId, {
    requiredRouteClasses: input.requiredRouteClasses,
  });
  const pack = loadPriorDomain(domainId);

  const researchNodes: DomainResearchNodeId[] = [
    "load-prior-domain",
    "requirement-gap-diff",
  ];
  if (gap.needsWalkthrough) {
    researchNodes.push("multipage-walkthrough", "category-gap-audit");
  }
  researchNodes.push("ia-shell-synthesis", "variant-lens", "emit-training-episode");

  const followOnCraft: SkillNodeId[] = [];
  if (brief?.sportId || domainId.startsWith("sport:")) {
    followOnCraft.push("sport-matchday-web", "sport-vernacular-craft", "editorial-chapter-craft");
  }

  return {
    domainId: pack?.domainId ?? domainId,
    pack,
    gap,
    researchNodes,
    followOnCraft,
  };
}
