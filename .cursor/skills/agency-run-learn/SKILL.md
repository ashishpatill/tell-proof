---
name: agency-run-learn
description: Automatically runs after every agency:run (and after pipeline --mark-pass 4-ship). Extracts learnings into engine memory + LEARNINGS, and write-backs to the personal design-data checkout when configured.
---

# agency-run-learn

Each user query / board run must leave the **engine smarter** — not only a prettier HTML file.

**Automatic:** `pnpm agency:run` always ends with learn. Manual `pnpm agency:pipeline … --mark-pass 4-ship` also learns.  
Opt out only with `AGENCY_SKIP_LEARN=1` (dry smokes). Do **not** treat learn as a separate agent step.

**Integrates with:** `agency-quality-site` · personal design-data checkout · `tell-recursive-improve` · `gates-until-verified`  
**Runner:** embedded in `agency:run` / `agency:pipeline`; re-run with `pnpm agency:learn -- --run-id <id>`

## What it improves

| Artifact | Role |
|---|---|
| `research/agency-engine-memory.json` | Machine memory — bans, niche boosts, craft hints, pipeline notes |
| `research/LEARNINGS.md` | Human narrative (pattern keys) |
| `research/boards/<run-id>/LEARN.md` | Per-run signal dump |
| Personal design-data repo | Seeds in → memory/LEARNINGS out (see `research/design-data.README.md`) |
| Next `agency:run` | Merges memory into brief bans + DIRECTION + niche matching |

## Personal design-data

Point Tell at your private corpus checkout:

```bash
# research/design-data.local.json (gitignored) OR:
export TELL_DESIGN_DATA=/path/to/tell-design-data
```

`agency:run` will pull seeds + memory + corridor bands from that checkout, then write learnings back after the automatic learn pass.

## Hard rules

1. **Learn is automatic** — every run and every completed `4-ship` mark-pass.
2. **Do not weaken gates** to make a run green — encode the miss instead.
3. **No third-party hosts** in Tell commits, memory narrative, or LEARNINGS.
4. **Dedup** by pattern key — do not spam LEARNINGS with the same failure.
5. **Champion/challenger** for code changes to `@tell/design-skills` — memory auto-applies; gate code still needs a measured patch + vitest.

## Loop (only when encode severity needs a code patch)

```
1. agency:run finishes → learn already ran (check LEARN.md)
2. If severity=encode and a gate is missing: patch assertAgencyDelivery / polish + test
3. If thin-board: add seeds in the design-data repo (or boards.seeds.local.json)
4. Re-run the same query once to prove the memory/gate helped
```

## Session prompt

```
Use agency-quality-site (+ agency-run-learn is automatic).

pnpm agency:run -- --query "<requirement>" --fresh
# Learn already ran. Read research/boards/<run-id>/LEARN.md
# If encode signals name a missing gate, patch @tell/design-skills + vitest
```

## Manual re-learn only

```bash
pnpm agency:learn -- --run-id orch-proof --query "freelance photographer booking site"
AGENCY_SKIP_LEARN=1 pnpm agency:run -- --query "…" --fresh   # dry smoke only
```

## Related

- `agency-quality-site` — phased craft + autonomous run
- `research/design-data.README.md` — personal corpus wiring
- `tell-recursive-improve` — champion/challenger for template/showcase misses
- `docs/08_AI_DESIGN_METHODS.md` — packaged judgment, no trophy copy
