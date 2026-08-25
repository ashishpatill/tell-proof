# Tell Proof

[![Tell Proof demo poster](./docs/media/tell-proof-demo-poster.webp)](./docs/media/tell-proof-demo.mp4)

Tell Proof is a design-focused toolkit and research engine that helps teams make user interfaces feel intentional, distinctive, and production-ready. It was built to sit alongside developer workflows and agent-driven code generation systems (like Cursor) to catch the visual and compositional mistakes automated pipelines often miss, and to provide concrete, source-aware fixes backed by evidence.

Why this repository exists

Developer tools and code-writing agents are excellent at shipping working software, but they are not specialized at visual authorship. A page that compiles can still be generic, inconsistent, or hard to trust. Tell Proof closes that gap by observing rendered pages, naming where design is generic or drifting, suggesting direction, and producing patches that can be reviewed and proven before they land in production.

Quick showcase — curated visuals

These images and the demo video show Tell Proof’s strengths: independent capture, measurable critique, and premium redesigns that read as authored, not accidental.

| Featured demo | Practical example 1 | Practical example 2 |
|---:|:---:|:---:|
| [![Featured craft reel](./docs/media/showcase/01-showcase-featured.webp)](./docs/media/tell-proof-demo.mp4) <br/>Demo video | ![SaaS fold example](./docs/media/showcase/saas-fold.webp) <br/>SaaS fold — brand-first composition | ![Dashboard fold example](./docs/media/showcase/dashboard-fold.webp) <br/>Dashboard — priority rail + queue console |

The poster above links to the full demo video (click the image to play). I kept a small set of assets that best demonstrate Tell Proof’s ability to turn evidence into design: a hero poster/video, a featured craft image, and two representative folds (SaaS and Dashboard).

What Tell Proof does (short)

- Capture: record a rendered page, including screenshots, computed styles, CSS variables, and state probes.
- Detect: run deterministic detectors that name issues like low contrast, radius monotony, shadow overuse, token misuse, and spacing inconsistencies.
- Explain: produce plain-language findings with evidence so humans understand what is wrong and why.
- Direct: accept voice or text art-direction (for example: "warmer" or "more editorial") and map that intent to concrete action items.
- Repair: create source-aware diffs that modify the files responsible for the problem rather than guessing from images.
- Prove: apply candidate patches in a disposable checkout, recapture, and measure improvement before changes land.
- Author: offer a Studio mode that generates premium previews from feature briefs and routes edits through a skill graph.

Why Tell Proof matters

- Raises the visual quality floor: measurable signals (contrast, type rhythm, spacing, state coverage) become first-class checks rather than subjective preferences.
- Provides independent evidence: an external capture-and-diagnose loop prevents agents from self-validating and gives reviewers concrete screenshots and metrics.
- Reduces risk: patches are proven in disposable worktrees and auto-reverted if they regress.
- Improves collaboration: designers, engineers, and product people share the same findings, edits, and evidence, shortening feedback loops and increasing reviewer confidence.

How it works (human-friendly)

1. Point Tell Proof at a URL or local app.
2. Playwright captures screenshots, computed styles, CSS variables, and interactive-state probes.
3. Deterministic detectors analyze the captures and return named findings with supporting evidence.
4. A user or agent requests a redesign or gives art-direction. Tell Proof maps that input to presets and concrete edits.
5. When source is available, Tell Proof ranks candidate files and drafts a unified diff that updates tokens, spacing, type scale, and other primitives.
6. The patch is applied to a disposable checkout; HMR or the dev server updates and the page is recaptured.
7. Tell Proof compares before-and-after captures, reports deltas (contrast, rhythm, spacing, state coverage), and marks the result pass, review, or fail.
8. Approved patches are ready for normal review and merge.

Who should use Tell Proof

- Engineering teams shipping UI changes automatically or with agent assistance who want predictable visual quality.
- Designers who want reproducible evidence and code-oriented patches to bring production UIs in line with design goals.
- Platform teams that need a deterministic way to enforce visual standards across many apps.

Key features at a glance

- Deterministic detectors for contrast, spacing, radius, shadows, token misuse, and responsive drift.
- Evidence-rich reports with screenshots, computed style samples, and state probes.
- Voice and text art-direction mapping to actionable edits.
- Source-aware diff generation for TSX/JSX/CSS when the repository is available.
- Disposable proof checkouts that apply patches, recapture, and measure improvements.
- Tell Studio: a skill-driven authoring surface that generates premium previews from feature briefs.
- Cursor MCP integration: local stdio tools for Cursor Agent chat.

Quick start

You need Node 20+ and pnpm 9+.

```bash
git clone <your-repo-url> tell
cd tell
pnpm install
pnpm dev
```

Open http://localhost:3000 for Tell Report or http://localhost:3000/studio for Tell Studio. Run the demo fixture on http://localhost:3001 with `pnpm dev:fixture`.

Development and testing

- pnpm test
- pnpm typecheck
- pnpm capture:fixture
- pnpm diagnose:fixture
- pnpm e2e:studio

Contributing

Contributions are welcome. High-impact areas include new detectors, better mapping from art-direction to edits, improved evidence reporting, and stronger source-to-render mapping for diffs.

Please run before opening a PR:

```bash
pnpm typecheck && pnpm test
```

License

This project is released under the MIT License. See LICENSE for details.
