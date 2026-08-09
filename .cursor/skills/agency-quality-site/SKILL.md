---
name: agency-quality-site
description: Cursor-native agency marketing-site pipeline — autonomous agency:run (query→refs→plan→phases) or ONE PHASE AT A TIME with Goal + Loop prompts. Quality compounds per phase; never craft --all.
---

# agency-quality-site

Full playbook: `agent-skills/web-design/premium-content-custom-web/agency-quality-site/SKILL.md`  
Copy/paste prompts: `…/agency-quality-site/PROMPTS.md`  
Design rigor: `…/agency-quality-site/DESIGN_RIGOR.md`

## Quick contract

1. **Autonomous:** `pnpm agency:run -- --query "freelance photographer booking site" --fresh` (learns at end)
2. **Manual craft:** one phase per cycle — Goal → run → read screenshots → Loop ≤3 → `--mark-pass` → next.
3. Phases: `1-refs` → `2-build` → `3a-typography` → `3b-spacing` → `3c-motion` → `3d-mobile` → `4-ship`
4. Each phase starts from `current.html` of the last **passed** phase.
5. Phase 0 reads `DESIGN_RIGOR.md` — pick one lane + 1–2 craft nodes before build (auto-filled by `agency:run`).
6. Never combine axes. Never craft `--all`.
7. Status: `pnpm agency:pipeline -- --brief <brief> --status`
8. **Learn:** every run updates engine memory via `agency-run-learn` (`pnpm agency:learn`)

## Session opener (auto)

```
Use agency-quality-site + agency-run-learn.
pnpm agency:run -- --query "<requirement>" --fresh
Live refs optional via research/boards.seeds.local.json (gitignored); corridor fallback if thin.
After ship: read LEARN.md + new LEARNINGS; encode gates if severity=encode.
```

## Session opener (manual)

```
Use agency-quality-site.
Brief: scripts/agency-pipeline/briefs/lensroom.json
Read DESIGN_RIGOR.md. --status, then Goal/Loop ONLY the current phase until --mark-pass; repeat.
```

## Related

- `agency-run-learn` — post-run engine memory + LEARNINGS
- `premium-content-custom-web`, `agency-minimal-grid`, `gates-until-verified`, `tell-proof-verify`, `design-research-loop`
- `docs/08_AI_DESIGN_METHODS.md` (reference board + compose slices)
