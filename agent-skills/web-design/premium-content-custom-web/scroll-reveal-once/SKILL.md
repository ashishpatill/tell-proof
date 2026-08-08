---
name: scroll-reveal-once
description: Sub-skill — once-only IntersectionObserver reveals with small translate, no blur spectacle. Use with motion=light-scroll-reveals. Settles immediately under prefers-reduced-motion.
---

# scroll-reveal-once

## Defaults
- Threshold ~0.08, rootMargin bottom -6%
- Opacity + 0.5rem translateY only — never blur filters
- Run once; unobserve after enter
- Reduced motion: final state immediately

## Avoid
- Replaying reveals on every scroll
- Large travel distances or filter blur
- Animating layout properties that cause reflow
