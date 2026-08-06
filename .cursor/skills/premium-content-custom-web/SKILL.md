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

1. **Analyze** — extract features, audience, goals, constraints → `analyze-features-requirements`
2. **Route** — select sub-skills from the graph based on features present
3. **Foundation** — run `design-system-foundation` before section work
4. **Generate** — IA, tokens, section specs, preview/code
5. **Taste Controls** — offer density / motion / lean / color / type / rounding options
6. **Verify** — if Tell is available, capture → diagnose → optional redesign with `tellDirectionId`

## Runtime engine

Prefer the deterministic package `@tell/design-skills`:

```ts
import { designFromFeatures } from "@tell/design-skills";
const { spec, previewHtml } = designFromFeatures(brief);
```

Studio UI: `/studio` · Specimen gallery: `/showcase` · Offerings: `/showcase/{saas|dashboard|corporate|educational|fintech|studio|consumer}`

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
- pricing-or-plans
- navigation-header-footer
- content-storytelling-pages
- forms-ctas-conversion
- restrained-motion-micro
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
