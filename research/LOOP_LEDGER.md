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
