---
name: tell-template-craft
description: Create or fix premium design templates by first borrowing working layout plumbing from the local peer design-daemon checkout (see research/plumbing-reference.local.json), then iteratively raising craft against measured top-designer corridors (anonymised corpus). Use when adding a siteKind/template, fixing layout bugs (overlap, sticky, stacking), improving /showcase, or iterating any offering until critique + Playwright eye pass.
---

# Tell template craft (plumbing → designer corridors)

**Token-efficient loop for templates.** Do not invent layout plumbing from scratch. Do not restyle from
named agencies. Two phases, always in this order:

| Phase | Source | Use for |
|---|---|---|
| **A — Plumbing** | Local peer checkout (`research/plumbing-reference.local.json` → `localCheckout`, or `/tmp/learn-plumbing/reference`) | Working solutions: landmarks, sticky/opaque nav, focus-visible, reduced-motion, stacking/z-index, overflow, hero claim vs figure collision, state coverage, anti-AI-slop *checks* |
| **B — Craft** | Measured corpus + `research/aggregate.json` + `docs/10_DESIGN_EVIDENCE.md` | Composition corridors from top designer / product pages (fold figure, inverse share, display, bleeds) — **ids/categories only**, never names or URLs in commits |

The peer daemon is **not** an aesthetic source. Peer theme packs and named studios must not appear in
committed code, comments, docs, or copy. Local study of designer GitHub template repos is allowed
for *measurement and eye* only; encode results as anonymised corridors (same as `design-research-loop`).
**Never name the peer product in commits.** Platform/MCP/auth adaptations: `docs/11`–`docs/13`.

## When to run

- Creating a new `siteKind` / template / showcase offering
- Fixing a visual bug (overlap, ghosting, empty band, clipped type)
- Improving an existing template until satisfactory
- Redesigning `/showcase` or Studio presentation of offerings

## Phase A — peer plumbing (do this first)

1. Reproduce the bug or blank feature with Playwright (`pnpm research:shots -- --page <id>` or a local route screenshot).
2. Search the peer checkout for a **solved pattern**, not a look:
   - `craft/anti-ai-slop.md`, `craft/typography*.md`, `craft/state-coverage.md`, `craft/accessibility-baseline.md`
   - `design-templates/*` only for structure/HTML landmarks / CSS stacking ideas
3. Encode the fix in `@tell/design-skills` (or `apps/web` for showcase chrome) + add a gate in
   `basics-checklist.ts` when the failure is repeatable.
4. Prefer the smallest change that clears the plumbing failure. For labeled hero figures
   (studio/consumer): **stack fold** — opaque claim band in document flow, then the figure.
   Never absolutely overlay stage labels under readable type (Fieldmark collision). Soft-gradient
   overclaim is fine only when the underlayer has no competing ink.

## Phase B — designer craft iteration (one template at a time)

1. Pick the measured corridor for this `siteKind` from `research/aggregate.json` → `byCategory`.
2. Adjust composition / CSS / figures toward that corridor (display size, inverse share, figure area,
   alignment axes) without empty-height hacks.
3. Run:
   ```bash
   pnpm -F @tell/design-skills test
   pnpm research:critique
   pnpm research:shots -- --page <critique-brief-id>
   ```
4. **Read the PNGs** (fold + scroll slices) like a human. Score ≠ quality. Fix collisions, sparse
   airways, cream/terracotta AI clusters, SaaS residue CTAs.
5. Re-critique. Score must not regress. Record the loop in `research/LOOP_LEDGER.md`.
6. Only then start the **next** template.

## Screenshot contract (always)

When improving templates or `/showcase`, post artifacts after each meaningful fix:

- Gallery: `/showcase` with **craft beats visible** (figure / claim+figure / inverse) — never sticky-nav-only crops
- Offering fold + 1–2 scroll slices for the template under work
- Prefer clipping `.sx-plate-frame` / `.sx-thumb` after `data-ready=true` and a non-empty `data-beat`
- Paths under `/opt/cursor/artifacts/screenshots/` (or `research/shots/`)
- Also follow `tell-recursive-improve` + `research/LEARNINGS.md` after any human-named miss

## Invariants

1. **Never auto-apply** patches to user apps — Tell returns diffs for human/Cursor review.
2. **Anonymise forever** — no third-party names/URLs in committed artifacts (`corpus.local.json` and `plumbing-reference.local.json` only).
3. **Basics before taste** — `assertBasics` green before chasing craft score.
4. **Depth over breadth** — finish one offering to satisfactory before opening another gap.
5. **Dogfood** — Tell UI / showcase chrome follows `docs/01_DESIGN_SYSTEM.md` tokens.

## Quick prompt

```
Use tell-template-craft.

Task: <new template | fix overlap on Fieldmark | improve consumer>
Phase A: check peer craft/ for plumbing pattern; implement smallest fix + basics gate.
Phase B: match <category> corridor from aggregate.json; critique → shots → read PNGs → iterate.
Post screenshots of /showcase and the template after each pass.
```

## Related

- `design-research-loop` — corpus measure / aggregate / critique machinery
- `docs/11`–`docs/13` — MCP / auth / capability flow plans from the same peer study
- `premium-content-custom-web` — skill graph + Taste Controls
- `tell-demo-fixture` — offline report reliability
- Engine: `packages/design-skills` · Gallery: `apps/web/src/app/showcase`
