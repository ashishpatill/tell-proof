---
name: agency-run-learn
description: After every agency-quality site run, extract learnings and improve the design engine + pipeline memory. Use when agency:run finishes, a phase fails repeatedly, or a human names a craft miss on a board run.
---

# agency-run-learn

Each user query / board run must leave the **engine smarter** — not only a prettier HTML file.

**Integrates with:** `agency-quality-site` · `tell-recursive-improve` · `gates-until-verified`  
**Runner:** `pnpm agency:learn` (also auto-invoked at the end of `pnpm agency:run`)

## What it improves

| Artifact | Role |
|---|---|
| `research/agency-engine-memory.json` | Machine memory — bans, niche boosts, craft hints, pipeline notes |
| `research/LEARNINGS.md` | Human narrative (pattern keys) |
| `research/boards/<run-id>/LEARN.md` | Per-run signal dump |
| Next `agency:run` | Merges memory into brief bans + DIRECTION + niche matching |

## Hard rules

1. **Learn on every run** — success and early stop. Use `--skip-learn` only for dry smokes.
2. **Do not weaken gates** to make a run green — encode the miss instead.
3. **No third-party hosts** in memory, LEARNINGS, or commits.
4. **Dedup** by pattern key — do not spam LEARNINGS with the same failure.
5. **Champion/challenger** for code changes to `@tell/design-skills` — memory auto-applies; gate code still needs a measured patch + vitest.

## Loop

```
1. Finish agency:run (or stop on a named blocker)
2. pnpm agency:learn -- --run-id <id>   # auto if you used agency:run
3. Read research/boards/<id>/LEARN.md + new LEARNINGS entries
4. If severity=encode and a gate is missing: patch assertAgencyDelivery / polish + test
5. If thin-board: fill boards.seeds.local.json for that seedCategory (local only)
6. Re-run the same query once to prove the memory/gate helped
```

## Session prompt

```
Use agency-run-learn + agency-quality-site.

Just finished run <run-id> for query: <…>
1. Confirm LEARN.md + agency-engine-memory.json updated
2. If encode signals name a missing gate, patch @tell/design-skills and vitest
3. Append only novel pattern keys to LEARNINGS.md
4. Do not vendor external skill DBs
```

## Manual

```bash
pnpm agency:learn -- --run-id orch-proof --query "freelance photographer booking site"
pnpm agency:run -- --query "…" --fresh          # learns at end
pnpm agency:run -- --query "…" --skip-learn     # opt out
```

## Related

- `agency-quality-site` — phased craft + autonomous run
- `tell-recursive-improve` — champion/challenger for template/showcase misses
- `docs/08_AI_DESIGN_METHODS.md` — packaged judgment, no trophy copy
