---
name: premium-content-custom-web
description: Design or redesign premium websites/webapps customized to product features with restrained motion. Analyzes requirements, routes a skill graph, applies aesthetic lean profiles, and offers Taste Controls for developers in agent workflows.
---

# Premium content-custom web

Entry skill for multi-million-dollar-quality marketing sites, corporate stories, and product webapps.

## Non-negotiables

1. Content and declared features drive every layout decision
2. Motion stays restrained: `none`, `subtle-micro`, or `light-scroll-reveals` only — never continuous spectacle
3. Fully customized to the product — no generic template filler
4. Strong hierarchy, whitespace, conversion clarity, performance, accessibility
5. Always end with **Taste Controls** the developer can adjust

## Aesthetic lean profiles (use these codes — no external person/brand names)

| Code | Character |
|---|---|
| `minimal-clean` | Extreme clarity, content-first lists, zero noise |
| `conversion-sharp` | Hierarchy, repeated CTAs, benefit-driven sections |
| `system-crafted` | Token systems, content architecture, purposeful micro only |
| `refined-story` | Art-directed type, narrative depth, quiet polish |

## Workflow (run every time)

1. **website-domain-research** (required) — LoadPrior → gap → walkthrough if needed → IA → **emit-training-episode**
2. **Analyze** — extract features, audience, goals, constraints → `analyze-features-requirements`
3. **Sport gate** — if cricket/football/hockey/tennis, continue via `sport-matchday-web` / `sport-site-research` and set `sportId`
4. **Route** — select design sub-skills (`routeDomainResearchSkills` + `routeSkills`)
5. **Foundation** — run `design-system-foundation` before section work
6. **Generate** — IA, tokens, section specs, preview/code
7. **Taste Controls** — offer density / motion / lean / color / type / rounding options
8. **Verify** — if Tell is available, capture → diagnose → optional redesign with `tellDirectionId`

## Runtime engine

Prefer the deterministic package `@tell/design-skills`:

```ts
import { designFromFeatures } from "@tell/design-skills";
const { spec, previewHtml } = designFromFeatures(brief);
```

Studio UI: `/studio` · Showcases: `/showcase/saas`, `/showcase/dashboard`, `/showcase/corporate`, `/showcase/educational`

**Offerings vs plumbing:** Templates/offerings deepen only via the expert research loop (`design-research-loop`). Open-source design builders are consulted only for implementation basics the engine keeps failing (`assertBasics` in `@tell/design-skills`). Do not invent aesthetics or new templates from those tools.

## Taste Controls (always offer)

- Density: `sparse` | `balanced` | `information-rich`
- Motion: `none` | `subtle-micro` | `light-scroll-reveals`
- Aesthetic lean: `minimal-clean` | `conversion-sharp` | `system-crafted` | `refined-story`
- Color mood: `neutral-professional` | `soft-brand-accent` | `dark-premium` | `light-airy`
- Typography weight: `light-elegant` | `medium-modern` | `bold-confident`
- Rounding & depth: `sharp` | `soft` | `soft-elevation`

## Sub-skills

- analyze-features-requirements
- design-system-foundation
- hero-section
- features-benefits
- product-proof-stage
- conversion-landing-craft
- pricing-or-plans
- pricing-decision-craft
- navigation-header-footer
- content-storytelling-pages
- forms-ctas-conversion
- restrained-motion-micro
- scroll-reveal-once
- indexed-detail-markers
- honest-integration-marks
- paper-technical-frame
- split-panel-technical
- edge-fade-craft
- elevation-depth-tokens
- editorial-chapter-craft
- scrub-sequence-craft
- operational-governance-craft
- wireframe-annotation-craft
- surface-recipe-map
- ambient-atmosphere-craft
- signal-beam-craft
- organic-merge-craft
- pointer-field-craft
- glass-shell-craft
- container-tech-shell
- beam-state-craft
- dither-field-craft
- mesh-field-craft
- accent-border-craft
- reveal-hover-craft
- nested-frame-craft
- image-first-fold
- agency-minimal-grid
- marquee-rail-craft
- sport-vernacular-craft
- dashboard-or-webapp-ui
- responsive-performance

## Prompt template

```
Use premium-content-custom-web.
Product: …
Features: …
Audience / goal: …
Constraints: content-customized, low animation, premium B2B quality.
Taste: conversion-sharp, subtle-micro, neutral-professional.
```
