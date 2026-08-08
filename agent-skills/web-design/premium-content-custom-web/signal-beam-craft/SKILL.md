---
name: signal-beam-craft
description: Full WebGL/CSS brand-accent beam atmosphere craft — thin hot core, accent-derived halo/smoke, fixed canvas behind DOM, DPR caps, resize, cleanup, reduced-motion static frame. Never hardcode blue; never intercept pointers.
---

# signal-beam-craft

Scope: **background beam only** — not layout, copy, particles, or unrelated motion systems.

## Layering (required)

```html
<canvas class="ds-beam-canvas" data-signal-beam aria-hidden="true"></canvas>
<main class="page-content">…</main>
```

```css
.ds-beam-canvas { position: fixed; inset: 0; z-index: 0; width: 100vw; height: 100vh; pointer-events: none; }
.page-content { position: relative; z-index: 1; }
```

## Brand color (learned — never hardcode a hue family)

Derive halo/smoke from the design accent (`--c-accent` / brandAccent). Core stays near-white; halo mixes toward brand.

```js
function hexToRgb01(hex) { /* parse #RGB/#RRGGBB → [r,g,b] in 0..1 */ }
const accent = getComputedStyle(document.documentElement)
  .getPropertyValue("--c-accent").trim() || "#888888";
```

## Shader craft (keep in agent builds)

- Full-screen quad; uniforms: `u_resolution`, `u_time`, `u_color`, `u_xOffset`, `u_coreWidth`, `u_glowWidth`, `u_smokeDensity`
- Core: thin Gaussian on distance-to-beam; glow wider; smoke = FBM × scatter near beam
- Pulse affects **glow only** — no flicker / color cycling
- Vignette so edges stay dark; alpha from smoke+glow+core

## Initializer duties

1. WebGL context with alpha; bail cleanly if unavailable
2. Sync resolution on resize; cap `maxDpr` (~1.5)
3. Animate `u_time` via RAF **unless** `prefers-reduced-motion` — then draw one static frame
4. Return cleanup: cancel RAF, remove resize listener, delete buffers/program

## Tuning knobs

Beam `xOffset`, `coreWidth` (keep extremely thin), `glowWidth`, `smokeDensity`, FBM octaves, `maxDpr`

## Taste rules

- Hottest core near white
- Halo/fog from primary accent
- Smoke blooms near beam, dissipates outward
- **Content readability wins** over bloom

## Tell constraints

- Default marketing engine uses a **CSS accent beam vignette** (no WebGL) for dark-premium
- Full WebGL path only when briefly requested and dogfood contrast still passes
- Avoid thick neon bars, multicolor neon washes, canvas stealing pointer events

## Avoid

Hardcoded blue when brand differs; thick glowing bars; generic fog not concentrated on the beam; particle explosions; washing out UI.
