/** Demo tennis content for BASELINE — research-backed court board (see research/SPORT_SITE_VERNACULAR.md). */

export type MatchStatus = "live" | "result" | "upcoming";
export type TennisFormat = "BO3" | "BO5";
export type CourtSurface = "hard" | "clay" | "grass";
export type PressureFlag = "break-point" | "set-point" | "match-point" | "deuce" | null;

export type PlayerScore = {
  name: string;
  short: string;
  /** Sets won in the match. */
  setsWon: number;
  games: number;
  /** Tennis point display: 0, 15, 30, 40, AD */
  points: string;
  serving: boolean;
};

export type LiveMatch = {
  id: string;
  status: MatchStatus;
  format: TennisFormat;
  surface: CourtSurface;
  tournament: string;
  round: string;
  venue: string;
  playerA: PlayerScore;
  playerB: PlayerScore;
  pressure: PressureFlag;
  pressureLabel?: string;
  note: string;
  start?: string;
  challengePending?: boolean;
  setHistory?: string;
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
  player: string;
  points: number;
  change: "up" | "down" | "same";
};

export const LIVE_MATCHES: LiveMatch[] = [
  {
    id: "swi-peg-sf",
    status: "live",
    format: "BO3",
    surface: "hard",
    tournament: "Hard Court Classic · Women's Singles",
    round: "Semi-final",
    venue: "Centre Court · Night session",
    playerA: {
      name: "I. Świątek",
      short: "ŚWI",
      setsWon: 1,
      games: 4,
      points: "40",
      serving: false,
    },
    playerB: {
      name: "J. Pegula",
      short: "PEG",
      setsWon: 1,
      games: 3,
      points: "30",
      serving: true,
    },
    pressure: "break-point",
    pressureLabel: "BREAK POINT",
    note: "Pegula serving to stay in the third · break point against",
    challengePending: false,
    setHistory: "6–4 · 3–6 · 4–3",
  },
  {
    id: "alcaraz-sinner-qf",
    status: "live",
    format: "BO5",
    surface: "clay",
    tournament: "Clay Masters · Men's Singles",
    round: "Quarter-final",
    venue: "Court Philippe · Afternoon",
    playerA: {
      name: "C. Alcaraz",
      short: "ALC",
      setsWon: 2,
      games: 2,
      points: "15",
      serving: true,
    },
    playerB: {
      name: "J. Sinner",
      short: "SIN",
      setsWon: 1,
      games: 1,
      points: "15",
      serving: false,
    },
    pressure: null,
    note: "Fourth set · Alcaraz holds the physical narrative after a long third",
    setHistory: "6–4 · 3–6 · 7–6 · 2–1",
  },
  {
    id: "gauff-keys-r16",
    status: "live",
    format: "BO3",
    surface: "grass",
    tournament: "Grass Invitational · Women's Singles",
    round: "Round of 16",
    venue: "Court 1 · Day session",
    playerA: {
      name: "C. Gauff",
      short: "GAU",
      setsWon: 1,
      games: 5,
      points: "AD",
      serving: true,
    },
    playerB: {
      name: "M. Keys",
      short: "KEY",
      setsWon: 0,
      games: 5,
      points: "40",
      serving: false,
    },
    pressure: "set-point",
    pressureLabel: "SET POINT",
    note: "Gauff on serve at ad — set point to take a 2–0 lead",
    setHistory: "7–6 · 5–5",
  },
  {
    id: "djok-med-up",
    status: "upcoming",
    format: "BO5",
    surface: "hard",
    tournament: "Hard Court Classic · Men's Singles",
    round: "Semi-final",
    venue: "Centre Court",
    playerA: {
      name: "N. Djokovic",
      short: "DJO",
      setsWon: 0,
      games: 0,
      points: "0",
      serving: false,
    },
    playerB: {
      name: "D. Medvedev",
      short: "MED",
      setsWon: 0,
      games: 0,
      points: "0",
      serving: false,
    },
    pressure: null,
    note: "Night session · best of five",
    start: "19:30 local",
  },
  {
    id: "ryba-sab-res",
    status: "result",
    format: "BO3",
    surface: "hard",
    tournament: "Hard Court Classic · Women's Singles",
    round: "Quarter-final",
    venue: "Court 2",
    playerA: {
      name: "A. Rybakina",
      short: "RYB",
      setsWon: 2,
      games: 0,
      points: "0",
      serving: false,
    },
    playerB: {
      name: "E. Svitolina",
      short: "SVI",
      setsWon: 0,
      games: 0,
      points: "0",
      serving: false,
    },
    pressure: null,
    note: "Rybakina won 6–3 · 6–4",
    setHistory: "6–3 · 6–4",
  },
];

export const FEATURED = LIVE_MATCHES[0]!;

export const STORIES: Story[] = [
  {
    id: "s1",
    kicker: "Match notebook",
    title: "Why this break point is louder than the set score",
    dek: "Pegula’s serve into the ad court is the whole match compressed — hold and the third stays open; miss and the arc snaps shut.",
    image: "/baseline/hero-court.jpg",
    imageAlt: "Tennis court under evening light with hard-court lines",
    read: "5 min",
  },
  {
    id: "s2",
    kicker: "Technique",
    title: "The return that owns clay changeovers",
    dek: "Depth first, angle second — and a court position that refuses to give free first serves after the sit.",
    image: "/baseline/clay-dust.jpg",
    imageAlt: "Clay court surface with fine dust and line chalk",
    read: "4 min",
  },
  {
    id: "s3",
    kicker: "Surface frame",
    title: "Grass sheen rewrites who gets to finish at net",
    dek: "Low bounce rewards early contact — and punishes the late step-in that works on hard.",
    image: "/baseline/grass-court.jpg",
    imageAlt: "Grass tennis court with soft sheen under daylight",
    read: "6 min",
  },
  {
    id: "s4",
    kicker: "Voices",
    title: "Holding serve is not a quiet craft",
    dek: "It is occupation of the game score — leaving pressure for the returner to invent.",
    image: "/baseline/racket-ball.jpg",
    imageAlt: "Tennis racket and ball resting between points",
    read: "3 min",
  },
];

export const HARD_RANKINGS: RankingRow[] = [
  { rank: 1, player: "I. Świątek", points: 11245, change: "same" },
  { rank: 2, player: "A. Sabalenka", points: 8715, change: "up" },
  { rank: 3, player: "C. Gauff", points: 6503, change: "down" },
  { rank: 4, player: "J. Pegula", points: 5725, change: "same" },
  { rank: 5, player: "E. Rybakina", points: 5416, change: "up" },
];

export const CLAY_RANKINGS: RankingRow[] = [
  { rank: 1, player: "C. Alcaraz", points: 9805, change: "same" },
  { rank: 2, player: "J. Sinner", points: 8710, change: "up" },
  { rank: 3, player: "N. Djokovic", points: 7560, change: "down" },
  { rank: 4, player: "A. Zverev", points: 6885, change: "same" },
  { rank: 5, player: "D. Medvedev", points: 6330, change: "up" },
];

export const GRASS_RANKINGS: RankingRow[] = [
  { rank: 1, player: "C. Alcaraz", points: 8450, change: "same" },
  { rank: 2, player: "N. Djokovic", points: 8120, change: "same" },
  { rank: 3, player: "J. Sinner", points: 7205, change: "up" },
  { rank: 4, player: "A. Rybakina", points: 6100, change: "up" },
  { rank: 5, player: "T. Fritz", points: 5480, change: "down" },
];

export const TOURNAMENTS = [
  {
    id: "t1",
    name: "Hard Court Classic",
    window: "Now · hard",
    detail: "Women’s SF live · Men’s SF tonight",
  },
  {
    id: "t2",
    name: "Clay Masters",
    window: "Now · clay",
    detail: "Men’s QF · Court Philippe",
  },
  {
    id: "t3",
    name: "Grass Invitational",
    window: "Now · grass",
    detail: "R16 · Court 1",
  },
  {
    id: "t4",
    name: "Autumn Hard Swing",
    window: "Sep · hard",
    detail: "Main draw next week",
  },
];

export const HERO_IMAGE = "/baseline/hero-court.jpg";

export function surfaceLabel(s: CourtSurface): string {
  if (s === "clay") return "Clay";
  if (s === "grass") return "Grass";
  return "Hard";
}

export function formatLabel(f: TennisFormat): string {
  return f === "BO5" ? "Best of 5" : "Best of 3";
}

