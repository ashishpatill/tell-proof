# Personal design-data companion (local only)

Wire your private design corpus checkout so `agency:run` can learn from **your**
collected seeds, anonymised measurements, and engine memory.

## Pointer (gitignored)

Create `research/design-data.local.json` (never commit):

```json
{
  "path": "../tell-design-data",
  "repoUrl": "git@github.com:<you>/tell-design-data.git",
  "pull": true
}
```

Or set env:

```bash
export TELL_DESIGN_DATA=/absolute/path/to/tell-design-data
# optional: TELL_DESIGN_DATA_PULL=0   # skip git pull
# optional: TELL_DESIGN_DATA_COMMIT=0  # skip auto-commit write-back
```

## Expected layout in the data repo

```
tell-design-data/
  boards.seeds.json            # categories → [{ url, note }]  (local URLs OK)
  agency-engine-memory.json    # shared with Tell after each learn
  LEARNINGS.md                 # mirrored from Tell after learn
  aggregate.json               # optional; anonymised bands by category
  measurements/ref-*.json      # optional; anonymised forensics
  runs/<run-id>/LEARN.md       # per-run learn dumps written back
```

Same shape as Tell’s `research/boards.seeds.local.example.json` for seeds.

## What Tell does

1. **Start of `agency:run`** — ensure checkout (clone/pull), merge memory, prefer
   design-data seeds for Phase 1, inject corridor band digests into `DIRECTION.md`.
2. **End of every run** — `agency:learn` runs **automatically**, then write-backs
   memory + LEARNINGS (+ `runs/<id>/LEARN.md`) into the data repo.

Third-party URLs stay in the data repo / gitignored `boards.local.json` only.
Never copy award-site hosts into committed Tell files.

See also: `.cursor/skills/agency-run-learn/SKILL.md`
