/** Iframe document URL for a showcase specimen (cached HTML API). */
export function specimenHtmlSrc(key: string): string {
  if (key === "crease") return "/crease";
  if (key === "baseline") return "/baseline";
  return `/api/design/html?showcase=${encodeURIComponent(key)}`;
}

/** Specimen open URL — engine templates under /showcase/*, sport specimens under live routes. */
export function specimenOpenHref(key: string): string {
  if (key === "crease") return "/crease";
  if (key === "baseline") return "/baseline";
  return `/showcase/${key}`;
}
