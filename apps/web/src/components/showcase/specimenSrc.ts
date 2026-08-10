/** Iframe document URL for a showcase specimen (cached HTML API). */
export function specimenHtmlSrc(key: string): string {
  if (key === "crease") return "/crease";
  return `/api/design/html?showcase=${encodeURIComponent(key)}`;
}

/** Specimen open URL — engine templates under /showcase/*, Crease under /crease. */
export function specimenOpenHref(key: string): string {
  if (key === "crease") return "/crease";
  return `/showcase/${key}`;
}
