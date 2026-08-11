# Sport site vernacular — research synthesis

> Principle-only notes for building sport matchday / information sites.
> No third-party product or host names. Agents must run `sport-site-research`
> before coding. Engine packs: `packages/design-skills/src/sport-vernacular.ts`.

**Status:** Living research · **Audience:** ui-builder, agency pipeline, design-skills  
**Related:** `sport-site-research`, `sport-vernacular-craft`, `docs/09_PREMIUM_DESIGN_SKILLS.md`

---

## 0. Mandate

When asked for a cricket, football, hockey, tennis (or similar) website:

1. **Research first** — culture, formats/rules that change UI, fan access habits
2. **Write a brief** from `sportResearchBriefTemplate(sportId)`
3. **Plan** glance spine + format lens + editorial mode
4. **Build** with `sport-vernacular-craft`
5. **Never** start from a generic sports template or equal card grid

This file holds cross-sport best practices and a deep cricket synthesis used to ship CREASE.

---

## 1. What sports fans share (cross-sport)

| Pattern | Implication |
|---|---|
| Second-screen glances | First paint = facts, not marketing |
| Short sessions, high frequency | Instant load; sticky live rail; stable layout |
| Trust = freshness | Latency and provisional states must be visible |
| Competition stakes | Table / series / knockout context near the live view |
| Accessibility under stress | Daylight contrast; large tap targets; non-color event encoding |

### Sports website best practices

1. **Inverted pyramid** — most important fact first; progressive disclosure for depth
2. **Layout-stable live UI** — numbers update; positions do not jump
3. **Tabular numerals** for scores and clocks
4. **Mode split** — glance-live vs sit-with editorial vs archive
5. **Honest empty / delay / review states**
6. **Mobile-first**; desktop adds depth, not a different hierarchy
7. **Performance budget** — score HTML before heavy imagery
8. **Ban decoration that competes with the spine** (fantasy CTAs, equal promo cards)

---

## 2. Cricket — culture, formats, fan mental model

### 2.1 Cultural thesis

Cricket is lived **between balls**. The social unit is the **over** (six legal deliveries). Fans negotiate identity through formats: Test patience and sessions; ODI phase craft; T20 burst and night leagues. Pavilion, crease, tea, new ball, and partnership are ritual words — use them; do not replace them with generic “period” language.

### 2.2 Formats that change the UI

| Format | Tempo | Emphasize | Demote |
|---|---|---|---|
| Test / first-class | Days + sessions (lunch, tea, stumps); draws valid | Day/session, lead/trail, new ball, declaration | Required rate as primary, powerplay |
| ODI / List A | One long day; bowling quotas | Required rate, overs left, powerplay phases | Session clocks as primary |
| T20 / T20I | ~3 hours; every over an event | This-over trail, RRR, death overs | Multi-day chrome |

### 2.3 How fans access data

1. **Glance-live** (dominant during play) — open 15–20 times per match afternoon; need score, wickets, overs, situation in <1s
2. **Sit-with** — ball-by-ball notebook, partnerships, tactical essays between sessions
3. **Before-play** — schedule, squads, pitch/weather, series state
4. **After-play** — full scorecard, records, quotes

### 2.4 What category sites often fail to provide

- Stable score spines (layout jitter on refresh)
- Format-aware hierarchy (Test UI wearing a T20 costume or vice versa)
- Situation equation above the fold (`need X from Y`)
- This-over trail as a first-class object (not a text dump)
- Honest delay / DRS provisional labeling
- Separation of glance vs editorial (everything fights in one noisy feed)
- Light pages for mid-range phones on cellular

### 2.5 Unique cricket UX concepts

- **Score spine:** `runs/wickets (overs)` with tabular mono
- **Situation line:** chase equation or innings lead — the “where are we?” answer
- **Rates:** CRR / RRR (limited overs) or session run rate (Tests)
- **This-over trail:** six beads — `· 1 4 6 W wd nb`
- **Strike pair + bowler:** who owns the contest right now
- **Technical honesty:** free hit, extras, DRS pending, DLS target change, Super Over nested innings

### 2.6 Material vernacular

Pitch ink, turf dusk, cherry leather (red ball), floodlight gold (white-ball nights), crease line as signature rule, pavilion board rhythm.

---

## 3. Football / hockey / tennis (starter theses)

See packs in `sport-vernacular.ts` for full primaryFacts and format lenses.

| Sport | Glance unit | Classic failure |
|---|---|---|
| Football | Minute + scoreline + state | Formation chrome before the clock |
| Hockey | Score + period + strength | Treating it like football on ice |
| Tennis | Sets \| games \| points + server | Flattening the nested score |

Agents asked for these sports must still run a **fresh** research pass (local brief) — packs are seeds, not substitutes for audience-specific research.

---

## 4. Design engine wiring

| Piece | Role |
|---|---|
| `domain-research.ts` | `DomainResearchPack`, `loadPriorDomain`, `requirementGapDiff`, `routeDomainResearchSkills` |
| `sport-vernacular.ts` | Typed packs + multipage/shell fields + query match + brief template |
| `DesignBrief.sportId` | Routes `sport-vernacular-craft` after research graph |
| Agency `niche.ts` | cricket / football / hockey / tennis presets |
| Skills | `website-domain-research` → `sport-matchday-web` / `sport-site-research` → craft |
| Specimen | `/crease/*` Core six (multipage) — cricket match theater reference |
| Capture | `scripts/multipage-domain-capture.ts` (domain-agnostic) |
| Training | `scripts/emit-design-training-episode.ts` → tell-design-data / training.local |

---

## 4b. Cricket multipage IA (Phase 0 evidence write-back)

Synthesized from ≥2 category portals × Core six route stubs (hero/mid/footer + mobile nav/footer) and a scroll walkthrough video. Host names omitted.

### Shell

- Sticky header + thin score/status rail under nav is the glance pattern worth keeping
- Primary nav should stay ≤6 and match route classes — not tickets/shop competing with Live
- Mobile: logo + overflow menu; live score card near top; do not let CMP steal the fold

### Core six

| Class | Job |
|---|---|
| home | Editorial + live entry + series pulse — score rail still above the fold |
| live-match / matches | Dedicated match centre; Live & Upcoming vs Completed tabs |
| scorecard | Full tables — progressive disclosure from live |
| series | First-class competition arc (not a footer link only) |
| rankings | Dual axes: role × format tabs; subnav for team vs player |
| notebook / news | Sit-with reading — separated from glance-live chrome |

### Steal

- Match centre filters (series/team/format) with progressive disclosure
- Tab split Live & Upcoming / Completed
- Rankings format + role controls
- Directory footer columns for Match / Compete / Read

### Refuse

- Single-page hash IA for a matchday product
- Consent overlays as part of the product surface
- Ads between spine and facts
- Editorial hero burying live spine during play
- Sprawling primary nav (>6) with commerce before score

### Controls

Format chips · live chip · rankings tabs · primary “open scorecard” CTA — all with focus-visible states.

---

## 4c. Secondary directory (category gap fill)

Category portals consistently expose more than Core six — but as **directory / footer / deep-link** surfaces, not primary-nav sprawl. Synthesized across ≥2 major cricket information sites (host names omitted).

| Class | Job | Specimen |
|---|---|---|
| fixtures | Before-play schedule — when / format / venue chapters | `/crease/fixtures` |
| teams | Team hubs — form strip + next fixture + path into Live | `/crease/teams` |
| players | People cards from strike pair / bowler identity | `/crease/players` |
| stats | Records index / after-play archive | `/crease/stats` |

### Components added to Core six pages

| Surface | Additions |
|---|---|
| live-match | Status tabs (All / Live / Upcoming / Completed); ball-by-ball commentary strip; latency honesty; powerplay / phase line |
| scorecard | Baseline-aligned board; extras; partnerships; fall of wickets |
| series | Points table (P/W/L/NR/Pts/NRR) beside competition arc |
| rankings | Dual axis — Teams / Batters / Bowlers + format lens |
| home | Series pulse + deep links into fixtures / teams / stats |
| notebook | Before-play note in the story rail |

### Primary nav invariant

Still ≤6. Secondary routes wire through footer columns Match / Compete / People / Read.

---

## 5. Taste Controls (sport default)

Prefer pack `tasteSeed`. Typical cricket seed:

- Lean: `refined-story`
- Density: `information-rich`
- Motion: `light-scroll-reveals` (live pulse only on spine)
- Color: `soft-brand-accent` (pitch + flood + cherry)
- Type: medium UI + tabular mono scores
- Rounding: `sharp`

---

## 6. Checklist before ship

- [ ] Research brief completed for this sport + audience
- [ ] Default format lens chosen
- [ ] Primary facts ordered for glance-live
- [ ] Score spine layout stability specified
- [ ] Editorial / live modes separated
- [ ] Provisional / latency states designed
- [ ] Reduced-motion + non-color event encoding
- [ ] Ban list applied (no purple AI sports shell)
