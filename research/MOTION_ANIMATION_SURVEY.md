# Motion & Animation Survey for Premium Websites and Web Apps

> **Status:** Research survey (v1) · **Date:** 2026-08-09  
> **Purpose:** Catalog expert practitioners, studios, learning hubs, and the 2026 production
> tech stack for world-class web motion — then map the gap against Tell's template engine.  
> **Companion product plan:** [`docs/15_MOTION_ANIMATION_PLAN.md`](../docs/15_MOTION_ANIMATION_PLAN.md)  
> **Note:** This survey deliberately names people, studios, libraries, and hosts. Product-facing
> Tell docs and the measured corpus (`docs/10`, `research/measurements/`) stay anonymised;
> seed URLs for measurement live only in gitignored `research/motion-corpus.local.json`.

---

## 0. How this survey was conducted

**Question.** What motion craft, practitioners, and technology stacks produce websites and web
apps that feel intentionally animated — not template-static — while remaining performant and
accessible in 2026?

**Method.** Secondary research across:

1. Award indices and Agency/Site of the Year (2024–2026)
2. Studio portfolios known for scroll narratives, WebGL, and motion systems
3. Practitioner comparisons of animation libraries (GSAP, Motion, Anime.js, Lenis, Rive, Three.js)
4. Native platform docs (CSS scroll-driven animations, View Transitions API, WAAPI)
5. Tell-internal evidence: `docs/10_DESIGN_EVIDENCE.md` motion bands + current
   `MotionLevel` / agency Phase `3c-motion` behaviour

**Limitation.** This is a craft + stack survey, not a forensics loop. Named sites should be
added to the local motion corpus and measured before engine defaults change.

---

## 1. Executive findings

| Finding | Implication for Tell |
|---|---|
| **Best sites use a layered stack, not one library.** Native CSS for cheap FX; a timeline engine for choreography; a React motion lib for app UI; authored formats for character/product motion; WebGL only when the metaphor needs it. | Templates today are stuck at CSS hover + IntersectionObserver fade. Expand the motion ladder, not just timing tokens. |
| **GSAP became free for commercial use (Apr 2025), including ScrollTrigger / SplitText / MorphSVG.** Timeline + scroll narrative is no longer gated. | Optional `scroll-narrative` motion tier can use GSAP without a license story. |
| **Motion (ex-Framer Motion) remains the React UI default** (~tens of millions weekly downloads). | Tell Report / Studio React surfaces should prefer Motion for layout/exit/gesture; marketing HTML templates should not pull it by default. |
| **Lenis is the de facto smooth-scroll companion** to ScrollTrigger (~3 KB). | One smooth-scroll engine only (see agency DESIGN_RIGOR). Pair with GSAP or skip entirely for product UIs. |
| **CSS scroll-driven animations + View Transitions** now cover a large share of “scroll reveal” and page morph without JS — compositor-thread, zero bundle. | First upgrade for templates: replace / augment IO reveals with `@supports (animation-timeline: view())` progressive enhancement. |
| **Rive beats Lottie when the animation must think** (state machines, hover/drag branches). Lottie/DotLottie remains fine for one-shot authored loops. | Product-proof and onboarding mascots should slot Rive; marketing flourishes can stay Lottie/CSS. |
| **Three.js / React Three Fiber is justified rarely.** Top immersive studios themselves talk clients *out* of full 3D unless story + dwell time reward the cost. | Keep WebGL behind an explicit brief flag; static-first frame must still read. |
| **Tell’s critique scores motion as perfect while pages feel lifeless.** `motion-restraint` / `motion-speed` only measure CSS transition share and duration. | Add presence / choreography metrics (stagger, scroll-linked, pinned chapters, keyframe narrative count) or qualitative gates will keep passing dull pages. |
| **Agency Phase `3c-motion` goal is under-specified** (“scroll-reveal + hover, 200–300ms”). | That ceiling matches today’s templates. Raise the phase contract to a full motion system (hero entrance, section choreography, micro-feedback, reduced-motion finals). |

---

## 2. Expert studios (study their *systems*, measure anonymously)

Use these as **motion reference sources**. Clone craft into Tell-shaped tokens and skills; put
URLs only in `research/motion-corpus.local.json`; committed measurements stay `ref-NNN`.

### 2.1 Award-leading digital production

| Studio | Why they matter for motion | What to study (principles) |
|---|---|---|
| **Immersive Garden** (Paris) | Awwwards Agency of the Year 2025; repeated SotD/SotM for scroll-led brand experiences | Chaptered scroll, pinned narrative beats, type + image choreography as one system |
| **Locomotive** (Montréal) | Awwwards Agency of the Year 2024; originators of widely imitated smooth-scroll patterns | Restraint inside immersion; freshness without gimmick stacks |
| **Active Theory** | Long-running SotY/SotM presence; product-grade WebGL + interaction | Performance budgets on ambitious motion; app-like feel on marketing surfaces |
| **OFF+BRAND.** | Awwwards Site of the Year 2025 (Lando Norris) | High-energy brand motion that still reads as a product platform |
| **Lusion** (Bristol) | SotY-class studio site; Codrops case studies on ambitious interactive + 3D | When 3D *is* the story; R&D → shipping craft transfer |

### 2.2 Motion-led / brand-motion studios

| Studio | Focus | What to steal (abstractly) |
|---|---|---|
| **Stōkt** | Motion-led brand systems unifying identity + web + motion | One motion language across brand assets and site |
| **Fantik Studio** | Interactive WebGL / shader marketing for SaaS & AI | 3D as product metaphor, not wallpaper |
| **Crispwave Studio** | Immersive WebGL + “motion-first UI” systems | Timing curves as tokens; reduced-motion as first-class; talking clients out of unnecessary 3D |
| **Fern** (Atlanta / Tokyo) | Animation & motion design (brand films + systems) | Illustration/motion systems that scale beyond a single hero |
| **Better Off® Studio** | Archive / capsule interactive work (Codrops case study 2026) | Historical craft packaged as navigable motion |

### 2.3 Individual practitioners worth following

| Person / role | Relevance |
|---|---|
| **Jesper Landberg** — creative developer / design engineer; Awwwards Independent of the Year (2022, 2024) | Solo-bar motion craft; portfolio-grade interaction without studio headcount |
| **Bramus Van Damme** — CSS / Chrome DevRel educator | Canonical teaching for CSS scroll-driven animations (JSHeroes 2025, Chrome docs) |
| Codrops / Tympanus editors + guest creative developers | Tutorial + case-study pipeline for reproducible techniques |

### 2.4 Learning & index hubs (not “styles to copy”)

| Hub | Use |
|---|---|
| Awwwards / FWA / CSS Design Awards / Orpetron | Discover candidates for the local motion corpus |
| Codrops (tutorials + Webzibition + case studies) | Technique dissection after you know *why* motion exists |
| Chrome Developers — Scroll-driven animations docs | Native API source of truth |
| GSAP showcase / Motion examples | Pattern libraries for timeline vs declarative UI motion |

---

## 3. 2026 production tech stack (by job)

World-class sites almost never pick one tool. They assign **one job per layer**.

### 3.1 Stack map

| Job | Prefer (2026) | Size / cost (order) | Skip when |
|---|---|---|---|
| Micro-interaction (hover, focus, press) | CSS transitions + custom properties | 0 KB | Never — this is the floor |
| Once-only enter / exit on scroll | CSS `animation-timeline: view()` with `@supports`; IO fallback | 0 KB / tiny JS | Spectacle travel, blur filters |
| Page / route morph | View Transitions API (`startViewTransition`, `view-transition-name`) | 0 KB | Complex shared-element physics across unrelated trees |
| Smooth inertia scroll | **Lenis** | ~3 KB | Product apps, docs, dashboards (prefer native scroll) |
| Choreographed timelines, pin, scrub, split text, SVG morph | **GSAP** + ScrollTrigger (+ SplitText / MorphSVG / DrawSVG now free) | ~27–46 KB gzipped with plugins | Simple marketing pages that CSS can own |
| React component / layout / gesture / exit | **Motion** (`motion` package; `framer-motion` re-export) | ~25–30 KB gzipped | Non-React HTML templates |
| Spring physics UI | Motion springs or **React Spring**; avoid dual spring systems | varies | Marketing scroll narratives |
| Lightweight framework-agnostic timelines / SVG | **Anime.js v4** | ~13 KB | Already on GSAP for the same page |
| Designer-authored vector motion | **Rive** (interactive state machines) or **Lottie / DotLottie** (playback) | runtime + asset | CSS can draw it |
| 3D / shaders | **Three.js** + **React Three Fiber** + Drei | large | No physical metaphor + short dwell time |
| Copy-paste “wow” kits | Avoid as system source of truth | — | Always for Tell engine defaults |

### 3.2 Recommended combinations

**A. Marketing / brand site (Tell templates default path)**

```text
CSS tokens (duration / easing)
  + CSS scroll-driven view timelines (reveals, parallax-lite)
  + optional Lenis + GSAP ScrollTrigger (pinned chapters, scrub)
  + Rive/Lottie slot only if brief asks
  + WebGL only behind explicit flag
```

**B. Product web app / Tell Report UI**

```text
CSS tokens
  + Motion for layout, AnimatePresence, shared-element-ish transitions
  + View Transitions for route changes where supported
  + No Lenis, no ScrollSmoother, no competing scroll hijacks
```

**C. Immersive campaign / portfolio ceiling**

```text
Lenis + GSAP (timeline + ScrollTrigger + SplitText)
  + Three.js/R3F for the hero metaphor
  + Rive for interactive characters
  + Static first frame + prefers-reduced-motion finals mandatory
```

### 3.3 Native platform details (prefer before libraries)

**CSS scroll-driven animations**

- `animation-timeline: scroll()` / `view()`; `animation-range`; named timelines + `timeline-scope`
- Compositor-friendly when animating `transform` / `opacity` / `filter`
- Progressive enhancement: `@supports (animation-timeline: view())`; non-supporting browsers keep final content visible
- Firefox support still uneven mid-2026 → never depend on scroll-driven for meaning

**View Transitions API**

- Same-document: `document.startViewTransition(() => updateDOM())`
- Named elements: `view-transition-name`
- Cross-document `@view-transition` for MPA morphs
- Guard with feature detection; Firefox partial

**WAAPI**

- Fine-grained JS control without a framework; pairs with scroll timelines

### 3.4 D3.js + data-viz motion

| Job | Prefer | Tell adaptation |
|---|---|---|
| Scales, axes, joins, path generators | **D3** in product/research apps | Marketing HTML: vanilla SVG + D3 *patterns* (stroke-draw via `pathLength`, bar enter, scrub) — no D3 bundle by default |
| Series / sparkline claim | Stroke-draw once on enter | `.ds-draw` + reveal arming |
| Dense instrument desks (lattices) | Staggered bar/scale enter | `.ds-lattice-bar` with `--bar-i` delay |
| Interactive mechanism | Brush / scrub / step | Existing scrub instruments + educational siteKind |

D3’s enter/update/exit model maps cleanly to once-only reveals + reader-driven scrub — not ambient morph loops.

### 3.5 Free OSS motion templates (study → rebuild)

Open demos (Codrops-class tutorials, GSAP showcase, Motion examples, community Three/R3F kits) are **technique schools**:

1. Name the job (mask wipe, path draw, stagger grid, chapter pin).
2. Strip foreign brand, fonts, glow defaults.
3. Re-time into restraint band; kill uncontrolled loops.
4. Bind to product features / siteKind instruments.
5. Ship static-first + reduced-motion.

Never treat a kit as the system of record for Tell templates. Encode judgment in
`motion-stack-craft` (`.cursor/skills/motion-stack-craft`, agent playbook under
`premium-content-custom-web/motion-stack-craft`).

### 3.6 Accessibility & performance non-negotiables (every stack)

1. `prefers-reduced-motion: reduce` → jump to final states (not “shorter”).
2. Animate compositor properties; avoid layout-thrashing props for continuous motion.
3. One scroll engine. Never Lenis + ScrollSmoother + native competing.
4. Pause offscreen canvas/WebGL; prefer one live WebGL figure.
5. Static first paint must read if JS/WebGL fail.
6. Motion must answer: *would a reader miss this if removed?* If no, delete it.

---

## 4. Motion grammar (what experts actually ship)

Abstracted from studio work and agency rigor — encode these as Tell craft nodes, not as named clones.

| Beat | Expert pattern | Tell today | Gap |
|---|---|---|---|
| **Hero entrance** | Orchestrated 300–800ms sequence (type → media → CTA), once | Often none / generic reveal | Missing signature entrance |
| **Section enter** | Staggered children, small Y/opacity, once | Optional IO `.ds-reveal` | No stagger system; not default on enough sections |
| **Scroll chapter** | Pin + scrub narrative (progress-linked) | Scrub only on viz widgets | No page-level scroll chapters |
| **Micro-feedback** | Hover/focus/press on interactive only | Partial via CSS | Uneven across templates |
| **Route / state morph** | View Transitions or Motion layout | Minimal | Studio / multi-route weak |
| **Authored product motion** | Rive state machine tied to UI state | Rare / static figures | No first-class slot |
| **Ambient loop** | Rare, low-contrast, pausable | Correctly avoided | Keep avoided |
| **WebGL hero** | Metaphor-driven, degraded still | Out of scope by default | Keep gated |

Corpus evidence already constrains *timing*:

- Transition coverage p10–p90 ≈ **2–15%** of elements (`docs/10`)
- Median duration ≈ **150–300ms** (p90 duration up to ~600ms)
- Keyframe-animated elements median **2**; infinite animations median **0**

So the fix is **better choreography inside the restraint band**, not spraying transitions onto every node.

---

## 5. Gap analysis vs Tell (Aug 2026)

| Layer | Current state | Needed |
|---|---|---|
| Schema `MotionLevel` | `none` \| `subtle-micro` \| `light-scroll-reveals` | Add `scroll-narrative` (pinned/scrub chapters) and optionally `immersive` (gated) |
| Tokens | `fast/base/slow/reveal` + two easings | Stagger step, entrance vs exit, spring-ish ease optional; document reduced-motion map |
| Render | IO opacity + 0.5rem translateY | CSS view-timeline reveals + stagger; optional GSAP path for narrative tier |
| Skills | `restrained-motion-micro`, `scroll-reveal-once` (thin) | Full motion system skill + agency 3c rewrite |
| Critique metrics | Restraint + speed only | Presence metrics + qualitative “missable motion” gate |
| Corpus | Few maximal motion refs called out | Dedicated motion-heavy category seeds (local) |

---

## 6. Sources consulted (Aug 2026)

- Awwwards Annual Awards 2024–2025 (Agency / Site of the Year pages)
- Studio sites: Immersive Garden, Locomotive, Active Theory, Lusion, Stōkt, Fantik, Crispwave, Fern
- Codrops case studies (Lusion; Better Off® Lookback)
- Chrome Developers — “Animate elements on scroll with Scroll-driven animations”
- Practitioner roundups comparing GSAP / Motion / Anime.js / Lenis / Rive / Three.js / R3F (2026)
- Tell internals: `docs/10_DESIGN_EVIDENCE.md`, `packages/design-skills` motion types/render, agency `3c-motion` prompts, `research/critique.json` motion dimensions

---

## 7. Next actions (see plan)

1. Seed `research/motion-corpus.local.json` from §2 and run forensics on a motion-heavy slice.
2. Extend critique with choreography/presence measures.
3. Execute `docs/15_MOTION_ANIMATION_PLAN.md` workstreams W1→W4 before any WebGL default.
