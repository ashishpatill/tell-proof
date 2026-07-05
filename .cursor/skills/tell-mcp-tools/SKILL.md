---
name: tell-mcp-tools
description: Implements and uses Tell MCP tools for Cursor integration. Use when working on packages/mcp, tell_capture, tell_diagnose, tell_redesign, tell_apply, .cursor/mcp.json, or driving Tell from Agent chat.
---

# Tell MCP tools

## Scope

- `packages/mcp/src/index.ts` — stdio MCP server
- `.cursor/mcp.json` — registers `pnpm -F @tell/mcp start`

## Tools

| Tool | Args | Returns |
|---|---|---|
| `tell_capture` | `{ url }` | `CapturePayload` |
| `tell_diagnose` | `{ url?, reportPath? }` | `TellReport` |
| `tell_redesign` | `{ direction, findingId? }` | `RedesignProposal` |
| `tell_apply` | `{ proposalId? }` | `{ patches, instruction }` |

## Rules

1. Parse all inputs/outputs with `@tell/schema`
2. `tell_apply` returns patch text only — never writes files
3. `tell_diagnose` without URL/report falls back to `fixtures/reports/tell-report.json`
4. Keep tool descriptions crisp so Cursor Agent calls them correctly
5. MCP and web API share the same engine contracts

## Smoke test in Agent chat

```
Run tell_diagnose on http://localhost:3001 and summarize generic tells.
Draft an editorial redesign for SystemFontTell.
```

## Local dev

```bash
pnpm dev:fixture   # :3001
pnpm -F @tell/mcp start
```

## DoD

- All four tools return schema-valid JSON
- Offline artifact fallback works without live capture
- Apply instructions are explicit for human review

## Related

- Rules: `.cursor/rules/tell-mcp-api.mdc`
- AGENTS.md MCP section
