---
name: sport-matchday-web
description: >-
  Sport matchday website skill graph — extends website-domain-research with
  sport format lenses and matchday design craft. Use for cricket, football,
  hockey, tennis info sites. Always run LoadPriorDomain first.
---

# sport-matchday-web

**Extends:** `website-domain-research` (does not replace it).

## When to use

Sport / matchday / scoreboard / rankings / series websites.

## Order

1. Run full **website-domain-research** chain (LoadPrior → gap → walkthrough if needed → IA → category gaps → variant lens → training).
2. Specialize variant lens with **sport-format-lens** (Test/ODI/T20 or sport equivalents).
3. Design subgraph: vernacular → score-spine → live-rail → nav/footer → controls → scorecard/series/rankings/notebook craft.
4. Specimen under product routes (e.g. `/crease/*`).
5. Write back pack + memory + LEARNINGS + training episode.

## Graph

See `agent-skills/web-design/sport-matchday-web/GRAPH.md`.
