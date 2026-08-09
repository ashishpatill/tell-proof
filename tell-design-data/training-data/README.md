# Tell session training data (local only)

Auto-filled by **tell-proof** while you run `pnpm dev`, when this repo sits next to
Tell (or `TELL_DESIGN_DATA_REPO` points here). Tell also runs `tell-design-data sync`
after writes so curated JSONL stays current.

Every Capture, voice direction, redesign, restyle, proof/matrix run, and
**template / studio / showcase website** generation writes here automatically.

## Layout

```
training-data/
  raw/
    episodes/     # diagnose episodes (screenshot externalized)
    shots/        # PNG screenshots
    voice/        # voice / art-direction parses
    redesign/     # redesign proposals
    restyle/      # LLM restyle CSS drafts
    proof/        # prove-patch / verify / compare outcomes
    matrix/       # scenario-matrix captures
    design/       # DesignSpec + preview HTML from /api/design*
  by-day/YYYY-MM-DD/<kind>/
  sessions/       # sess_*/… grouped by in-process session
  inbox/          # drop zone for sync / watch
  curated/        # SFT / DPO JSONL after sync|convert
  meta/
    ledger.jsonl
```

## Convert

```bash
cd tell-design-data
npm install && npm run build
npm run sync
```
