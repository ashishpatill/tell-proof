---
name: design-research-loop
description: Run one evidence-driven design research iteration — measure real rendered reference pages with Playwright, aggregate them into numeric craft bands, score our own generated output against those bands, fix the widest gap, and record the loop. Use this before changing anything in the design engine, and once per session while the craft score is still improving.
---

# Design research loop

The design engine is only allowed to get better in one way: by measuring pages that real buyers
already paid for, turning those measurements into corridors, and then closing the distance between
our output and those corridors. Opinions do not move the engine. Numbers do.

Run **one loop per session**. A loop is small, complete, and leaves the repository provably better
than it found it.

## Invariants

1. **Anonymised forever.** The corpus of reference URLs lives in `research/corpus.local.json`,
   which is git-ignored. Nothing committed — code, docs, comments, commit messages, test names —
   may contain a third-party person, studio, company, product, host, or URL. Committed research
   carries `ref-0NN` ids and category buckets only.
2. **Evidence before opinion.** Any change to tokens, layout, motion, or copy defaults must cite a
   measured band in `docs/10_DESIGN_EVIDENCE.md`. "It looks better" is not a reason; "the corpus
   p10–p90 for display leading is 0.95–1.10 and we shipped 1.30" is.
3. **Measure our own output the same way.** `pnpm research:critique` runs the identical in-page
   probe against pages the engine generated. Same instrument, same viewport, same scroll pass.
4. **One widest gap per loop.** Fix the lowest-scoring craft dimensions first. Breadth-first
   polishing hides regressions.
5. **Never let the score go down.** If a loop lowers the craft score, revert the change or fix it
   before committing.
6. **Craft score is a floor, not a ceiling.** A page can sit inside every band and still be dull.
   Each loop must also carry one qualitative judgement recorded in the ledger.

## The loop

| Stage | Command / action | Output |
|---|---|---|
| 1. Goal | Write the loop goal into `research/LOOP_LEDGER.md` | one sentence + target dimensions |
| 2. Widen | Add references to the local corpus if the current one is thin for the goal | `research/corpus.local.json` |
| 3. Measure | `pnpm research:forensics` | `research/measurements/ref-*.json` |
| 4. Aggregate | `pnpm research:aggregate` | `research/aggregate.json`, `docs/10_DESIGN_EVIDENCE.md` |
| 5. Critique | `pnpm research:critique` | `research/critique.json` + weakest-dimension ranking |
| 6. Close the gap | Change the engine, tokens, or section grammar | code |
| 7. Re-critique | `pnpm research:critique` again | new score, must be ≥ previous |
| 8. Record | Append the loop entry to `research/LOOP_LEDGER.md` | ledger row |

## Goal prompt (start of a session)

```
Design research loop <N>.

Current craft score: <from research/critique.json>.
Weakest dimensions: <top 3 from the critique ranking, with their measured values and bands>.

Goal for this loop: raise <dimension(s)> into band across all four critique briefs
without lowering any other dimension.

Before writing code:
1. Read docs/10_DESIGN_EVIDENCE.md for the measured corridor of the target dimensions.
2. Look at how the corpus achieves it — check `byCategory` in research/aggregate.json for
   whether the corridor differs by site kind. If it does, the engine must differ by site kind too.
3. If fewer than 6 references contributed to the band, widen the corpus first; a band calibrated
   on 3 pages is a coincidence, not a corridor.

Then change the smallest amount of engine code that moves the measurement, and re-run the critique.
```

## Loop prompt (mid-session, after each attempt)

```
Re-ran the critique. Score moved <old> → <new>.

For each target dimension, state:
- measured value per brief, and whether it is now inside the band
- what in the generated CSS/DOM produced that number
- which other dimension moved as a side effect (there is always one)

If any dimension regressed, fix that before continuing.
If all targets are in band, pick the next weakest dimension and continue,
unless the qualitative check below fails — in which case fix that instead.

Qualitative check (a human must be able to answer yes):
- Could this page belong to a company with real revenue, or does it read as a template?
- Is there exactly one thing the eye lands on first per screen?
- Does any motion exist that a reader would not miss if it were removed?
- Does the page look like the product it describes, or like any product?
```

## Convergence

The loop stops when **all** of these hold for two consecutive loops:

- Craft score ≥ 0.92 across every brief in the critique matrix.
- No craft dimension scores below 0.75 on any brief.
- The corpus has ≥ 40 references and ≥ 6 category buckets.
- The last loop's qualitative check passed without a caveat.
- A fresh brief the engine has never seen scores within 0.03 of the matrix average
  (generalisation, not overfitting to the four critique briefs).

Until then, the answer to "are we done" is no.

## Guarding against overfitting

The critique matrix is four briefs. It is easy to tune tokens until those four score well and
everything else regresses. Two defences:

- **Holdout brief.** Each loop, invent one brief for a product the engine has not seen (different
  industry, different density, different goal) and score it. It is not allowed to be more than
  0.03 below the matrix average.
- **Band, not target.** Dimensions are corridors with a p10 and a p90. Never tune to the median;
  tune to be inside the corridor with room on both sides.

## Ledger format

Append to `research/LOOP_LEDGER.md`:

```md
## Loop <N> — <date>

- **Goal:** …
- **Corpus:** <n> references (<+m> added)
- **Score:** <old> → <new>
- **Closed:** dimension — value before → after (band lo–hi)
- **Side effects:** …
- **Qualitative:** …
- **Next weakest:** …
```

## Related

- `docs/10_DESIGN_EVIDENCE.md` — the measured corridors
- `docs/11_DESIGN_ENGINE_PLAN.md` — how the engine is built against them
- `premium-content-custom-web` — the skill graph that consumes the evidence
- `tell-dogfood-audit` — the detector-side check that our own UI has no tells
