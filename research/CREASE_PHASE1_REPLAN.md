# Phase 1 re-plan — CREASE multipage shell (after Phase 0 gate)

**Status:** Phase 0 complete · **Core six shell routes landed** on this branch (polish in Phase 2–4 as needed)  
**Base:** `DomainResearchPack` `sport:cricket` + `research/SPORT_SITE_VERNACULAR.md` §4b  
**Do not** blank-slate — load prior domain first.

## Goal

Turn CREASE from hash-nav single page into Core six routes under `/crease/*` with one shared shell.

## Scope

| Track | Deliverable |
|---|---|
| Specimen | `/crease`, `/crease/live`, `/crease/scorecard`, `/crease/series`, `/crease/rankings`, `/crease/notebook` + shared nav/footer/live rail |
| Engine | Optional `match-theater` emitter stub; keep DomainResearchPack fields authoritative |
| Skills | Sport design nodes stubs under `sport-matchday-web` as needed |
| Training | Emit episode on shell write-back |

## Non-goals

- Live scoring feeds
- Commerce / tickets in primary nav
- Naming third-party portals in commits

## Verify

```bash
pnpm -F @tell/design-skills test
pnpm -F @tell/web typecheck
# Core six routes return 200 with shared shell
```

## Phase 2–4

2. Page craft depth
3. Polish
4. Ship proof screenshots + training
5. `/ship-loop full` → merge to `master`
