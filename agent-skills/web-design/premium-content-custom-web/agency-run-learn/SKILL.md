---
name: agency-run-learn
description: Post-run learning loop for the agency pipeline — extract signals from a board run, update engine memory + LEARNINGS, feed the next agency:run. Use after every query run or repeated phase failure.
---

# agency-run-learn

Agencies compound quality across projects. Tell compounds quality across **runs**.

After `1-refs`…`4-ship` (or an honest stop), this skill turns the run into:

1. Durable **pattern keys** in `research/LEARNINGS.md`
2. Machine **engine memory** in `research/agency-engine-memory.json`
3. Optional **gate / polish / niche** patches when a miss is repeatable

Parent: `agency-quality-site`  
Sibling: `tell-recursive-improve` (showcase/template champion–challenger)

---

## Why this exists

A green `SHIP.html` with a thin reference board, soft niche match, or repeated phase retry is still a **learning event**. Without this skill, the next query repeats the same weakness.

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
# Automatic — end of every agency:run
pnpm agency:run -- --query "<requirement>" --fresh

# Manual re-learn
pnpm agency:learn -- --run-id <id> --query "<same query>" --niche photography

# Smoke without learning
pnpm agency:run -- --query "<requirement>" --skip-learn
```

---

## Agent loop (after a run)

### Goal

```
Use agency-run-learn.

Run-id: <id>
Query: <…>

GOAL: Extract signals; update memory + LEARNINGS; if severity=encode and a
delivery/basics gate is absent, patch @tell/design-skills with a vitest lock.
Do not weaken gates. Do not name third-party hosts.
```

### Loop

```
agency-run-learn LOOP:
1. Read research/boards/<id>/LEARN.md
2. If thin-board: note seedCategory; remind to fill boards.seeds.local.json locally
3. If encode: implement smallest gate/polish/niche fix + test
4. Re-run pnpm agency:run once on the same query to prove improvement
5. Stop when memory reflects the lesson and tests are green
```

---

## Memory contract

`research/agency-engine-memory.json` (committed):

- `bansExtra` → merged into auto briefs
- `nicheBoosts` → soft classifiers after hand presets
- `craftHints` → injected into DIRECTION.md
- `pipelineNotes` → thin boards / retries
- `seenPatternKeys` → LEARNINGS dedupe

---

## Improving Tell proof

Repeatable misses → `assertAgencyDelivery` / `assertBasics` / `applyAgencyPolish` / niche presets → vitest → LEARNINGS.  
Do not vendor external skill marketplaces.
