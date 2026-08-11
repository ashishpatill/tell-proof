/**
 * Sport vernacular packs — research-backed IA + cultural cues for matchday sites.
 * Principle-only: no third-party product/host names.
 *
 * Agents MUST run `sport-site-research` before building any sport site.
 * Use `getSportPack(id)` / `matchSportFromQuery(query)` to seed briefs + niche.
 */

import { z } from "zod";

export const SportId = z.enum(["cricket", "football", "hockey", "tennis"]);
export type SportId = z.infer<typeof SportId>;

export const SportAccessMode = z.enum([
  /** Frequent short glances during live play (second-screen). */
  "glance-live",
  /** Sit-with-the-game reading: notebook, analysis, series arc. */
  "sit-with",
  /** Pre-match planning: schedule, squads, venues. */
  "before-play",
  /** Post-match archive: scorecard, records, highlights. */
  "after-play",
]);
export type SportAccessMode = z.infer<typeof SportAccessMode>;

export type SportPrimaryFact = {
  id: string;
  label: string;
  /** Why fans need this in the first glance. */
  why: string;
};

export type SportFormatLens = {
  id: string;
  label: string;
  /** Time / structure mental model. */
  tempo: string;
  /** Facts that matter more in this format. */
  emphasize: string[];
  /** Facts to demote or hide. */
  demote: string[];
};

export type SportMultiPageRoute = {
  id: string;
  path: string;
  routeClass: string;
  purpose: string;
};

export type SportShellContract = {
  stickyRegions: string[];
  primaryNavMaxItems: number;
  liveSurface?: string;
  mobileNavPattern: string;
  footerDepth: "minimal" | "utility" | "directory";
};

/**
 * Sport vernacular pack — implements DomainResearchPack multipage/shell fields
 * for matchday domains (see `domain-research.ts` → `sportPackToDomainResearch`).
 */
export type SportVernacularPack = {
  id: SportId;
  label: string;
  /** One-line cultural thesis for the product. */
  culturalThesis: string;
  /** Ritual language fans already share (use in labels/microcopy). */
  ritualLexicon: string[];
  /** How fans actually open the product. */
  accessModes: SportAccessMode[];
  /** Ordered first-glance facts (inverted pyramid). */
  primaryFacts: SportPrimaryFact[];
  /** Format / competition lenses that change the UI. */
  formatLenses: SportFormatLens[];
  /** Category failures — what generic portals leave broken. */
  categoryGaps: string[];
  /** UX rules unique to this sport (not generic sports UI). */
  uxRules: string[];
  /** Technical concepts the interface must model honestly. */
  technicalConcepts: string[];
  /** Visual / material vernacular (atmosphere, not decoration). */
  materialVernacular: string[];
  /** Suggested Taste Controls seed. */
  tasteSeed: {
    aestheticLean: "minimal-clean" | "conversion-sharp" | "system-crafted" | "refined-story";
    density: "sparse" | "balanced" | "information-rich";
    motion: "none" | "subtle-micro" | "light-scroll-reveals";
    colorMood: "neutral-professional" | "soft-brand-accent" | "dark-premium" | "light-airy";
    typographyWeight: "light-elegant" | "medium-modern" | "bold-confident";
    roundingDepth: "sharp" | "soft" | "soft-elevation";
  };
  /** Compositional lane for agency pipeline. */
  lane: "minimal-editorial-grid" | "nested-premium-shells" | "image-first-stage" | "documentary-chapters" | "conversion-landing";
  craftNodes: [string, string];
  brandAccent: string;
  /** Multipage IA (DomainResearchPack) — filled from portal evidence when researched. */
  multiPageRoutes?: SportMultiPageRoute[];
  shellContract?: SportShellContract;
  navInventory?: Array<{ id: string; label: string; routeClass: string; priority: "primary" | "secondary" | "utility" }>;
  footerInventory?: Array<{ id: string; title: string; links: string[] }>;
  controlTaxonomy?: Array<{ id: string; role: string; states: string[] }>;
};

const CRICKET: SportVernacularPack = {
  id: "cricket",
  label: "Cricket",
  culturalThesis:
    "Cricket is a game of overs, sessions, and situation — fans live between balls, not between pages. The product must answer the chase equation before it sells atmosphere.",
  ritualLexicon: [
    "crease",
    "over",
    "session",
    "tea",
    "partnership",
    "required rate",
    "powerplay",
    "declaration",
    "nightwatchman",
    "new ball",
    "DRS",
    "free hit",
    "super over",
  ],
  accessModes: ["glance-live", "sit-with", "before-play", "after-play"],
  primaryFacts: [
    {
      id: "score-wickets",
      label: "Runs / wickets",
      why: "The spine of every glance — must not jump layout when updating",
    },
    {
      id: "overs",
      label: "Overs bowled / remaining",
      why: "Progress clock unique to limited-overs and Test day targets",
    },
    {
      id: "situation",
      label: "Situation line (need X from Y / lead by Z)",
      why: "Fans ask 'where are we?' before 'who scored'",
    },
    {
      id: "rates",
      label: "CRR / RRR (or session rate in Tests)",
      why: "Chase and declare decisions are rate math",
    },
    {
      id: "this-over",
      label: "This-over ball trail",
      why: "The unit of drama is the over — six deliveries, not a continuous clock",
    },
    {
      id: "strike-pair",
      label: "Striker · non-striker · bowler",
      why: "Live identity of the contest, updated every ball",
    },
  ],
  formatLenses: [
    {
      id: "test",
      label: "Test / first-class",
      tempo: "Days and sessions — lunch, tea, stumps; draws are valid stories",
      emphasize: ["session", "lead/trail", "new ball", "declaration", "day number"],
      demote: ["required rate", "powerplay", "super over"],
    },
    {
      id: "odi",
      label: "ODI / List A",
      tempo: "One long day — phases and bowling quotas shape the chase",
      emphasize: ["required rate", "overs left", "powerplay phases", "bowler overs left"],
      demote: ["session breaks as primary", "draw framing"],
    },
    {
      id: "t20",
      label: "T20 / T20I",
      tempo: "Three-hour burst — every over is an event",
      emphasize: ["this-over trail", "required rate", "death overs", "boundaries"],
      demote: ["multi-day narrative chrome", "session clocks"],
    },
  ],
  categoryGaps: [
    "Score spines that reshuffle on every refresh — glance trust dies",
    "Same UI for Test and T20 — wrong tempo and wrong facts",
    "Situation buried under ads, fantasy CTAs, and equal card grids",
    "Heavy imagery before score paint — second-screen fans on mid-range phones lose patience",
    "Ball-by-ball as a wall of text instead of an over trail",
    "No honesty when the feed is delayed or a review is pending",
    "Editorial depth and live glance fighting for the same surface without modes",
  ],
  uxRules: [
    "Inverted pyramid: status → score → situation → rates → this-over → deeper scorecard",
    "Stable score spine — tabular numerals; layout positions do not shift on update",
    "Format lens switches which secondary facts appear",
    "Progressive disclosure: full scorecard one tap away, never on the glance fold",
    "Announce live changes at over/wicket checkpoints for assistive tech — not every ball by default",
    "Latency and review states are visible, calm, and factual",
    "Mobile-first second-screen; daylight + indoor contrast for pitch greens and chalk text",
  ],
  technicalConcepts: [
    "Legal delivery vs extras (wide, no-ball) and free-hit state",
    "Strike rotation and end change",
    "Derived rates computed client-side from confirmed events",
    "Provisional ball during DRS / third umpire",
    "DLS/method target revisions in interrupted limited-overs",
    "Super Over as a nested innings, not a decoration",
  ],
  materialVernacular: [
    "Pitch ink / turf dusk",
    "Cherry leather (red ball) and white-ball night flood",
    "Crease line as signature rule",
    "Scoreboard chalk / pavilion board rhythm",
    "Over as a six-bead trail",
  ],
  tasteSeed: {
    aestheticLean: "refined-story",
    density: "information-rich",
    motion: "light-scroll-reveals",
    colorMood: "soft-brand-accent",
    typographyWeight: "medium-modern",
    roundingDepth: "sharp",
  },
  lane: "documentary-chapters",
  craftNodes: ["sport-vernacular-craft", "editorial-chapter-craft"],
  brandAccent: "#1F5A48",
  multiPageRoutes: [
    { id: "home", path: "/crease", routeClass: "home", purpose: "Match list + live entry + series pulse" },
    { id: "live", path: "/crease/live", routeClass: "live-match", purpose: "Glance-live score spine + this-over + situation + commentary" },
    { id: "scorecard", path: "/crease/scorecard", routeClass: "scorecard", purpose: "Full batting/bowling + partnerships + fall of wickets" },
    { id: "series", path: "/crease/series", routeClass: "series", purpose: "Series arc, fixtures chapters, points table" },
    { id: "rankings", path: "/crease/rankings", routeClass: "rankings", purpose: "Team and player rankings dual axis" },
    { id: "notebook", path: "/crease/notebook", routeClass: "notebook", purpose: "Sit-with editorial notes" },
    { id: "fixtures", path: "/crease/fixtures", routeClass: "fixtures", purpose: "Before-play schedule calendar" },
    { id: "teams", path: "/crease/teams", routeClass: "teams", purpose: "Team hubs — form, next fixture" },
    { id: "players", path: "/crease/players", routeClass: "players", purpose: "Player cards from strike pair / bowler identity" },
    { id: "stats", path: "/crease/stats", routeClass: "stats", purpose: "Records index / after-play archive" },
  ],
  shellContract: {
    stickyRegions: ["top-status", "score-spine", "live-rail"],
    primaryNavMaxItems: 6,
    liveSurface: "sticky score spine + optional live rail",
    mobileNavPattern: "primary six in header overflow + sticky live chip",
    footerDepth: "directory",
  },
  navInventory: [
    { id: "home", label: "Home", routeClass: "home", priority: "primary" },
    { id: "live", label: "Live", routeClass: "live-match", priority: "primary" },
    { id: "scorecard", label: "Scorecard", routeClass: "scorecard", priority: "primary" },
    { id: "series", label: "Series", routeClass: "series", priority: "primary" },
    { id: "rankings", label: "Rankings", routeClass: "rankings", priority: "primary" },
    { id: "notebook", label: "Notebook", routeClass: "notebook", priority: "primary" },
  ],
  footerInventory: [
    { id: "match", title: "Match", links: ["Live", "Scorecard", "Commentary", "Partnerships"] },
    { id: "compete", title: "Compete", links: ["Series", "Fixtures", "Rankings", "Teams"] },
    { id: "people", title: "People", links: ["Players", "Stats & records", "Player rankings"] },
    { id: "read", title: "Read", links: ["Notebook", "Features", "Home"] },
  ],
  controlTaxonomy: [
    { id: "format-chip", role: "Toggle Test / ODI / T20 lens", states: ["default", "selected", "hover", "focus-visible"] },
    { id: "live-chip", role: "Jump to live match", states: ["default", "live-pulse", "hover", "focus-visible"] },
    { id: "rankings-tab", role: "Switch ranking tables", states: ["default", "selected", "hover", "focus-visible"] },
    { id: "status-tab", role: "Filter Live / Upcoming / Completed", states: ["default", "selected", "hover", "focus-visible"] },
    { id: "axis-tab", role: "Switch team vs player rankings", states: ["default", "selected", "hover", "focus-visible"] },
    { id: "primary-cta", role: "Open scorecard / follow match", states: ["default", "hover", "focus-visible", "disabled"] },
  ],
};

const FOOTBALL: SportVernacularPack = {
  id: "football",
  label: "Football",
  culturalThesis:
    "Football is continuous time with sudden punctuation — minute, scoreline, and who is on the ball matter more than decorative heatmaps on first paint.",
  ritualLexicon: [
    "kick-off",
    "stoppage time",
    "VAR",
    "set piece",
    "press",
    "derbies",
    "table",
    "goal difference",
    "clean sheet",
  ],
  accessModes: ["glance-live", "sit-with", "before-play", "after-play"],
  primaryFacts: [
    {
      id: "scoreline",
      label: "Scoreline + minute",
      why: "The universal glance unit",
    },
    {
      id: "state",
      label: "Kick-off / HT / FT / stoppage",
      why: "Clock semantics differ from cricket overs",
    },
    {
      id: "scorers",
      label: "Goal scorers timeline",
      why: "Narrative of the match in one column",
    },
    {
      id: "table-context",
      label: "Table / knockout implication",
      why: "Fans watch stakes, not only the score",
    },
  ],
  formatLenses: [
    {
      id: "league",
      label: "League match",
      tempo: "Ninety minutes + stoppage; table movement is the season arc",
      emphasize: ["minute", "scoreline", "table delta"],
      demote: ["series session language"],
    },
    {
      id: "cup",
      label: "Cup / knockout",
      tempo: "Single elimination pressure; extra time and penalties possible",
      emphasize: ["aggregate", "away goals rules if any", "penalties"],
      demote: ["mid-table calm framing"],
    },
  ],
  categoryGaps: [
    "Clock and score competing with fantasy widgets",
    "Formation graphics before the minute/scoreline",
    "No clear FT vs live distinction in rails",
  ],
  uxRules: [
    "Minute + scoreline locked top; events timeline secondary",
    "VAR/state honesty — provisional goals labeled until confirmed",
    "Competition context (table/knockout) one glance from the live view",
  ],
  technicalConcepts: ["stoppage time", "VAR pending", "extra time", "penalty shootout"],
  materialVernacular: ["pitch flood", "kit contrast pairs", "stadium bowl depth"],
  tasteSeed: {
    aestheticLean: "system-crafted",
    density: "information-rich",
    motion: "subtle-micro",
    colorMood: "dark-premium",
    typographyWeight: "bold-confident",
    roundingDepth: "soft",
  },
  lane: "minimal-editorial-grid",
  craftNodes: ["sport-vernacular-craft", "dashboard-or-webapp-ui"],
  brandAccent: "#0B3D2E",
};

const HOCKEY: SportVernacularPack = {
  id: "hockey",
  label: "Hockey",
  culturalThesis:
    "Hockey is shift-speed and period structure — line changes and power plays create a different glance rhythm than continuous football clocks.",
  ritualLexicon: ["period", "power play", "penalty box", "line change", "face-off", "empty net"],
  accessModes: ["glance-live", "sit-with", "before-play", "after-play"],
  primaryFacts: [
    {
      id: "score-period",
      label: "Score + period + clock",
      why: "Period boundaries reset urgency",
    },
    {
      id: "strength",
      label: "Even strength / power play / PK",
      why: "Man-advantage state changes expected scoring rate",
    },
    {
      id: "shots",
      label: "Shots on goal",
      why: "Territory proxy between goals",
    },
  ],
  formatLenses: [
    {
      id: "regulation",
      label: "Regulation",
      tempo: "Three periods",
      emphasize: ["period clock", "penalties"],
      demote: [],
    },
    {
      id: "overtime",
      label: "OT / shootout",
      tempo: "Sudden death pressure",
      emphasize: ["OT rules", "shootout order"],
      demote: ["long preview essays on the live spine"],
    },
  ],
  categoryGaps: [
    "Treating hockey like football with a different badge",
    "Hiding power-play state",
    "No period-aware hierarchy",
  ],
  uxRules: [
    "Period + strength state adjacent to score",
    "Penalty timers visible during PK/PP",
    "Rapid update stability — numbers must not jitter",
  ],
  technicalConcepts: ["power play timer", "empty-net state", "challenge pending"],
  materialVernacular: ["ice glare", "rink boards", "cold contrast"],
  tasteSeed: {
    aestheticLean: "system-crafted",
    density: "information-rich",
    motion: "subtle-micro",
    colorMood: "dark-premium",
    typographyWeight: "medium-modern",
    roundingDepth: "sharp",
  },
  lane: "nested-premium-shells",
  craftNodes: ["sport-vernacular-craft", "glass-shell-craft"],
  brandAccent: "#1A3A5C",
};

const TENNIS: SportVernacularPack = {
  id: "tennis",
  label: "Tennis",
  culturalThesis:
    "Tennis is nested scoring — point → game → set → match — and the UI must preserve that stack without flattening it into a single scoreline.",
  ritualLexicon: [
    "hold",
    "break",
    "break point",
    "set point",
    "match point",
    "tie-break",
    "on serve",
    "challenged",
  ],
  accessModes: ["glance-live", "sit-with", "before-play", "after-play"],
  primaryFacts: [
    {
      id: "sets",
      label: "Set score",
      why: "Match arc lives here",
    },
    {
      id: "games-point",
      label: "Game score + server",
      why: "Point pressure is local to the game",
    },
    {
      id: "pressure",
      label: "Break / set / match point flag",
      why: "Pressure states are the drama markers",
    },
  ],
  formatLenses: [
    {
      id: "best-of-3",
      label: "Best of 3",
      tempo: "Shorter arc; every break matters more",
      emphasize: ["breaks", "tie-break"],
      demote: ["five-set endurance framing"],
    },
    {
      id: "best-of-5",
      label: "Best of 5",
      tempo: "Grand-arc stamina; momentum across sets",
      emphasize: ["set history", "physical narrative"],
      demote: [],
    },
  ],
  categoryGaps: [
    "Flattening sets/games/points into one ambiguous score",
    "Hiding who is serving",
    "No pressure-point callouts",
  ],
  uxRules: [
    "Always show sets | games | points with server marker",
    "Pressure flags are textual, not color-only",
    "Court surface / conditions as secondary atmosphere, not primary chrome",
  ],
  technicalConcepts: ["advantage scoring", "tie-break", "challenge pending"],
  materialVernacular: ["clay dust", "grass sheen", "hard-court night"],
  tasteSeed: {
    aestheticLean: "refined-story",
    density: "balanced",
    motion: "light-scroll-reveals",
    colorMood: "light-airy",
    typographyWeight: "light-elegant",
    roundingDepth: "soft",
  },
  lane: "image-first-stage",
  craftNodes: ["sport-vernacular-craft", "image-first-fold"],
  brandAccent: "#2F5D50",
};

export const SPORT_PACKS: Record<SportId, SportVernacularPack> = {
  cricket: CRICKET,
  football: FOOTBALL,
  hockey: HOCKEY,
  tennis: TENNIS,
};

const QUERY_MATCH: { id: SportId; re: RegExp }[] = [
  { id: "cricket", re: /cricket|cric|ipl|test match|t20|odi|wicket|crease|howzat|over rate/i },
  { id: "football", re: /football|soccer|premier league|world cup|goal line|var\b|kick-?off/i },
  { id: "hockey", re: /\bhockey\b|nhl|power play|face-?off|rink\b/i },
  { id: "tennis", re: /tennis|grand slam|wimbledon|break point|tie-?break|racket/i },
];

export function getSportPack(id: SportId): SportVernacularPack {
  return SPORT_PACKS[id];
}

export function matchSportFromQuery(query: string): SportVernacularPack | undefined {
  const hit = QUERY_MATCH.find((m) => m.re.test(query));
  return hit ? SPORT_PACKS[hit.id] : undefined;
}

export function listSportPacks(): SportVernacularPack[] {
  return SportId.options.map((id) => SPORT_PACKS[id]);
}

/** Markdown research brief agents must complete / refresh before building. */
export function sportResearchBriefTemplate(sport: SportId): string {
  const pack = SPORT_PACKS[sport];
  return `# Sport research brief — ${pack.label}

## Gate
Do not design or code the site until this brief is filled.

## Cultural thesis
${pack.culturalThesis}

## Ritual lexicon to honor
${pack.ritualLexicon.map((w) => `- ${w}`).join("\n")}

## Fan access modes (priority order)
${pack.accessModes.map((m, i) => `${i + 1}. ${m}`).join("\n")}

## First-glance facts (inverted pyramid)
${pack.primaryFacts.map((f, i) => `${i + 1}. **${f.label}** — ${f.why}`).join("\n")}

## Format lenses
${pack.formatLenses
  .map(
    (f) =>
      `### ${f.label}\n- Tempo: ${f.tempo}\n- Emphasize: ${f.emphasize.join(", ")}\n- Demote: ${f.demote.join(", ") || "—"}`,
  )
  .join("\n\n")}

## Category gaps to close
${pack.categoryGaps.map((g) => `- ${g}`).join("\n")}

## UX rules
${pack.uxRules.map((r) => `- ${r}`).join("\n")}

## Technical concepts to model
${pack.technicalConcepts.map((t) => `- ${t}`).join("\n")}

## Material vernacular
${pack.materialVernacular.map((m) => `- ${m}`).join("\n")}

## Fresh research notes (agent fills)
- Fan interviews / forums / observed second-screen behavior:
- What existing category sites fail at (anonymised):
- Local / regional cultural cues for this audience:
- Data freshness / latency budget:
- Accessibility plan for live updates:

## Plan gates
- [ ] Primary facts ordered for glance-live
- [ ] Format lens chosen for default view
- [ ] Score spine layout stability specified
- [ ] Editorial vs live modes separated
- [ ] Ban list: generic sports chrome, equal card grids, purple AI defaults
`;
}
