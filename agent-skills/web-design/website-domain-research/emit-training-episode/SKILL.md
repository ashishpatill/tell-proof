---
name: emit-training-episode
description: Required final research node — emit anonymised design/research training episode to tell-design-data or training stub; never commit JSONL in Tell.
---

# emit-training-episode

1. Run `pnpm exec tsx scripts/emit-design-training-episode.ts --kind research|design --domain <id> --ledger <path>`
2. Prefer `tell-design-data` / `TELL_DESIGN_DATA` sink ([docs/14](../../../../docs/14_DESIGN_TRAINING_DATA_CURATION_PLAN.md))
3. If companion missing: write gitignored `research/boards/<run>/training-stub.json` + note in PHASE_LEDGER
4. Strip hosts/product names from payloads
5. Record episode id in PHASE_LEDGER — phase fails without it (unless `TELL_TRAINING_DATA=0`)
