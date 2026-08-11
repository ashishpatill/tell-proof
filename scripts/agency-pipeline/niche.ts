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
  /** Optional sport vernacular pack — forces sport-site-research craft path. */
  sportId?: "cricket" | "football" | "hockey" | "tennis";
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
  {
    key: "cricket",
    match: /cricket|cric|ipl|t20|odi|test match|wicket|crease|howzat/i,
    productName: "CREASE",
    tagline: "Scores you can scan between overs",
    audience: "cricket fans on a second screen during live play",
    primaryCta: "Open match theater",
    businessGoal: "activation",
    siteKind: "dashboard-webapp",
    brandAccent: "#1F5A48",
    taste: {
      aestheticLean: "refined-story",
      density: "information-rich",
      motion: "light-scroll-reveals",
      colorMood: "soft-brand-accent",
      typographyWeight: "medium-modern",
      roundingDepth: "sharp",
    },
    lane: "documentary-chapters",
    craftNodes: ["sport-vernacular-craft", "editorial-chapter-craft"],
    visualThesis:
      "Match theater — stable score spine, situation equation, this-over trail; notebook for sit-with reading.",
    signature: "Crease line + over-as-six-bead trail — not generic sports card grids.",
    typeNotes: "Tabular mono for scores; display for brand; situation line before essays.",
    spacingNotes: "Glance rail sticky; inverted pyramid; format lens switches secondary facts.",
    motionNotes: "Live pulse only; scroll reveals once; reduced-motion safe.",
    seedCategory: "sport-cricket",
    corridorHint: "dashboard-webapp",
    sportId: "cricket",
    features: [
      {
        id: "c1",
        name: "Stable score spine",
        description: "Runs/wickets and overs stay put while numbers update",
        priority: "p0",
      },
      {
        id: "c2",
        name: "Situation equation",
        description: "Need X from Y balls — or lead by Z in Tests — before deeper stats",
        priority: "p0",
      },
      {
        id: "c3",
        name: "This-over trail",
        description: "Six delivery beads: dots, runs, boundaries, wickets, extras",
        priority: "p0",
      },
      {
        id: "c4",
        name: "Format lens",
        description: "Test sessions vs ODI/T20 required rate — never one UI for all formats",
        priority: "p1",
      },
      {
        id: "c5",
        name: "Notebook mode",
        description: "Sit-with editorial separate from glance-live",
        priority: "p1",
      },
    ],
  },
  {
    key: "football",
    match: /football|soccer|premier league|goal line|kick-?off|\bvar\b/i,
    productName: "PITCHCLOCK",
    tagline: "Minute and scoreline first",
    audience: "football fans checking live matches between tasks",
    primaryCta: "Open live board",
    businessGoal: "activation",
    siteKind: "dashboard-webapp",
    brandAccent: "#0B3D2E",
    taste: {
      aestheticLean: "system-crafted",
      density: "information-rich",
      motion: "subtle-micro",
      colorMood: "dark-premium",
      typographyWeight: "bold-confident",
      roundingDepth: "soft",
    },
    lane: "minimal-editorial-grid",
    craftNodes: ["sport-vernacular-craft", "dashboard-or-webapp-ui"],
    visualThesis: "Continuous-clock sport — minute + scoreline locked; events timeline secondary.",
    signature: "Stoppage and VAR honesty — provisional goals labeled until confirmed.",
    typeNotes: "Bold scoreline; quiet event log; table stakes one glance away.",
    spacingNotes: "No formation chrome before the clock.",
    motionNotes: "Subtle live pulse; no layout jump on goal.",
    seedCategory: "sport-football",
    corridorHint: "dashboard-webapp",
    sportId: "football",
    features: [
      {
        id: "f1",
        name: "Minute scoreline",
        description: "Clock and score locked as the glance unit",
        priority: "p0",
      },
      {
        id: "f2",
        name: "Events timeline",
        description: "Goals and cards as a clean vertical log",
        priority: "p0",
      },
      {
        id: "f3",
        name: "Stakes strip",
        description: "Table or knockout implication beside the live view",
        priority: "p1",
      },
    ],
  },
  {
    key: "hockey",
    match: /\bhockey\b|nhl|power play|face-?off|rink\b/i,
    productName: "BOARDS",
    tagline: "Period, strength, score",
    audience: "hockey fans tracking period tempo and special teams",
    primaryCta: "Open rink board",
    businessGoal: "activation",
    siteKind: "dashboard-webapp",
    brandAccent: "#1A3A5C",
    taste: {
      aestheticLean: "system-crafted",
      density: "information-rich",
      motion: "subtle-micro",
      colorMood: "dark-premium",
      typographyWeight: "medium-modern",
      roundingDepth: "sharp",
    },
    lane: "nested-premium-shells",
    craftNodes: ["sport-vernacular-craft", "glass-shell-craft"],
    visualThesis: "Period + man-advantage state adjacent to score — not football with ice.",
    signature: "Power-play timer as a first-class glance fact.",
    typeNotes: "Cold contrast; tabular clocks; quiet shot counters.",
    spacingNotes: "Strength state never buried.",
    motionNotes: "Fast updates without jitter.",
    seedCategory: "sport-hockey",
    corridorHint: "dashboard-webapp",
    sportId: "hockey",
    features: [
      {
        id: "h1",
        name: "Period clock spine",
        description: "Score + period + clock in one stable band",
        priority: "p0",
      },
      {
        id: "h2",
        name: "Strength state",
        description: "Even strength / PP / PK with timers",
        priority: "p0",
      },
    ],
  },
  {
    key: "tennis",
    match: /tennis|grand slam|wimbledon|break point|tie-?break|racket/i,
    productName: "BASELINE",
    tagline: "Sets, games, points — stacked",
    audience: "tennis fans who need the nested score without decoding",
    primaryCta: "Open court board",
    businessGoal: "activation",
    siteKind: "art-directed-studio",
    brandAccent: "#2F5D50",
    taste: {
      aestheticLean: "refined-story",
      density: "balanced",
      motion: "light-scroll-reveals",
      colorMood: "light-airy",
      typographyWeight: "light-elegant",
      roundingDepth: "soft",
    },
    lane: "image-first-stage",
    craftNodes: ["sport-vernacular-craft", "image-first-fold"],
    visualThesis: "Nested scoring stack preserved — never flattened to one ambiguous scoreline.",
    signature: "Server marker + break/set/match point flags as text, not color-only.",
    typeNotes: "Elegant display for brand; mono for point stack.",
    spacingNotes: "Pressure flags adjacent to the point score.",
    motionNotes: "Quiet point pulses; reduced-motion safe.",
    seedCategory: "sport-tennis",
    corridorHint: "art-directed-studio",
    sportId: "tennis",
    features: [
      {
        id: "t1",
        name: "Nested score stack",
        description: "Sets | games | points with server marker",
        priority: "p0",
      },
      {
        id: "t2",
        name: "Pressure flags",
        description: "Break / set / match point called out in text",
        priority: "p0",
      },
      {
        id: "t3",
        name: "Format lens",
        description: "Best-of-3 vs best-of-5 switches secondary facts",
        priority: "p0",
      },
      {
        id: "t4",
        name: "Challenge honesty",
        description: "Challenge pending as a calm provisional state",
        priority: "p1",
      },
      {
        id: "t5",
        name: "Notebook mode",
        description: "Sit-with editorial separate from glance-live",
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
    ...(preset.sportId ? { sportId: preset.sportId } : {}),
  };
}

export function directionMarkdown(
  preset: NichePreset,
  query: string,
  refMode: string,
  memory?: EngineMemory,
  corridor?: { category: string; source: string; notes: string[] },
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
  const corridorLines =
    corridor && corridor.notes.length
      ? [
          "## Measured corridor",
          "",
          `Source: \`${corridor.source}\` · category \`${corridor.category}\``,
          ...corridor.notes.map((n) => `- ${n}`),
          "",
        ]
      : [];

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
    ...corridorLines,
    ...(hints.length || pipeline.length
      ? ["## Engine memory (from prior runs)", "", ...hints, ...pipeline, ""]
      : []),
  ].join("\n");
}
