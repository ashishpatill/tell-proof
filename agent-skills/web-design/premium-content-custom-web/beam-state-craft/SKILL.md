---
name: beam-state-craft
description: Traveling/breathing edge-beam state accents for loading, selected, focus, pressed — full state matrix, reduced-motion equivalents via text/shape/semantics, performance guardrails. Decorative accent only; state must read without the beam.
---

# beam-state-craft

Use a beam as a **decorative state accent**. State must remain understandable through text, shape, contrast, and the correct semantic attribute when animation is absent.

## Effect sizes (learned)

| Size | Motion | Best use |
|---|---|---|
| `sm` | Compact traveling border | Icon buttons, pills |
| `md` | Full traveling border | Selected cards, current panels |
| `line` | Traveling bottom edge | Inputs, search, progress |
| `pulse-inner` | Contained breathing glow | Loading / processing |
| `pulse-outside` | Outward halo | One prominent live task only |

## State defaults

- Loading/processing: pulse-inner, strength ~0.55–0.75
- Selected/current: md or pulse-inner, quieter strength
- Focus: sm or line — never replace `:focus-visible`
- High-priority live: pulse-outside — **only one** in a view

Keep the effect mounted and toggle `active` so fade-out can run.

## Tell constraints

- Prefer CSS `box-shadow` / `outline` tokens before third-party beam packages in generated HTML
- Color from `--c-accent` (mono by default)
- `prefers-reduced-motion`: show static border/outline equivalent
- Never the sole indicator of state

## Avoid

Beams on every card; colorful variants as default; layout shift from outside pulse; missing disabled/loading text.
