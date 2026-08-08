---
name: glass-shell-craft
description: Dark glass / frosted panel craft learned in full — tokens, backdrop-filter panels, masked gradient borders, contrast validation. Tell ships at most one frosted shell level — never glass-everywhere.
---

# glass-shell-craft

## Workflow (complete)

1. Confirm surface role (hero shell, modal, one raised panel — not every card)
2. Define dark tokens first: bg, glass fill, border glow, main/muted text, accent
3. Frosted panel: translucent fill + `backdrop-filter` + subtle inner highlight
4. Masked gradient border via `::before` on key surfaces only
5. Restrained depth (shadow + soft glow) + clear hover/focus
6. Validate contrast and mobile before shipping

## Panel pattern (adapt to tokens)

```css
.ds-glass-panel {
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  background-color: color-mix(in srgb, var(--c-paper-raised) 55%, transparent);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-raised), inset 0 1px 0 color-mix(in srgb, #fff 12%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
}
```

## Tell constraints

| Rule | Why |
|---|---|
| At most **one** glass shell language per page | Glass-everywhere is a generic tell |
| Prefer `dark-premium` + raised paper before blur | Contrast floor |
| Fallback without backdrop-filter | Solid raised fill |
| Focus-visible always stronger than glow | A11y |

## Avoid

Blur on every card; neon borders; washing text; purple lock-in (use `--c-accent`).
