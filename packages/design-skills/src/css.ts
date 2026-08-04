/**
 * Stylesheet emission.
 *
 * Everything here is derived from tokens. No literal colour, size, or duration appears in a rule
 * body — that constraint is what makes the "declared tokens" measurement true rather than
 * decorative, and it is what lets a developer re-theme a generated page by editing one block.
 */
import type { DesignSpec, DesignTokens, MotionLevel, SurfaceLevel } from "./types";

function typeVars(tokens: DesignTokens): string {
  return tokens.type
    .flatMap((t) => [
      `--t-${t.name}-size:${t.css}`,
      `--t-${t.name}-leading:${t.lineHeight}`,
      `--t-${t.name}-tracking:${t.trackingEm}em`,
      `--t-${t.name}-weight:${t.weight}`,
    ])
    .join(";");
}

function colorVars(tokens: DesignTokens): string {
  return Object.entries(tokens.color)
    .map(([k, v]) => `--c-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(";");
}

function spaceVars(tokens: DesignTokens): string {
  return tokens.space.map((s) => `--s-${s.name}:${s.px}px`).join(";");
}

function mapVars(prefix: string, map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `--${prefix}-${k}:${v}`)
    .join(";");
}

/**
 * Component-level aliases. Real systems put a semantic layer between raw scales and components so
 * a control can be re-tuned without hunting through rules — and so a developer editing one line
 * changes every button rather than one button.
 */
function semanticVars(): string {
  return [
    "--nav-height:var(--s-2xl)",
    "--nav-blur:12px",
    "--btn-height:2.75rem",
    "--btn-radius:var(--r-md)",
    "--btn-padding:var(--s-md)",
    "--card-radius:var(--r-lg)",
    "--card-padding:var(--s-md)",
    "--card-border:1px solid var(--surface-border)",
    "--panel-radius:var(--r-lg)",
    "--field-height:2.5rem",
    "--field-radius:var(--r-sm)",
    "--focus-ring:2px solid var(--c-accent)",
    "--focus-offset:2px",
    "--rule:1px solid var(--surface-border)",
    "--rule-strong:1px solid var(--c-border-strong)",
    "--stack-gap:var(--s-sm)",
    "--section-gap:var(--s-xl)",
    "--grid-gap:var(--s-md)",
    "--prose-gap:var(--s-xs)",
    "--table-row-pad:var(--s-xs)",
    "--pill-padding:var(--s-2xs)",
    "--z-base:0",
    "--z-raised:1",
    "--z-sticky:20",
    "--z-overlay:40",
    "--z-toast:60",
    "--hover-lift:0px",
    "--press-scale:0.99",
    "--icon-size:1rem",
    "--icon-stroke:1.5",
  ].join(";");
}

/** Section surfaces set their own local ink so nested rules never need to know which band they are in. */
function surfaceRules(): string {
  return `
[data-surface="paper"]{--surface-bg:var(--c-paper);--surface-ink:var(--c-ink);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)}
[data-surface="raised"]{--surface-bg:var(--c-paper-raised);--surface-ink:var(--c-ink);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)}
[data-surface="sunken"]{--surface-bg:var(--c-paper-sunken);--surface-ink:var(--c-ink);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)}
[data-surface="accent"]{--surface-bg:var(--c-accent-surface);--surface-ink:var(--c-ink);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-accent-border)}
[data-surface="inverse"]{--surface-bg:var(--c-inverse);--surface-ink:var(--c-inverse-ink);--surface-muted:var(--c-inverse-ink-muted);--surface-quiet:var(--c-inverse-ink-muted);--surface-border:color-mix(in srgb, var(--c-inverse-ink) 18%, transparent)}
[data-surface]{background:var(--surface-bg);color:var(--surface-ink)}
`;
}

function motionCss(motion: MotionLevel): string {
  if (motion === "none") {
    return `
.ds-reveal{opacity:1;transform:none}
*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}
`;
  }

  const interactive = `
a,button,.ds-btn,.ds-card-link,.ds-row-link,.ds-plan,.ds-tab{
  transition:color var(--m-base) var(--m-ease),background-color var(--m-base) var(--m-ease),border-color var(--m-base) var(--m-ease),transform var(--m-fast) var(--m-ease),opacity var(--m-base) var(--m-ease);
}
.ds-btn-primary:hover{background:var(--c-accent-hover)}
.ds-card-link:hover,.ds-plan:hover{border-color:var(--c-border-strong)}
.ds-row-link:hover{background:var(--c-paper-raised)}
`;

  if (motion === "light-scroll-reveals") {
    return `${interactive}
@media (prefers-reduced-motion: no-preference){
  .ds-reveal{opacity:0;transform:translateY(var(--s-xs));transition:opacity var(--m-reveal) var(--m-ease-out),transform var(--m-reveal) var(--m-ease-out)}
  .ds-reveal.is-in{opacity:1;transform:none}
}
@media (prefers-reduced-motion: reduce){.ds-reveal{opacity:1;transform:none}}
`;
  }

  return `${interactive}
.ds-reveal{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){
  a,button,.ds-btn,.ds-card-link,.ds-row-link,.ds-plan,.ds-tab{transition-duration:0s}
}
`;
}

/**
 * Lean-specific art direction. These are the differences a reader would describe in words —
 * how structure is drawn, how headings sit, what a card is — rather than incidental tweaks.
 */
function leanCss(lean: DesignSpec["taste"]["aestheticLean"]): string {
  if (lean === "minimal-clean") {
    return `
[data-lean="minimal-clean"] .ds-card{background:transparent;border:0;border-top:1px solid var(--surface-border);border-radius:0;padding:var(--s-md) 0 var(--s-lg);box-shadow:none}
[data-lean="minimal-clean"] .ds-bento{grid-template-columns:1fr;gap:0}
[data-lean="minimal-clean"] .ds-eyebrow{color:var(--surface-quiet)}
[data-lean="minimal-clean"] .ds-section-head{border-top:1px solid var(--surface-border);padding-top:var(--s-md)}
[data-lean="minimal-clean"] .ds-index-row{grid-template-columns:2.5rem 1fr minmax(0,22rem)}
`;
  }
  if (lean === "conversion-sharp") {
    return `
[data-lean="conversion-sharp"] .ds-lead-card{border-color:var(--c-accent-border);background:var(--c-accent-surface)}
[data-lean="conversion-sharp"] .ds-metric-value{color:var(--surface-ink)}
[data-lean="conversion-sharp"] .ds-hero-actions{padding-top:var(--s-sm)}
[data-lean="conversion-sharp"] .ds-section-head h2{max-width:18ch}
`;
  }
  if (lean === "refined-story") {
    return `
[data-lean="refined-story"] h1,[data-lean="refined-story"] h2,[data-lean="refined-story"] .ds-display{font-variation-settings:"opsz" 96}
[data-lean="refined-story"] .ds-card{background:transparent;border:0;border-top:1px solid var(--surface-border);border-radius:0;padding:var(--s-md) 0 var(--s-lg);box-shadow:none}
[data-lean="refined-story"] .ds-chapter-index{font-family:var(--f-display);font-size:var(--t-title-size);color:var(--surface-quiet);line-height:1}
[data-lean="refined-story"] .ds-quote{font-family:var(--f-display);font-size:var(--t-title-size);line-height:var(--t-title-leading);letter-spacing:var(--t-title-tracking)}
[data-lean="refined-story"] .ds-eyebrow{font-family:var(--f-mono)}
`;
  }
  return `
[data-lean="system-crafted"] .ds-card{border-radius:var(--r-lg)}
[data-lean="system-crafted"] .ds-eyebrow{font-family:var(--f-mono);text-transform:none;letter-spacing:0}
[data-lean="system-crafted"] .ds-token-rail{display:flex}
[data-lean="system-crafted"] .ds-index-row:hover{background:var(--c-paper-raised)}
`;
}

export function renderCss(spec: DesignSpec): string {
  const t = spec.tokens;
  return `
:root{
${colorVars(t)};
${typeVars(t)};
${spaceVars(t)};
${mapVars("r", t.radius)};
${mapVars("sh", t.shadow)};
${mapVars("m", t.motion)};
${semanticVars()};
--f-display:"${t.fontDisplay}", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--f-body:"${t.fontBody}", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--f-mono:"${t.fontMono}", ui-monospace, SFMono-Regular, Menlo, monospace;
--w-content:${t.contentMax};
--w-wide:${t.contentWide};
--w-prose:${t.proseMax};
--section-y:${t.sectionY};
--section-y-tight:${t.sectionYTight};
--gutter:${t.gutter};
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;
  background:var(--c-paper);
  color:var(--c-ink);
  font-family:var(--f-body);
  font-size:var(--t-body-size);
  line-height:var(--t-body-leading);
  letter-spacing:var(--t-body-tracking);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
img,svg,video{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
::selection{background:var(--c-accent);color:var(--c-accent-ink)}

:where(a,button,input,select,textarea,[tabindex]):focus-visible{
  outline:2px solid var(--c-accent);
  outline-offset:2px;
  border-radius:var(--r-xs);
}

h1,h2,h3,h4{margin:0;font-family:var(--f-display);font-weight:var(--t-heading-weight)}
p{margin:0}

.ds-display{font-family:var(--f-display);font-size:var(--t-display-size);line-height:var(--t-display-leading);letter-spacing:var(--t-display-tracking);font-weight:var(--t-display-weight);max-width:18ch;text-wrap:balance}
.ds-title{font-size:var(--t-title-size);line-height:var(--t-title-leading);letter-spacing:var(--t-title-tracking);font-weight:var(--t-title-weight);max-width:22ch;text-wrap:balance}
.ds-heading{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);font-weight:var(--t-heading-weight);max-width:26ch}
.ds-subheading{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking);font-weight:var(--t-subheading-weight)}
.ds-lede{font-size:var(--t-lede-size);line-height:var(--t-lede-leading);letter-spacing:var(--t-lede-tracking);color:var(--surface-muted,var(--c-ink-secondary));max-width:var(--w-prose)}
.ds-body{font-size:var(--t-body-size);line-height:var(--t-body-leading);color:var(--surface-muted,var(--c-ink-secondary));max-width:var(--w-prose)}
.ds-small{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-muted,var(--c-ink-secondary))}
.ds-caption{font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--surface-quiet,var(--c-ink-tertiary))}
.ds-eyebrow{font-size:var(--t-micro-size);line-height:var(--t-micro-leading);letter-spacing:var(--t-micro-tracking);font-weight:var(--t-micro-weight);text-transform:uppercase;color:var(--surface-quiet,var(--c-ink-tertiary))}
.ds-mono{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0}

${surfaceRules()}

.ds-wrap{width:min(100% - (var(--gutter) * 2),var(--w-content));margin-inline:auto}
.ds-wrap-wide{width:min(100% - (var(--gutter) * 2),var(--w-wide));margin-inline:auto}
.ds-section{padding-block:var(--section-y)}
.ds-section-tight{padding-block:var(--section-y-tight)}
.ds-section-head{display:grid;gap:var(--s-sm);margin-bottom:var(--s-xl)}
.ds-section-head .ds-lede{margin-top:var(--s-2xs)}
.ds-split{display:grid;gap:var(--s-xl) var(--s-2xl);align-items:start}

/* Navigation */
.ds-nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--c-paper) 86%,transparent);backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--c-border)}
.ds-nav-inner{display:flex;align-items:center;gap:var(--s-lg);min-height:var(--s-2xl)}
.ds-wordmark{font-family:var(--f-display);font-weight:var(--t-title-weight);font-size:var(--t-subheading-size);letter-spacing:var(--t-subheading-tracking)}
.ds-nav-links{display:flex;gap:var(--s-md);margin-left:auto;font-size:var(--t-bodySmall-size);color:var(--c-ink-secondary)}
.ds-nav-links a:hover{color:var(--c-ink)}
.ds-nav .ds-btn{margin-left:var(--s-md)}

/* Buttons */
.ds-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--s-2xs);min-height:2.75rem;padding:0 var(--s-md);border-radius:var(--r-md);border:1px solid transparent;font-family:var(--f-body);font-size:var(--t-bodySmall-size);font-weight:600;letter-spacing:0;cursor:pointer}
.ds-btn-primary{background:var(--c-accent);color:var(--c-accent-ink)}
.ds-btn-secondary{background:transparent;color:var(--surface-ink,var(--c-ink));border-color:var(--surface-border,var(--c-border))}
.ds-btn-secondary:hover{border-color:var(--c-border-strong)}
[data-surface="inverse"] .ds-btn-secondary{border-color:color-mix(in srgb,var(--surface-ink) 32%,transparent)}
.ds-actions{display:flex;flex-wrap:wrap;gap:var(--s-sm);align-items:center}
.ds-cta-note{font-size:var(--t-caption-size);color:var(--surface-quiet,var(--c-ink-tertiary))}

/* Hero */
.ds-hero{padding-block:calc(var(--section-y) * 1.15) var(--section-y)}
.ds-hero-copy{display:grid;gap:var(--s-md);align-content:start}
.ds-hero-actions{display:flex;flex-wrap:wrap;gap:var(--s-sm);align-items:center;margin-top:var(--s-xs)}
.ds-hero-meta{display:flex;flex-wrap:wrap;gap:var(--s-md);margin-top:var(--s-md);padding-top:var(--s-md);border-top:1px solid var(--surface-border)}
.ds-hero-meta div{display:grid;gap:2px}
.ds-hero-meta dt{font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-hero-meta dd{margin:0;font-family:var(--f-mono);font-size:var(--t-bodySmall-size);color:var(--surface-ink)}

/* Product panel — a structural stand-in for the real interface, drawn from tokens only */
.ds-panel{border:1px solid var(--surface-border);border-radius:var(--r-lg);background:var(--c-paper-raised);overflow:hidden}
.ds-panel-bar{display:flex;align-items:center;gap:var(--s-2xs);padding:var(--s-xs) var(--s-sm);border-bottom:1px solid var(--surface-border);background:var(--c-paper-sunken)}
.ds-panel-dot{width:8px;height:8px;border-radius:var(--r-pill);background:var(--c-border-strong)}
.ds-panel-title{margin-left:var(--s-2xs);font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}
.ds-panel-body{display:grid;gap:var(--s-xs);padding:var(--s-sm)}
.ds-panel-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:var(--s-sm);padding:var(--s-2xs) var(--s-2xs);border-radius:var(--r-sm)}
.ds-panel-row + .ds-panel-row{border-top:1px solid var(--surface-border)}
.ds-panel-row span{font-size:var(--t-bodySmall-size)}
.ds-panel-row b{font-family:var(--f-mono);font-size:var(--t-caption-size);font-weight:500;color:var(--c-ink-tertiary)}
.ds-meter{height:6px;border-radius:var(--r-pill);background:var(--c-paper-sunken);overflow:hidden}
.ds-meter i{display:block;height:100%;background:var(--c-accent);border-radius:var(--r-pill)}

/* Metric band */
.ds-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:var(--s-lg)}
.ds-metric{display:grid;gap:var(--s-3xs);padding-top:var(--s-sm);border-top:2px solid var(--surface-border)}
.ds-metric-value{font-family:var(--f-display);font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);font-weight:var(--t-heading-weight);color:var(--surface-ink)}
.ds-metric-label{font-size:var(--t-caption-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--surface-quiet)}
.ds-metric-note{font-size:var(--t-bodySmall-size);color:var(--surface-muted);max-width:34ch}

/* Cards / bento */
.ds-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:var(--s-md)}
.ds-card{grid-column:span 2;display:grid;gap:var(--s-2xs);align-content:start;padding:var(--s-md);border:1px solid var(--surface-border);border-radius:var(--r-lg);background:var(--c-paper-raised)}
.ds-card h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking)}
.ds-card p{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-muted)}
.ds-card-lead{grid-column:span 4}
.ds-card-wide{grid-column:span 3}
.ds-card-points{margin:var(--s-2xs) 0 0;padding:0;list-style:none;display:grid;gap:var(--s-3xs)}
.ds-card-points li{font-size:var(--t-caption-size);color:var(--surface-quiet);padding-left:var(--s-sm);position:relative}
.ds-card-points li::before{content:"";position:absolute;left:0;top:0.55em;width:var(--s-3xs);height:1px;background:var(--c-border-strong)}

/* Index rows */
.ds-index{display:grid}
.ds-index-row{display:grid;grid-template-columns:3rem minmax(0,1fr) minmax(0,26rem);gap:var(--s-md);align-items:baseline;padding-block:var(--s-md);border-top:1px solid var(--surface-border)}
.ds-index-row:last-child{border-bottom:1px solid var(--surface-border)}
.ds-index-num{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-index-row h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking)}
.ds-index-row p{font-size:var(--t-bodySmall-size);color:var(--surface-muted)}

/* Alternating feature rows */
.ds-alt{display:grid;gap:var(--s-3xl)}
.ds-alt-row{display:grid;gap:var(--s-lg) var(--s-2xl);align-items:center}
.ds-alt-row:nth-child(even) .ds-alt-figure{order:-1}
.ds-alt-copy{display:grid;gap:var(--s-xs);align-content:start}
.ds-alt-copy h3{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);max-width:20ch}

/* Chapters */
.ds-chapters{display:grid;gap:var(--s-xl)}
.ds-chapter{display:grid;gap:var(--s-xs);padding-top:var(--s-md);border-top:1px solid var(--surface-border)}
.ds-chapter-index{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-chapter h3{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);max-width:24ch}

/* Quote */
.ds-quote{font-family:var(--f-display);font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);font-weight:var(--t-heading-weight);max-width:24ch;text-wrap:balance}
.ds-quote-attribution{margin-top:var(--s-md);font-size:var(--t-caption-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--surface-quiet)}

/* Plans */
.ds-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:var(--s-md);align-items:start}
.ds-plan{display:grid;gap:var(--s-xs);align-content:start;padding:var(--s-lg) var(--s-md);border:1px solid var(--surface-border);border-radius:var(--r-lg);background:var(--c-paper)}
.ds-plan-recommended{border-color:var(--c-accent);background:var(--c-accent-surface)}
.ds-plan-flag{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--c-accent);font-weight:600}
.ds-plan h3{font-size:var(--t-subheading-size)}
.ds-plan-meta{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}

/* Comparison matrix */
.ds-matrix{width:100%;border-collapse:collapse;font-size:var(--t-bodySmall-size)}
.ds-matrix caption{text-align:left;padding-bottom:var(--s-sm);color:var(--surface-muted);font-size:var(--t-bodySmall-size)}
.ds-matrix th,.ds-matrix td{text-align:left;padding:var(--s-sm) var(--s-xs);border-bottom:1px solid var(--surface-border);vertical-align:top}
.ds-matrix thead th{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--surface-quiet);font-weight:600}
.ds-matrix tbody th{font-weight:600;color:var(--surface-ink);width:32%}
.ds-matrix td{color:var(--surface-muted)}
.ds-matrix .ds-yes{color:var(--c-signal);font-family:var(--f-mono)}
.ds-matrix .ds-no{color:var(--surface-quiet);font-family:var(--f-mono)}

/* FAQ */
.ds-faq{display:grid;gap:0}
.ds-faq-item{padding-block:var(--s-md);border-top:1px solid var(--surface-border)}
.ds-faq-item:last-child{border-bottom:1px solid var(--surface-border)}
.ds-faq-item h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);margin-bottom:var(--s-2xs);max-width:34ch}
.ds-faq-item p{font-size:var(--t-bodySmall-size);color:var(--surface-muted);max-width:56ch}

/* CTA band */
.ds-cta{display:grid;gap:var(--s-md);justify-items:start}
.ds-cta .ds-title{max-width:20ch}

/* Footer */
.ds-footer{padding-block:var(--section-y-tight);border-top:1px solid var(--c-border)}
.ds-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:var(--s-lg)}
.ds-footer-col{display:grid;gap:var(--s-2xs);align-content:start;font-size:var(--t-bodySmall-size)}
.ds-footer-col h4{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--c-ink-tertiary);font-weight:600}
.ds-footer-col a{color:var(--c-ink-secondary)}
.ds-footer-col a:hover{color:var(--c-ink)}
.ds-footer-base{display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--s-sm);margin-top:var(--s-xl);padding-top:var(--s-sm);border-top:1px solid var(--c-border);font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}

/* Figure */
.ds-figure{display:grid;gap:var(--s-sm);margin:0}
.ds-figure-stage{border:1px solid var(--surface-border);border-radius:var(--r-lg);background:var(--c-paper-raised);padding:var(--s-md)}
.ds-figure svg{width:100%;height:auto}
.ds-scrub{display:grid;gap:var(--s-2xs);margin-top:var(--s-sm)}
.ds-scrub input{width:100%;accent-color:var(--c-accent);min-height:1.5rem}
.ds-figure figcaption{font-size:var(--t-bodySmall-size);color:var(--surface-muted);max-width:52ch}
.ds-figure-steps{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-2xs)}
.ds-figure-steps li{font-size:var(--t-bodySmall-size);color:var(--surface-quiet);padding-left:var(--s-md);border-left:2px solid transparent}
.ds-figure-steps li.is-active{color:var(--surface-ink);border-left-color:var(--c-accent)}

/* App shell */
.ds-app{display:grid;gap:0;border:1px solid var(--c-border);border-radius:var(--r-lg);overflow:hidden;background:var(--c-paper)}
.ds-app-top{display:flex;align-items:center;gap:var(--s-sm);padding:var(--s-xs) var(--s-md);border-bottom:1px solid var(--c-border);background:var(--c-paper-raised)}
.ds-app-crumbs{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}
.ds-app-grid{display:grid;align-items:stretch;min-height:32rem}
.ds-app-side{border-right:1px solid var(--c-border);background:var(--c-paper-raised);padding:var(--s-md) var(--s-sm);display:grid;gap:var(--s-md);align-content:start}
.ds-app-nav{display:grid;gap:2px;list-style:none;margin:0;padding:0}
.ds-app-nav a{display:block;padding:var(--s-2xs) var(--s-xs);border-radius:var(--r-sm);font-size:var(--t-bodySmall-size);color:var(--c-ink-secondary)}
.ds-app-nav a[aria-current="page"]{background:var(--c-accent-surface);color:var(--c-ink);font-weight:600}
.ds-app-main{padding:var(--s-lg) var(--s-md);display:grid;gap:var(--s-lg);align-content:start}
.ds-app-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:var(--s-sm)}
.ds-stat{border:1px solid var(--c-border);border-radius:var(--r-md);padding:var(--s-sm);display:grid;gap:var(--s-3xs)}
.ds-stat b{font-family:var(--f-mono);font-size:var(--t-subheading-size);font-weight:500}
.ds-stat span{font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}
.ds-table{width:100%;border-collapse:collapse;font-size:var(--t-bodySmall-size)}
.ds-table th,.ds-table td{padding:var(--s-xs);text-align:left;border-bottom:1px solid var(--c-border)}
.ds-table thead th{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--c-ink-tertiary);font-weight:600}
.ds-table td.ds-num{font-family:var(--f-mono);text-align:right;font-variant-numeric:tabular-nums}
.ds-pill{display:inline-flex;align-items:center;padding:2px var(--s-2xs);border-radius:var(--r-pill);font-size:var(--t-micro-size);border:1px solid var(--surface-border);color:var(--c-ink-secondary)}
.ds-pill-signal{color:var(--c-signal);border-color:var(--c-signal)}
.ds-empty{border:1px dashed var(--c-border-strong);border-radius:var(--r-md);padding:var(--s-lg);display:grid;gap:var(--s-2xs);justify-items:start}

.ds-token-rail{display:none;flex-wrap:wrap;gap:var(--s-2xs);margin-top:var(--s-md)}
.ds-token-chip{font-family:var(--f-mono);font-size:var(--t-micro-size);padding:2px var(--s-2xs);border:1px solid var(--surface-border);border-radius:var(--r-pill);color:var(--surface-quiet)}

.ds-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ds-skip{position:absolute;left:var(--s-sm);top:calc(var(--s-sm) * -6);z-index:50;background:var(--c-paper);color:var(--c-ink);border:1px solid var(--c-border);border-radius:var(--r-sm);padding:var(--s-2xs) var(--s-sm)}
.ds-skip:focus{top:var(--s-sm)}

${leanCss(spec.taste.aestheticLean)}
${motionCss(spec.taste.motion)}

@media (max-width:1080px){
  .ds-bento{grid-template-columns:repeat(4,1fr)}
  .ds-card,.ds-card-wide{grid-column:span 2}
  .ds-card-lead{grid-column:span 4}
  .ds-footer-grid{grid-template-columns:1fr 1fr}
}
@media (max-width:820px){
  .ds-split,.ds-alt-row{grid-template-columns:1fr!important}
  .ds-alt-row:nth-child(even) .ds-alt-figure{order:0}
  .ds-bento{grid-template-columns:1fr}
  .ds-card,.ds-card-lead,.ds-card-wide{grid-column:span 1}
  .ds-index-row{grid-template-columns:2rem 1fr;row-gap:var(--s-2xs)}
  .ds-index-row p{grid-column:2}
  .ds-nav-links{display:none}
  .ds-app-grid{grid-template-columns:1fr!important}
  .ds-app-side{border-right:0;border-bottom:1px solid var(--c-border)}
  .ds-app-nav{grid-auto-flow:column;grid-auto-columns:max-content;overflow-x:auto}
  .ds-footer-grid{grid-template-columns:1fr}
  .ds-matrix thead{display:none}
  .ds-matrix tbody th,.ds-matrix td{display:block;width:auto;padding-block:var(--s-3xs)}
  .ds-matrix tbody tr{display:block;padding-block:var(--s-xs);border-bottom:1px solid var(--surface-border)}
}
`;
}

export function surfaceAttr(level: SurfaceLevel): string {
  return level;
}
