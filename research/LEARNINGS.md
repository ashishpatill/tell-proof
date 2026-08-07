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

## 2026-08-07 — `template:overfigure-collides-with-labels`

- **Failure:** Mechanism explainer (`docs-educational`) used absolute `hero-overfigure` so CTAs and
  claim rode on top of the spanning flow diagram — "See the approach" / "Read the detail" parked on
  stage cards; SVG "Sequence" labels collided with the display. Refined-story chapter indices at
  `--t-display-size` also smashed into title/body columns.
- **Fix:** Educational fold is **stackfold + solid claim** (opaque claim band, then figure);
  denser scrub instrument; chapter-index capped to ~1.85rem; no negative-margin chapter overlaps on
  docs-educational; basics gate requires stackfold and forbids `class="…ds-hero-overfigure"`.
- **Do not:** Absolute-overlay claim on any figure that carries readable stage titles.

## 2026-08-07 — `template:ledger-cell-void`

- **Failure:** Archive index-ledger kept rules sparse (good) but each cell was one 11px line in a
  ~128px-tall row → looked empty. Human named Stamp Roll "lots of empty components."
- **Fix:** Dual ink line per cell (ordinal+title + short meta), accent stamps + letter watermarks;
  compact register claim; never clip long body into SVG ellipsis debris.
- **Do not:** Equate "sparse rules" with empty cells — fill with ink, not more hairlines.

## 2026-08-07 — `showcase:stage-class-collision`

- **Failure:** Gallery `.sx-stage { max-width:1440px; margin:auto; display:grid }` leaked into
  specimen `ShowcaseFrame` pages → proof iframe sat as a centered card with huge dark gutters
  ("empty Specimens page").
- **Fix:** Scope gallery stage under `.sx-root .sx-stage`; reset `.sx-chrome .sx-stage` to
  full-bleed block. SpecimenPreview nudges cinema beats deeper into ledger/figure ink.
- **Do not:** Reuse gallery layout class names for proof chrome without a reset.

## 2026-08-07 — `template:css-rule-density-not-svg`

- **Failure:** Archive/educational `ruleDensity` stayed above corridor (≤4.33) after thinning SVG
  ledger hairlines. Shortening the ledger plate to "pack cells" made density *worse*.
- **Cause:** `composition.ruleDensity` counts wide CSS top/bottom-only borders (and thin DOM bars /
  `hr`) ÷ screens — **not** SVG strokes. A later `border-color:` shorthand on archive `.ds-index-row`
  also undid transparent even-row tops. Matrix `td/th` border-bottoms each count as a rule.
- **Fix:** Thin CSS bordered rows (every 3rd); put thinning rules last; restore tall ledger and fill
  cells with dual ink + stamps; quiet educational specimen (titles-only horizon) for band-variation;
  widen educational body measure so scrub/aside columns cannot steal the body candidate.
- **Do not:** Confuse SVG strokes with `ruleDensity`, or shrink page height to "fix" empty cells.

## 2026-08-07 — `template:press-claim-starves-forme`

- **Failure class:** Same as folio-claim-starves-plate / chrono-claim-starves-lattice /
  index-must-own-fold — press-atelier first fold put full claim + dual CTAs above the
  press sheet, so the unique imposition grid only peeked at the bottom of the viewport.
- **Fix:** Compact claim (hide eyebrow, quiet display clamp, hang `.ds-press-field` under a
  soft paper fade), raise press-sheet min-height so SIG panels enter the first desktop
  viewport. Consolidate mono chrome to 11px so type-steps stay ≤14.
- **Do not:** Treat a unique forme as shipped if the fold shot is only type + sticky rail.

## 2026-08-07 — `template:empty-sig-voids`

- **Failure:** Press-sheet SIG cells were empty white rectangles — showcase + proof screenshots
  read as a sparse wireframe, not an imposition forme. Featured cinema also drifted onto
  specimen/horizon beats that looked basic.
- **Fix:** Draw 2×2 mini pages (text bars, media blocks, folios) inside every SIG cell; densitometer
  as filled patches not rule ticks; lock SpecimenPreview reel to figure→spread→proof when a craft
  figure exists; skip instruments/specimen in discovery; land press still at y≥360 into filled
  matter. Keep SVG mono at 11px (`FT.micro`) so type-steps stay ≤14; prefer filled rects over
  dashed fold crosses so rule-structure stays in band.
- **Do not:** Ship an imposition grid whose cells are blank paper and call it craft.

## 2026-08-07 — `showcase:stage-selector-miss`

- **Failure:** Gallery 2-column mast|reel used `.sx-root > .sx-stage`, but the stage lives under
  `.sx-shell` — the rule never matched. A later unscoped `.sx-stage` chrome rule also fought the
  gallery grid and left proof iframes looking empty.
- **Fix:** Scope gallery as `.sx-shell > .sx-stage` and proof as `.sx-chrome .sx-stage` (display
  block, full-bleed iframe). Verify with getComputedStyle grid columns before claiming the fold.
- **Do not:** Style shared classnames across gallery and proof without a parent scope.

## 2026-08-07 — `engine:encode-empty-void-gates`

- **Failure class:** Press densify + showcase craft-first were one-off patches; the next cell-grid
  figure could ship empty stroked voids and the next cinema could reopen on specimen.
- **Fix (engine):** Export `miniPageMatter` / `densitometerStrip` / `FIG_MONO_PX`; clamp mono in
  `text()`; `data-dense="ink"` on densified frames; `assertBasics` gates `fig-mono-floor`,
  `craft-figure-dense`, `fold-owns-craft`; shared fold-owns secondary-CTA hide across dossier /
  chrono / archive / press; extract `specimenBeats` with craft-first cinema + unit tests.
- **Do not:** Patch one siteKind's empty cells without leaving a reusable helper + basics gate.

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

## 2026-08-07 — `template:sticky-rail-recipe`

- **Failure named (champion):** Loom + field still read as sticky left-rail editorial landings
  (claim column + figure) — a density/chrome swap on the archive/observatory recipe, not marvel
  craft. Soft packs lose to structure; this structure was still the same recipe.
- **Challenger:** Drawloom (headline as weft picks through warp; cloth below; size treadles at
  bottom) + glassine press (specimen under peeled translucent sheet; museum label; corner pins;
  binomial strip at bottom).
- **Eval:** Critique after dogfood **97.6 / 97.6** (matrix **98.9**). Desktop fold shots show
  woven weft lines and pinned glassine peel — not left sticky chrome.
- **Do not:** Answer “make it unique” by renaming a left sticky rail. Invent a fold grammar a
  rail cannot emit.

## 2026-08-07 — `template:marvel-chrome-tax`

- **Failure:** First marvel pass scored **94.2 / 94.3**. 3px active borders on treadle/binomial
  chips tanked hairline (0.85 / 0.84); peel/label box-shadows blew shadow coverage; short weft
  wraps (~10ch) starved display measure; tall claim starved fold figure.
- **Fix:** Force 1px instrument borders; drop decorative shadows; longer weft wraps (~28ch);
  hang cloth / raise plate into the first viewport.
- **Do not:** Decorate a new siteKind with 2–3px accent bars or soft drop shadows and expect
  hairline/shadow bands to hold.

## 2026-08-07 — `template:claim-over-grid-still-basic`

- **Failure named (champion):** After Loop 21, hard eye still read loom as serif-over-graph-paper
  and field as a floating label card on a photo — metaphor chrome, not unreplicable structure.
- **Challenger:** SVG warp shed + flying shuttle + fell line; cork dissecting tray with hinged
  glassine lid, entomology pins, specimen tag, vernier.
- **Eval:** Loom **97.6**, field **98.7** (↑), matrix **99.0**. Desktop folds show shuttle on
  shed and numbered pins in a tray well.
- **Do not:** Stop at renaming chrome. Ask whether a density slider + stock photo could emit the
  same fold; if yes, invent an instrument.

## 2026-08-07 — `template:glyph-split-steals-display`

- **Failure:** Per-character shed glyphs inside the display headline scored loom **93.0** —
  displayVw **1.74**, display leading **1.36** (probe lost the clamp on `.ds-weft-display`).
- **Fix:** Keep whole-line weft ink (probe-safe); simulate shed weave with a repeating background
  mask on `.ds-weft-ink`, not split glyphs. Score **93.0 → 97.6**.
- **Do not:** Split display type into per-glyph spans to fake a weave — the forensics probe will
  demote the headline.

## 2026-08-07 — `platform:mcp-doc-drift`

- **Failure:** Skills/agents documented 4 MCP tools while the server shipped 8 (+ growing) — agents
  called wrong/missing tools; install was clone-and-edit-JSON only.
- **Fix:** `McpToolName` / `MCP_TOOL_NAMES` in `@tell/schema`, `REGISTERED_MCP_TOOLS` + vitest drift
  guard, `buildInstallInfo` + `GET /api/install-info`, `tell mcp install cursor`, `tell_voice`,
  report `id` for redesign chain, `TELL_CAPTURE_API_TOKEN` gate.
- **Do not:** Document MCP tools only in prose — gate names with schema + a test that reads
  `packages/mcp/src/index.ts`.

## 2026-08-07 — `platform:next-js-extension-reexports`

- **Failure:** After splitting `@tell/schema` into `install-info.ts` / `resolve-intent.ts`, Next
  `transpilePackages` failed with `Can't resolve './install-info.js'` on every API route.
- **Fix:** Re-export with extensionless paths (`./install-info`) like `@tell/taste` — webpack maps
  them to `.ts` under transpilePackages; tsup still bundles fine.
- **Do not:** Use NodeNext `.js` suffixes in packages that Next transpiles from source.




