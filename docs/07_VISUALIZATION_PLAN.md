# Tell — Interactive Visualization Plan

> **Separate plan** for illustration-first, book-like educational and blog surfaces.
> Complements the `explainer` / Visual textbook art direction. Does **not** replace
> `PLAN.md` (product remaining work) or `BUILD.md` (engineering contracts).
>
> **Attribution rule:** This document describes principles, patterns, and implementation
> requirements only. Do not name external authors, sites, brands, tools-as-products, or
> third-party projects in code, copy, comments, commits, or docs when referring to this style.

**Status:** Planned (not started) · **Audience:** redesign, taste, UI, fixture agents · **Related:** `packages/redesign` directions (`explainer`), `docs/01_DESIGN_SYSTEM.md`, `docs/05_GENERICNESS_METHODOLOGY.md`

---

## 0. Purpose

Educational and long-form blog products fail the “generic AI UI” test differently from SaaS dashboards. Their tells are usually:

- Marketing chrome around what should be a quiet reading surface
- Decorative cards, pill clusters, and hero gradients competing with diagrams
- Illustrations treated as stock decoration rather than the primary explanation
- Interactive widgets that look like product UI, not like instruments of understanding

This plan defines how Tell should **recognize, art-direct, and (later) propose** visualization-first educational surfaces: calm prose + precise diagrams + restrained interactivity, integrated as one composition.

### In scope

1. Design principles and UX patterns for visual-textbook surfaces
2. A fidelity ladder for static → interactive diagrams
3. Craft workflow (research → static clarity → selective interaction)
4. Visual language tokens that keep diagrams consistent with surrounding prose
5. **Reusable visualization instruments** (color-space, wireframe, palette grids, voxel/convolution) and the process of building tools instead of one-off drawings
6. Illustration pipeline / tech stack for vector-first production
7. Engineering milestones to ship detector support, redesign recipes, and optional diagram primitives
8. Quality bar, accessibility, performance, and demo safety

### Out of scope (for this plan)

- Auto-applying patches to user repos
- LLM calls inside `packages/core`
- Building a full physics/WebGL authoring product in the sprint MVP
- Replacing Tell’s own print-atelier identity (Tell Report stays on `docs/01_DESIGN_SYSTEM.md`)
- Shipping a public plugin marketplace or naming external design hosts in-repo

---

## 1. Product framing (Priya lens)

When Priya’s site is an educational product, docs site, or technical blog:

1. **Capture** the rendered article/page (not just a marketing landing shell).
2. **Diagnose** chrome noise, weak reading column, illustration starvation, and “widgety” controls.
3. **Art-direct** toward Visual textbook (`explainer`) — book column, monochrome restraint, illustration-first rhythm.
4. **Propose** measurable token + layout diffs; optionally propose diagram treatment notes (labels, contrast, chrome reduction).
5. **Human applies** in Cursor. Never auto-apply.

Success for this plan: a captured educational page can be steered into a surface where **diagrams teach faster than prose alone**, and the interactive layer feels like the same voice as the writing.

---

## 2. Core design principles

These principles are normative for any Visual textbook redesign and for any future diagram components Tell ships or recommends.

### 2.1 Book-like reading experience

| Requirement | Spec |
|---|---|
| Column | Single primary reading column, ~60–75 characters (~640–720px content max) |
| Hierarchy | Chapter / section modularity; consistent heading ladder |
| Chrome | Near-zero nav clutter, sidebars, sticky marketing bars, floating CTAs |
| Scroll | Continuous prose flow; diagrams interrupt as intentional pauses, not as card galleries |
| Feel | Closer to a technical book than a landing page |

### 2.2 Illustration-first hierarchy

- Custom diagrams and figures carry most explanatory weight.
- Prose supports the visual: introduce → show → name the parts → deepen.
- A diagram appears exactly where understanding requires it — not batched in a “gallery” section.
- If a paragraph restates what a clear figure already shows, cut the paragraph first.

### 2.3 Monochrome / limited palette

| Layer | Rule |
|---|---|
| Page paper | Cool near-white or near-black; avoid warm-cream + terracotta defaults that read as generic AI editorial |
| Text | High-contrast ink; muted secondary for captions |
| Accent | One restrained signal hue for links, callouts, and diagram highlights — never a rainbow legend |
| Diagram color | Color appears inside figures when it encodes meaning; page chrome stays quiet so figures pop |
| Depth | Prefer hairlines and spacing over shadows and cards |

### 2.4 Generous whitespace + deliberate rhythm

Canonical vertical rhythm:

```
text block
  → full-width or carefully framed figure
  → text block
  → figure (optional progressive disclosure)
  → text block
```

- Section padding large enough that each figure “resets” attention (~96–128px vertical section rhythm on desktop).
- Do not pack multiple competing diagrams in one viewport without a narrative reason.
- Diagrams are pauses, not decorations between marketing modules.

### 2.5 Typography excellence

| Role | Guidance |
|---|---|
| Display | Quiet, readable serif or highly readable sans; optical size when available |
| Body | Clean humanist/grotesk sans; comfortable measure; line-height ~1.55–1.7 |
| Mono | Labels, indices, figure codes, parameter readouts |
| Hierarchy | Strong but calm; avoid display sizes that overpower figures |
| Contrast | WCAG AA minimum for body; AAA preferred for long-form |

Preset pairing already encoded in redesign `explainer`: Source Serif 4 + Source Sans 3 + IBM Plex Mono.

### 2.6 Minimal chrome

- Almost no decorative UI around diagrams.
- Controls (sliders, toggles, drag handles) are sparse, labeled, and purposeful.
- No pill clusters, stat strips, icon rows, or “feature card” frames around explainers.
- Prefer native-feeling minimal controls that inherit page tokens.

### 2.7 Responsive but desktop-optimized

| Viewport | Expectation |
|---|---|
| Desktop (≥1200) | Primary craft surface; diagram detail and hover affordances |
| Tablet | Stack figures; preserve label readability; simplify multi-panel layouts |
| Mobile | Single-column stack; larger hit targets; progressive disclosure over dense simultaneous labels; never require hover |

### 2.8 Subtle polish

Allowed: smooth scrolling, careful image/SVG loading, light hover states, simple toggles, drag-to-scrub parameters.

Forbidden as default: particle fireworks, gratuitous parallax, autoplaying spectacle, “wow” motion that does not teach.

Motion must respect `prefers-reduced-motion`: freeze to the clearest static frame; keep controls usable.

---

## 3. Key UI/UX patterns

### 3.1 Figure placement

1. **In-column figures** — width = reading column; captions below; used for small schematics.
2. **Breakout figures** — wider than text (up to content shell), still optically centered on the column; used for systems diagrams.
3. **Full-bleed figures** — rare; only when spatial scale is the lesson (maps, large assemblies). Never as hero marketing wallpaper.

### 3.2 Chapter / section structure

```
H1 article title
lede (1–3 sentences)
── figure 0: overview (optional)
H2 section
prose
figure
prose
H2 section
…
```

- Numbered chapters or small-caps eyebrows are acceptable if quiet.
- Each section has **one job**, one headline, usually one short supporting sentence before the figure.

### 3.3 Information density without clutter

Inside diagrams:

- Prefer labeled parts over separate legends when space allows.
- Use progressive disclosure: start with the skeleton, reveal layers via toggle or scroll-linked steps.
- Callouts: short, same voice as prose, same type tokens.
- Show simplifications explicitly in caption (“2-D cross-section”, “friction neglected”).

### 3.4 Interaction patterns (only when they add understanding)

| Pattern | When to use | When not to |
|---|---|---|
| Parameter scrub (slider / drag) | Continuous variables (ratio, angle, focal length metaphor, timing) | Binary facts better stated in a sentence |
| Viewpoint drag | 3-D spatial relationships | Flat schematics that are clearer static |
| Step toggle / tabs | Discrete modes or historical states | More than ~5 steps without a narrative spine |
| Hover highlight | Part identification on dense figures | Mobile-primary lessons; critical path info |
| Play / pause | Time-based processes | Loops that distract from reading |

**Cap:** 1–3 meaningful interactive parameters per figure. More usually means the static design is unclear.

### 3.5 Accessibility basics

- Semantic article structure (`article`, `section`, headings in order).
- Captions via `<figcaption>` or equivalent; alt text that states the teaching point, not “diagram”.
- Contrast ≥ 4.5:1 for text; diagram strokes thick enough for low-vision (generally ≥ 1.5px at 1x).
- Keyboard access to all interactive parameters; visible focus.
- Live regions only when value changes are essential; do not spam announcements while scrubbing.
- Do not encode essential meaning in color alone; pair with labels, pattern, or value readouts.

---

## 4. Coherence: visualization as extension of prose

Interactive or static figures must inherit the page system. Treat them as **instruments of the article**, not embedded mini-apps.

| Dimension | Rule |
|---|---|
| Color | Same paper/ink/accent tokens; diagram palette is a disciplined subset |
| Type | Same body/display/mono families and sizes for labels |
| Stroke | Shared stroke weights and corner radii across an article’s figure family |
| Spacing | Label padding and callout gaps on the same spacing scale as prose |
| Voice | Labels and captions use the same calm, precise diction as body copy |
| Chrome | Figure controls use the page’s button/link language (outline, soft underline) — not a second design system |
| Restraint | Interaction only when it accelerates understanding |

**Tone checklist (pass/fail):** If the figure were replaced by a screenshot from an unrelated dashboard widget, would a reader notice a style break? If yes, restyle until no.

---

