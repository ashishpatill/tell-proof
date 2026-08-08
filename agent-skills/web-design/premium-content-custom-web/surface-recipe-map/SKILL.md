---
name: surface-recipe-map
description: Maps external aesthetic theme packs to Tell Taste Controls (lean + mood + motion) or to skip. Prevents purple/glass/particle spectacle from entering the engine.
---

# surface-recipe-map

When an agent encounters a named aesthetic theme pack, **do not copy it**. Remap or skip:

## Remap to Taste Controls

| Requested vibe | Tell remap |
|---|---|
| Clean beige / warm paper light | `paper-technical-frame` + `light-airy` + `minimal-clean` |
| Orange paper SaaS | `conversion-sharp` + `soft-brand-accent` |
| Dark contrasting clean / dark blue | `dark-premium` + `system-crafted` |
| Dark glass / cloudy blue glass | `dark-premium` + `system-crafted` — **no** glass-everywhere |
| Editorial / book serif / documentary | `refined-story` + foundry/dossier/archive/press kinds |
| Agency minimal / nested clean agency | `agency-minimal-grid` + `minimal-clean` + sparse |
| Image-first / framed grid | `image-first-fold` + studio/consumer kinds |
| Nested frames / container lines | `nested-frame-craft` + `split-panel-technical` |
| Split technical / wireframe info | `split-panel-technical` + `wireframe-annotation-craft` |
| Light paper technical | `paper-technical-frame` |
| Solar duotone / high contrast skeuo | `bold-confident` type + `conversion-sharp`; skeuo only in chrome |
| Operational enterprise | `operational-governance-craft` + corporate/fintech |
| Product proof SaaS | `product-proof-stage` + `conversion-landing-craft` |
| Number details / company logos | `indexed-detail-markers` / `honest-integration-marks` |
| Beautiful shadows | `elevation-depth-tokens` |
| Progressive blur / alpha masking | `edge-fade-craft` |
| Animation on scroll / staggered word | `scroll-reveal-once` (no blur / no word-split a11y traps) |
| Pricing / landing page structure | `pricing-decision-craft` / `conversion-landing-craft` |
| Scroll scrub sequences | `scrub-sequence-craft` |
| Editorial portfolio chapters | `editorial-chapter-craft` |
| Atmosphere background (calm folds) | `paper-technical-frame` or quiet CSS atmosphere — **no** particle curtains |
| Border gradient / corner diagonals | `accent-border-craft` — single accent, static |
| Reveal hover / masked reveal | `reveal-hover-craft` |
| Marquee loop | `marquee-rail-craft` — pause + reduced motion |
| Tailwind utility patterns | Use tokens in `@tell/design-skills`; utilities OK in apps/web with design-system tokens |

## Skip (conflicts with Tell detectors / restrained motion)

- Continuous particles, orbs, gooey blobs, falling leaves as primary motion
- Laser / beam / pointer-trail emitters as spectacle
- Purple-to-indigo gradient themes and glass-everywhere shells
- WebGL landing lasers / steering as default marketing chrome
- Fake logo walls and invented social proof
- Scroll hijack + dual smooth-scroll engines

Always end with **Taste Controls** the human can adjust.
