/** Demo tennis content for BASELINE — research-backed court theater (SPORT_SITE_VERNACULAR.md §3b). */

export type MatchStatus = "live" | "result" | "upcoming";
export type TennisFormat = "BO3" | "BO5";
export type CourtSurface = "hard" | "clay" | "grass";
export type PressureFlag = "break-point" | "set-point" | "match-point" | "deuce" | null;
export type FormatLens = "BO3" | "BO5";

export type PlayerScore = {
  name: string;
  short: string;
  /** Sets won in the match. */
  setsWon: number;
  games: number;
  /** Tennis point display: 0, 15, 30, 40, AD */
  points: string;
  serving: boolean;
  seed?: number;
};

/** One completed or current set — bead rail object (tennis this-over equivalent). */
export type SetBead = {
  a: number;
  b: number;
  /** Current unfinished set. */
  current?: boolean;
  /** Tie-break played. */
  tiebreak?: boolean;
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
  /** Human-readable set line for mono fallback. */
  setHistory?: string;
  /** First-class set bead rail. */
  setBeads: SetBead[];
  /** This-game point trail (progressive disclosure of the local contest). */
  pointTrail: string[];
  /** BO3 secondary — hold / break framing (format lens). */
  breakLens: string[];
  /** BO5 secondary — physical / set-momentum framing (format lens). */
  staminaLens: string[];
  /** Atmosphere / stage image for court theater. */
  image: string;
  imageAlt: string;
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

/** Surface as atmosphere tokens — not sticker pills (vernacular §3b.6 / §3b.9). */
export const SURFACE_ATMOSPHERE: Record<
  CourtSurface,
  { label: string; wash: string; line: string; glow: string; chalk: string }
> = {
  hard: {
    label: "Hard · night chalk",
    wash: "rgba(47, 93, 80, 0.14)",
    line: "rgba(255, 255, 255, 0.55)",
    glow: "rgba(30, 63, 54, 0.18)",
    chalk: "rgba(231, 239, 233, 0.9)",
  },
  clay: {
    label: "Clay · dust & sit",
    wash: "rgba(196, 120, 90, 0.22)",
    line: "rgba(180, 90, 55, 0.35)",
    glow: "rgba(154, 52, 18, 0.12)",
    chalk: "rgba(244, 226, 214, 0.85)",
  },
  grass: {
    label: "Grass · low sheen",
    wash: "rgba(74, 124, 68, 0.18)",
    line: "rgba(255, 255, 255, 0.4)",
    glow: "rgba(56, 102, 52, 0.14)",
    chalk: "rgba(232, 242, 228, 0.88)",
  },
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
      seed: 1,
    },
    playerB: {
      name: "J. Pegula",
      short: "PEG",
      setsWon: 1,
      games: 3,
      points: "30",
      serving: true,
      seed: 5,
    },
    pressure: "break-point",
    pressureLabel: "BREAK POINT",
    note: "Pegula serving to stay in the third — one point from handing the break",
    challengePending: true,
    setHistory: "6–4 · 3–6 · 4–3",
    setBeads: [
      { a: 6, b: 4 },
      { a: 3, b: 6 },
      { a: 4, b: 3, current: true },
    ],
    pointTrail: ["0–0", "0–15", "15–15", "30–15", "30–30", "30–40"],
    breakLens: [
      "Break chances: Świątek 4/7 · Pegula 2/5",
      "Pegula holds under lights: 8/11",
      "Return depth on ad court deciding this game",
    ],
    staminaLens: [
      "Match clock 1h 48m — BO5 framing would still have legs left",
      "Set momentum even after split first two",
      "Third-set break weighs like a final here",
    ],
    image: "/baseline/hard-night.webp",
    imageAlt: "Hard court under night lights",
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
      seed: 2,
    },
    playerB: {
      name: "J. Sinner",
      short: "SIN",
      setsWon: 1,
      games: 1,
      points: "15",
      serving: false,
      seed: 1,
    },
    pressure: null,
    note: "Fourth set — Alcaraz owns the physical narrative after a long third",
    setHistory: "6–4 · 3–6 · 7–6 · 2–1",
    setBeads: [
      { a: 6, b: 4 },
      { a: 3, b: 6 },
      { a: 7, b: 6, tiebreak: true },
      { a: 2, b: 1, current: true },
    ],
    pointTrail: ["0–0", "15–0", "15–15"],
    breakLens: [
      "Breaks: Alcaraz 3 · Sinner 2 — clay rewards patience over panic",
      "Tie-break third flipped the hold narrative",
      "Return games still deciding fourth",
    ],
    staminaLens: [
      "3h 12m elapsed · set momentum ALC after tie-break",
      "Fifth-set framing still live if Sinner levels",
      "Changeover length stretching — physical arc owns the desk",
    ],
    image: "/baseline/clay-dust.webp",
    imageAlt: "Clay court dust and baseline chalk",
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
      games: 6,
      points: "5",
      serving: true,
      seed: 3,
    },
    playerB: {
      name: "M. Keys",
      short: "KEY",
      setsWon: 0,
      games: 6,
      points: "4",
      serving: false,
    },
    pressure: "set-point",
    pressureLabel: "SET POINT · TIE-BREAK",
    note: "Gauff leads the second-set tie-break 5–4 — two points from the match",
    setHistory: "7–6 · 6–6",
    setBeads: [
      { a: 7, b: 6, tiebreak: true },
      { a: 6, b: 6, current: true, tiebreak: true },
    ],
    pointTrail: ["0–0", "1–0", "2–0", "2–1", "3–1", "4–1", "4–2", "4–3", "5–3", "5–4"],
    breakLens: [
      "Grass sheen · first-strike holds into the breaker",
      "Keys yet to convert a break chance (0/3)",
      "Tie-break is the whole set compressed",
    ],
    staminaLens: [
      "BO3 sprint — tie-break now is the match",
      "No fifth-set storyboard; two points end it",
      "Low bounce keeps TB points short",
    ],
    image: "/baseline/grass-court.webp",
    imageAlt: "Grass court with soft daylight sheen",
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
      seed: 4,
    },
    playerB: {
      name: "D. Medvedev",
      short: "MED",
      setsWon: 0,
      games: 0,
      points: "0",
      serving: false,
      seed: 3,
    },
    pressure: null,
    note: "Night session · best of five — stamina arc ahead",
    start: "19:30 local",
    setBeads: [],
    pointTrail: [],
    breakLens: ["Draw set — break narrative not yet written"],
    staminaLens: [
      "Best of five · physical narrative not yet written",
      "Expect long holds before the first real stamina ask",
      "Night session favors the player who manages the fifth",
    ],
    image: "/baseline/hero-court.webp",
    imageAlt: "Empty centre court before night session",
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
      seed: 6,
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
    setBeads: [
      { a: 6, b: 3 },
      { a: 6, b: 4 },
    ],
    pointTrail: [],
    breakLens: ["Two breaks sealed · no tie-break required", "Hold rate Rybakina 10/10"],
    staminaLens: ["Straight sets — endurance never entered the chat"],
    image: "/baseline/racket-ball.webp",
    imageAlt: "Racket and ball between points",
  },
];

export const FEATURED = LIVE_MATCHES[0]!;

export const STORIES: Story[] = [
  {
    id: "s1",
    kicker: "Match notebook",
    title: "Why this break point is louder than the set score",
    dek: "Pegula’s serve into the ad court is the whole match compressed — hold and the third stays open; miss and the arc snaps shut.",
    image: "/baseline/hero-court.webp",
    imageAlt: "Tennis court under evening light with hard-court lines",
    read: "5 min",
  },
  {
    id: "s2",
    kicker: "Technique",
    title: "The return that owns clay changeovers",
    dek: "Depth first, angle second — and a court position that refuses to give free first serves after the sit.",
    image: "/baseline/clay-dust.webp",
    imageAlt: "Clay court surface with fine dust and line chalk",
    read: "4 min",
  },
  {
    id: "s3",
    kicker: "Surface frame",
    title: "Grass sheen rewrites who gets to finish at net",
    dek: "Low bounce rewards early contact — and punishes the late step-in that works on hard.",
    image: "/baseline/grass-court.webp",
    imageAlt: "Grass tennis court with soft sheen under daylight",
    read: "6 min",
  },
  {
    id: "s4",
    kicker: "Voices",
    title: "Holding serve is not a quiet craft",
    dek: "It is occupation of the game score — leaving pressure for the returner to invent.",
    image: "/baseline/racket-ball.webp",
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

export const HERO_IMAGE = "/baseline/hero-court.webp";

export function surfaceLabel(s: CourtSurface): string {
  if (s === "clay") return "Clay";
  if (s === "grass") return "Grass";
  return "Hard";
}

export function formatLabel(f: TennisFormat): string {
  return f === "BO5" ? "Best of 5" : "Best of 3";
}

export function serverOf(match: LiveMatch): PlayerScore | undefined {
  if (match.playerA.serving) return match.playerA;
  if (match.playerB.serving) return match.playerB;
  return undefined;
}

/** Format lens secondary facts — same score, different story (vernacular §3b.2 / §3b.9). */
export function lensFacts(match: LiveMatch, lens: FormatLens): { title: string; facts: string[] } {
  if (lens === "BO5") {
    return { title: "Set stamina", facts: match.staminaLens };
  }
  return { title: "Break pressure", facts: match.breakLens };
}
