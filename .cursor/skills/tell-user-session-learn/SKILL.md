---
name: tell-user-session-learn
description: Per-user design learning on Priya's machine — remembers direction prefs, priorities, and tool/workflow choices in localStorage. Distinct from developer design-data corpus learning.
---

# tell-user-session-learn

**End-user loop** (browser / local machine). Makes Tell better *for this user* across sessions.

This is **not** the developer corpus loop (`agency-run-learn` + `research/design-data.local.json`).

| Loop | Who | Where | Improves |
|---|---|---|---|
| User session | Priya (product user) | `localStorage` `tell:user-design-profile` | Her directions, priorities, tools |
| Dev corpus | Tell maintainer | `TELL_DESIGN_DATA` / `design-data.local.json` | Shared engine memory, gates, seeds |

## What is remembered (user machine only)

- Preferred art-direction preset
- Recent voice/text phrases + action categories → priority weights
- Soft bans from phrases ("no purple", "less shadow")
- Tool prefs (voice, MCP, live capture)

Schema: `UserDesignProfile` in `@tell/schema`  
Lib: `apps/web/src/lib/user-session-learn.ts`

## Rules

1. Never write user profiles into the Tell git repo or design-data checkout.
2. Never upload user profiles unless the product later adds an explicit account sync.
3. Developer corpus must stay gated (`isDevCorpusEnabled`) — no Vercel/public demo pulls.

## Agent prompt

```
Use tell-user-session-learn when changing how Tell remembers a founder's taste.
Keep developer design-data learning separate (agency-run-learn + design-data.README).
```
