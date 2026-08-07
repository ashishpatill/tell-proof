/** Iframe document URL for a showcase specimen (cached HTML API). */
export function specimenHtmlSrc(key: string): string {
  return `/api/design/html?showcase=${encodeURIComponent(key)}`;
}
