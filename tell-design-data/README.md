# tell-design-data

**Developer-only** local harness that turns Tell diagnose / voice / redesign /
apply sessions into high-quality design-LLM training records.

- Runs **only on your machine**
- Writes under `~/.tell-design-data/` by default (or `./data` if configured)
- **Does not ship inside the Tell product repo**
- No upload, no telemetry, no cloud sync

Companion research (lives in Tell, citations only):  
`tell-proof` → `research/DESIGN_LLM_TRAINING_DATA_SURVEY.md`

---

## Quick start

```bash
cd tell-design-data
npm install
npm run build
npm link   # optional: expose `tell-design-data` on PATH
```

Point the harness at your Tell checkout (read-only):

```bash
export TELL_REPO=/path/to/tell-proof
export TELL_DESIGN_DATA_HOME=~/.tell-design-data
```

### Automatic collection (recommended)

**Option A — watch a drop folder** (zero Tell changes):

```bash
mkdir -p ~/.tell-design-data/inbox
tell-design-data watch
# Whenever a Tell report JSON lands in inbox/, it is ingested + scored + converted
```

Drop reports manually:

```bash
cp path/to/tell-report.json ~/.tell-design-data/inbox/
```

**Option B — local API sidecar** (auto-captures live Tell UI traffic):

```bash
# Terminal 1: Tell on :3000
cd "$TELL_REPO" && pnpm dev

# Terminal 2: sidecar on :3100 → proxies to :3000, records diagnose/voice/redesign
tell-design-data proxy --listen 3100 --target http://127.0.0.1:3000
```

Use `http://localhost:3100` in the browser instead of `:3000`.  
Only `/api/diagnose`, `/api/voice`, `/api/redesign` bodies are persisted locally.

**Option C — one-shot ingest**

```bash
tell-design-data ingest "$TELL_REPO/fixtures/reports/tell-report.json"
tell-design-data ingest ./my-session.json --outcome accepted
```

### Export training JSONL

```bash
tell-design-data convert          # writes curated SFT + DPO under data home
tell-design-data status           # counts + reward histogram
tell-design-data scrub            # redact secrets in-place on curated rows
```

Outputs (gitignored):

```
~/.tell-design-data/
  raw/episodes/*.json      # full episodes
  curated/sft.jsonl        # gold / strong-pass demonstrations
  curated/dpo.jsonl        # same-task preference pairs
  curated/corrections.jsonl
  meta/holdout.json        # episode ids never used for train
  meta/ledger.jsonl        # ingest audit log
```

---

## What gets kept (quality gates)

Aligned with the literature survey (LIMA / DPO pair rules / UIClip-style negatives):

| Bucket | Rule | Goes to |
|---|---|---|
| Gold | `--outcome accepted` **or** high reward + live capture | `sft.jsonl` |
| Strong pass | Top reward quartile among passes | `sft.jsonl` |
| Preference | Two outcomes for same brief/url | `dpo.jsonl` |
| Correction | `--outcome edited` with before/after artifacts | `corrections.jsonl` |
| Junk | Broken parse, missing shot/url, nav-only proof | dropped |

Reward (local, deterministic) uses Tell report fields when present:

```
R = human_accept + contrast_proxy + detector_clearance − generic_cluster − thrash
```

Rejected DPO members prefer **near-miss** scores (μ−2σ style), not absolute worst.

---

## Marking outcomes (human preference)

```bash
tell-design-data outcome <episode_id> accepted
tell-design-data outcome <episode_id> discarded
tell-design-data outcome <episode_id> edited --final ./final-patch.diff
```

Without outcomes, the harness still stores raw episodes and can emit weak SFT from
high deterministic reward — but **gold** requires your accept/edit labels.

---

## Safety

- Default data home is **outside** any git repo (`~/.tell-design-data`)
- This repository’s `data/` is gitignored
- `scrub` redacts bearer tokens, emails, `sk-` / `ghs_` style secrets, and query `token=`
- Never commit curated JSONL
- Do not enable the proxy on a public bind without a tunnel you trust

---

## Push this as your private GitHub repo

This cloud environment cannot create repos under your account. On your machine:

```bash
cd tell-design-data
gh repo create tell-design-data --private --source=. --remote=origin --push
```

Or create an empty private repo in the UI, then:

```bash
git remote add origin git@github.com:<you>/tell-design-data.git
git push -u origin main
```

---

## Non-goals

- Not a Tell product feature
- Not MCP tools inside `@tell/mcp`
- Not uploaded datasets
- Not training orchestration (use TRL / your stack on the exported JSONL)
