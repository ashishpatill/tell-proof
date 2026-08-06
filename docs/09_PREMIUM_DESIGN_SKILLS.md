# Tell — Premium Content-Custom Design Skills

> Skill graph for designing / redesigning websites and webapps that feel expensive,
> trustworthy, and customized to product features — with restrained motion.
>
> **Naming rule:** Use aesthetic lean **codes** in code and prompts
> (`minimal-clean`, `conversion-sharp`, `system-crafted`, `refined-story`).
> Do not hard-code external person or brand names into runtime keywords.

## Where it lives

| Path | Role |
|---|---|
| `agent-skills/web-design/premium-content-custom-web/` | Agent skill graph (main + sub-skills) |
| `.cursor/skills/premium-content-custom-web/SKILL.md` | Agent entry skill |
| `packages/design-skills` | Deterministic engine (`designFromFeatures`) |
| `packages/design-skills/src/templates.ts` | Research-backed offerings (depth-first catalog across measured gaps) |
| `packages/design-skills/src/basics-checklist.ts` | Implementation floor only (not taste) |
| `/studio` | Live canvas + Taste Controls + magic edit + viewport + copy HTML |
| `/showcase` | Specimen gallery (print-atelier index of all offerings) |
| `/showcase/*` | Full proof sheets: saas, dashboard, corporate, educational, fintech, studio, consumer, foundry |
| `POST /api/design` | Brief → spec + preview HTML (`redesignFrom` optional) |
| `GET /api/design?templates=1` | Offering catalog metadata |
| MCP `tell_design_from_features` | MCP tool |

## Two sources of learning (do not mix)

| Question | Source |
|---|---|
| What does a multi-million-dollar page look like? Which offerings do we ship? How do we compose them? | **Expert study** via `design-research-loop` → corpus measurements → `docs/10_DESIGN_EVIDENCE.md` → `research/LOOP_LEDGER.md` |
| Why is the sticky nav ghosting? Why won't columns stack? Why are tokens missing? | **Open-source design builders** — only for plumbing we keep getting wrong after retries. Encode those floors in `basics-checklist.ts`. Never invent a template or aesthetic from them. |

### Offering catalog (keep count low)

One template per `siteKind` (saas, dashboard, corporate, educational, fintech, studio, consumer, foundry). Improve each until the research loop's convergence criteria hold for two consecutive loops. Add another only when a measured demand gap appears that none of the current kinds cover.

| Key | Market job |
|---|---|
| `saas` | Demo-booking landing for B2B teams |
| `dashboard` | Daily operator workspace |
| `corporate` | Enterprise credibility / trust narrative |
| `educational` | Technical mechanism explainer |
| `fintech` | Money-product trust landing |
| `studio` | Art-directed selected-work studio landing |
| `consumer` | Voice-led consumer product landing |
| `foundry` | Editorial foundry — hard-seam fold, type ladder, marginalia, colophon |

## Quality bar (Phase 7)

Preview HTML must clear this craft floor — routing alone is not enough:

1. **Brand-first hero** — product name as `.ds-brand-mark`, one headline, one support line, one CTA group
2. **Atmosphere** — paper gradient + quiet grain; never flat single-fill only
3. **Lean divergence** — `minimal-clean` stacks/lists; `conversion-sharp` lead cards + CTA rhythm; `refined-story` chapters; `system-crafted` token strip
4. **One dashboard shell** — aside + main in a single `.ds-dash-grid`
5. **No filler** — pricing lanes and proof lines derive from declared features (never invented Starter/Growth tiers)
6. **Educational figure** — scrub instrument + `<figcaption>` when site kind is docs-educational
7. **A11y / mobile** — `:focus-visible`, 44px controls, stacked layout under 800px, reduced-motion safe

## Workflow

1. Analyze features & requirements  
2. Route skill nodes  
3. Build design-system tokens  
4. Generate sections customized to features  
5. Offer Taste Controls  
6. Optional: Tell diagnose / redesign using `spec.tellDirectionId`

## Taste Controls

Density · Motion · Aesthetic lean · Color mood · Typography weight · Rounding & depth

## Invoke

```
Use premium-content-custom-web.
Product: …
Features: …
Constraints: content-customized, low animation, premium B2B quality.
Taste: conversion-sharp, subtle-micro, neutral-professional.
```

Or open `/studio` and generate interactively.

## Goal + loop

See `PLAN.md` **Phase 7** goal prompt and loop prompt. Execute until the checklist is green.

## E2E

```bash
pnpm -F @tell/web dev   # port 3000
pnpm e2e:studio
```
