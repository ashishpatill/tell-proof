---
name: responsive-performance
description: >-
  Auto-apply on every website / specimen / agency build — WebP display-sized media,
  lazy below-fold images, width/height CLS reservation, mobile-first stack, light
  assets. Invoked by routeSkills (always) and tell-site-build-autoload rule; do not
  wait for the user to ask.
---

# responsive-performance

**Always-on for every site build.** Parent: `premium-content-custom-web`. Engine always
routes this node via `routeSkills`. Agents must execute it — not only list it.

Full playbook: `agent-skills/web-design/premium-content-custom-web/responsive-performance/SKILL.md`

## Non-negotiables (auto-apply)

1. **WebP at display size** — after adding photography under `apps/web/public/**`, run
   `pnpm media:site` (or `pnpm media:webp`). Hero ≤1600w @q82; editorial ≤1200w; other ≤1000w.
   Prefer pruning superseded jpg/png (`--prune`).
2. **Use `SiteImg`** (`apps/web/src/components/site-media/SiteImg.tsx`) for specimen media —
   rewrites `.jpg/.png` → `.webp`, sets `width`/`height`, `loading`, `fetchPriority`, `decoding`.
3. **LCP** — one priority/eager hero image max; everything else lazy + async decode.
4. **CLS** — always reserve intrinsic width/height; never un-sized `<img>`.
5. **Mobile-first** — stack grids under ~800px; no autoplay video heroes.
6. **No heavy formats on the hot path** — no multi-MB JPEG heroes in commits.

## Verify

```bash
pnpm media:site -- --prune
# HTML should reference .webp; public/** should not keep hot-path multi-MB jpg after prune
```
