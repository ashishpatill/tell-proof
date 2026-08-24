# Tell — Design Training Data Curation Research Plan

> **Research plan** (literature → Tell mapping).  
> **Literature:** [`research/DESIGN_LLM_TRAINING_DATA_SURVEY.md`](../research/DESIGN_LLM_TRAINING_DATA_SURVEY.md)
>
> **Collector (developer-only, separate repo — does NOT ship in Tell):**  
> `tell-design-data` — local CLI/proxy that auto-writes episodes under
> `~/.tell-design-data/`. See that repo’s README. Tell product code must not
> grow a training exporter.
>
> Related: `docs/08`, `docs/10`, `research/LEARNINGS.md`, `docs/13`.  
> Does **not** replace `PLAN.md` / `BUILD.md`.

**Status:** Research · **Audience:** developers training a design model off Tell loops  
**Storage:** outside this monorepo only (`~/.tell-design-data`)

---

## 0. Separation of concerns (hard rule)

| Lives in Tell (`tell-proof`) | Lives in `tell-design-data` (private/dev repo) |
|---|---|
| Literature survey + this plan | Convert / watch / reward / SFT·DPO export CLI |
| Product loop (diagnose → redesign → proof) | Raw episodes + curated JSONL store |
| Thin **local-only** sink (`packages/design-skills` → `training-data-sink`; Studio + MCP) writing into the sibling repo | Schema for curated rows + anonymisation |
| Nothing committed as training JSONL | All local data under `training-data/` |

**Do not** commit training JSONL anywhere in Tell.  
**Do not** enable the sink on Vercel by default (requires `TELL_TRAINING_DATA=1`).

---

## 1. How auto collection works (developer machine)

**Built into tell-proof (local/dev):** when this repo is checked out next to Tell as
`../tell-design-data` (or `TELL_DESIGN_DATA_REPO` is set), these **Studio routes**
and **local stdio MCP tools** write automatically on every successful run
(same writer: `@tell/design-skills/training-data-sink`):

- `/api/diagnose` · `/api/voice` · `/api/redesign` · `/api/restyle`
- `/api/proof/apply` · `/api/proof/verify` · `/api/proof/matrix`
- `/api/design` · `/api/design/html` (templates / studio / showcase websites)
- MCP (local stdio only — not a public host): `tell_diagnose` → `raw/episodes/` ·
  `tell_redesign` → `raw/redesign/` · `tell_proof_verify` → `raw/proof/` ·
  `tell_design_from_features` → `raw/design/` (same dump Studio `/api/design` writes)

`tell_apply` still returns patch text only (never silent-applies, never invents a sink).
Missing sibling checkout ⇒ no-op with `trainingSinkStatus().reason` (e.g.
`tell-design-data_not_found`) — Frontend owns sibling install + harness sync;
MCP does not clone or install that repo.

After each write Tell debounces **`tell-design-data sync`** (inbox ingest + curated JSONL).

```text
tell-design-data/training-data/
  raw/episodes|shots|voice|redesign|restyle|proof|matrix|design/
  by-day/YYYY-MM-DD/<kind>/
  sessions/<sess_id>/
  inbox/          # for CLI convert/watch/sync
  curated/        # after tell-design-data sync|convert
  meta/ledger.jsonl
```

Off on Vercel unless `TELL_TRAINING_DATA=1`. Disable locally with `TELL_TRAINING_DATA=0`.
Skip harness spawn with `TELL_TRAINING_DATA_SYNC=0`.
Confirm: `GET /api/health/capture` → `trainingData.enabled`.

Optional CLI (same repo):

```bash
cd tell-design-data && npm run build
tell-design-data convert   # uses ./training-data by default
```

---

## 2. Capability map (unchanged intent)

See survey §2: `D2C`, `C2C`, `CRITIC`, `RANK`, `AGENT`, `REPAIR`, `RESP`.  
Tell already emits the richest signals for `CRITIC` / `C2C` / `REPAIR`; the harness
turns those into rows. Public WebSight-style sets cover `D2C` only.

---

## 3. Research workstreams (Tell-side)

W0–W8 remain research readouts (survey-driven). Implementation of collection is
**owned by `tell-design-data`**, not this repo.

Tell-side only:

- Keep report/proposal schemas stable enough to ingest loosely  
- Keep docs pointers current  
- Never add product “Save for training” UI unless explicitly productized later

---

## 4. Immediate developer setup

```bash
# After cloning tell-design-data next to Tell:
cd tell-design-data && npm install && npm run build && npm link
tell-design-data proxy --listen 3100 --target http://127.0.0.1:3000
```

Artifact snapshot from the cloud agent (if you do not have the private remote yet):  
download `tell-design-data.tar.gz` from the run artifacts, then
`gh repo create tell-design-data --private --source=. --push`.

---

## Changelog

- **2026-08-09** — Collector moved to separate `tell-design-data` developer repo;
  Tell keeps survey + plan only.
