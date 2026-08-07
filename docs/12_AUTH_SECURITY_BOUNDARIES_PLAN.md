# Tell — Auth & Security Boundaries Plan

> Exhaustive plan for authentication, authorization, and trust boundaries.
> Patterns adapted from study of a peer local-first design daemon (identity
> only in gitignored `research/plumbing-reference.local.json`). **Do not name
> that peer in commits, code, docs, or copy.** Do not copy implementations.
>
> Product constraint (from `PLAN.md`): disposable Playwright `storageState` for
> demo auth cells — **do not build product login/OAuth for Tell users.**
> This plan is about **daemon/API/agent trust envelopes**, not Priya accounts.

---

## 0. Principles

1. **Local-first default** — loopback is trusted for UX; public bind requires stronger gates.
2. **Route-class auth** — different trust models for browser UI, MCP stdio, setup proxy, capture backend, agent tools — not one global middleware.
3. **Capability attenuation** — short-lived, scope-narrowed tokens for agent→daemon calls; revoke on run end.
4. **Never auto-apply** — even authenticated callers get patches, not silent writes (except disposable proof checkout).
5. **Cloud progressive enhancement** — optional keys (`GEMINI_API_KEY`, `CURSOR_API_KEY`, remote capture) never gate the offline loop.
6. **No peer naming / no stolen crypto code** — reimplement Tell-shaped gates with `@tell/schema` types.

---

## 1. Current Tell baseline

| Mechanism | Purpose | Trust model | Gap vs peer lessons |
|---|---|---|---|
| Playwright `storageState` + `TELL_AUTH_STORAGE_STATE` | Demo `/account` gated cells | Fixture cookie | Keep — product auth non-goal |
| `TELL_REPO_SETUP_TOKEN` + header | Trusted GitHub clone/run proxy | Shared secret | Upgrade to signed requests for high-risk ops |
| `TELL_DISABLE_REPO_SETUP` | Kill setup on public deploy | Env kill switch | Keep |
| Localhost gate for auth matrix | Auth cells only on loopback (or explicit) | Host check | Generalize to capture API |
| Optional model API keys | Taste / Cursor draft | Env secrets | Keep offline fallback |
| MCP stdio | Parent process trust | Implicit | Add run tokens only if HTTP MCP appears |
| Remote `TELL_CAPTURE_API_URL` | Vercel → capture host | URL only | **Needs API token + origin allowlist** |

---

## 2. Target layered model (Tell-shaped)

```text
┌─────────────────────────────────────────────────────────────┐
│ Layer A — Transport trust                                     │
│   MCP stdio (parent process) · loopback HTTP · public bind   │
├─────────────────────────────────────────────────────────────┤
│ Layer B — Origin / peer gates                                 │
│   browser Origin allowlist · Sec-Fetch-Site · loopback Host  │
├─────────────────────────────────────────────────────────────┤
│ Layer C — Capability tokens                                   │
│   setup token · capture API token · optional run-scoped JWT  │
├─────────────────────────────────────────────────────────────┤
│ Layer D — Operation policy                                    │
│   never auto-apply · setup local-only · proof disposable only│
├─────────────────────────────────────────────────────────────┤
│ Layer E — Optional cloud                                      │
│   Gemini / Cursor SDK / remote capture — progressive         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Wave plan

### Wave A0 — Capture backend hardening (highest deploy risk)

When Tell web on Vercel proxies to a capture host (`TELL_CAPTURE_API_URL`):

- [ ] Schema: `CaptureApiAuth` / env docs in `.env.example`
- [ ] `TELL_CAPTURE_API_TOKEN` required when capture binds non-loopback
- [ ] Client (`remote-api.ts`) sends `Authorization: Bearer …` or `x-tell-capture-token`
- [ ] Server rejects missing/invalid token with plain-language 401
- [ ] `TELL_CAPTURE_ALLOWED_ORIGINS` (comma list) for browser-originated diagnose if ever exposed
- [ ] Default bind `127.0.0.1` in Docker/Vultr docs; document public bind + token as pair
- [ ] Health endpoint: unauthenticated **readiness only** (no diagnose)

**DoD:** Public IP capture host without token cannot run diagnose; with token, Vercel proxy works.

**Copy:** “Capture host refused the request — check TELL_CAPTURE_API_TOKEN on web and capture.”

### Wave A1 — Origin allowlist for web API (self-host / reverse proxy)

- [ ] `TELL_ALLOWED_ORIGINS` for non-loopback deployments
- [ ] Loopback origins always allowed in local `pnpm dev`
- [ ] `Origin: null` only for sandboxed preview GETs if Studio iframes need it (whitelist paths)
- [ ] SSRF: keep `repo-runner` / setup from fetching arbitrary internal metadata URLs; allowlist hosts for clone

**DoD:** Documented reverse-proxy deploy in `docs/DEPLOY.md` with origins set.

### Wave A2 — Setup proxy signing upgrade

Today: shared secret equality check.

Target:

- [ ] Keep env token for simple local trust
- [ ] Optional HMAC: `x-tell-setup-signature` over `method\npath\ntimestamp\nbodyHash` with 60s skew
- [ ] Single-use nonce store for folder/import-like ops if Tell adds “import local folder”
- [ ] Fail closed when `TELL_REQUIRE_SETUP_HMAC=1`

**DoD:** Unit tests for valid / expired / replay / wrong path.

**Note:** Peer desktop↔daemon HMAC is Electron-specific. Tell adapts the *idea* (per-op signed capability) without building Electron.

### Wave A3 — Run-scoped capability tokens (when MCP or tools go HTTP)

Only needed if Tell exposes agent-callable HTTP tools beyond stdio:

- [ ] Mint `tell_run_*` token at diagnose/redesign session start
- [ ] Scopes enum in schema: `diagnose | redesign | proof_verify | design | voice` — **never `apply_write`**
- [ ] TTL ≤ 15 minutes; revoke on session end
- [ ] Bind optional `reportId` / `projectPath` hash
- [ ] Stdio MCP continues to skip tokens (trusted parent)

**DoD:** Token with only `diagnose` cannot call redesign; expired token 401.

### Wave A4 — Pairing codes (future browser extension)

Low priority for Priya demo. If “capture this tab” extension ships:

- [ ] UI (loopback only): `POST /api/pair` → 6-digit code, 5 min TTL
- [ ] Extension: confirm with `chrome-extension://` origin → mint `tell_ext_*`
- [ ] Store **hash** of token, not raw; persist extension origin allowlist
- [ ] Zero-config narrow bypass **only** for probe+ingest if MV3 origin is unforgeable — never for full library dump

**DoD:** Extension without pair cannot list prior reports; with pair can submit capture.

### Wave A5 — External connector OAuth (only with bidirectional MCP)

From `docs/11` Wave 6:

- [ ] Daemon/web owns OAuth (PKCE, discovery); not agent-subprocess ephemeral ports
- [ ] Token file permissions 0600 under Tell data dir
- [ ] Read-only scopes preferred
- [ ] **Still no product user login**

### Wave A6 — Registry / publish auth (if Tell publishes plugins later)

- [ ] Prefer delegating to `gh` CLI for GitHub publish — do not custody GitHub tokens in Tell daemon
- [ ] Out of scope until Tell has a plugin registry product

---

## 4. Route-class matrix (exhaustive)

| Route class | Examples | Auth | Notes |
|---|---|---|---|
| Public read | Landing, static | None | |
| Demo offline | GET offline report path | None | Committed fixture |
| Local diagnose | `POST /api/diagnose` on :3000 | Loopback / origins | |
| Remote diagnose | Capture host | **API token** (A0) | |
| Proof | `/api/proof/*` | Same as diagnose + local FS | Disposable apply only in proof |
| Redesign / voice | `/api/redesign`, `/api/voice` | Same | Optional Cursor/Gemini keys |
| Setup | `/api/setup/*` | Setup token + local-only | Kill switch in prod |
| Share | `/api/reports/share` | Hosting credentials (Neon/Blob) | |
| MCP stdio | `tell_*` | Parent process | |
| MCP HTTP (future) | — | Run token (A3) | |
| Health | `/api/health/capture` | None (readiness) | No secrets |
| Install-info | `/api/install-info` | None or loopback | No secrets in payload |
| Pairing (future) | `/api/pair*` | Loopback to mint; token for use | A4 |

---

## 5. Data storage contract

Define a single data root early (even if default is cwd-relative):

| Store | Suggested location | Contents |
|---|---|---|
| App / install prefs | `<TELL_DATA_DIR>/app-config.json` | MCP install choices, doctor cache |
| Run artifacts | `<TELL_DATA_DIR>/runs/<id>/` | reports, staged skills |
| Tokens | `<TELL_DATA_DIR>/tokens/` | capture, run, ext — chmod 0600 |
| Auth harness | env / temp file | Playwright storageState (existing) |
| HMAC secrets | `<TELL_DATA_DIR>/hmac.key` | gitignored |

**Invariant:** Never commit tokens, storageState with real sessions, or hmac keys.

---

## 6. Threat model (Tell-specific)

| Threat | Mitigation |
|---|---|
| Public capture host open diagnose | A0 token + bind loopback by default |
| CSRF from random site → local :3000 | Origin allowlist (A1); SameSite cookies if any |
| Agent tool exfiltrates FS | MCP tools only touch capture targets + report paths; no arbitrary `read_file` of `$HOME` |
| `tell_apply` writes user repo | Hard non-negotiable — return text only |
| Setup clones malicious repo | Trusted-repos guidance; local-only; token; optional HMAC |
| Token replay | TTL + nonce for signed setup; run token revoke |
| Prompt injection via MCP | Zod parse; no shell interpolation of tool args |
| Supply chain via curl installer | Document checksums; prefer `npx`/`pnpm` over pipe-to-shell when possible |

---

## 7. Explicit non-goals

1. Priya product accounts, passwords, social login
2. Replacing Cursor auth
3. Storing GitHub PATs in Tell for registry (delegate to `gh` if ever needed)
4. Auto-trusting all `chrome-extension://` origins for full API
5. Electron desktop auth gates (unless Tell ships desktop later — not planned)

---

## 8. Goal prompt

```
@docs/12_AUTH_SECURITY_BOUNDARIES_PLAN.md @docs/DEPLOY.md @apps/web/src/lib/remote-api.ts
@apps/web/src/lib/setup-guard.ts @USER_STORY.md

GOAL: Execute the next unchecked Wave (start A0) for capture/API trust envelopes.
Do not build product login/OAuth. Do not name the peer reference. Keep offline
fallback and never-auto-apply.

Done when Wave DoD is met and docs/.env.example updated.
```

---

## 9. Status log

```
[2026-08-07] Plan authored. Baseline: storageState harness + setup token; capture remote URL lacks API token.
```
