---
name: load-prior-domain
description: First node of website-domain-research — load DomainResearchPack, vernacular docs, agency memory, LEARNINGS, last DIRECTION before any plan or capture.
---

# load-prior-domain

1. Resolve `domainId` from brief / query / siteKind
2. Load `getDomainPack(domainId)` from `@tell/design-skills` if present
3. Read `research/*VERNACULAR*` or domain doc if listed on the pack
4. Merge `research/agency-engine-memory.json` craftHints / pipelineNotes for this domain
5. Scan `research/LEARNINGS.md` for `domain:` / `sport:` patterns
6. If `research/boards/<run>/DIRECTION.md` exists for this domain, load it
7. Return a **PriorPackageSummary** (paths + reused defaults) — never invent a blank package when one exists
