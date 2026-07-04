# Tell

> **Every AI-built UI has a tell.** You shipped fast with Cursor. Now make it look like *yours*.

Tell captures what your product actually looks like in the browser, names the patterns that make it read as generic, catches consistency drift across the surface, and — in plain English or by voice — proposes a distinctive art direction you apply as a diff inside Cursor.

**Built for the Cursor hackathon track.** Runs in the browser and inside Cursor via MCP.

---

## The problem (a real day)

**Priya** shipped her SaaS landing page in a weekend with Cursor. It works. It converts. But when she opens it next to three other AI-built products, they could swap homepages and nobody would notice.

She doesn't have a designer on retainer. She doesn't want another dashboard. She wants to:

1. See *what* makes her UI feel generic — with evidence, not vibes
2. Preview what a considered direction could look like — before touching code
3. Say "warmer, more editorial" and get a patch she applies in Cursor — without a sync meeting

That's Tell.

---

## Quick start

```bash
cd tell
pnpm install
pnpm dev:fixture   # deliberately bland demo app → http://localhost:3001
pnpm dev           # Tell UI → http://localhost:3000
```

Open Tell, capture `http://localhost:3001`, read the report, drag the before/after seam, art-direct with voice or presets, apply the diff in Cursor.

**Offline demo:** Tell loads `fixtures/reports/tell-report.json` if live capture is slow.

---

## Cursor integration

1. Open this repo in Cursor
2. MCP server `tell` is registered in `.cursor/mcp.json`
3. In Agent chat: *"Run tell_diagnose on http://localhost:3001 and draft an editorial redesign"*

Tools: `tell_capture`, `tell_diagnose`, `tell_redesign`, `tell_apply`

---

## Docs

| Doc | Purpose |
|---|---|
| [USER_STORY.md](./USER_STORY.md) | Persona, journey, judge-facing narrative |
| [BUILD.md](./BUILD.md) | Engineering spec + build order |
| [docs/01_DESIGN_SYSTEM.md](./docs/01_DESIGN_SYSTEM.md) | Visual contract |
| [docs/04_CLAUDE_PROJECT.md](./docs/04_CLAUDE_PROJECT.md) | Vision, scope, demo script |
| [AGENTS.md](./AGENTS.md) | Instructions for Cursor Agent |
| [CLAUDE.md](./CLAUDE.md) | Instructions for Claude Code / Claude Project |

---

## Monorepo

```
packages/schema   → zod contracts
packages/core     → capture, fingerprint, detectors (deterministic)
packages/taste    → taste engine + voice direction
packages/redesign → diff generation
packages/mcp      → Cursor MCP server
apps/web          → Tell UI
fixtures/generic-app → demo "before" app
```

---

## Hackathon compliance

- Public repo, original work documented in [CONTRIBUTIONS.md](./CONTRIBUTIONS.md)
- The product is the **capture → diagnose → art-direct → reconcile loop**, not a dashboard
- Seeded generic-app is labeled demo input, not our contribution

---

## License

MIT
