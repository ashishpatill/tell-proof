---
name: multipage-walkthrough
description: Capture hero/mid/footer (and mobile nav/footer) across declared route classes for a domain; optional RecordScreen + videoReview. Domain-agnostic — route list comes from pack or brief.
---

# multipage-walkthrough

1. Read route classes from DomainResearchPack.multiPageRoutes or brief
2. Run `pnpm exec tsx scripts/multipage-domain-capture.ts --domain <id> --seeds research/boards.seeds.local.json`
3. Store under gitignored `research/boards/<run-id>/refs/<portal-id>/<route>-{hero,mid,footer}.png`
4. Optional: RecordScreen walkthrough of the route set; Task `videoReview` with nav/rail/footer/control checklist
5. Never commit third-party URLs or named hosts

Eye: agent must `Read` key PNGs before IA synthesis.
