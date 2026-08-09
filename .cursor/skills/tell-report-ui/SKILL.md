---
name: tell-report-ui
description: Builds Tell web UI — entry shell, split project workspace, Tell Report, before/after seam, findings inspector, voice director, GitHub setup, and multi-page scanning in apps/web. Use when working on page.tsx, shell components, BeforeAfterSeam, API routes, repo-runner, discover-routes, or docs/01_DESIGN_SYSTEM.md components.
---

# Tell report UI

## Scope

- `apps/web/src/app/page.tsx` — shell host + diagnose/proof session logic
- `apps/web/src/components/shell/` — AppShell, EntryNavRail, WorkspaceTabs, EntryHome, ProjectWorkspace, SettingsDialog
- `apps/web/src/components/report/` — extracted report panels (findings helpers, seam wrappers, proof)
- `apps/web/src/components/BeforeAfterSeam.tsx` — signature reveal seam
- `apps/web/src/lib/byok.ts` — browser keys + API header resolution
- `apps/web/src/app/api/` — diagnose, redesign, voice, setup routes

## Product shape

Command-center **entry home** (composer) → **split project** (not a dashboard):

1. Home: “What do you want to design?” with modes Design brief · Live URL · GitHub · Offline
2. Project left (**critic**): findings, voice, draft fix, Connect Agent
3. Project right (**canvas**): capture bar, pages strip, before/after seam, proof
4. Settings dialog: BYOK (Gemini / Cursor) in `localStorage`; APIs accept `x-tell-gemini-key` / `x-tell-cursor-key`

## Design contract

Follow `docs/01_DESIGN_SYSTEM.md`:

- Fonts: Instrument Serif + Source Sans 3 + IBM Plex Mono — never Inter-only
- Semantic tokens only in TSX (`bg-surface`, `text-secondary`, `text-accent`)
- Shell glass uses `--surface-glass` (warm paper, not cool slate SaaS)
- Raw hex only in `globals.css` token definitions
- Full state matrix: hover, focus-visible, active, disabled, loading/error
- Seam supports drag, keyboard ←/→, reduced-motion jump
- Copy from `USER_STORY.md` copy bank — critic voice, no emoji chrome

## API behavior

- `/api/diagnose` → full pipeline or offline artifact with `meta.live: false`
- `/api/setup/*` → local dev only; never expose arbitrary repo execution publicly
- `/api/voice` → deterministic parse first, Gemini refine when keyed (header or env)
- Hide stale captures while setup/capture is running
- Never auto-apply patches

## DoD

<<<<<<< HEAD
- Ashish journey works: home composer → capture → finding → seam → voice → draft fix
=======
- Ashish journey works: capture → finding → seam → voice → draft fix
>>>>>>> 62555a2 (docs: rename product persona from Priya to Ashish)
- Keyboard and a11y floor from design system §9
- Tell UI does not trigger its own generic tells
- Showcase / Studio / Kinetic remain rail destinations

## Related

- Rules: `.cursor/rules/tell-ui-design.mdc`
- Agent: `.cursor/agents/ui-builder.md`
- Copy agent: `.cursor/agents/ux-copywriter.md`
- Skill: `tell-dogfood-audit`
