# Automatic training data (local Tell runs)

When **tell-proof** and **tell-design-data** are siblings:

```text
workspace/
  tell-proof/
  tell-design-data/
```

running `pnpm dev` in Tell auto-writes diagnose / voice / redesign into:

`tell-design-data/training-data/`

Optional `.env.local` in tell-proof:

```bash
TELL_DESIGN_DATA_REPO=/absolute/path/to/tell-design-data
# TELL_TRAINING_DATA=0   # disable
```

Then open `tell-design-data/` in the explorer — you should see `training-data/README.md`.
After a Capture, check `training-data/raw/episodes/` and `training-data/sessions/`.
