---
name: requirement-gap-diff
description: Diff user website requirement against prior DomainResearchPack — reuse vs gap-only vs full walkthrough. Forbids blank-slate plans when a package exists.
---

# requirement-gap-diff

Inputs: PriorPackageSummary + user requirement string.

Outputs:

- `reuse[]` — sitemap / shell / nav / footer / controls / lenses to keep
- `gaps[]` — route classes or surfaces needing capture
- `mode` — `customize` | `gap-research` | `full-walkthrough`

Rules:

- Same domain + same Core routes → `customize` (skip full recrawl)
- Same domain + new surface → `gap-research` for that surface only
- No package / new domain → `full-walkthrough`
- Never emit a plan that ignores an existing package without stating why
