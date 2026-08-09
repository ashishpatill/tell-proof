# tell-design-data

**Developer-only** local harness + **training-data/** store for Tell sessions.

When `tell-proof` runs locally and this repo is checked out next to it, Tell
automatically writes diagnose / voice / redesign artifacts into:

```text
tell-design-data/training-data/
```

See `training-data/README.md`.

## Layout next to Tell

```text
workspace/
  tell-proof/          # product
  tell-design-data/    # this repo
```

## CLI

```bash
npm install && npm run build && npm link

# convert inbox/episodes → curated JSONL (uses ./training-data by default)
tell-design-data convert

# optional: watch inbox/
tell-design-data watch --home "$PWD/training-data"
```

Raw session files are gitignored; only `training-data/README.md` ships.
