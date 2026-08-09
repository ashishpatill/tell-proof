# Automatic training data (local Tell runs)

When **tell-proof** and **tell-design-data** are siblings:

```text
workspace/
  tell-proof/
  tell-design-data/
```

running `pnpm dev` in Tell **automatically** writes every session into:

`tell-design-data/training-data/`

Covered flows: Capture/diagnose · voice · redesign · restyle · prove patch · proof verify · scenario matrix.

Optional `.env.local` in tell-proof:

```bash
TELL_DESIGN_DATA_REPO=/absolute/path/to/tell-design-data
# TELL_TRAINING_DATA=0   # disable
```

Check: `GET /api/health/capture` → `trainingData.enabled` should be `true`.
After a Capture, look under `training-data/raw/episodes/` and `training-data/sessions/`.
After Prove patch, look under `training-data/raw/proof/`.
