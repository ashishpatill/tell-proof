# Automatic training data (local Tell runs)

When **tell-proof** and **tell-design-data** are siblings:

```text
workspace/
  tell-proof/
  tell-design-data/
```

running `pnpm dev` in Tell **automatically**:

1. Writes session + design artifacts into `tell-design-data/training-data/`
2. Triggers `tell-design-data sync` (inbox ingest → curated SFT/DPO JSONL)

Covered flows: Capture · voice · redesign · restyle · prove/verify/matrix ·
**Studio / showcase / template HTML** (`/api/design`, `/api/design/html`).

Optional `.env.local` in tell-proof:

```bash
TELL_DESIGN_DATA_REPO=/absolute/path/to/tell-design-data
# TELL_TRAINING_DATA=0        # disable sink
# TELL_TRAINING_DATA_SYNC=0   # write raw files but skip harness sync
```

Check: `GET /api/health/capture` → `trainingData.enabled`.
After generating a template: `training-data/raw/design/` + `training-data/curated/sft.jsonl`.
