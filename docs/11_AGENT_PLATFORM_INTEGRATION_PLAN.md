# Tell — Agent & Platform Integration Plan

> Exhaustive plan for how Tell reaches coding agents and platforms.
> Patterns are **adapted** from study of a peer local-first design daemon
> (identity lives only in gitignored `research/plumbing-reference.local.json`).
> **Do not name that peer in commits, code, docs, or copy.** Do not copy its
> implementation — learn boundaries and ship Tell-shaped equivalents.
>
> Authority chain: `USER_STORY.md` → this plan → `BUILD.md` / `PLAN.md` cut line.
> Non-negotiables: deterministic core, never auto-apply, `@tell/schema` at
> every boundary, offline fixture fallback, Ashish loop first.

---

## 0. Why this plan exists

Ashish's loop today works **inside this monorepo** (stdio MCP + web + fixtures).
Distribution and multi-harness ergonomics are the gap: clone-or-bust MCP
registration, Cursor-only agent surface, fragmented `pnpm` scripts, and no
single source of truth for install snippets.

This plan turns peer learnings into a **Tell-shaped** platform layer:

| Peer lesson (abstract) | Tell adaptation |
|---|---|
| Daemon + thin MCP proxy | Keep engine in packages; MCP/CLI/web wrap same functions |
| Bidirectional MCP | Export Tell tools; import only read-only connectors later |
| Multi-agent install strategies | `tell mcp install` with cli / json / manual + Cursor deeplink |
| Hosted curl installer | Optional; monorepo clone remains demo-primary |
| `install-info` API | Single snippet source for README / UI / CLI / deeplink |
| Skills staged per run | Guidance copies under `.tell/runs/<id>/`, not global agent skill install |
| Rich CLI mirroring HTTP | `@tell/cli` subcommands = API = MCP tools |
| Packaged resources in releases | Publishable `@tell/mcp` + `@tell/cli` with offline report |

---

## 1. Current Tell baseline (as of plan authoring)

| Surface | Status | Notes |
|---|---|---|
| MCP server | Shipped (partial) | `packages/mcp` — stdio, 8 `tell_*` tools, in-process engine |
| MCP registration | Manual | Committed `.cursor/mcp.json` → `pnpm -F @tell/mcp start` |
| Web API | Shipped | `/api/diagnose`, `/api/redesign`, `/api/voice`, `/api/design`, `/api/proof/*`, `/api/setup/*` |
| CLI | Partial | Root `pnpm` scripts; `tell-mcp` bin private; no unified `tell` |
| Skills | Partial | `.cursor/skills/` + `agent-skills/` + `@tell/design-skills` engine |
| Agents | Cursor-only | `.cursor/agents/`, hooks, ORCHESTRATION.md |
| Auth | Demo harness | Playwright `storageState`; setup token; no run-scoped MCP tokens |
| Publish | Missing | All packages `private: true` |

**Known drift:** `.cursor/skills/tell-mcp-tools` and `mcp-engineer` agent still document 4 tools; server ships 8. Fix in Wave 0.

### 1.1 MCP tools inventory (source of truth = code)

| Tool | Role in Ashish loop |
|---|---|
| `tell_capture` | Capture rendered URL → fingerprint input |
| `tell_diagnose` | Capture + detect (+ optional taste) → report |
| `tell_redesign` | Direction → patch proposal |
| `tell_apply` | **Patch text + instructions only** — never writes repo |
| `tell_capture_matrix` | Route × viewport × theme × interaction |
| `tell_proof_verify` | Proof compare / verify |
| `tell_proof_revert` | Revert disposable proof checkout |
| `tell_design_from_features` | Brief → deterministic design spec + HTML |

Web-only today (MCP gap): `/api/voice`, `/api/setup/*`, share links, health.

---

## 2. Architecture target (Tell-shaped)

```text
┌──────────────────────────────┐
│ Coding agents / IDEs         │  Cursor (primary), Claude Code, Codex,
│ (stdio MCP clients)          │  Windsurf, VS Code Copilot Chat, Zed, …
└──────────────┬───────────────┘
               │ stdio MCP (tell-mcp)
               ▼
┌──────────────────────────────┐
│ @tell/mcp  +  @tell/cli      │  Thin adapters — same engine calls
└──────────────┬───────────────┘
               │ import packages
               ▼
┌──────────────────────────────┐
│ @tell/core · taste · redesign│  Deterministic through detect/reconcile
│ @tell/design-skills · schema │  LLM only taste/voice/enhanced draft
└──────────────┬───────────────┘
               │
     ┌─────────┴──────────┐
     ▼                    ▼
 apps/web (/api/*)    fixtures/reports (offline)
```

**Invariant:** MCP never becomes a second engine. Every tool is a thin zod-validated wrapper around package functions already used by web.

---

## 3. Wave plan (ordered, cut-aware)

### Wave 0 — Correctness & drift (do first, small)

- [ ] Sync `tell-mcp-tools` skill + `mcp-engineer` agent to all 8 tools
- [ ] Add vitest/CI assertion: MCP tool names exported ≡ skill table ≡ schema enum
- [ ] Add `McpToolName` (or equivalent) to `@tell/schema`
- [ ] Document web-only routes as explicit “not in MCP yet” in skill

**DoD:** Agent docs cannot drift from `packages/mcp/src/index.ts` without CI red.

### Wave 1 — Install-info single source of truth

- [ ] Schema: `InstallInfo` in `@tell/schema` (mcp configs, CLI one-liners, requirements, demo URLs)
- [ ] `GET /api/install-info` on `@tell/web` (works offline with static defaults)
- [ ] `tell mcp print-config` (CLI or MCP helper) prints Cursor / Claude / VS Code / Windsurf / Zed / Codex snippets from same builder
- [ ] README + BUILD + DEPLOY snippets regenerated from install-info (or linked)

**Payload sketch (zod):**

```ts
// conceptual — implement in @tell/schema
InstallInfo = {
  version: string
  requirements: { node: string, pnpm?: string, playwright: boolean }
  demo: { fixtureUrl: string, offlineReportPath: string }
  mcp: {
    cursor: { mcpServers: Record<string, { command: string, args: string[], env?: Record<string,string> }> }
    claudeCli: string  // one-liner
    vscode: object     // servers key + type stdio
    windsurf: object
    zed: object        // context_servers
    codex: string      // toml or cli
    manual: object
  }
  cli: { npx?: string, pnpm: string, tellDiagnose: string }
  deeplink?: { cursor?: string }  // base64 config when ready
}
```

**DoD:** Changing launch command updates API + CLI print + docs generator in one place.

### Wave 2 — One-command / one-click MCP install

Peer lesson: three strategies — **cli** (agent owns config), **json** (merge into known path), **manual** (print only).

#### 2.1 Strategy matrix for Tell

| Agent / host | Strategy | Target path / command | Priority |
|---|---|---|---|
| Cursor | json + **deeplink** | `~/.cursor/mcp.json` or project `.cursor/mcp.json` | P0 |
| Claude Code | cli | `claude mcp add …` / `add-json` | P0 |
| Codex | cli or toml | `codex mcp add` / `~/.codex/config.toml` | P1 |
| VS Code Copilot Chat | json | workspace/user MCP `servers` | P1 |
| Windsurf | json | `~/.codeium/windsurf/mcp_config.json` | P1 |
| Zed | json | `context_servers` | P2 |
| Antigravity / Gemini-branded | json | documented path from install-info | P1 |
| Cline / Kiro / OpenCode / Qwen / Kimi / Pi / Trae / Grok / Hermes / OpenClaw | json/toml/yaml | `tell mcp install <id>` | P1 |
| Muse Code / Z Code | manual snippet | print until path verified | P3 |
| Continue.dev | manual | snippet only until verified | P3 |

#### 2.2 Tell commands / UI

- [ ] `tell mcp install <agent> [--project|--user]`
- [ ] `tell mcp uninstall <agent>`
- [ ] `tell mcp status` — probes config presence + daemon health (`/api/health/capture` when web up)
- [ ] Web Settings (or CaptureBar overflow): “Connect Agent” panel with Copy + Cursor one-click
- [ ] Cursor deeplink: `cursor://anysphere.cursor-deeplink/mcp/install?name=tell&config=<base64>`

#### 2.3 Optional hosted installer

- [ ] `install.sh` that: checks Node 20+, installs CLI or clones shallow, `playwright install chromium`, runs `tell mcp install "$1"`
- [ ] Idempotent; refuses unknown agents; documents `/usr/bin/od`-style PATH collisions generically (“shadowed binary names”)

**DoD:** From a clean machine, Ashish (or a judge) can connect Cursor MCP without hand-editing JSON.

**Cut line:** If behind, ship Cursor project `.cursor/mcp.json` writer + deeplink only; keep other agents as print-config.

### Wave 3 — Unified `@tell/cli`

- [ ] New `packages/cli` with bin `tell`
- [ ] Subcommands mirror MCP/API 1:1:

| Subcommand | Maps to |
|---|---|
| `tell diagnose --url` | `/api/diagnose`, `tell_diagnose` |
| `tell capture --url` | `tell_capture` |
| `tell redesign --direction` | `tell_redesign` |
| `tell apply --proposal` | print patch only |
| `tell design --brief` | `tell_design_from_features` |
| `tell proof verify\|matrix\|revert` | proof APIs |
| `tell voice --text` | `/api/voice` |
| `tell mcp …` | Wave 2 |
| `tell doctor` | toolchain probe |
| `tell install-info` | print JSON |

- [ ] CI scripts (`pr-diagnose`, matrix) call CLI instead of ad-hoc `tsx`
- [ ] `tell apply` **never** writes; proof verify may write only in disposable checkout (existing rule)

**DoD:** `tell diagnose --url http://localhost:3001` returns live report with `meta.live=true` when fixture+Playwright ready.

### Wave 4 — Doctor / toolchain detection

Peer lesson: GUI-stripped PATH + user toolchain dirs (`~/.local/bin`, mise/nvm/fnm, Homebrew).

- [ ] `tell doctor` checks: Node ≥20, pnpm, Playwright Chromium, ports 3000/3001 free-or-ours, `.cursor/mcp.json`, capture health
- [ ] Prepend well-known toolchain bins when spawning capture/setup children (extend `repo-runner` pattern)
- [ ] Emit adapter-specific fix hints from install-info

**DoD:** Doctor output is copy-pasteable into a Chat reply for Ashish.

### Wave 5 — Skills packaging & run staging

#### 5.1 Keep Tell’s dual model (do not collapse)

| Kind | Location | Runtime |
|---|---|---|
| Agent workflow skills | `.cursor/skills/` | Cursor auto-attach |
| Premium design skill graph | `agent-skills/web-design/…` | Agents + Studio |
| Deterministic engine | `packages/design-skills` | `designFromFeatures` / MCP |

#### 5.2 Peer lessons to adapt (not copy)

- Frontmatter `name` + `description` (+ optional Tell extensions under `tell:` if needed)
- **Do not** symlink Tell skills into every agent’s global skill folder on each run
- **Do** stage a run-scoped guidance bundle after diagnose:

```text
.tell/runs/<runId>/
  report.json
  skills/           # finding-relevant SKILL fragments + craft floors
  MANIFEST.json     # hashes, schema version
```

- Craft floors (`basics-checklist`, design evidence corridors) inject as **guidance**, never as auto-applied CSS

#### 5.3 Publishable skill packs (later)

- [ ] When `@tell/mcp` publishes: bundle offline report + selected `agent-skills` + skill index
- [ ] `tell skills list|show` reads local + bundled index

**DoD:** After `tell_diagnose`, Agent can open staged guidance that names the actual findings without re-reading the whole skill tree.

### Wave 6 — Bidirectional MCP (optional, careful)

- [ ] MCP **client** config store (user-added external servers) — stdio / SSE / HTTP
- [ ] Templates limited to **read-only** connectors useful to Ashish (deploy status, capture host health)
- [ ] Never import a tool that can write patches into user repos
- [ ] If OAuth needed for connectors: daemon/web owns OAuth (PKCE); tokens chmod 0600; not agent-subprocess localhost listeners
- [ ] Imported results wrap through `@tell/schema` before entering report UI

**Cut line:** Skip entirely if Wave 2–3 unfinished. Ashish does not need Figma/media MCP imports for the core demo.

### Wave 7 — MCP ↔ web parity

- [ ] `tell_voice` tool → same as `/api/voice`
- [ ] Optional `tell_setup_*` **local-only** tools gated like `setup-guard.ts`
- [ ] `tell_health` → capture readiness
- [ ] Session state: prefer explicit `reportId` / file path over sole in-memory `lastReport` for redesign→apply chain

**DoD:** Agent can drive diagnose → voice direction → redesign → copy patch without leaving Chat.

### Wave 8 — Publish & package

- [ ] Publish `@tell/schema`, `@tell/mcp`, `@tell/cli` (or single `@tell/mcp` with CLI) — decide one package strategy
- [ ] Bundle `fixtures/reports/tell-report.json` for offline diagnose
- [ ] Document: monorepo still required for web UI + fixture app; MCP-only consumers get diagnose/redesign/proof
- [ ] Version install-info with package version

---

## 4. One-click / install UX detail

### 4.1 Cursor deeplink flow

1. User opens Tell web → Connect Agent → Cursor
2. UI fetches `/api/install-info`
3. Builds base64 JSON `{ command, args, env }`
4. Hidden `<a href="cursor://…/mcp/install?name=tell&config=…">` click
5. Fallback: Copy JSON + “Paste into Cursor MCP settings”

### 4.2 Project vs user scope

| Scope | When | Path |
|---|---|---|
| Project (default for Tell demo) | Repo already open | `.cursor/mcp.json` |
| User | Ashish wants Tell on every repo | `~/.cursor/mcp.json` merge |

Merge rules: never delete unrelated servers; upsert key `"tell"` only; validate JSON before write; backup `.bak` once.

### 4.3 Failure modes (must have copy)

| Failure | Ashish-facing copy |
|---|---|
| No Node / wrong version | “Tell needs Node 20+. Run `tell doctor`.” |
| No Playwright | “Live capture needs Chromium. Offline report still works.” |
| Port conflict | Report conflict; do not kill foreign processes (see local-dev rule) |
| Deeplink blocked | Show copy JSON fallback immediately |
| MCP starts but capture fails | “meta.live=false — using offline report; fix Chromium via doctor” |

---

## 5. Platform integration matrix (exhaustive intent)

| Platform | MCP install | Skills | CLI | Notes |
|---|---|---|---|---|
| Cursor Desktop / Cloud | P0 deeplink + json | `.cursor/skills` native | via terminal | Primary |
| Claude Code | P0 cli (+ `.mcp.json` fallback) | Optional manual skill copy | yes | |
| Codex | P0 toml | — | yes | |
| Grok Build | P0 toml | — | yes | |
| OpenCode | P0 json (`mcp` local) | — | yes | |
| VS Code + Copilot Chat | P1 json | — | yes | |
| Windsurf | P1 json | — | yes | |
| Zed | P2 `context_servers` | — | yes | |
| Cline / Kiro / Kimi / Qwen / Pi / Trae / Antigravity | P1–P2 json | — | yes | |
| Hermes Agent | P2 yaml | — | yes | |
| OpenClaw | P2 `mcp.servers` | — | yes | |
| Muse Code / Z Code | P3 snippet | — | print | Paths unverified — paste snippet |
| JetBrains / others | P3 manual | — | yes | |
| Browser-only (Vercel web) | N/A | N/A | N/A | Capture via remote API |
| Docker capture host | N/A MCP stdio | N/A | doctor remote | Document MCP limitation if containerized |

**Do not** build Electron desktop or agent-runtime spawning of Claude/Codex as a product goal — Tell diagnoses UI; it does not replace the user’s coding agent.

---

## 6. Observability & contracts

- [ ] Zod every new install/MCP/CLI boundary in `@tell/schema`
- [ ] Analytics optional, privacy-first (no prompt bodies by default)
- [ ] MCP smoke (`_smoke.mjs`) extended for install-info shape
- [ ] E2E: Settings Connect Agent copy button; deeplink href shape unit test

---

## 7. Explicit non-goals

1. Spawning third-party coding agents as Tell subprocesses for generation
2. Product user accounts / OAuth login for Tell itself (PLAN.md)
3. Auto-apply patches from MCP or CLI
4. Global symlinking of Tell skills into every agent home on each run
5. Naming or vendoring the peer design daemon in this repository
6. Copying peer theme packs, templates, or craft aesthetics into offerings

---

## 8. Dependency on sibling plans

| Plan | Overlap |
|---|---|
| `docs/12_AUTH_SECURITY_BOUNDARIES_PLAN.md` | Tokens, origins, capture hardening when MCP/HTTP expose |
| `docs/13_DESIGN_CAPABILITY_FLOWS_PLAN.md` | Intent resolver, run staging, Studio/MCP parity for design tasks |
| `docs/09_PREMIUM_DESIGN_SKILLS.md` | Skill graph content (this plan = distribution) |
| `PLAN.md` | Checklist entry for Phase 8 when Waves 0–2 land |

---

## 9. Goal prompt (paste into Cloud Agent)

```
@docs/11_AGENT_PLATFORM_INTEGRATION_PLAN.md @packages/mcp @packages/schema
@USER_STORY.md @PLAN.md

GOAL: Execute the next unchecked Wave item in docs/11 (start at Wave 0).
Adapt patterns only — do not copy peer implementations; do not name the peer.
Keep deterministic core + never auto-apply + zod boundaries + offline fallback.

Done when that Wave's DoD is checked in docs/11 and pnpm test + schema build +
web typecheck stay green.
```

---

## 10. Status log

```
[2026-08-07] Waves 0–2 + voice + install_info tools shipped in code (see PLAN Phase 8).
[2026-08-07] Plan authored from peer plumbing study (anonymised). Baseline: stdio MCP 8 tools, Cursor-only install, no install-info/CLI/deeplink.
```
