---
name: agency-quality-site
description: Cursor-native agency marketing-site pipeline — autonomous agency:run (query→refs→plan→phases→automatic learn) or ONE PHASE AT A TIME with Goal + Loop. Quality compounds per phase; never craft --all.
---

# agency-quality-site

Full playbook: `agent-skills/web-design/premium-content-custom-web/agency-quality-site/SKILL.md`  
Copy/paste prompts: `…/agency-quality-site/PROMPTS.md`  
Design rigor: `…/agency-quality-site/DESIGN_RIGOR.md`  
Learn (automatic): `.cursor/skills/agency-run-learn` · `research/design-data.README.md`

## Quick contract

1. **Autonomous:** `pnpm agency:run -- --query "…" --fresh` — ends with **automatic** `agency:learn`
2. **Manual craft:** one phase per cycle — Goal → run → eye → Loop ≤3 → `--mark-pass` → next (`4-ship` mark-pass also auto-learns)
3. Phases: `1-refs` → `2-build` → `3a-typography` → `3b-spacing` → `3c-motion` → `3d-mobile` → `4-ship`
4. Each phase starts from `current.html` of the last **passed** phase.
5. Phase 0 reads `DESIGN_RIGOR.md` — lane + craft nodes (auto-filled by `agency:run`).
6. Never combine axes. Never craft `--all`.
7. Status: `pnpm agency:pipeline -- --brief <brief> --status`
8. **Learn is automatic** — do not ask the agent to run `agency:learn` as a separate step. Opt out only with `AGENCY_SKIP_LEARN=1`.
9. **Personal corpus:** `TELL_DESIGN_DATA` or `research/design-data.local.json` feeds seeds/memory/corridors.

## Session opener (auto)

```
Use agency-quality-site.
pnpm agency:run -- --query "<requirement>" --fresh
# Learn runs automatically; read LEARN.md after.
# Optional: point TELL_DESIGN_DATA at your tell-design-data checkout.
```

## Session opener (manual)

```
Use agency-quality-site.
Brief: scripts/agency-pipeline/briefs/lensroom.json
Read DESIGN_RIGOR.md. --status, then Goal/Loop ONLY the current phase until --mark-pass; repeat.
(4-ship mark-pass auto-learns.)
```

## Related

- `agency-run-learn` — automatic engine memory + design-data write-back
- `premium-content-custom-web`, `agency-minimal-grid`, `gates-until-verified`, `tell-proof-verify`, `design-research-loop`
- `docs/08_AI_DESIGN_METHODS.md` (reference board + compose slices)
