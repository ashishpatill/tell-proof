# Tell — Design Training Data Curation Research Plan

> **Research plan** for local, high-accuracy training data that can teach a
> design-focused model to produce high-quality websites and web apps.
>
> **Literature authority (cited papers, datasets, guides):**  
> [`research/DESIGN_LLM_TRAINING_DATA_SURVEY.md`](../research/DESIGN_LLM_TRAINING_DATA_SURVEY.md)
>
> This file translates that survey into a Tell-shaped research program and
> collector design. Product-facing docs stay principle-first; the survey holds
> named paper/dataset citations.
>
> Related: `docs/08_AI_DESIGN_METHODS.md`, `docs/10_DESIGN_EVIDENCE.md`,
> `research/LEARNINGS.md`, `docs/13_DESIGN_CAPABILITY_FLOWS_PLAN.md`.  
> Does **not** replace `PLAN.md` / `BUILD.md`.

**Status:** Research · **Audience:** schema, core, taste, redesign, MCP, orchestration  
**Storage default:** local-only, never commit raw sessions

---

## 0. Why the previous sketch was insufficient

An uncited product sketch is not research. The survey answers, with primary sources:

- What techniques convert agent/harness runs into SFT and preference data
- Which papers define quality-vs-quantity, pair construction, trajectory filters
- Which UI datasets teach reconstruction vs taste
- Which practitioner guides (fine-tuning, TRL, trace→dataset) are operational

This plan **only** states Tell experiments and instrumentation that follow from
those findings.

---

## 1. North star

A local corpus where each retained example would teach a model to behave like
Tell’s best sessions: name genericness, follow human direction, produce
measurable reviewable design changes — not assemble default AI SaaS chrome.

**Literature anchors (see survey §§1, 3, 6):**

| Claim | Anchor |
|---|---|
| Curate ruthlessly; small gold sets work | LIMA |
| SFT demos then preferences | InstructGPT; OpenAI DPO guide |
| Same-task pairs; reject near μ−2σ | DPO practice / survey |
| Trajectory quality scoring at scale | Han et al. 2026 |
| Preserve multi-turn diversity | EntroPO |
| Reconstruction ≠ taste | WebSight/Design2Code vs UIClip |
| Synthetic jitter hard negatives | UIClip |
| Expert corrections are gold | Langfuse / InstructGPT demos |

---

## 2. Capability → data shape (from survey §2)

| ID | Capability | Record family | Primary loss |
|---|---|---|---|
| `D2C` | shot → code | Multimodal example | VLM SFT |
| `C2C` | direction-conditioned restyle | Multimodal + direction | SFT |
| `CRITIC` | name defects | Finding-labeled shots | SFT / classifier |
| `RANK` | prefer better UI | Preference pair | DPO / RM |
| `AGENT` | multi-turn tool use | Trajectory segments | SFT → multi-turn pref |
| `REPAIR` | fix named tell | Finding → patch | SFT + pref |
| `RESP` | responsive parity | Multi-viewport linked | Multi-image SFT |

Public corpora mostly cover `D2C`. Tell must prioritize `CRITIC`, `C2C`, `RANK`,
`REPAIR` with human accept.

---

## 3. Technique shortlist to test (survey §7)

Mandatory candidates for the research program:

1. **T1 Gold SFT** — human accept ∧ contrast/basics ∧ craft-beat screenshot  
2. **T2 Expert correction SFT** — agent proposal → human final (highest priority)  
3. **T3 Rejection sampling** — N samples → keep top reward fraction  
4. **T4 Same-task DPO** — chosen top; rejected ≈ μ−2σ; margin filter  
5. **T5 KTO** — unary accept/discard events  
6. **T6 Constitutional AI labels** — Design Constitution + human/probe calibration  
7. **T7 UIClip-style jitter negatives** — inject Tell anti-patterns  
8. **T8 Trajectory trim + Efficiency/Style score** — drop thrash; Top-Q at larger N  
9. **T9 Multi-viewport packing**  
10. **T10 Hierarchical prefs** — episode + step  
11. **T11 Dedup + holdout** — exact / MinHash / SemDeDup  
12. **T12 Eval-first card** — freeze before volume

---

## 4. Tell-native sources

### High leverage today

`CapturePayload`, fingerprint, findings/evidence, taste verdicts (noisy), scorecard,
art direction, reconciliation CSS, redesign diffs, research measurements/critique,
`LEARNINGS.md` / loop ledger, recursive-improve champion/challenger, fixture reports
(hold out carefully).

### Must instrument

| Gap | Literature reason |
|---|---|
| Full harness transcript with tool spans | Agent trajectory SFT |
| Accept / edit / discard events | InstructGPT demos + KTO/DPO |
| Mid-iteration craft-beat screenshots | Multi-turn credit; avoid nav-only |
| Proposal vs final file diff | Expert correction gold |
| Episode reward components | RSO / Top-Q / pair mining |
| Consent + scrub metadata | Production trace pipelines |

---

## 5. Candidate local schemas (freeze after W1)

See survey mapping §10. Families:

- `DesignEpisode` — session spine  
- `MultimodalDesignExample` — SFT row  
- `DesignPreferencePair` — DPO/SimPO  
- `TrajectorySegment` — agent turns (assistant loss only)  
- `ExpertCorrection` — proposal→final  

Pilot gate: ≤5% missing-critical-field rate on retained rows across 20 episodes.

---

## 6. Reward stack (survey §8)

```text
R = HumanAccept + ContrastFloor + BasicsGates + DetectorClearance
  + CritiqueBandFit + optional UIClip-like score
  − GenericClusterPenalty − TrajectoryThrash
```

Ablate weights in W2 against a 12-episode designer ranking set.

---

## 7. Research workstreams (DoD)

| ID | Workstream | Literature driver | Deliverable |
|---|---|---|---|
| W0 | Read survey + annotate top 15 PDFs | — | Reading notes in `research/training.local/notes/` (gitignored) |
| W1 | Completeness audit (10 live + 10 fixture) | Taxonomy §2 | Gap table |
| W2 | Reward ablation | UIClip + InstructGPT RM | Weight recommendation |
| W3 | Pair construction bake-off | DPO survey; μ−2σ | Winning pair rule |
| W4 | Trajectory Top-Q vs random at N∈{200,500,2k} | Han et al. | Keep/drop heuristics |
| W5 | Multimodal packing study | Design2Code / WebCode2M | Default packing profile |
| W6 | Jitter hard-negative bank | UIClip | Negative taxonomy |
| W7 | Scrub + SemDeDup fidelity | SemDeDup; FT privacy | Scrubber spec |
| W8 | Eval harness first | OpenAI FT practices; Design2Code | Held-out eval card |

**Research DoD:** W0–W8 memos done; schemas + retention rules chosen with evidence;
go/no-go on product collector.

---

## 8. Local storage & privacy

| Layer | Location |
|---|---|
| Raw episodes | `research/training.local/raw/` (gitignored) |
| Curated JSONL | `research/training.local/curated/` (gitignored) |
| Reading notes | `research/training.local/notes/` (gitignored) |
| Survey + this plan | committed |
| Aggregates only | optional anonymised counts |

No automatic upload. Consent flag per episode. Never name peer products in exports.

---

## 9. Post-research instrumentation (cut line)

Only after W1–W3:

- Optional “Save training episode” (default off)  
- Apply path: `accepted | edited | discarded` + hashes  
- Recursive-improve auto preference pairs  
- zod episode/preference types in `@tell/schema`  
- Doctor: training dir, scrubber version, holdout manifest  

Do **not** block Priya’s demo loop.

---

## 10. Immediate next actions

1. Deep-read the survey bibliography core set (survey §9) — start with LIMA, DPO,
   Design2Code, UIClip, EntroPO, Han et al., Open-SWE-Traces filters.  
2. Run W1 completeness audit.  
3. Draft held-out eval card (W8) before collecting volume.  
4. Implement reward v0 components already available (detectors + critique + human
   thumb) without new product surface area.

---

## Changelog

- **2026-08-09** — Replaced uncited sketch with plan grounded in
  `research/DESIGN_LLM_TRAINING_DATA_SURVEY.md`.
