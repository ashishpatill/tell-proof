---
name: ship-loop
description: Analyze an open PR, fix blocking issues, make semantic commits, push, re-check CI, and iterate until the PR is mergeable — then merge. Use when asked to ship, merge, or run a ship-loop / shiploop on a pull request.
---

# Ship loop

Close the loop from “open PR” to “merged on the base branch.” No vibes. No attribution noise.

## Invariants

1. **Semantic commits only** — `feat|fix|docs|test|chore|refactor(scope): summary`. One concern per commit.
2. **No attribution** — do not add `Co-authored-by`, `Signed-off-by`, or names of tools/agents/people in commit subjects or bodies.
3. **Push every cycle** — `git push -u origin <branch>` after each commit batch.
4. **Do not force-push** to a shared PR branch unless the user explicitly asks.
5. **Merge only when green** — required checks pass, mergeable, no unresolved blocking review items.
6. **Prefer the PR that contains the work just shipped** — if multiple drafts stack, merge the tip that includes the rest (or merge base then tip in order).

## Loop

| Step | Action |
|---|---|
| 1. Identify | `gh pr view <n>` / `gh pr checks <n>` — branch, base, checks, review threads |
| 2. Diagnose | CI failures, typecheck/tests locally, Playwright eye for UI PRs, leftover draft status |
| 3. Fix | Smallest change that clears a named failure |
| 4. Commit | Semantic message, no attribution trailers |
| 5. Push | Upstream the branch |
| 6. Re-check | Wait for checks; if red, go to 2 |
| 7. Ready | Undraft if still draft (`gh pr ready`) |
| 8. Merge | `gh pr merge <n> --merge` (or `--squash` only if user asks). Confirm on base. |

## Local gates (Tell)

```bash
pnpm -F @tell/design-skills test   # if engine touched
pnpm -F @tell/web typecheck
pnpm test                          # if broader
```

For showcase/UI: Playwright eye on `/showcase` — craft beat visible, no empty right gutter, no nav-only thumbs.

## Stop conditions

- **Done:** PR merged, branch deleted optional, working tree clean vs base.
- **Blocked:** Missing permissions, failing required check you cannot fix, or user-required review — report the blocker; do not fake a merge.

## Quick prompt

```
Use ship-loop on PR #<n>.
Semantic commits, no attribution.
Analyze → fix → commit → push → re-check until green → undraft → merge.
```
