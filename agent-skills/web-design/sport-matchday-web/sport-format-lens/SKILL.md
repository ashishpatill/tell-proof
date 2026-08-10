---
name: sport-format-lens
description: Specialize variant-lens for sport formats (Test/ODI/T20 and peers).
---

# sport-format-lens

Extends `variant-lens` for matchday sites.

## Cricket

- Test — session/day, partnership depth, bowling spells
- ODI — overs remaining, required rate, powerplay
- T20 — ball-by-ball urgency, death overs, compact spine

## Other sports

Use pack `variantLenses` — do not hardcode cricket-only UI into the engine for football/hockey/tennis.

## Output

Which spine fields show/hide per format; which pages need format chips.
