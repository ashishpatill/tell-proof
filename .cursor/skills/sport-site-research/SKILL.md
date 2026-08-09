---
name: sport-site-research
description: Mandatory research gate before building any sport website (cricket, football, hockey, tennis). Captures cultural vernacular, fan access modes, format lenses, category gaps, and score-spine UX — then seeds the design engine via sport-vernacular packs. Use whenever the brief mentions a sport, live scores, matchday, or league site.
---

# sport-site-research

**Hard gate:** Do not design, code, or run `agency:run` for a sport site until a research brief exists for that sport.

Full playbook: `agent-skills/web-design/premium-content-custom-web/sport-vernacular-craft/SKILL.md`  
Engine packs: `@tell/design-skills` → `getSportPack` / `matchSportFromQuery` / `sportResearchBriefTemplate`  
Deep notes: `research/SPORT_SITE_VERNACULAR.md`

## Why this exists

Generic “sports website” templates fail fans. Each sport has:

1. A **cultural tempo** (overs vs minutes vs periods vs nested points)
2. A **glance grammar** (what must be readable in one second on a mid-range phone)
3. **Format lenses** that change which facts matter
4. **Category gaps** major portals leave open (layout jitter, wrong tempo UI, buried situation)

Building without research produces another purple/card-grid sports shell.

## Workflow (every sport brief)

```
1. Identify sport → getSportPack(id) or matchSportFromQuery(query)
2. Write research/SPORT_BRIEF_<sport>.local.md from sportResearchBriefTemplate(id)
   (gitignored local notes OK; committed principles stay in research/SPORT_SITE_VERNACULAR.md)
3. Fill Fresh research notes: fan behavior, anonymised category failures, latency budget
4. Choose default format lens + access-mode priority (usually glance-live first)
5. Plan score spine stability + progressive disclosure
6. Only then: agency:run / hand craft / evolve specimen
```

## Supported packs

| Sport | Pack id | Signature glance unit |
|---|---|---|
| Cricket | `cricket` | Runs/wickets · overs · situation · this-over trail |
| Football | `football` | Minute · scoreline · events |
| Hockey | `hockey` | Score · period · strength state |
| Tennis | `tennis` | Sets \| games \| points + server |

## Non-negotiables

- Research before pixels
- No third-party product/host names in committed code or docs (category language only)
- Format lens required — never one UI for all competitions
- Score spine layout must not jump on live updates
- Editorial “sit-with” content must not bury glance-live facts
- Ban: equal sports card grids, Inter-only, purple AI defaults, fantasy chrome before score

## Prompt

```
Use sport-site-research.
Sport: cricket | football | hockey | tennis
Audience: …
Goal: live companion | editorial hub | league site
Then: fill brief → plan → build with sport-vernacular-craft.
```
