---
name: gates-until-verified
description: Wrap any Tell UI task in an observable acceptance-gate loop — separate making from judging, revise on failed gates, stop only with evidence. Use with tell-proof-verify and design-research-loop.
---

# gates-until-verified

Preserve the original task. Strengthen the process.

## 1. Lock the task contract
Outcome, audience, inputs, constraints, definition of done.

## 2. Convert ambition into gates
| Gate | Method | Pass | Evidence |
|---|---|---|---|
| Craft / detectors | Tell diagnose or critique | No new generic tells; score ≥ prior | report JSON |
| Contrast / a11y | basics checklist + focus-visible | Pass | checklist / screenshot |
| Proof / workflow | Visual inspection | Sample labeled; human gate present | screenshot |
| Types / tests | `pnpm test` + typecheck | Green | command output |

## 3. Separate making from judging
Implementer does not sole-approve. Verifier sees task + gates + artifact — not self-assessment.

## 4. Loop
Produce → run gates → record pass/fail → smallest fix → re-check affected gates.

## 5. Stop honestly
All required gates pass, or name the blocker. Never weaken a gate to declare success.

Related: `tell-proof-verify`, `design-research-loop`, `tell-dogfood-audit`.
