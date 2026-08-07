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

## 2026-08-07 — `template:display-clamp-invalid`

- **Failure:** Archive override used `font-size: clamp(2.5rem, calc(var(--t-display-size) * 1px), …)`
  but `--t-display-size` is already a `clamp(...)` → invalid CSS → probe measured a mid-size
  title (1.6vw / leading 1.36) as display → craft **91.3**.
- **Fix:** Set archive display with literal `clamp(2.6rem, 3.4vw, 3.2rem)` + `line-height: 1.08`;
  demote entry `.ds-chapter-index` folios to 11px mono so they cannot steal the display metric.
- **Do not:** Multiply a token that is already a full `font-size` expression by `1px`.

## 2026-08-07 — `template:ledger-rule-flood`

- **Failure:** Index-ledger drew 3×18 ruled rows (+ random underlines) → rules/screen **9.94**
  (band ≤4.33). Stack specimen compounded the flood.
- **Fix:** Sparse 2×5 ledger; specimen figure order prefers horizon over stack for archive.
  Rules **9.94 → 4.29**; craft **91.3 → 97.6**.
- **Do not:** Equate “dense index grammar” with hundreds of SVG hairlines per page.

## 2026-08-07 — `template:dashboard-shell-smears-bands`

- **Failure:** Dashboard band-variation sat at ~0.235 (corridor 0.422–0.896). The app shell’s character
  mass spanned two equal-height probe bands, and the late inverse specimen used a stack ledger with
  body prose — so every strip read as medium-dense. Empty 140vh statement voids (Loop 6) are not an
  allowed recovery.
- **Fix:** Sunken horizon specimen (titles only) between metrics and shell; pack the shell under
  ~1vh; stretch the drawn plate so the shell aligns into one measured band; quiet metric chrome;
  keep proof-claim at body measure so it does not steal the prose corridor. Score **97.8 → 99.9**;
  band-variation **0.235 → 0.474**.
- **Do not:** Recover band-variation with empty height, or leave a prose-heavy stack drawing in the
  quiet valley before a dense app shell.

## Process

After any visual miss the human names: append a pattern here in the same session, even if the code fix lands later.
Ship with `ship-loop`: analyze → fix → semantic commits (no attribution) → push → green → merge.


## 2026-08-07 — `template:soft-pack-vs-structural`

- **Failure named (champion):** Soft public templates read as glass card collages + purple/system
  gradients + floating UI panels. A recolored SaaS skeleton cannot beat that look by restyling —
  it still reads as the same grammar.
- **Challenger:** Two structural siteKinds that invent unreplicable press/voucher grammars —
  `commerce-loom` (size-tape + warp/weft photo loom + hangtag + Care label) and `field-guide`
  (taxon rail + specimen plate + range beads + Voucher) with copyright-free photo stock embedded
  as matter, not lifestyle cards.
- **Eval:** Critique loom/field **97.6** (only ink-variation above corridor, same class as archive);
  matrix **98.9**; holdout gap 0.5. Playwright eye: fold shows photo cells / botanical plate, not
  sticky-nav chrome. Soft-pack folds (card grids, glass heroes) are a different grammar entirely.
- **Do not:** Answer soft-pack craft with more rounded cards, mesh gradients, or glass panels.
  Invent a structure a density slider cannot emit, then hang the unique figure into the fold.

## 2026-08-07 — `template:svg-scale-inflates-type-steps`

- **Failure:** Loom first critique scored type-steps **15** (band ≤14). SVG mono labels at band /
  plate / mark roles measured as 10/12/19px after viewBox scale — distinct steps even when the
  attribute said `font-size="11"`.
- **Fix:** Force `text.ds-fig-mono{font-size:11px!important}` on loom/field; demote hang-aside
  titles to a shared 14px; drop 8–10px tape/taxon chips to 11px.
- **Do not:** Assume SVG `font-size="11"` survives scaling as one type step across figure roles.
