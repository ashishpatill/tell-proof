---
name: product-proof-stage
description: Sub-skill of premium-content-custom-web — put a real product workflow on stage as the central proof. Use for SaaS and AI-product landings where the interface (or a clearly labeled sample workflow) earns the click, not decorative mockups or invented metrics.
---

# product-proof-stage

Show the product mechanism before making broad claims. The interface is the evidence.

Priya’s buyer does not trust another feature grid. They trust a path they can step through:
**input → process → draft → review → approve** — with a human gate before anything ships.

## When to use

- SaaS / AI product marketing where conversion depends on understanding the loop
- Redesigns where Tell found “generic SaaS” tells and the hero still sells vibes, not mechanism
- Any brief that already declares P0 capabilities you can stage as workflow states

## Non-negotiables (Tell-shaped)

1. **Declared features only** — every stage title and panel body traces to a brief feature. No invented customers, logos, or percentages.
2. **Label samples** — if the path is not live app state, mark it `Sample workflow`.
3. **Human approval** — the final stage is review/approve. Never imply auto-apply or one-click magic publish.
4. **Restrained motion** — 160–220ms control feedback; no fake typing, perpetual float, or decorative generation loops.
5. **Aesthetic lean codes** — route through `minimal-clean` | `conversion-sharp` | `system-crafted` | `refined-story`. Do not lock a single pastel shell.
6. **Dogfood detectors** — no default Inter-only stack, violet gradients, shadow-everywhere, equal card grids, or fake social proof.

## Establish the story

1. Name the user friction in one sentence (from audience + P0 features).
2. Put one complete outcome in the fold or the first proof band — not a collage of UI chrome.
3. Model states explicitly: input, process, draft, review, approve.
4. Organize mid-page features around outcomes the workflow already demonstrated.
5. Keep pricing limits and FAQ on one continuous decision path (deep-link ambiguous terms).

## Visual system (adapts to Taste Controls)

| Concern | Rule |
|---|---|
| Surfaces | Paper → raised → one lit inverse proof stage — not flat single-fill |
| Type | Expressive display + readable body from tokens; mono only for meta/rail labels |
| Product panel | Denser than surrounding marketing copy |
| Accent | One signal color for live state / focus / progress — never rainbow |
| Proof honesty | Omit logo walls and testimonials when none were declared |

## Compose the page

- **Header** — compact product routes; one primary trial/demo action
- **Hero** — value prop + product stage (pipeline / board) showing one outcome
- **Workflow proof** — HTMX-swapped stage panels (or progressive fallback) for the five states
- **Features** — grounded in the same capabilities the workflow stepped through
- **Pricing / compare** — aligned limits from declared features only
- **FAQ** — objections next to the claims they answer
- **CTA** — same verb as the hero

## Implement the workflow stage (HTMX)

Prefer progressive enhancement:

1. Render every stage panel as a `<template id="wf-frag-{id}">` (or hidden fragment).
2. Keep the live panel in `#wf-panel` with the first stage already visible (works with JS off).
3. Stage chips use HTMX `hx-on:click` + `htmx.swap(...)` so swaps work in static preview HTML without a server.
4. When a live origin exists (Studio / MCP host), chips may instead `hx-get` fragment URLs; keep the same panel id and swap style.
5. Under `prefers-reduced-motion`, settle instantly — no staggered fake processing.

Stage chip contract:

```html
<button type="button"
  class="ds-workflow-chip"
  data-workflow-step="draft"
  aria-pressed="false"
  hx-on:click="/* swap #wf-frag-draft into #wf-panel; update aria-pressed */">
  Draft
</button>
```

## Validate

- Keyboard: every chip and approve control reachable; visible `:focus-visible`
- States: empty, loading/process, draft, error/retry, approve — all named
- Contrast floor on inverse proof surfaces
- Mobile: rail wraps or scrolls; panel stacks under claim
- Reduced motion: settled UI, no autoplay typing
- Tell path (when available): capture → diagnose → confirm proof stage does not trigger generic tells

## Avoid

- Marketing mockups that cannot explain their own state changes
- Fake dashboards, fake typing, unlabeled sample output
- Feature grids unrelated to the central workflow
- Hidden pricing limits or disconnected FAQ answers
- Continuous particle / glow spectacle competing with the product panel

## Runtime

`@tell/design-skills` routes this node for `saas-marketing` and emits layout `workflow-proof`.

```ts
import { designFromFeatures } from "@tell/design-skills";
const { spec, previewHtml } = designFromFeatures(brief);
// spec.routedSkills includes "product-proof-stage"
// previewHtml contains data-workflow-proof + HTMX stage swaps
```

## Prompt template

```
Use premium-content-custom-web → product-proof-stage.
Product: …
P0 features (workflow stages): …
Audience / goal: …
Constraints: sample workflow labeled, human approve gate, restrained motion, declared features only.
Taste: conversion-sharp, subtle-micro, soft-brand-accent.
```
