---
name: agency-run-learn
description: Developer-only automatic learn after agency:run — improves shared engine memory from corpus/runs. Not end-user session learning (see tell-user-session-learn).
---

# agency-run-learn

**Developer / maintainer loop.** Each `agency:run` on a workstation with a design-data
pointer ends with learn → `agency-engine-memory.json` + `LEARNINGS.md` (+ write-back).

**Not for Priya's browser.** Her preferences use `tell-user-session-learn`.

| Loop | Skill | Where |
|---|---|---|
| Dev corpus + pipeline | `agency-run-learn` | `research/*`, design-data checkout |
| User sessions | `tell-user-session-learn` | `localStorage` `tell:user-design-profile` |

**Automatic** on `pnpm agency:run` and `--mark-pass 4-ship`. Opt out: `AGENCY_SKIP_LEARN=1`.  
Dev corpus itself requires `research/design-data.local.json` or `TELL_DESIGN_DATA` + `TELL_DEV_CORPUS=1`.

## Hard rules

1. Learn is automatic on agency runs — do not schedule a separate agent step.
2. Never enable design-data pull/write-back on public demos (`VERCEL` / `TELL_PUBLIC_DEMO`).
3. Do not weaken gates to make a run green.
4. No third-party hosts in Tell commits.
5. Do not store end-user profiles in the design-data repo.

## Commands

```bash
pnpm agency:run -- --query "<requirement>" --fresh   # learn automatic
pnpm agency:learn -- --run-id <id>                   # re-learn only
AGENCY_SKIP_LEARN=1 pnpm agency:run -- --query "…"   # dry smoke
```

## Related

- `research/design-data.README.md` — developer corpus wiring
- `tell-user-session-learn` — per-user product learning
- `agency-quality-site` — phased craft + autonomous run
