---
name: organic-merge-craft
description: SVG filter gooey-merge craft in full — Gaussian blur + color-matrix threshold so overlapping shapes fuse. Soft continuous motion; static/simplified fallback under reduced motion. Accent layer only, never content.
---

# organic-merge-craft

## Technique (complete)

1. SVG filter: **Gaussian blur** then **color matrix threshold** (not plain blurred circles)
2. Animate multiple overlapping circles so they approach and separate
3. Soft continuous boundaries — one fluid mass, not separate discs
4. Use as background accent, loader, or hero atmosphere behind content
5. Tune blur, contrast, and spacing **together** so merging stays visible

## Tell constraints

- `pointer-events: none`; decorative / hidden from AT
- Under reduced motion: freeze a merged static silhouette or omit
- Opacity low enough that type contrast remains
- Prefer brand accent fill via `currentColor` / CSS variables — no fixed purple lock-in
- One section max; never page-wide screensaver

## Avoid

Faking gooey with non-merging blurs; jittery motion; competing with CTAs/forms.
