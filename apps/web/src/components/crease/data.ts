/** Demo cricket content for CREASE — research-backed match theater (see research/SPORT_SITE_VERNACULAR.md). */

export type MatchStatus = "live" | "result" | "upcoming";
export type CricketFormat = "TEST" | "ODI" | "T20";

/** Single delivery in this-over trail. */
export type BallEvent =
  | "dot"
  | "1"
  | "2"
  | "3"
  | "4"
  | "6"
  | "W"
  | "wd"
  | "nb";

export type LiveMatch = {
  id: string;
  status: MatchStatus;
  format: CricketFormat;
  series: string;
  venue: string;
  teamA: { code: string; name: string; score?: string; overs?: string };
  teamB: { code: string; name: string; score?: string; overs?: string };
  /** Situation equation — primary glance fact after score. */
  note: string;
  start?: string;
  crr?: string;
  rrr?: string;
  /** Test-only session label. */
  session?: string;
  thisOver?: BallEvent[];
  striker?: string;
  nonStriker?: string;
  bowler?: string;
};

export type Story = {
  id: string;
  kicker: string;
  title: string;
  dek: string;
  image: string;
  imageAlt: string;
  read: string;
};

export type RankingRow = {
  rank: number;
  team: string;
  rating: number;
  change: "up" | "down" | "same";
};

export const LIVE_MATCHES: LiveMatch[] = [
  {
    id: "ind-aus-2",
    status: "live",
    format: "ODI",
    series: "Asia Cup warm-up · India v Australia",
    venue: "The Padang, Singapore",
    teamA: { code: "IND", name: "India", score: "214/4", overs: "38.2" },
    teamB: { code: "AUS", name: "Australia", score: "286/8", overs: "50.0" },
    note: "India need 73 from 70 balls",
    crr: "5.60",
    rrr: "6.25",
    thisOver: ["dot", "1", "4", "dot", "6"],
    striker: "Kohli 62* (54)",
    nonStriker: "Rahul 28* (31)",
    bowler: "Hazlewood 8-0-41-1",
  },
  {
    id: "eng-sa-t20",
    status: "live",
    format: "T20",
    series: "England v South Africa · 1st T20I",
    venue: "Sophia Gardens",
    teamA: { code: "ENG", name: "England", score: "168/6", overs: "20.0" },
    teamB: { code: "SA", name: "South Africa", score: "97/3", overs: "12.1" },
    note: "SA need 72 from 47 · dew rolling in",
    crr: "7.95",
    rrr: "9.19",
    thisOver: ["1", "dot", "2", "4", "wd", "1"],
    striker: "Markram 34* (22)",
    nonStriker: "Miller 11* (9)",
    bowler: "Rashid 2.1-0-18-1",
  },
  {
    id: "wi-nz-test",
    status: "live",
    format: "TEST",
    series: "West Indies v New Zealand · 1st Test · Day 3",
    venue: "Queen's Park Oval",
    teamA: { code: "WI", name: "West Indies", score: "312 & 144/3", overs: "41.0" },
    teamB: { code: "NZ", name: "New Zealand", score: "278", overs: "86.4" },
    note: "WI lead by 178",
    session: "Session 2 · afternoon",
    crr: "3.51",
    thisOver: ["dot", "dot", "1", "dot", "4", "dot"],
    striker: "Hope 41* (78)",
    nonStriker: "Athanaze 22* (45)",
    bowler: "Southee 11-2-29-1",
  },
  {
    id: "pak-sl-up",
    status: "upcoming",
    format: "ODI",
    series: "Pakistan v Sri Lanka · 3rd ODI",
    venue: "Rawalpindi",
    teamA: { code: "PAK", name: "Pakistan" },
    teamB: { code: "SL", name: "Sri Lanka" },
    note: "Series level 1–1",
    start: "14:30 PKT",
  },
  {
    id: "csk-mi-res",
    status: "result",
    format: "T20",
    series: "Domestic league · Match 42",
    venue: "Chepauk",
    teamA: { code: "CSK", name: "Chennai", score: "179/5", overs: "20.0" },
    teamB: { code: "MI", name: "Mumbai", score: "162/8", overs: "20.0" },
    note: "Chennai won by 17 runs",
  },
];

export const FEATURED = LIVE_MATCHES[0]!;

export const STORIES: Story[] = [
  {
    id: "s1",
    kicker: "Match notebook",
    title: "Kohli’s tempo in the chase — calm until the required rate asks a question",
    dek: "India’s reply at the Padang is being built in partnerships, not panic. The middle overs are the story.",
    image: "/crease/hero-match.webp",
    imageAlt: "Cricket match in progress on a green oval with city skyline beyond the trees",
    read: "6 min",
  },
  {
    id: "s2",
    kicker: "Technique",
    title: "Why the short ball still owns evening cricket",
    dek: "Pace into the pitch, carry into the gloves — and a cordon that refuses to blink.",
    image: "/crease/ball-grass.webp",
    imageAlt: "Cherry cricket ball resting on green outfield grass",
    read: "4 min",
  },
  {
    id: "s3",
    kicker: "Series frame",
    title: "Square boundaries rewrite who gets to clear the rope",
    dek: "Grounds that reward timing over muscle — and punish the mistimed slog.",
    image: "/crease/sweep-shot.webp",
    imageAlt: "Batter playing a sweep shot in cricket whites",
    read: "5 min",
  },
  {
    id: "s4",
    kicker: "Voices",
    title: "The quiet craft of a good nightwatchman",
    dek: "Not heroism — occupation. Leaving a morning for the proper batters.",
    image: "/crease/batter-stance.webp",
    imageAlt: "Batter in whites waiting at the crease beside the stumps",
    read: "3 min",
  },
];

export const TEST_RANKINGS: RankingRow[] = [
  { rank: 1, team: "Australia", rating: 124, change: "same" },
  { rank: 2, team: "India", rating: 118, change: "up" },
  { rank: 3, team: "England", rating: 105, change: "down" },
  { rank: 4, team: "South Africa", rating: 103, change: "same" },
  { rank: 5, team: "New Zealand", rating: 96, change: "up" },
];

export const ODI_RANKINGS: RankingRow[] = [
  { rank: 1, team: "India", rating: 121, change: "same" },
  { rank: 2, team: "Australia", rating: 117, change: "same" },
  { rank: 3, team: "Pakistan", rating: 109, change: "up" },
  { rank: 4, team: "South Africa", rating: 107, change: "down" },
  { rank: 5, team: "England", rating: 101, change: "same" },
];

export const T20_RANKINGS: RankingRow[] = [
  { rank: 1, team: "India", rating: 267, change: "same" },
  { rank: 2, team: "Australia", rating: 256, change: "up" },
  { rank: 3, team: "England", rating: 253, change: "down" },
  { rank: 4, team: "West Indies", rating: 248, change: "up" },
  { rank: 5, team: "South Africa", rating: 245, change: "same" },
];

export const SERIES = [
  {
    id: "ser1",
    name: "India v Australia",
    window: "Now · ODI",
    detail: "Warm-up · Padang live",
  },
  {
    id: "ser2",
    name: "England v South Africa",
    window: "Now · T20Is",
    detail: "1st of 3 · Cardiff",
  },
  {
    id: "ser3",
    name: "West Indies v New Zealand",
    window: "Test · Day 3",
    detail: "1st of 2 · Port of Spain",
  },
  {
    id: "ser4",
    name: "Asia Cup",
    window: "Sep · multi-format",
    detail: "Group draw next week",
  },
];

export const HERO_IMAGE = "/crease/hero-match.webp";

export function ballLabel(b: BallEvent): string {
  if (b === "dot") return "·";
  return b;
}
