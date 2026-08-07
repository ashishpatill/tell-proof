# Design research loop ledger

One row per loop of the `design-research-loop` skill. A loop is only closed when the craft score is
re-measured and recorded here, including the side effect — there is always one.

Anonymisation applies to this file like everywhere else: references are `ref-0NN` and category
buckets, never names, hosts, or URLs.

---

## Loop 1 — build the instrument

- **Goal:** stop arguing about design quality and start measuring it. Build a Playwright forensics
  harness that visits reference pages, extracts typography, colour, space, layout, shape, motion,
  and performance, and writes anonymised records.
- **Corpus:** 55 references across 20 category buckets; 53 usable after the render filter.
- **Score:** — → 84.4 (first measurement of the engine against corpus-calibrated bands)
- **Closed:** nothing yet; this loop only produced the ruler.
- **Side effects:** two instrument bugs surfaced immediately — a body-text probe that was selecting
  clipped 1px elements, and percentage border radii resolving to enormous pixel counts. Both fixed
  in the probe and the sanitiser rather than worked around downstream.
- **Qualitative:** the generated pages were pale, evenly-weighted, and read as competent templates.
  Nothing on any of them was the thing your eye landed on first.
- **Next weakest:** neutral temperature (0/100), section weight variation (16), median text
  contrast (55).

## Loop 2 — colour and contrast

- **Goal:** bring neutral temperature and median text contrast into band without losing the
  surface-layer count.
- **Corpus:** 55 references (unchanged).
- **Score:** 84.4 → 95.8
- **Closed:**
  - Neutral temperature — 6.9–11.3 → 0 (band 0–4.3). The corpus was blunt about this: 37 of 53
    usable references measure a neutral saturation of exactly zero. Their greys are literal
    `rgb(255,255,255)`, `rgb(17,17,17)`, `rgb(119,119,119)`. The engine had been seeding every
    neutral with a whisper of the accent hue on the theory that a tinted grey reads as "designed".
    Measured against real pages, that theory is backwards — a hue smeared through the whole ramp is
    a colour cast, and it is one of the loudest generated-UI signals there is. Warmth now lives in
    the paper stock and the accent family only, and the ink ramp is generated as literal greys.
  - Median text contrast — 7.9–9.2 → 10.1–10.6 (band 11.06–21), then to band in loop 3. Introduced
    a fourth ink role (`--surface-body`) and moved every tone that is read at length onto it.
  - Section padding, hairline ratio, container width, radius steps, above-fold CTA count and the
    webapp composition all moved into band in the same pass.
- **Side effects:** the semantic-markup correction (feature cards became list items rather than
  `<article>` elements) changed the measured section-padding population, because the probe counts
  `article` as a section. The markup is now more correct *and* the measurement is cleaner, but this
  is a reminder that the instrument sees tags, not intent.
- **Qualitative:** the pages read as authored rather than assembled. The webapp page in particular
  went from "here is a table" to "here is a claim, and here is the interface that backs it".
- **Next weakest:** section weight variation (16/100).

## Loop 3 — rhythm, and a correction to the instrument

- **Goal:** raise section weight variation from ~0.27 into the measured corridor of 0.539–1.142.
- **Corpus:** 55 references, re-measured with a corrected probe.
- **Score:** 95.8 → 97.1 on the old bands, then re-baselined against the corrected corpus.
- **Closed / corrected:**
  - Gave the three quiet beats — hero, statement, closing band — a full screen each, which is how
    reference pages buy the contrast between a sparse screen and a dense one.
  - **Instrument correction.** Reading the raw band data showed the corridor itself was partly an
    artefact. Several references reported hundreds of thousands of characters in their first band,
    which is not density — it is one element holding a serialised payload. Band weight now counts
    only painted elements and caps any single element at a paragraph, and a geometry-only companion
    metric (`inkVariationCoef`, the share of each band actually covered by painted boxes) was added
    so rhythm can be measured without depending on how text is chunked into elements. The corpus
    was re-measured and the bands recalibrated.
- **Side effects:** correcting the probe also cleaned the text-contrast sample, since clipped
  zero-area text was previously being counted as text a reader is asked to read.
- **Qualitative:** the scroll now has beats. A statement gets a screen, the specification table gets
  a screen, and the two do not feel like the same section with different words in it.
- **Next weakest:** recorded after the recalibration run — see `research/critique.json`.

---

## Loop 4 — draw the page

- **Goal:** stop generating type-on-paper manuscripts. Measure composition (bleed, figures, tone
  bands, shape variety, layering) on the corpus, then make the engine produce drawn matter that a
  buyer can look at.
- **Corpus:** widened to 93 references / 32 categories; 82 usable after render filter. Composition
  probe added and bands recalibrated.
- **Score:** ~96.2 (post-recalibration) → 97.7 with content-derived figures in place.
- **Closed:**
  - Figure system (`figures.ts`) — interface plates, series charts, flow/stack diagrams, horizon
    plots, capability marks, metric sparks, signature mark. Deterministic, token-driven, no images.
  - Fold and specimen bands carry drawings; type-scale outliers from decorative SVG text removed
    by constructing the closing mark and consolidating figure type onto a page ladder.
  - Editorial allocation so each claim is made once.
- **Side effects:** SVG hairlines scaled below 1px until `vector-effect: non-scaling-stroke`; dark
  specimen bands needed `--c-ink-body` emitted to keep figure prose readable.
- **Qualitative:** pages stopped reading as a white document. The fold shows a product surface;
  the specimen is a full-bleed drawing. Still too many empty half-columns and hairline grids.
- **Next weakest:** band variation, rule density, layering, vacancy the score could not see.

---

## Loop 5 — dead space, rules, depth

- **Goal:** kill the empty half-screens a person sees before any number moves; cut decorative rules
  into corridor; add deliberate layering across band boundaries.
- **Corpus:** unchanged (82 usable).
- **Score:** 97.7 → 98.3 (mid-loop) → 99.8
- **Closed:**
  - Layout audit gained a two-dimensional vacancy detector (largest empty rectangle inside the
    content column) and a ghosting detector. One-dimensional row scanning had been reporting split
    layouts as full because every row had ink somewhere.
  - Sticky nav made opaque; specimen and closing bands size to content; story/FAQ registers use a
    spread head over a two-column grid instead of a left-column void beside a list.
  - Figure rules drawn only between things; bonded section pairs (pricing→compare, app→features,
    compare→faq) create density peaks; statement band tall enough that a measured strip lands
    entirely inside it.
  - Section hangs (specimen, metrics, app, closing, recommended plan, staggered cards) bring
    layered-elements into corridor without shadows.
  - Conversion fold gives the figure the majority track; radius ladder painted on plates/marks so
    editorial pages are not stuck at two radii.
- **Side effects:** intentional hangs initially flagged as collisions — the audit now recognises a
  declared negative margin the same way overflow already did. Equal `6fr 6fr` conversion columns
  had been hiding asymmetry; restoring `5fr 7fr` on the fold recovered drawn-matter-above-fold.
- **Qualitative:** the story screen no longer has a blank left half. SaaS and dashboard critique
  briefs score 100. Corporate fold reads as a composed surface (display, horizon, warm stock), not
  a template. Holdout still trails by ~1 pt on fold figure and accent — generalises, not overfitting.
- **Next weakest:** holdout fold-figure (0.24 vs band 0.34), docs rule density (4.83 vs 4.33), accent
  coverage on cool-neutral pages.

## Loop 6 — kill the empty proof void (eye over score)

- **Goal:** the Sequence screen opened under a grey 140vh statement with almost no matter — a metric
  hack that no buyer would ship. Raise color, layering, and chapter density so the page reads as
  product work rather than a wireframe.
- **Corpus:** unchanged (82 usable).
- **Score:** 99.8 → 97.7 (deliberate). Section weight variation fell because the empty full-screen
  statement was removed; that score was gamed. Prefer the eye.
- **Closed:**
  - Statement band sizes to quote + three feature-grounded proof chips + mark; hangs into Sequence.
  - Body/hero/proof atmosphere washes; inverse tinted with accent temperature (not purple mesh).
  - Accent hues moved off the violet AI cluster (steel/teal/olive-copper).
  - Sequence: raised surface, bonded after proof, filled chapter bodies, ordinal+copy grid, accent rail.
  - Conversion lean: accent lead cards, metric cells, proof chip borders.
- **Side effects:** craft score dropped ~2 pts; holdout gap widened slightly (OVERFIT flag). Do not
  reintroduce empty bands to recover band variation.
- **Qualitative:** the grey void above Sequence is gone. Proof reads as a dark composed band with
  evidence. Sequence still needs more drawn matter and less card-grid air before it matches top-tier
  expert templates — next loop should put a figure into the story register, not pad height.
- **Next weakest:** section weight variation (honest), dashboard accent coverage, drawn-matter share.

## Loop 7 — kill lonely-quote proof (showcase bar)

- **Goal:** the inverse “WHY TEAMS KEEP IT” band still read as a toy — one paragraph on black with
  empty air. Replace with a dense proof stage buyers would put in a portfolio.
- **Corpus:** unchanged.
- **Score:** ~97.7 (eye-led; not chasing the prior 99.8 gaming peak).
- **Closed:**
  - `marquee-proof` layout: claim + lit paper product plate on dark stage + 5-cell evidence register
  - Accent-surface lead cells; figure forced onto paper tokens so contrast holds on inverse
  - Sequence becomes a spined register (no odd-count card-grid hole)
  - Brand mark restored as a hero-level signal; attribution is scope, not “how to read this page”
- **Side effects:** more uppercase micro-labels on SaaS; shadow on the lit plate trades a point of
  shadow-coverage band for readable product matter on dark.
- **Qualitative:** proof can no longer collapse to a lonely quote. Still short of top-tier expert
  uniqueness — next: richer drawn marks and less generic register chrome.
- **Next weakest:** uniqueness of marks, dashboard accent, honest band variation without voids.
- **Keep decision:** This SaaS conversion offering (proof stage + spined sequence + brand-first fold) is the locked template to deepen — not replace. Further loops raise uniqueness inside this structure.

## Loop 8 — plumbing floors + denser authored matter

- **Goal:** absorb implementation floors from peer design-builder plumbing (opaque stack, scroll-margin,
  z-scale, focus-ring token, text-wrap, lit plates) and deepen the locked SaaS structure so proof /
  sequence cannot read as empty chrome.
- **Corpus:** unchanged.
- **Closed:**
  - Basics gate: scroll-margin, z-index scale, focus-ring token, text-wrap pretty/balance, proof-board
  - Corner-bracketed lit plates; specimen→proof seam tightened; conversion hero more figure-majority
  - Sequence rows carry capability marks; bonding meta strips replace empty airways
  - Eyebrow / proof meta moved off screaming uppercase (reduces chrome noise)
- **Side effects:** none intended to score-game; eye check is the gate.
- **Qualitative:** page should read as a filled instrument with product matter on dark, not a quote void.
- **Next weakest:** mark uniqueness, dashboard accent coverage, holdout fold figure.
- **Status:** plumbing absorbed into basics gate; locked SaaS structure deepened. Not converged —
  holdout gap still >3 pts and qualitative uniqueness still short of authored expert work.

## Loop 9 — hard-corpus composition into locked SaaS

- **Goal:** raise fold-figure and page-figure share toward premium-b2b / art-directed-studio medians
  (~0.7–1.0 fold, ~0.4+ page) without naming third parties; keep the locked template.
- **Evidence used:** category aggregates for `premium-b2b-saas`, `art-directed-studio`,
  `fintech-product`, `consumer-craft`, `brand-agency` (figure area, bleed, layered elements).
- **Closed:**
  - Conversion SaaS fold becomes spanning product under a short claim (hero-statement)
  - Stronger hang into metrics; more layered overlaps on index/chapters/proof cells
  - Lit brackets on the full-bleed fold plate
- **Side effects:** split-fold brochure look retired for conversion SaaS only.
- **Next weakest:** holdout gap, alignment axes ≥3, drawn-matter share into band.

## Loop 10 — challenging designer/project corridors into locked SaaS

- **Goal:** absorb craft from hard local-corpus categories (premium-b2b, art-directed studio,
  fintech product, brand agency, personal-craft typography) into the locked SaaS template —
  raise drawn-matter share and fold ownership, close holdout overfit, without naming third parties.
- **Evidence used (anonymised ids only in committed artifacts):**
  - premium-b2b: foldFigure median ~0.89, figureArea ~0.45, layeredElements ~38, many figures
  - art-directed-studio: foldFigure median 1.0, large composed surfaces owning the fold
  - fintech-product: bleedBands median ~13, invertedShare ~0.7, dense inverse registers
  - brand-agency / solo portfolio: high alignment axes, figure area ~0.5+
  - personal-craft: typography spine / large gutters / shared left edges (not figure-led)
- **Closed:**
  - All `saas-marketing` leans use spanning product fold (system-crafted holdout was still split)
  - Band target height 780→880; horizon/series band fills; hero/specimen SVG min-heights ~74/70vh
  - Capability marks enlarged (viewBox + CSS) so registers contribute drawn matter
  - Soft-brand / client-hex accent surfaces and atmosphere dialed down (holdout accent ~0.69 → corridor)
  - Dashboard prose measure floor; softer lead-cell washes (rails over floods)
- **Score:** matrix ~98.1 → **98.2**; holdout **91.2 → 96.8** (gap 1.4 pts — generalises).
- **Side effects:** figure-first overclaim fold recovered fold-figure into band; soft-brand accent
  flood closed; unifying every section to one wrap collapsed alignment-axes to 1 (reverted to
  wide product / prose argument split + section-head spine).
- **Still open (honest):** section weight variation without empty-height gaming; corporate/holdout
  alignment-axes at 2; rule-density slightly over ceiling on dense briefs.
- **Keep decision:** Locked SaaS structure unchanged — deepen from hard corridors only.
- **Qualitative:** fold reads as product-owned (studio/B2B pattern); proof stays a lit board; sequence
  keeps marks. Not yet “multi-million shipped” uniqueness, but no longer a split brochure or accent wash.

## Loop 11 — fifth offering: fintech trust + quiet specimen rhythm

- **Goal:** add a measured demand-gap offering (fintech inverse/bleed ≠ SaaS conversion) and raise
  section-weight variation honestly by quieting the specimen beat; keep iterating all templates.
- **Evidence used:** fintech-product category (invertedShare ~0.7, bleedBands ~13, fold figure ~0.88).
- **Closed:**
  - New `fintech-marketing` siteKind + `fintech` template + `/showcase/fintech` + critique brief
  - Inverse-heavy plan: metrics / specimen / proof / cta on inverse; lit paper plates on dark stages
  - Specimen band type-led (titles only) + short head — char valley without empty height
  - Shared `--align-rail` across section heads / chapters / indexes
- **Score:** matrix **99.2**; fintech-trust **100**; saas **99.7**; corporate **99.4**; holdout **98.4**
  (gap 0.7 — generalises).
- **Still open:** dashboard section-weight variation (~0.24) — shell density spans multiple bands;
  docs rule-density slightly over ceiling.
- **Qualitative:** fintech reads as a money-product stage set (dark valleys, lit product plates), not
  a recolored SaaS page. SaaS fold still product-owned. Satisfactory to ship and keep deepening.

## Loop 12 — sixth offering: art-directed studio

- **Goal:** fill the art-directed-studio demand gap (fold figure ~1.0, invertedShare ~0, large display)
  with a paper-led selected-work plan — not a recolored SaaS/fintech skeleton. Iterate with critique
  + Playwright eye until satisfactory.
- **Evidence used:** art-directed-studio category (foldFigure median 1.0, figureArea ~0.57,
  invertedShare ~0, display high corridor, alignment axes ~4). Open-design craft notes only for
  anti-slop / editorial hierarchy plumbing checks already encoded in basics.
- **Closed:**
  - New `art-directed-studio` siteKind + `studio` template + `/showcase/studio` + critique brief
  - Plan: overfigure fold → raised metrics → alternating selected work → sunken specimen → method
    story → scrub figure → index → raised proof → FAQ → single inverse CTA (no pricing)
  - Cool light-airy + steel accent (escape cream/terracotta AI cluster); flow-owned fold surface
  - Basics gate: ≤1 inverse, feature-alternating + story/figure, spanning overfigure
- **Score:** studio-selected **99.7** (was 100 before cool-mood retune; matrix **99.3**); holdout **98.4**
- **Qualitative:** fold shows layered claim-over-sequence (not brochure split); scroll stays paper;
  method + scrub figure read as studio craft. Satisfactory to ship; next gap is consumer-craft.

## Loop 13 — seventh offering: consumer craft

- **Goal:** fill the consumer-craft demand gap (figureArea ~0.68, foldFigure ~0.73, display ~3.2vw,
  little inverse) with a voice-led product landing — not SaaS pricing theatre or studio editorial.
- **Evidence used:** consumer-craft category medians; Playwright fold + scroll slices.
- **Closed:**
  - New `consumer-craft` siteKind + `consumer` template + `/showcase/consumer` + critique brief
  - Plan: product overfigure → raised metrics → alternating in-hand register → quiet horizon
    specimen → scrub figure → rows → raised proof → day-in-use story → FAQ → one inverse CTA
  - Moderate display (~4vw); teal brand accent; site-kind CTAs ("Order yours") instead of plan compare
  - Basics gate: no pricing, feature-alternating, ≤1 inverse, spanning overfigure
- **Score:** consumer-craft **100**; matrix **99.4**; studio **99.7**; fintech **100**; holdout **98.4**
- **Qualitative:** fold is a product surface under a short claim; scroll stays paper with a quiet
  specimen valley; copy no longer asks to "Compare plans". Satisfactory to ship.

## Loop 14 — Fieldmark overlap fix + template-craft skill

- **Goal:** kill Fieldmark text collision (stage labels under lede) and encode the open-design →
  designer-corridor loop as a reusable skill.
- **Plumbing (open-design first):** studio/consumer leave absolute overfigure. Stack fold —
  opaque `ds-hero-claimband` in document flow, then labeled figure. Same idea as opaque sticky nav:
  underlayer ink must not share the type's box. Compact claim so figure still enters the fold.
- **Skill:** `.cursor/skills/tell-template-craft/SKILL.md` — Phase A plumbing from open-design
  craft/, Phase B anonymised corridors + screenshot contract. Listed in `AGENTS.md`.
- **Basics:** studio/consumer require `ds-hero-stackfold` + `ds-hero-claimband`.
- **Score:** matrix **99.4**; studio-selected **99.8**; consumer **100**; holdout **98.4**.
  Also fixed siteKind CSS being trapped inside the system-crafted lean branch (studio/consumer
  overrides never applied under refined-story).
- **Qualitative:** Playwright reports 0 label/claim intersections; claim ~505px / figure ~330px in
  fold; sequence stages read clean on the slice below. Screenshot proof for `/showcase`,
  `/showcase/studio`, Fieldmark fold + figure.

## Loop 15 — eighth offering: editorial foundry (RSI)

- **Goal:** fill the type-foundry / personal-craft / editorial-longform demand gap with a template
  that is structurally hard to replicate from a theme pack — hard-seam fold, type ladder, spine,
  marginalia, colophon — and dogfood the engine until critique + eye pass.
- **Failure named (champion):** seven offerings still shared SaaS/studio fold grammars; nothing in
  the catalog forced a typography-spine composition or a non-text optical-size figure.
- **Challenger:** new `editorial-foundry` siteKind + `foundry` template (`Glyph Press`) with engine
  craft the prior kinds do not emit:
  - `hero-seam` layout — paper claim | inverse type-ladder plate joined by a hard accent edge
  - sticky vertical typographic spine
  - `type-ladder` figure (constructed glyphs, not SVG `<text>` — SVG text polluted display metrics)
  - `story-marginalia` essay with outer-column notes + full-bleed measure rules
  - paper colophon close (no inverse demo theatre, no pricing, no metrics band)
- **Score:** matrix **99.3**; foundry-editorial **98.6** (was 86.3 before ladder glyph fix);
  holdout **98.4** (gap 0.8 — generalises). Prior matrix ~99.4; no regression on locked SaaS/studio/consumer.
- **Closed:** type-probe pollution from ladder SVG text; layeredElements hang CSS; basics gate
  `kind-foundry`; showcase `/showcase/foundry` featured on gallery.
- **Side effects:** foundry ink-variation slightly above corridor ceiling (1.12 vs 0.96) — acceptable
  for a hard-seam fold that must stay dense on one half; do not empty the ladder to game the band.
- **Qualitative:** fold reads as a foundry specimen board, not a recolored SaaS page. Hard seam +
  spine + constructed optical sizes are craft a generic design engine will not invent from controls.
- **Next weakest:** dashboard band-variation; foundry coverage variation; deepen foundry uniqueness
  (second letter clarity on ladder, richer marginalia marks) without score-gaming.

## Loop 16 — ninth offering: research dossier (RSI)

- **Goal:** fill the capital-brand / research-editorial / editorial-brand demand gap with a template
  structurally hard to replicate from a theme pack — folio masthead, chapter rail, dossier plate,
  verso/recto footnotes, imprint — and dogfood the engine until critique + eye pass.
- **Failure named (champion):** eight offerings still lacked a magazine/briefing grammar; nothing
  forced a cartographic plate, sticky chapter rail, or footnote register.
- **Challenger:** new `research-dossier` siteKind + `dossier` template (`Meridian Atlas`) with craft
  prior kinds do not emit:
  - `hero-folio` — volume/issue masthead + quiet claim + spanning dossier plate
  - sticky `ds-chapter-rail` — numbered briefing chapters on the right edge
  - `dossier-plate` figure (coordinate grid + pin callouts; mono labels only — foundry SVG-text lesson)
  - `story-spread` — verso/recto opening with center gutter + footnote register
  - full-bleed accent rules + paper imprint (no pricing, no metrics theatre, zero inverse)
- **Score:** matrix **99.1**; dossier-research **98.1** (was 94.9 before fold hang + type consolidation);
  holdout **98.4** (gap 0.7 — generalises). Prior matrix ~99.3; no regression on locked SaaS/studio/consumer/foundry.
- **Closed:** fold-figure into band by compacting claim and hanging the plate; display into band;
  type-steps 17→15; denser stack specimen cut ink-variation 1.26→1.10; basics gate `kind-dossier`;
  showcase `/showcase/dossier` featured on gallery.
- **Side effects:** dossier ink-variation still slightly above corridor ceiling (1.10 vs 0.96) —
  acceptable for a plate-owned fold that must stay dense; do not empty the plate to game the band.
  Type-steps at 15 (ceiling 14) — one micro size remains; do not collapse mono hierarchy further
  into illegibility.
- **Qualitative:** fold reads as a capital briefing folio, not a recolored SaaS/foundry page. Chapter
  rail + cartographic pins + verso/recto footnotes are craft a generic design engine will not invent
  from taste controls.
- **Next weakest:** dashboard band-variation; dossier type-steps ceiling; deepen dossier uniqueness
  (richer pin legend, imprint edition marks) without score-gaming.

## Loop 17 — showcase craft-reel filmstrip (RSI)

- **Goal:** finish the earlier cinema/GIF showcase intent — gallery must show best craft beats as
  live reels, with Research Dossier featured, not a text list of hover thumbs.
- **Failure named (champion):** `SpecimenPreview` cinema existed, but `/showcase` still presented as
  a spine register list; beat discovery skipped spread/imprint; thumbs only scrubbed on hover.
- **Challenger:** redesign gallery as craft stage + filmstrip; enrich beats; autoplay in view.
- **Eval:** Playwright eye — featured `NOW PLAYING · RESEARCH DOSSIER`, `data-playing=true`,
  craft beat ≠ nav; filmstrip cells show REEL chrome; typecheck green.
- **Closed:** `/showcase` stage + sprocket filmstrip; dossier featured; beat discovery for
  folio/seam/spread/imprint; chapter-rail hidden in preview chrome; learning `showcase:list-not-reel`.
- **Side effects:** featured is excluded from the strip (8 cells) — intentional so the stage owns it.
- **Qualitative:** gallery reads as a specimen cinema, not a sitemap of offerings.

## Loop 18 — tenth offering: signal observatory (RSI)

- **Goal:** fill the enterprise-observability / enterprise-data / award-index demand gap with a
  template structurally hard to replicate from a theme pack — chronometer fold, scrub rail, signal
  lattice, chrono essay, calibration — and dogfood the engine until critique + eye pass.
- **Failure named (champion):** nine offerings still lacked an instrument-desk grammar; nothing
  forced a vertical chronometer, sticky time-window scrub rail, amplitude lattice, or tick-bead
  chronology. Theme packs restyle SaaS/dashboard shells; they do not invent desk instruments.
- **Challenger:** new `signal-observatory` siteKind + `observatory` template (`Nightglass`) with
  craft prior kinds do not emit:
  - `hero-chrono` — UTC chronometer ticks + compact claim + spanning signal lattice
  - sticky `ds-scrub-rail` — T−24h / Live / +6h / Calibrate time windows
  - `signal-lattice` figure (amplitude bars + LIVE bracket; mono labels only — foundry SVG-text lesson)
  - `story-chrono` — event track with tick beads + outer time index
  - hairline bleed + paper calibration close (no pricing, no metrics theatre, zero inverse)
- **Score:** matrix **99.1**; observatory-signal **96.0 → 98.9/99.0** after hairline + type
  consolidation + fold hang; holdout **98.4** (gap 0.7 — generalises). No regression on locked
  SaaS/studio/consumer/foundry/dossier.
- **Closed:** thick-chrome hairline failure (`template:thick-chrome-kills-hairline`); fold lattice
  into first viewport (`template:chrono-claim-starves-lattice`); basics gate `kind-observatory`;
  showcase `/showcase/observatory` featured on gallery cinema; beat discovery for lattice/chrono.
- **Side effects:** observatory ink-variation still slightly above corridor ceiling (1.07 vs 0.96) —
  acceptable for a lattice-owned fold that must stay dense; do not empty the lattice to game the band.
- **Qualitative:** fold reads as an on-call instrument desk, not a recolored dashboard or SaaS page.
  Chronometer + scrub rail + amplitude lattice + chrono beads are craft a generic design engine will
  not invent from taste controls.
- **Next weakest:** dashboard band-variation; observatory ink-variation ceiling; deepen uniqueness
  (richer LIVE bracket legends, calibration tolerance numerals) without score-gaming.

## Loop 18b — deepen observatory + dashboard rhythm (parallel RSI)

- **Goal:** parallel dogfood — deepen Nightglass LIVE/calibration craft; raise dashboard
  band-variation without empty voids.
- **Observatory:** WINDOW legend + corner ticks, per-channel threshold marks, calibration
  tolerance strip — mono ≤11px, 1px chrome only.
- **Dashboard:** sunken specimen valley before dense app-shell; pack shell/index/proof as peaks;
  widen body measure out of the 33ch trap. Score **~97.8 → 99.7**; band-variation into floor.
- **Side effects:** observatory ink-variation still slightly above ceiling — accepted.

## Loop 19 — eleventh offering: archive index (RSI, parallel)

- **Goal:** fill the award-index demand gap with unreplicable register craft — quiet display,
  extreme spine, index-ledger owning the fold, A–Z alpha rail, entry essay, Registry close.
- **Failure named (champion):** ten offerings still lacked an alphabetical archive/ledger grammar;
  nothing forced a register fold where the index IS the figure.
- **Challenger:** `archive-index` siteKind + `archive` template (`Stamp Roll`):
  - `hero-register` + sticky `ds-alpha-rail`
  - `index-ledger` figure (mono ordinals ≤11px)
  - `story-entry` hanging folio + ruled measure
  - paper Registry close — no pricing/metrics/inverse
- **Score:** matrix **99.2**; archive-index **91.3 → 97.6** after display-clamp fix + ledger
  rule sparse + horizon specimen; holdout **98.4**. Dashboard parallel pass **99.7**.
- **Closed:** `template:display-clamp-invalid`, `template:ledger-rule-flood`; basics
  `kind-archive`; `/showcase/archive` featured.
- **Side effects:** archive ink-variation above corridor (1.32 vs 0.96) — accepted for a
  ledger-owned fold; do not flood rules to game the band.
- **Qualitative:** fold reads as an archive register, not a recolored SaaS/dossier page. Alpha
  rail + ruled ledger + entry folios are craft theme packs will not invent from taste controls.
- **Next weakest:** archive ink-variation; docs rule density; deepen register uniqueness
  (section tabs, stamp marks) without score-gaming.


## Loop 20 — twelfth + thirteenth offerings: commerce loom + field guide (RSI)

- **Goal:** Beat soft theme-pack craft (card grids, glass heroes, purple/system gradients) by
  inventing two unreplicable structural grammars with copyright-free photo matter, and dogfood the
  engine until critique + eye pass.
- **Failure named (champion):** Eleven offerings still lacked merchandising-press and herbarium
  voucher grammars. Soft public templates win on photography + glass collage; nothing in the catalog
  forced a size-tape loom or a taxon-rail specimen plate.
- **Challenger:**
  - `commerce-loom` / `loom` (`Warp Desk`) — sticky size-tape rail, loom-weave figure with free
    textile photo cells + flying shuttle, hangtag essay, Care label close
  - `field-guide` / `herbarium` (`Vellum Press`) — sticky taxon rail, specimen-plate with pressed
    silhouette + free botanical inset + blot, range essay, Voucher close
- **Score:** matrix **98.9**; loom-commerce **97.0 → 97.6**; field-herbarium **97.3 → 97.6** after
  fold hang, type-step consolidation, micro-label ceiling, display floor; holdout **98.4** (gap 0.5).
  No regression on locked SaaS/studio/consumer/foundry/dossier/observatory/archive.
- **Closed:** type-steps 15→13; micro-labels 30→in band; display floor for field; claim-starves-figure
  hang; basics gates `kind-loom` / `kind-field`; showcase `/showcase/loom` + `/showcase/herbarium`
  with herbarium featured cinema.
- **Side effects:** loom/field ink-variation above corridor (1.34 / 1.28 vs 0.96) — accepted for
  photo-owned folds (same class as archive ledger); do not empty photo cells to game the band.
- **Qualitative:** folds read as a merchandising press and a herbarium voucher — not recolored SaaS
  and not soft glass card collages. Size tape + shuttle weave + taxon rail + pressed blot are craft
  a generic design engine will not invent from taste controls.
- **Next weakest:** loom/field ink-variation ceiling; deepen shuttle/blot uniqueness without
  score-gaming; corporate band-variation.

## Loop 21 — marvel RSI: break sticky-rail recipe (drawloom + glassine)

- **Goal:** Human named Loop 20 folds as still-basic sticky-rail landings. Invent unreplicable
  fold craft designers would ask “how did you make that?”, then re-measure.
- **Failure named (champion):** Left sticky size/taxon rail + claim-then-figure still read as the
  same editorial-landing recipe as archive/observatory with different chrome labels.
- **Challenger:**
  - Drawloom — headline as weft picks through warp threads; reed bar; cloth owns lower fold;
    size tape becomes bottom treadles
  - Glassine press — specimen under translucent peeled sheet; museum label stuck on glassine;
    corner pins + lucida; taxon as bottom binomial strip
- **Score:** first marvel pass **94.2 / 94.3** (hairline + shadow + short weft measure + fold
  starvation); dogfood → loom **97.6**, field **97.6**, matrix **98.9**, holdout **98.4**.
- **Closed:** `template:sticky-rail-recipe`, `template:marvel-chrome-tax`; basics gates for
  drawloom/glassine markers; copy no longer claims sticky rails.
- **Side effects:** ink-variation still above corridor (accepted for photo-owned folds).
- **Qualitative:** desktop folds show woven weft lines through warp + textile cloth, and a
  pinned glassine peel over botanical matter — not left-rail SaaS landings.
- **Next weakest:** ink-variation ceiling; keep hairlines at 1px when deepening peel/reed craft.

## Loop 20 — twelfth offering: press atelier (RSI)

- **Goal:** fill the brand-agency / brand-product-agency / editorial-longform demand gap with a
  template structurally hard to replicate from a theme pack — registration-framed fold, sticky
  signature rail, press-sheet imposition figure, gather essay, Pressroom close — and dogfood the
  engine until critique + eye pass. Peer builder study (local plumbing + template eye only) showed
  cream/terracotta magazine posters, Inter-led landings, and document runbooks — none invent a
  pressroom forme grammar.
- **Failure named (champion):** eleven offerings still lacked a print-production / forme grammar;
  nothing forced registration marks, densitometer strips, Sig A–H rails, or imposition grids.
  Theme packs restyle SaaS/editorial shells; they do not invent press sheets.
- **Goal prompt:** Raise fold ownership so the press sheet is the first craft beat; keep
  display/type-steps in band; accept ink-variation above ceiling for a forme-owned fold (same
  class as archive ledger).
- **Loop prompt (iteration):** Fold shot claimed-starved → compact + hang → type-steps 16→14 →
  display 3.1→3.4vw → re-critique.
- **Challenger:** new `press-atelier` siteKind + `press` template (`Forme Desk`) with craft prior
  kinds do not emit:
  - `hero-press` — registration/crop marks + compact claim + spanning press sheet
  - sticky `ds-sig-rail` — Sig A–H
  - `press-sheet` figure (imposition grid + densitometer; mono ≤11px)
  - `story-gather` — fold ticks + outer plate index
  - paper Pressroom close with plate numbers — no pricing/metrics/inverse
- **Score:** matrix **99.1**; press-atelier **96.3 → 97.6** after fold hang + type consolidation;
  holdout **98.4** (gap 0.6 — generalises). No regression on locked SaaS/studio/consumer/foundry/
  dossier/observatory/archive.
- **Closed:** `template:press-claim-starves-forme`; basics gate `kind-press`; showcase
  `/showcase/press` featured on gallery cinema; beat discovery for press-sheet/gather.
- **Side effects:** press ink-variation above corridor (1.28 vs 0.96) — accepted for a forme-owned
  fold; do not empty the press sheet to game the band.
- **Qualitative:** fold reads as a pressroom forme, not a recolored archive/dossier page.
  Registration marks + signature rail + densitometer + gather ticks are craft theme packs will not
  invent from taste controls.
- **Next weakest:** press ink-variation; docs rule density; deepen Pressroom uniqueness
  (ink patch legends, forme custody marks) without score-gaming.

## Loop 21 — densify press forme + fix Specimens stage

- **Goal:** Human named empty proof/template screenshots and a too-basic Specimens gallery —
  SIG cells were blank voids; featured cinema missed the forme; gallery mast|reel CSS never
  applied (wrong parent selector) and fought proof chrome.
- **Challenger:** filled 2×2 mini pages in every SIG cell; densitometer patches; SpecimenPreview
  locks figure→spread→proof and skips specimen/instruments when craft figure exists; press still
  lands at y≥360; `FT.micro` 10→11; scoped `.sx-shell > .sx-stage` vs `.sx-chrome .sx-stage`.
- **Score:** matrix **99.1**; press-atelier **97.6** (type-steps 14, rules 3.89, fold-figure 0.69);
  holdout gap **0.1**. No regression on locked kinds.
- **Closed:** `template:empty-sig-voids`; `showcase:stage-selector-miss`.
- **Side effects:** ink-variation still above corridor for a forme-owned fold — accepted.
- **Qualitative:** gallery fold shows Tell Specimens mast beside a filled press sheet on FORME
  reel; proof iframe is full-bleed again; SIG cells read as pages, not empty paper.
- **Next weakest:** press ink-variation; deepen gather/Pressroom without starving the forme.

## Loop 22 — encode empty-void + craft-first into the engine

- **Goal:** Improve the design engine itself — reusable densify helpers, basics gates, craft-first
  cinema policy — so the next siteKind cannot regress into empty SIG voids / specimen-first reels.
- **Challenger:** `miniPageMatter` + `densitometerStrip` + `FIG_MONO_PX` clamp; `data-dense="ink"`;
  assertBasics `fig-mono-floor` / `craft-figure-dense` / `fold-owns-craft`; shared fold-owns CTA
  hide; `specimenBeats` module + tests.
- **Score:** matrix **99.1**; press **97.6**; holdout gap **0.1**. No regression.
- **Closed:** `engine:encode-empty-void-gates`.
- **Side effects:** none measured; gates are structural.
- **Qualitative:** engine now refuses empty press sheets and sub-11 SVG mono at preflight.
- **Next weakest:** press ink-variation; deepen densify helpers into other cell-grid figures when
  a new kind needs them.
