# Tell — Design Capability Flows Plan

> Exhaustive plan for common design tasks and complex functionalities.
> Patterns adapted from study of a peer local-first design daemon (identity
> only in gitignored `research/plumbing-reference.local.json`). **Do not name
> that peer in commits, code, docs, or copy.** Do not copy templates, craft
> aesthetics, or implementation — learn **flow shapes** and encode Tell-native
> equivalents (capture → diagnose → art-direct → reconcile → patch).
>
> Content/craft authority remains: `docs/09`, `docs/10`, `design-research-loop`,
> `tell-template-craft` (plumbing floors only).

---

## 0. Mapping peer flow shapes → Tell product loop

| Peer flow shape (abstract) | Tell equivalent | Status |
|---|---|---|
| Creation intent rail → default scenario | Studio brief + `inferSiteKind` / `routeSkills` | Partial |
| Skill + design-system push/pull into agent prompt | Staged run guidance + report findings | Partial |
| Artifact generate → sandboxed preview | `/studio` + `/showcase` + preview HTML | Shipped |
| Surgical edit / srcdoc bridge | Live seam + future comment-on-element | Partial (seam yes) |
| Design jury / tagged critique stream | Taste verdict + research critique matrix | Partial (different) |
| Brand extract measured from DOM | Detectors + fingerprint (not brand-kit product) | Partial |
| Live artifacts / connectors | Out of core MVP — stretch | Missing |
| Figma import/export | Out of cut line unless demo needs | Missing |
| Media generation tools | Out of scope for critic product | Non-goal |
| Collab comments cloud | Share links only | Partial |
| Creative memory preferences | Future; offline report is memory enough for demo | Missing |
| Plugin pipeline atoms | Tell keeps packages, not plugin marketplace | Non-goal for MVP |
| Library / clipper | Future tab capture | Missing |

**Product identity check:** Tell is a **taste critic + measurable redesign**, not a general design IDE. Prefer deepening the Priya loop over cloning peer surfaces.

---

## 1. Common design tasks — detailed flows

### 1.1 Diagnose a live URL (core)

**Happy path**

1. Priya pastes `http://localhost:3001` (or public URL)
2. CaptureBar → `POST /api/diagnose` **or** MCP `tell_diagnose` **or** `tell diagnose`
3. Playwright capture → fingerprint → detectors → optional taste
4. Report UI: named tells + evidence on real page
5. Offline fallback if capture unhealthy (`meta.live=false`)

**Gaps to close**

- [ ] Explicit loading / failure states parity across web + MCP error payloads (schema)
- [ ] MCP session `reportId` persisted for redesign chain
- [ ] Doctor link when `meta.live=false`

### 1.2 Diagnose a GitHub repo (local convenience)

1. Paste `github.com/owner/repo` → Set up & run
2. `repo-runner` clone → install → wait reachable → diagnose localhost
3. Guarded by setup token + disable flag in prod

**Gaps**

- [ ] Clearer progress events (clone / install / boot / capture)
- [ ] HMAC upgrade per `docs/12` Wave A2
- [ ] MCP local-only `tell_setup_*` (docs/11 Wave 7)

### 1.3 Multi-page / drift scan

1. Pages strip / matrix → `/pricing` etc.
2. `tell_capture_matrix` / `POST /api/proof/matrix`
3. Drift detectors (viewport, design-system)

**Gaps**

- [ ] Intent resolver: “scan pricing” → defaults route list from snapshot links (`discover-routes`)
- [ ] Agent-facing summary of matrix cell failures

### 1.4 Art-direct with voice / text

1. “warmer, editorial, less shadow”
2. `/api/voice` → action items + reconciliation table update
3. MCP missing `tell_voice` today

**Gaps**

- [ ] MCP + CLI parity
- [ ] Compound direction → structured action items always schema-valid with deterministic fallback

### 1.5 Seam / reconcile preview

1. Drag seam on captured page
2. Deterministic token reconciliation + contrast floor
3. Explain measured improvement

**Gaps (peer srcdoc-bridge lessons, Tell-shaped)**

- [ ] Versioned postMessage contract if Studio iframe edit modes expand
- [ ] Preview scope tokens for sandboxed asset GETs (if preview leaves srcdoc)
- [ ] Comment-on-element → instruction → **patch proposal** (never auto-write) as stretch

### 1.6 Draft fix → apply in Cursor

1. Redesign → proposal
2. Copy patch / `tell_apply` returns text
3. Human or Cursor agent applies

**Invariant:** Never auto-apply.

### 1.7 Design from features (Studio)

1. Brief → `designFromFeatures` / `tell_design_from_features`
2. Taste Controls
3. Copy HTML / viewport matrix
4. Optional handoff to diagnose on preview

**Gaps**

- [ ] Unified intent: “make a fintech landing from these features” → Studio defaults + offering key
- [ ] Run-staged skill fragments for the chosen `siteKind` corridor

### 1.8 Proof verify on UI PR

1. CI / hook → proof compare
2. Disposable checkout apply for verify only

**Gaps**

- [ ] CLI `tell proof verify` as sole entry
- [ ] install-info documents CI snippet

### 1.9 Dogfood Tell itself

1. Capture Tell web → expect zero tells
2. `tell-dogfood-audit` skill

**Gaps**

- [ ] One-click dogfood from Settings after Connect Agent

---

## 2. Complex functionalities — detailed plans

### 2.1 Intent / scenario resolver

Peer lesson: home submit never “naked” — kind maps to default scenario.

**Tell-shaped**

- [ ] `tell_resolve_intent({ text, context? })` → zod:

```ts
ResolvedIntent = {
  scenario: 'diagnose-url' | 'diagnose-github' | 'studio-brief' | 'voice-direct'
    | 'proof-verify' | 'matrix-scan' | 'mcp-setup' | 'dogfood'
  defaults: {
    url?: string
    routes?: string[]
    siteKind?: SiteKind
    templateKey?: string
    direction?: string
  }
  confidence: number
  rationale: string  // critic voice, short
}
```

- [ ] Shared implementation used by web CaptureBar suggestions, MCP, CLI
- [ ] Deterministic keyword/heuristic first; optional LLM refine later with fallback

### 2.2 Push / pull design context

Peer lesson: small prompt injection (USAGE/DESIGN/tokens) + on-demand rich files.

**Tell-shaped**

| Channel | Content | When |
|---|---|---|
| Push | Top findings titles, severity, contrast deltas, taste one-liner | Always with report |
| Pull | Full evidence screenshots, fingerprint JSON, staged skills | On agent tool read |

- [ ] MCP resources (optional): `tell://report/active`, `tell://findings/{id}`
- [ ] Keep payloads small for push; use resources/tools for pull

### 2.3 Sandboxed preview contract

- [ ] Document Studio preview trust: srcdoc vs URL
- [ ] If URL preview: mint unguessable scope id for asset routes
- [ ] `Origin: null` allowlist only for those GETs
- [ ] Edit modes (if added): Preview | Tweaks (tokens) | Comment→patch — **no silent file write**

### 2.4 Critique / taste divergence

Peer “design jury” uses tagged multi-role stream. Tell already has:

- Deterministic detectors
- Taste verdict (Gemini + fallback)
- Research critique matrix (`pnpm research:critique`)

**Plan**

- [ ] Do **not** port multi-panelist theater into product MVP
- [ ] Optionally add MCP `tell_critique_research` for engine maintainers (internal)
- [ ] Product: keep critic voice single-narrator (Priya clarity)

### 2.5 Brand / system extraction

Peer brand-extract measures DOM. Tell fingerprint + detectors already measure rendered UI.

**Plan**

- [ ] Expose “design system drift” evidence more actionably in report
- [ ] Optional export: `DESIGN.md` stub from fingerprint tokens (Phase 2 already touched DesignSystemDrift)
- [ ] Do not build full brand-kit library product unless Priya loop demands it

### 2.6 Live artifacts / connectors

Refreshable data-backed artifacts are a peer specialty.

**Tell decision:** **Non-goal for critic MVP.** If ever: only as proof that a redesigned dashboard still reads live data — separate plan, after Waves in docs/11.

### 2.7 Figma

**Tell decision:** Non-goal for cut line. If requested later: import as capture target (rendered preview URL) rather than file format parsers.

### 2.8 Collaboration

- [ ] Keep share links
- [ ] Optional comment anchors on findings (stretch) — local-first, no required cloud
- [ ] No peer collab-cloud dependency

### 2.9 Creative memory

Peer RFC: prefer/avoid injection from past edits.

**Tell-shaped stretch**

- [ ] Store accepted vs rejected directions per report in `TELL_DATA_DIR`
- [ ] Next redesign suggests prior accepted leans
- [ ] Raw events append-only; derived prefs are cache
- [ ] Never blocks offline demo

### 2.10 Template craft loop (already specified)

Authority: `tell-template-craft` + `design-research-loop`.

- Phase A: peer **plumbing** checkout (local path from `plumbing-reference.local.json`) — landmarks, sticky, focus, stacking — encode in `basics-checklist.ts`
- Phase B: measured designer corridors — never peer aesthetics
- Anonymise forever

---

## 3. Cross-surface parity matrix

| Capability | Web | MCP | CLI | Priority |
|---|---|---|---|---|
| Diagnose URL | ✅ | ✅ | Wave 3 | P0 |
| Diagnose GitHub setup | ✅ | ❌ | ❌ | P1 |
| Voice direction | ✅ | ❌ | ❌ | P0 |
| Redesign | ✅ | ✅ | Wave 3 | P0 |
| Apply (patch text) | ✅ | ✅ | Wave 3 | P0 |
| Design from features | ✅ | ✅ | Wave 3 | P0 |
| Matrix / proof | ✅ | ✅ | Wave 3 | P0 |
| Intent resolve | ❌ | ❌ | ❌ | P1 |
| Install MCP | ❌ | ❌ | Wave 2 | P0 |
| Doctor | ❌ | ❌ | Wave 4 | P1 |
| Seam reconcile | ✅ | ❌ | ❌ | P2 (UI-native) |
| Share report | ✅ | ❌ | ❌ | P2 |
| Dogfood | skill | partial | ❌ | P2 |

---

## 4. Implementation waves (capability-focused)

### Wave C0 — Parity & intent

- [ ] `tell_voice` + CLI voice
- [ ] `tell_resolve_intent` + CaptureBar suggestions
- [ ] Persist `reportId` across redesign/apply

### Wave C1 — Run staging

- [ ] After diagnose, write `.tell/runs/<id>/` with report + skill fragments + MANIFEST
- [ ] MCP resource or tool `tell_get_run_context`

### Wave C2 — Preview/edit contract

- [ ] Spec in-repo for srcdoc/postMessage versioning
- [ ] Comment→patch proposal prototype on one finding type

### Wave C3 — Memory (stretch)

- [ ] Accepted direction log
- [ ] Injection into redesign prompt with zod validation

---

## 5. Explicit non-goals

1. Becoming a general design IDE or media generator
2. Plugin marketplace / atom pipelines as a product
3. Porting peer theme packs or named craft templates
4. Multi-agent critique theater in the Priya UI
5. Electron desktop shell
6. Auto-applying surgical edits from iframe selection

---

## 6. Goal prompt

```
@docs/13_DESIGN_CAPABILITY_FLOWS_PLAN.md @docs/11_AGENT_PLATFORM_INTEGRATION_PLAN.md
@USER_STORY.md @packages/design-skills @packages/mcp

GOAL: Execute the next unchecked Wave C* item. Prefer Priya-loop depth over new
surfaces. Do not name or vendor the peer reference. Never auto-apply.

Done when Wave DoD is met and tests stay green.
```

---

## 7. Status log

```
[2026-08-07] Wave C0 partial: tell_voice MCP + CLI; report id on diagnose for redesign chain. Intent resolver still open.
[2026-08-07] Plan authored. Core loop strong; gaps: voice MCP, intent resolver, run staging, preview edit contract.
```
