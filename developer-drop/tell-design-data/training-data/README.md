# Tell session training data (local only)

Auto-filled by **tell-proof** while you run `pnpm dev`, when this repo sits next to
Tell (or `TELL_DESIGN_DATA_REPO` points here).

## Layout

```
training-data/
  raw/
    episodes/     # diagnose episodes (screenshot externalized)
    shots/        # PNG screenshots
    voice/        # voice / art-direction parses
    redesign/     # redesign proposals
  sessions/       # sess_*/diagnose|voice|redesign|shot grouped by session
  inbox/          # drop zone for `tell-design-data watch` / convert
  curated/        # SFT / DPO JSONL after `tell-design-data convert`
  meta/
    ledger.jsonl  # append-only audit log
```

Raw captures are **gitignored**. Only this README (and empty `.gitkeep`s) ship.

## Enable from Tell

Sibling checkout (recommended):

```text
workspace/
  tell-proof/
  tell-design-data/   ← this repo
```

Or set in tell-proof `.env.local`:

```bash
TELL_DESIGN_DATA_REPO=/absolute/path/to/tell-design-data
# optional force on/off:
# TELL_TRAINING_DATA=1
```

## Convert to training JSONL

```bash
cd tell-design-data
npm install && npm run build
TELL_DESIGN_DATA_HOME="$PWD/training-data" npx tell-design-data convert
# or: npm run convert
```
