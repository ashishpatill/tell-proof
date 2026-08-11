/** Shared Crease route inventory — safe for server + client imports. */

export type CreasePrimaryRouteId =
  | "home"
  | "live"
  | "scorecard"
  | "series"
  | "rankings"
  | "notebook";

export type CreaseSecondaryRouteId = "fixtures" | "teams" | "players" | "stats";

export type CreaseRouteId = CreasePrimaryRouteId | CreaseSecondaryRouteId;

export const CREASE_NAV: Array<{ id: CreasePrimaryRouteId; href: string; label: string }> = [
  { id: "home", href: "/crease", label: "Home" },
  { id: "live", href: "/crease/live", label: "Live" },
  { id: "scorecard", href: "/crease/scorecard", label: "Scorecard" },
  { id: "series", href: "/crease/series", label: "Series" },
  { id: "rankings", href: "/crease/rankings", label: "Rankings" },
  { id: "notebook", href: "/crease/notebook", label: "Notebook" },
];

export const CREASE_SECONDARY: Array<{
  id: CreaseSecondaryRouteId;
  href: string;
  label: string;
}> = [
  { id: "fixtures", href: "/crease/fixtures", label: "Fixtures" },
  { id: "teams", href: "/crease/teams", label: "Teams" },
  { id: "players", href: "/crease/players", label: "Players" },
  { id: "stats", href: "/crease/stats", label: "Stats" },
];
