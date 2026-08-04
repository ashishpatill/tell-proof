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
];

/**
 * Holdout. The matrix above is four briefs, and it is easy to tune the engine until those four
 * score well and everything else quietly regresses. This one is deliberately unlike them — a
 * different industry, an information-rich commerce surface, a brand accent supplied by the client —
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
