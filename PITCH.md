# Tell Proof Pitch

## One-Liner

Tell Proof is an independent visual proof layer for AI-built interfaces: it captures the rendered UI, names what feels generic or inconsistent, drafts a source-grounded repair, and verifies the result before the patch lands.

## 30-Second Pitch

AI agents can build a working interface in minutes, but they usually leave behind the same visual fingerprints: default type, purple gradients, soft cards everywhere, inconsistent focus states, and design tokens that quietly drift. Tell Proof gives developers a second pair of eyes with evidence. It opens the actual page in a browser, measures what rendered, explains the specific tells, lets you art-direct a better direction, then proves the candidate repair in a disposable checkout. The result is not "make it prettier". It is a measured, reviewable path from generic UI to a product surface with taste.

## 1-Minute Pitch

Every AI-built UI has a tell: the same fonts, the same violet gradients, the same rounded cards, and the same "good enough" look.

Tell Proof is an independent visual proof layer for AI-built frontends. It does not generate another random redesign. It captures the real rendered product in a browser, analyzes what users actually see, and detects the patterns that make it feel generic or inconsistent.

Under the hood, Tell uses Playwright to capture screenshots, DOM structure, computed styles, contrast, tokens, spacing, shadows, radii, and focus states. Then deterministic detectors flag issues like system-font overuse, gradient crutches, shadow everywhere, token drift, and inconsistent focus states.

The key difference is this: Cursor or v0 can build the UI, but Tell grades it independently. It gives evidence, explains the design problem, lets you art-direct the fix by voice or text, drafts source-grounded code changes, and proves the result in a disposable checkout before anything lands.

Existing tools either generate UI, compare pixels, or check design tokens. Tell Proof owns the missing layer: rendered-surface taste, consistency analysis, source-aware repair, and visual proof.

Every AI-built interface has a tell. Tell Proof finds it, fixes it, and proves it.

## 90-Second Pitch

Every AI-built UI has two problems. First, it often looks like every other AI-built UI. Second, the agent that created it is usually asked to fix and evaluate its own work. That is a bad feedback loop.

Tell Proof breaks the loop. Paste a URL or a GitHub repo. Tell captures the rendered page with Playwright, builds a deterministic design fingerprint, and runs 14 detectors for genericness and consistency drift. It tells you exactly what is wrong: system-font sameness, gradient crutches, shadow overuse, gray mush, token bypasses, spacing chaos, focus inconsistency, state gaps.

Then it moves from critique to direction. You can say "warmer, more editorial, less shadow" or pick a preset. Tell turns that into concrete action items, drafts a source-grounded diff from real TSX/CSS context, applies the candidate only inside a disposable checkout, recaptures the route, and compares the before/after score, focus coverage, structure, and screenshots.

That makes Tell a visual CI layer for agentic development: deterministic where trust matters, model-assisted where judgment helps, and human-reviewed before anything lands.

## Demo Flow

1. Open Tell and capture `https://superlearnai.com`.
2. Show the score and click one named tell with screenshot evidence.
3. Open the pages strip to show route-aware scanning.
4. Drag the before/after reveal to show the reconciled direction.
5. Type or speak: "warmer, more editorial, less shadow."
6. Draft the diff and show that it is source-grounded and reviewable.
7. Run visual proof so Tell applies the patch in isolation, recaptures, and reports whether the result improved.
8. Close with Cursor MCP: the same engine is available from Agent chat through `tell_diagnose` and `tell_redesign`.

## What Makes It Different

- **It reviews the rendered product, not only source files.** Tell measures what users actually see.
- **It is deterministic-first.** Capture, fingerprinting, detectors, baseline reconciliation, and proof comparison do not depend on model output.
- **It names taste problems in product language.** The report explains why something feels generic or inconsistent instead of dumping raw token diffs.
- **It repairs from real source context.** The redesign proposal is grounded in matched TSX/JSX/CSS, not a screenshot guess.
- **It proves the patch before handoff.** Disposable checkout, HMR wait, recapture, score delta, focus check, structure check, and auto-revert on failure.
- **It lives where developers already work.** Web UI for visual review, Cursor MCP for editor-native diagnosis and patch drafting.

## Memorable Close

The future of software creation is not just faster agents. It is better feedback loops around those agents. Tell Proof is that feedback loop for visual product quality: capture the truth, name the tell, direct the fix, and prove the result.
