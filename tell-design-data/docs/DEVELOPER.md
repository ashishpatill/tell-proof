# Developer setup (local machine)

1. Clone next to Tell (recommended):

```bash
cd ~/src
git clone <your-private-tell-design-data-url> tell-design-data
cd tell-design-data
npm install && npm run build && npm link
```

2. Start auto collection while developing Tell:

```bash
# A) inbox watcher
tell-design-data watch

# B) OR API sidecar (use :3100 in browser)
tell-design-data proxy --listen 3100 --target http://127.0.0.1:3000
```

3. After a good redesign you approve:

```bash
tell-design-data status
tell-design-data outcome <episode_id> accepted
tell-design-data convert
```

Training JSONL is only under `~/.tell-design-data/curated/`.
