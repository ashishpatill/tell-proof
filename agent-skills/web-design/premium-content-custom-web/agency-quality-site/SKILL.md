---
name: agency-quality-site
description: Phased agency-quality marketing-site pipeline for Cursor — design brain, 3-ref board, five-block brief, constrained build, axis-isolated polish, mobile 375, ship evidence. Encodes studied packaged-judgment + UX priority rules as Tell principles (no external skill installs).
---

# agency-quality-site

Agencies bill weeks of process. This skill is that process as **ordered Cursor phases** with screenshot gates. It does **not** require Claude Code or third-party skill installs — Tell already owns packaged judgment, detectors, and proof.

**Parent:** `premium-content-custom-web`  
**Verify loop:** `gates-until-verified` + `tell-proof-verify` + `tell-recursive-improve`  
**Runner:** `pnpm agency:pipeline -- --brief <path>`

---

## Why the standard approach fails

"Build me a beautiful website" yields safe defaults: Inter display, violet gradients, three equal feature cards. Agency quality comes from **constraints + references + axis-isolated polish**, not vibes.

---

## Phase 0 — Load the design brain (required before code)

Read, in order:

1. This skill + `BRIEF.template.md`
2. `premium-content-custom-web` (lean codes, Taste Controls, non-negotiables)
3. `design-system-foundation`
4. `conversion-landing-craft` when there is a single offer / one CTA
5. `surface-recipe-map` shipping defaults
6. Ban list below (always on)

### Packaged judgment (from studied frontend-design principles — Tell-shaped)

- Ground every choice in the **subject's world** (materials, instruments, vernacular) — not a generic SaaS kit.
- Hero is a **thesis**, not a stats strip + gradient accent.
- Typography carries personality: deliberate display/body pair; type treatment is memorable.
- Structure encodes content truth (number markers only when order is real information).
- Motion is deliberate; one orchestrated moment beats scatter; less is often more.
- Spend boldness in **one signature**; keep surroundings quiet.
- Plan tokens (color 4–6 named roles, type 2+ roles, layout concept, signature) → self-critique for generic defaults → then build.
- Known AI clusters to avoid unless the brief asks: cream+#F4F1EA + terracotta serif; near-black + acid green/vermilion; broadsheet hairline dense columns as a lazy default.

### UX priority gates (from studied UI/UX ruleset principles — Tell-shaped)

Run priority 1→10 when reviewing; fail the phase if CRITICAL fails:

| Pri | Category | Must have | Avoid |
|---|---|---|---|
| 1 | Accessibility | Contrast ≥4.5:1, focus-visible, labels, heading hierarchy, reduced-motion | Removing focus rings |
| 2 | Touch | 44×44 targets, ≥8px gap, press feedback | Hover-only primary actions |
| 3 | Performance | Reserve image space, font-display, no CLS thrash | Layout-shifting presses |
| 4 | Style | Match product type, SVG icons, one primary CTA | Emoji as icons, mixed icon languages |
| 5 | Layout | Mobile-first, no horizontal scroll, spacing scale | Fixed px-only containers |
| 6 | Type/color | Base ≥16px, LH ~1.5, semantic tokens | Gray-on-gray, raw hex in components |
| 7 | Animation | 150–300ms, transform/opacity, meaning | Bounce everywhere, width/height anim |
| 8 | Forms | Visible labels, errors near fields | Placeholder-only labels |
| 9 | Nav | Predictable, one primary action per screen | Overloaded nav |
| 10 | Charts | Legends + non-color encodings | Color-only meaning |

### Default ban list (always merge with brief bans)

- Purple / violet gradients as the brand story
- Emoji as structural icons
- Inter (or system UI) as the **display** face
- Generic stock placeholders / empty media frames
- Centered-everything layouts
- Equal three-card feature grids as the default composition
- Shadow-everywhere elevation
- Cream paper + terracotta accent AI cluster
- Invented proof, fake logos, dead `href="#"`

Gate: `assertBasics` + `assertAgencyDelivery` on preview HTML.

---

## Phase 1 — Steal the direction (reference board)

Adjectives ("premium") do nothing. Screenshots do.

1. Search the niche (portfolio, SaaS landing, law firm, …) on public gallery / live sites.
2. Pick **exactly 3** references — more confuses the model.
3. For each: screenshot **hero**, **one content section**, **footer** (9 images ideal; minimum 3 full-page refs labeled `ref-1`…`ref-3`).
4. Save under `research/boards/<run-id>/` (gitignored). Record URLs only in `research/boards.local.json` (gitignored).
5. Direction line (mandatory):

> Match the typography scale, spacing rhythm, and motion of these references. Do not copy the layouts.

If live capture is blocked, fall back to measured corridors in `research/aggregate.json` for the matching category — still write a direction note; still do not clone a single measured page.

Also run measured forensics when URLs are available: `pnpm research:forensics` after updating `corpus.local.json`.

---

## Phase 2 — Constrained build (one message)

Paste all five blocks as one brief. Fill brackets from `BRIEF.template.md`.

Invoke:

```
Use agency-quality-site + premium-content-custom-web.

Audience: …
One CTA: …
References: research/boards/<run-id>/ …
Stack: @tell/design-skills preview HTML (default) …
Ban list: … + defaults from Phase 0

Match typography scale, spacing rhythm, and motion of the refs. Do not copy layouts.
Ground the signature in the subject's world.
```

Build via `designFromFeatures(brief)` (or `/studio` / `POST /api/design`). Expect ~70% — version 1 is not ship.

**Gate 2:** `assertBasics` + `assertAgencyDelivery` green; fold screenshot shows brand-first hero + one CTA; no ban-list hits. Max 3 fix retries.

---

## Phase 3 — Polish passes (the agency fee)

Run as **three separate passes**, then mobile. Asking for all at once fixes one axis well and two badly.

### Pass 3a — Typography only

> Review every heading and body size. Establish a strict type scale. Fix line-height and letter-spacing. Touch nothing else.

Gate: type ladder coherent; display ≠ body family; body ≥16px; LH in band; screenshot fold+section. Use `applyAgencyPolish(html, "typography")` then re-shot.

### Pass 3b — Spacing only

> Audit vertical rhythm section by section. Double the whitespace where sections feel cramped. Touch nothing else.

Gate: section rhythm uses spacing tokens; no cramped folds; screenshot scroll slices.

### Pass 3c — Motion only

> Add scroll-reveal and hover states. Subtle. 200–300ms. Nothing bounces.

Gate: `prefers-reduced-motion` respected; duration 150–300ms; transform/opacity only; `scroll-reveal-once` / `restrained-motion-micro` patterns; screenshot hover or reveal state if possible.

### Pass 3d — Mobile 375

> Show every page at 375px width and fix what breaks.

Gate: no horizontal scroll; stacked splits; 44px targets; fold+scroll shots at 375. Touch layout/responsive only.

Each pass: produce → screenshot → `assertAgencyDelivery` + eye → smallest fix → re-check (≤3). On fail after 3: stop with named blocker — never weaken the gate.

---

## Phase 4 — Ship evidence

1. `pnpm -F @tell/design-skills test` (and typecheck if packages changed)
2. Ledger at `research/boards/<run-id>/LEDGER.md` with phase pass/fail + shot paths
3. Copy craft-beat shots to `/opt/cursor/artifacts/screenshots/`
4. Deploy/preview via `tell-deploy` when publishing Tell surfaces; customer static hosts are brief-defined
5. Append one lesson to `research/LEARNINGS.md` if a miss was found

Never auto-apply to a customer repo. Human reviews diffs.

---

## Pre-delivery checklist (canonical for this skill)

Process:

- [ ] Phase 0 skills loaded; ban list merged
- [ ] Exactly 3 refs (or corridor fallback noted)
- [ ] Five-block brief locked
- [ ] Passes 3a→3d run **separately** with screenshots
- [ ] Tested at 375px; reduced-motion path checked

Visual / interaction:

- [ ] No emoji icons; SVG or none
- [ ] One primary CTA; repeated consistently
- [ ] Contrast ≥4.5:1; focus-visible present
- [ ] Motion 150–300ms; no bounce; reduced-motion safe
- [ ] Brand-first hero; signature grounded in subject
- [ ] Ban list clean

---

## Improving Tell proof

When this pipeline finds a repeatable miss:

1. Encode a gate in `assertAgencyDelivery` / `assertBasics` when deterministic
2. Prefer axis-isolated polish helpers in `@tell/design-skills` (`agency-polish.ts`)
3. Extend `tell-proof-verify` checklist with the failed phase id
4. Record pattern key in `research/LEARNINGS.md`
5. Do **not** vendor external skill databases into the repo

---

## Runner

```bash
# boards.local.json supplies optional reference URLs (gitignored)
pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/lensroom.json
pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/lensroom.json --skip-refs
```

Outputs: `research/boards/<run-id>/` HTML + PNG phases + `LEDGER.md`.
