# Tell Proof

Tell reads your rendered UI, names what makes it look AI-generated, and helps you art-direct a distinctive redesign — inside Cursor.

## The Problem

[![Tell Proof demo poster](./docs/media/tell-proof-demo-poster.webp)](./docs/media/tell-proof-demo.mp4)

**Click the image above to see the full demo.** Developer tools ship working software. They don't ship beautiful software. A page that compiles can still be generic, inconsistent, or half-finished. When agents generate UI, they have no taste. When designers review, they have no evidence. Designers and engineers speak past each other.

---

## The Solution

Tell captures rendered pages, detects tells of generic design, explains problems in plain language, and drafts distinctive redesigns that are ready for Cursor.

---

## See It Work: Step by Step

### 1. Capture

![Capture step screenshot or icon]

Tell records a real rendered page: screenshots at multiple viewports, computed styles, CSS variables, and interactive-state probes. No guessing from static code.

### 2. Detect

![Detection report example]

Deterministic detectors analyze captures and name issues with evidence: low contrast, radius monotony, shadow overuse, token misuse, spacing inconsistencies. You see the problem, not a score.

### 3. Art-Direct

![Voice/text direction input]

Tell accepts voice or text art-direction ("warmer," "more editorial," "deeper hierarchy") and maps intent to concrete action items without needing a designer in the room.

### 4. Repair

![Diff/patch preview]

Tell drafts source-aware diffs that modify the files responsible for the problem. Updates happen to tokens, spacing, type scale — not blind pixel pushing.

### 5. Prove

![Before/after comparison with metrics]

Patches apply to a disposable checkout. The page recaptures. Contrast, rhythm, spacing, state coverage — all measurable before changes land.

---

## Why This Matters

- **Raises the visual floor** — contrast, type rhythm, spacing, state coverage become first-class checks, not subjective preferences.
- **Provides independent evidence** — capture-and-diagnose loop prevents agents from self-validating and gives reviewers concrete screenshots and metrics.
- **Reduces risk** — patches are proven in disposable worktrees and auto-reverted if they regress.
- **Improves collaboration** — designers, engineers, and product share the same findings, edits, and evidence. Feedback loops shrink.

---

## Who Should Use Tell

- **Engineering teams** shipping UI automatically or with agent assistance who want predictable visual quality.
- **Designers** who want reproducible evidence and code-oriented patches to keep production UIs aligned with design goals.
- **Platform teams** that need a deterministic way to enforce visual standards across many apps.

---

## Key Features

- Deterministic detectors for contrast, spacing, radius, shadows, token misuse, and responsive drift.
- Evidence-rich reports with screenshots, computed style samples, and state probes.
- Voice and text art-direction mapping to actionable edits.
- Source-aware diff generation for TSX/JSX/CSS when the repository is available.
- Disposable proof checkouts that apply patches, recapture, and measure improvements.
- Tell Studio: a skill-driven authoring surface that generates premium previews from feature briefs.
- Cursor MCP integration: local stdio tools for Cursor Agent chat.

---

## Quick Start

You need Node 20+ and pnpm 9+.

```bash
git clone <your-repo-url> tell
cd tell
pnpm install
pnpm dev
```

Open http://localhost:3000 for Tell Report or http://localhost:3000/studio for Tell Studio. Run the demo fixture on http://localhost:3001 with `pnpm dev:fixture`.

---

## Development and Testing

```bash
pnpm test            # Run test suite
pnpm typecheck       # TypeScript check
pnpm capture:fixture # Capture demo app
pnpm diagnose:fixture # Run detectors on capture
pnpm e2e:studio      # End-to-end tests for Studio
```

---

## Contributing

High-impact areas: new detectors, better mapping from art-direction to edits, improved evidence reporting, and stronger source-to-render mapping for diffs.

Before opening a PR:

```bash
pnpm typecheck && pnpm test
```

---

## License

MIT. See LICENSE for details.
