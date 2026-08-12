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

1. **Autonomous:** `pnpm agency:run -- --query "…" --fresh` — ends with **automatic** `agency:learn` + `media:site` (WebP)
2. **Manual craft:** one phase per cycle — Goal → run → eye → Loop ≤3 → `--mark-pass` → next (`4-ship` mark-pass also auto-learns **and** runs `media:site`)
3. Phases: `1-refs` → `2-build` → `3a-typography` → `3b-spacing` → `3c-motion` → `3d-mobile` → `4-ship`
4. Each phase starts from `current.html` of the last **passed** phase.
5. Phase 0 reads `DESIGN_RIGOR.md` — lane + craft nodes (auto-filled by `agency:run`; `craftNodes` land on the brief and merge into engine `routedSkills`).
6. Never combine axes. Never craft `--all`.
7. Status: `pnpm agency:pipeline -- --brief <brief> --status`
8. **Learn is automatic** on agency runs (`agency-run-learn`) — developer corpus only when design-data pointer is set.
9. **User sessions** learn separately in the browser (`tell-user-session-learn`) — never via design-data checkout.
10. **Personal corpus (dev):** `TELL_DESIGN_DATA` + `TELL_DEV_CORPUS=1` or `research/design-data.local.json`.
11. **Media performance is automatic** — `responsive-performance` is always routed; `pnpm media:site` runs at end of `agency:run` **and** on `agency:pipeline --mark-pass 4-ship`. Specimen UIs use `SiteImg`.
12. **Research gate is automatic on every template** — `designFromFeatures` attaches `researchPlan` (LoadPrior → gap → sport-site-research when sport → IA → training) and merges `followOnCraft` into `routedSkills`.
13. **Skill wiring is a hard gate** — `assertSkillWiring` (via `assertBasics`) + agency `2-build` artifacts `RESEARCH_GATE.md` / `SKILL_WIRING.json`. Phase fails if research/craft/optim wiring is red.
14. **Template wins upgrade the engine** — every specimen/template improvement must also land a basics gate, LEARNINGS pattern, and (when relevant) figure/CSS/route change in `@tell/design-skills`. Specimen-only polish is `process:template-without-engine`. Complex concepts: compose in Figma → map into engine figures. Signature plates must **teach**, not only label (`care-plate-explains` / `signature-figure-teaches`).

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
