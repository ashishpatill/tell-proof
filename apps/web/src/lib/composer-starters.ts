/**
 * Starter chips under the home composer prompt.
 *
 * Never show third-party product brands as templates on Tell — only Tell
 * specimen / showcase catalog labels (listTemplates(), Northstar, Roundspool,
 * Crease, Baseline, …). See composer-brand-denylist.ts.
 *
 * Phase 0: empty on purpose (no competitor-inspired invent). Phase 2+ may fill
 * with Tell specimen starters only.
 */
export const COMPOSER_STARTER_CHIPS: ReadonlyArray<{
  id: string;
  label: string;
  brief?: string;
}> = [];
