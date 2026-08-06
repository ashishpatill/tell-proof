/**
 * The briefs the engine is critiqued against.
 *
 * Kept apart from the critique runner so other tools (screenshots, showcases) can render exactly
 * the same pages the score was computed from, without triggering a scoring run on import.
 */
import { DesignBrief } from "../../packages/design-skills/src/types";

const RAW_BRIEFS: Array<{ id: string; brief: unknown }> = [
  {
    id: "saas-conversion",
    brief: {
      productName: "Ledgerline",
      tagline: "Close the month before the month closes you",
      audience: "controllers at 200–2000 person companies",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Continuous close", description: "Reconciliations run every night, so the close is a review instead of a scramble.", priority: "p0" },
        { id: "f2", name: "Variance explain", description: "Every unexpected number arrives with the transactions that caused it.", priority: "p0" },
        { id: "f3", name: "Audit trail", description: "Immutable history of who changed what, exportable the way auditors ask for it.", priority: "p1" },
        { id: "f4", name: "Entity consolidation", description: "Multi-entity roll-ups with intercompany elimination handled in the model.", priority: "p1" },
        { id: "f5", name: "Policy guardrails", description: "Approval thresholds enforced at entry, not discovered in review.", priority: "p2" },
      ],
      constraints: ["totally customized to content", "restrained motion", "enterprise finance buyers"],
      taste: { aestheticLean: "conversion-sharp", motion: "subtle-micro", density: "balanced", colorMood: "neutral-professional" },
    },
  },
  {
    id: "dashboard-app",
    brief: {
      productName: "Signalfloor",
      tagline: "The operations surface for freight teams",
      audience: "dispatch and operations leads",
      businessGoal: "activation",
      siteKind: "dashboard-webapp",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Live board", description: "Every load, driver, and exception on one board that updates without a refresh.", priority: "p0" },
        { id: "f2", name: "Exception queue", description: "Only the shipments that need a human, ranked by cost of delay.", priority: "p0" },
        { id: "f3", name: "Margin view", description: "Per-load economics visible while the decision is still reversible.", priority: "p1" },
        { id: "f4", name: "Carrier scorecards", description: "On-time, damage, and responsiveness history behind every assignment.", priority: "p1" },
        { id: "f5", name: "Shift handoff", description: "State of the board written down automatically at shift change.", priority: "p2" },
      ],
      constraints: ["information dense", "no decorative motion"],
      taste: { aestheticLean: "system-crafted", motion: "subtle-micro", density: "information-rich", colorMood: "dark-premium" },
    },
  },
  {
    id: "corporate-story",
    brief: {
      productName: "Northbank Partners",
      tagline: "Capital for companies that outlive their founders",
      audience: "founders and boards of family-held businesses",
      businessGoal: "trust",
      siteKind: "corporate-story",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Long-hold capital", description: "We buy to keep, so the plan is measured in decades rather than quarters.", priority: "p0" },
        { id: "f2", name: "Operating bench", description: "Former operators who have run the same problems at larger scale.", priority: "p0" },
        { id: "f3", name: "Succession design", description: "Ownership transitions structured so the business does not wobble.", priority: "p1" },
        { id: "f4", name: "Board craft", description: "Boards that ask better questions instead of more questions.", priority: "p2" },
      ],
      constraints: ["editorial", "quiet", "no spectacle"],
      taste: { aestheticLean: "refined-story", motion: "light-scroll-reveals", density: "sparse", colorMood: "soft-brand-accent", typographyWeight: "light-elegant" },
    },
  },
  {
    id: "docs-educational",
    brief: {
      productName: "Substrate",
      tagline: "How the scheduler actually decides",
      audience: "platform engineers evaluating the runtime",
      businessGoal: "trust",
      siteKind: "docs-educational",
      lockSiteKind: true,
      features: [
        { id: "f1", name: "Placement model", description: "Bin-packing with fairness constraints, explained with the real cost function.", priority: "p0" },
        { id: "f2", name: "Preemption ladder", description: "What gets evicted first, and the guarantees that survive eviction.", priority: "p0" },
        { id: "f3", name: "Backpressure", description: "How queue depth translates into admission decisions upstream.", priority: "p1" },
        { id: "f4", name: "Failure domains", description: "Spread rules and what they cost you in packing efficiency.", priority: "p1" },
      ],
      constraints: ["teaching-first", "figures over screenshots"],
      taste: { aestheticLean: "minimal-clean", motion: "none", density: "balanced", colorMood: "light-airy" },
    },
  },
  {
    id: "fintech-trust",
    brief: {
      productName: "Clearwire",
      tagline: "Treasury that moves at the speed of the invoice",
      audience: "finance leads at mid-market companies running multi-entity cash",
      businessGoal: "demos",
      siteKind: "fintech-marketing",
      lockSiteKind: true,
      features: [
        { id: "t1", name: "Same-day wires", description: "Domestic wires that leave before the cut-off you can actually see, not the one in a PDF.", priority: "p0" },
        { id: "t2", name: "Entity wallets", description: "Cash per entity with intercompany moves that post both ledgers in one action.", priority: "p0" },
        { id: "t3", name: "Approval paths", description: "Thresholds and dual control enforced at send time, not discovered in the bank portal.", priority: "p0" },
        { id: "t4", name: "FX at quote", description: "A locked rate on the payment screen so the P&L match is not a surprise tomorrow.", priority: "p1" },
        { id: "t5", name: "Audit export", description: "Every send, approval, and fail as a package auditors open without a screenshare.", priority: "p1" },
        { id: "t6", name: "Cash forecast", description: "Thirteen-week view built from open bills and scheduled pays, not a spreadsheet guess.", priority: "p2" },
      ],
      constraints: ["money-product trust", "restrained motion", "inverse-heavy"],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "subtle-micro",
        density: "balanced",
        colorMood: "neutral-professional",
        typographyWeight: "bold-confident",
      },
    },
  },
  {
    id: "studio-selected",
    brief: {
      productName: "Fieldmark",
      tagline: "Art direction that survives the handoff",
      audience: "brand and product leads hiring a studio for a system, not a deck",
      businessGoal: "trust",
      siteKind: "art-directed-studio",
      lockSiteKind: true,
      features: [
        { id: "s1", name: "Identity systems", description: "Type, colour, and motion rules that still hold when five vendors touch the brand.", priority: "p0" },
        { id: "s2", name: "Product surfaces", description: "Interfaces composed as chapters of the same system, not a separate UI kit.", priority: "p0" },
        { id: "s3", name: "Launch films", description: "Short motion pieces cut to the same grid the site and product already use.", priority: "p0" },
        { id: "s4", name: "Editorial sites", description: "Marketing pages paced like print — tension, rest, and a real visual event.", priority: "p1" },
        { id: "s5", name: "Handoff kits", description: "Tokens, specimens, and do-nots packaged so engineering does not invent a second brand.", priority: "p1" },
        { id: "s6", name: "Critique loops", description: "Structured reviews that name the tell, not a vibe, before the next round of work.", priority: "p2" },
      ],
      constraints: ["selected-work first", "paper-led", "restrained motion", "no pricing theatre"],
      brandAccent: "#1F4B6E",
      taste: {
        aestheticLean: "refined-story",
        motion: "light-scroll-reveals",
        density: "sparse",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    },
  },
  {
    id: "consumer-craft",
    brief: {
      productName: "Harborline",
      tagline: "The everyday bag that earns its keep",
      audience: "people who carry work and weekend in the same bag",
      businessGoal: "sales",
      siteKind: "consumer-craft",
      lockSiteKind: true,
      brandAccent: "#0F5C4C",
      features: [
        { id: "v1", name: "One-bag day", description: "Laptop, shoes, and groceries without turning the bag into a suitcase.", priority: "p0" },
        { id: "v2", name: "Quiet hardware", description: "Zips and pulls that do not announce themselves across a quiet room.", priority: "p0" },
        { id: "v3", name: "Weather skin", description: "A finish that shrugs off rain without looking like outdoor gear.", priority: "p0" },
        { id: "v4", name: "Repair path", description: "A zipper or strap replaced in weeks, not a whole bag written off.", priority: "p1" },
        { id: "v5", name: "Carry modes", description: "Shoulder, crossbody, and hand — the strap changes, the silhouette does not.", priority: "p1" },
        { id: "v6", name: "Pack map", description: "Pockets named for what goes in them, so unpacking is not a hunt.", priority: "p2" },
      ],
      constraints: ["figure-dense", "voice-led", "no SaaS pricing theatre", "restrained motion"],
      taste: {
        aestheticLean: "conversion-sharp",
        motion: "subtle-micro",
        density: "balanced",
        colorMood: "neutral-professional",
        typographyWeight: "medium-modern",
        roundingDepth: "soft",
      },
    },
  },
  {
    id: "foundry-editorial",
    brief: {
      productName: "Glyph Press",
      tagline: "Faces cut for the sizes you actually set",
      audience: "art directors and editorial designers commissioning a text face",
      businessGoal: "trust",
      siteKind: "editorial-foundry",
      lockSiteKind: true,
      brandAccent: "#1A3A4A",
      features: [
        { id: "g1", name: "Display cut", description: "Tight tracking and open counters that hold at poster size without going brittle.", priority: "p0" },
        { id: "g2", name: "Text cut", description: "Optical size for long reading — ink traps and spacing tuned for 10–12 point.", priority: "p0" },
        { id: "g3", name: "Caption cut", description: "A denser face for labels and footnotes that still matches the text colour.", priority: "p0" },
        { id: "g4", name: "Italic mates", description: "True italics drawn as companions, not slanted romans with a costume change.", priority: "p1" },
        { id: "g5", name: "Tabular figures", description: "Lining and oldstyle numerals that keep columns honest in tables and price lists.", priority: "p1" },
        { id: "g6", name: "Language coverage", description: "Latin extended with the marks editorial work actually needs, not a checkbox dump.", priority: "p2" },
      ],
      constraints: ["type-craft first", "paper-led", "hard-seam fold", "no pricing theatre", "restrained motion"],
      taste: {
        aestheticLean: "refined-story",
        motion: "light-scroll-reveals",
        density: "sparse",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    },
  },
];

/**
 * Holdout. The matrix above is the scored set, and it is easy to tune the engine until those
 * briefs score well and everything else quietly regresses. This one is deliberately unlike them —
 * a different industry, an information-rich commerce surface, a brand accent supplied by the client —
 * and it is scored separately. If it trails the matrix average by more than a few points, the last
 * loop tuned the briefs rather than the engine.
 */
const HOLDOUT_BRIEF = {
  id: "holdout-commerce",
  brief: {
    productName: "Bramble & Fold",
    tagline: "Wholesale ordering that does not need a phone call",
    audience: "independent grocers and their suppliers",
    businessGoal: "sales",
    siteKind: "saas-marketing",
    lockSiteKind: true,
    brandAccent: "#7A4B2A",
    features: [
      { id: "h1", name: "Standing orders", description: "Recurring baskets that adjust to the season instead of repeating last week by rote.", priority: "p0" },
      { id: "h2", name: "Substitution rules", description: "Say once what may replace what, and stop approving the same swap every Tuesday.", priority: "p0" },
      { id: "h3", name: "Delivery windows", description: "Cut-off times a supplier can actually hold, published where buyers see them.", priority: "p1" },
      { id: "h4", name: "Credit terms", description: "Terms, limits, and outstanding balance visible on the order screen, not in an email chain.", priority: "p1" },
      { id: "h5", name: "Shortfall alerts", description: "Notice of a short delivery early enough to source elsewhere.", priority: "p1" },
      { id: "h6", name: "Price history", description: "What each line cost across the last twelve weeks, so a rise is a conversation.", priority: "p2" },
    ],
    constraints: ["information dense", "no decorative motion", "trade buyers"],
    taste: { aestheticLean: "system-crafted", motion: "subtle-micro", density: "information-rich", colorMood: "soft-brand-accent", typographyWeight: "bold-confident", roundingDepth: "soft-elevation" },
  },
};

export const CRITIQUE_BRIEFS = RAW_BRIEFS.map((entry) => ({ id: entry.id, brief: DesignBrief.parse(entry.brief) }));
export const HOLDOUT = { id: HOLDOUT_BRIEF.id, brief: DesignBrief.parse(HOLDOUT_BRIEF.brief) };
