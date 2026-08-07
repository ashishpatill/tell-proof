# Tell learnings (recursive improve)

Persistent lessons across sessions. Read before changing showcase, templates, or preview chrome.
Pattern keys match `tell-recursive-improve`.

---

## 2026-08-06 — `showcase:preview-gutter`

- **Failure:** Featured + index iframes used `scale(calc(100cqw / 1440))` which never applied; fixed `0.48` / `0.14` left ~88px empty on the right of thumbs.
- **Fix:** `SpecimenPreview` / measured `--sx-scale = clientWidth / 1440`.
- **Do not:** Trust `@supports (1cqw)` on iframe transforms.

## 2026-08-06 — `showcase:nav-only-thumb`

- **Failure:** Thumbs were 5.5rem tall at ~0.14–0.20 scale → only sticky nav + truncated type. Agent screenshots clipped the same strip and called it proof.
- **Fix:** Taller thumbs (~10.5rem); scroll still frame to **figure/claim beat** (skip y=0); featured **cinema reel** through beats; screenshot contract requires a craft beat, not chrome.
- **Do not:** Ship gallery shots of the top 400px of a 1440 page and call it a specimen.

## 2026-08-06 — `showcase:sticky-nav-in-still`

- **Failure:** Even after beat scroll, sticky nav still occupied the top of every plate/thumb.
- **Fix:** Inject preview-only CSS in `SpecimenPreview` that hides `.ds-nav` / skip link inside the iframe.
- **Do not:** Treat nav chrome as part of the specimen proof.


## 2026-08-06 — `template:svg-text-steals-display`

- **Failure:** Foundry type-ladder used SVG `<text font-size="180+">` for optical samples. The
  critique probe treated those as page display type → displayVw 10.97, type-steps 18, measure 2.7ch,
  craft score 86.
- **Fix:** Draw optical sizes as `constructedGlyph` strokes; keep only 10–11px mono labels in SVG.
- **Do not:** Put large SVG text on the fold and expect type bands to stay honest.

## 2026-08-07 — `template:folio-claim-starves-plate`

- **Failure:** Research-dossier folio put masthead + full claim + CTAs above the dossier plate, so
  fold-figure sat at 0.20 (band ≥0.34) — the unique craft was below the fold.
- **Fix:** Compact claim (drop fold cta-note, tighten padding), hang `.ds-folio-field` up under a
  soft paper fade, raise plate min-height so pins enter the first viewport.
- **Do not:** Treat a unique figure as shipped if the fold shot is only type chrome.

## Process

After any visual miss the human names: append a pattern here in the same session, even if the code fix lands later.
Ship with `ship-loop`: analyze → fix → semantic commits (no attribution) → push → green → merge.
