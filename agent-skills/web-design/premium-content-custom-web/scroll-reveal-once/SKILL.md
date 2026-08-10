---
name: scroll-reveal-once
description: Once-only scroll reveals without blur spectacle. Wired when Taste motion is light-scroll-reveals in @tell/design-skills. Prefer CSS view timelines with IO fallback.
---

# scroll-reveal-once

## Defaults
- Prefer CSS `animation-timeline: view()` + `animation-range` under `@supports`
- Fallback: IntersectionObserver threshold ~0.08, rootMargin bottom -6%
- Opacity + ≤0.5rem translateY only — never blur filters
- Stagger children via `--motion-stagger-step` (≈40–80ms), cap ~6 items
- Run once; unobserve / fill-mode forwards after enter
- Reduced motion: final state immediately (CSS + JS paths)

## Avoid
- Replaying reveals on every scroll
- Large travel distances or filter blur
- Animating layout properties that cause reflow
- Spraying reveals onto every leaf node (stay in corpus transition-coverage band)

## Related
- `restrained-motion-micro` — control feedback
- `docs/15_MOTION_ANIMATION_PLAN.md` — narrative / immersive tiers above this
- `research/MOTION_ANIMATION_SURVEY.md` — native vs library stack
