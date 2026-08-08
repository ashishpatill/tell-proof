---
name: tell-recursive-improve
description: Recursive self-improvement loop for Tell templates, showcase, and design-skills — champion vs challenger, eye+critique evals, persistent learnings. Use when showcase previews look wrong, craft stalls, or after any session that shipped a visual miss (truncated thumbs, gutters, overlap). Inspired by EvidenceLoom / skill-RSI style loops; Tell-specific harness.
---

# Tell recursive improve (champion → challenger → learnings)

Compounding loop. Each session must leave **one durable lesson** and **one measurable win**.
Do not brainlessly re-shoot the same nav strip and call it proof.

## Harness

| Gate | Fail if |
|---|---|
| **Eye — showcase** | Preview shows sticky nav + truncated type; empty right gutter; ghosted labels |
| **Eye — template** | Best craft moment (figure / inverse / claim) not visible in posted shots |
| **Critique** | Matrix or target brief score regresses |
| **Basics** | `assertBasics` red |

**Pass bar for showcase shots:** the frame must include a **primary craft beat** (hero claim *with* figure start, or product plate, or inverse proof) — not chrome alone.

## Loop (one cycle)

1. **Load learnings** — read `research/LEARNINGS.md` before editing.
2. **Name the failure** — one sentence (e.g. "index thumbs are 88px tall at scale 0.2 → only nav visible").
3. **Champion** — current committed behavior.
4. **Challenger** — smallest change that targets that failure (one surface: preview crop, gallery UI, or one siteKind).
5. **Eval** — Playwright eye on `/showcase` + offering; `pnpm research:critique` if engine touched; typecheck.
6. **Promote or revert** — keep only if eye + critique clear.
7. **Write the lesson** — append to `research/LEARNINGS.md` with pattern key + anti-pattern.
8. **Screenshot contract** — post gallery + at least one mid-page craft beat (or cinema reel frame), never nav-only.

## Pattern keys (examples)

- `showcase:preview-gutter` — fixed iframe scale left dead strip
- `showcase:nav-only-thumb` — short crop at y=0
- `template:label-under-claim` — absolute overfigure under type
- `template:sitekind-css-dead` — siteKind rules trapped in wrong lean branch

## Showcase presentation rules

1. Previews **measure-scale** to fill width (`SpecimenPreview`).
2. Still frame **scrolls to a craft beat** (figure > hero > metrics) — skip sticky nav.
3. Featured uses **cinema reel** (smooth scroll through beats) — GIF substitute, `prefers-reduced-motion` safe.
4. Index thumbs are tall enough to show claim+figure, cinema on hover.
5. Agent screenshots must use the same standard — clip the plate/thumb, wait for `data-ready=true`, assert beat ≠ top nav.

## Quick prompt

```
Use tell-recursive-improve.

Failure: <what the human saw>
Load research/LEARNINGS.md.
Challenger: <one change>.
Eval: Playwright eye + critique if needed.
Promote only if pass; append learning; post craft-beat screenshots.
```

## Related

- `tell-template-craft` — peer plumbing → designer corridors
- `design-research-loop` — numeric craft bands
- Gallery: `apps/web/src/components/showcase/SpecimenPreview.tsx`
