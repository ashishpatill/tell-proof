/** Demo cricket content for CREASE — editorial match theater, not a live feed. */

export type MatchStatus = "live" | "result" | "upcoming";

export type LiveMatch = {
  id: string;
  status: MatchStatus;
  format: string;
  series: string;
  venue: string;
  teamA: { code: string; name: string; score?: string; overs?: string };
  teamB: { code: string; name: string; score?: string; overs?: string };
  note: string;
  start?: string;
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
    series: "India tour of Australia · 2nd ODI",
    venue: "Adelaide Oval",
    teamA: { code: "IND", name: "India", score: "214/4", overs: "38.2" },
    teamB: { code: "AUS", name: "Australia", score: "286/8", overs: "50.0" },
    note: "India need 73 from 70 balls",
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
  },
  {
    id: "wi-nz-test",
    status: "live",
    format: "TEST",
    series: "West Indies v New Zealand · 1st Test · Day 3",
    venue: "Queen's Park Oval",
    teamA: { code: "WI", name: "West Indies", score: "312 & 144/3", overs: "41.0" },
    teamB: { code: "NZ", name: "New Zealand", score: "278", overs: "86.4" },
    note: "WI lead by 178 · session 2",
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
    title: "Kohli’s tempo under lights — calm until the required rate asks a question",
    dek: "India’s chase in Adelaide is being built in partnerships, not panic. The middle overs are the story.",
    image:
      "https://images.unsplash.com/photo-1540747916308-c4bcf7c3d28c?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Floodlit cricket stadium packed for a night match",
    read: "6 min",
  },
  {
    id: "s2",
    kicker: "Technique",
    title: "Why the short ball still owns evening cricket",
    dek: "Pace into the pitch, carry into the gloves — and a cordon that refuses to blink.",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cricket bat and ball on grass",
    read: "4 min",
  },
  {
    id: "s3",
    kicker: "Series frame",
    title: "Adelaide’s square boundaries rewrite who gets to clear the rope",
    dek: "A ground that rewards timing over muscle — and punishes the mistimed slog.",
    image:
      "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cricket bowler in delivery stride",
    read: "5 min",
  },
  {
    id: "s4",
    kicker: "Voices",
    title: "The quiet craft of a good nightwatchman",
    dek: "Not heroism — occupation. Leaving a morning for the proper batters.",
    image:
      "https://images.unsplash.com/photo-1593766788306-28561086693e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cricket players walking on the field",
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
    name: "India in Australia",
    window: "Now · ODIs",
    detail: "2nd of 3 · Adelaide live",
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

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1540747916308-c4bcf7c3d28c?auto=format&fit=crop&w=2000&q=80";
