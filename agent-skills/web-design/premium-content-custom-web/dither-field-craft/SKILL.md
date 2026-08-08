---
name: dither-field-craft
description: Ordered dither / Bayer-style atmospheric field craft — canvas behind content, pointer-events none, monochrome waves, vignette, pause when hidden. Full script duties retained; Tell uses sparse static dither CSS by default.
---

# dither-field-craft

## Visual target

Near-black base; enlarged square cells; 4×4 Bayer-style ordered dither; broad organic waves (not TV noise); vignetted edges.

## Layering

Fixed/absolute canvas `z-index: 0`, `pointer-events: none`; page content `z-index: 1`.

## Runtime duties

Resize + DPR cap; pause when `document.hidden` or not intersecting; teardown on unmount; reduced motion → static frame or CSS fallback.

## Tell

Engine may emit a quiet CSS dither/grain under dark-premium. Full canvas dither when briefly requested for observatory/dashboard atmospheres.
