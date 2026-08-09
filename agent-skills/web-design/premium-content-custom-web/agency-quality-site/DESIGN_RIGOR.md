# Design rigor (Tell-shaped)

Principle-only craft floor for `agency-quality-site`. Learned from studied web-design
skill patterns already mapped in `agent-skills/web-design/COVERAGE.md`. **Do not name
third-party authors, studios, award sites, or skill marketplaces in commits or copy.**

Use this file in Phase 0 (load brain) and when writing `DIRECTION.md` / looping Phase 2.

---

## 1. Art direction before code

Write, then build:

| Field | Required content |
|---|---|
| Visual thesis | One sentence: what the page is *about* visually |
| Hero focal | Message + CTA + the one media/interaction idea |
| Type hierarchy | Display / body / meta roles (not one family for everything) |
| Color system | 4–6 named roles; one accent; no rainbow |
| Section sequence | Jobs in order (not interchangeable cards) |
| Motion narrative | What moves, why, 150–300ms; one motion system |
| Craft nodes | **1–2** Tell crafts from the map below — never a pile of unrelated aesthetics |
| Asset honesty | Original / licensed / generated with provenance — or omit |

Extract from references only: hierarchy, pacing, contrast, image treatment, motion principles.
Generate a **new** identity/layout/copy/imagery. Never trace or clone a ref.

**Thin board honesty:** If live refs are missing (empty seeds / bot walls), say so in
`BOARD_STATUS.md` and write DIRECTION from measured corridor bands + subject vernacular.
Never pretend a corridor fallback was a finished craft board. `agency-run-learn` records
`agency:thin-board:*` so the next run can fill `boards.seeds.local.json`.

---

## 2. Honest assets

- Prefer real photography or authored figures for the subject’s world.
- No model-doodled “illustrations” pretending to be brand art when a photo/figure is the idea.
- Avatars must be photographs (or omit). No initials-as-people, no fake customer faces.
- Icons: one SVG language. No emoji as structure.
- Logo walls only for **real** declared marks; otherwise omit. Never invent partners.
- Every media block needs aspect ratio, alt, and a missing-media fallback.
- Reject generic stock that could sell any product.

---

## 3. Hero = strongest authored moment

- First viewport: brand + one headline + one support + one CTA group + one dominant visual idea.
- Static first frame must read complete with JS / motion / WebGL off.
- Pointer effects are additive; keyboard, touch, blur, and visibility must not leave a broken state.
- Do not open with stats strip + gradient accent as the default thesis.

---

## 4. Motion discipline

- One motion system. No dual smooth-scroll engines. No competing libraries on the same property.
- Prefer native CSS scroll-driven / view timelines before timeline engines; timeline engines before WebGL.
- Marketing floor: hero entrance once + section stagger enters + control micro-feedback
  (`docs/15_MOTION_ANIMATION_PLAN.md`). “Add hover” alone is not a pass.
- Eye test: ≥2 beats a reader would miss if deleted — while staying inside `docs/10` restraint
  bands (transition coverage ~2–15%, median duration ~150–300ms).
- CSS for simple hover/focus/tap; scroll choreography when the brief is narrative.
- `prefers-reduced-motion: reduce` → final states immediately (not “slightly shorter”).
- Staggered/split text must keep an unsplit accessible name; never split links.
- Pause offscreen work; clean up observers / rAF / WebGL on teardown.
- Reject motion with no narrative role.
- Named experts and 2026 stacks (research-only): `research/MOTION_ANIMATION_SURVEY.md`.

---

## 5. Spatial / compositional rigor (pick a lane)

Choose **one** compositional lane for the run (name it in `DIRECTION.md`):

| Lane | Tell crafts | Feel |
|---|---|---|
| Minimal editorial grid | `agency-minimal-grid`, `minimal-clean` | Oversized type, tiny utility labels, open spans, hairline structure |
| Nested premium shells | `nested-frame-craft`, `container-tech-shell` | Outer shell → inset feature → inner cards; breathing layers |
| Image-first stage | `image-first-fold`, rails via `paper-technical-frame` | Media owns the fold; content anchored on the grid, not a centered SaaS stack |
| Documentary chapters | `editorial-chapter-craft`, hard cuts | Billboard type + real work chapters; no glass/glow theater |
| Conversion landing | `conversion-landing-craft` | One audience · one offer · one action; FAQ + risk near CTA |

Index markers (`indexed-detail-markers` / 01–02–03) only when sequence is real information —
never decorative chrome competing with the headline.

---

## 6. Quality bar (reject list)

Reject:

- Generic gradient blobs, ornamental bento, glass-everywhere
- Stock component layouts and equal card grids as the default story
- Fake testimonials, invented partnerships, logo-wall theater
- Award / recognition claims without verifiable user-provided evidence
- Hero-only concepts with no nav → argument → CTA → footer
- Continuous offscreen animation, scroll hijacking, bounce decoration

Require:

- Distinct art-directed idea (thesis + signature)
- Memorable first viewport
- Disciplined type + spacing
- Intentional crops / figures
- Full state matrix on controls (hover, focus, active, disabled, loading, error, reduced-motion)
- Performance: lazy below-fold media, bounded blur/transforms, capped canvas work

---

## 7. Validate before `--mark-pass` on ship

- Desktop + 375 eye
- Keyboard focus visible; reduced-motion path
- Search source for placeholders, cloned identity, unsupported claims
- Report in ledger: craft nodes chosen, motion stack, Three.js/WebGL decision (usually **none**), remaining limits

---

## Map to agency phases

| Phase | Rigor focus |
|---|---|
| 1-refs | Trait extraction only; fill thesis + lane + craft nodes in `DIRECTION.md` |
| 2-build | Execute thesis; honest assets; hero bar; reject list |
| 3a | Type hierarchy dominance / measure |
| 3b | Open spans, nested breathing room, grid alignment |
| 3c | Single motion narrative; reduced-motion finals |
| 3d | Billboard wraps + stacks at 375 |
| 4-ship | Validation report + no award claims |
