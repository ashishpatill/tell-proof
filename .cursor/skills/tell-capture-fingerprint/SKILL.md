---
name: tell-capture-fingerprint
description: Implements Tell rendered UI capture and deterministic fingerprinting with Playwright/CDP. Use when working on captureUrl, buildFingerprint, Playwright scripts, computed-style sampling, interactive probes, snapshot HTML, or fixtures/reports/capture.json.
---

# Tell capture and fingerprint

## Scope

- `packages/core/src/capture/` — Playwright capture of rendered UI
- `packages/core/src/fingerprint/` — deterministic aggregation to `DesignFingerprint`
- `packages/core/src/scripts/capture-fixture.ts` — regenerate fixture capture
- `fixtures/reports/capture.json` — committed offline capture artifact

## Pipeline

1. Navigate URL (or local route); wait for network idle
2. Full-page screenshot → base64 PNG
3. CDP/computed-style walk on curated selectors (~200 nodes max)
4. Interactive probes for hover, focus-visible, disabled states
5. DOM summary: headings, buttons, centered ratio, emoji in UI chrome
6. Emit `CapturePayload` validated by `@tell/schema`

## Fingerprint fields

Aggregate fonts, colors, shadows, radii, spacing, type scale, gradient detection, near-duplicate grays, focus-ring coverage, and state coverage. No network or LLM.

## Rules

1. Capture may use Playwright; unit tests must use committed JSON only
2. Keep capture normalization stable between runs
3. Any capture schema change requires updating committed `capture.json`
4. Web diagnose subprocess uses `diagnose-url.ts`; MCP uses `captureUrl` directly

## Commands

```bash
pnpm dev:fixture          # bland demo app on :3001
pnpm capture:fixture      # regenerate capture.json
pnpm diagnose:fixture     # full diagnose on fixture
pnpm test                 # fingerprint/detector golden tests
```

## DoD

- Valid `CapturePayload` for generic fixture
- Fingerprint snapshot fields stable enough for detector golden tests
- Capture completes in demo time budget (< 8s on fixture)

## Related

- Rules: `.cursor/rules/tell-core-engine.mdc`
- BUILD.md §5.1–5.2
