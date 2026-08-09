---
name: agency-quality-site
description: Cursor-native agency marketing-site pipeline — ONE PHASE AT A TIME with Goal + Loop prompts so each pass improves the previous phase's artifacts. Never run the full pipeline in one craft pass.
---

# agency-quality-site

Full playbook: `agent-skills/web-design/premium-content-custom-web/agency-quality-site/SKILL.md`  
Copy/paste prompts: `…/agency-quality-site/PROMPTS.md`

## Quick contract

1. **One phase per cycle** — Goal → run → read screenshots → Loop ≤3 → `--mark-pass` → next.
2. Phases: `1-refs` → `2-build` → `3a-typography` → `3b-spacing` → `3c-motion` → `3d-mobile` → `4-ship`
3. Each phase starts from `current.html` of the last **passed** phase.
4. Never combine axes. Never craft `--all`.
5. Status: `pnpm agency:pipeline -- --brief <brief> --status`

## Session opener

```
Use agency-quality-site.
Brief: scripts/agency-pipeline/briefs/lensroom.json
--status, then Goal/Loop ONLY the current phase until --mark-pass; repeat.
```

## Related

- `premium-content-custom-web`, `gates-until-verified`, `tell-proof-verify`, `design-research-loop`
- `docs/08_AI_DESIGN_METHODS.md` (reference board + compose slices)
