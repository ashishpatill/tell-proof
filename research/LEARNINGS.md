# Tell learnings (recursive improve)

Persistent lessons across sessions. Read before changing showcase, templates, or preview chrome.
Pattern keys match `tell-recursive-improve`.

---

## 2026-08-18 — `template:no-stroke-through-type`

- **Failure:** Corporate Lattice 2×2 (`postureGrid`) drew an accent `polyline` through cell centroids
  in reading order — a Z across titles that looked like a bug, not sequence. SaaS `pipelineBoard`
  did the same class of miss: a `ds-draw` path at `y+40` through column numbers and titles.
- **Fix:** Stroke-draw lives on a **header hairline** (gap under the plate label). Sequence is the
  01–04 ordinals / gutters. Basics gates `posture-grid-no-centroid-stroke`,
  `pipeline-board-no-title-rail`. Charts on axes, night-walk atlases, and ledger cutoffs stay.
- **Do not:** Connect labeled card centroids with accent polylines. Numbers and gutters carry order.

## 2026-08-18 — `template:no-catalogue-pair-under-fold`

- **Failure:** Lattice (and Northstar) showed the same four capabilities twice in one viewport —
  posture grid / pipeline board on the fold, then a metric card row titled “What X covers” whose
  values were the feature names. Read as a paired screenshot of the same template.
- **Fix:** Skip the metrics band on catalog-fold kinds (corporate, SaaS, dashboard, fintech). Fold
  heroes fill the first viewport (`min-height: min(100vh, 920px)`). Gate
  `catalog-fold-no-metric-reprint`.
- **Do not:** Reprint fold-instrument titles as a metric row. Catalogue copy belongs later, as
  prose, not as a second card screenshot under the fold.

## 2026-08-12 — `home:no-third-party-composer-templates`

- **Do not:** Show third-party product brands as starter templates/chips under the Tell home composer. Guard: `apps/web/src/lib/composer-brand-denylist.ts` + vitest. Prefer Tell specimens / `listTemplates()` labels only — or nothing.

## 2026-08-12 — `home:design-controls-shared`

- **Do:** Home Design brief chip bar and Studio Taste Controls share `DesignControls` + `design-controls-catalog.ts` mapping to `DesignBrief` / `TasteControls` (Surface→siteKind, Goal→businessGoal, Lean→aestheticLean, Mood→colorMood, etc.). Fidelity is a UI ladder that nudges craftNodes / motion — not a parallel brief schema.

## 2026-08-08 — `template:craft-bleed-into-rail`

- **Failure:** Forme Desk (press-atelier) full-bleed specimen/flow stages painted under the Sig
  A–H rail; masthead border kissed the brand (2px); registration crosshairs (`z-index:3`) sat over
  claim type. Herbarium pins/SVG head mono sat under the absolute specimen tag.
- **Fix:** `--craft-rail` insets `.ds-bleed` / plate figs for press/lantern/archive/observatory;
  move `.ds-press-regs` inside the field; restore masthead/claim padding; pin epins + plate head
  mono to the right of the voucher tag. Gates `craft-rail-clears-bleed`, `press-regs-frame-field`.
- **Do not:** Let `width:100vw` bleeds ignore a fixed left craft rail.

## 2026-08-08 — `template:craft-claim-over-field`

- **Failure:** Ember Gate (lantern-path) and sibling craft folds pulled the figure field under
  the claim with `margin-top: calc(... * -N)` plus a soft paper→transparent fade. Display + CTA
  sat on PATH ATLAS / waypoint chip labels (same class of bug as overfigure-collides-with-labels).
- **Fix:** Opaque `background:var(--c-paper)` claim bands; `margin-top:0` on
  path/press/chrono/folio/register fields. Basics gate `craft-claim-clears-field`.
- **Do not:** Soft-fade a claim over any figure that carries readable chrome.

## 2026-08-08 — `template:story-note-under-mark`

- **Failure:** Sitekind “layered” overrides set `margin-top: calc(var(--s-sm) * -1)` on
  chrono/entry/hang/range/gather/ember (and spread/marginalia) marks. HTML stacks
  `Note 0N` then the capability SVG, so the drawing slid through the label (nested frames,
  bars, junction targets). Mark SVGs also drew ink at ~4.5px from the top edge.
- **Fix:** Drop those note-adjacent negative margins; keep band-boundary overlaps
  (specimen / proof-figure / closing). Add `note + mark { margin-top: var(--s-lg) }`
  clearance; pad capabilityMark to 14px; basics gate `story-note-clears-mark`. Rebuild
  `@tell/design-skills` dist so showcase iframes pick up CSS.
- **Do not:** Score layeredElements by pulling labeled drawings under their own captions.

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





## 2026-08-07 — `template:overfigure-claim-collision` + `template:dead-affordance`

- **Failure (human):** First five offerings (saas/dashboard/corporate/educational/fintech) shipped with
  claim text painted over labeled SVG chrome (100k+ px measured overlap on Northstar), footer links
  that all scrolled to `#top`, dashboard `#app` missing, pricing cards that hovered like links
  without CTAs, and three products all named Northstar.
- **Root cause:** `ds-hero-overfigure` absolute claim over `interfaceBand`/`flowDiagram`/`horizonPlot`
  labels; footer `href="#top"` spam; app shell without `id`; `.ds-plan` in interactive selectors;
  educational negative-margin pull-up recreated overfigure collisions despite stackfold.
- **Fix:** Stackfold + solid claim for saas/fintech/dashboard/corporate; zero educational plate
  pull-up; footer maps to real section ids or `<span>`; `id="app"` + static sidebar labels;
  plan CTAs on every lane; remove plan hover affordance; distinct Queueboard/Lattice names;
  basics gates `kind-marketing-stackfold`, `kind-app-id`, `no-footer-top-spam`.
- **Do not:** Treat critique score as an eye pass. Absolute overfigure over labeled product SVG is
  never "premium fold figure." Fake interactive chrome (hover without action, links to `#top`)
  fails the human test even when anchors "work."

## 2026-08-07 — `template:empty-flow-band` + `template:boilerplate-proof-spam`

- **Failure (human):** Mechanism explainer showed huge empty ordinal stage cards that looked
  clickable and weren't; templates 04 (educational) and 06 (studio) both opened on `flow` heroes;
  every marketing proof used "Why X holds under review"; first five felt like one skeleton.
- **Root cause:** `flowDiagram` band = title-only + `stretch:true` + CSS forced 72vh height;
  `ORDER` collided (edu/studio → flow; saas/fintech → interface); `sections.ts` proof title had no
  siteKind branch; shared pull-quote / "The order things happen in".
- **Fix:** Content-sized flow cards with body lines, no stretch; educational → stack hero + visible
  aside; fintech → horizon hero (never twin SaaS interface); siteKind proof/story/nav/quote maps;
  basics gates `no-boilerplate-proof-title` + `flow-band-no-stretch`; detector `BoilerplateCopyTell`
  on snapshot text; README first-five stills + craft-reel GIFs.
- **Do not:** Stretch empty SVG shells to fake fold coverage. Do not reuse one proof title across
  offerings. Critique score is not an eye pass for empty cards or shared copy.

## 2026-08-07 — `template:figure-legend-starves-flow` + `template:scrub-dead-clicks`

- **Failure (human):** Dashboard/studio flow heroes still looked like empty clickable cards; scrub
  stage list and nodes never drove the range input ("doesn't even click").
- **Root cause:** `sections.ts` figure blocks are title+ordinal legends; `planFigures` preferred
  those empty steps over the catalogue bodies for flow bands. Scrub JS only listened to `<input
  type="range">` — list items and SVG nodes were decorative.
- **Fix:** Merge catalogue `body`/`points` into sequence steps by title before drawing; figure
  legends carry short claim lines; scrub `go(idx)` wires steps + nodes; studio fold → filled `flow`
  (not twin corporate/fintech `horizon`); basics `flow-band-has-matter` + `scrub-steps-clickable`.
- **Do not:** Assume title-only figure legends are safe inputs to band drawings. Do not ship
  affordances that look selectable without wiring paint.

## 2026-08-07 — `template:order-swap-is-not-unique`

- **Failure (human):** "Rarely a visual component should be reused… cheating… same template again
  and again with minor modifications." First five still shared one conversion skeleton
  (`nav → stackfold → metrics → features → specimen → proof → chapters → faq`) with figure ORDER
  swaps and proof-title retunes.
- **Root cause:** `kind-marketing-stackfold` *enforced* sameness. Craft kinds (foundry/dossier/
  observatory/…) prove the real pattern: dedicated `hero-*` layout + dedicated SVG kind + CSS rail
  + basics gate. Marketing kinds never got that.
- **Fix:** Unreplicable fold instruments per siteKind — SaaS `hero-pipeline` + `pipeline-board`,
  dashboard `hero-queue` + `queue-console`, corporate `hero-diligence` + `posture-grid`, educational
  `hero-mechanism` + scrub-on-fold `mechanism-plate`, fintech `hero-wire` + `wire-ledger`. Basics
  gates require the new DOM and forbid stackfold class on those kinds.
## 2026-08-07 — `showcase:hover-reel-vs-anthology-hero`

- **Failure (human):** Template filmstrip reels autoplayed the same 2–3 beats of one offering on
  loop; the hero stage also looped a single specimen instead of touring craft across the catalog.
- **Fix:** Filmstrip `autoplayInView={false}` — cinema only on hover. Featured stage is
  `ShowcaseAnthologyReel`: slow (~5.2s) still-craft tour across distinct siteKinds (archive →
  observatory → … → fintech), one best beat per offering, hover pauses. Prefer-figure stills; no
  intra-template cinema on the hero.
- **Do not:** Autoplay every thumb in view. Do not call a single-template 3-beat loop an "across
  specimens" tour.

## 2026-08-07 — `template:claim-band-starves-fold-instrument`

- **Failure:** First-five marketing folds stacked a tall left-capped claim band *above* a full-bleed
  instrument band. At 1440×900 the claim alone ate ~450px with an empty right half; the pipeline
  board / posture grid / queue console / wire ledger started below the fold. Screenshots looked
  unfinished (Northstar empty right; Lattice empty bottom).
- **Fix:** Split folds (`ds-*-fold` grid) — claim left, instrument right, both in the first viewport.
  Draw those instruments in the taller `column` figure role. Basics gate requires `ds-*-fold`.
- **Do not:** Park unique fold instruments under a full-width claim with `max-width:18ch` type and
  call the empty right half "asymmetric luxury."

## 2026-08-07 — `template:dead-clickable-affordances`

- **Failure (human):** Numbered stage chips (Priority queue / Deal room / …) and flow cards looked
  like buttons but were dead — hash `<a>` scroll links or static SVG shells. Wasted demo time.
- **Fix:** Priority/stage rails → `<button data-rail-step>` that toggles `is-live`, updates caption,
  and syncs `[data-app-shell]` view. Flow → HTML `.ds-flow-card` buttons + caption. App nav/filters
  filter table rows. Proof cells → `.ds-proof-hit` with `aria-pressed`. Basics gates require buttons
  + handlers; forbid SVG `data-figure="flow"` and `<a class="ds-priority-chip">`.
- **Do not:** Style chrome as interactive unless click/keyboard changes visible state.

## 2026-08-08 — `template:nightwalk-needs-atlas-not-webgl`

- **Failure named (champion):** Soft dark cinematic tourism pages answer atmospheric scroll
  chapters with heavy WebGL canvases, AI scene plates, and glow/particle stacks. A recolored
  SaaS dark theme cannot beat that look either — same conversion skeleton under night paint.
- **Challenger:** `lantern-path` — paper-led editorial page with an unreplicable **path-plate**
  night cartograph owning the fold (elevation + lantern waypoints Threshold→Afterlight +
  silhouette near-plane matter, `data-dense=ink`), sticky `ds-way-rail` Ch I–V, `story-ember`
  bead essay, Ember close. Waypoint scroll + silhouette opacity handoff; reduced-motion safe.
- **Eval:** First critique **98.0** (shadow 0.016 out); RSI fix dropped decorative shadows →
  **98.6** (shadow 0.006 in band); foldFigure **0.71**. Playwright: plate dense, chapter labels
  citeable, ember reveals fire, waypoint rail tracks scroll. Eye: atlas owns the fold — not
  sticky-nav chrome or empty dark voids.
- **Do not:** Answer atmospheric night-walk craft with WebGL tourism chrome, bloom stacks, or
  a dark SaaS hero. Invent a citeable atlas instrument, hang it into the fold, keep the page
  paper-led so contrast/critique bands hold.

## 2026-08-08 — `template:paper-frame-footer-miss`

- **Failure:** SaaS (Northstar) and dashboard (Queueboard) footers were unreadable — paper ink
  sitting on the paper-technical *inverse outer field*. Template 1 = dark ink on dark inverse;
  template 2 = light ink on light inverse.
- **Root cause:** Frame CSS targeted `footer.ds-section`, but markup is `<footer class="ds-footer">`
  outside `#main`. Combined with `[data-surface="paper"]{background:transparent}`, the footer
  never received opaque paper paint.
- **Fix:** Paint `.ds-footer` in the paper-technical + atmosphere rules; basics gate
  `paper-frame-footer-paint`.
- **Do not:** Assume `footer.ds-section` matches real footer markup. Always verify the selector
  against `renderFooter` output when framing outside `#main`.

## 2026-08-08 — `template:chapter-spine-through-index`

- **Failure:** SaaS story `.ds-chapters` spine cut through "Step 0N" labels; lead inset bar also
  clipped "Step 01".
- **Root cause:** `::before` used `left: calc(var(--align-rail) * 0.35)` (through the index
  column). Lead `box-shadow: inset 3px` sat on `padding-left: 0` rows.
- **Fix:** `--chapter-inset` left padding on every chapter; spine at
  `calc(var(--chapter-inset) + var(--align-rail) + (var(--s-lg) / 2))`. Basics gates
  `chapter-spine-clears-index` + `chapter-lead-clears-index`.
- **Do not:** Position the spine as a fraction of the index column width.

## 2026-08-08 — `template:figure-chip-overflow`

- **Failure:** Northstar (saas) pipeline-board deal pills let mono labels like "Executive · 84k"
  paint past the rounded rect; stage titles ("Pipeline coaching") also escaped the column.
- **Root cause:** Fixed `clip(..., 22)` / `clip(..., 18)` ignore the actual column pixel budget.
  SVG text has no CSS ellipsis — character caps must come from width ÷ advance.
- **Fix:** `clipToWidth` / `fitDealChip` (prefer `E · 84k` over `Exe… · 84k`); stage titles use the
  same budget. Vitest locks the narrow-column case. Anno labels get `min-width:0` + ellipsis.
- **Do not:** Clip figure labels to a fixed character count without measuring the box they sit in.

## 2026-08-08 — `template:workflow-plate-on-panel`

- **Failure:** Northstar workflow stage: lit product plate sat flush on the HTMX panel (0px gap);
  stage chips cramped at 8px; proof band tucked 48px into the next section.
- **Root cause:** `.ds-proof-figure{transform:translateY(var(--s-md))}` cancelled
  `.ds-workflow-field` gap. Proof hang (`margin-bottom: calc(var(--s-xl) * -1)`) is for marquee
  boards, not a stacked plate+panel.
- **Fix:** Workflow field gap `--s-xl`, plate `transform:none`, denser chip gap, workflow proof
  `margin-bottom:0`. Basics gate `workflow-stack-clears-panel`.
- **Do not:** Reuse proof-board hang transforms inside a vertical stack of discrete surfaces.

## 2026-08-08 — `template:cast-floats-off-type`

- **Failure:** Kinetic/Mote fold put Reed + Pip in a separate column/band under the headline. CSS
  translate “overlap” still left the hand ~120×170px off “makes”; human eye read two compositions
  (type left, cast bottom-right) plus a dead airway — not “leans on the type.”
- **Fix:** Absolute cast over the hero; measure `.kn-makes-hook` and pin Reed’s hand with a layout
  effect (ResizeObserver + fonts.ready). Gate: `|hand−makes.right| < 40px` and `|hand−makes.midY| < 40px`
  at 1440×900. Brand line larger than “makes/motion.” `overflow-x: clip` (not hidden) so scrub sticky works.
- **Do not:** Trust percentage transforms alone to sell a character–type contact; pin to the glyph box.

## 2026-08-09 — `pipeline:agency-axis-isolation`

- **Failure:** Collapsing typography + spacing + motion into one “polish” pass (or a vibe prompt)
  produced one decent axis and two soft ones; marketing pages still read as first-draft AI.
- **Fix:** `agency-quality-site` skill + `pnpm agency:pipeline` enforce Phase 0 ban list, 3-ref
  board, five-block brief, then typography-only → spacing-only → motion-only → 375px with
  screenshots. `assertAgencyDelivery` + `applyAgencyPolish` encode the gates in
  `@tell/design-skills`. `primaryCta` on `DesignBrief` keeps the one action repeated.
- **Do not:** Ask for type, space, and motion in the same message; do not install external skill
  marketplaces into the repo — encode principles and run Tell gates.

## 2026-08-09 — `pipeline:one-phase-goal-loop`

- **Failure:** Running refs→build→type→spacing→motion→mobile in one `agency:pipeline` pass
  produced green gates but did not compound quality — polish CSS was applied without eye
  loops between axes, same failure mode as the article's "ask for all three at once."
- **Fix:** Phase-gated runner (`--phase` / `--reshoot` / `--mark-pass` / `--status`); craft
  `--all` refused. Skill + PROMPTS.md give Goal + Loop per phase; `current.html` carries
  forward only after `--mark-pass`. PLAN.md orchestrator Goal/Loop added.
- **Do not:** Execute the whole agency recipe in one agent turn and call it polished.

## 2026-08-09 — `pipeline:design-rigor-lanes`

- **Failure:** Agency pipeline had ban lists and polish axes but no explicit compositional
  lane / craft-node choice — builds stayed competent without a unique spatial thesis.
- **Fix:** `DESIGN_RIGOR.md` (thesis, one lane, 1–2 Tell crafts, honest assets, reject list).
  `DIRECTION.md` template requires those fields. `assertAgencyDelivery` adds rigor gates
  (no award claims, no fake trust theater, one motion system, authored hero). Glass check
  counts `.ds-glass*` markup only (shared CSS comments false-fired).
- **Do not:** Mix unrelated aesthetic systems in one pass; do not claim awards; do not
  treat quality as a trophy string in copy.

## 2026-08-09 — `agency:thin-board:portfolio-photography`

- **Failure:** Run orch-learn advanced with a thin/corridor reference board (category portfolio-photography).
- **Fix:** Fill research/boards.seeds.local.json for this category; keep corridor bands as fallback only.
- **Do not:** Treat empty seeds as a finished Phase 1 craft board.

## 2026-08-09 — `agency:thin-board:photography`

- **Failure:** Run dd-smoke advanced with a thin/corridor reference board (category photography).
- **Fix:** Fill research/boards.seeds.local.json for this category; keep corridor bands as fallback only.
- **Do not:** Treat empty seeds as a finished Phase 1 craft board.

## 2026-08-09 — `shell:empty-recent-thumb`

- **Failure:** Entry-home "Recent diagnoses" cards used empty flat `.tell-recent__thumb` fills —
  only mode/count chrome, no capture craft beat (same class as `showcase:nav-only-thumb`).
- **Fix:** `svgSessionThumb` / `thumbFromScreenshotBase64` write a compact craft plate (accent
  field + title + findings) into `RecentSession.thumbDataUrl`; EntryHome always renders an
  `<img>` (SVG fallback if storage lacks a thumb). Offline fixture uses violet→ink plate so the
  generic "before" reads as content.
- **Do not:** Ship recent/session galleries as blank surface tiles and call the shell done.

## 2026-08-10 — `sport:cricket-multipage-ia`

- **Failure:** Sport site research was ad hoc; CREASE stayed single-page hash-nav; no general
  website research graph for non-sport briefs; training emit not required on research.
- **Fix:** Parent graph `website-domain-research` (LoadPrior → gap → walkthrough → IA → training);
  `sport-matchday-web` extends it; `DomainResearchPack` + cricket Core six fields; generic
  `multipage-domain-capture.ts` + `emit-design-training-episode.ts`; anonymised multipage IA in
  `SPORT_SITE_VERNACULAR.md`; Phase 1 re-plan for `/crease/*` routes.
- **Do not:** Build website IA from blank slate when a domain pack exists; do not commit portal
  hosts/JSONL; do not ship matchday products as one hash page.
## 2026-08-09 — `motion:restraint-band-masks-lifeless-pages`

- **Failure:** Critique `motion-restraint` / `motion-speed` score 1.0 across briefs while templates
  still feel static — metrics only measure CSS transition share and duration, not choreography
  (hero entrance, stagger, scroll chapters, missable beats). Agency `3c-motion` Goal was
  “scroll-reveal + hover,” which capped craft at the same thin ceiling.
- **Fix:** Survey experts + 2026 stacks (`research/MOTION_ANIMATION_SURVEY.md`); product ladder
  in `docs/15_MOTION_ANIMATION_PLAN.md`; raise `3c-motion` contract; thicken motion sub-skills;
  seed gitignored `motion-corpus.local.json` for forensics. Next: presence metrics + CSS
  view-timeline / stagger render (W1–W3).
- **Do not:** Spray transitions to “fix” coverage; do not default WebGL; do not treat
  in-band restraint as proof that motion exists.

## 2026-08-09 — `motion:engine-choreography-ship`

- **Failure:** Templates only offered CSS hover + optional IO opacity fades; Taste enum stopped
  at `light-scroll-reveals`; critique could not fail “lifeless but restrained” pages.
- **Fix (RSI challenger):** Expand `MotionLevel` (+`scroll-narrative`,`immersive`); emit hero
  `ds-enter`, section `ds-stagger`, CSS `animation-timeline: view()` with IO fallback, one
  sticky `ds-chapter-pin` + progress; Studio/MCP options; forensics `choreographyScore` /
  `revealNodes` + critique dims (skipped for `none`/`subtle-micro`). Agency polish aligned.
  Unit tests 60/60; critique matrix ~96.5 with motion dims no longer in the weakest set.
- **Do not:** Import React Motion into HTML templates; do not dual smooth-scroll; do not
  weaken restraint bands to fake presence.

## 2026-08-09 — `motion:sitekind-signature-clips`

- **Failure:** Every revealing template shared the same translateY fade — clips of SaaS,
  consumer, foundry, etc. were interchangeable.
- **Fix:** `motionSignatureCss(siteKind)` overrides travel/easing/stagger/origin (and a few
  unique keyframes: foundry mask, press snap, dossier vertical chapter ink). Recorder
  `pnpm record:template-motion` writes `/opt/cursor/artifacts/motion-clips/*-motion.webm`
  plus manifest. Educational/fintech bumped to light-scroll-reveals so signatures play.
- **Do not:** Ship one shared fade for all offerings; do not add infinite ambient loops
  to “look different.”

## 2026-08-09 — `motion:unique-keyframes-verified`

- **Failure:** First signature pass only tweaked CSS vars; on-camera the clips still read as
  one vertical fade. Video review rejected uniqueness.
- **Fix:** Dedicated `@keyframes` per siteKind (`ds-saas-in`, `ds-consumer-in`,
  `ds-foundry-mask`, `ds-fin-in`, …) forced via `animation-name` on `.ds-reveal`/`.ds-enter`.
  Chromium probe confirms distinct `getComputedStyle().animationName` per template.
  `pnpm record:template-motion` writes 15 slowed clips + manifest under
  `/opt/cursor/artifacts/motion-clips/`.
- **Do not:** Trust var-only travel deltas as “unique motion”; verify computed animation-name
  (and a clip) before claiming uniqueness.

## 2026-08-09 — `motion:stack-craft-skill-and-instruments`

- **Failure:** Templates had signature keyframes but no skill encoding Three.js / D3 /
  free OSS motion stacks; instruments were not systematically customized per product.
- **Fix:** Ship `motion-stack-craft` skill + playbook; route whenever motion ≠ `none`;
  add product instruments (`.ds-draw` stroke-draw, `.ds-lattice-bar` enter, SaaS flow
  meters, immersive canvas2d field on lantern). Survey §§3.5–3.6 document D3 + OSS
  template adaptation rules. Tests 62 green.
- **Do not:** Paste OSS kits unchanged; do not CDN Three into marketing HTML by default;
  do not use D3 for non-data decoration.

## 2026-08-09 — `motion:instrument-spray-breaks-restraint`

- **Failure:** RSI audit found most siteKinds lacked body-level product instruments (only
  edu/observatory had real DOM motion hooks); loom shipped `animation:…infinite` shuttle CSS
  globally; giving every lattice amplitude bar a CSS `transition` blew observatory
  transition-coverage to 0.243 (band max ~0.154) and dropped matrix to 96.3.
- **Fix (RSI challenger):** Add feature-true `.ds-draw` on pipeline / wire / posture / dossier /
  ladder / path / interface / archive register; dens patches on press; cap lattice motion to
  ≤8 hot bars; shuttle once under `[data-sitekind="commerce-loom"]` only; immersive field only
  when `motion===immersive`. Critique recovered **96.5**; observatory **94.2**; eye shots show
  pipeline connector, lattice window, path atlas craft beats (not nav-only).
- **Do not:** Put transitions on every SVG child to “look alive”; verify restraint coverage
  after instrument ships; never leave infinite ambient loops in shared CSS.

## 2026-08-09 — `template:shared-marquee-proof-is-not-unique`

- **Failure (human):** Stamp Roll's "Why … earns trust in review / Why teams keep it / Proof ·
  declared scope" board appeared across almost every craft template — same page with product-name
  swaps after unique fold instruments.
- **Root cause:** Composition bolted shared `marquee-proof` onto archive, observatory, loom, field,
  press, lantern, foundry, dossier, studio, and consumer after their signature story sections.
  Fallback copy (`Why teams keep it`, `earns trust in review`, `declared scope · ships together`)
  made the clone unmistakable.
- **Fix:** Remove marquee-proof from craft kinds — entry / chrono / hangtag / range / gather / ember /
  marginalia / spread / chapters already prove. Keep marquee only for dashboard / fintech /
  corporate, each with distinct board chrome (stack / wire / spine). Expand per-siteKind eyebrows +
  pullQuotes. Basics gate now *forbids* `data-proof-board` on craft kinds and requires workflow or
  board on marketing kinds.
- **Do not:** Answer "make templates unique" by appending the same Proof board with renamed titles.
  Signature story instruments are the proof; a shared evidence marquee is cheating.

## 2026-08-09 — `template:archive-feature-rows-void-after-marquee-cut`

- **Failure:** After removing shared marquee-proof, Stamp Roll mid-page `feature-rows` left
  Cross stamps / Registry close as huge empty airways; entry folio was under-owned as proof.
- **Fix (Phase 9 loop 1):** Drop archive `features-2` feature-rows. Deepen `story-entry` with
  `ds-cross-stamps` seal strip + shelf-index aside. Shorten register claim (hide lede) so ledger
  owns more fold; keep display ≥3.16vw; thin stamp borders so rules/screen stays near band.
- **Eval:** archive **95.7 → 97.4**; foldFigure **0.34 → 0.43**; matrix **98.0**. Eye: fold shows
  register+ledger; mid-page shows hanging folio with related stamp seals (not empty rows).
- **Do not:** Fill a craft mid-page gap with a second generic feature catalogue. Put concept ink
  inside the signature instrument.

## 2026-08-09 — `template:studio-html-flow-foldfigure-zero`

- **Failure:** Fieldmark fold used HTML `flow` stage cards (interactive stepper). Critique
  `foldFigure=0` / score **94.5** — process steppers are not drawn matter and read as SaaS.
- **Fix (Phase 9 loop 2):** New SVG `work-board` (crop-marked selected-work plates + method rail)
  forced as studio hero; flow stays mid-page. Compact claim band so board enters the fold.
- **Eval:** studio **94.5 → 99.0**; foldFigure **0 → 0.38**; matrix **98.3**. Eye: fold shows
  crop-marked board, not a 01–04 stage strip.
- **Do not:** Park HTML steppers as the studio fold instrument and call it selected-work craft.

## 2026-08-09 — `template:foundry-cut-slips-not-second-catalogue`

- **Failure:** Glyph Press kept a second `feature-alternating` catalogue after marquee removal —
  same sparse-airway class as archive feature-rows.
- **Fix:** Drop foundry features-2. Add `ds-cut-slips` (optical-size companions) inside
  marginalia beats. Strip remaining craft `features-2` feature-rows across dossier/observatory/
  loom/herbarium/press/lantern/consumer.
- **Eval:** foundry held **96.7** (no regression); eye shows cut slips on the measure. Matrix **98.3**.
- **Do not:** Answer a thin craft mid-page by appending another generic feature catalogue.

## 2026-08-09 — `platform:mcp-compat-catalog`

- **Failure:** Tell only wrote Cursor MCP config; other hosts (Claude, Codex, OpenCode, Grok, Cline, …) had no `tell mcp install` parity with mainstream agent-compat tables.
- **Fix:** `PlatformId` + `buildPlatformCatalog` in `@tell/schema`, `platforms[]` on `InstallInfo`, CLI writers for json/toml/yaml/opencode/openclaw, README + Connect Agent table. Muse/Z Code remain snippet-only until paths are verified.
- **Do not:** Spawn third-party coding agents as Tell subprocesses — compatibility = MCP install into the agent Ashish already uses.

## 2026-08-10 — `template:field-press-essay-aside-clone`

- **Failure (human):** Field guide (#13) and Press atelier (#14) mid-page folds were the same
  essay-left + aside-list-right UI — only strings differed. Called out as cheating.
- **Root cause:** `renderRange` and `renderGather` both used the shared 7fr/5fr essay+aside
  family also used by entry/hang/ember.
- **Fix (Phase 9):** Field → dichotomous voucher key (`ds-range-ladder` + stacked
  `ds-range-sheet` couplets). Press → overlapping `ds-gather-forme` stack with registration
  corners + leading densitometer strip. Basics/tests assert markup divergence.
- **Eval:** field-herbarium **99.8**; press-atelier **94.0** (display-size under-band is the
  shared craft-claim class, not the new instrument). Eye: ladder+sheets ≠ densito+formes.
- **Do not:** Swap copy on a shared essay+aside grid and call craft templates unique.

## 2026-08-10 — `template:observatory-essay-aside-clone`

- **Failure:** Nightglass mid-page chrono was the same essay-left + time-index-aside family as
  pre-fix field/press — under-owned as an on-call instrument.
- **Domain:** `loadPriorDomain("signal-observatory")` — spans on a shared instrument-time ruler
  before prose; forbid essay+aside blank-slate mid-page.
- **Fix:** `ds-chrono-desk` with T+00h…T+24h ruler + staggered `ds-chrono-span` waterfall rows.
  Drop 7fr/5fr aside. Basics gate requires Event waterfall markup.
- **Eval:** observatory-signal **93.3** (display-size under-band is shared craft-claim class);
  eye shows ruler+spans, not essay+aside. Matrix **95.9**.
- **Do not:** Put a vertical bead essay beside a time list and call it an observatory desk.

## 2026-08-10 — `template:lantern-ember-essay-aside-clone`

- **Failure:** Ember Gate mid-page ember was essay-left + chapter-index aside — same clone family.
- **Domain:** `loadPriorDomain("lantern-path")` — zigzag waypoints on a spine; forbid essay+aside.
- **Fix:** `ds-ember-trail` center path with left/right alternating `ds-ember-step` panels.
- **Eval:** eye shows zigzag night trail ≠ waterfall / formes / voucher key.
- **Do not:** Mirror hangtag/entry aside lists for a night-walk chapter reading.

## 2026-08-10 — `template:loom-hangtag-essay-aside-clone`

- **Failure:** Commerce loom hangtag was essay-left + size-index aside — last clear twin of the
  shared craft mid-page family.
- **Domain:** `loadPriorDomain("commerce-loom")` — size tape + swing care tags before prose.
- **Fix:** Horizontal `ds-hang-tape` + overlapping `ds-hang-tag` stack with eyelets/strings.
- **Do not:** Put a size list in a right aside and call it merchandising craft.

## 2026-08-11 — `crease:category-directory-enrich`

- **Research:** Category cricket portals expose fixtures, teams, players, stats/records,
  commentary, partnerships, FoW, points tables, and dual-axis rankings beyond Core six —
  as directory/footer surfaces, not primary-nav sprawl (host names omitted).
- **Fix:** Crease specimen adds `/crease/fixtures|teams|players|stats`; deepens live/scorecard/
  series/rankings/home; pack routes = Core six + secondary; primary nav stays ≤6.
- **Gate:** `pnpm verify:crease-scorecard` for baseline-aligned boards; all ten routes 200.
- **Do not:** Grow primary nav past 6 with commerce before score.

## 2026-08-11 — `sport:tennis-baseline-nested-spine`

- **Failure:** Tennis packs had category gaps (flattened score, hidden server, no pressure text)
  and empty multipage IA — blank-slate risk for matchday builds.
- **Research:** `loadPriorDomain("sport:tennis")` → gap-diff → Core six under `/baseline/*`;
  format lens best-of-3 / best-of-5; light-airy taste seed.
- **Fix:** Enrich tennis vernacular pack + BASELINE specimen (nested sets|games|points, server
  marker, textual BREAK/SET/MATCH POINT, surface rankings, notebook separated from glance-live).
- **Do not:** Flatten tennis to a single scoreline or hide who is serving.

## 2026-08-11 — `site:media-webp-autoload`

- **Failure:** Specimen photography shipped as multi-MB JPEG; loading opts and research/craft
  skills required a human to ask to wire them.
- **Fix:** `pnpm media:site` (display-sized WebP + prune) auto-runs at end of `agency:run`;
  `SiteImg` applies lazy/LCP/CLS defaults; always-applied `tell-site-build-autoload` + expanded
  `responsive-performance` / `tell-domain-research` require executing routed skills without prompt.
- **Do not:** Commit hot-path multi-MB jpg/png heroes or wait for “convert to webp / run research”.

## 2026-08-11 — `template:skill-metadata-only`

- **Failure:** New templates / agency runs listed `website-domain-research`, craft nodes, and
  `responsive-performance` in `routedSkills` / hints, but runs could ship without merging
  `followOnCraft`, expanding agency craft aliases, emitting an executable research checklist,
  or failing when wiring was incomplete. Skills looked “on” while remaining advisory.
- **Fix (RSI challenger):** `assertSkillWiring` hard-gates researchPlan + responsive HTML markers
  + followOnCraft/craftNodes merge; folded into `assertBasics`; agency `2-build` writes
  `RESEARCH_GATE.md` + `SKILL_WIRING.json` and fails the phase if wiring is red; `4-ship` runs
  `media:site`; AUTO_PLAN documents the skill checklist every run.
- **Do not:** Treat `customizationHints` “Research gate: …” as proof that research/craft/optim
  executed — require `assertSkillWiring` green + RESEARCH_GATE checklist.

## 2026-08-11 — `template:care-claim-starves-plate`

- **Failure:** Roundspool care-pathway fold put masthead + full claim + fold CTAs above the
  care-plate, so the pathway spine sat near y≈470–900 — unique craft below the fold.
- **Cause (secondary):** masthead used `padding-top: calc(var(--nav-h) + …)` while sticky nav is
  already in-flow → double nav offset (~110px mast) pushed plate past the 360px eye gate.
- **Fix:** Hide fold `.ds-actions` (nav keeps CTA); compact claim; drop masthead `--nav-h`
  padding; raise spine to `H * 0.4`; plate min-height ~78vh; three ENC callouts.
- **Do not:** Re-add nav-height padding on in-flow craft mastheads, or treat a unique plate as
  shipped when the fold shot is only type chrome.

## 2026-08-11 — `template:animation-name-zeroes-duration`

- **Failure:** Care-pathway enter motion looked dead — `animation-name: ds-care-in` alone
  overrode the shared `.ds-enter` shorthand and left duration at 0s when `--m-entrance` was
  unset at shorthand parse time. Same bug left lantern-path fold claim at opacity 0 (display
  invisible → critique measured body leading as display).
- **Fix:** Full `animation:` shorthand on siteKind `.ds-enter` with named keyframes,
  `--m-entrance` fallback, `forwards`, and stagger delay (care + lantern).
- **Do not:** Override only `animation-name` on siteKind enter rules.

## 2026-08-11 — `template:care-hairline-bead-chrome`

- **Failure:** 1.5–2px spine strokes + 2px bead rings + box-shadow rings tanked hairline ratio
  on care-pathway (observatory lesson).
- **Fix:** 1px spine/bead/borders; no bead ring shadow; geometric diamond handoff (never ◆ emoji).
- **Do not:** Decorate clinical spines with multi-px chrome or emoji markers.

## 2026-08-11 — `template:care-near-silhouette-residue`

- **Failure:** Fold foot used dark clipboard/vial/cuff clip-path silhouettes — read as unfinished
  AI chrome and fed near-black surfaces into AcidAccentTell.
- **Fix:** Replace with citeable `ds-care-imprint` (edition + ward + stages) layered over the
  plate on paper/accent-surface; drop `ds-care-near` / `ds-chart-clip`.
- **Do not:** Park opaque near-black decorative silhouettes under a clinical plate.

## 2026-08-11 — `template:care-paper-frame-gradient-crutch`

- **Failure:** `light-airy` routed `paper-technical-frame` → inverse outer field + hatch
  `repeating-linear-gradient` → GradientCrutchTell + AcidAccentTell on Roundspool.
- **Fix:** Exclude `care-pathway` from paper-technical routing; force `body` to solid `--c-paper`
  with a fixed 1px stage spine (`::before`), not body background-image gradients.
- **Do not:** Put a ward chart inside the inverse paper-technical envelope.

## 2026-08-11 — `template:care-feature-index-list-run`

- **Failure:** Mid-page features used `ds-index` list — same archetype run as rounds ladder →
  shape-repetition 0.545 (over band) and a twin of SaaS capability indexes.
- **Fix:** Care-only `ds-handoff-strip` horizontal stage grid (Intake→Discharge cells + diamond
  handoffs). Alignment collapsed via `--care-inset`. Critique: care **98.5**, axes **4**,
  shape-run **0.364**.
- **Do not:** Ship another vertical index under a vertical rounds ladder.

## 2026-08-12 — `audit:smooth-scroll-false-collision`

- **Failure:** Layout-audit scrolled the page then `window.scrollTo(0,0)`. With
  `html{scroll-behavior:smooth}`, long pages left residual `scrollY` (often 4–22px). Sticky
  nav stayed at the viewport top while the hero's border box moved under it → false
  `collision nav / hero` on dossier, docs, saas, fintech.
- **Fix:** Audit ritual uses `scrollTo({ top, behavior: "instant" })` and resets
  `documentElement.scrollTop` / `body.scrollTop` before measuring.
- **Do not:** Treat residual smooth-scroll as a packing bug, or weaken the collision gate.

## 2026-08-12 — `template:color-mix-not-vacancy-matter`

- **Failure:** Ruled fills and craft panels used `background: color-mix(...)`. The vacancy
  probe only treats `rgba(...)` backgrounds as matter, so full-width “fills” were invisible
  and wrap-wide holes stayed (dossier spread, care rounds, loom hang, pricing heads).
- **Fix:** Opaque `background-color: var(--c-paper)` / `--c-paper-sunken` / `--c-border` on
  shelf rules, page fills, hang tags, proof cells, FAQ items; full-width SVG marks with fixed
  height so the matter grid paints.
- **Do not:** Count on `color-mix` or transparent rails to fill a vacancy hole the probe can see.

## 2026-08-12 — `template:catalogue-prose-triple`

- **Failure:** Same ≥45-char feature sentence painted in hero lede + features + story chapters
  + flow band / proof cells (studio 4×, press/consumer/corporate 3×) → layout-audit repetition.
- **Fix:** Expand `quietIndex`; titles-only figure steps + proof hits; flow band uses stage
  meta not body; `ds-chapter-quiet` drops body column (and the empty 1fr vacancy that followed).
- **Do not:** Reprint catalogue prose in every instrument that already names the capability.

## 2026-08-16 — `template:vacancy-slab-not-rule-flood`

- **Failure:** Aug 12 vacancy fills used 32–40 CSS-bordered shelf rows (`ds-entry-shelf-rule`)
  plus 12×2 spread fill-rule 2px spans. `composition.ruleDensity` counts wide top/bottom-only
  borders and `height ≤ 3px` bars — not SVG. Dossier/archive/loom blew rules/screen (band ≤4.33).
  Empty sunken rectangles then read as `ledger-cell-void`.
- **Fix:** One opaque `ds-story-fill` slab with a full 1px box border and SVG `miniPageMatter`
  plates. Spread page fill is a single `ds-spread-page-fill`. Lantern bleed/beads/plate crops
  at 1px; ember panels opaque paper. Dossier masthead `padding-top: var(--s-xs)` (no `--nav-h`).
  Gate `no-rule-flood-fill`.
- **Do not:** Fill wrap-wide holes with dozens of CSS hairline rows, or ship an empty sunken
  rectangle and call vacancy closed.

## 2026-08-16 — `template:register-faq-mint-axes`

- **Failure:** Alignment-axes band is 3–6. Archive/loom sat at 9; dossier/foundry/observatory/
  lantern at 8. Causes: 4-col index/chapter (title + body + mark lefts), extra `margin-left`
  on rail siteKinds (overwritten unless last in `siteKindCss()`), 2-col FAQ, paper-technical
  `#main` inset vs nav (~12px), FAQ `p { width:100% }` stealing body measure (145ch).
- **Fix:** 2-col register (rail | stacked title+mark) **appended at end of `siteKindCss()`**;
  1-col FAQ with `padding-inline:0` and `max-width:62ch`; flatten paper-technical `#main` on
  those six siteKinds (care-pathway pattern). Quiet chapters on the same kinds.
- **Do not:** Put collapse rules in the generic sheet — `siteKindCss()` is emitted last and
  wins. Do not let FAQ prose run the full wrap-wide measure.

## 2026-08-16 — `template:grid-absolute-first-child-row`

- **Failure:** Ember zigzag empty cells tripped layout-audit vacancy after the paper frame
  flattened (hole ≥28% vw). A `ds-ember-rest` fill on `data-side=left` painted 2px tall
  because `.ds-ember-bead` (first child, `position:absolute`) still auto-placed into grid
  cell (1,1), pushing the panel to row 2.
- **Fix:** Bead `grid-column:1 / -1; grid-row:1`; rest + panel explicit `grid-row:1` and
  matching columns; `align-items:stretch`.
- **Do not:** Assume `position:absolute` grid children skip auto-placement.

## 2026-08-16 — `readme:fold-owns-claim-and-figure`

- **Failure:** README fold stills scrolled to the inner field/plate then nudged into
  `.ds-plate-bleed` whenever `scrollY < 120`. First-five folds lost the claim and showed a
  sparse SVG (dashboard 3KB dark timeline, educational floating labels).
- **Fix:** Capture the `*-fold` wrapper (claim + instrument). Skip nested-plate nudge when
  the named selector already matched. Demo recorder uses EntryHome Live URL composer, not
  `input[type=url]`. Poster from ~8s (report findings + captured/reconciled), not t=2 home.
- **Do not:** Treat the nested figure as the fold if the signature is a split claim | instrument.

