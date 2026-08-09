# Literature Survey: High-Quality Training Data for Design-Focused LLMs

> **Status:** Research survey (v1) · **Date:** 2026-08-09  
> **Purpose:** Catalog techniques, papers, datasets, and practitioner guides for converting
> agent/harness sessions and design interactions into accurate local training data for a
> model that generates high-quality websites and web apps.  
> **Companion product plan:** [`docs/14_DESIGN_TRAINING_DATA_CURATION_PLAN.md`](../docs/14_DESIGN_TRAINING_DATA_CURATION_PLAN.md)  
> **Note:** This survey deliberately names papers, datasets, and guides. Product-facing
> Tell docs normally avoid third-party product names; this file is research literature.

---

## 0. How this survey was conducted

**Question.** What are the best-evidenced ways to turn multi-turn LLM / agent / design-tool
sessions into training data that can teach a model *design judgment* (not just markup
fluency)?

**Method.** Secondary research across four literatures:

1. Alignment & preference data (RLHF → DPO family)
2. Agent trajectory distillation (coding / tool-use agents)
3. Multimodal UI → code generation datasets
4. UI design quality scoring & practitioner fine-tuning guides

Sources were retrieved from arXiv abstracts/HTML, NeurIPS proceedings, Hugging Face dataset
cards, OpenAI / Hugging Face TRL docs, and trace-to-dataset engineering playbooks (Aug 2026).

**Limitation.** This is a literature + practice survey, not a replication study. Claims below
cite primary papers; Tell-specific experiments are proposed, not yet run.

---

## 1. Executive findings (what actually matters)

| Finding | Evidence | Implication for a design model |
|---|---|---|
| **Quality ≫ quantity for alignment** | LIMA (Zhou et al., 2023): ~1k curated demos beat mass instruction sets on several human prefs | Curate gold design episodes ruthlessly; do not dump every Cursor chat |
| **Diversity of prompts + quality of responses** | LIMA ablations; Only-IF (2024) on instruction diversity | Spread site kinds / briefs; never clone one bland template 10k times |
| **SFT then preference** | InstructGPT (Ouyang et al., 2022); OpenAI DPO guide | Stage 1: accepted patches + gold pages; Stage 2: same-brief chosen/rejected |
| **Same-task preference pairs** | DPO survey (2024); practitioner trace→DPO recipes | Pair two redesigns of *one* brief, not best-of-task-A vs worst-of-task-B |
| **Trajectory quality is scale-sensitive** | Han et al. 2026 (arXiv:2607.17205): quality filter matters more as N grows | At small N, collect volume carefully; at larger N, score Efficiency/Style and keep Top-Q |
| **Multi-turn preference needs diversity pressure** | EntroPO (2025): DPO can collapse diversity and hurt test-time scaling | For agent design loops, prefer EntroPO-style entropy or sample diverse repairs |
| **Screenshot↔code alone ≠ taste** | WebSight / Design2Code teach reconstruction; UIClip teaches quality ranking | Need *both* reconstruction data and preference / quality labels |
| **Synthetic defect pairs work for quality models** | UIClip (Wu et al., 2024): jittered layouts + human designer ratings | Generate deliberate “bad AI look” variants as hard negatives |
| **Real pages beat toy synthetic for hard eval** | Design2Code, WebCode2M vs pix2code/WebSight simplicity gap | Hold out real captured sites; use synthetic for scale pretrain |
| **Human corrections are gold** | Langfuse “expert expected output”; OpenAI FT practices | Log agent proposal vs human-applied final as highest-value SFT |
| **Dedup before merge** | SemDeDup (Abbas et al., 2023); MinHash near-dup literature | Exact + semantic dedup against full training set and holdouts |
| **Eval harness before volume** | Universal practitioner advice (OpenAI FT best practices) | Freeze design eval briefs before collecting large local corpora |

---

## 2. Taxonomy: what a “design LLM” needs to learn

A design-focused model is not one task. Training data must cover distinct objectives:

| Objective ID | Capability | Primary data shape | Typical loss |
|---|---|---|---|
| `D2C` | Screenshot / mock → HTML/CSS | Image + code | SFT (VLM) |
| `C2C` | Direction-conditioned restyle | Brief + before tokens/shot + after CSS/diff | SFT |
| `CRITIC` | Name genericness / defects | Shot + findings / tips | SFT or classifier |
| `RANK` | Prefer better UI of two | (brief, chosen_shot, rejected_shot) | DPO / reward model |
| `AGENT` | Multi-turn tool use to ship UI | Trajectory of tool calls + observations | SFT then multi-turn DPO/KTO/EntroPO |
| `REPAIR` | Fix a named tell | Finding + before → patch | SFT + preference |
| `RESP` | Responsive parity | Multi-viewport linked samples | Multi-image SFT |

**Critical gap in public corpora:** most open datasets optimize `D2C` reconstruction.
Tell’s product advantage is `CRITIC` + `C2C` + `RANK` + human-approved `REPAIR` — exactly
the data public WebSight-style sets lack.

---

## 3. Foundational alignment & data-quality literature

### 3.1 InstructGPT / RLHF pipeline

**Paper:** Ouyang et al., *Training language models to follow instructions with human feedback*
(NeurIPS 2022). arXiv:2203.02155.

**Technique (3-stage):**
1. SFT on human demonstrations
2. Reward model on ranked model outputs
3. PPO policy optimization against the reward model

**Data lesson for design:** collect (a) expert *demonstrations* of good redesigns and
(b) *rankings* of multiple redesigns for the same brief. Do not skip demonstrations and jump
straight to preferences.

### 3.2 LIMA — less is more

**Paper:** Zhou et al., *LIMA: Less Is More for Alignment* (NeurIPS 2023). arXiv:2305.11206.

**Core claim:** 1,000 carefully curated prompt–response pairs can produce strong alignment;
response **quality** and prompt **diversity** matter more than raw count.

**Ablations that transfer to design data:**
- Filtered high-quality answers ≫ unfiltered community answers
- Diverse prompt sources ≫ homogeneous sources at equal N
- Scaling quantity alone without quality/diversity is weak

**Tell application:** Prefer ~hundreds of gold accepted redesign episodes over tens of
thousands of ungraded harness logs.

### 3.3 Constitutional AI / RLAIF

**Paper:** Bai et al., *Constitutional AI: Harmlessness from AI Feedback* (2022).
arXiv:2212.08073.

**Technique:** AI critiques/revises against a written constitution; AI preference labels
train a preference model (RLAIF), optionally mixed with human helpfulness labels.

**Tell application:** Encode a **Design Constitution** (contrast floors, anti-generic
rules, hero budget, no Inter+violet defaults) as critique principles for AI labeling —
but calibrate against human designer rankings and deterministic probes (do not trust AI
labels alone for taste).

### 3.4 Magpie — synthetic instruction extraction

**Paper:** Xu et al., *Magpie: Alignment Data Synthesis from Scratch…* (ICLR 2025).
arXiv:2406.08464.

**Technique:** Prompt an already-aligned model with only the chat template up to the user
slot; sample self-synthesized queries + responses; filter for quality.

**Caution for design:** synthetic instructions help scale *chat* alignment; for visual
design they risk reinforcing average web aesthetics unless filtered by UI quality models
(UIClip) and Tell detectors.

### 3.5 Semantic / near-duplicate removal

**Paper:** Abbas et al., *SemDeDup* (2023). arXiv:2303.09540.  
**Related:** MinHash near-dup (Lee et al. 2021 and pretraining corpus practice);
NVIDIA NeMo Curator semantic dedup docs.

**Technique:** Embed examples → cluster → drop near-centroid semantic duplicates;
combine with exact hash and MinHash n-gram near-dup.

**Tell application:** Dedup on (brief embedding + screenshot embedding + diff hash)
before merging curated JSONL batches.

---

## 4. Preference optimization: algorithms and data requirements

### 4.1 DPO (baseline)

**Paper:** Rafailov et al., *Direct Preference Optimization* (NeurIPS 2023).

**Data shape:** `(prompt, chosen, rejected)` pairs.  
**Practice:** SFT on preferred responses first, then DPO (OpenAI DPO guide).  
**Hyperparam:** `β` trades conservatism vs adaptation.

**Survey:** *A Survey of Direct Preference Optimization* (2024). arXiv:2410.15595 —
covers datasets, theory, variants, failure modes (OOD bias, offline vs online, alignment tax).

### 4.2 Important variants (when to use which)

| Method | Paper | Data shape | When useful for design |
|---|---|---|---|
| **IPO** | Azar et al., 2024 | pairs | More theoretically grounded pairwise prefs |
| **KTO** | Ethayarajh et al., 2024 | unpaired thumbs up/down | When you only have accept/reject, not pairs |
| **ORPO** | Hong et al., 2024 | pairs; can skip separate SFT | Memory-tight single-stage |
| **SimPO** | Meng et al., 2024 | pairs; reference-free | Length-normalized; strong chat results |
| **CPO** | Xu et al., 2024 | pairs + BC regularizer | Drop reference model |
| **RSO** | Liu et al., 2023 | sample many, keep by reward | Rejection sampling into preference sets |
| **RainbowPO** | 2024 | unified XPO view | Combining improvements |
| **GRPO** | Shao et al. / DeepSeekMath; HF TRL docs | group of completions + relative advantage | Online RL when you have verifiable rewards |
| **EntroPO-DPO/KTO** | 2025, arXiv:2509.12434 | multi-turn trajectories | Preserve diversity for agent test-time scaling |

**Practical rule (OpenAI cookbook + HF TRL):**
- Subjective style/taste → DPO/KTO/SimPO on human or calibrated AI prefs
- Verifiable gates (contrast OK, tests pass, detectors clear) → GRPO / RFT-style online RL
- Only unary feedback → KTO
- Long agent sessions → multi-turn EntroPO or hierarchical preference (see §5)

### 4.3 Pair construction (high leverage, often done wrong)

From DPO survey + practitioner “trace-to-training-data” recipes:

1. **Same task_id** for chosen and rejected
2. **Chosen** = top reward / human preferred
3. **Rejected** ≈ μ − 2σ of the reward distribution for that task — *not* the absolute
   worst (absolute worst teaches trivial “don’t emit garbage”)
4. Optional: keep only high Δ(chosen−rejected) pairs (judge-delta filtering)
5. Expert-corrected failures → gold SFT without waiting for reward thresholds

---

## 5. Agent / harness trajectory curation

### 5.1 Why trajectories ≠ chat logs

Coding-agent papers treat a trajectory as a sequence of (state, tool call, observation)
transitions. Training typically **masks** system/user/tool observation tokens and puts loss
on assistant/tool-call tokens (EntroPO; Open-SWE-Traces; trajectory curation study).

### 5.2 Open-SWE-Traces filtering pipeline

**Paper/dataset:** *Open-SWE-Traces* (2026). arXiv:2606.16038 · HF `nvidia/Open-SWE-Traces`.

**Two-stage filter:**
1. **Runtime integrity** — drop corrupted / incomplete environment failures
2. **Behavioral pruning** — drop incompleteness, empty patches, test-suite hacking,
   malformed tool use; standardize `role` / `content` / `tool_calls` (+ optional
   `reasoning_content`)

**Counterintuitive finding:** including some *unresolved* trajectories can beat
resolved-only training — negatives help navigation. For design, keep failed-but-coherent
repair attempts as **rejected** or **repair-context**, not as gold SFT targets.

### 5.3 Systematic trajectory quality scoring

**Paper:** Han et al., *A Systematic Evaluation of Trajectory Data Curation for LoRA
Fine-Tuning of Code Agents* (ICIC 2026). arXiv:2607.17205.

**Two-axis quality:** Efficiency + Style; **dominant sub-dimension:** error-retry rate.  
**Scale effect:** at small N, quantity dominates; at larger N (~2k), Top-Q filtering beats
random with statistical significance.  
**Eval when resolve rate ≈ 0:** held-out CE loss + first-action generation proxies.

**Tell application:** score design agent trajectories on:
- retry/thrash rate
- whether a craft-beat screenshot was produced (not nav-only)
- detector clearance deltas
- human accept

### 5.4 Multi-turn preference & hierarchical prefs

- **EntroPO** (arXiv:2509.12434): entropy-regularized multi-turn DPO/KTO; hybrid
  best-of-N selection with verifier + heuristics
- **Agent Lightning** (arXiv:2508.03680): unify any agent as MDP transitions
  `(state, action, reward)` for RL; hierarchical credit assignment
- **Hierarchical Preference Learning (HPL)** (ICLR 2026 work / open code): trajectory-,
  step-, and group-level preferences for long-horizon agents

**Tell application:** store both episode-level accept/reject *and* step-level “this patch
attempt was worse” when humans discard intermediate proposals.

### 5.5 Trace → dataset engineering (practitioner)

Documented patterns (Langfuse datasets docs; continuous-training playbooks; tools such as
`trace2train`):

1. Export production/agent traces (consent-gated)
2. Score with LLM-as-judge + task metrics
3. High scores → preferred / SFT; low → non-preferred
4. Expert edits failing traces into expected outputs → gold
5. Emit ShareGPT / TRL JSONL for SFT and DPO
6. Hold out goldens; dedup against existing train set

**OpenAI fine-tuning best practices (docs, 2025–26):**
- Fix data quality before scaling quantity
- Balance class/style distribution to match inference
- Every example must contain information needed for the answer
- Annotator agreement bounds model ceiling
- Keep training format identical to inference format
- Split train/test early; estimate gains by half-vs-full dataset runs
- Prefer smaller high-quality over larger low-quality when trading off

---

## 6. Multimodal UI / web design training literature

### 6.1 Classic → modern dataset ladder

| Dataset / paper | Scale | Nature | What it teaches | Weakness for “highest quality” design |
|---|---|---|---|---|
| **pix2code** (Beltramelli, 2018) | small | synthetic mobile/web DSL | Image→code basics | Toy UI blocks |
| **WebSight** (Laurençon et al., 2024) | ~0.8M → 2M | LLM-synthesized HTML/CSS (+ Tailwind v0.2) | Screenshot→HTML at scale | Structurally simple; average aesthetics |
| **Design2Code** (Si et al., 2024) arXiv:2403.03163 | 484 (+ Hard 80) | real C4 / GitHub Pages **eval** | Real difficulty; metrics + human eval | Eval set, not train volume |
| **WebCode2M** (2024) arXiv:2404.06369 | 2.56M | real web + layout; quality scoring filter | Real complexity; TreeBLEU | Still reconstruction-centric |
| **Web2Code** (2024) arXiv:2406.20098 | ~1.18M instruct | refined + synthetic + QA | Webpage understanding + code | Synthetic bias risk |
| **MultiUI** (2024) arXiv:2410.13824 | 7.3M tasks / 1M sites | a11y-tree grounded UI tasks | Grounding, OCR, UI reasoning | Not code generation taste |
| **ScreenParse** (2026) | 1.4M shots | dense element parse | Complete screen structure | Parsing ≠ generation |
| **UIClip** (Wu et al., UIST 2024) arXiv:2404.12500 | 2.3M jitter pairs + 1.2k designer ratings | quality ranking | **Design quality score** | Needs Tell-specific constitution |

### 6.2 Design2Code — eval methods that matter

Automatic metrics used in Design2Code-style work:
- Block matching / element recall
- Text, position, color similarity
- CLIP visual similarity
- Human pairwise preference vs reference

**Prompting methods studied:** direct, text-augmented, self-revision — self-revision helps
frontier VLMs. Layout-guided hierarchical generation (LayoutCoder / UICopilot line of work)
addresses long HTML context limits.

### 6.3 WebSight construction recipe (synthetic scale)

From WebSight writeups:
1. LLM generates website *ideas*
2. Code model emits HTML/CSS (later Tailwind + real images)
3. Render screenshots
4. Filter low-text / misaligned / generic failures
5. Train VLM with embedded CSS in single HTML document

**Lesson:** synthetic is fine for **pretrain fluency**; **do not** use it as the only
preference/taste signal.

### 6.4 UIClip — closest public analog to Tell’s reward model

**Technique:**
1. Crawl real UIs
2. Synthetically **jitter** CSS/layout to create degraded twins
3. Train CLIP-like model to rank original > jittered given a text description
4. Fine-tune / validate with professional designer ratings
5. Downstream: filter codegen, tip generation, example search

**Tell parallel:** Tell detectors + craft-band critique + human accept ≈ a stronger,
domain-specific reward stack than generic CLIP aesthetics. UIClip-style **synthetic
degradation** is an excellent recipe for hard negatives (Inter-only, violet gradients,
equal cards, shadow spam, nav-only crops).

---

## 7. Technique catalog (actionable recipes)

### T1 — Gold demonstration SFT (LIMA / InstructGPT stage 1)

**Keep when:** human accepted patch **and** contrast/basics pass **and** craft-beat
screenshot exists.  
**Record:** brief, direction, before/after shots, fingerprint, findings, final diff/CSS.  
**Loss:** assistant/code tokens only.

### T2 — Expert correction SFT

**Keep when:** human edited agent output.  
**Record:** `(proposal → final)` as the training target; optionally DPO pair proposal as
rejected.  
**Priority:** highest — bypass reward thresholds.

### T3 — Rejection sampling → SFT (RSO pattern)

Sample N redesigns per brief → score with reward R → keep top fraction (e.g. 25%).  
Requires diversity check so N samples are not identical templates.

### T4 — Same-task DPO pairs

`chosen` = best accepted / top-R; `rejected` ≈ μ−2σ or human-disliked alternate.  
Filter on preference margin. Iterate on-policy when possible (static offline DPO goes stale).

### T5 — KTO from unary feedback

Map Report UI / MCP apply events: accept → desirable; discard → undesirable.

### T6 — Constitutional RLAIF labeling

AI judge scores against Design Constitution; **always** mix with human + deterministic
probes; calibrate thresholds on a designer-rated set (UIClip lesson).

### T7 — Jittered hard negatives (UIClip)

From a good page, programmatically inject Tell’s known failure modes; store as rejected
or as CRITIC examples.

### T8 — Trajectory trim

Drop turns with no visual/patch delta; keep tool calls that change DOM/CSS or produce
screenshots; mask observations; grade Efficiency (retry rate) per Han et al.

### T9 — Multi-viewport packing

Link desktop/tablet/mobile under one `sample_id` (WebUI / WebCode2M practice).

### T10 — Hierarchical preferences (HPL pattern)

Episode-level + step-level prefs for long Cursor-like sessions.

### T11 — Dedup + holdout gate

Exact hash → MinHash → SemDeDup embeddings; refuse merge if `episode_id` / brief hash in
holdout manifest.

### T12 — Eval-first card

Freeze briefs × viewports × gates (reconstruct, restyle-under-direction, repair-generic,
mobile parity, anti-cluster) before large curation (OpenAI FT practice).

---

## 8. Recommended reward stack for design curation

Compose a scalar (or vector) reward for ranking — never a single LLM vibe score:

```text
R = w_h · HumanAccept
  + w_c · ContrastFloor          # deterministic
  + w_b · BasicsGates            # a11y/focus/state
  + w_d · DetectorClearance      # Tell findings reduced
  + w_k · CritiqueBandFit        # research corridors, not median chase
  + w_u · UIClipOrAesthetic      # optional learned UI quality
  + w_v · VisualSimilarityToIntent
  − w_g · GenericClusterPenalty  # known AI-default tells
  − w_t · TrajectoryThrash       # error-retry rate
```

Train a Bradley–Terry reward model on pairs when enough human rankings exist (InstructGPT /
UIClip practice). Use R for rejection sampling and DPO pair mining.

---

## 9. Annotated bibliography (core set)

### Alignment & preference

1. Ouyang et al. (2022). InstructGPT / RLHF. arXiv:2203.02155  
2. Bai et al. (2022). Constitutional AI. arXiv:2212.08073  
3. Rafailov et al. (2023). DPO. NeurIPS 2023  
4. Zhou et al. (2023). LIMA. arXiv:2305.11206  
5. Ethayarajh et al. (2024). KTO  
6. Hong et al. (2024). ORPO  
7. Meng et al. (2024). SimPO. arXiv:2405.14734  
8. Azar et al. (2024). IPO  
9. Liu et al. (2023). RSO  
10. DPO Survey (2024). arXiv:2410.15595  
11. RainbowPO (2024). arXiv:2410.04203  
12. Shao et al. / DeepSeekMath — GRPO; HF TRL GRPO docs  
13. Xu et al. (2024). Magpie. arXiv:2406.08464  
14. Abbas et al. (2023). SemDeDup. arXiv:2303.09540  

### Agents & trajectories

15. EntroPO (2025). arXiv:2509.12434 — multi-turn entropy-enhanced preference  
16. Agent Lightning (2025). arXiv:2508.03680  
17. Open-SWE-Traces (2026). arXiv:2606.16038  
18. Han et al. (2026). Trajectory curation for code-agent LoRA. arXiv:2607.17205  
19. Hierarchical Preference Learning (ICLR 2026 line) — traj/step/group prefs  
20. Posterior-GRPO (2025). arXiv:2508.05170 — process rewards via optimize/degrade pairs  

### UI / design multimodal

21. Beltramelli (2018). pix2code  
22. Laurençon et al. (2024). WebSight  
23. Si et al. (2024). Design2Code. arXiv:2403.03163  
24. WebCode2M (2024). arXiv:2404.06369  
25. Web2Code (2024). arXiv:2406.20098  
26. MultiUI (2024). arXiv:2410.13824  
27. ScreenParse (2026). dense screen parsing  
28. Wu et al. (2024). UIClip. arXiv:2404.12500  
29. LayoutCoder / UICopilot (2025) — hierarchical layout-guided UI2Code  

### Practitioner guides

30. OpenAI — Fine-tuning best practices; DPO guide / cookbook  
31. Hugging Face TRL — DPOTrainer, GRPOTrainer docs  
32. Langfuse — Datasets from production traces; expert expected outputs  
33. Continuous training / trace→dataset engineering playbooks (OTel traces → reward label → DPO/GRPO)  
34. NVIDIA NeMo Curator — semantic deduplication guide  

---

## 10. Mapping literature → Tell’s existing artifacts

| Tell artifact | Best literature analog | Training use |
|---|---|---|
| `CapturePayload` + screenshot | WebCode2M / Design2Code inputs | Multimodal conditioning |
| `DesignFingerprint` | Layout/structure features | Compact state; CRITIC features |
| `Finding` + `Evidence` | UIClip suggestions / defect labels | CRITIC SFT; hard negatives |
| `TasteVerdict` | RLAIF labels (noisy) | Soft labels only |
| `ArtDirection` / voice | Instruction conditioning | C2C prompts |
| `Reconciliation` + CSS | WebSight target format | SFT targets |
| `RedesignProposal` diffs | Agent patch actions | AGENT / REPAIR |
| Human apply / edit | InstructGPT demos + Langfuse corrections | Gold SFT / DPO chosen |
| `research/critique` bands | Reward features | R components |
| Recursive-improve champion/challenger | Same-task preference pairs | DPO |
| `LEARNINGS.md` | Constitution + tips | CRITIC / system principles |

---

## 11. Proposed research program (evidence-backed order)

1. **Freeze eval card** (OpenAI practice) — real pages only for holdout (Design2Code lesson)  
2. **Completeness audit** — map 20 Tell episodes onto taxonomy §2; list missing fields  
3. **Reward ablation** — detectors-only vs +critique vs +human vs +UIClip-like jitter model  
4. **Pair construction bake-off** — best-vs-worst vs μ−2σ vs human-correction-only  
5. **Trajectory quality scoring** — implement Efficiency/Style; measure Top-Q vs random at N∈{200,500,2000}  
6. **Synthetic hard-negative bank** — UIClip jitter + Tell anti-patterns  
7. **Dedup + scrub constitution** — SemDeDup + secret redaction fidelity study  
8. **Small LIMA-style SFT** on gold accepted episodes before any large DPO  
9. **Only then** instrument local episode export (consent, gitignored)

---

## 12. What *not* to copy blindly

| Anti-pattern | Why | Source of caution |
|---|---|---|
| Train only on WebSight-like synthetic | Learns average simple sites | Design2Code / WebCode2M analyses |
| Dump all Cursor transcripts into SFT | Teaches thrash & tool noise | Trajectory curation; EntroPO |
| Cross-task preference pairs | Learns task preference, not response quality | DPO practitioner recipes |
| Absolute-worst rejects | Trivial signal | μ−2σ guidance |
| AI judge as sole accept gate | Taste drift / sycophancy | Constitutional AI caveats; UIClip uses humans |
| Optimize to corpus median | Sameness failure mode | Tell research bands philosophy |
| Skip holdout | Inflated eval | Universal |

---

## 13. Next updates to this survey

- [ ] Deep-read remaining PDFs for UltraFeedback, WebUI (HF), TongUI, ScreenCoder  
- [ ] Add table of public HF dataset cards with license notes for local experimentation  
- [ ] Run Tell W1–W3 experiments and append empirical results  
- [ ] Compare UIClip scores vs Tell critique scores on the same pages (calibration study)

---

## Changelog

- **2026-08-09 v1** — Initial full literature survey with technique catalog and Tell mapping.
