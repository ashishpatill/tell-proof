/**
 * Axis-isolated polish passes for agency-quality marketing pages.
 *
 * Typography → spacing → motion must stay separate: combining them in one edit
 * fixes one axis well and two badly. Each helper injects a single scoped
 * override block into preview HTML without regenerating the whole page.
 */

export type AgencyPolishAxis = "typography" | "spacing" | "motion";

const MARKER = "<!-- agency-polish:";

const PASSES: Record<AgencyPolishAxis, string> = {
  typography: `
/* agency-polish:typography — type scale + leading only */
html { font-size: 106.25%; }
.ds-display, .ds-hero h1, [data-role="display"] {
  letter-spacing: -0.03em;
  line-height: 1.02;
  text-wrap: balance;
}
.ds-h2, .ds-section h2, h2 {
  letter-spacing: -0.02em;
  line-height: 1.12;
}
.ds-body, .ds-lede, p, li {
  line-height: 1.58;
  max-width: 38rem;
}
.ds-meta, .ds-eyebrow, .ds-caption, small {
  letter-spacing: 0.04em;
  line-height: 1.35;
}
`,
  spacing: `
/* agency-polish:spacing — vertical rhythm only */
.ds-section, section[data-section] {
  padding-block: calc(var(--s-3xl, 4.5rem) * 1.15);
}
.ds-section + .ds-section,
section[data-section] + section[data-section] {
  margin-top: 0;
}
.ds-hero, [data-section="hero"] {
  padding-block: calc(var(--s-3xl, 4.5rem) * 1.35) calc(var(--s-2xl, 3rem) * 1.2);
}
.ds-stack > * + *,
.ds-prose > * + * {
  margin-top: calc(var(--s-md, 1rem) * 1.25);
}
.ds-cta-row, .ds-actions {
  margin-top: calc(var(--s-lg, 1.5rem) * 1.35);
  gap: calc(var(--s-sm, 0.75rem) * 1.25);
}
`,
  motion: `
/* agency-polish:motion — 200–300ms reveals + hover; nothing bounces */
@media (prefers-reduced-motion: no-preference) {
  .ds-reveal, [data-reveal], .ds-section {
    transition: opacity 240ms ease-out, transform 240ms ease-out;
  }
  .ds-reveal:not(.is-in), [data-reveal]:not(.is-in) {
    opacity: 0.01;
    transform: translateY(12px);
  }
  .ds-reveal.is-in, [data-reveal].is-in, .ds-section.is-in {
    opacity: 1;
    transform: none;
  }
  a, button, .ds-btn, [role="button"] {
    transition: opacity 200ms ease-out, transform 200ms ease-out, background-color 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out;
  }
  a:hover, button:hover, .ds-btn:hover, [role="button"]:hover {
    transform: translateY(-1px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ds-reveal, [data-reveal], .ds-section, a, button, .ds-btn {
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
`,
};

function stripAxis(html: string, axis: AgencyPolishAxis): string {
  const re = new RegExp(
    `${MARKER}${axis} -->\\s*<style>[\\s\\S]*?<\\/style>`,
    "g",
  );
  return html.replace(re, "");
}

/** Apply one polish axis. Re-applying the same axis replaces the prior block. */
export function applyAgencyPolish(html: string, axis: AgencyPolishAxis): string {
  const cleaned = stripAxis(html, axis);
  const block = `${MARKER}${axis} -->\n<style>${PASSES[axis]}</style>`;
  if (/<\/head>/i.test(cleaned)) {
    return cleaned.replace(/<\/head>/i, `${block}\n</head>`);
  }
  return `${block}\n${cleaned}`;
}

export function applyAgencyPolishSequence(
  html: string,
  axes: AgencyPolishAxis[] = ["typography", "spacing", "motion"],
): string {
  return axes.reduce((acc, axis) => applyAgencyPolish(acc, axis), html);
}

export function agencyPolishAxesPresent(html: string): AgencyPolishAxis[] {
  return (["typography", "spacing", "motion"] as AgencyPolishAxis[]).filter((axis) =>
    html.includes(`${MARKER}${axis} -->`),
  );
}
