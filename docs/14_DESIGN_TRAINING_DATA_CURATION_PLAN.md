# Tell — Design Training Data Curation Research Plan

> **Research plan** (not an implementation milestone) for turning Tell sessions,
> agent/harness runs, and measured design loops into **local, high-accuracy**
> datasets that can train a design-focused model for highest-quality websites
> and web apps.
>
> Complements `docs/08_AI_DESIGN_METHODS.md` (how humans direct), `docs/10`
> evidence bands, `research/LEARNINGS.md` (session lessons), and
> `docs/13_DESIGN_CAPABILITY_FLOWS_PLAN.md` (task shapes). Does **not** replace
> `PLAN.md` or `BUILD.md`.
>
> **Attribution rule:** Describe methods and principles only. Do **not** name
> external authors, sites, brands, model vendors, skill marketplaces, galleries,
> or third-party tools in committed code, docs, comments, or commits.

**Status:** Research · **Audience:** schema, core, taste, redesign, MCP, UI,
orchestration · **Storage default:** local-only, never committed raw sessions

---

## 0. Problem statement

Priya’s loop already produces the signals a design model needs — rendered
before/after, fingerprints, named tells, voice direction, reconciliation
patches, human accept/reject — but those signals are **ephemeral product
artifacts**, not curated training records.

Industry practice for agent and multimodal UI models converges on the same
lesson: **quality beats volume**. Raw chat logs and unfiltered trajectories
teach noise, tool thrash, and generic defaults. A design model that creates
*highest possible quality* sites needs:

1. **Grounded multimodal pairs** — intent + constraints + screenshot/DOM/CSS
   evidence + code/diff outcomes.
2. **Preference structure** — chosen vs rejected on the *same* brief (not
   unrelated best-vs-worst across tasks).
3. **Measured rewards** — contrast floors, craft bands, detector clearance,
   human taste — not only “the agent finished.”
4. **Failure → correction gold** — human edits of bad outputs become the
   strongest supervised examples.
5. **Hygiene** — dedup, holdout isolation, PII/secret scrubbing, leakage
   control.

This plan defines the research questions, candidate record shapes, curation
pipelines, and experiments Tell should run **before** shipping a collector.

---

## 1. North star

**Outcome:** A local training corpus where each retained example would teach a
model to behave like Tell’s best sessions: name genericness, accept human
direction, produce measurable, reviewable design changes — not assemble another
violet-gradient SaaS template.

**Success criteria for the research phase**

| Criterion | Pass bar |
|---|---|
| Completeness | A retained record contains every modality needed for at least one training objective (SFT, preference, or reward model) without guessing missing fields |
| Accuracy | Labels and rewards are reproducible from committed schemas + deterministic probes; LLM-only labels are marked and never sole gate |
| Selectivity | Top-reward / human-corrected fraction kept; barely-passing runs discarded or demoted |
| Local fidelity | Raw sessions stay on disk under gitignore; only anonymised aggregates/schemas may be committed |
| Design specificity | Records encode composition, tokens, states, contrast, and anti-generic constraints — not only “build a landing page” text |

---

## 2. What a design model must learn (capability map)

Map training *objectives* to *evidence* Tell can already (or should) capture:

| Capability | Training form | Minimum evidence in a record |
|---|---|---|
| See genericness | Classification / SFT | Screenshot + fingerprint + findings + severity |
| Judge taste vs intentional | Preference / verdict SFT | Finding facts + human or taste verdict + rationale |
| Follow art direction | Conditional generation | Direction keywords/tokens + before tokens + after CSS/diff |
| Compose under constraints | Multimodal SFT | Brief + site kind + brand DNA + viewport shots + HTML/CSS patch |
| Preserve craft floors | Reward / reject | Critique matrix deltas, contrast floor, basics gates |
| Multi-turn repair | Trajectory SFT / multi-turn preference | Turn sequence with tool calls, intermediate shots, final accept |
| Avoid AI-default cluster | Negative preference | Rejected outputs that trip detector families / known anti-patterns |
| Responsive integrity | Multi-viewport pairs | Same brief at desktop + mobile with shared `sample_id` |
| State coverage | Probe-linked examples | empty/loading/error/focus-visible evidence attached |
| Human-in-the-loop apply | Patch preference | Proposal → human edit → applied diff as `chosen` |

If a candidate pipeline cannot fill a row’s minimum evidence, it is **not ready**
for that objective — research must close the gap or drop the objective.

---

## 3. Practice synthesis (principle-only)

Research across agent-trajectory curation and UI/multimodal datasets yields
stable practices. Encode these as Tell research hypotheses — not product names.

### 3.1 Trajectory → training conversion

| Practice | Implication for Tell |
|---|---|
| Prefer curated trajectories over raw volume | Rank sessions by measured reward; keep top fraction of *passing* runs |
| Same-task preference pairs | Pair champion vs challenger (or accept vs reject) on one brief/session id |
| Reject at μ−2σ of reward, not absolute worst | Avoid teaching “never do absurd failures”; teach near-miss discrimination |
| Expert corrections bypass reward thresholds | Human-edited patches are gold SFT regardless of original score |
| Mask non-assistant tokens in SFT | Train on model/agent actions and final artifacts; not on system prompt bloat alone |
| Dedup vs full training set + hold out goldens | Session ids used in eval never enter train; exact/embedding dedup before merge |
| Multi-turn preference needs diversity pressure | Prefer multiple distinct repair strategies per brief to avoid collapse to one safe bland style |
| Graded traces before conversion | Do not convert ungraded logs; require reward/schema validation first |

### 3.2 Multimodal UI / design datasets

| Practice | Implication for Tell |
|---|---|
| Screenshot ↔ code pairs | Always store rendered proof with the producing HTML/CSS/diff |
| Dense UI structure, not sparse clicks | Prefer fingerprint + DOM evidence + element regions over click-only traces |
| Multi-viewport linkage | One logical sample, many viewport shots |
| Quality filters before keep | Drop insufficient text, broken layout, ads/noise, misaligned media, low contrast |
| Synthetic scale + real held-out eval | Synthetic or fixture volume for pretrain; real captured pages for gold eval |
| VLM-as-judge is calibration-only | Use as soft filter; human + deterministic probes remain authority |
| Idea/brief column matters | Store the design intent that generated the page (voice, preset, site kind) |
| Real images beat placeholders | Prefer captures with real product imagery when present |

### 3.3 Design-quality specifics Tell must add

Generic screenshot→HTML corpora teach *reconstruction*. Tell needs *taste*:

- **Before/after with named failure** — “Inter-only / violet CTA / equal cards”
  attached to the rejected state.
- **Direction as conditioning** — packed judgment / compose / board method ids
  from `docs/08`.
- **Measured corridors** — sit inside craft bands (`docs/10`), not medians that
  force sameness.
- **Never-auto-apply semantics** — `chosen` is human-approved patch, not agent
  write.
- **Anti-cluster negatives** — explicit rejects for purple-gradient, cream+serif
  terracotta, broadsheet-hairline defaults called out in product rules.

---

## 4. Tell-native data sources (inventory)

### 4.1 Already available (high leverage)

| Source | Path / surface | Training value |
|---|---|---|
| Capture payload | `@tell/schema` `CapturePayload` | Screenshot, HTML snapshot, CSS vars, URL, viewport |
| Fingerprint | `DesignFingerprint` | Typography, color, space, depth — structured features |
| Findings + evidence | `Finding`, `Evidence` | Labeled genericness / drift with selectors/regions |
| Taste verdicts | `TasteVerdict` | Soft labels + rationales (mark `llm` vs deterministic) |
| Scorecard / measures | `Scorecard`, `ScoreAxis` | Before quality axes; genericness band |
| Art direction | `ArtDirection`, voice parse | Conditioning keywords + token overrides |
| Reconciliation | `Reconciliation` | Before→after token rows, CSS sheet, contrast notes |
| Redesign proposal | `RedesignProposal` | Unified diffs + summaries (candidate `chosen`) |
| Research measurements | `research/measurements/ref-*.json` | Premium corridor priors (anonymised) |
| Critique / aggregate | `research/critique.json`, `aggregate.json` | Reward features vs bands |
| Learnings ledger | `research/LEARNINGS.md`, `LOOP_LEDGER.md` | Failure→fix pattern keys (text SFT / RAG) |
| Fixture reports | `fixtures/reports/*` | Golden offline examples (hold out carefully) |
| Recursive-improve loop | `tell-recursive-improve` | Natural champion/challenger preference pairs |

### 4.2 Partially available / needs research instrumentation

| Gap | Why it matters | Research question |
|---|---|---|
| Full agent/harness transcript | Tool calls, retries, dead ends | Which turn segments are trainable vs noise? |
| Human accept/reject events | True preference labels | Where to log: Report UI, MCP apply, Cursor apply? |
| Mid-iteration screenshots | Multi-turn visual credit assignment | Capture every N turns or on each proposal? |
| Patch after human edit | Expert correction gold | Diff agent proposal vs final committed files |
| Session outcome grade | Pass/fail/reward scalar | Compose detectors + critique + human thumb? |
| Privacy scrub | Local but accurate | What redaction keeps design signal? |

### 4.3 Explicit non-sources (noise / risk)

- Unfiltered chat without grading
- Auto-applied or unverified patches
- Nav-only showcase screenshots (see recursive-improve anti-pattern)
- Pages that fail basics / contrast floor when claiming “after”
- Cross-task best-vs-worst pairing
- Third-party named references in committed exports

---

## 5. Candidate training record schemas (research drafts)

Propose **local JSONL families** (schema later in `@tell/schema` only after
research freeze). Principle: one physical session may emit *multiple* rows for
different objectives.

### 5.1 `DesignEpisode` (session spine)

```text
episode_id, started_at, source (web|mcp|cli|harness),
brief, site_kind, method_id (skill|compose|board),
brand_dna?, viewports[],
final_status (accepted|rejected|abandoned),
reward_scalar?, reward_components{},
holdout_tag?
```

### 5.2 `MultimodalDesignExample` (SFT / reconstruction+taste)

```text
episode_id, sample_id,
inputs: { brief, direction, constraints, before_shot, before_html?, fingerprint, findings },
outputs: { after_shot, css_or_diff, reconciliation_rows, summary },
quality: { contrast_ok, critique_delta, detectors_cleared, human_accepted }
```

### 5.3 `DesignPreferencePair` (DPO-family)

```text
episode_id, task_id (= same brief+viewport),
chosen: artifact_ref,
rejected: artifact_ref,
pair_rule: same_task,
reward_chosen, reward_rejected,
selection: top_vs_mu_minus_2sigma | human_correction
```

### 5.4 `TrajectorySegment` (agent training)

```text
episode_id, turn_index,
messages_or_tool_calls (assistant spans only for loss),
observation_refs (shot/dom/finding ids),
segment_grade (keep|drop|trim),
rationale_for_keep
```

### 5.5 `ExpertCorrection` (highest priority SFT)

```text
proposal_id, agent_artifact, human_artifact, edit_ops,
human_note?, detectors_before, detectors_after
```

**Research gate:** freeze field lists only after a 20-episode pilot shows ≤5%
missing-critical-field rate on retained rows.

---

## 6. Quality & reward design (accuracy stack)

Rewards must be **layered**; single LLM judge is insufficient for a design model.

```text
R = w1·HumanAccept
  + w2·ContrastFloor
  + w3·CritiqueBandFit          # inside corridor, not median chase
  + w4·DetectorClearance        # tell/drift reduced without false wins
  + w5·BasicsGates              # a11y/focus/state
  + w6·AntiGenericPenalty       # known cluster tells
  + w7·CompositionChecks        # hero budget, brand-first, no card spam (product rules)
  − w8·TrajectoryWaste          # excess retries / thrash
```

### 6.1 Retention policy (hypothesis to test)

| Bucket | Rule | Use |
|---|---|---|
| Gold | Human accepted **and** contrast/basics pass | SFT + chosen side |
| Strong pass | Top quartile of R among passes | SFT keep_fraction |
| Near miss | Failed one craft gate but clear intent | Rejected side or repair trajectories |
| Junk | Broken render, secrets, nav-only proof, ungraded | Drop |
| Correction | Human edited agent output | Always SFT; optionally pair vs original |

### 6.2 Accuracy guarantees

1. Deterministic fields parsed via zod at write time.
2. Screenshots hashed; HTML/CSS content-addressed.
3. Every retained “after” re-runnable through capture→fingerprint→detectors.
4. LLM rationales stored as `label_source: model` with confidence; never sole
   accept criterion.
5. Reproducibility manifest per export batch (schema version, probe version,
   band version).

---

## 7. Conversion pipelines to research

### Pipeline A — Report → Multimodal SFT

`TellReport` + reconciliation + proposal → `MultimodalDesignExample`  
**Filter:** human accept OR reward ≥ threshold; require after screenshot.

### Pipeline B — Champion/Challenger → Preference

Recursive-improve / dual proposals on same brief → `DesignPreferencePair`  
**Filter:** same `task_id`; reject ≈ μ−2σ; drop cross-brief pairs.

### Pipeline C — Harness transcript → Trajectory segments

Agent/Cursor-like run log → graded turns → `TrajectorySegment`  
**Filter:** drop search thrash; keep turns that change visual state or patches.

### Pipeline D — Human edit → Expert correction

Proposal diff vs final applied files → `ExpertCorrection`  
**Filter:** none on reward; scrub secrets; require non-empty edit.

### Pipeline E — Learnings → Instruction SFT

`LEARNINGS.md` pattern keys → short “failure / fix / do-not” instruction rows  
**Filter:** must cite measurable gate or screenshot contract.

### Pipeline F — Rejection sampling loop

Sample N redesigns per brief → score with R → keep top fraction  
**Filter:** diversity check so all N are not the same bland template.

---

## 8. Local storage & privacy architecture (research constraints)

| Layer | Proposal | Rationale |
|---|---|---|
| Raw sessions | `~/.tell/training/raw/` (or `research/training.local/`) gitignored | Accuracy + user control |
| Curated JSONL | `research/training.local/curated/*.jsonl` gitignored | Train-ready |
| Schemas / docs | `packages/schema` + this plan committed | Contracts only |
| Aggregates | Optional anonymised counts in `research/` | Shareable science |
| Secrets | Redact env, tokens, emails, private URLs | Safe local reuse |
| License/consent | Per-episode `user_consent` flag | Required before any future share |

**Non-negotiable:** no automatic upload; no third-party corpus names in exports;
peer plumbing identity stays in gitignored local JSON only.

---

## 9. Research workstreams (experiments)

Run as **readouts**, not build milestones. Each stream ends with a short memo
under `research/training.local/notes/` (gitignored) or a principle-only appendix
update to this doc.

### W1 — Completeness audit (schema fit)

- Sample 10 live diagnose→voice→redesign→apply loops and 10 offline fixture
  loops.
- Score each against §2 capability map: present / partial / missing.
- **Deliverable:** gap list ranked by training impact.

### W2 — Reward ablation

- Define 3 reward recipes (detectors-only; detectors+critique; +human thumb).
- Rank the same 30 episodes under each; measure agreement with human taste on
  a 12-episode held-out set.
- **Deliverable:** recommended R weights for curation (not for product UI).

### W3 — Preference pair construction bake-off

- Compare: best-vs-worst · top-vs-μ−2σ · human-correction-only.
- Downstream proxy: small LoRA or judge agreement on held-out briefs
  (principle: use whatever local train stack is available; document setup).
- **Deliverable:** winning pair rule + minimum pairs needed for stable signal.

### W4 — Trajectory trimming study

- Take full harness logs; produce full / trimmed-to-visual-deltas /
  final-artifact-only variants.
- Measure: token cost vs downstream design quality proxy.
- **Deliverable:** keep/drop heuristics for turn segmentation.

### W5 — Multimodal packing

- Test packing strategies: shot+diff · shot+HTML · shot+fingerprint+diff ·
  multi-viewport.
- Check what a design model actually needs vs context bloat.
- **Deliverable:** default packing profile per objective.

### W6 — Anti-generic negative mining

- Mine rejected outputs that trip Tell detectors and known cluster tells.
- Build a hard-negative bank for preference and classifier heads.
- **Deliverable:** negative taxonomy aligned with `docs/05` + product rules.

### W7 — Privacy scrub fidelity

- Measure information loss after URL/token/PII redaction on design metrics.
- **Deliverable:** scrubber spec that preserves layout/token signal.

### W8 — Eval harness first

- Before large curation, freeze a **held-out design eval** (briefs × viewports ×
  craft gates) that never trains.
- Include: reconstruct, restyle-under-direction, repair-generic, mobile parity.
- **Deliverable:** eval card + leakage checklist.

---

## 10. Instrumentation opportunities (post-research, not now)

Only after W1–W3 readouts, consider product hooks:

1. Optional “Save training episode” toggle in Report UI (default off).
2. MCP/CLI `tell_training_export` writing local JSONL behind consent.
3. Apply path logs `accepted | edited | discarded` with content hashes.
4. Recursive-improve auto-emits preference pairs when challenger wins.
5. `@tell/schema` zod types for episode/preference rows.
6. Doctor check: training dir writable, scrubber version, holdout manifest.

Cut line reminder: **do not block Priya demo loop** on training instrumentation.

---

## 11. Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Teaching generic “AI look” from average accepts | Weight anti-generic penalties; keep hard negatives |
| Reward hacking detectors without taste | Require human accept on gold; corridor not median |
| Leakage of goldens into train | Holdout manifest + automated filter |
| Overfitting to Tell’s own showcase | Separate eval site kinds; diversify briefs |
| Transcript noise drowning signal | Trim to visual/patch deltas |
| Legal/PII leakage | Local-only + scrub + consent |
| Confusing research with product roadmap | Keep this doc research-scoped; ship via PLAN later |

---

## 12. Open research questions

1. Is the primary model a **vision→code** generator, a **direction-conditioned
   restyler**, an **agent policy**, or a **mixture**? Data mix depends on the
   answer — decide after W1/W5.
2. Should Brand DNA be input conditioning or a latent to infer?
3. How many human corrections are needed before preference data helps more than
   SFT alone?
4. Can critique-band fit replace scarce human labels for ranking?
5. What minimum screenshot resolution / craft-beat framing avoids the
   nav-only failure mode in training labels?
6. Should method ids (`skill`/`compose`/`board`) be separate experts or tags?

---

## 13. Suggested research sequence

```text
Week-shaped effort (effort, not calendar): 
  1) Freeze eval card (W8) + completeness audit (W1)
  2) Reward ablation (W2) + pair bake-off (W3)
  3) Trajectory trim (W4) + packing (W5)
  4) Negatives (W6) + scrub (W7)
  5) Write “Curation Constitution” appendix: keep/drop rules + schema freeze
  6) Only then: optional collector spike behind consent
```

**Definition of done for this research plan**

- [ ] W1–W8 memos completed (local notes fine)
- [ ] Recommended record schemas listed with required fields
- [ ] Retention + pair-construction rules chosen with evidence
- [ ] Eval harness + holdout policy written
- [ ] Local storage/privacy constitution agreed
- [ ] Explicit go/no-go on building collector instrumentation in product

---

## 14. Relationship to existing Tell loops

| Existing loop | Training role |
|---|---|
| Capture → diagnose → taste | Feature extraction + labels |
| Voice / art direction | Conditioning text |
| Reconcile + seam | Dense before/after supervision |
| Draft fix → human apply | Preference + correction |
| Recursive improve | On-policy champion/challenger pairs |
| Design research forensics | Prior / reward features (corridors) |
| Dogfood audit | Hard negatives when Tell itself regresses |

Tell should not become a general data scrapeway. The corpus is a **side effect
of high-quality design work**, curated ruthlessly so a future design model
inherits judgment — not just markup fluency.

---

## 15. Immediate next actions (research only)

1. Run W1 completeness audit on 10 live + 10 fixture episodes; file gap table.
2. Draft zod *candidates* (unexported) for `DesignEpisode` / preference rows in a
   scratch note — freeze only after W1.
3. Define held-out eval briefs (W8) before collecting volume.
4. Decide reward v0 weights from a 12-episode human ranking study (W2).
5. Keep raw data local; update this doc with principle-only findings after each
   workstream.
