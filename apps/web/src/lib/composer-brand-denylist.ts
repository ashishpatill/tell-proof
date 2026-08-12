/**
 * Third-party product / host brands that must never appear as Tell home
 * composer starter templates or chips under the prompt.
 *
 * Tell specimens (Northstar, Roundspool, Crease, Baseline, listTemplates /
 * showcase catalog labels) are fine. Cursor/GitHub as capture tooling copy is
 * fine — only competitor product chips / domains as starters are banned.
 */
export const COMPOSER_TEMPLATE_BRAND_DENYLIST = [
  "emergent",
  "emergent.sh",
  "lovable",
  "lovable.dev",
  "v0.dev",
  "bolt.new",
  "replit",
  "replit.com",
  "cursor.com",
  "framer.com",
  "same.new",
  "softgen",
  "dhiwise",
] as const;

export type ComposerDeniedBrand = (typeof COMPOSER_TEMPLATE_BRAND_DENYLIST)[number];

/** Case-insensitive scan; domains match as substrings, bare names as word tokens. */
export function findDeniedComposerBrands(text: string): ComposerDeniedBrand[] {
  const lower = text.toLowerCase();
  const hits: ComposerDeniedBrand[] = [];
  for (const token of COMPOSER_TEMPLATE_BRAND_DENYLIST) {
    if (token.includes(".")) {
      if (lower.includes(token)) hits.push(token);
      continue;
    }
    const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(token)}(?:[^a-z0-9]|$)`, "i");
    if (re.test(text)) hits.push(token);
  }
  return hits;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
