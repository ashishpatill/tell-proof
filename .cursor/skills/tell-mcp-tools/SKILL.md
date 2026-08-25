---
name: tell-mcp-tools
description: Implements and uses Tell MCP tools for Cursor integration. Use when working on packages/mcp, tell_* tools, .cursor/mcp.json, install-info, or driving Tell from Agent chat.
---

# Tell MCP tools

## Scope

- `packages/mcp/src/index.ts` — stdio MCP server
- `packages/schema` — `McpToolName` / `InstallInfo` / `buildInstallInfo`
- `.cursor/mcp.json` — registers `pnpm -F @tell/mcp start`
- `GET /api/install-info` + `tell mcp install <platform>` — Connect Agent / platform catalog

## Tools

| Tool | Args | Returns |
|---|---|---|
| `tell_capture` | `{ url }` | `CapturePayload` |
| `tell_diagnose` | `{ url?, reportPath? }` | `TellReport` (with `id`) |
| `tell_redesign` | `{ direction, findingId?, reportId? }` | `RedesignProposal` |
| `tell_apply` | `{ proposalId?, projectRoot? }` | `{ patches, instruction }` |
| `tell_capture_matrix` | `{ url, routes?, compare? }` | matrix + proof |
| `tell_proof_verify` | `{ url, patch, projectRoot?, … }` | proof verdict |
| `tell_proof_revert` | `{ projectRoot?, patch? }` | `{ reverted }` |
| `tell_design_from_features` | brief fields | `DesignSpec` (+ HTML) |
| `tell_voice` | `{ transcript }` | direction plan + source |
| `tell_install_info` | `{ launch? }` | `InstallInfo` |
| `tell_resolve_intent` | `{ text, fixtureUrl? }` | `ResolvedIntent` |

Web-only today: `/api/setup/*`, share links (see `docs/11`).

## Rules

1. Parse all inputs/outputs with `@tell/schema`
2. `tell_apply` returns patch text only — never writes files
3. `tell_diagnose` without URL/report falls back to `fixtures/reports/tell-report.json`
4. Tool names must match `MCP_TOOL_NAMES` (vitest drift guard)
5. MCP and web API share the same engine contracts
6. When sibling `tell-design-data` exists, `tell_diagnose` / `tell_redesign` /
   `tell_proof_verify` / `tell_design_from_features` write raw episodes via the
   same sink as `/api/design` (`@tell/design-skills/training-data-sink`). Missing
   sink ⇒ no-op. Still eleven tools; no public MCP host.

## One-click / install

```bash
tell mcp install cursor --project   # upsert .cursor/mcp.json
tell mcp install claude             # claude mcp add-json or .mcp.json
tell mcp install opencode --project
tell mcp install grok --project
tell mcp platforms                  # compatibility table
tell mcp print-config               # all agent snippets + deeplink
curl -s localhost:3000/api/install-info | jq .platforms
```

## Smoke test in Agent chat

```
Run tell_diagnose on http://localhost:3001 and summarize generic tells.
Parse voice: warmer, editorial, less shadow via tell_voice.
Draft an editorial redesign for SystemFontTell.
```

## Local dev

```bash
pnpm dev:fixture   # :3001
pnpm -F @tell/mcp start
# or: pnpm tell -- doctor
```

## DoD

- All eleven tools return schema-valid JSON
- Offline artifact fallback works without live capture
- Apply instructions are explicit for human review
- install-info + multi-platform `tell mcp install` paths work without hand-edited JSON

## Related

- Rules: `.cursor/rules/tell-mcp-api.mdc`
- Plans: `docs/11`–`docs/13`
- AGENTS.md MCP section
