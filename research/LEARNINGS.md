# Tell learnings (recursive improve)

Persistent lessons across sessions. Read before changing showcase, templates, or preview chrome.
Pattern keys match `tell-recursive-improve`.

---

## 2026-08-06 — `showcase:preview-gutter`

- **Failure:** Featured + index iframes used `scale(calc(100cqw / 1440))` which never applied; fixed `0.48` / `0.14` left ~88px empty on the right of thumbs.
- **Fix:** `SpecimenPreview` / measured `--sx-scale = clientWidth / 1440`.
- **Do not:** Trust `@supports (1cqw)` on iframe transforms.

## 2026-08-06 — `showcase:nav-only-thumb`

- **Failure:** Thumbs were 5.5rem tall at ~0.14–0.20 scale → only sticky nav + truncated type. Agent screenshots clipped the same strip and called it proof.
- **Fix:** Taller thumbs (~10.5rem); scroll still frame to **figure/claim beat** (skip y=0); featured **cinema reel** through beats; screenshot contract requires a craft beat, not chrome.
- **Do not:** Ship gallery shots of the top 400px of a 1440 page and call it a specimen.

## Process

After any visual miss the human names: append a pattern here in the same session, even if the code fix lands later.
