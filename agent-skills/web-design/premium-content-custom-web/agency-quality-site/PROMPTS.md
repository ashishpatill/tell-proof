# Agency pipeline — Goal + Loop prompts (copy/paste)

One phase per cycle. After Goal → run → eye → Loop ≤3 → `--mark-pass` → next.

Replace `<brief>` with e.g. `scripts/agency-pipeline/briefs/lensroom.json`.

Read `DESIGN_RIGOR.md` in Phase 0 and when filling `DIRECTION.md`.

---

## Orchestrator (session start)

```
Use agency-quality-site.

Brief: <brief>

0. Read DESIGN_RIGOR.md (thesis, lane, craft nodes, reject list).
1. pnpm agency:pipeline -- --brief <brief> --status
2. Run ONLY the current phase Goal prompt from the skill.
3. Loop that phase until eye+gates pass (≤3 attempts).
4. --mark-pass <current>
5. Repeat until 4-ship is passed.
Never --all. Never combine type+spacing+motion.
```

---

## 1-refs

**Goal**

```
Use agency-quality-site. Phase 1-refs ONLY.
Brief: <brief>
GOAL: 3 refs × (hero+mid+footer); fill DIRECTION.md per DESIGN_RIGOR
(thesis, lane, 1–2 craft nodes, type/spacing/motion/signature).
pnpm agency:pipeline -- --brief <brief> --phase 1-refs
Do not start Phase 2.
```

**Loop**

```
Phase 1-refs LOOP (attempt n/3). Fix board gaps or DIRECTION.md rigor fields.
Re-run --phase 1-refs. When ≥6 frames + DIRECTION.md complete: --mark-pass 1-refs
```

---

## 2-build

**Goal**

```
Use agency-quality-site + premium-content-custom-web. Phase 2-build ONLY.
Read DIRECTION.md + DESIGN_RIGOR.md + refs. First cut ~70%. Execute chosen lane.
No polish axes yet.
pnpm agency:pipeline -- --brief <brief> --phase 2-build
```

**Loop**

```
Phase 2-build LOOP (attempt n/3). Eye misses vs thesis/lane: …
Smallest content/layout fix only. Re-run --phase 2-build (or --reshoot after editing current.html).
When first-cut eye + basics/delivery/rigor green: --mark-pass 2-build
```

---

## 3a-typography

**Goal**

```
Phase 3a-typography ONLY. Type scale / LH / tracking. Touch nothing else.
pnpm agency:pipeline -- --brief <brief> --phase 3a-typography
```

**Loop**

```
Phase 3a-typography LOOP (attempt n/3). Type issues: …
Edit type only → --phase 3a-typography --reshoot → --mark-pass when eye passes
```

---

## 3b-spacing

**Goal**

```
Phase 3b-spacing ONLY. Vertical rhythm / open spans. Touch nothing else.
pnpm agency:pipeline -- --brief <brief> --phase 3b-spacing
```

**Loop**

```
Phase 3b-spacing LOOP (attempt n/3). Cramped sections: …
Spacing only → --reshoot → --mark-pass 3b-spacing
```

---

## 3c-motion

**Goal**

```
Phase 3c-motion ONLY. 200–300ms reveals/hover. One motion system. No bounce. reduced-motion safe.
pnpm agency:pipeline -- --brief <brief> --phase 3c-motion
```

**Loop**

```
Phase 3c-motion LOOP (attempt n/3). Motion issues: …
Motion only → --reshoot → --mark-pass 3c-motion
```

---

## 3d-mobile

**Goal**

```
Phase 3d-mobile ONLY. Fix 375px breaks. Touch only responsive.
pnpm agency:pipeline -- --brief <brief> --phase 3d-mobile
```

**Loop**

```
Phase 3d-mobile LOOP (attempt n/3). Breaks: …
Responsive only → --reshoot → --mark-pass 3d-mobile
```

---

## 4-ship

**Goal**

```
Phase 4-ship ONLY. Bundle + tests + artifact shots + LEARNINGS if needed.
Confirm DESIGN_RIGOR validate list (no award claims, one motion system, craft nodes noted).
pnpm agency:pipeline -- --brief <brief> --phase 4-ship
```

**Loop**

```
Phase 4-ship LOOP. Fix test/evidence gaps only → --mark-pass 4-ship
```
