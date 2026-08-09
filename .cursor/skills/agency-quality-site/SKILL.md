---
name: agency-quality-site
description: Cursor-native phased pipeline for agency-quality marketing sites — load design brain, reference board (3 refs), five-block brief, constrained build, then typography-only → spacing-only → motion-only → mobile 375 polish with screenshot gates. Improves Tell proof without Claude Code. Use when building or polishing a client marketing site end-to-end.
---

# agency-quality-site

Full playbook: `agent-skills/web-design/premium-content-custom-web/agency-quality-site/SKILL.md`

## Quick contract

1. Lock the 5-block brief (Audience · One CTA · Refs · Stack · Ban list) before any code.
2. Load packaged judgment first (`premium-content-custom-web` + ban list). Never vibe-prompt "make it beautiful."
3. Curate **exactly 3** references; screenshot hero + one content section + footer each. Match type/spacing/motion — **do not copy layouts**.
4. One constrained build, then **axis-isolated** polish passes (type → spacing → motion → 375px). Never combine axes.
5. Wrap every phase in `gates-until-verified`. Screenshot evidence required. Cap 3 retries per phase.
6. Run: `pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/lensroom.json`

## Related

- `premium-content-custom-web`, `conversion-landing-craft`, `design-research-loop`
- `gates-until-verified`, `tell-proof-verify`, `tell-recursive-improve`, `scroll-reveal-once`
- `docs/08_AI_DESIGN_METHODS.md` (reference board + compose polish slices)
