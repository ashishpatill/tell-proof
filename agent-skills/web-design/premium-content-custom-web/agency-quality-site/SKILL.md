---
name: agency-quality-site
description: Phased agency-quality marketing-site pipeline for Cursor — ONE PHASE AT A TIME with Goal + Loop prompts. Each phase starts from the previous phase's passed artifacts and is iterated until gates+eye pass before advance. Never run the whole pipeline in one craft pass.
---

# agency-quality-site

Agencies bill for the polish stage because **quality compounds across isolated passes**. Running refs + build + type + spacing + motion + mobile in one shot fixes one axis and leaves the rest soft.

**Invariant:** one phase per agent turn (or per Goal→Loop cycle). Advance only with `--mark-pass` after eye + gates.

**Parent:** `premium-content-custom-web`  
**Verify:** `gates-until-verified` · `tell-proof-verify` · `tell-recursive-improve`  
**Runner:** `pnpm agency:pipeline -- --brief <path> --phase <id>`  
**Autonomous:** `pnpm agency:run -- --query "<requirement>"` (niche → brief → DIRECTION → refs → phase loop with auto `--mark-pass` → **automatic agency:learn** → design-data write-back)

---

## Hard rules

1. **Never craft `--all`.** One `--phase` at a time. (`AGENCY_ALLOW_ALL=1` is CI smoke only.)
2. **Each phase starts from `current.html` produced by the previous passed phase.**
3. **Goal prompt opens a phase. Loop prompt iterates until green.** Then `--mark-pass`. (`agency:run` auto-advances when deterministic gates are green.)
4. **Touch only that phase's axis.** Typography pass must not change spacing/motion; etc.
5. **Read the PNGs.** Score/gates ≠ quality. Cap **3 loop attempts** per phase, then stop with a named blocker.
6. Direction line always: *Match typography scale, spacing rhythm, and motion of the refs. Do not copy the layouts.*
7. **Learn is automatic** — every `agency:run` and every `--mark-pass 4-ship`. Do not schedule a separate learn step. Opt out only with `AGENCY_SKIP_LEARN=1`.
8. **Personal design-data** — `TELL_DESIGN_DATA` / `research/design-data.local.json` supplies seeds + memory + corridor bands (see `research/design-data.README.md`).

### Autonomous entry (`agency:run`)

```bash
pnpm agency:run -- --query "freelance photographer booking site" --fresh
pnpm agency:run -- --query "B2B SaaS demo landing" --product Acme --cta "Book a demo"
pnpm agency:run -- --brief scripts/agency-pipeline/briefs/lensroom.json --fresh
# Learn already ran. Optional re-learn:
pnpm agency:learn -- --run-id <id>
```

What it does:

1. Match niche preset (Tell `siteKind` / taste / lane / craft nodes) — no third-party hosts in committed maps.
2. Write brief JSON + `DIRECTION.md` (DESIGN_RIGOR fields) + `AUTO_PLAN.md`.
3. Select refs from personal design-data seeds (or `boards.seeds.local.json`) into `boards.local.json`; empty → corridor fallback using measured bands.
4. Run each phase → verify gates → retry ≤ `--max-attempts` (default 3) → `--mark-pass` → next.
5. **Automatic learn** → update engine memory + LEARNINGS → write-back to design-data if configured.
6. Artifacts under `research/boards/<run-id>/` (gitignored).

Copy `research/boards.seeds.local.example.json` → `boards.seeds.local.json` **or** put seeds in your design-data repo. Never commit award-site hosts into Tell.

### Phase order

`1-refs` → `2-build` → `3a-typography` → `3b-spacing` → `3c-motion` → `3d-mobile` → `4-ship`

```bash
pnpm agency:pipeline -- --brief scripts/agency-pipeline/briefs/lensroom.json --status
pnpm agency:pipeline -- --brief … --phase 1-refs
# … Goal → eye → Loop (≤3) → …
pnpm agency:pipeline -- --brief … --mark-pass 1-refs
pnpm agency:pipeline -- --brief … --phase next   # == current
```

State lives in `research/boards/<run-id>/STATE.json` (gitignored boards dir). Ledger: `PHASE_LEDGER.md`.

---

## Phase 0 — Load the design brain (before Phase 1)

Read once per run (not a `--phase`, but required):

1. This skill + `BRIEF.template.md` + `PROMPTS.md` + **`DESIGN_RIGOR.md`**
2. `premium-content-custom-web`, `design-system-foundation`, `conversion-landing-craft` (if one CTA)
3. Compositional lane crafts as needed: `agency-minimal-grid`, `nested-frame-craft`, `image-first-fold`, `editorial-chapter-craft`
4. Ban list: purple/violet gradients · emoji icons · Inter as display · stock placeholders · centered-everything · equal 3-card grids · shadow-everywhere · cream+terracotta default · dead `href="#"` · award claims · fake logo-wall theater

Packaged judgment: subject vernacular → hero thesis → deliberate type pair → one signature → plan then build.  
UX priorities: a11y → touch → performance → style → layout → type/color → motion → forms → nav.  
**Design rigor:** pick **one** compositional lane + **1–2** Tell craft nodes in `DIRECTION.md` before Phase 2 — never pile unrelated aesthetics.

---

## Phase 1 — `1-refs` (reference board)

### Goal prompt

```
Use agency-quality-site. Phase 1-refs ONLY.

Brief: <path to brief json>
Niche: <e.g. freelance photography booking>

GOAL: Capture exactly 3 reference sites (hero + mid + footer each). Write DIRECTION.md
using DESIGN_RIGOR.md fields: visual thesis, compositional lane, 1–2 craft nodes,
type / spacing / motion, signature. Do not copy layouts.

Run:
  pnpm agency:pipeline -- --brief <brief> --phase 1-refs

Then READ every ref-*-{hero,mid,footer}.png. Fill DIRECTION.md.
Do not start Phase 2 in this turn.
```

### Loop prompt

```
Phase 1-refs LOOP (attempt <n>/3).

What failed: <bot wall | wrong niche | too few frames | DIRECTION.md empty>
Fix: replace URL in research/boards.local.json OR recapture OR finish DIRECTION.md.
Re-run: pnpm agency:pipeline -- --brief <brief> --phase 1-refs
Stop when ≥6 frames exist AND DIRECTION.md has thesis + lane + craft nodes + type/spacing/motion/signature.
Then: pnpm agency:pipeline -- --brief <brief> --mark-pass 1-refs
```

**Pass bar:** ≥6 PNGs + completed `DIRECTION.md` (not a stub).

---

## Phase 2 — `2-build` (constrained first cut)

### Goal prompt

```
Use agency-quality-site + premium-content-custom-web. Phase 2-build ONLY.

Read: brief five blocks + research/boards/<run>/DIRECTION.md + DESIGN_RIGOR.md + ref screenshots.
GOAL: First working site from designFromFeatures. Expect ~70%. Lock Audience + One CTA + Ban list.
Execute the chosen lane/craft nodes. Honest assets. Hero = strongest authored moment.

Run:
  pnpm agency:pipeline -- --brief <brief> --phase 2-build

READ <phase>-fold.png and scroll slices against refs.
Do not polish type/spacing/motion yet. Do not open Phase 3a.
```

### Loop prompt

```
Phase 2-build LOOP (attempt <n>/3).

Eye misses vs DIRECTION.md: <list>
Change the SMALLEST content/layout/token fix in the brief or engine that addresses those misses.
Touch nothing that belongs to later polish axes unless it blocks the first cut.
Re-run --phase 2-build (or edit current.html then --phase 2-build --reshoot if supported).
Gates: assertBasics + assertAgencyDelivery.
When eye says "good enough first cut" AND gates green:
  pnpm agency:pipeline -- --brief <brief> --mark-pass 2-build
```

**Pass bar:** basics + delivery green; brand-first hero; one CTA visible; ban list clean; honest “70%” first cut.

---

## Phase 3a — `3a-typography` (type only)

### Goal prompt

```
Use agency-quality-site. Phase 3a-typography ONLY.

Start from current.html (passed Phase 2). Read DIRECTION.md type notes + ref heroes.
GOAL: Strict type scale, line-height, letter-spacing. Touch NOTHING except typography.

Run:
  pnpm agency:pipeline -- --brief <brief> --phase 3a-typography

READ new fold vs phase-2 fold. List type issues only.
```

### Loop prompt

```
Phase 3a-typography LOOP (attempt <n>/3).

Type issues from screenshots: <scale | LH | tracking | display/body pair | measure>
Edit current.html (or engine type tokens) for TYPE ONLY.
Re-shot: pnpm agency:pipeline -- --brief <brief> --phase 3a-typography --reshoot
Compare to previous attempt PNGs — type must improve; spacing/motion must not regress intentionally.
When type eye passes:
  pnpm agency:pipeline -- --brief <brief> --mark-pass 3a-typography
```

**Pass bar:** coherent ladder; display ≠ body; body ≥16px; LH readable; no Inter display.

---

## Phase 3b — `3b-spacing` (space only)

### Goal prompt

```
Use agency-quality-site. Phase 3b-spacing ONLY.

Start from current.html (passed 3a). Read DIRECTION.md spacing notes.
GOAL: Vertical rhythm — double whitespace where cramped. Touch NOTHING except spacing.

Run: pnpm agency:pipeline -- --brief <brief> --phase 3b-spacing
```

### Loop prompt

```
Phase 3b-spacing LOOP (attempt <n>/3).

Cramped / uneven sections: <ids>
Edit spacing tokens/margins/padding ONLY. Re-shot with --reshoot.
When rhythm eye passes: --mark-pass 3b-spacing
```

---

## Phase 3c — `3c-motion` (motion only)

### Goal prompt

```
Use agency-quality-site. Phase 3c-motion ONLY.

Start from current.html (passed 3b).
GOAL: Scroll-reveal + hover. Subtle. 200–300ms. Nothing bounces. prefers-reduced-motion safe.
Touch NOTHING except motion.

Run: pnpm agency:pipeline -- --brief <brief> --phase 3c-motion
```

### Loop prompt

```
Phase 3c-motion LOOP (attempt <n>/3).

Motion issues: <too much | missing hover | blocking | no reduced-motion>
Fix motion ONLY. --reshoot. When eye passes: --mark-pass 3c-motion
```

---

## Phase 3d — `3d-mobile` (375 only)

### Goal prompt

```
Use agency-quality-site. Phase 3d-mobile ONLY.

Start from current.html (passed 3c).
GOAL: Every page at 375px — fix what breaks. Touch ONLY responsive/layout breaks.

Run: pnpm agency:pipeline -- --brief <brief> --phase 3d-mobile
```

### Loop prompt

```
Phase 3d-mobile LOOP (attempt <n>/3).

Breaks at 375: <overflow | stack | tap targets | clipped type>
Fix responsive ONLY. --reshoot. When eye passes: --mark-pass 3d-mobile
```

---

## Phase 4 — `4-ship`

### Goal prompt

```
Use agency-quality-site. Phase 4-ship ONLY.

GOAL: Bundle SHIP.html, run pnpm exec vitest run packages/design-skills,
copy craft-beat shots to /opt/cursor/artifacts/screenshots/, append LEARNINGS if a miss was found.

Run: pnpm agency:pipeline -- --brief <brief> --phase 4-ship
```

### Loop prompt

```
Phase 4-ship LOOP.
If tests fail or evidence missing, fix and re-run Phase 4 only.
When green: --mark-pass 4-ship. Stop. Do not reopen earlier axes unless a regression was proven.
```

---

## Agent orchestration (no hand-holding)

Paste this as the **session opener** for a full run — the agent still executes **one phase per cycle**:

```
Use agency-quality-site.

Brief: scripts/agency-pipeline/briefs/<id>.json

Orchestration:
1. --status
2. For current phase: paste that phase's Goal prompt; run --phase <current>
3. Read screenshots; paste Loop prompt; improve; --reshoot; repeat ≤3
4. --mark-pass <current>
5. Go to step 1 until current is past 4-ship (all passed)
6. Never combine phases. Never --all for craft.
```

---

## Improving Tell proof

Repeatable misses → **automatic** `agency-run-learn` → `assertAgencyDelivery` / `assertBasics` / axis polish helpers → `tell-proof-verify` checklist → `research/LEARNINGS.md` + `research/agency-engine-memory.json` (+ design-data write-back). Do not vendor external skill DBs.
