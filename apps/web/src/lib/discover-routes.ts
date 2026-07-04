// Pull same-origin routes out of a captured page so the user can walk every
// page of the site/app and scan each one. Pure + browser-safe (uses DOMParser
// when available, falls back to a regex for SSR/no-DOM contexts).

export interface DiscoveredRoute {
  url: string; // absolute
  path: string; // pathname (+ search), for display
}

const IGNORE_EXT = /\.(png|jpe?g|gif|svg|webp|ico|css|js|mjs|json|pdf|zip|mp4|webm|woff2?|ttf)$/i;

function normalizeOrigin(baseUrl: string): URL | null {
  try {
    return new URL(baseUrl);
  } catch {
    return null;
  }
}

export function discoverRoutes(snapshotHtml: string | undefined, baseUrl: string, limit = 24): DiscoveredRoute[] {
  const base = normalizeOrigin(baseUrl);
  if (!base) return [];

  const hrefs = new Set<string>();
  if (snapshotHtml) {
    if (typeof DOMParser !== "undefined") {
      try {
        const doc = new DOMParser().parseFromString(snapshotHtml, "text/html");
        doc.querySelectorAll("a[href]").forEach((a) => {
          const href = a.getAttribute("href");
          if (href) hrefs.add(href);
        });
      } catch {
        /* fall through to regex */
      }
    }
    if (hrefs.size === 0) {
      for (const m of snapshotHtml.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) hrefs.add(m[1]!);
    }
  }

  const seen = new Set<string>();
  const routes: DiscoveredRoute[] = [];
  // Always include the captured page itself first.
  const selfPath = base.pathname + base.search;
  seen.add(selfPath || "/");
  routes.push({ url: base.href, path: selfPath || "/" });

  for (const href of hrefs) {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    let abs: URL;
    try {
      abs = new URL(href, base.href);
    } catch {
      continue;
    }
    if (abs.origin !== base.origin) continue; // same-origin only
    if (IGNORE_EXT.test(abs.pathname)) continue;
    abs.hash = "";
    const key = abs.pathname + abs.search;
    if (seen.has(key)) continue;
    seen.add(key);
    routes.push({ url: abs.href, path: key || "/" });
    if (routes.length >= limit) break;
  }

  return routes;
}

/** Combine a base URL's origin with a new path (used by the manual "add page" box). */
export function routeFromInput(input: string, baseUrl: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    // Full URL provided.
    return new URL(trimmed).href;
  } catch {
    /* treat as path */
  }
  const base = normalizeOrigin(baseUrl);
  if (!base) return null;
  try {
    return new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, base.origin).href;
  } catch {
    return null;
  }
}
