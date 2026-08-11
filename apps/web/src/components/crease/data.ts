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
  /** Honest feed honesty — category sites expose delay. */
  latency?: "live" | "delayed" | "stumps";
  powerplay?: string;
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

export type PlayerRankingRow = {
  rank: number;
  player: string;
  team: string;
  rating: number;
  role: "bat" | "bowl" | "all";
};

export type BatterRow = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: string;
};

export type BowlerRow = {
  name: string;
  o: string;
  m: number;
  r: number;
  w: number;
};

export type Partnership = {
  wicket: number;
  pair: string;
  runs: number;
  balls: number;
};

export type FallOfWicket = {
  score: string;
  overs: string;
  batter: string;
};

export type CommentaryLine = {
  id: string;
  overBall: string;
  text: string;
  kind: "ball" | "wicket" | "boundary" | "note";
};

export type Fixture = {
  id: string;
  when: string;
  format: CricketFormat;
  series: string;
  teams: string;
  venue: string;
  status: MatchStatus;
};

export type TeamCard = {
  id: string;
  name: string;
  code: string;
  board: string;
  next: string;
  form: string;
};

export type PlayerCard = {
  id: string;
  name: string;
  team: string;
  role: string;
  note: string;
};

export type PointsRow = {
  team: string;
  played: number;
  won: number;
  lost: number;
  nr: number;
  points: number;
  nrr: string;
};

export type RecordRow = {
  label: string;
  holder: string;
  mark: string;
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
    latency: "live",
    powerplay: "Middle overs · bowling Powerplay done",
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
    latency: "live",
    powerplay: "Death overs approaching",
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
    latency: "delayed",
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
    latency: "stumps",
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
    latency: "stumps",
  },
];

export const FEATURED = LIVE_MATCHES[0]!;

export const BATTING: BatterRow[] = [
  { name: "Sharma", runs: 62, balls: 71, fours: 5, sixes: 1, out: "c Smith b Hazelwood" },
  { name: "Gill", runs: 38, balls: 44, fours: 4, sixes: 0, out: "b Starc" },
  { name: "Kohli*", runs: 41, balls: 39, fours: 3, sixes: 1, out: "not out" },
  { name: "Pant*", runs: 18, balls: 15, fours: 2, sixes: 0, out: "not out" },
];

export const BOWLING: BowlerRow[] = [
  { name: "Starc", o: "8.2", m: 1, r: 42, w: 1 },
  { name: "Hazelwood", o: "9", m: 0, r: 48, w: 1 },
  { name: "Cummins", o: "8", m: 0, r: 51, w: 0 },
  { name: "Zampa", o: "7", m: 0, r: 55, w: 0 },
];

export const PARTNERSHIPS: Partnership[] = [
  { wicket: 1, pair: "Sharma · Gill", runs: 71, balls: 88 },
  { wicket: 2, pair: "Gill · Kohli", runs: 42, balls: 51 },
  { wicket: 3, pair: "Kohli · Pant", runs: 48, balls: 41 },
  { wicket: 4, pair: "Kohli · Pant*", runs: 53, balls: 50 },
];

export const FALL_OF_WICKETS: FallOfWicket[] = [
  { score: "71/1", overs: "14.4", batter: "Sharma" },
  { score: "113/2", overs: "23.1", batter: "Gill" },
  { score: "161/3", overs: "31.5", batter: "Rahul" },
  { score: "214/4", overs: "38.2", batter: "Iyer" },
];

export const EXTRAS = { byes: 2, legByes: 4, wides: 7, noBalls: 1, total: 14 };

export const COMMENTARY: CommentaryLine[] = [
  {
    id: "c1",
    overBall: "38.2",
    text: "FOUR · Kohli drills through cover — India need 73 from 70.",
    kind: "boundary",
  },
  {
    id: "c2",
    overBall: "38.1",
    text: "Dot · Hazelwood hits a hard length; Kohli watchful.",
    kind: "ball",
  },
  {
    id: "c3",
    overBall: "37.6",
    text: "Single · Pant rotates; Kohli keeps strike for the new over.",
    kind: "ball",
  },
  {
    id: "c4",
    overBall: "37.5",
    text: "SIX · Pant clears deep midwicket — floodlights catching the cherry.",
    kind: "boundary",
  },
  {
    id: "c5",
    overBall: "37.4",
    text: "Review pending · Australia go upstairs for a nick. Soft signal not out.",
    kind: "note",
  },
  {
    id: "c6",
    overBall: "36.2",
    text: "WICKET · Iyer miscues to long-off. India 214/4.",
    kind: "wicket",
  },
];

export const FIXTURES: Fixture[] = [
  {
    id: "fx1",
    when: "Today · Live",
    format: "ODI",
    series: "Asia Cup warm-up",
    teams: "India v Australia",
    venue: "The Padang",
    status: "live",
  },
  {
    id: "fx2",
    when: "Today · Live",
    format: "T20",
    series: "England v South Africa",
    teams: "England v South Africa",
    venue: "Sophia Gardens",
    status: "live",
  },
  {
    id: "fx3",
    when: "Today · Day 3",
    format: "TEST",
    series: "West Indies v New Zealand",
    teams: "West Indies v New Zealand",
    venue: "Queen's Park Oval",
    status: "live",
  },
  {
    id: "fx4",
    when: "Tomorrow · 14:30 PKT",
    format: "ODI",
    series: "Pakistan v Sri Lanka",
    teams: "Pakistan v Sri Lanka",
    venue: "Rawalpindi",
    status: "upcoming",
  },
  {
    id: "fx5",
    when: "Fri · 19:30 IST",
    format: "T20",
    series: "Domestic league",
    teams: "Chennai v Mumbai",
    venue: "Chepauk",
    status: "upcoming",
  },
  {
    id: "fx6",
    when: "Sun · 10:00",
    format: "ODI",
    series: "Asia Cup warm-up",
    teams: "India v Australia · 2nd",
    venue: "Kallang",
    status: "upcoming",
  },
];

export const TEAMS: TeamCard[] = [
  {
    id: "ind",
    name: "India",
    code: "IND",
    board: "Men’s · white-ball focus this window",
    next: "Asia Cup warm-up · chase live",
    form: "W W L W W",
  },
  {
    id: "aus",
    name: "Australia",
    code: "AUS",
    board: "Men’s · bowling depth travelling",
    next: "Defending 286 at the Padang",
    form: "W L W W L",
  },
  {
    id: "eng",
    name: "England",
    code: "ENG",
    board: "Men’s · T20 night series",
    next: "1st T20I · Cardiff",
    form: "L W W L W",
  },
  {
    id: "sa",
    name: "South Africa",
    code: "SA",
    board: "Men’s · chase under lights",
    next: "Need 72 from 47",
    form: "W W L W W",
  },
  {
    id: "wi",
    name: "West Indies",
    code: "WI",
    board: "Men’s · Test session craft",
    next: "Lead by 178 · Day 3",
    form: "D W L D W",
  },
  {
    id: "nz",
    name: "New Zealand",
    code: "NZ",
    board: "Men’s · first-class patience",
    next: "Bowl for breakthroughs",
    form: "W D L W D",
  },
];

export const PLAYERS: PlayerCard[] = [
  {
    id: "p1",
    name: "Virat Kohli",
    team: "India",
    role: "Top order · chase craftsman",
    note: "62* off 54 — tempo locked to RRR",
  },
  {
    id: "p2",
    name: "Josh Hazelwood",
    team: "Australia",
    role: "New-ball · hard length",
    note: "8-0-41-1 · still the over to survive",
  },
  {
    id: "p3",
    name: "Aiden Markram",
    team: "South Africa",
    role: "Opener · T20 strike",
    note: "34* (22) under dew",
  },
  {
    id: "p4",
    name: "Shai Hope",
    team: "West Indies",
    role: "Middle · Test occupation",
    note: "41* (78) · session language",
  },
  {
    id: "p5",
    name: "Adil Rashid",
    team: "England",
    role: "Leg-spin · middle overs",
    note: "2.1-0-18-1 in the Cardiff chase",
  },
  {
    id: "p6",
    name: "Rishabh Pant",
    team: "India",
    role: "Keeper · left-hand release",
    note: "18* (15) · clearing the rope early",
  },
];

export const POINTS_TABLE: PointsRow[] = [
  { team: "India", played: 4, won: 3, lost: 1, nr: 0, points: 6, nrr: "+0.82" },
  { team: "Australia", played: 4, won: 3, lost: 1, nr: 0, points: 6, nrr: "+0.41" },
  { team: "Pakistan", played: 3, won: 1, lost: 2, nr: 0, points: 2, nrr: "-0.18" },
  { team: "Sri Lanka", played: 3, won: 1, lost: 2, nr: 0, points: 2, nrr: "-0.55" },
  { team: "Bangladesh", played: 2, won: 0, lost: 2, nr: 0, points: 0, nrr: "-1.12" },
];

export const RECORDS: RecordRow[] = [
  { label: "Highest successful chase (ODI, venue)", holder: "India", mark: "287 · Padang" },
  { label: "Best bowling in a losing cause", holder: "Hazelwood", mark: "4/28 · warm-up" },
  { label: "Most sixes in a T20 innings (series)", holder: "Markram", mark: "7 · Cardiff" },
  { label: "Longest partnership this window", holder: "Kohli · Pant", mark: "53* (50)" },
];

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
  {
    id: "s5",
    kicker: "Before play",
    title: "Reading the Padang strip before the first ball",
    dek: "True bounce, short square boundaries, and a breeze that favors the pavilion end.",
    image: "/crease/scoreboard.webp",
    imageAlt: "Cricket scoreboard and ground under evening light",
    read: "4 min",
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

export const PLAYER_BAT_ODI: PlayerRankingRow[] = [
  { rank: 1, player: "Kohli", team: "IND", rating: 872, role: "bat" },
  { rank: 2, player: "Babar", team: "PAK", rating: 851, role: "bat" },
  { rank: 3, player: "Root", team: "ENG", rating: 824, role: "bat" },
  { rank: 4, player: "Smith", team: "AUS", rating: 801, role: "bat" },
  { rank: 5, player: "Hope", team: "WI", rating: 778, role: "bat" },
];

export const PLAYER_BOWL_ODI: PlayerRankingRow[] = [
  { rank: 1, player: "Hazelwood", team: "AUS", rating: 724, role: "bowl" },
  { rank: 2, player: "Bumrah", team: "IND", rating: 718, role: "bowl" },
  { rank: 3, player: "Rashid", team: "AFG", rating: 702, role: "bowl" },
  { rank: 4, player: "Starc", team: "AUS", rating: 689, role: "bowl" },
  { rank: 5, player: "Rabada", team: "SA", rating: 671, role: "bowl" },
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
export const HERO_IMAGE_FALLBACK = "/crease/hero-match.jpg";

export function ballLabel(b: BallEvent): string {
  if (b === "dot") return "·";
  return b;
}
