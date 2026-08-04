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
| `/studio` | Live canvas + Taste Controls + magic edit + viewport + copy HTML |
| `/showcase/*` | SaaS, dashboard, corporate, educational demos |
| `POST /api/design` | Brief → spec + preview HTML (`redesignFrom` optional) |
| MCP `tell_design_from_features` | MCP tool |

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
