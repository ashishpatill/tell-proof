---
name: agency-run-learn
description: Automatic post-run learning for the agency pipeline — always fires after agency:run and after --mark-pass 4-ship. Merges personal design-data corpus, updates engine memory + LEARNINGS, write-backs to the data checkout.
---

# agency-run-learn

Agencies compound quality across projects. Tell compounds quality across **runs**.

**Learn is not optional.** Agents must not “remember to run learn” — `agency:run` and
`agency:pipeline --mark-pass 4-ship` invoke it automatically. Opt out only with
`AGENCY_SKIP_LEARN=1`.

After `1-refs`…`4-ship` (or an honest stop), this skill turns the run into:

1. Durable **pattern keys** in `research/LEARNINGS.md`
2. Machine **engine memory** in `research/agency-engine-memory.json`
3. Write-back into the personal **design-data** checkout (seeds source + memory sink)
4. Optional **gate / polish / niche** patches when a miss is repeatable

Parent: `agency-quality-site`  
Sibling: `tell-recursive-improve`  
Data: `research/design-data.README.md`

---

## Personal design-data (your corpus)

Configure once:

```json
// research/design-data.local.json (gitignored)
{ "path": "../tell-design-data", "repoUrl": "git@…", "pull": true }
```

or `export TELL_DESIGN_DATA=/abs/path/to/tell-design-data`.

Expected files in that repo: `boards.seeds.json`, `agency-engine-memory.json`,
optional `aggregate.json` / `measurements/`, `LEARNINGS.md`, `runs/`.

`agency:run` **reads** seeds + memory + corridor bands from it, then **writes**
updated memory / LEARNINGS / `runs/<id>/LEARN.md` after automatic learn.

---

## Signals (deterministic)

| Signal | Source | Engine effect |
|---|---|---|
| Thin / corridor board | ORCH_LOG, missing `ref-*-hero.png` | `pipelineNotes` + LEARNINGS `agency:thin-board:*` |
| Phase retries | STATE.json `attempts` | LEARNINGS `agency:phase-retry:*` |
| Gate pressure | ledger / orch fail rows | LEARNINGS + gate id list |
| Ship anti-patterns | SHIP.html heuristics | `bansExtra` (+ encode gate if missing) |
| Niche miss | query vs matched niche | `nicheBoosts` for next `matchNiche` |
| Lane reinforce | DIRECTION.md | `craftHints` for siteKind |

---

## Commands

```bash
# Learn is automatic here:
pnpm agency:run -- --query "<requirement>" --fresh

# Manual re-learn
pnpm agency:learn -- --run-id <id> --query "<same query>"

# Dry smoke only
AGENCY_SKIP_LEARN=1 pnpm agency:run -- --query "<requirement>" --fresh
```

---

## Agent loop (encode severity only)

### Goal

```
Use agency-quality-site (learn is automatic via agency-run-learn).

Run-id: <id> already has LEARN.md from the automatic pass.
If severity=encode and a delivery/basics gate is absent, patch @tell/design-skills
with a vitest lock. Do not weaken gates. Do not name third-party hosts.
```

### Loop

```
agency-run-learn LOOP (encode only):
1. Read research/boards/<id>/LEARN.md
2. If thin-board: add seeds in design-data boards.seeds.json
3. If encode: implement smallest gate/polish/niche fix + test
4. Re-run pnpm agency:run once on the same query to prove improvement
```

---

## Memory contract

`research/agency-engine-memory.json` (committed in Tell; mirrored to design-data):

- `bansExtra` → merged into auto briefs
- `nicheBoosts` → soft classifiers after hand presets
- `craftHints` → injected into DIRECTION.md
- `pipelineNotes` → thin boards / retries
- `seenPatternKeys` → LEARNINGS dedupe

---

## Improving Tell proof

Repeatable misses → automatic learn → `assertAgencyDelivery` / `assertBasics` /
`applyAgencyPolish` / niche presets → vitest → LEARNINGS.  
Do not vendor external skill marketplaces.
