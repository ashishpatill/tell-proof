---
name: sport-matchday-web
description: >-
  Auto-trigger for cricket, football, hockey, tennis, live scores, matchday, scoreboard,
  rankings, series, or sport info websites. Extends website-domain-research with sport format
  lenses and matchday design craft. Always run LoadPriorDomain first; never invent multipage IA
  without pack or walkthrough evidence.
---

# sport-matchday-web

**Extends:** `website-domain-research` (does not replace it).

**Auto-trigger:** When the brief mentions sport / live scores / matchday, engine routes `sport-matchday-web` after `website-domain-research`. Always-applied rule `tell-domain-research` requires this path.

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
