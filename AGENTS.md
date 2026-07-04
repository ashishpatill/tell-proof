# AGENTS.md — Cursor Agent instructions

You are building **Tell**: an AI taste critic for rendered UI. Read [USER_STORY.md](./USER_STORY.md) first — every feature serves Priya's journey (solo founder, shipped with Cursor, UI looks generic, demo tomorrow).

## Mission

Capture rendered UI → deterministic fingerprint → detect tells + drift → taste verdict → voice art-direction → redesign diff → apply in Cursor (human approves).

## Non-negotiables

1. **Deterministic core** — `packages/core` has zero LLM calls. Taste/redesign only.
2. **Never auto-apply** — MCP `tell_apply` returns patches; human applies.
3. **Schemas** — all boundaries use `@tell/schema` zod types.
4. **Tokens only** in `apps/web` — no raw hex in classNames (dogfood).
5. **User-first copy** — critic voice, problem-oriented, see USER_STORY copy bank.
6. **Build order** — follow BUILD.md §8 milestones M1→M10; protect cut line.

## Where things live

| Path | Purpose |
|---|---|
| `packages/schema` | Zod contracts — edit first |
| `packages/core` | Capture, fingerprint, detectors |
| `packages/taste` | Gemini taste + voice direction |
| `packages/redesign` | Diff generation |
| `packages/mcp` | Cursor MCP server |
| `apps/web` | Priya-facing UI |
| `fixtures/generic-app` | Demo "before" (labeled input, not our work) |
| `fixtures/reports/` | Offline demo artifacts |

## Parallel workstreams (multitask)

When using Task/subagents, split by package boundary — never split a zod schema across agents:

| Agent | Scope | DoD |
|---|---|---|
| A | `packages/schema` + `packages/core` detectors | vitest green on fixture JSON |
| B | `packages/taste` + `packages/redesign` | mock taste returns valid verdicts |
| C | `apps/web` components | matches docs/01_DESIGN_SYSTEM.md |
| D | `fixtures/generic-app` | triggers all planted tells |

Merge only after schema is frozen.

## MCP tools (use in Agent chat)

```
tell_capture({ url })
tell_diagnose({ url?, reportPath? })
tell_redesign({ direction, findingId? })
tell_apply({ proposalId })
```

## Testing before claiming done

```bash
pnpm test
pnpm -F @tell/schema build
pnpm -F @tell/web typecheck
```

## Demo narrative (do not lead with architecture)

1. Priya's bland app → Capture
2. Named tells with evidence
3. Seam drag before/after
4. Voice: "warmer, editorial"
5. Apply in Cursor
6. Dogfood: zero tells on Tell itself

## Docs authority

- Visuals: `docs/01_DESIGN_SYSTEM.md`
- Engineering: `BUILD.md`
- Screens: `docs/03_CLAUDE_DESIGN_BRIEF.md`
- Vision/scope: `docs/04_CLAUDE_PROJECT.md`
