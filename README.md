# Tell Proof

Tell Proof is a design-focused toolset and research engine that helps teams make user interfaces feel intentional, distinctive, and production-ready. It was built to sit alongside developer workflows and agent-driven code generation systems (like Cursor) to catch the visual mistakes that automated pipelines often miss, and to provide concrete, measurable guidance and fixes.

Why this repository exists

Developer tools and code-writing agents are great at shipping working software, but they are weak at visual authorship. When a UI is "good enough" to compile, it can still look generic, inconsistent, or hard to use. Tell Proof exists to close that gap: it observes real rendered pages, detects where the design is generic or drifting, offers concrete direction, and helps produce source-level patches that can be reviewed and proven in an isolated environment.

What Tell Proof does (short)

- Capture: record a rendered page, including screenshots, computed styles, and state probes.
- Detect: run deterministic detectors that name issues like low contrast, radius monotony, shadow overuse, and spacing inconsistencies.
- Explain: turn findings into plain-language verdicts and evidence so humans can understand what is wrong and why.
- Direct: accept voice or text art-direction (for example "warmer" or "more editorial") and map that to concrete action items.
- Repair: create source-aware diffs that target the files responsible for the problem rather than guessing from images.
- Prove: apply candidate patches in a disposable checkout, run the app, recapture the page, and measure the improvement before any change lands.
- Author: provide a Studio mode to generate or refine premium layouts from feature briefs when design intent is supplied.

Why Tell Proof matters

- It raises the visual quality bar: instead of relying on model priors or random prompt variations, Tell Proof enforces measurable design signals (contrast, type rhythm, spacing, state coverage). This makes UIs more readable, trustworthy, and distinct.
- It provides independent evidence: agents should not grade their own homework. Tell Proof captures the rendered result and offers an independent, reproducible critique with evidence you can point at in code reviews.
- It reduces breakage risk: patches are proven in disposable worktrees with recapture and automated comparisons. If a candidate patch regresses, the system auto-reverts and reports the failure.
- It improves collaboration: designers, product people, and engineers can share the same findings and patch proposals, shortening the feedback loop and producing changes that reviewers can accept with confidence.

A human-friendly overview of how it works

1. You give Tell Proof a URL or point it at a local app.
2. Playwright launches the page and captures screenshots, computed styles, CSS variables, and interactive state samples.
3. A set of deterministic detectors analyzes those captures and produces named findings with concrete evidence.
4. The user or an agent can request a redesign or give art-direction in natural language. Tell Proof maps that direction to presets and actionable edits.
5. When source is available, Tell Proof ranks candidate files and drafts a unified diff that changes tokens, spacing, type scale, and other design primitives.
6. The patch is applied to a disposable checkout, the app is rebuilt (HMR or dev server), and the page is recaptured.
7. Tell Proof compares the before and after captures, reports the deltas (contrast, type scale, spacing, state coverage), and marks the patch as pass, review, or fail.
8. Approved patches are then ready for normal review and merge in your repository.

Who should use Tell Proof

- Engineering teams who ship UI changes automatically or with agent assistance and want predictable visual quality.
- Designers who want repeatable evidence and code-oriented patches to bring production UIs in line with design goals.
- Platform teams that need a scalable, deterministic way to enforce visual standards across many microapps or product surfaces.

Key features at a glance

- Deterministic detectors for visual issues (contrast, spacing, radius, shadows, token misuse).
- Evidence-rich reports with screenshots and computed style samples.
- Voice and text art-direction that maps to concrete design changes.
- Source-aware diff generation for TSX/JSX/CSS when a repository is available.
- Disposable proof checkouts that apply patches, recapture, and measure improvements.
- Tell Studio: a skill-driven authoring surface that generates premium previews from feature briefs.
- Cursor MCP integration: local stdio tools so the engine can be used inside Cursor Agent chat.

Quick start

You need Node 20+ and pnpm 9+.

```bash
git clone <your-repo-url> tell
cd tell
pnpm install
pnpm dev
```

Open http://localhost:3000 for Tell Report or http://localhost:3000/studio for Tell Studio. A demo fixture runs on http://localhost:3001 if you run pnpm dev:fixture.

Development and testing

- pnpm test
- pnpm typecheck
- pnpm capture:fixture
- pnpm diagnose:fixture
- pnpm e2e:studio

Contributing

Contributions are welcome. High impact areas include: additional detectors, improved mapping from art-direction to edits, better evidence reporting, and stronger source-to-render mapping when generating diffs.

Please run:

```bash
pnpm typecheck && pnpm test
```

License

This project is released under the MIT License. See LICENSE for details.
