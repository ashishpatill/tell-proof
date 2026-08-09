# Tell — Motion & Animation Capability Plan

> **Research → product plan.**  
> **Survey (named experts + stacks):** [`research/MOTION_ANIMATION_SURVEY.md`](../research/MOTION_ANIMATION_SURVEY.md)  
> **Measured corridors:** [`docs/10_DESIGN_EVIDENCE.md`](./10_DESIGN_EVIDENCE.md) (anonymised)  
> **Local URL seeds (gitignored):** `research/motion-corpus.local.json` · example: `research/motion-corpus.local.example.json`
>
> Related: `docs/08`, `docs/09`, agency `3c-motion`, `scroll-reveal-once`, `restrained-motion-micro`.  
> Does **not** replace `PLAN.md` / `BUILD.md`.

**Status:** Research plan · **Audience:** engine + template + agency craft  
**Constraint:** Committed files stay anonymised for reference *sites*; this plan names
capabilities and stack *categories*. Named people/libraries live in the survey.

---

## 0. Problem statement

Tell templates score well on **motion restraint** and **motion speed** in
`research/critique.json`, yet feel massively under-animated. That is not a contradiction:

- Current metrics only ask “how many elements transition?” and “how long?”
- Premium sites win on **choreography**: hero entrance, staggered section enters,
  scroll-linked chapters, intentional micro-feedback, authored product motion.
- Engine ceiling today: `subtle-micro` CSS + optional `light-scroll-reveals` (IntersectionObserver
  opacity + 0.5rem translate). Agency Phase `3c-motion` asks for roughly that same ceiling.

Ashish’s demo needs pages where removing motion would be *noticed* — without sliding into
generic AI spectacle (blur reveals, bounce, purple glow, infinite loops).

---

## 1. Principles (non-negotiable)

1. **Narrative role or delete.** Every motion beat answers a job (guide eye, confirm input,
   chapter a story). Decorative loops stay banned by default.
2. **Restraint band stays.** Stay inside corpus transition coverage (~2–15%) and
   duration (~150–300ms median). Raise *quality* of beats, not count of transitions.
3. **One motion system per page.** No dual smooth-scroll engines; no competing libraries
   animating the same property.
4. **Static-first.** First paint and `prefers-reduced-motion: reduce` show final, readable states.
5. **Native before heavy.** Prefer CSS scroll-driven + View Transitions before timeline engines;
   timeline engines before WebGL.
6. **Measure presence.** Extend forensics/critique so “in band but lifeless” fails a gate.
7. **Anonymised corpus.** Study named experts via the survey; measure only through local URLs →
   `ref-*` measurements.

---

## 2. Capability ladder (MotionLevel expansion)

| Level | Intent | Default tech | Site kinds |
|---|---|---|---|
| `none` | Print-like / docs density | — | docs, legal |
| `subtle-micro` | Hover/focus/press only | CSS tokens | product shells, forms |
| `light-scroll-reveals` | Once-only section enter | CSS `view()` timeline + IO fallback | marketing, editorial |
| `scroll-narrative` *(new)* | Pinned/scrub chapters, stagger, hero entrance | CSS + optional timeline engine (GSAP-class) + optional Lenis-class smooth scroll | brand, studio, campaign |
| `immersive` *(new, gated)* | Metaphor WebGL / shader hero | Above + WebGL thin wrapper | portfolio / campaign only when brief flags |

Schema change lives in `@tell/design-skills` (+ MCP enum if exposed). Default for most templates
remains `light-scroll-reveals` or `subtle-micro`; `scroll-narrative` is opt-in per lean/siteKind.

---

## 3. Motion grammar to encode in the engine

Ship as craft nodes + render helpers (names are Tell-internal):

| Node / beat | Behaviour | Reduced-motion |
|---|---|---|
| `hero-entrance-once` | Orchestrate brand → headline → support → CTA (stagger ≤80ms) | Instant finals |
| `section-stagger-enter` | Children opacity + ≤0.5rem Y; once; threshold ~0.08 | Instant finals |
| `scroll-chapter-pin` | One pinned chapter with scrubbed progress (narrative tier) | Static chapter layout |
| `micro-feedback-interactive` | Hover/focus/active on controls only | Opacity/color only ≤120ms or none |
| `route-view-transition` | Named VT where supported (app/studio) | Hard cut |
| `authored-motion-slot` | Optional Rive/Lottie mount point for product proof | Poster frame |
| `webgl-metaphor-gate` | Only if brief `immersive`; pause offscreen | Still image fallback |

Forbidden defaults (unchanged): blur spectacle, bounce easings, infinite ambient loops,
autoplaying competing video, multi-library scroll hijacks.

---

## 4. Stack policy for Tell

| Surface | Allowed | Default |
|---|---|---|
| Generated marketing HTML (`packages/design-skills` render) | CSS tokens, CSS scroll-driven, small IO fallback; optional timeline engine behind `scroll-narrative` | CSS-native + IO |
| Agency pipeline Phase `3c-motion` | Same as templates; may inject timeline engine when brief asks narrative | CSS-native |
| `apps/web` React UI | CSS tokens + React motion library for layout/exit; View Transitions for routes | CSS + React motion where needed |
| Product-proof / studio demos | Authored vector runtime slot | Off unless brief |
| WebGL | Explicit immersive flag only | Off |

Bundle rule: marketing templates must not import a React motion library. Keep HTML path dependency-light.

---

## 5. Workstreams

### W0 — Research (this delivery)

- [x] Survey experts + 2026 stacks → `research/MOTION_ANIMATION_SURVEY.md`
- [x] Product plan → this doc
- [x] Example local corpus seed file
- [x] Operator fills `motion-corpus.local.json` and runs forensics *(local seed present; measure when ready)*

### W1 — Corpus + metrics

- [x] Critique dimensions `motion-presence` + `motion-choreography` (+ forensics choreography markers)
- [ ] Widen measured motion-heavy refs via local corpus forensics pass

### W2 — Schema + skills

- [x] Expand `MotionLevel` zod enum; wire MCP + Studio taste controls
- [x] Rewrite motion sub-skills; add `scroll-narrative-craft`
- [x] Add `motion-stack-craft` skill (Three.js / D3 / GSAP-class / free OSS templates → project-custom instruments)
- [x] Upgrade agency Phase `3c-motion` Goal/Loop

### W3 — CSS-native template upgrade (highest ROI)

- [x] Emit `@supports (animation-timeline: view())` reveals
- [x] Stagger via `--m-stagger` / `--enter-i`
- [x] Hero entrance once (`ds-enter`)
- [x] Per–siteKind signature keyframes + product instruments (stroke-draw, lattice bars, flow meters, immersive field)
- [x] Verify `prefers-reduced-motion` + no-JS paths

### W4 — Narrative tier (optional dependency)

- [x] CSS sticky chapter + progress (no heavy deps) for `scroll-narrative` / `immersive`
- [ ] Optional GSAP/Lenis only if CSS chapter proves insufficient

### W5 — Authored + immersive (gated)

- [x] `authored-motion-slot` empty poster for `immersive`
- [ ] Runtime Rive/Lottie mount + WebGL gate

### W6 — Dogfood

- [ ] Tell Report route transitions (apps/web)
- [ ] `tell-dogfood-audit` after motion ship

---

## 6. Agency Phase `3c-motion` contract (target)

**Goal (replace thin prompt):**

> One motion system. Hero entrance once. Section stagger enters (opacity + small translate only).
> Interactive micro-feedback on controls. Optional one scroll chapter if brief is narrative.
> Durations inside 150–300ms micro / ≤800ms entrance sequence. No bounce, blur, or loops.
> `prefers-reduced-motion` → finals immediately. Static first frame reads complete.

**Pass criteria:**

- Removing JS still leaves a complete page.
- Reduced-motion path verified in screenshot matrix.
- Eye test: at least two beats a reader would miss if deleted.
- Restraint metrics still in band.

---

## 7. Success definition

| Signal | Target |
|---|---|
| Qualitative “missable motion” | Pass on all marketing templates at `light-scroll-reveals+` |
| Critique `motion-presence` | In band once metric exists |
| Critique restraint/speed | Remain ≥ current (no spray) |
| Agency 3c | New contract; ≤3 loop attempts typical |
| Immersive | Never default-on |

---

## 8. Out of scope

- Shipping award-clone layouts or naming third parties in engine output
- Making WebGL the default hero for SaaS templates
- Auto-applying motion patches via MCP
- Replacing Tell’s deterministic core with an animation CDN

---

## 9. Suggested implementation order

```text
W1 metrics/corpus → W2 schema/skills/3c contract → W3 CSS-native renders
  → re-critique → W4 narrative flag → W5 gated slots → W6 dogfood
```

Stop after W3 if narrative tier is not needed for the demo cut line; W3 alone should
materially fix “templates feel static” for most site kinds.
