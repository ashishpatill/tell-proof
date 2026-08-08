---
name: ambient-atmosphere-craft
description: Section-bounded particle/atmosphere craft learned in full — config knobs, renderer choice, pointer disturbance, visibility pausing, recycle/settle/static modes, DPR caps, teardown. Tell default is sparse static; animated only when motion allows and content stays primary.
---

# ambient-atmosphere-craft

Build particles as a **bounded atmosphere layer**, not a page-wide screensaver. Content stays primary; stop work when the effect cannot be seen.

## Choose the renderer (from the full craft)

| Need | Renderer |
|---|---|
| ~40+ small motes, pointer forces, procedural shapes | Canvas |
| Few branded fragments needing individual style | DOM / inline SVG |
| Thousands / depth / shaders | WebGL — cap DPR, provide static fallback |

Start with the least expensive renderer that preserves the shape language.

## One configuration object

```js
const particles = {
  count: 54,
  gravity: 7,
  wind: -3,
  sway: 16,
  speed: [8, 18],
  size: [4, 12],
  opacity: [0.18, 0.62],
  rotation: [-0.8, 0.8],
  mode: "recycle", // recycle | exit | settle | static
  pointerRadius: 110,
  maxDpr: 2,
};
```

Scale density by **container area**, then clamp for mobile and low-power. Do not derive count from viewport width alone.

## Layer the section

1. Positioning context; clip overflow when particles must stay bounded
2. Particle surface **behind content**, above background
3. Layer `pointer-events: none`; listen for pointer on the **section**
4. Quiet content zone / lower density behind long text and controls
5. Controls and links keep normal stacking + visible focus

## Run the simulation

- Seed inside or just above bounds
- Update gravity, wind, sway, rotation, opacity from elapsed time
- Clamp large time deltas after background tabs
- **One** `requestAnimationFrame` loop for the whole layer
- `ResizeObserver`; canvas backing at `min(devicePixelRatio, maxDpr)`
- Pointer disturbance: one section listener, distance-based force — never per-particle listeners

End modes: `recycle` | `exit` | `settle` (height-capped pile) | `static` (deterministic still)

## Stop invisible work

- `IntersectionObserver` — start only when visible
- Cancel RAF when section exits or `document.hidden`
- Resume from current state; never spawn a second loop
- Teardown: disconnect observers, remove listeners, cancel frame, release resources

## Tell constraints (ship defaults)

| Context | Behavior |
|---|---|
| `motion: none` or `prefers-reduced-motion` | `static` sparse arrangement or omit layer |
| Marketing SaaS default | Prefer CSS static mote field (engine) over continuous canvas |
| Contrast | Opacity never crosses legibility threshold |
| Assistive tech | Decorative; hide from AT |
| Modals / critical tasks | Pause decorative motion in that section |

## Engine

`@tell/design-skills` emits a **static** sparse mote field under `data-atmosphere` for dark-premium when motion ≠ none. Agents may replace with the full canvas sim when the brief explicitly asks for living atmosphere.

## Verify

Entry/exit pausing, background-tab recovery, fast resize, 390/768/1440, DPR, pointer/touch, reduced motion, overflow, focus, route cleanup, single loop on remount.
