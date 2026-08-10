---
name: website-domain-research
description: General research skill graph for ANY website brief — LoadPriorDomain, gap-diff, multipage walkthrough, IA/shell synthesis, category-gap audit, variant lens, training episode. Customize via domainId/siteKind. Sport, SaaS, studio, and other domains specialize; do not blank-slate when a package exists. Use before pixels on every new site.
---

# website-domain-research

**Parent research graph for all websites.** Sport uses `sport-matchday-web` (extends this). SaaS/studio/fintech run this then `premium-content-custom-web`.

Full graph: `agent-skills/web-design/website-domain-research/GRAPH.md`  
Engine: `@tell/design-skills` → `DomainResearchPack`, `routeDomainResearchSkills`, `loadPriorDomain`, `requirementGapDiff`

## Non-negotiables

1. **Load prior domain package** before planning or capturing
2. **Gap-diff the user requirement** — customize / gap-only / full walkthrough; forbid blank-slate when a package exists
3. **Evidence before IA claims** — multipage screenshots (and video when possible) for gaps only
4. **Anonymise** — no third-party hosts/product names in commits
5. **Emit a training episode** every build (tell-design-data / sink — never commit JSONL in Tell)
6. Always end with Taste Controls when handing off to design

## Workflow

```
1. load-prior-domain
2. requirement-gap-diff  → reuse list + gap list
3. multipage-walkthrough (gaps only) + optional RecordScreen / videoReview
4. category-gap-audit
5. ia-shell-synthesis → DIRECTION.md
6. variant-lens
7. emit-training-episode
8. Hand off to domain design graph (sport-matchday-web | premium-content-custom-web)
```

## Sub-skills

- `load-prior-domain`
- `requirement-gap-diff`
- `multipage-walkthrough`
- `ia-shell-synthesis`
- `category-gap-audit`
- `variant-lens`
- `emit-training-episode`

## Prompt

```
Use website-domain-research.
Domain: <cricket|saas|studio|…>
Requirement: …
Then: gap-diff → walkthrough if needed → DIRECTION → training episode → design graph.
```
