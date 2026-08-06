# research/

Evidence for the design engine. Everything here exists so that visual decisions can be argued with
measurements instead of taste claims.

## What is committed

| Path | Contents |
|---|---|
| `measurements/ref-*.json` | Anonymised per-reference measurements (ref id + category only) |
| `measurements/manifest.json` | Which refs were measured, and whether the run was clean |
| `aggregate.json` | Distributions, per-category signatures, calibrated craft bands |
| `critique.json` | Latest score of our own generated pages against those bands |
| `LOOP_LEDGER.md` | One row per research loop: goal, score movement, what changed |

## What is never committed

`corpus.local.json` holds the reference URLs. It is git-ignored on purpose. No committed file in
this repository — source, docs, tests, comments, or commit messages — may name a third-party
person, studio, company, product, host, or URL. The research is about *what premium pages measure
like*, not about who made them.

## Rebuilding the corpus locally

Create `research/corpus.local.json` as an array of entries:

```json
[
  {
    "ref": "ref-001",
    "category": "premium-b2b-saas",
    "role": "short description of the kind of business, no names",
    "url": "https://…"
  }
]
```

Guidelines for a corpus that produces useful corridors:

- **≥ 40 references, ≥ 6 categories.** Bands calibrated on a handful of pages are coincidences.
- **Spread the categories.** Marketing sites, product surfaces, editorial/brand pages, documentation,
  studio portfolios, enterprise and capital brands. Each category has its own signature, and the
  engine routes by site kind, so the evidence has to be routed by category too.
- **Prefer pages that a business with real revenue actually shipped.** The point is not award reels;
  it is the visual language that survives a procurement review.
- **Include a few deliberately maximal references.** They set the ceiling for what "too much" looks
  like, which is how the restraint bands get their upper bound.

Then:

```bash
pnpm research:forensics     # measure every reference at 1440×900 and 390×844
pnpm research:aggregate     # distributions + calibrated bands + docs/10_DESIGN_EVIDENCE.md
pnpm research:critique      # score our own generated pages against those bands
```

## What is measured

The in-page probe (`scripts/design-research/forensics.ts`) records, per page and per viewport:

- **Typography** — families by rendered text area, full size ladder, step ratios, weights in play,
  display size as a share of viewport width, display leading/tracking/measure, body leading/measure,
  fluid-type usage, uppercase micro-label count, variable-font settings.
- **Colour** — area-weighted surfaces and area-weighted ink tones, distinct hues, peak saturation,
  neutral saturation (the tell that separates designed greys from `#808080`), median text contrast,
  gradient usage, dark/light.
- **Space** — section padding distribution, gap ladder, container width and its ratio to the
  viewport, conformity of every spacing value to a 4px and 8px grid.
- **Layout** — section count, grid containers, column-count histogram, share of asymmetric grids,
  full-bleed blocks, above-fold painted ratio, document height in viewports, sticky chrome.
- **Bands** — the page split into vertical bands, each with element count, character count, largest
  type size and median background lightness. This is how "does the scroll have rhythm" becomes a
  number.
- **Shape** — radius histogram and distinct steps, pill count, shadow coverage and median alpha,
  hairline-border share.
- **Motion** — share of elements with transitions, median and p90 duration, easing histogram,
  keyframe and infinite animation counts, `prefers-reduced-motion` rule count, video/canvas/WebGL.
- **Tokens** — declared CSS custom properties bucketed into colour, space, type, radius, shadow,
  motion, layer.
- **Semantics & performance** — landmarks, heading structure, nav links, CTA count, form fields,
  `:focus-visible` rules, DOM size, request count, font files, first contentful paint.

## Why bands rather than targets

Every dimension is scored as a corridor (corpus p10–p90) with a tolerance, not as a target value.
Tuning to a median produces pages that all look the same as each other — which is the exact failure
mode the engine exists to avoid. Sitting inside a wide corridor with room on both sides is what
lets four different briefs produce four visually different pages that are all defensible.
