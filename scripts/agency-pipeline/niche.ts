/**
 * Niche presets — map a free-text requirement to Tell brief + design-rigor lane.
 * No third-party hosts or product names here. Live reference URLs live only in
 * gitignored `research/boards.seeds.local.json` / `research/boards.local.json`.
 * Learned boosts come from research/agency-engine-memory.json (agency:learn).
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DesignBrief } from "../../packages/design-skills/src/types";
import { compileBoost, loadMemory, type EngineMemory } from "./memory";

function repoRoot(from = process.cwd()): string {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

export type CompositionalLane =
  | "minimal-editorial-grid"
  | "nested-premium-shells"
  | "image-first-stage"
  | "documentary-chapters"
  | "conversion-landing";

export type NichePreset = {
  key: string;
  match: RegExp;
  productName: string;
  tagline: string;
  audience: string;
  primaryCta: string;
  businessGoal: DesignBrief["businessGoal"];
  siteKind: DesignBrief["siteKind"];
  brandAccent: string;
  taste: NonNullable<DesignBrief["taste"]>;
  lane: CompositionalLane;
  craftNodes: [string, string];
  visualThesis: string;
  signature: string;
  typeNotes: string;
  spacingNotes: string;
  motionNotes: string;
  features: DesignBrief["features"];
  /** Category key into boards.seeds.local.json */
  seedCategory: string;
  /** Measured corridor category hint (aggregate.json byCategory) */
  corridorHint: string;
};

export const NICHE_PRESETS: NichePreset[] = [
  {
    key: "photography",
    match: /photo|lens|portrait|wedding|studio shoot|gallery wall|photographer/i,
    productName: "Lensroom",
    tagline: "Sessions that earn the wall",
    audience: "freelance photographers charging $2K+ per shoot",
    primaryCta: "Book a call",
    businessGoal: "leads",
    siteKind: "art-directed-studio",
    brandAccent: "#1A3A4A",
    taste: {
      aestheticLean: "refined-story",
      density: "sparse",
      motion: "light-scroll-reveals",
      colorMood: "light-airy",
      typographyWeight: "light-elegant",
      roundingDepth: "sharp",
    },
    lane: "image-first-stage",
    craftNodes: ["image-first-fold", "agency-minimal-grid"],
    visualThesis: "Print-grade photography sessions — figure owns the fold; one booking action.",
    signature: "Aperture / negative / print-wall vernacular — not SaaS metrics theater.",
    typeNotes: "Oversized display; quiet body; microscopic meta. Display ≠ Inter.",
    spacingNotes: "Open spans around plates; generous gallery rhythm — not equal cards.",
    motionNotes: "Quiet entry; 200–300ms hover; one motion system; reduced-motion finals.",
    seedCategory: "portfolio-photography",
    corridorHint: "art-directed-studio",
    features: [
      {
        id: "p1",
        name: "Daylight sessions",
        description: "Location work timed to the hour the room actually looks expensive",
        priority: "p0",
      },
      {
        id: "p2",
        name: "Print-ready selects",
        description: "A shortlist graded for gallery walls, not social crops",
        priority: "p0",
      },
      {
        id: "p3",
        name: "Booking that respects the calendar",
        description: "One call to lock date, retainer, and shot list",
        priority: "p0",
      },
      {
        id: "p4",
        name: "Retainer weeks",
        description: "Multi-day brand stories with the same lighting language throughout",
        priority: "p1",
      },
    ],
  },
  {
    key: "saas",
    match: /saas|b2b|demo|startup|product.?led|subscription|dashboard.?market/i,
    productName: "Northstar",
    tagline: "Pipeline clarity before the demo",
    audience: "B2B teams booking product demos this week",
    primaryCta: "Book a demo",
    businessGoal: "demos",
    siteKind: "saas-marketing",
    brandAccent: "#0F3D3E",
    taste: {
      aestheticLean: "conversion-sharp",
      density: "balanced",
      motion: "subtle-micro",
      colorMood: "neutral-professional",
      typographyWeight: "medium-modern",
      roundingDepth: "soft",
    },
    lane: "conversion-landing",
    craftNodes: ["conversion-landing-craft", "product-proof-stage"],
    visualThesis: "One offer, one audience, one demo CTA — proof before claims.",
    signature: "Workflow-proof stage as the product thesis — not three equal feature cards.",
    typeNotes: "Confident display; scannable body; clear CTA verbs.",
    spacingNotes: "Conversion rhythm: claim → proof → objection → CTA. No cramped folds.",
    motionNotes: "Subtle micro + light reveals; never bounce; reduced-motion safe.",
    seedCategory: "saas-landing",
    corridorHint: "premium-b2b-saas",
    features: [
      {
        id: "s1",
        name: "Account scoring",
        description: "Surface the accounts worth a live walkthrough before the call",
        priority: "p0",
      },
      {
        id: "s2",
        name: "Sample workflow",
        description: "Show input → draft → human approve so buyers trust the path",
        priority: "p0",
      },
      {
        id: "s3",
        name: "Risk notes",
        description: "Name cancel and rollback near the final CTA",
        priority: "p0",
      },
    ],
  },
  {
    key: "agency",
    match: /agency|studio|brand.?system|art.?direct|creative.?studio|portfolio.?studio/i,
    productName: "Fieldmark",
    tagline: "Art direction that survives the handoff",
    audience: "brand and product leads hiring a studio for a system, not a deck",
    primaryCta: "Start a conversation",
    businessGoal: "trust",
    siteKind: "art-directed-studio",
    brandAccent: "#1F4B6E",
    taste: {
      aestheticLean: "refined-story",
      density: "sparse",
      motion: "light-scroll-reveals",
      colorMood: "light-airy",
      typographyWeight: "light-elegant",
      roundingDepth: "sharp",
    },
    lane: "minimal-editorial-grid",
    craftNodes: ["agency-minimal-grid", "editorial-chapter-craft"],
    visualThesis: "Editorial agency grid — oversized type, selected work, quiet proof.",
    signature: "Hard type hierarchy + selected-work register — not glass card stacks.",
    typeNotes: "Billboard display with tiny utility labels in adjacent columns.",
    spacingNotes: "Large open spans; hairline structure; intentional empty air.",
    motionNotes: "Masked reveals and slow settle only; one motion system.",
    seedCategory: "agency-editorial",
    corridorHint: "art-directed-studio",
    features: [
      {
        id: "a1",
        name: "Identity systems",
        description: "Type, colour, and motion rules that still hold when vendors touch the brand",
        priority: "p0",
      },
      {
        id: "a2",
        name: "Product surfaces",
        description: "Interfaces composed as chapters of the same system",
        priority: "p0",
      },
      {
        id: "a3",
        name: "Handoff kits",
        description: "Tokens and do-nots packaged so engineering does not invent a second brand",
        priority: "p1",
      },
    ],
  },
  {
    key: "fintech",
    match: /fintech|treasury|payments?|banking|money.?mov/i,
    productName: "Ledgerline",
    tagline: "Treasury that clears diligence",
    audience: "finance leads short-listing money-movement tools",
    primaryCta: "Request a walkthrough",
    businessGoal: "trust",
    siteKind: "fintech-marketing",
    brandAccent: "#12352B",
    taste: {
      aestheticLean: "system-crafted",
      density: "balanced",
      motion: "subtle-micro",
      colorMood: "neutral-professional",
      typographyWeight: "medium-modern",
      roundingDepth: "sharp",
    },
    lane: "nested-premium-shells",
    craftNodes: ["paper-technical-frame", "conversion-landing-craft"],
    visualThesis: "Money-movement trust — wire fold, calibrated contrast, one walkthrough CTA.",
    signature: "Cutoff rail + wire ledger as the fold instrument — not violet glow SaaS.",
    typeNotes: "Precise display; tabular meta for amounts; calm body.",
    spacingNotes: "Technical frames with breathing room; no ornamental bento.",
    motionNotes: "Micro only; reduced-motion finals; no parallax theater.",
    seedCategory: "fintech-trust",
    corridorHint: "fintech-product",
    features: [
      {
        id: "f1",
        name: "Wire ledger",
        description: "Show the send path with tolerances a diligence review can read",
        priority: "p0",
      },
      {
        id: "f2",
        name: "Cutoff rail",
        description: "Make settlement windows visible before the walkthrough",
        priority: "p0",
      },
      {
        id: "f3",
        name: "Audit notes",
        description: "Declare controls beside the claim they support",
        priority: "p1",
      },
    ],
  },
];

export const DEFAULT_NICHE = NICHE_PRESETS[0]!;

export function matchNiche(query: string, memory?: EngineMemory): NichePreset {
  const q = query.trim();
  const mem = memory ?? loadMemory(repoRoot());

  // Learned boosts win only when they hit — checked before default fallthrough,
  // after explicit preset regexes so hand-authored presets stay primary.
  for (const preset of NICHE_PRESETS) {
    if (preset.match.test(q)) return preset;
  }
  for (const boost of mem.nicheBoosts) {
    const re = compileBoost(boost.pattern);
    if (!re?.test(q)) continue;
    const hit = NICHE_PRESETS.find((p) => p.key === boost.nicheKey);
    if (hit) return hit;
  }
  return DEFAULT_NICHE;
}

export function slugifyRunId(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "agency-run"
  );
}

export function briefFromNiche(
  preset: NichePreset,
  opts: {
    productName?: string;
    primaryCta?: string;
    audience?: string;
    query: string;
    memory?: EngineMemory;
  },
): DesignBrief {
  const productName = opts.productName?.trim() || preset.productName;
  const primaryCta = opts.primaryCta?.trim() || preset.primaryCta;
  const audience = opts.audience?.trim() || preset.audience;
  const mem = opts.memory ?? loadMemory(repoRoot());
  const bans = [
    "purple gradients",
    "emoji as icons",
    "Inter as the display font",
    "generic stock-photo placeholders",
    "centered-everything layouts",
    "equal three-card feature grids",
    "award claims without evidence",
    "fake logo-wall theater",
    ...mem.bansExtra,
  ];
  // de-dupe case-insensitive
  const banList = bans.filter(
    (b, i) => bans.findIndex((x) => x.toLowerCase() === b.toLowerCase()) === i,
  );
  return {
    productName,
    tagline: preset.tagline,
    audience,
    businessGoal: preset.businessGoal,
    siteKind: preset.siteKind,
    lockSiteKind: true,
    primaryCta,
    banList,
    brandAccent: preset.brandAccent,
    taste: preset.taste,
    features: preset.features,
    constraints: [
      "totally customized to content",
      "not distracting with too many animations",
      "multi-million-dollar business quality",
      `compositional lane: ${preset.lane}`,
      `craft nodes: ${preset.craftNodes.join(", ")}`,
      `query: ${opts.query.slice(0, 160)}`,
    ],
    referenceBoardPaths: [],
  };
}

export function directionMarkdown(
  preset: NichePreset,
  query: string,
  refMode: string,
  memory?: EngineMemory,
): string {
  const mem = memory ?? loadMemory(repoRoot());
  const hints = mem.craftHints
    .filter((h) => h.siteKind === preset.siteKind)
    .slice(-3)
    .map((h) => `- Learned: ${h.note}`);
  const pipeline = mem.pipelineNotes
    .filter((n) => n.key.includes(preset.seedCategory) || n.key.includes(preset.key))
    .slice(-3)
    .map((n) => `- Pipeline: ${n.detail}`);

  return [
    `# Direction note — ${preset.productName}`,
    "",
    "Match the typography scale, spacing rhythm, and motion of the reference board.",
    "Do not copy the layouts.",
    "",
    `Auto-generated from query: ${query}`,
    `Ref mode: ${refMode}`,
    "",
    "## DESIGN_RIGOR fields",
    "",
    `- **Visual thesis:** ${preset.visualThesis}`,
    `- **Compositional lane:** ${preset.lane}`,
    `- **Craft nodes (1–2):** ${preset.craftNodes.map((c) => `\`${c}\``).join(", ")}`,
    `- **Type:** ${preset.typeNotes}`,
    `- **Spacing:** ${preset.spacingNotes}`,
    `- **Motion:** ${preset.motionNotes}`,
    `- **Signature (invent, do not clone):** ${preset.signature}`,
    "- **Asset honesty:** Declared features only — no fake logo walls or award claims.",
    "",
    "## Corridor hint",
    "",
    `\`${preset.corridorHint}\` — use measured bands when live refs are thin.`,
    "",
    ...(hints.length || pipeline.length
      ? ["## Engine memory (from prior runs)", "", ...hints, ...pipeline, ""]
      : []),
  ].join("\n");
}
