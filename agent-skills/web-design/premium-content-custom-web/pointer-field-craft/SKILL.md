---
name: pointer-field-craft
description: Distance-based pointer trail emitter craft in full — emit per path distance (not timer), sub-segment placement, ring-buffer ordering, emitter lag, idle breath, coasting, touch/reduced-motion fallbacks, cleanup. Decorative only.
---

# pointer-field-craft

Build the emitter when trail density must follow **hand speed**.

## Emit by distance, not time (the core mechanism)

```js
E.acc += moved;
let guard = 0;
while (E.acc >= STEP && guard++ < 14) {
  E.acc -= STEP;
  spawn(/* … */);
}
```

Timer emission makes spacing ∝ speed — flicks scatter; resting hands pile motes. Cap the loop so teleports / tab restores cannot spawn thousands in one frame.

## Place each mote where it is owed

Lay along the segment (`t = guard * STEP / moved`), not all at the current tip.

## Ring-buffer: take the slot before advancing

```js
const i = E.i; E.i = (i + 1) % N; // correct — advance after write
```

Advancing first makes every mote appear one step behind.

## Lag the emitter behind the pointer

Damp toward the pointer so flicks keep slack instead of welding the trail to the cursor.

## Also learn

- Idle breath when distance emission would go silent
- Coast instead of hard stop
- Touch + `prefers-reduced-motion` → disable or static
- Pause when `document.hidden` or section not intersecting
- Prefer canvas overlay; moving emitter solely to raise z-index rarely pays off

## Tell constraints

- Default product UI: **off** (distracts from proof stages)
- Allowed as opt-in on art-directed studio heroes with reduced-motion off and content contrast intact
- Never attach listeners per mote; one pointer listener on the field root
