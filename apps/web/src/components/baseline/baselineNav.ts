/** Shared Baseline route inventory — safe for server + client imports. */

export type BaselineRouteId =
  | "home"
  | "live"
  | "scorecard"
  | "series"
  | "rankings"
  | "notebook";

export const BASELINE_NAV: Array<{ id: BaselineRouteId; href: string; label: string }> = [
  { id: "home", href: "/baseline", label: "Home" },
  { id: "live", href: "/baseline/live", label: "Live" },
  { id: "scorecard", href: "/baseline/scorecard", label: "Scorecard" },
  { id: "series", href: "/baseline/series", label: "Tournaments" },
  { id: "rankings", href: "/baseline/rankings", label: "Rankings" },
  { id: "notebook", href: "/baseline/notebook", label: "Notebook" },
];

export function baselineRouteFromPath(pathname: string): BaselineRouteId {
  if (pathname.startsWith("/baseline/live")) return "live";
  if (pathname.startsWith("/baseline/scorecard")) return "scorecard";
  if (pathname.startsWith("/baseline/series")) return "series";
  if (pathname.startsWith("/baseline/rankings")) return "rankings";
  if (pathname.startsWith("/baseline/notebook")) return "notebook";
  return "home";
}
