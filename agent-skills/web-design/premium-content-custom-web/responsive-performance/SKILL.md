---
name: responsive-performance
description: Sub-skill of premium-content-custom-web — responsive performance. Always routed; agents must execute (WebP budgets, lazy media, CLS).
---

# responsive-performance

Mobile-first. Fast. Accessible. Shared across all surfaces.
**Auto-triggered** on every site via `routeSkills` + always-applied `tell-site-build-autoload`.

## Rules

- Stack grids under ~800px
- Reserve space to avoid layout shift (`width` + `height` on every `<img>`)
- Keep assets light; no autoplay video heroes
- **WebP at display size** — `pnpm media:site` after any `apps/web/public/**` photography
  - Hero / fold: ≤1600w @ quality ~82
  - Editorial / story: ≤1200w @ ~78
  - Other stills: ≤1000w @ ~78
  - Prefer `--prune` to drop superseded jpg/png
- **One LCP image** — `loading="eager"` + `fetchPriority="high"`; all other media lazy + async decode
- Specimen sites: use `SiteImg` (`apps/web/src/components/site-media/SiteImg.tsx`) which rewrites to `.webp` and applies the defaults above
- README / docs media: `pnpm media:webp` (includes site media)

## Anti-patterns

- Multi-MB JPEG heroes committed as the served asset
- Unsized images (CLS)
- Eager-loading an entire story rail
- Waiting for a human to ask for WebP conversion
