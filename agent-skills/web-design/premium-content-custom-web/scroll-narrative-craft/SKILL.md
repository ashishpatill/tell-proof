---
name: scroll-narrative-craft
description: Sub-skill — CSS sticky scroll chapter + progress for motion=scroll-narrative or immersive. One pin max on conversion pages.
---

# scroll-narrative-craft

## Defaults
- One `.ds-chapter-pin` per page (first story/features section)
- Sticky inner + 2px progress rule driven by `animation-timeline: view()` when supported
- Pair with `hero-entrance-once` + `section-stagger-enter` + `scroll-reveal-once`
- No Lenis/GSAP required for the default tier

## Avoid
- Multiple pinned chapters on SaaS conversion pages
- Dual smooth-scroll engines
- Blur/parallax spectacle

## Reduced motion
- Unpin (`position: static`), hide progress, min-height collapses

## Related
- `docs/15_MOTION_ANIMATION_PLAN.md`
- `research/MOTION_ANIMATION_SURVEY.md`
