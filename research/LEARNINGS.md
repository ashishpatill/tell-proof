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

## 2026-08-07 — `showcase:list-not-reel`

- **Failure:** Cinema reel existed as a GIF substitute, but `/showcase` still read as a text index
  with hover thumbs; beat discovery missed dossier spread/imprint; reels did not autoplay in view.
- **Fix:** Gallery becomes a craft stage (featured dossier cinema) + filmstrip of sprocket-framed
  cells; `discoverBeats` includes plate/ladder/spread/imprint; `autoplayInView` IntersectionObserver;
  hide chapter rail in preview chrome like sticky nav.
- **Do not:** Ship a gallery of nav-crop stills and call the earlier cinema commit "done".

## 2026-08-07 — `template:thick-chrome-kills-hairline`

- **Failure:** Observatory first critique scored **96.0** with hairline ratio 0.839 (band ≥0.947).
  Chronometer major ticks, chrono track/beads, aside borders, 3px bleed seal, and calibration stripe
  were 1.5–3px chrome — the probe treats those as non-hairline and tanks the band.
- **Fix:** Force observatory structural rules to 1px; consolidate mono labels to 11px; hairline bleed
  seal. Score **96.0 → 99.0**.
- **Do not:** Add 2–3px “accent bars” as borders on a new siteKind and expect hairline bands to hold.

## 2026-08-07 — `template:chrono-claim-starves-lattice`

- **Failure:** Same class as folio-claim-starves-plate — chronometer fold put full claim + dual CTAs
  above the signal lattice, so narrow showcase frames showed scrub chrome without the unique figure.
- **Fix:** Compact claim, hang `.ds-chrono-field` under a soft paper fade, raise lattice min-height
  so amplitude channels enter the first desktop viewport (lattice top ~344px @1440×900).
- **Do not:** Treat a unique lattice as shipped if the fold shot is only type + sticky scrub.


## 2026-08-07 — `template:index-must-own-fold`

- **Failure class:** Same as folio-claim-starves-plate / chrono-claim-starves-lattice — for award-index /
  archive craft the **ledger is the figure**. A tall claim + CTAs above a plate leaves foldFigure
  starved and the unique index grammar below the fold.
- **Fix:** `hero-register` keeps a compact claim, hangs `.ds-register-field` under a soft paper fade,
  and lets `index-ledger` own the first viewport. Quiet display clamp 45–52px; alpha-rail is chrome
  (hidden in SpecimenPreview).
- **Do not:** Put a product plate *below* a shouty claim and call an archive index shipped.

## Process

After any visual miss the human names: append a pattern here in the same session, even if the code fix lands later.
Ship with `ship-loop`: analyze → fix → semantic commits (no attribution) → push → green → merge.
