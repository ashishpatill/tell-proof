---
name: motion-stack-craft
description: >-
  Learn and apply Three.js, D3.js, GSAP-class timelines, free OSS motion templates,
  and native CSS/WAAPI motion — customized to each project's features and siteKind.
  Wired in @tell/design-skills as SkillNodeId motion-stack-craft.
---

# motion-stack-craft

> **Job:** Build a *project-true* motion system. Study stacks and free OSS motion
> templates as craft sources — then re-author beats from the product brief.
> Never ship a kit, CodePen, or award clone unchanged.

## Non-negotiables (Tell)

1. **Narrative role or delete** — every beat guides eye, confirms input, or chapters a story.
2. **Restraint band** — ~2–15% transition coverage; micro ~150–300ms; entrances ≤~800ms.
3. **One motion system per page** — no dual smooth-scroll; no two libraries animating the same property.
4. **Static-first** — first paint + `prefers-reduced-motion: reduce` show final readable states.
5. **Native before heavy** — CSS scroll-driven / View Transitions → timeline engine → D3/SVG → Three/WebGL.
6. **Feature-true** — instruments derive from declared features / siteKind grammar (scrub, lattice, loom, ledger…), not generic “wow”.
7. **Never auto-apply** — patches/HTML stay reviewable; human or Cursor agent applies.

## When this skill routes

- Engine: `@tell/design-skills` adds `motion-stack-craft` whenever Taste `motion` is not `none`.
- Agents: invoke for any template polish, agency Phase `3c-motion`, immersive briefs, data-viz pages, or when cloning OSS motion demos into a client project.

## Stack decision tree (learn → choose → customize)

| Product need | Prefer | Skip when |
|---|---|---|
| Hover / focus / press | CSS tokens (`--m-*`) | — |
| Once-only section enter | CSS `animation-timeline: view()` + IO fallback; siteKind `@keyframes` signatures | Blur / bounce / replay-on-scroll |
| Pinned chapter / scrub progress | CSS sticky + progress; optional **GSAP** ScrollTrigger if CSS fails | Dashboard / docs density |
| React layout / exit / gesture | **Motion** (ex-Framer Motion) on `apps/web` only | Marketing HTML templates |
| Smooth inertia scroll | **Lenis** (~3 KB) with one timeline partner | Product apps, dashboards |
| Framework-agnostic timeline / SVG morph | **Anime.js** *or* GSAP — pick one | Already on the other |
| Data series, axes, joins, enter/update/exit | **D3** (or vanilla SVG + D3 *patterns*: scales, path generators, stroke-draw) | Decorating non-data UI |
| Interactive vector state machines | **Rive** (or Lottie/DotLottie for one-shot) | CSS can draw it |
| Spatial / shader / physical metaphor | **Three.js** + R3F + Drei | No metaphor + short dwell; never default SaaS hero |
| Free OSS motion templates (Codrops-class, open demos) | Study structure → rebuild with product tokens, content, reduced-motion | Copy-paste as system of record |

### Three.js (learn as craft)

**Use when:** the *product metaphor* is spatial (path field, instrument desk depth, lantern atlas) and dwell time rewards cost.

**Tell shipping defaults:**

- Marketing HTML: **no Three CDN by default**. Prefer canvas2d / SVG approximation (`data-motion-instrument="field"`) behind `immersive`.
- Mount real Three/R3F only when brief sets immersive + explicit 3D flag; always ship a still poster / first-frame SVG.
- Pause render loops when offscreen; tear down on `prefers-reduced-motion`.
- One metaphor mesh/group — not a second competing particle wallpaper.

**Customize:** materials/colors from `--c-*` tokens; camera move tells the product story (waypoint, clearing, signal), not a generic orbit.

### D3.js (learn as craft)

**Use when:** the page argues with *data* (series, lattice amplitudes, ledger cutoffs, calibration tolerances).

**Tell shipping defaults:**

- Templates: **vanilla SVG** with D3 *patterns* — `pathLength` stroke-draw (`.ds-draw`), scaleY bar enter (`.ds-lattice-bar`), scrubbed nodes — no D3 bundle in marketing HTML.
- Full D3 allowed in product apps / research tools when joins and scales earn the dependency.
- Enter/update/exit mental model maps to once-only reveal + interactive scrub — not infinite ambient morphs.

**Customize:** series from brief features/metrics; labels from product language; accent only on the claim the section makes.

### Free OSS motion templates (learn as craft)

Treat open demos as **technique schools**, not drop-ins:

1. Name the *job* of the demo (mask wipe, path draw, stagger grid, scroll chapter).
2. Strip brand chrome, fonts, and purple/glow defaults.
3. Re-time into Tell restraint band; kill loops unless the reader controls them.
4. Bind content to **this** product’s features / siteKind instrument (flow, scrub, lattice, loom, press snap…).
5. Verify reduced-motion + no-JS finals.

Banned as defaults: blur spectacle kits, bounce easings, emoji confetti, multi-library scroll hijacks, award-clone layouts in engine output.

## Per–siteKind instrument map (engine + agent)

Customize the *instrument*, not a shared fade:

| siteKind | Thoughtful effect (product-shaped) | Stack lean |
|---|---|---|
| `saas-marketing` | Feature flow stage meters + connector draw on enter | CSS + SVG draw |
| `dashboard-webapp` | Micro chip/nav only — no scroll spectacle | CSS |
| `corporate-story` | Slow chapter rise; governance beats settle | CSS narrative |
| `docs-educational` | Scrub sequence + step stem draw | CSS + scrub JS |
| `fintech-marketing` | Wire/series stroke-draw; metric scale settle | SVG draw (D3 pattern) |
| `art-directed-studio` | Tall pin chapter + long entrance | CSS narrative |
| `consumer-craft` | Alternating lateral enters | CSS |
| `editorial-foundry` | Mask wipe (type ladder reveal) | CSS clip-path |
| `research-dossier` | Folio lateral enter + vertical chapter ink | CSS |
| `signal-observatory` | Lattice bar enter (instrument desk) | SVG / D3 pattern |
| `archive-index` | Index row lateral nudge | CSS |
| `commerce-loom` | Weft settle + shuttle (reader metaphor) | CSS |
| `field-guide` | Lid lift / peel once | CSS |
| `press-atelier` | Press snap settle | CSS |
| `lantern-path` | Waypoint handoff + immersive field slot | CSS + canvas/Three gate |

## Engine hooks (`packages/design-skills`)

- Skill id: `motion-stack-craft`
- Signatures: `motionSignatureCss(siteKind)` — unique `@keyframes` per offering
- Instruments: `.ds-draw`, `.ds-lattice-bar`, `[data-motion-instrument]`, immersive field canvas
- Scripts: pathLength stroke-draw arming; observatory bar stagger; lantern field (canvas2d fallback)
- Related nodes: `scroll-reveal-once`, `hero-entrance-once`, `section-stagger-enter`, `scroll-narrative-craft`, `authored-motion-slot`, `scrub-sequence-craft`

## Agent checklist (project customization)

1. Read brief features + siteKind + MotionLevel.
2. Pick **one** primary instrument from the map (or invent a feature-true variant).
3. Choose stack layer from the decision tree — native first.
4. If studying an OSS template: extract job only; rebuild with tokens + content.
5. If Three or D3: justify metaphor/data; ship static fallback.
6. Verify: no-JS complete, reduced-motion finals, restraint band, missable beats ≥2.
7. Do not paste kit CSS/JS into the engine without Tell-shaped rewrite.

## Avoid

- One shared fade for every template
- Infinite ambient loops as “personality”
- Three.js tourism on SaaS demos
- D3 on non-data decoration
- Naming third-party brands in runtime keywords / committed corpus measurements
- Importing React Motion into generated marketing HTML

## Related

- `scroll-reveal-once` · `scroll-narrative-craft` · `restrained-motion-micro`
- `scrub-sequence-craft` · `ambient-atmosphere-craft`
- `docs/15_MOTION_ANIMATION_PLAN.md`
- `research/MOTION_ANIMATION_SURVEY.md`
- `docs/09_PREMIUM_DESIGN_SKILLS.md`
