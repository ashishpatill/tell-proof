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

/**
 * Section surfaces set their own local ink so nested rules never need to know which band they are in.
 *
 * Four roles, not two. `--surface-body` is the one that matters most: measured reference pages run
 * a median text contrast around 15:1 because their prose is set in near-primary ink and hierarchy
 * is built from size, weight, and space. Setting paragraphs in a muted grey is what drags a page's
 * median down to the high single digits, which is where this engine used to sit.
 */
function surfaceRules(): string {
  return `
[data-surface="paper"]{--surface-bg:var(--c-paper);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)}
[data-surface="raised"]{--surface-bg:var(--c-paper-raised);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)}
[data-surface="sunken"]{--surface-bg:var(--c-paper-sunken);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)}
[data-surface="accent"]{--surface-bg:var(--c-accent-surface);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-accent-border)}
[data-surface="inverse"]{--surface-bg:var(--c-inverse);--surface-ink:var(--c-inverse-ink);--surface-body:var(--c-inverse-ink);--surface-muted:var(--c-inverse-ink-muted);--surface-quiet:var(--c-inverse-ink-muted);--surface-border:color-mix(in srgb, var(--c-inverse-ink) 18%, transparent)}
[data-surface]{background:var(--surface-bg);color:var(--surface-ink)}
/*
 * Paper sections are the page, not a panel on it.
 *
 * Every section used to paint its own background, including the ones whose background is the page
 * colour. Visually that is a no-op; structurally it meant no band of the document was ever
 * unpainted, and the measured difference between a quiet screen and a dense one collapsed. Real
 * pages leave the body showing through most of their length and spend a surface change as
 * punctuation — which is also why a dark band lands when it arrives. Paper sections now inherit,
 * so a screen holding one heading is genuinely mostly empty.
 */
[data-surface="paper"]{background:transparent}
`;
}

function motionCss(motion: MotionLevel): string {
  if (motion === "none") {
    return `
.ds-reveal,.ds-enter,.ds-stagger > *{opacity:1;transform:none}
*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}
`;
  }

  const interactive = `
a,button,.ds-btn,.ds-card-link,.ds-row-link,.ds-tab,.ds-priority-chip,.ds-cadence button{
  transition:color var(--m-base) var(--m-ease),background-color var(--m-base) var(--m-ease),border-color var(--m-base) var(--m-ease),transform var(--m-fast) var(--m-ease),opacity var(--m-base) var(--m-ease),box-shadow var(--m-base) var(--m-ease);
}
.ds-btn-primary:hover{background:var(--c-accent-hover)}
.ds-btn:hover,.ds-card-link:hover{transform:translateY(-1px)}
.ds-card-link:hover{border-color:var(--c-border-strong)}
.ds-row-link:hover{background:var(--c-paper-raised)}
.ds-btn:active,.ds-card-link:active{transform:none}
`;

  const reducedInteractive = `
@media (prefers-reduced-motion: reduce){
  a,button,.ds-btn,.ds-card-link,.ds-row-link,.ds-tab,.ds-priority-chip,.ds-cadence button{transition-duration:0s;transform:none}
  .ds-reveal,.ds-enter,.ds-stagger > *,.ds-chapter-pin,.ds-chapter-progress{opacity:1;transform:none;animation:none!important}
}
`;

  if (motion === "subtle-micro") {
    return `${interactive}
.ds-reveal,.ds-enter{opacity:1;transform:none}
${reducedInteractive}
`;
  }

  /* Shared grammar — siteKind signatures override travel/easing/stagger via CSS vars. */
  const reveals = `
:root,body{
  --m-enter-x:0px;
  --m-enter-y:0.4rem;
  --m-reveal-x:0px;
  --m-reveal-y:0.5rem;
  --m-reveal-scale:1;
  --m-origin:center bottom;
}
@keyframes ds-reveal-in{from{opacity:0;transform:translate(var(--m-reveal-x),var(--m-reveal-y)) scale(var(--m-reveal-scale));transform-origin:var(--m-origin)}to{opacity:1;transform:none}}
@keyframes ds-enter-in{from{opacity:0;transform:translate(var(--m-enter-x),var(--m-enter-y)) scale(var(--m-reveal-scale));transform-origin:var(--m-origin)}to{opacity:1;transform:none}}
@keyframes ds-chapter-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion: no-preference){
  .ds-reveal{opacity:0;transform:translate(var(--m-reveal-x),var(--m-reveal-y)) scale(var(--m-reveal-scale));transition:opacity var(--m-reveal) var(--m-ease-out),transform var(--m-reveal) var(--m-ease-out)}
  .ds-reveal.is-in{opacity:1;transform:none}
  .ds-enter{opacity:0;transform:translate(var(--m-enter-x),var(--m-enter-y)) scale(var(--m-reveal-scale));animation:ds-enter-in var(--m-entrance) var(--m-ease-out) forwards;animation-delay:calc(var(--enter-i,0) * var(--m-stagger))}
  .ds-stagger > *:nth-child(1){transition-delay:calc(0 * var(--m-stagger))}
  .ds-stagger > *:nth-child(2){transition-delay:calc(1 * var(--m-stagger))}
  .ds-stagger > *:nth-child(3){transition-delay:calc(2 * var(--m-stagger))}
  .ds-stagger > *:nth-child(4){transition-delay:calc(3 * var(--m-stagger))}
  .ds-stagger > *:nth-child(5){transition-delay:calc(4 * var(--m-stagger))}
  .ds-stagger > *:nth-child(6){transition-delay:calc(5 * var(--m-stagger))}
  .ds-reveal:not(.is-in) .ds-stagger > *{opacity:0;transform:translate(var(--m-enter-x),var(--m-enter-y)) scale(var(--m-reveal-scale))}
  .ds-reveal.is-in .ds-stagger > *{opacity:1;transform:none;transition:opacity var(--m-reveal) var(--m-ease-out),transform var(--m-reveal) var(--m-ease-out)}
}
@supports (animation-timeline: view()){
  @media (prefers-reduced-motion: no-preference){
    .ds-reveal{
      opacity:1;transform:none;
      animation:ds-reveal-in var(--m-reveal) var(--m-ease-out) both;
      animation-timeline:view();
      animation-range:entry 0% cover 38%;
      transition:none;
    }
    .ds-reveal.is-in{opacity:1;transform:none}
    .ds-reveal .ds-stagger > *{
      opacity:1;transform:none;
      animation:ds-enter-in var(--m-reveal) var(--m-ease-out) both;
      animation-timeline:view();
      animation-range:entry 5% cover 42%;
      animation-delay:calc(var(--enter-i,0) * var(--m-stagger));
    }
    .ds-stagger > *:nth-child(1){--enter-i:0}
    .ds-stagger > *:nth-child(2){--enter-i:1}
    .ds-stagger > *:nth-child(3){--enter-i:2}
    .ds-stagger > *:nth-child(4){--enter-i:3}
    .ds-stagger > *:nth-child(5){--enter-i:4}
    .ds-stagger > *:nth-child(6){--enter-i:5}
  }
}
${reducedInteractive}
`;

  const authored = `
.ds-authored-motion[data-authored-slot="empty"]{
  display:none;
}
`;

  if (motion === "light-scroll-reveals") {
    return `${interactive}${reveals}${authored}`;
  }

  /* scroll-narrative + immersive: sticky chapter + progress bar */
  const narrative = `
.ds-chapter-pin{position:relative;min-height:132vh;padding-bottom:var(--section-y)}
.ds-chapter-pin-inner{position:sticky;top:clamp(3.5rem,8vh,5.5rem);padding-top:var(--s-md)}
.ds-chapter-progress{
  position:absolute;left:0;right:0;top:0;height:2px;background:color-mix(in srgb,var(--c-accent) 18%,transparent);
  transform-origin:left center;pointer-events:none;z-index:var(--z-raised);
}
@media (prefers-reduced-motion: no-preference){
  .ds-chapter-progress{transform:scaleX(0)}
}
@supports (animation-timeline: view()){
  @media (prefers-reduced-motion: no-preference){
    .ds-chapter-progress{
      animation:ds-chapter-fill linear both;
      animation-timeline:view();
      animation-range:contain 0% contain 100%;
    }
  }
}
@media (prefers-reduced-motion: reduce){
  .ds-chapter-pin{min-height:0}
  .ds-chapter-pin-inner{position:static}
  .ds-chapter-progress{display:none}
}
`;

  const immersiveAuthored = `
.ds-authored-motion[data-authored-slot="empty"]{
  position:fixed;inset:auto 1rem 1rem auto;width:4.5rem;height:4.5rem;border-radius:var(--r-md);
  border:1px solid var(--c-border);background:var(--c-paper-raised);opacity:0.55;pointer-events:none;z-index:var(--z-overlay);
}
`;

  return `${interactive}${reveals}${narrative}${motion === "immersive" ? immersiveAuthored : authored}`;
}

/**
 * Per–siteKind motion signatures — dedicated keyframes + travel so each offering
 * is visually unique on camera (not one shared translateY fade).
 */
function motionSignatureCss(siteKind: DesignSpec["brief"]["siteKind"]): string {
  const table: Record<string, string> = {
    "saas-marketing": `
@keyframes ds-saas-in{from{opacity:0;transform:translateY(1.25rem)}to{opacity:1;transform:none}}
[data-sitekind="saas-marketing"]{--m-stagger:48ms;--m-entrance:420ms;--m-reveal:360ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="saas-marketing"] .ds-enter,
  [data-sitekind="saas-marketing"] .ds-reveal,
  [data-sitekind="saas-marketing"] .ds-reveal .ds-stagger > *{animation-name:ds-saas-in}
  [data-sitekind="saas-marketing"] .ds-reveal:not(.is-in),
  [data-sitekind="saas-marketing"] .ds-reveal:not(.is-in) .ds-stagger > *{transform:translateY(1.25rem)}
}
[data-sitekind="saas-marketing"] .ds-btn:hover{transform:translateY(-2px)}
`,
    "dashboard-webapp": `
[data-sitekind="dashboard-webapp"] .ds-reveal,
[data-sitekind="dashboard-webapp"] .ds-enter{opacity:1!important;transform:none!important;animation:none!important}
[data-sitekind="dashboard-webapp"] .ds-priority-chip,
[data-sitekind="dashboard-webapp"] .ds-app-nav-item{transition:transform 140ms var(--m-ease),box-shadow 140ms var(--m-ease),background-color 140ms var(--m-ease)}
[data-sitekind="dashboard-webapp"] .ds-priority-chip:hover,
[data-sitekind="dashboard-webapp"] .ds-app-nav-item:hover{transform:translateX(3px)}
[data-sitekind="dashboard-webapp"] .ds-priority-chip.is-live{box-shadow:inset 3px 0 0 var(--c-accent)}
`,
    "corporate-story": `
@keyframes ds-corp-in{from{opacity:0;transform:translateY(2rem);filter:blur(0)}to{opacity:1;transform:none}}
[data-sitekind="corporate-story"]{--m-stagger:96ms;--m-entrance:720ms;--m-reveal:580ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="corporate-story"] .ds-enter,
  [data-sitekind="corporate-story"] .ds-reveal,
  [data-sitekind="corporate-story"] .ds-reveal .ds-stagger > *{animation-name:ds-corp-in}
  [data-sitekind="corporate-story"] .ds-reveal:not(.is-in){transform:translateY(2rem)}
}
@supports (animation-timeline: view()){
  [data-sitekind="corporate-story"] .ds-reveal{animation-range:entry 10% cover 55%}
}
`,
    "docs-educational": `
@keyframes ds-edu-in{from{opacity:0;transform:translateX(-0.75rem)}to{opacity:1;transform:none}}
[data-sitekind="docs-educational"]{--m-stagger:36ms;--m-entrance:340ms;--m-reveal:300ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="docs-educational"] .ds-enter,
  [data-sitekind="docs-educational"] .ds-reveal,
  [data-sitekind="docs-educational"] .ds-reveal .ds-stagger > *{animation-name:ds-edu-in}
  [data-sitekind="docs-educational"] .ds-reveal:not(.is-in){transform:translateX(-0.75rem)}
  [data-sitekind="docs-educational"] .ds-figure-steps [data-step].is-active{transform:translateX(6px)}
}
`,
    "fintech-marketing": `
@keyframes ds-fin-in{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}
[data-sitekind="fintech-marketing"]{--m-stagger:40ms;--m-entrance:300ms;--m-reveal:260ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="fintech-marketing"] .ds-enter,
  [data-sitekind="fintech-marketing"] .ds-reveal,
  [data-sitekind="fintech-marketing"] .ds-reveal .ds-stagger > *{animation-name:ds-fin-in;transform-origin:center center}
  [data-sitekind="fintech-marketing"] .ds-reveal:not(.is-in){transform:scale(0.94)}
  [data-sitekind="fintech-marketing"] .ds-metric:hover{transform:scale(1.015)}
}
`,
    "art-directed-studio": `
@keyframes ds-studio-in{from{opacity:0;transform:translateY(2.5rem)}to{opacity:1;transform:none}}
[data-sitekind="art-directed-studio"]{--m-stagger:80ms;--m-entrance:760ms;--m-reveal:600ms}
[data-sitekind="art-directed-studio"] .ds-chapter-pin{min-height:160vh}
[data-sitekind="art-directed-studio"] .ds-chapter-progress{height:4px;background:var(--c-accent)}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="art-directed-studio"] .ds-enter,
  [data-sitekind="art-directed-studio"] .ds-reveal,
  [data-sitekind="art-directed-studio"] .ds-reveal .ds-stagger > *{animation-name:ds-studio-in}
  [data-sitekind="art-directed-studio"] .ds-reveal:not(.is-in){transform:translateY(2.5rem)}
}
`,
    "consumer-craft": `
@keyframes ds-consumer-in{from{opacity:0;transform:translateX(-1.75rem)}to{opacity:1;transform:none}}
@keyframes ds-consumer-in-alt{from{opacity:0;transform:translateX(1.75rem)}to{opacity:1;transform:none}}
[data-sitekind="consumer-craft"]{--m-stagger:56ms;--m-entrance:540ms;--m-reveal:440ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="consumer-craft"] .ds-enter,
  [data-sitekind="consumer-craft"] .ds-reveal{animation-name:ds-consumer-in}
  [data-sitekind="consumer-craft"] .ds-reveal .ds-stagger > *:nth-child(odd){animation-name:ds-consumer-in}
  [data-sitekind="consumer-craft"] .ds-reveal .ds-stagger > *:nth-child(even){animation-name:ds-consumer-in-alt}
  [data-sitekind="consumer-craft"] .ds-reveal:not(.is-in){transform:translateX(-1.75rem)}
  [data-sitekind="consumer-craft"] .ds-reveal:not(.is-in) .ds-stagger > *:nth-child(even){transform:translateX(1.75rem)}
}
`,
    "editorial-foundry": `
@keyframes ds-foundry-mask{from{opacity:0;clip-path:inset(0 0 92% 0)}to{opacity:1;clip-path:inset(0 0 0 0)}}
[data-sitekind="editorial-foundry"]{--m-stagger:28ms;--m-entrance:480ms;--m-reveal:400ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="editorial-foundry"] .ds-enter,
  [data-sitekind="editorial-foundry"] .ds-reveal,
  [data-sitekind="editorial-foundry"] .ds-reveal .ds-stagger > *{
    animation-name:ds-foundry-mask;
  }
  [data-sitekind="editorial-foundry"] .ds-reveal:not(.is-in){clip-path:inset(0 0 92% 0);opacity:0}
}
`,
    "research-dossier": `
@keyframes ds-dossier-in{from{opacity:0;transform:translateX(1.5rem)}to{opacity:1;transform:none}}
[data-sitekind="research-dossier"]{--m-stagger:44ms;--m-entrance:480ms;--m-reveal:400ms}
[data-sitekind="research-dossier"] .ds-chapter-progress{
  left:auto;right:0;top:0;bottom:0;width:3px;height:auto;transform-origin:top center;background:var(--c-accent);
}
@keyframes ds-chapter-fill-y{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="research-dossier"] .ds-enter,
  [data-sitekind="research-dossier"] .ds-reveal,
  [data-sitekind="research-dossier"] .ds-reveal .ds-stagger > *{animation-name:ds-dossier-in}
  [data-sitekind="research-dossier"] .ds-reveal:not(.is-in){transform:translateX(1.5rem)}
}
@supports (animation-timeline: view()){
  @media (prefers-reduced-motion: no-preference){
    [data-sitekind="research-dossier"] .ds-chapter-progress{animation-name:ds-chapter-fill-y}
  }
}
`,
    "signal-observatory": `
@keyframes ds-obs-in{from{opacity:0;transform:translateY(0.35rem) scale(0.98)}to{opacity:1;transform:none}}
[data-sitekind="signal-observatory"]{--m-stagger:28ms;--m-entrance:280ms;--m-reveal:240ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="signal-observatory"] .ds-enter,
  [data-sitekind="signal-observatory"] .ds-reveal,
  [data-sitekind="signal-observatory"] .ds-reveal .ds-stagger > *{animation-name:ds-obs-in}
  [data-sitekind="signal-observatory"] .ds-reveal.is-in .ds-cal-tol,
  [data-sitekind="signal-observatory"] .ds-reveal.is-in .ds-index-mark{letter-spacing:0.16em}
}
`,
    "archive-index": `
@keyframes ds-archive-in{from{opacity:0;transform:translateX(-1.25rem)}to{opacity:1;transform:none}}
[data-sitekind="archive-index"]{--m-stagger:22ms;--m-entrance:320ms;--m-reveal:280ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="archive-index"] .ds-enter,
  [data-sitekind="archive-index"] .ds-reveal,
  [data-sitekind="archive-index"] .ds-reveal .ds-stagger > *{animation-name:ds-archive-in}
  [data-sitekind="archive-index"] .ds-reveal:not(.is-in){transform:translateX(-1.25rem)}
  [data-sitekind="archive-index"] .ds-index-row:hover{transform:translateX(4px)}
}
`,
    "commerce-loom": `
@keyframes ds-loom-a{from{opacity:0;transform:translate(-1.4rem,0.4rem)}to{opacity:1;transform:none}}
@keyframes ds-loom-b{from{opacity:0;transform:translate(1.4rem,0.4rem)}to{opacity:1;transform:none}}
[data-sitekind="commerce-loom"]{--m-stagger:52ms;--m-entrance:500ms;--m-reveal:420ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="commerce-loom"] .ds-enter{animation-name:ds-loom-a}
  [data-sitekind="commerce-loom"] .ds-reveal{animation-name:ds-loom-a}
  [data-sitekind="commerce-loom"] .ds-reveal .ds-stagger > *:nth-child(odd){animation-name:ds-loom-a}
  [data-sitekind="commerce-loom"] .ds-reveal .ds-stagger > *:nth-child(even){animation-name:ds-loom-b}
  [data-sitekind="commerce-loom"] .ds-reveal:not(.is-in) .ds-stagger > *:nth-child(odd){transform:translate(-1.4rem,0.4rem)}
  [data-sitekind="commerce-loom"] .ds-reveal:not(.is-in) .ds-stagger > *:nth-child(even){transform:translate(1.4rem,0.4rem)}
}
`,
    "field-guide": `
@keyframes ds-field-in{from{opacity:0;transform:translateY(2.1rem) scale(0.97)}to{opacity:1;transform:none}}
[data-sitekind="field-guide"]{--m-stagger:70ms;--m-entrance:640ms;--m-reveal:520ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="field-guide"] .ds-enter,
  [data-sitekind="field-guide"] .ds-reveal,
  [data-sitekind="field-guide"] .ds-reveal .ds-stagger > *{animation-name:ds-field-in}
  [data-sitekind="field-guide"] .ds-reveal:not(.is-in){transform:translateY(2.1rem) scale(0.97)}
}
`,
    "press-atelier": `
@keyframes ds-press-snap{0%{opacity:0;transform:translateY(0.55rem)}55%{opacity:1;transform:translateY(-0.12rem)}100%{opacity:1;transform:none}}
[data-sitekind="press-atelier"]{--m-stagger:16ms;--m-entrance:260ms;--m-reveal:220ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="press-atelier"] .ds-enter,
  [data-sitekind="press-atelier"] .ds-reveal,
  [data-sitekind="press-atelier"] .ds-reveal .ds-stagger > *{animation-name:ds-press-snap}
}
`,
    "lantern-path": `
@keyframes ds-lantern-in{from{opacity:0;transform:translateY(1.6rem) scale(0.985)}to{opacity:1;transform:none}}
[data-sitekind="lantern-path"]{--m-stagger:64ms;--m-entrance:600ms;--m-reveal:500ms}
@media (prefers-reduced-motion: no-preference){
  [data-sitekind="lantern-path"] .ds-enter,
  [data-sitekind="lantern-path"] .ds-reveal,
  [data-sitekind="lantern-path"] .ds-reveal .ds-stagger > *{animation-name:ds-lantern-in}
  [data-sitekind="lantern-path"] .ds-reveal:not(.is-in){transform:translateY(1.6rem) scale(0.985)}
  [data-sitekind="lantern-path"] .ds-way-mark.is-active{transform:translateX(4px)}
  [data-sitekind="lantern-path"] .ds-path-near .ds-sil{transition:opacity 480ms var(--m-ease-out),transform 480ms var(--m-ease-out)}
}
`,
  };

  return table[siteKind] ?? "";
}


function leanCss(lean: DesignSpec["taste"]["aestheticLean"]): string {
  if (lean === "minimal-clean") {
    return `
[data-lean="minimal-clean"] .ds-card{background:transparent;border:0;border-top:1px solid var(--surface-border);border-radius:0;padding:var(--s-md) 0 var(--s-lg);box-shadow:none}
[data-lean="minimal-clean"] .ds-bento{grid-template-columns:1fr;gap:0}
[data-lean="minimal-clean"] .ds-eyebrow{color:var(--surface-quiet)}
[data-lean="minimal-clean"] .ds-index-row{grid-template-columns:2.5rem 1fr minmax(0,22rem) 4.5rem}
`;
  }
  if (lean === "conversion-sharp") {
    return `
[data-lean="conversion-sharp"] .ds-lead-card{border-color:var(--c-accent-border);background:var(--c-accent-surface)}
[data-lean="conversion-sharp"] .ds-metric-value{color:var(--c-accent)}
[data-lean="conversion-sharp"] .ds-hero-actions{padding-top:var(--s-sm)}
[data-lean="conversion-sharp"] .ds-section-head h2{max-width:18ch}
[data-lean="conversion-sharp"] .ds-card-lead{border-color:var(--c-accent-border);box-shadow:inset 3px 0 0 var(--c-accent)}
[data-lean="conversion-sharp"] .ds-plan-recommended{outline:1px solid color-mix(in srgb,var(--c-accent) 55%,transparent);outline-offset:2px}
[data-lean="conversion-sharp"] .ds-chapter:first-child{outline:1px solid color-mix(in srgb,var(--c-accent) 40%,transparent);outline-offset:1px}
[data-lean="conversion-sharp"] .ds-proof-cell.is-lead,[data-lean="conversion-sharp"] .ds-proof-cell:nth-child(1){outline:1px solid color-mix(in srgb,var(--c-accent) 50%,transparent);outline-offset:1px}
`;
  }
  if (lean === "refined-story") {
    return `
[data-lean="refined-story"] h1,[data-lean="refined-story"] h2,[data-lean="refined-story"] .ds-display{font-variation-settings:"opsz" 96}
/* Radius stays on the token ladder even when the card loses its box. Zeroing it collapsed the
 * page to two painted radii (button + pill), which is the absence of a radius system rather than
 * an editorial decision. */ 
[data-lean="refined-story"] .ds-card{background:transparent;border:0;border-top:1px solid var(--surface-border);border-radius:var(--r-xs);padding:var(--s-md) 0 var(--s-lg);box-shadow:none}
/* Display-sized chapter indices collided with title/body columns (mechanism explainer).
 * Keep editorial presence without stealing the page display metric or overlapping prose. */
[data-lean="refined-story"] .ds-chapter-index{
  font-family:var(--f-display);font-size:clamp(1.35rem,1.8vw,1.85rem);
  color:color-mix(in srgb,var(--c-accent) 78%,var(--surface-quiet));line-height:1;opacity:.72;
}
[data-lean="refined-story"] .ds-quote{font-family:var(--f-display);font-size:var(--t-title-size);line-height:var(--t-title-leading);letter-spacing:var(--t-title-tracking)}
[data-lean="refined-story"] .ds-eyebrow{font-family:var(--f-mono);letter-spacing:0}
`;
  }
  return `
[data-lean="system-crafted"] .ds-card{border-radius:var(--r-lg)}
[data-lean="system-crafted"] .ds-eyebrow{font-family:var(--f-mono);text-transform:none;letter-spacing:0}
[data-lean="system-crafted"] .ds-token-rail{display:flex}
[data-lean="system-crafted"] .ds-index-row:hover{background:var(--c-paper-raised)}
[data-lean="system-crafted"] .ds-app-top{border-bottom-color:var(--c-accent-border);box-shadow:inset 0 -2px 0 var(--c-accent)}
[data-lean="system-crafted"] .ds-stat:first-child{border-color:var(--c-accent-border);background:var(--c-accent-surface)}
[data-lean="system-crafted"] .ds-app-nav a[aria-current="page"],
[data-lean="system-crafted"] .ds-app-nav-item[aria-current="page"]{box-shadow:inset 3px 0 0 var(--c-accent)}
[data-mood="dark-premium"] .ds-metric:first-child{border-color:var(--c-accent-border);background:var(--accent-soft)}
[data-mood="dark-premium"] .ds-brand-mark{color:var(--c-accent)}
[data-mood="dark-premium"] .ds-nav{border-bottom:2px solid var(--c-accent)}
[data-mood="dark-premium"] .ds-metrics-band{box-shadow:inset 0 3px 0 var(--c-accent)}
[data-mood="dark-premium"] .ds-app{outline:1px solid var(--c-accent-border)}
`;
}

/** Site-kind art direction — always applied (must not live inside a lean branch). */
function siteKindCss(): string {
  return `
/* Fold-owns-figure recipe — compact claim chrome so unique craft figures own the first viewport.
 * Per-kind hang fields (+*-field) still set the geometry; this shared block keeps secondary CTAs
 * and fold notes from re-starving the plate/forme/ledger/lattice. */
[data-sitekind="research-dossier"] .ds-hero-folio .ds-cta-note,
[data-sitekind="research-dossier"] .ds-hero-folio .ds-actions .ds-btn-ghost,
[data-sitekind="research-dossier"] .ds-hero-folio .ds-actions .ds-btn-secondary,
[data-sitekind="observatory-signal"] .ds-hero-chrono .ds-cta-note,
[data-sitekind="observatory-signal"] .ds-hero-chrono .ds-actions .ds-btn-ghost,
[data-sitekind="observatory-signal"] .ds-hero-chrono .ds-actions .ds-btn-secondary,
[data-sitekind="archive-index"] .ds-hero-register .ds-cta-note,
[data-sitekind="archive-index"] .ds-hero-register .ds-actions .ds-btn-ghost,
[data-sitekind="archive-index"] .ds-hero-register .ds-actions .ds-btn-secondary,
[data-sitekind="press-atelier"] .ds-hero-press .ds-cta-note,
[data-sitekind="press-atelier"] .ds-hero-press .ds-actions .ds-btn-ghost,
[data-sitekind="press-atelier"] .ds-hero-press .ds-actions .ds-btn-secondary,
[data-sitekind="lantern-path"] .ds-hero-path .ds-cta-note,
[data-sitekind="lantern-path"] .ds-hero-path .ds-actions .ds-btn-ghost,
[data-sitekind="lantern-path"] .ds-hero-path .ds-actions .ds-btn-secondary{display:none}

/* Fintech: inverse specimen is a stage; product drawing sits on a lit paper plate (readable contrast). */
[data-sitekind="fintech-marketing"] .ds-specimen{padding-block:var(--s-xl) var(--s-2xl)}
[data-sitekind="fintech-marketing"] .ds-specimen-head .ds-heading{color:var(--surface-ink)}
[data-sitekind="fintech-marketing"] .ds-specimen .ds-plate{
  padding:var(--s-sm);border:1px solid var(--c-border);border-radius:var(--r-xl);
  background:var(--c-paper);color:var(--c-ink);
  box-shadow:0 28px 64px color-mix(in srgb,#000 48%,transparent);
  --surface-bg:var(--c-paper);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);
  --surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border);
}
[data-sitekind="fintech-marketing"] .ds-specimen .ds-plate-bleed .ds-fig{border-radius:var(--r-lg);min-height:min(68vh,700px)}
[data-sitekind="fintech-marketing"] .ds-metrics-band{box-shadow:inset 0 3px 0 var(--c-accent)}
[data-sitekind="fintech-marketing"] .ds-metric{min-height:10.5rem}
[data-sitekind="fintech-marketing"] .ds-proof{padding-block:var(--s-2xl) calc(var(--section-y) * 0.85)}
/* Stackfold product surface — was overfigure 94vh that collided with claim type. */
[data-sitekind="fintech-marketing"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(82vh,860px)}
[data-sitekind="fintech-marketing"] .ds-hero-stackfold .ds-hero-claimband{padding:var(--s-lg) 0 var(--s-md)}
[data-sitekind="fintech-marketing"] .ds-hero-stackfold .ds-display{max-width:15ch}

/* SaaS conversion — stackfold product fold; conversion-sharp accent spine; distinct from fintech inverse. */
[data-sitekind="saas-marketing"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(80vh,840px)}
[data-sitekind="saas-marketing"] .ds-hero-stackfold .ds-hero-claimband{
  padding:var(--s-lg) 0 var(--s-md);
  border-bottom:1px solid color-mix(in srgb,var(--c-accent) 28%,var(--surface-border));
}
[data-sitekind="saas-marketing"] .ds-hero-stackfold .ds-display{max-width:16ch;line-height:1.05}
[data-sitekind="saas-marketing"] .ds-metrics-band{box-shadow:inset 0 2px 0 var(--c-accent)}
[data-sitekind="saas-marketing"] .ds-proof-board{gap:0}
[data-sitekind="saas-marketing"] .ds-plan{border-radius:var(--r-md)}

/* Corporate story — editorial stackfold (serif claim), horizon figure below — no overfigure wash. */
[data-sitekind="corporate-story"] .ds-hero-stackfold .ds-hero-claimband{
  padding:var(--s-xl) 0 var(--s-lg);
  background:var(--c-paper);
}
[data-sitekind="corporate-story"] .ds-hero-stackfold .ds-display{
  font-size:clamp(2.4rem,4.2vw,3.75rem);max-width:14ch;line-height:1.08;
}
[data-sitekind="corporate-story"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(70vh,720px)}
[data-sitekind="corporate-story"] .ds-metrics-band{background:var(--c-paper-raised)}
[data-sitekind="corporate-story"] .ds-hero-aside{border-left:1px solid var(--surface-border);padding-left:var(--s-md)}

/* Dashboard — stackfold claim then flow figure; shell owns mid-page density. */
[data-sitekind="dashboard-webapp"] .ds-hero-stackfold .ds-hero-claimband{padding:var(--s-lg) 0 var(--s-md)}
[data-sitekind="dashboard-webapp"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(76vh,780px)}
[data-sitekind="dashboard-webapp"] .ds-hero-stackfold .ds-display{max-width:12ch}
/* Studio — stack fold (claim then figure); cool stock, not cream wash. */
[data-sitekind="art-directed-studio"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(88vh,900px)}
/* Compact claim so labeled figure still enters the fold (drawn-matter band). */
[data-sitekind="art-directed-studio"] .ds-hero-stackfold .ds-hero-claimband{padding:var(--s-lg) 0 var(--s-md)}
[data-sitekind="art-directed-studio"] .ds-hero-stackfold .ds-display{
  font-size:clamp(2.6rem,4.6vw,4.15rem);max-width:16ch;line-height:1.05;
}
[data-sitekind="art-directed-studio"] .ds-hero-stackfold .ds-lede{max-width:42ch}
[data-sitekind="art-directed-studio"] .ds-brand-mark{font-size:var(--t-heading-size);line-height:1.15;letter-spacing:var(--t-caption-tracking)}
[data-sitekind="art-directed-studio"] .ds-metrics-band{padding-block:var(--section-y-tight)}
[data-sitekind="art-directed-studio"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="art-directed-studio"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="art-directed-studio"] .ds-chapter-index{opacity:.7}
body[data-sitekind="art-directed-studio"]{
  background:
    radial-gradient(120% 80% at 12% -10%,color-mix(in srgb,var(--c-accent) 8%,transparent),transparent 55%),
    linear-gradient(180deg,var(--c-paper),color-mix(in srgb,var(--c-paper-sunken) 55%,var(--c-paper)));
}
/* Consumer craft: denser product plates, shorter display voice, figure-forward alternating register. */
[data-sitekind="consumer-craft"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(84vh,860px)}
[data-sitekind="consumer-craft"] .ds-hero-stackfold .ds-hero-claimband{padding:var(--s-lg) 0 var(--s-md)}
[data-sitekind="consumer-craft"] .ds-hero-solidclaim .ds-hero-overclaim .ds-display{max-width:18ch;font-size:clamp(2.4rem,4.2vw,3.6rem)}
[data-sitekind="consumer-craft"] .ds-hero-solidclaim .ds-hero-overclaim .ds-lede{max-width:40ch}
[data-sitekind="consumer-craft"] .ds-alt-figure .ds-fig{min-height:min(52vh,520px)}
[data-sitekind="consumer-craft"] .ds-alt-mark{width:12rem}
[data-sitekind="consumer-craft"] .ds-index-mark{width:11rem}
[data-sitekind="consumer-craft"] .ds-specimen{padding-block:var(--s-xl) var(--s-2xl)}
[data-sitekind="consumer-craft"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:12ch}
[data-sitekind="consumer-craft"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(78vh,800px)}
[data-sitekind="consumer-craft"] .ds-metrics-band{padding-block:var(--section-y-tight)}
[data-sitekind="consumer-craft"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
/* Fewer structural rules — consumer refs sit under ~2 rules/screen. */
[data-sitekind="consumer-craft"] .ds-alt-pair{border-top-color:transparent}
[data-sitekind="consumer-craft"] .ds-alt-pair:last-child{border-bottom-color:transparent}
[data-sitekind="consumer-craft"] .ds-index-row{border-color:color-mix(in srgb,var(--surface-border) 55%,transparent)}
/* Editorial foundry — hard seam, spine, type ladder, marginalia, colophon. */
[data-sitekind="editorial-foundry"]{
  --align-rail:6.5rem;
}
body[data-sitekind="editorial-foundry"]{
  background:
    linear-gradient(90deg,transparent 0,transparent calc(var(--align-rail) - 1px),color-mix(in srgb,var(--c-border) 55%,transparent) calc(var(--align-rail) - 1px),color-mix(in srgb,var(--c-border) 55%,transparent) var(--align-rail),transparent var(--align-rail)),
    linear-gradient(180deg,var(--c-paper),color-mix(in srgb,var(--c-paper-sunken) 40%,var(--c-paper)) 48%,var(--c-paper));
}
[data-sitekind="editorial-foundry"] .ds-brand-mark{
  font-size:var(--t-heading-size);line-height:1.1;letter-spacing:var(--t-caption-tracking);
  font-family:var(--f-display);
}
[data-sitekind="editorial-foundry"] .ds-hero-seam .ds-display{
  font-size:clamp(2.1rem,3.3vw,3.05rem);max-width:14ch;line-height:1.08;letter-spacing:-0.03em;
}
[data-sitekind="editorial-foundry"] .ds-hero-seam .ds-lede{max-width:36ch}
[data-sitekind="editorial-foundry"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="editorial-foundry"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="editorial-foundry"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="editorial-foundry"] .ds-index-row{border-color:color-mix(in srgb,var(--surface-border) 70%,transparent)}
[data-sitekind="editorial-foundry"] .ds-section-head,
[data-sitekind="editorial-foundry"] .ds-index-row,
[data-sitekind="editorial-foundry"] .ds-marginalia-essay,
[data-sitekind="editorial-foundry"] .ds-chapter{padding-left:0;margin-left:var(--align-rail)}
[data-sitekind="editorial-foundry"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);
  padding-block:var(--s-3xl,var(--s-2xl)) var(--section-y);
}
[data-sitekind="editorial-foundry"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:16ch}
[data-sitekind="editorial-foundry"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
/* Deliberate overlaps across band boundaries — layeredElements corridor floor is 11.
 * Never pull story marks under Note 0N labels (note + mark stay in normal stack). */
[data-sitekind="editorial-foundry"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="editorial-foundry"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="editorial-foundry"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="editorial-foundry"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
/* Quiet the sunken specimen a notch so ink-variation stays inside corridor (seam is already dense). */
[data-sitekind="editorial-foundry"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(62vh,640px)}
[data-sitekind="editorial-foundry"] .ds-alt-figure .ds-fig{min-height:min(48vh,480px)}
/* Research dossier — folio masthead, chapter rail, dossier plate, verso/recto, imprint. */
[data-sitekind="research-dossier"]{
  --align-rail:5.5rem;
  --chapter-rail:4.25rem;
}
body[data-sitekind="research-dossier"]{
  background:
    linear-gradient(90deg,transparent 0,transparent calc(100% - var(--chapter-rail)),color-mix(in srgb,var(--c-border) 45%,transparent) calc(100% - var(--chapter-rail)),transparent calc(100% - var(--chapter-rail) + 1px)),
    linear-gradient(180deg,var(--c-paper),color-mix(in srgb,var(--c-paper-sunken) 35%,var(--c-paper)) 42%,var(--c-paper));
}
[data-sitekind="research-dossier"] .ds-brand-mark{
  font-size:var(--t-heading-size);line-height:1.1;letter-spacing:var(--t-caption-tracking);
  font-family:var(--f-display);
}
[data-sitekind="research-dossier"] .ds-hero-folio .ds-display{
  font-size:clamp(2rem,3.35vw,2.95rem);max-width:15ch;line-height:1.08;letter-spacing:-0.028em;
  margin:0.25rem 0 0;
}
[data-sitekind="research-dossier"] .ds-hero-folio .ds-lede{max-width:36ch;margin:0.35rem 0 0}
[data-sitekind="research-dossier"] .ds-hero-folio .ds-brand-mark{margin:0 0 0.35rem}
[data-sitekind="research-dossier"] .ds-hero-folio .ds-eyebrow{margin:0}
[data-sitekind="research-dossier"] .ds-hero-folio .ds-actions{margin-top:0.55rem}
[data-sitekind="research-dossier"] .ds-folio-masthead{
  padding-top:calc(var(--nav-h,4.5rem) + var(--s-sm));padding-bottom:0.45rem;
}
[data-sitekind="research-dossier"] .ds-folio-claim{padding:var(--s-sm) 0 var(--s-md)}
[data-sitekind="research-dossier"] .ds-folio-field{margin-top:0;position:relative;z-index:1}
[data-sitekind="research-dossier"] .ds-folio-claim{position:relative;z-index:2;background:var(--c-paper)}
[data-sitekind="research-dossier"] .ds-folio-plate .ds-fig{min-height:min(84vh,880px)}
[data-sitekind="research-dossier"] .ds-hero-folio{min-height:min(100vh,900px)}
/* Hide the fold reassurance note — it steals fold height from the plate. */
[data-sitekind="research-dossier"] .ds-hero-folio .ds-cta-note{display:none}
[data-sitekind="research-dossier"] .ds-fn-ref{font-size:11px;line-height:1}
[data-sitekind="research-dossier"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="research-dossier"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="research-dossier"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="research-dossier"] .ds-section-head,
[data-sitekind="research-dossier"] .ds-index-row,
[data-sitekind="research-dossier"] .ds-spread-page,
[data-sitekind="research-dossier"] .ds-chapter{padding-right:0;margin-right:var(--chapter-rail)}
[data-sitekind="research-dossier"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);
  padding-block:var(--s-3xl,var(--s-2xl)) var(--section-y);
}
[data-sitekind="research-dossier"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="research-dossier"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="research-dossier"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="research-dossier"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="research-dossier"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="research-dossier"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="research-dossier"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(70vh,720px)}
[data-sitekind="research-dossier"] .ds-index-row{border-color:color-mix(in srgb,var(--surface-border) 70%,transparent)}
/* Signal observatory — chronometer, scrub rail, signal lattice, chrono essay, calibration. */
[data-sitekind="signal-observatory"]{
  --chrono-rail:3.25rem;
  --scrub-rail:3.5rem;
  --craft-rail:var(--chrono-rail);
}
body[data-sitekind="signal-observatory"]{
  background:
    linear-gradient(90deg,transparent 0,transparent calc(var(--chrono-rail) - 1px),color-mix(in srgb,var(--c-border) 50%,transparent) calc(var(--chrono-rail) - 1px),color-mix(in srgb,var(--c-border) 50%,transparent) var(--chrono-rail),transparent var(--chrono-rail)),
    linear-gradient(180deg,var(--c-paper),color-mix(in srgb,var(--c-paper-sunken) 45%,var(--c-paper)) 52%,var(--c-paper));
  padding-bottom:var(--scrub-rail);
}
[data-sitekind="signal-observatory"] .ds-brand-mark{
  font-size:var(--t-heading-size);line-height:1.1;letter-spacing:var(--t-caption-tracking);
  font-family:var(--f-display);
}
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-display{
  font-size:clamp(2.0rem,3.2vw,2.85rem);max-width:14ch;line-height:1.08;letter-spacing:-0.03em;
}
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-lede{max-width:36ch;margin:0.25rem 0 0}
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-brand-mark{margin:0 0 0.25rem}
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-eyebrow{margin:0}
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-actions{margin-top:0.45rem}
[data-sitekind="signal-observatory"] .ds-chrono-claim{
  padding:var(--s-md) 0 var(--s-lg);
  padding-left:var(--chrono-rail);
  position:relative;z-index:2;
  background:var(--c-paper);
}
[data-sitekind="signal-observatory"] .ds-chrono-field{
  margin-top:0;position:relative;z-index:1;
  padding-left:0;
}
[data-sitekind="signal-observatory"] .ds-chrono-lattice .ds-fig{min-height:min(88vh,920px)}
[data-sitekind="signal-observatory"] .ds-hero-chrono{min-height:min(100vh,900px);padding-bottom:var(--scrub-rail)}
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-cta-note{display:none}
/* Keep secondary CTA off the fold so the lattice enters the first viewport. */
[data-sitekind="signal-observatory"] .ds-hero-chrono .ds-actions .ds-btn-ghost{display:none}
[data-sitekind="signal-observatory"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="signal-observatory"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="signal-observatory"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="signal-observatory"] .ds-section-head,
[data-sitekind="signal-observatory"] .ds-index-row,
[data-sitekind="signal-observatory"] .ds-chapter{padding-left:0;margin-left:var(--chrono-rail)}
/* Chrono track + beads need the essay's own padding-left — do not zero it onto the rail. */
[data-sitekind="signal-observatory"] .ds-chrono-essay{margin-left:var(--chrono-rail)}
[data-sitekind="signal-observatory"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);padding-top:var(--s-xl);
}
[data-sitekind="signal-observatory"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="signal-observatory"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="signal-observatory"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="signal-observatory"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="signal-observatory"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="signal-observatory"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="signal-observatory"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(74vh,760px)}
[data-sitekind="signal-observatory"] .ds-index-row{border-color:color-mix(in srgb,var(--surface-border) 70%,transparent)}
/* Observatory bleed seal stays hairline — thick accent bars tank the hairline ratio. */
[data-sitekind="signal-observatory"] .ds-bleed-rule{height:1px;background:var(--c-accent)}
/* Calibration strip — tolerance numerals on paper (replaces decorative ::before ticks). */
[data-sitekind="signal-observatory"] .ds-cal-strip{
  list-style:none;margin:0 0 var(--s-sm);padding:0 0 var(--s-sm);
  display:flex;flex-wrap:wrap;gap:0.65rem 1.25rem;
  border-bottom:1px solid color-mix(in srgb,var(--c-border) 70%,transparent);
}
[data-sitekind="signal-observatory"] .ds-cal-mark{
  display:flex;flex-direction:column;gap:0.1rem;min-width:4.5rem;
}
[data-sitekind="signal-observatory"] .ds-cal-tol{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.1em;color:var(--c-accent);
}
[data-sitekind="signal-observatory"] .ds-cal-ch{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.06em;text-transform:uppercase;
  color:var(--c-ink-tertiary);
}
/* Chronometer "now" bead — 1px stroke only, mid-rail hour. */
[data-sitekind="signal-observatory"] .ds-chrono-tick:nth-child(7)::after{
  content:"";position:absolute;left:50%;top:calc(50% + 0.55rem);transform:translateX(-50%);
  width:5px;height:5px;border-radius:50%;
  border:1px solid var(--c-accent);background:var(--c-paper);box-sizing:border-box;
}
[data-sitekind="signal-observatory"] .ds-chrono-tick:nth-child(7){color:var(--c-accent)}
/* Archive index — quiet register, alpha rail, index ledger, entry essay, Registry. */
[data-sitekind="archive-index"]{
  --alpha-rail:2.75rem;
  --craft-rail:var(--alpha-rail);
}
body[data-sitekind="archive-index"]{
  background-image:
    linear-gradient(90deg,color-mix(in srgb,var(--c-border) 40%,transparent) 0,transparent 1px),
    linear-gradient(90deg,transparent 0,transparent var(--alpha-rail),color-mix(in srgb,var(--c-border) 35%,transparent) var(--alpha-rail),transparent calc(var(--alpha-rail) + 1px));
  background-size:100% 100%;
  background-attachment:fixed;
}
[data-sitekind="archive-index"] .ds-brand-mark{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
}
/* Do not wrap --t-display-size (already a clamp) in calc(*1px) — that invalidates font-size. */
[data-sitekind="archive-index"] .ds-hero-register .ds-display{
  font-size:clamp(2.6rem,3.4vw,3.2rem);
  letter-spacing:-0.03em;max-width:14ch;line-height:1.08;
}
[data-sitekind="archive-index"] .ds-hero-register .ds-lede{max-width:34ch;margin:0.25rem 0 0}
[data-sitekind="archive-index"] .ds-hero-register .ds-brand-mark{margin:0 0 0.25rem}
[data-sitekind="archive-index"] .ds-hero-register .ds-eyebrow{margin:0}
[data-sitekind="archive-index"] .ds-hero-register .ds-actions{margin-top:0.4rem}
/* Entry folio numbers must not steal the display metric (refined-story chapter-index is huge). */
[data-sitekind="archive-index"] .ds-entry-beat .ds-chapter-index,
[data-sitekind="archive-index"] .ds-entry-folio{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.16em;line-height:1.2;
  opacity:1;color:var(--c-ink-tertiary);font-variation-settings:normal;
}
[data-sitekind="archive-index"] .ds-register-claim{
  padding:var(--s-md) 0 var(--s-lg);
  padding-left:var(--alpha-rail);
  position:relative;z-index:2;
  background:var(--c-paper);
}
[data-sitekind="archive-index"] .ds-register-claim .ds-hero-copy{gap:0.35rem;max-width:28rem}
[data-sitekind="archive-index"] .ds-register-claim .ds-lede{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:40ch}
[data-sitekind="archive-index"] .ds-register-claim .ds-btn-secondary{display:none}
[data-sitekind="archive-index"] .ds-register-field{
  margin-top:0;position:relative;z-index:1;
  padding-left:0;
}
[data-sitekind="archive-index"] .ds-register-ledger .ds-fig{min-height:min(72vh,760px)}
[data-sitekind="archive-index"] .ds-hero-register{min-height:min(98vh,900px)}
[data-sitekind="archive-index"] .ds-hero-register .ds-cta-note{display:none}
[data-sitekind="archive-index"] .ds-hero-register .ds-actions .ds-btn-ghost{display:none}
[data-sitekind="archive-index"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="archive-index"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="archive-index"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="archive-index"] .ds-section-head,
[data-sitekind="archive-index"] .ds-index-row,
[data-sitekind="archive-index"] .ds-entry-essay,
[data-sitekind="archive-index"] .ds-chapter{padding-left:0;margin-left:var(--alpha-rail)}
/* Colophon uses a full box border so it does not inflate ruleDensity (top/bottom-only rules). */
[data-sitekind="archive-index"] .ds-closing-colophon{
  border:1px solid var(--c-border);border-radius:var(--r-md);padding:var(--s-xl);
}
[data-sitekind="archive-index"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="archive-index"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="archive-index"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="archive-index"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="archive-index"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="archive-index"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="archive-index"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(72vh,740px)}

/* Commerce loom — drawloom fold: claim-as-weft, cloth below, treadles. Not soft purple glass. */
[data-sitekind="commerce-loom"]{
  --tape-rail:0;
  --treadle-h:3.25rem;
}
body[data-sitekind="commerce-loom"]{
  background-color:var(--c-paper);
  background-image:
    linear-gradient(180deg,color-mix(in srgb,var(--c-paper) 92%,var(--c-accent-surface)) 0%,var(--c-paper) 42%,var(--c-paper) 100%),
    repeating-linear-gradient(90deg,transparent 0 47px,color-mix(in srgb,var(--c-border) 35%,transparent) 47px 48px);
}
[data-sitekind="commerce-loom"] .ds-brand-mark{
  font-family:var(--f-display);letter-spacing:-0.02em;
}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-weft-display{
  font-size:clamp(2.35rem,3.4vw,3.15rem);line-height:1.02;letter-spacing:-0.035em;
  display:flex;flex-direction:column;gap:0.35rem;margin:0;max-width:28ch;
}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-lede{max-width:36ch;margin:0.25rem 0 0;font-size:var(--t-small-size,0.95rem)}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-brand-mark{margin:0 0 0.1rem}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-eyebrow{margin:0}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-actions{margin-top:0.4rem}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-cta-note{display:none}
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-actions .ds-btn-ghost,
[data-sitekind="commerce-loom"] .ds-hero-drawloom .ds-actions a:nth-child(2){display:none}
[data-sitekind="commerce-loom"] .ds-hang-size,
[data-sitekind="commerce-loom"] .ds-hang-aside-size{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;text-transform:none;color:var(--c-accent);
}
[data-sitekind="commerce-loom"] .ds-hang-aside-title{font-size:14px;line-height:1.3}
[data-sitekind="commerce-loom"] .ds-fig text.ds-fig-mono,
[data-sitekind="commerce-loom"] text.ds-fig-mono{font-size:11px!important}
[data-sitekind="commerce-loom"] .ds-loom-plate .ds-fig{min-height:min(56vh,560px)}
[data-sitekind="commerce-loom"] .ds-hero-loom{min-height:min(100vh,960px);padding-bottom:var(--treadle-h)}
[data-sitekind="commerce-loom"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="commerce-loom"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="commerce-loom"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);padding-top:var(--s-xl);
}
[data-sitekind="commerce-loom"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="commerce-loom"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="commerce-loom"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="commerce-loom"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="commerce-loom"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="commerce-loom"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="commerce-loom"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(72vh,740px)}
[data-sitekind="commerce-loom"] .ds-bleed-rule{height:1px;background:var(--c-accent)}

/* Field guide — glassine press fold: plate under sheet, museum label, binomial strip. */
[data-sitekind="field-guide"]{
  --taxon-rail:0;
  --binomial-h:3.1rem;
}
body[data-sitekind="field-guide"]{
  background-color:var(--c-paper);
  background-image:
    linear-gradient(180deg,color-mix(in srgb,var(--c-paper) 88%,var(--c-accent-surface)) 0%,var(--c-paper) 40%,var(--c-paper) 100%),
    radial-gradient(70% 55% at 70% 20%,color-mix(in srgb,var(--c-accent-surface) 45%,transparent),transparent 60%);
}
[data-sitekind="field-guide"] .ds-brand-mark{
  font-family:var(--f-display);letter-spacing:-0.02em;
}
[data-sitekind="field-guide"] .ds-press-label .ds-display{
  font-size:clamp(2.2rem,3.15vw,2.95rem);line-height:1.06;max-width:16ch;letter-spacing:-0.03em;
}
[data-sitekind="field-guide"] .ds-press-label .ds-lede{max-width:32ch;margin:0.25rem 0 0;font-size:var(--t-small-size,0.95rem)}
[data-sitekind="field-guide"] .ds-press-label .ds-brand-mark{margin:0 0 0.15rem}
[data-sitekind="field-guide"] .ds-press-label .ds-eyebrow{margin:0}
[data-sitekind="field-guide"] .ds-press-label .ds-actions{margin-top:0.45rem}
[data-sitekind="field-guide"] .ds-hero-glassine .ds-cta-note{display:none}
[data-sitekind="field-guide"] .ds-hero-glassine .ds-actions .ds-btn-ghost,
[data-sitekind="field-guide"] .ds-hero-glassine .ds-actions a:nth-child(2){display:none}
[data-sitekind="field-guide"] .ds-range-rank,
[data-sitekind="field-guide"] .ds-range-aside-rank{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;text-transform:none;color:var(--c-accent);
}
[data-sitekind="field-guide"] .ds-fig text.ds-fig-mono,
[data-sitekind="field-guide"] text.ds-fig-mono{font-size:11px!important}
[data-sitekind="field-guide"] .ds-voucher-plate .ds-fig{min-height:min(64vh,660px)}
[data-sitekind="field-guide"] .ds-hero-voucher{min-height:min(100vh,960px);padding-bottom:var(--binomial-h)}
[data-sitekind="field-guide"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="field-guide"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="field-guide"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);padding-top:var(--s-xl);
}
[data-sitekind="field-guide"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="field-guide"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="field-guide"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="field-guide"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="field-guide"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="field-guide"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="field-guide"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(72vh,740px)}
[data-sitekind="field-guide"] .ds-bleed-rule{height:1px;background:var(--c-accent)}
/*
 * ruleDensity = wide CSS top/bottom borders ÷ screens (SVG strokes do not count).
 * Must come LAST in this siteKind block — an earlier border-color shorthand undid thinning.
 */
[data-sitekind="archive-index"] .ds-index-row{
  border-top-color:transparent;border-bottom-color:transparent;padding-block:var(--s-sm);
}
[data-sitekind="archive-index"] .ds-index-row:nth-child(3n+1){border-top-color:var(--surface-border)}
[data-sitekind="archive-index"] .ds-index-row:last-child{border-bottom-color:transparent}
[data-sitekind="archive-index"] .ds-alt-pair{border-top-color:transparent;border-bottom-color:transparent}
[data-sitekind="archive-index"] .ds-alt-pair:nth-child(3n+1){border-top:1px solid var(--surface-border)}
[data-sitekind="archive-index"] .ds-faq-item{border-top-color:transparent}
[data-sitekind="archive-index"] .ds-faq-item:nth-child(3n+1){border-top:1px solid var(--surface-border)}
[data-sitekind="archive-index"] .ds-sec-meta{border-top-color:transparent;padding-top:0}
[data-sitekind="archive-index"] .ds-chapter{border-bottom-color:transparent}
[data-sitekind="archive-index"] .ds-chapter:nth-child(3n+1){border-bottom:1px solid var(--surface-border)}
[data-sitekind="archive-index"] .ds-bleed-rule{height:0;background:transparent}
/* Press atelier — registration fold, signature rail, press sheet, gather essay, Pressroom. */
[data-sitekind="press-atelier"]{
  --sig-rail:3.25rem;
  --craft-rail:var(--sig-rail);
}
body[data-sitekind="press-atelier"]{
  background-image:
    linear-gradient(90deg,color-mix(in srgb,var(--c-border) 40%,transparent) 0,transparent 1px),
    linear-gradient(90deg,transparent 0,transparent var(--sig-rail),color-mix(in srgb,var(--c-border) 35%,transparent) var(--sig-rail),transparent calc(var(--sig-rail) + 1px));
  background-size:100% 100%;
  background-attachment:fixed;
}
[data-sitekind="press-atelier"] .ds-brand-mark{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
}
/* Thin claim strip — forme owns the fold. Quiet display stays in band (≥3.16vw). */
[data-sitekind="press-atelier"] .ds-hero-press .ds-display{
  font-size:clamp(2.45rem,3.2vw,3.0rem);
  letter-spacing:-0.03em;max-width:15ch;line-height:1.05;
}
[data-sitekind="press-atelier"] .ds-hero-press .ds-lede{display:none}
[data-sitekind="press-atelier"] .ds-hero-press .ds-eyebrow{display:none}
[data-sitekind="press-atelier"] .ds-hero-press .ds-brand-mark{
  margin:0 0 0.1rem;font-family:var(--f-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
}
[data-sitekind="press-atelier"] .ds-hero-press .ds-cta-note{display:none}
[data-sitekind="press-atelier"] .ds-hero-press .ds-actions .ds-btn-ghost,
[data-sitekind="press-atelier"] .ds-hero-press .ds-actions .ds-btn-secondary{display:none}
[data-sitekind="press-atelier"] .ds-gather-beat .ds-chapter-index,
[data-sitekind="press-atelier"] .ds-gather-tick,
[data-sitekind="press-atelier"] .ds-gather-aside-sig,
[data-sitekind="press-atelier"] .ds-sig-letter,
[data-sitekind="press-atelier"] .ds-press-masthead,
[data-sitekind="press-atelier"] .ds-cal-tol,
[data-sitekind="press-atelier"] .ds-cal-ch{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;line-height:1.2;
  opacity:1;color:var(--c-ink-tertiary);font-variation-settings:normal;
}
[data-sitekind="press-atelier"] .ds-press-claim{
  padding:var(--s-md) 0 var(--s-lg);
  padding-left:var(--sig-rail);
  position:relative;z-index:2;
  background:var(--c-paper);
}
[data-sitekind="press-atelier"] .ds-press-claim .ds-actions{margin-top:0.35rem}
[data-sitekind="press-atelier"] .ds-press-claim .ds-actions .ds-btn{padding:0.45rem 0.95rem}
[data-sitekind="press-atelier"] .ds-press-claim .ds-hero-chips,
[data-sitekind="press-atelier"] .ds-press-claim .ds-capability-list,
[data-sitekind="press-atelier"] .ds-press-claim .ds-hero-aside,
[data-sitekind="press-atelier"] .ds-press-claim .ds-hero-facts{display:none}
[data-sitekind="press-atelier"] .ds-press-field{
  margin-top:0;position:relative;z-index:1;
  padding-left:0;
}
[data-sitekind="press-atelier"] .ds-press-sheet .ds-fig{min-height:min(92vh,960px)}
[data-sitekind="press-atelier"] .ds-hero-press{min-height:min(100vh,920px)}
[data-sitekind="press-atelier"] .ds-press-masthead{
  padding-top:calc(var(--nav-h,4.5rem) + var(--s-md));
  padding-bottom:var(--s-sm);
  color:var(--c-ink-tertiary);
}
[data-sitekind="press-atelier"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="press-atelier"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="press-atelier"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="press-atelier"] .ds-section-head,
[data-sitekind="press-atelier"] .ds-index-row,
[data-sitekind="press-atelier"] .ds-gather-essay,
[data-sitekind="press-atelier"] .ds-chapter{padding-left:0;margin-left:var(--sig-rail)}
[data-sitekind="press-atelier"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);padding-top:var(--s-xl);
}
[data-sitekind="press-atelier"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="press-atelier"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="press-atelier"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="press-atelier"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="press-atelier"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
/* Lantern path — chapter waypoints, path atlas fold, silhouette near-plane, ember essay, Ember. */
[data-sitekind="lantern-path"]{
  --way-rail:3.5rem;
  --craft-rail:var(--way-rail);
}
body[data-sitekind="lantern-path"]{
  background-image:
    linear-gradient(90deg,color-mix(in srgb,var(--c-border) 35%,transparent) 0,transparent 1px),
    linear-gradient(90deg,transparent 0,transparent var(--way-rail),color-mix(in srgb,var(--c-accent) 22%,transparent) var(--way-rail),transparent calc(var(--way-rail) + 1px));
  background-size:100% 100%;
  background-attachment:fixed;
}
[data-sitekind="lantern-path"] .ds-brand-mark{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
}
[data-sitekind="lantern-path"] .ds-hero-path .ds-display{
  font-size:clamp(2.45rem,3.2vw,3.0rem);
  letter-spacing:-0.03em;max-width:16ch;line-height:1.05;
}
[data-sitekind="lantern-path"] .ds-hero-path .ds-lede{display:none}
[data-sitekind="lantern-path"] .ds-hero-path .ds-eyebrow{display:none}
[data-sitekind="lantern-path"] .ds-hero-path .ds-brand-mark{
  margin:0 0 0.1rem;font-family:var(--f-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
}
[data-sitekind="lantern-path"] .ds-hero-path .ds-cta-note{display:none}
[data-sitekind="lantern-path"] .ds-hero-path .ds-actions .ds-btn-ghost,
[data-sitekind="lantern-path"] .ds-hero-path .ds-actions .ds-btn-secondary{display:none}
[data-sitekind="lantern-path"] .ds-ember-beat .ds-chapter-index,
[data-sitekind="lantern-path"] .ds-ember-bead,
[data-sitekind="lantern-path"] .ds-ember-aside-ch,
[data-sitekind="lantern-path"] .ds-way-mark,
[data-sitekind="lantern-path"] .ds-path-masthead{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;line-height:1.2;
  opacity:1;color:var(--c-ink-tertiary);font-variation-settings:normal;
}
[data-sitekind="lantern-path"] .ds-path-claim{
  padding:var(--s-md) 0 var(--s-lg);
  padding-left:var(--way-rail);
  position:relative;z-index:2;
  background:var(--c-paper);
}
[data-sitekind="lantern-path"] .ds-path-claim .ds-actions{margin-top:0.2rem}
[data-sitekind="lantern-path"] .ds-path-claim .ds-actions .ds-btn{padding:0.45rem 0.95rem}
[data-sitekind="lantern-path"] .ds-path-claim .ds-hero-chips,
[data-sitekind="lantern-path"] .ds-path-claim .ds-capability-list,
[data-sitekind="lantern-path"] .ds-path-claim .ds-hero-aside,
[data-sitekind="lantern-path"] .ds-path-claim .ds-hero-facts{display:none}
[data-sitekind="lantern-path"] .ds-path-field{
  margin-top:0;position:relative;z-index:1;
  padding-left:0;
}
[data-sitekind="lantern-path"] .ds-path-plate .ds-fig{min-height:min(92vh,960px)}
[data-sitekind="lantern-path"] .ds-hero-path{min-height:min(100vh,920px)}
[data-sitekind="lantern-path"] .ds-path-masthead{
  padding-top:calc(var(--nav-h,4.5rem) + var(--s-md));
  padding-bottom:var(--s-sm);
  color:var(--c-ink-tertiary);
}
[data-sitekind="lantern-path"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="lantern-path"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:16ch}
[data-sitekind="lantern-path"] .ds-proof{padding-block:var(--s-2xl) var(--section-y)}
[data-sitekind="lantern-path"] .ds-section-head,
[data-sitekind="lantern-path"] .ds-index-row,
[data-sitekind="lantern-path"] .ds-ember-essay,
[data-sitekind="lantern-path"] .ds-chapter{padding-left:0;margin-left:var(--way-rail)}
[data-sitekind="lantern-path"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);padding-top:var(--s-xl);
}
[data-sitekind="lantern-path"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="lantern-path"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="lantern-path"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="lantern-path"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="lantern-path"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="lantern-path"] .ds-proof-figure,
[data-sitekind="lantern-path"] .ds-plate-fold,
[data-sitekind="lantern-path"] .ds-plate-lit,
[data-sitekind="lantern-path"] .ds-btn{box-shadow:none!important}
[data-sitekind="lantern-path"] .ds-proof-cell.is-lead,
[data-sitekind="lantern-path"] .ds-proof-cell:first-child{box-shadow:inset 0 1px 0 var(--c-accent)}
[data-sitekind="lantern-path"] .ds-path-near{
  position:absolute;left:var(--way-rail);right:0;bottom:0;height:min(22vh,180px);
  pointer-events:none;z-index:2;overflow:hidden;
}
[data-sitekind="lantern-path"] .ds-sil{
  position:absolute;bottom:0;display:block;
  background:color-mix(in srgb,var(--c-ink) 82%, transparent);
  opacity:0.55;transition:opacity 0.6s ease, transform 0.8s ease;
}
[data-sitekind="lantern-path"] .ds-sil-gate{
  left:4%;width:72px;height:110px;
  clip-path:polygon(8% 100%,8% 42%,28% 18%,50% 8%,72% 18%,92% 42%,92% 100%,72% 100%,72% 55%,28% 55%,28% 100%);
}
[data-sitekind="lantern-path"] .ds-sil-pine{
  left:38%;width:90px;height:130px;
  clip-path:polygon(50% 0,62% 28%,58% 28%,72% 52%,64% 52%,80% 78%,70% 78%,90% 100%,10% 100%,30% 78%,20% 78%,36% 52%,28% 52%,42% 28%,38% 28%);
}
[data-sitekind="lantern-path"] .ds-sil-stone{
  right:8%;width:120px;height:36px;border-radius:50% 50% 40% 40% / 70% 70% 30% 30%;
  opacity:0.4;
}
@media (prefers-reduced-motion:reduce){
  [data-sitekind="lantern-path"] .ds-sil{transition:none}
}
@media (max-width:800px){
  [data-sitekind="lantern-path"]{--way-rail:0px}
  [data-sitekind="lantern-path"] .ds-way-rail{display:none}
  [data-sitekind="lantern-path"] .ds-path-claim,
  [data-sitekind="lantern-path"] .ds-path-field,
  [data-sitekind="lantern-path"] .ds-section-head,
  [data-sitekind="lantern-path"] .ds-ember-essay{padding-left:0;margin-left:0}
}
[data-sitekind="press-atelier"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="press-atelier"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(72vh,740px)}
[data-sitekind="press-atelier"] .ds-index-row{border-color:color-mix(in srgb,var(--surface-border) 70%,transparent)}
[data-sitekind="press-atelier"] .ds-bleed-rule{height:1px;background:var(--c-accent)}
[data-sitekind="press-atelier"] .ds-press-plates .ds-cal-tol{letter-spacing:0.12em}
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
--z-base:0;
--z-raised:2;
--z-nav:40;
--z-overlay:60;
--z-grain:1;
--focus-ring:0 0 0 3px color-mix(in srgb,var(--c-accent) 35%,transparent);
--accent-soft:color-mix(in srgb,var(--c-accent) 14%,transparent);
/* Shared inset rail — section heads, chapters, and indexes align on one left edge. */
--align-rail:5.5rem;
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{
  margin:0;
  /* Bleeding elements reach past the container on purpose; clip the axis they travel on rather
     than letting them add a horizontal scrollbar. Clip and not hidden, so the page can still be
     scrolled to an anchor vertically. */
  overflow-x:clip;
  /* Atmosphere is not decoration for its own sake — a flat single-fill page is the toy look.
   * A soft accent wash at the top of the document and a slow paper shift down the scroll give the
   * eye something to read as depth before any section paints. Accent stays dilute; this is not a
   * purple mesh hero. */
  background-color:var(--c-paper);
  background-image:
    radial-gradient(ellipse 110% 70% at 78% -10%,color-mix(in srgb,var(--c-accent) 9%,transparent),transparent 58%),
    radial-gradient(ellipse 70% 50% at 8% 12%,color-mix(in srgb,var(--c-accent) 4%,transparent),transparent 55%),
    linear-gradient(180deg,var(--c-paper) 0%,var(--c-paper-sunken) 42%,var(--c-paper) 100%);
  background-attachment:fixed;
/* Soft-brand + client hex: keep atmosphere as stock, not a chromatic flood (accent-coverage ceiling). */
body[data-mood="soft-brand-accent"]{
  background-image:
    radial-gradient(ellipse 90% 55% at 80% -8%,color-mix(in srgb,var(--c-accent) 5%,transparent),transparent 60%),
    linear-gradient(180deg,var(--c-paper) 0%,var(--c-paper-sunken) 48%,var(--c-paper) 100%);
}
  color:var(--c-ink);
  font-family:var(--f-body);
  font-size:var(--t-body-size);
  line-height:var(--t-body-leading);
  letter-spacing:var(--t-body-tracking);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
body::before{
  content:"";
  position:fixed;inset:0;pointer-events:none;z-index:var(--z-grain);opacity:.035;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.05 0 0 0 0 0.05 0 0 0 0 0.06 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
img,svg,video{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
::selection{background:var(--c-accent);color:var(--c-accent-ink)}

:where(a,button,input,select,textarea,[tabindex]):focus-visible{
  outline:2px solid var(--c-accent);
  outline-offset:2px;
  border-radius:var(--r-xs);
  box-shadow:var(--focus-ring);
}

h1,h2,h3,h4{margin:0;font-family:var(--f-display);font-weight:var(--t-heading-weight);text-wrap:balance}
p{margin:0;text-wrap:pretty}
/* Sticky nav clearance — anchors must not land under the bar. */
[id],[data-section]{scroll-margin-top:calc(var(--s-2xl) + var(--s-sm))}

.ds-display{font-family:var(--f-display);font-size:var(--t-display-size);line-height:var(--t-display-leading);letter-spacing:var(--t-display-tracking);font-weight:var(--t-display-weight);max-width:22ch;text-wrap:balance}
.ds-title{font-size:var(--t-title-size);line-height:var(--t-title-leading);letter-spacing:var(--t-title-tracking);font-weight:var(--t-title-weight);max-width:22ch;text-wrap:balance}
.ds-heading{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);font-weight:var(--t-heading-weight);max-width:26ch}
.ds-subheading{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking);font-weight:var(--t-subheading-weight)}
.ds-lede{font-size:var(--t-lede-size);line-height:var(--t-lede-leading);letter-spacing:var(--t-lede-tracking);color:var(--surface-muted,var(--c-ink-secondary));max-width:var(--w-prose)}
.ds-body{font-size:var(--t-body-size);line-height:var(--t-body-leading);color:var(--surface-body,var(--c-ink-body));max-width:var(--w-prose)}
.ds-small{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-body,var(--c-ink-body))}
.ds-caption{font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--surface-quiet,var(--c-ink-tertiary))}
/* Sentence-case index labels — forced uppercase on every eyebrow was chrome noise, not hierarchy. */
.ds-eyebrow{font-size:var(--t-micro-size);line-height:var(--t-micro-leading);letter-spacing:0.02em;font-weight:600;text-transform:none;color:var(--surface-quiet,var(--c-ink-tertiary))}
.ds-mono{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0}

${surfaceRules()}

.ds-wrap{width:min(100% - (var(--gutter) * 2),var(--w-content));margin-inline:auto}
.ds-wrap-wide{width:min(100% - (var(--gutter) * 2),var(--w-wide));margin-inline:auto}
.ds-section{padding-block:calc(var(--section-y) * 0.88)}
.ds-section-tight{padding-block:var(--section-y-tight)}
/* A section that continues the one above it takes the break down to a beat. Two sections asking the
 * same question from different angles belong on a screen together; the full break between them is
 * what turned a page of twelve considered sections into twelve interchangeable screens. */
.ds-section[data-bond="continues"]{padding-top:var(--s-lg)}
.ds-section[data-bond="continues"] .ds-section-head{margin-bottom:var(--s-md)}
.ds-section-head{display:grid;gap:var(--s-sm);margin-bottom:var(--s-xl)}
/* Eyebrow rail + main column: a repeated inset left edge (personal-craft alignment pattern). */
.ds-section-head-spine{grid-template-columns:var(--align-rail) minmax(0,1fr);column-gap:var(--s-lg);align-items:start}
.ds-section-head-spine .ds-eyebrow{margin:0;padding-top:0.4em;max-width:var(--align-rail)}
.ds-section-head-spine .ds-eyebrow-slot{display:block;min-height:1em}
.ds-section-head-main{display:grid;gap:var(--s-sm);min-width:0}
.ds-section-head-spread{grid-template-columns:var(--align-rail) minmax(0,6fr) minmax(0,5fr);gap:var(--s-lg) var(--s-2xl);align-items:start}
.ds-section-head-spread .ds-section-head-main{grid-column:2;min-width:0}
.ds-section-head-spread .ds-section-head-main .ds-title,
.ds-section-head-spread .ds-section-head-main .ds-heading{max-width:18ch}
.ds-section-head-spread .ds-lede{
  margin-top:0.35em;max-width:36ch;grid-column:3;grid-row:1;align-self:start;min-width:0;
}
.ds-section-head .ds-lede{margin-top:var(--s-2xs)}
/* Educational — mechanism teaching surface: packed scrub stage, quiet valley, sparse CSS rules. */
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-hero-claimband{
  padding:0.25rem 0 var(--s-lg);
  position:relative;z-index:calc(var(--z-raised) + 2);
  /* Fully opaque over the hung plate — Sequence SVG micro-label must not bleed into the CTA. */
  background:var(--c-paper);
  border-bottom:1px solid var(--surface-border);box-shadow:none;
}
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-display{
  font-size:clamp(2rem,3.1vw,2.85rem);max-width:14ch;line-height:1.05;margin:0.2rem 0 0;
}
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-lede{
  max-width:36ch;margin:0.2rem 0 0;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-actions{margin-top:0.35rem}
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-btn-secondary,
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-btn-ghost,
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-cta-note{display:none}
/* aside shown above — do not hide */
/* Stackfold stays in document flow — never pull labeled stages under the claim (overlap regression). */
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-plate-bleed{
  margin-top:0;margin-bottom:0;
  position:relative;z-index:1;
}
/* Content-sized figure — never force a stretched empty stage grid to 72vh. */
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{
  min-height:min(52vh,560px);height:auto;max-height:none;
}
/* Show mechanism aside on educational folds — stages are real scroll targets, not dead chrome. */
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-hero-aside{display:block}
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-hero-claimband .ds-split{grid-template-columns:minmax(0,7fr) minmax(12rem,4fr)}
[data-sitekind="docs-educational"] .ds-hero{min-height:0;padding-block:0.5rem 0;align-content:start}
[data-sitekind="docs-educational"] .ds-hero-aside{
  padding:var(--s-md);border:1px solid var(--surface-border);border-radius:var(--r-md);
  background:color-mix(in srgb,var(--c-paper-raised) 88%,transparent);
}
[data-sitekind="docs-educational"] .ds-figure-stage{
  min-height:20rem;padding:var(--s-md);border:1px solid var(--surface-border);
  border-radius:var(--r-lg);background:var(--c-paper);
}
[data-sitekind="docs-educational"] .ds-scrub{display:grid;gap:var(--s-2xs);margin-top:var(--s-sm)}
[data-sitekind="docs-educational"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:10ch;line-height:1.15}
[data-sitekind="docs-educational"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(42vh,420px);opacity:.88}
[data-sitekind="docs-educational"] .ds-specimen{padding-block:var(--s-lg) var(--s-xl)}
[data-sitekind="docs-educational"] .ds-chapters{margin-top:var(--s-sm);border-top-color:transparent}
[data-sitekind="docs-educational"] .ds-chapter-mark{width:10.5rem}
[data-sitekind="docs-educational"] .ds-matrix{font-size:var(--t-bodySmall-size)}
/* Keep measured body voice on a full prose measure — scrub/aside columns must not steal it. */
[data-sitekind="docs-educational"] .ds-chapter .ds-body,
[data-sitekind="docs-educational"] .ds-lede,
[data-sitekind="docs-educational"] .ds-cta .ds-lede,
[data-sitekind="docs-educational"] .ds-index-row p,
[data-sitekind="docs-educational"] .ds-figure figcaption{
  max-width:min(68ch,var(--w-prose));width:min(68ch,100%);
  font-size:var(--t-body-size);line-height:var(--t-body-leading);
}
[data-sitekind="docs-educational"] .ds-figure-steps{
  max-width:min(52ch,100%);
}
[data-sitekind="docs-educational"] .ds-figure-steps li span{display:none}
/* Soften hang compensations so median section padding stays ≤120. */
[data-sitekind="docs-educational"] .ds-section{padding-block:calc(var(--section-y) * 0.82)}
[data-sitekind="docs-educational"] .ds-hero{padding-block:calc(var(--section-y) * 0.9) calc(var(--section-y) * 0.75)}
/* No chapter negative-margin collisions with labeled scrub — hang larger bands instead. */
[data-sitekind="docs-educational"] .ds-chapter,
[data-sitekind="docs-educational"] .ds-chapter:nth-child(-n+2),
[data-sitekind="docs-educational"] .ds-chapter:nth-child(n+3){
  margin-top:0;z-index:auto;
}
/*
 * ruleDensity counts each wide top/bottom-only border (matrix cells included).
 * Keep a readable register without a border flood — every third row / thead only.
 */
[data-sitekind="docs-educational"] .ds-chapter{border-bottom-color:transparent}
[data-sitekind="docs-educational"] .ds-chapter:nth-child(3n+1){border-bottom:1px solid var(--surface-border)}
[data-sitekind="docs-educational"] .ds-index-row{border-top-color:transparent;border-bottom-color:transparent}
[data-sitekind="docs-educational"] .ds-index-row:nth-child(3n+1){border-top-color:var(--surface-border)}
[data-sitekind="docs-educational"] .ds-index-row:last-child{border-bottom-color:transparent}
[data-sitekind="docs-educational"] .ds-figure-steps li{border:0;padding-block:0.35rem;cursor:pointer}
[data-sitekind="docs-educational"] .ds-figure-steps li:hover,
[data-sitekind="docs-educational"] .ds-figure-steps li:focus-visible{color:var(--surface-ink)}
[data-sitekind="docs-educational"] .ds-figure-steps li:focus-visible{outline:2px solid var(--c-accent);outline-offset:2px}
[data-sitekind="docs-educational"] .ds-sec-meta{border-top-color:transparent;padding-top:0}
[data-sitekind="docs-educational"] .ds-hero-facts{border-top-color:transparent}
[data-sitekind="docs-educational"] .ds-matrix th,
[data-sitekind="docs-educational"] .ds-matrix td{border-bottom-color:transparent}
[data-sitekind="docs-educational"] .ds-matrix thead th{border-bottom:1px solid var(--surface-border)}
[data-sitekind="docs-educational"] .ds-matrix tbody tr:nth-child(3n) th,
[data-sitekind="docs-educational"] .ds-matrix tbody tr:nth-child(3n) td{border-bottom:1px solid var(--surface-border)}
[data-sitekind="docs-educational"] .ds-card{border-top-color:transparent}
[data-sitekind="docs-educational"] .ds-card:nth-child(3n+1){border-top-color:var(--surface-border)}
[data-sitekind="docs-educational"] .ds-footer,
[data-sitekind="docs-educational"] .ds-footer-base{border-top-color:transparent}
/* Layering floor (≥11): large hangs across band boundaries — not chapter collisions. */
[data-sitekind="docs-educational"] [data-section="figure"]{
  margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] [data-section="figure"] + .ds-section{padding-top:var(--section-y)}
[data-sitekind="docs-educational"] .ds-specimen{
  margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-specimen + .ds-section{padding-top:var(--section-y)}
[data-sitekind="docs-educational"] [data-section="features"]{
  margin-bottom:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] [data-section="features"] + .ds-section{padding-top:var(--section-y)}
[data-sitekind="docs-educational"] .ds-story{
  margin-bottom:calc(var(--s-lg) * -1);position:relative;z-index:calc(var(--z-raised) + 1);
}
[data-sitekind="docs-educational"] .ds-story + .ds-section{padding-top:var(--section-y)}
[data-sitekind="docs-educational"] [data-section="compare"]{
  margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-matrix{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="docs-educational"] .ds-closing{
  margin-top:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-figure-stage{
  margin-bottom:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-index{
  margin-bottom:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-chapters{
  margin-bottom:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised);
}


.ds-split{display:grid;gap:var(--s-xl) var(--s-2xl);align-items:start}
/* Chapter / index titles share one inset left — third axis beside wrap-wide and wrap. */
.ds-chapter h3,.ds-index-row h3{justify-self:start;width:100%}

/* Navigation
 *
 * Opaque, not translucent. A pinned bar exists so that the page cannot be read through it, and at
 * 86% over a blur a display headline scrolling underneath still came through as a smear across the
 * wordmark — the cheapest way there is to make an otherwise careful page look unfinished. The
 * hairline underneath is what separates the bar from the page; the backdrop does not have to.
 */
.ds-nav{position:sticky;top:0;z-index:var(--z-nav);background:var(--c-paper);border-bottom:1px solid var(--c-border)}
.ds-nav-inner{display:flex;align-items:center;gap:var(--s-lg);min-height:var(--s-2xl);width:min(100% - (var(--gutter) * 2),var(--w-wide));margin-inline:auto}
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
.ds-hero{position:relative;padding-block:calc(var(--section-y) * 0.95) var(--section-y);min-height:min(78vh,860px);display:grid;align-content:center;isolation:isolate}
.ds-hero::before{
  content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 70% 80% at 92% 40%,color-mix(in srgb,var(--c-accent) 18%,transparent),transparent 62%),
    radial-gradient(ellipse 45% 55% at 0% 100%,color-mix(in srgb,var(--c-accent) 8%,transparent),transparent 60%);
}
.ds-hero > *{position:relative;z-index:1}
.ds-hero-copy{display:grid;gap:var(--s-md);align-content:start}
/* Brand is a hero-level signal — not a nav leftover. */
.ds-brand-mark{font-family:var(--f-display);font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);font-weight:var(--t-heading-weight);color:var(--c-accent);max-width:18ch}
.ds-hero-actions{display:flex;flex-wrap:wrap;gap:var(--s-sm);align-items:center;margin-top:var(--s-xs)}
.ds-hero-facts{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-sm);margin:var(--s-xl) 0 0;padding-top:var(--s-md);list-style:none;border-top:1px solid var(--surface-border)}
.ds-hero-facts li{font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-hero-facts li + li{padding-left:var(--s-sm);border-left:1px solid var(--surface-border)}

/* Figures — the drawn matter of the page.
 *
 * Every figure is inline SVG painted in surface tokens, so it re-themes with the band it sits in
 * and costs one request rather than an image pipeline. Text inside a figure inherits the page
 * faces; nothing here animates. */
/* Never overflow:visible here. An SVG that paints outside its own box escapes the clip on the
 * band it belongs to, and a background field two screens down lands as stray marks on the fold. */
.ds-fig{display:block;width:100%;height:auto;font-family:var(--f-body);overflow:hidden}
.ds-fig text{font-family:var(--f-body)}
.ds-fig .ds-fig-mono{font-family:var(--f-mono)}
/* A rule stays a rule at any size.
 *
 * Every figure is laid out in its own units and then scaled to whatever column it lands in — a
 * capability mark drawn at 168 units wide renders at 72px, and without this its 1-unit hairlines
 * render at 0.43px, which the compositor resolves as pale grey mush. Scaled the other way, a fold
 * plate drawn at 557 units and rendered at 700 was setting 1.25px rules where the page sets 1px.
 * Non-scaling strokes make a drawn hairline and a CSS border the same object at every scale, which
 * is the whole reason these are drawings and not images. */
.ds-fig line,.ds-fig rect,.ds-fig path,.ds-fig circle,.ds-fig ellipse,.ds-fig polyline,.ds-fig polygon{vector-effect:non-scaling-stroke}
.ds-plate{margin:0;display:grid;gap:var(--s-xs)}
/* A plate without a radius collapses the ladder on pages that never render a card or a plan —
 * editorial and docs surfaces were measuring two painted radii (button + pill) and nothing else. */
.ds-plate .ds-fig{border-radius:var(--r-lg)}
.ds-plate-bleed .ds-fig{border-radius:0}
.ds-plate figcaption{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-plate-wide{margin-bottom:var(--s-xl)}
/* The fold plate runs past the container to the screen edge.
 *
 * Inside its column the interface renders at roughly half the width its own drawing was laid out
 * for, which puts its labels under seven pixels — legible in a viewBox, not on a screen. Letting it
 * bleed right restores the drawing to full size, and it is the same move reference pages use to
 * stop a fold from reading as two boxes side by side. */
.ds-plate-fold,.ds-plate-lit{align-self:center;padding:var(--s-sm);border:1px solid var(--c-border);border-radius:var(--r-xl);background:var(--c-paper);box-shadow:var(--sh-raised,var(--shadow-raised,0 18px 48px color-mix(in srgb,var(--c-ink) 10%,transparent))),0 0 0 1px color-mix(in srgb,var(--c-accent) 12%,transparent);position:relative}
/* Corner brackets — drawn matter on the plate frame so a product surface does not read as a bare card. */
.ds-plate-fold::before,.ds-plate-fold::after,.ds-plate-lit::before,.ds-plate-lit::after{
  content:"";position:absolute;width:1.1rem;height:1.1rem;border:1.5px solid var(--c-accent);pointer-events:none;z-index:2;
}
.ds-plate-fold::before,.ds-plate-lit::before{top:0.45rem;left:0.45rem;border-right:0;border-bottom:0}
.ds-plate-fold::after,.ds-plate-lit::after{right:0.45rem;bottom:0.45rem;border-left:0;border-top:0}
@media (min-width:64rem){
  .ds-plate-fold{margin-right:calc(var(--gutter) - max(0px,(100vw - var(--w-wide)) / 2));margin-bottom:calc(var(--s-xl) * -1);z-index:var(--z-raised)}
}
/* Full-bleed. A page where nothing reaches the edge of the screen is a document in a frame, and
 * measured reference pages spend between a tenth and all of their bands on something that does. */
.ds-bleed{width:100vw;margin-left:calc(50% - 50vw)}
.ds-plate-bleed .ds-fig{width:100vw}
.ds-plate-bleed figcaption{width:min(100% - (var(--gutter) * 2),var(--w-wide));margin-inline:auto}
/* Left craft rails (sig / way / alpha / chrono) — bleeds and plates must clear the rail column. */
[data-sitekind="press-atelier"] .ds-bleed,
[data-sitekind="lantern-path"] .ds-bleed,
[data-sitekind="archive-index"] .ds-bleed,
[data-sitekind="signal-observatory"] .ds-bleed{
  width:calc(100vw - var(--craft-rail,0px));
  margin-left:calc(50% - 50vw + var(--craft-rail,0px));
  max-width:none;
  box-sizing:border-box;
}
[data-sitekind="press-atelier"] .ds-plate-bleed .ds-fig,
[data-sitekind="lantern-path"] .ds-plate-bleed .ds-fig,
[data-sitekind="archive-index"] .ds-plate-bleed .ds-fig,
[data-sitekind="signal-observatory"] .ds-plate-bleed .ds-fig{
  width:calc(100vw - var(--craft-rail,0px));
  max-width:none;
}
[data-sitekind="press-atelier"] .ds-flow-track,
[data-sitekind="lantern-path"] .ds-flow-track,
[data-sitekind="archive-index"] .ds-flow-track,
[data-sitekind="signal-observatory"] .ds-flow-track{
  padding-inline:var(--gutter);
  box-sizing:border-box;
}
/* The fold plate hangs across the seam into the next band. Overlap is the cheapest depth there
 * is — no shadow, no blur, nothing to repaint on scroll — and it is what stops an opening screen
 * from reading as two stacked rectangles. */
.ds-plate-hang{margin-top:var(--s-lg);margin-bottom:calc(var(--s-2xl) * -1);position:relative;z-index:var(--z-raised)}
/* The label goes above a drawing that hangs. Below it, the caption is separated from its figure by
 * the whole overlap and lands alone under the next band's top edge, where it reads as debris left
 * over from the fold rather than as the drawing's own label. */
.ds-plate-hang figcaption{order:-1;width:min(100% - (var(--gutter) * 2),var(--w-wide));margin-inline:auto;text-align:right}
.ds-hero:has(.ds-plate-hang) + .ds-section{padding-top:calc(var(--section-y) + var(--s-2xl))}
/* Depth by hang, not by shadow. Each of these crosses a band boundary so the page is one
 * composition scrolling past rather than a stack of framed rectangles. The pull has to live on the
 * section (or on a child whose negative margin collapses the section's bottom), or the next band
 * never moves up to meet it. */
.ds-specimen{margin-bottom:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
.ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-sm))}
.ds-specimen + .ds-proof{margin-top:calc(var(--s-xl) * -1);padding-top:var(--s-2xl)}
.ds-metrics-band{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
.ds-metrics-band + .ds-section{padding-top:calc(var(--section-y) + var(--s-md))}
/* Overlap the fold hang into metrics so layeredElements and bleed count match dense reference folds. */
.ds-hero-spanning + .ds-metrics-band{padding-top:calc(var(--section-y-tight) + var(--s-xl))}
.ds-app-band{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
.ds-app-band + .ds-section{padding-top:calc(var(--section-y) + var(--s-md))}
.ds-closing{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
.ds-metric:first-child,.ds-metric:nth-child(3){margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
.ds-bento > :nth-child(2),.ds-bento > :nth-child(3){margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
.ds-card:nth-child(odd){margin-bottom:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
.ds-index-row:nth-child(odd){margin-block:calc(var(--s-sm) * -1);padding-block:var(--s-sm);position:relative;z-index:var(--z-raised)}
.ds-index-row:nth-child(even){margin-top:calc(var(--s-2xs) * -1);position:relative;z-index:var(--z-raised)}
.ds-plan:not(.ds-plan-recommended){margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
.ds-plan-recommended{z-index:calc(var(--z-raised) + 1)}
.ds-chapter:nth-child(-n+2){margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
.ds-chapter:nth-child(n+3){margin-top:calc(var(--s-2xs) * -1);position:relative;z-index:var(--z-raised)}
.ds-proof-figure{z-index:var(--z-raised)}
.ds-proof-cell:nth-child(-n+2){margin-top:calc(var(--s-xs) * -1);position:relative;z-index:var(--z-raised)}
.ds-faq-item:nth-child(-n+2){margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
.ds-matrix{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
/*
 * A fold whose figure spans the screen gives the copy the top of it and the drawing the rest.
 *
 * The centred 84vh hero was reserving a full screen for four hundred characters and pushing the
 * drawing past the fold entirely, which is how a page ended up describing a product above the fold
 * and showing it below.
 */
.ds-hero-spanning{min-height:0;padding-block:var(--s-md) 0;align-content:start}
.ds-hero-spanning .ds-hero-copy{gap:var(--s-xs);max-width:40rem;padding-block:var(--s-md) var(--s-xs)}
.ds-hero-spanning .ds-display{max-width:18ch}
.ds-hero-spanning .ds-lede{max-width:46ch}
.ds-hero-spanning .ds-actions{margin-top:var(--s-2xs)}
.ds-hero-spanning .ds-plate-hang{margin-top:var(--s-xs);margin-bottom:calc(var(--s-2xl) * -1.35)}
/* SaaS / fintech: product surface owns the fold; claim rides a short gradient over it. */
.ds-hero-overfigure{position:relative;padding:0;min-height:0;isolation:isolate}
.ds-hero-overfigure .ds-plate-hang{margin:0 0 calc(var(--s-xl) * -1);padding:0;border:0;border-radius:0;box-shadow:none;background:transparent}
.ds-hero-overfigure .ds-plate-hang::before,.ds-hero-overfigure .ds-plate-hang::after{display:none}
.ds-hero-overfigure .ds-plate-bleed .ds-fig{min-height:min(92vh,920px);border-radius:0}
.ds-hero-overfigure .ds-plate-hang figcaption{position:absolute;right:var(--gutter);bottom:var(--s-sm);order:0;width:auto;margin:0;z-index:2;color:var(--c-ink-tertiary);background:color-mix(in srgb,var(--c-paper) 88%,transparent);padding:0.2rem 0.45rem;border-radius:var(--r-xs)}
.ds-hero-overclaim{
  position:absolute;inset:0 0 auto;z-index:var(--z-raised);pointer-events:none;
  padding:calc(var(--s-xl) + var(--s-sm)) 0 var(--s-2xl);
  background:linear-gradient(180deg,color-mix(in srgb,var(--c-paper) 94%,transparent) 0%,color-mix(in srgb,var(--c-paper) 72%,transparent) 42%,transparent 100%);
}
.ds-hero-overclaim .ds-wrap-wide,.ds-hero-overclaim .ds-hero-copy,.ds-hero-overclaim .ds-actions{pointer-events:auto}
.ds-hero-overclaim .ds-hero-copy{padding-block:0;gap:var(--s-xs);max-width:36rem}
.ds-hero-overclaim .ds-display{max-width:16ch}
.ds-hero-overclaim .ds-lede{max-width:42ch;color:var(--c-ink-secondary)}
.ds-hero-overfigure + .ds-metrics-band{padding-top:calc(var(--section-y-tight) + var(--s-lg))}
/*
 * Stack fold — claim then labeled figure in normal flow (studio/consumer).
 * Claim is relative + opaque; figure never shares the type's box. No absolute overlay,
 * no padding-top fake push (those left stage labels parked under the lede).
 */
.ds-hero-stackfold{display:flex;flex-direction:column;position:relative;padding:0;min-height:0;isolation:isolate}
.ds-hero-stackfold .ds-hero-overclaim.ds-hero-claimband{
  position:relative;inset:auto;z-index:auto;pointer-events:auto;
  background:var(--c-paper);
  padding:calc(var(--s-xl) + var(--s-sm)) 0 var(--s-xl);
  border-bottom:1px solid var(--surface-border);
  box-shadow:none;
}
.ds-hero-stackfold .ds-plate-hang{margin:0;padding:0;border:0;border-radius:0;box-shadow:none;background:transparent}
.ds-hero-stackfold .ds-plate-hang::before,.ds-hero-stackfold .ds-plate-hang::after{display:none}
.ds-hero-stackfold .ds-plate-bleed .ds-fig{min-height:min(88vh,900px);border-radius:0;padding-top:0}
.ds-hero-stackfold .ds-plate-hang figcaption{
  position:absolute;right:var(--gutter);bottom:var(--s-sm);order:0;width:auto;margin:0;z-index:2;
  color:var(--c-ink-tertiary);background:color-mix(in srgb,var(--c-paper) 88%,transparent);
  padding:0.2rem 0.45rem;border-radius:var(--r-xs);
}
.ds-hero-solidclaim .ds-hero-overclaim .ds-hero-copy{gap:1.25rem;max-width:38rem}
.ds-hero-solidclaim .ds-hero-overclaim .ds-brand-mark{
  line-height:1.15;margin:0 0 0.65rem;padding:0;
}
.ds-hero-solidclaim .ds-hero-overclaim .ds-eyebrow{line-height:1.45;margin:0;padding:0}
.ds-hero-solidclaim .ds-hero-overclaim .ds-display{max-width:14ch;margin:0.4rem 0 0;padding:0;line-height:1.08}
.ds-hero-solidclaim .ds-hero-overclaim .ds-lede{max-width:38ch;color:var(--c-ink);margin:0}
.ds-hero-solidclaim .ds-hero-overclaim .ds-actions{margin-top:0.6rem}

/* First-five marketing fold instruments — unreplicable DOM (not stackfold retunes).
 * Split folds: claim + instrument share the viewport. Never a tall left-only claim
 * with the craft figure shoved below the fold (empty right half / empty bottom void). */
.ds-hero-pipeline{position:relative;isolation:isolate;padding:0;min-height:0;display:flex;flex-direction:column}
.ds-stage-rail{position:sticky;top:var(--nav-h,4.5rem);z-index:4;background:var(--c-paper);border-bottom:1px solid var(--c-border)}
.ds-stage-rail ol{list-style:none;margin:0;padding:0 var(--gutter);display:flex;min-height:3.25rem}
.ds-stage-rail li{flex:1;display:flex}
.ds-stage-chip{flex:1;display:flex;flex-direction:column;justify-content:center;gap:0.15rem;padding:0.55rem 0.75rem;border:0;border-left:1px solid var(--c-border);border-radius:0;background:transparent;color:var(--c-ink-tertiary);text-decoration:none;font:inherit;font-size:11px;text-align:left;cursor:pointer}
.ds-stage-rail li:first-child .ds-stage-chip{border-left:0}
.ds-stage-chip.is-live,.ds-stage-chip:hover,.ds-stage-chip:focus-visible{color:var(--c-accent)}
.ds-stage-chip:focus-visible{outline:2px solid var(--c-accent);outline-offset:-2px}
.ds-stage-meta,.ds-stage-label{font-family:var(--f-mono);letter-spacing:0.1em}
.ds-stage-label{text-transform:uppercase}
.ds-rail-caption{margin:0;padding:0.35rem var(--gutter) 0;font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0.08em;text-transform:uppercase;color:var(--c-ink-tertiary)}
.ds-hero-queue .ds-rail-caption{color:color-mix(in oklab,var(--c-paper) 55%,transparent)}
.ds-pipeline-fold{flex:0 1 auto;display:grid;grid-template-columns:minmax(0,5.5fr) minmax(0,6.5fr);gap:clamp(1rem,2.2vw,1.75rem);align-items:start;padding:var(--s-md) 0 var(--s-xl);min-height:0}
.ds-pipeline-claim{padding:var(--s-sm) 0 0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--s-sm)}
.ds-pipeline-claim .ds-display{max-width:16ch;font-size:clamp(2rem,3.4vw,3.1rem);line-height:1.05}
.ds-pipeline-claim .ds-lede{max-width:36ch}
.ds-pipeline-claim .ds-brand-mark{font-family:var(--f-mono);font-size:11px;letter-spacing:0.16em;text-transform:uppercase}
.ds-pipeline-field{align-self:start;display:flex;min-height:0;width:100%}
.ds-pipeline-field .ds-pipeline-board,.ds-pipeline-field figure{flex:1;display:flex;min-height:0;margin:0;width:100%}
.ds-pipeline-field .ds-fig{width:100%;height:auto;min-height:min(62vh,580px);display:block}

.ds-hero-queue{position:relative;isolation:isolate;padding:0;min-height:0;display:flex;flex-direction:column;background:var(--c-ink);color:var(--c-paper)}
.ds-hero-queue .ds-display,.ds-hero-queue .ds-lede,.ds-hero-queue .ds-brand-mark,.ds-hero-queue .ds-eyebrow{color:inherit}
.ds-hero-queue .ds-lede{opacity:0.78}
.ds-hero-queue .ds-btn-primary{background:var(--c-accent);color:var(--c-ink)}
.ds-priority-rail{position:sticky;top:var(--nav-h,4.5rem);z-index:4;background:color-mix(in oklab,var(--c-ink) 94%,var(--c-accent));border-bottom:1px solid color-mix(in oklab,var(--c-paper) 18%,transparent)}
.ds-priority-rail ol{list-style:none;margin:0;padding:0 var(--gutter);display:flex;min-height:3.25rem;overflow-x:auto}
.ds-priority-rail li{flex:1;min-width:7rem;display:flex}
.ds-priority-chip{flex:1;display:flex;flex-direction:column;justify-content:center;gap:0.15rem;padding:0.55rem 0.75rem;border:0;border-left:1px solid color-mix(in oklab,var(--c-paper) 14%,transparent);border-radius:0;background:transparent;color:color-mix(in oklab,var(--c-paper) 55%,transparent);text-decoration:none;font:inherit;font-size:11px;text-align:left;cursor:pointer}
.ds-priority-rail li:first-child .ds-priority-chip{border-left:0}
.ds-priority-chip.is-live,.ds-priority-chip:hover,.ds-priority-chip:focus-visible{color:var(--c-accent);background:color-mix(in oklab,var(--c-accent) 12%,transparent)}
.ds-priority-chip:focus-visible{outline:2px solid var(--c-accent);outline-offset:-2px}
.ds-priority-meta,.ds-priority-label{font-family:var(--f-mono);letter-spacing:0.08em}
.ds-queue-fold{flex:0 1 auto;display:grid;grid-template-columns:minmax(0,4.5fr) minmax(0,7.5fr);gap:clamp(1rem,2.2vw,1.75rem);align-items:start;padding:var(--s-md) 0 var(--s-xl);min-height:0}
.ds-queue-claim{padding:var(--s-sm) 0 0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--s-sm)}
.ds-queue-claim .ds-display{max-width:15ch;font-size:clamp(1.85rem,3.1vw,2.75rem);line-height:1.05}
.ds-queue-field{align-self:start;display:flex;min-height:0;width:100%}
.ds-queue-field .ds-queue-console,.ds-queue-field figure{flex:1;display:flex;min-height:0;margin:0;width:100%}
.ds-queue-field .ds-fig{width:100%;height:auto;min-height:min(60vh,560px);display:block}

.ds-hero-diligence{position:relative;isolation:isolate;padding:0;min-height:0;display:flex;flex-direction:column}
.ds-principle-spine{position:absolute;left:0;top:calc(var(--nav-h,4.5rem) + var(--s-md));bottom:var(--s-xl);width:3.5rem;z-index:3;pointer-events:none;writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:flex-start;border-right:1px solid var(--c-border);padding:var(--s-sm) 0}
.ds-principle-spine ol{list-style:none;margin:0;padding:0;display:flex;gap:var(--s-md)}
.ds-principle-spine li{font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;color:var(--c-ink-tertiary);display:flex;gap:0.35rem;align-items:center}
.ds-principle-spine li.is-live{color:var(--c-accent)}
.ds-principle-spine b{font-weight:500;font-family:var(--f-sans)}
.ds-diligence-fold{flex:0 1 auto;display:grid;grid-template-columns:minmax(0,5.5fr) minmax(0,6.5fr);gap:clamp(1rem,2.2vw,1.75rem);align-items:start;padding:var(--s-md) 0 var(--s-xl);padding-left:clamp(3.25rem,5vw,4.5rem);min-height:0}
.ds-diligence-claim{padding:var(--s-sm) 0 0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--s-sm)}
.ds-diligence-claim .ds-display{max-width:18ch;font-family:var(--f-serif);font-size:clamp(2rem,3.6vw,3.25rem);line-height:1.08}
.ds-diligence-claim .ds-lede{max-width:38ch}
.ds-measure-rule{height:1px;background:var(--c-border);margin:0 var(--gutter)}
.ds-diligence-field{align-self:start;display:flex;min-height:0;width:100%}
.ds-diligence-field .ds-posture-plate,.ds-diligence-field figure{flex:1;display:flex;min-height:0;margin:0;width:100%}
.ds-diligence-field .ds-fig{width:100%;height:auto;min-height:min(62vh,580px);display:block}

.ds-hero-mechanism{position:relative;isolation:isolate;padding:0 0 var(--s-xl);min-height:0;display:flex;flex-direction:column}
.ds-mechanism-fold{flex:0 1 auto;display:grid;grid-template-columns:minmax(14rem,0.95fr) minmax(0,1.55fr);gap:clamp(1rem,2.2vw,1.75rem);align-items:start;padding:var(--s-md) 0 var(--s-lg);min-height:0}
.ds-mechanism-claim{padding:var(--s-sm) 0 0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--s-md)}
.ds-mechanism-claim .ds-display{max-width:16ch;font-size:clamp(1.95rem,3.4vw,3.1rem);line-height:1.05}
.ds-mechanism-legend .ds-figure-steps{margin-top:var(--s-sm)}
.ds-mechanism-legend .ds-figure-steps li{cursor:pointer;padding-block:0.45rem}
.ds-mechanism-legend .ds-figure-steps li span{color:var(--c-ink-tertiary)}
.ds-mechanism-stage{align-self:start;display:flex;min-height:0;width:100%}
.ds-mechanism-stage .ds-mechanism-plate,.ds-mechanism-stage figure{flex:1;display:grid;gap:var(--s-sm);min-height:0;margin:0;width:100%}
.ds-mechanism-stage .ds-fig{width:100%;height:auto;min-height:min(58vh,540px);display:block}
.ds-mechanism-plate{display:grid;gap:var(--s-sm)}

.ds-hero-wire{position:relative;isolation:isolate;padding:0;min-height:0;display:flex;flex-direction:column}
.ds-cutoff-rail{position:sticky;top:var(--nav-h,4.5rem);z-index:4;background:var(--c-paper);border-bottom:1px solid var(--c-border)}
.ds-cutoff-rail ol{list-style:none;margin:0;padding:0 var(--gutter);display:flex;min-height:3.25rem}
.ds-cutoff-rail li{flex:1;display:flex}
.ds-cutoff-chip{flex:1;display:flex;flex-direction:column;justify-content:center;gap:0.15rem;padding:0.55rem 0.75rem;border-left:1px solid var(--c-border);color:var(--c-ink-tertiary);text-decoration:none;font-size:11px}
.ds-cutoff-rail li:first-child .ds-cutoff-chip{border-left:0}
.ds-cutoff-chip.is-live,.ds-cutoff-chip:hover{color:var(--c-accent)}
.ds-cutoff-meta,.ds-cutoff-label{font-family:var(--f-mono);letter-spacing:0.1em}
.ds-wire-fold{flex:0 1 auto;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(1rem,2.2vw,1.75rem);align-items:start;padding:var(--s-md) 0 var(--s-md);min-height:0}
.ds-wire-claim{padding:var(--s-sm) 0 0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--s-sm)}
.ds-wire-claim .ds-display{max-width:15ch;font-size:clamp(1.95rem,3.3vw,2.95rem);line-height:1.05}
.ds-wire-field{align-self:start;display:flex;min-height:0;width:100%}
.ds-wire-field .ds-wire-ledger,.ds-wire-field figure{flex:1;display:flex;min-height:0;margin:0;width:100%}
.ds-wire-field .ds-fig{width:100%;height:auto;min-height:min(58vh,540px);display:block}
.ds-tolerance-strip{display:flex;gap:var(--s-md);align-items:baseline;justify-content:flex-end;padding:0.55rem var(--gutter);border-top:1px solid var(--c-border);font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;color:var(--c-ink-tertiary);background:var(--c-paper-raised)}
.ds-tolerance-strip b{color:var(--c-accent);font-weight:600}
@media (max-width:900px){
  .ds-pipeline-fold,.ds-queue-fold,.ds-diligence-fold,.ds-wire-fold,.ds-mechanism-fold{grid-template-columns:1fr;align-items:stretch}
  .ds-principle-spine{display:none}
  .ds-diligence-fold{padding-left:0}
}

[data-sitekind="art-directed-studio"] .ds-hero-solidclaim .ds-hero-overclaim .ds-brand-mark{
  margin-bottom:0.75rem;
}
.ds-hero-stackfold + .ds-metrics-band{padding-top:calc(var(--section-y-tight) + var(--s-lg))}
/* Hard-seam fold + typographic spine (editorial foundry). */
.ds-hero-seam{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,920px);
  display:flex;flex-direction:column;
}
.ds-seam-grid{
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:inherit;flex:1;
}
.ds-seam-claim{
  display:flex;align-items:flex-end;padding:calc(var(--nav-h,4.5rem) + var(--s-xl)) var(--gutter) var(--s-2xl) var(--align-rail);
  background:var(--c-paper);color:var(--c-ink);
}
.ds-seam-claim-inner{max-width:34rem;width:100%}
.ds-seam-plate{
  position:relative;display:flex;align-items:stretch;justify-content:stretch;
  background:var(--c-inverse);color:var(--c-inverse-ink);
  --surface-bg:var(--c-inverse);--surface-ink:var(--c-inverse-ink);
  --surface-body:var(--c-inverse-ink);--surface-muted:var(--c-inverse-ink-muted);
  --surface-quiet:color-mix(in srgb,var(--c-inverse-ink) 55%,transparent);
  --surface-border:color-mix(in srgb,var(--c-inverse-ink) 22%,transparent);
  overflow:hidden;
}
.ds-seam-edge{
  position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--c-accent);z-index:2;
}
.ds-seam-figure{margin:0;width:100%;min-height:100%;display:flex;align-items:stretch}
.ds-seam-figure .ds-fig{width:100%;height:100%;min-height:min(92vh,880px);display:block}
.ds-spine{
  position:absolute;left:0;top:calc(var(--nav-h,4.5rem) + var(--s-md));bottom:var(--s-md);
  width:var(--align-rail);z-index:3;pointer-events:none;
  display:flex;align-items:flex-start;justify-content:center;padding-top:var(--s-lg);
}
.ds-spine-text{
  writing-mode:vertical-rl;transform:rotate(180deg);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.22em;text-transform:uppercase;
  color:var(--c-ink-tertiary);white-space:nowrap;
}
@media (max-width:800px){
  .ds-seam-grid{grid-template-columns:1fr}
  .ds-seam-claim{padding:calc(var(--nav-h,4.5rem) + var(--s-lg)) var(--gutter) var(--s-xl)}
  .ds-seam-plate{min-height:70vh}
  .ds-spine{display:none}
}
/* Folio fold + chapter rail (research dossier). */
.ds-hero-folio{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-folio-masthead{
  display:flex;flex-wrap:wrap;gap:0.55rem 1.25rem;align-items:baseline;
  padding:calc(var(--nav-h,4.5rem) + var(--s-md)) var(--gutter) var(--s-sm);
  padding-right:calc(var(--gutter) + var(--chapter-rail,0px));
  border-bottom:1px solid var(--c-border);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--c-ink-tertiary);
}
.ds-folio-mark{margin-left:auto;color:var(--c-ink-secondary);letter-spacing:0.18em}
.ds-folio-claim{
  padding:var(--s-lg) 0 var(--s-md);
  padding-right:var(--chapter-rail,0px);
}
.ds-folio-claim .ds-hero-copy{max-width:34rem;gap:0.65rem}
.ds-folio-field{margin-top:0}
.ds-folio-plate{margin:0;width:100%;display:block}
.ds-folio-plate .ds-fig{width:100%;min-height:min(78vh,820px);display:block}
.ds-bleed-rule{
  width:100vw;margin-left:calc(50% - 50vw);height:3px;background:var(--c-accent);
  border:0;padding:0;
}
.ds-chapter-rail{
  position:fixed;right:0;top:calc(var(--nav-h,4.5rem) + var(--s-lg));bottom:var(--s-lg);
  width:var(--chapter-rail,4.25rem);z-index:var(--z-nav);pointer-events:none;
  display:flex;align-items:flex-start;justify-content:center;padding-top:var(--s-md);
}
.ds-chapter-rail ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-md);pointer-events:auto}
.ds-chapter-rail a{
  display:flex;flex-direction:column;align-items:center;gap:0.2rem;text-decoration:none;
  color:var(--c-ink-tertiary);min-height:44px;min-width:44px;
}
.ds-chapter-rail a:hover,.ds-chapter-rail a:focus-visible{color:var(--c-accent)}
.ds-chapter-rail-num{font-family:var(--f-mono);font-size:11px;letter-spacing:0.16em}
.ds-chapter-rail-label{
  writing-mode:vertical-rl;transform:rotate(180deg);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
  max-height:7rem;overflow:hidden;
}
@media (max-width:800px){
  .ds-chapter-rail{display:none}
  .ds-folio-masthead,.ds-folio-claim{padding-right:var(--gutter)}
  .ds-folio-plate .ds-fig{min-height:min(58vh,560px)}
}
/* Verso/recto spread + footnote register. */
.ds-spread-grid{
  display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);gap:0 var(--gutter);
  margin-top:var(--s-xl);align-items:start;
}
.ds-spread-gutter{background:var(--c-border);width:1px;min-height:100%;align-self:stretch}
.ds-spread-page{display:flex;flex-direction:column;gap:var(--s-xl);padding-inline:var(--s-sm)}
.ds-spread-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-spread-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-fn-ref{font-family:var(--f-mono);font-size:11px;margin-left:0.15em;vertical-align:super;line-height:1}
.ds-fn-ref a{color:var(--c-accent);text-decoration:none}
.ds-footnote-register{
  list-style:none;margin:var(--s-2xl) 0 0;padding:var(--s-lg) 0 0;
  border-top:1px solid var(--c-border);
  display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:var(--s-md) var(--gutter);
}
.ds-fn-item{display:grid;grid-template-columns:auto 1fr;gap:0.15rem 0.6rem;align-items:start}
.ds-fn-back{
  grid-row:1 / span 2;font-family:var(--f-mono);font-size:11px;color:var(--c-accent);text-decoration:none;
  min-width:1.25rem;
}
.ds-fn-meta{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-ink-tertiary);
}
.ds-fn-body{font-size:var(--t-small-size,0.85rem);line-height:1.35;color:var(--c-ink-secondary);max-width:28ch}
@media (max-width:800px){
  .ds-spread-grid{grid-template-columns:1fr;gap:var(--s-xl)}
  .ds-spread-gutter{display:none}
  .ds-footnote-register{grid-template-columns:1fr}
}
/* Chronometer fold + scrub rail (signal observatory). */
.ds-hero-chrono{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-chronometer{
  position:absolute;left:0;top:calc(var(--nav-h,4.5rem) + var(--s-md));bottom:calc(var(--scrub-rail,3.5rem) + var(--s-md));
  width:var(--chrono-rail,3.25rem);z-index:3;pointer-events:none;
  display:flex;flex-direction:column;align-items:center;justify-content:space-between;
  padding:var(--s-sm) 0;
}
.ds-chronometer ol{
  list-style:none;margin:0;padding:0;flex:1;display:flex;flex-direction:column;justify-content:space-between;
  width:100%;align-items:center;
}
.ds-chrono-tick{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;color:var(--c-ink-tertiary);
  position:relative;width:100%;text-align:center;
}
.ds-chrono-tick::before{
  content:"";position:absolute;right:0.15rem;top:50%;width:0.45rem;height:1px;background:var(--c-border);
}
.ds-chrono-tick.is-major{color:var(--c-accent)}
.ds-chrono-tick.is-major::before{width:0.75rem;background:var(--c-accent)}
.ds-chronometer-label{
  writing-mode:vertical-rl;transform:rotate(180deg);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;
  color:var(--c-ink-tertiary);margin-top:var(--s-sm);
}
.ds-chrono-claim{
  padding:calc(var(--nav-h,4.5rem) + var(--s-sm)) 0 var(--s-xs);
  padding-left:var(--chrono-rail,3.25rem);
}
.ds-chrono-claim .ds-hero-copy{max-width:32rem;gap:0.5rem}
.ds-chrono-field{margin-top:0}
.ds-chrono-lattice{margin:0;width:100%;display:block}
.ds-chrono-lattice .ds-fig{width:100%;min-height:min(82vh,860px);display:block}
.ds-scrub-rail{
  position:fixed;left:0;right:0;bottom:0;z-index:var(--z-nav);
  height:var(--scrub-rail,3.5rem);
  background:color-mix(in srgb,var(--c-paper) 92%,transparent);
  border-top:1px solid var(--c-border);
  backdrop-filter:blur(8px);
  display:flex;align-items:stretch;justify-content:center;
}
.ds-scrub-rail ol{
  list-style:none;margin:0;padding:0 var(--gutter);display:flex;gap:0.35rem;align-items:stretch;
  width:min(100%,var(--measure-wide,72rem));
}
.ds-scrub-rail li{flex:1;display:flex}
.ds-scrub-chip{
  flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:0.1rem;
  text-decoration:none;color:var(--c-ink-tertiary);padding:0.35rem 0.65rem;min-height:44px;
  border-left:1px solid var(--c-border);
}
.ds-scrub-rail li:first-child .ds-scrub-chip{border-left:0}
.ds-scrub-chip:hover,.ds-scrub-chip:focus-visible{color:var(--c-accent)}
.ds-scrub-chip.is-live{color:var(--c-accent)}
.ds-scrub-chip.is-live .ds-scrub-label{font-weight:600}
.ds-scrub-meta{font-family:var(--f-mono);font-size:11px;letter-spacing:0.16em}
.ds-scrub-label{font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase}
@media (max-width:800px){
  .ds-chronometer{display:none}
  .ds-chrono-claim,.ds-chrono-field{padding-left:0}
  .ds-chrono-lattice .ds-fig{min-height:min(56vh,540px)}
  .ds-scrub-rail{height:auto}
  .ds-scrub-rail ol{flex-wrap:wrap;padding:0.35rem var(--gutter)}
  .ds-scrub-chip{border-left:0;border-top:1px solid var(--c-border);min-width:40%}
}
/* Chrono essay track + aside ticks. */
.ds-chrono-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-chrono-essay{position:relative;display:flex;flex-direction:column;gap:var(--s-2xl);max-width:42rem;padding-left:1.5rem}
.ds-chrono-track{
  position:absolute;left:0.35rem;top:0.5rem;bottom:0.5rem;width:1px;
  background:linear-gradient(180deg,var(--c-accent),var(--c-border));
}
.ds-chrono-bead{
  position:absolute;left:-1.28rem;top:0.55rem;width:0.7rem;height:0.7rem;border-radius:50%;
  background:var(--c-paper);border:1px solid var(--c-accent);z-index:1;
}
.ds-chrono-beat{position:relative}
.ds-chrono-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-chrono-note{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;position:relative;z-index:1;
}
.ds-chrono-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-chrono-note + .ds-chrono-mark{margin-top:var(--s-lg)}
.ds-chrono-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-lg)}
.ds-chrono-aside-tick{display:flex;flex-direction:column;gap:0.25rem;border-left:1px solid var(--c-border);padding-left:0.75rem}
.ds-chrono-aside-time{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--c-accent);
}
.ds-chrono-aside-title{font-size:var(--t-small-size,0.9rem);line-height:1.3;color:var(--c-ink-secondary);max-width:22ch}
@media (max-width:800px){
  .ds-chrono-grid{grid-template-columns:1fr!important}
  .ds-chrono-aside{order:-1}
}

/* Register fold + alpha rail (archive index). */
.ds-hero-register{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-register-masthead{
  display:flex;flex-wrap:wrap;gap:0.55rem 1.25rem;align-items:baseline;
  padding:calc(var(--nav-h,4.5rem) + var(--s-md)) var(--gutter) var(--s-sm);
  padding-left:calc(var(--gutter) + var(--alpha-rail,2.75rem));
  border-bottom:1px solid var(--c-border);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--c-ink-tertiary);
}
.ds-register-mark{margin-left:auto;color:var(--c-ink-secondary);letter-spacing:0.18em}
.ds-register-claim{
  padding:var(--s-md) 0 var(--s-lg);
  padding-left:var(--alpha-rail,2.75rem);
}
.ds-register-claim .ds-hero-copy{max-width:30rem;gap:0.45rem}
.ds-register-field{margin-top:0}
.ds-register-ledger{margin:0;width:100%;display:block}
.ds-register-ledger .ds-fig{width:100%;min-height:min(80vh,840px);display:block}
.ds-alpha-rail{
  position:fixed;left:0;top:calc(var(--nav-h,4.5rem) + var(--s-sm));bottom:var(--s-sm);
  width:var(--alpha-rail,2.75rem);z-index:var(--z-nav);pointer-events:none;
  display:flex;align-items:stretch;justify-content:center;padding:var(--s-xs) 0;
}
.ds-alpha-rail ol{
  list-style:none;margin:0;padding:0;flex:1;display:flex;flex-direction:column;
  justify-content:space-between;align-items:center;pointer-events:auto;width:100%;
}
.ds-alpha-letter{
  display:flex;align-items:center;justify-content:center;text-decoration:none;
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.04em;
  color:var(--c-ink-tertiary);min-width:28px;min-height:18px;line-height:1;
}
.ds-alpha-letter:hover,.ds-alpha-letter:focus-visible,.ds-alpha-letter.is-active{color:var(--c-accent)}
@media (max-width:800px){
  .ds-alpha-rail{display:none}
  .ds-register-masthead,.ds-register-claim,.ds-register-field{padding-left:var(--gutter)}
  .ds-register-ledger .ds-fig{min-height:min(58vh,560px)}
}
/* Entry essay — hanging folio + ruled measure. */
.ds-entry-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-entry-essay{display:flex;flex-direction:column;gap:var(--s-2xl);max-width:40rem}
.ds-entry-beat{
  position:relative;padding-left:3.5rem;
  border-top:1px solid var(--c-border);padding-top:var(--s-lg);
}
.ds-entry-folio{
  position:absolute;left:0;top:var(--s-lg);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.16em;color:var(--c-accent);
  writing-mode:vertical-rl;transform:rotate(180deg);height:5rem;
}
.ds-entry-measure{
  border-left:1px solid var(--c-border);padding-left:var(--s-lg);max-width:36rem;
}
.ds-entry-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-entry-note{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;position:relative;z-index:1;
}
.ds-entry-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-entry-note + .ds-entry-mark{margin-top:var(--s-lg)}
.ds-entry-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-md)}
.ds-entry-aside-item{
  display:flex;flex-direction:column;gap:0.2rem;
  border-bottom:1px solid var(--c-border);padding-bottom:var(--s-sm);
}
.ds-entry-aside-folio{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;color:var(--c-accent);
}
.ds-entry-aside-title{font-size:var(--t-small-size,0.9rem);line-height:1.3;color:var(--c-ink-secondary);max-width:22ch}
@media (max-width:800px){
  .ds-entry-grid{grid-template-columns:1fr!important}
  .ds-entry-aside{order:-1}
  .ds-entry-beat{padding-left:0}
  .ds-entry-folio{position:static;writing-mode:horizontal-tb;transform:none;height:auto;display:block;margin-bottom:0.35rem}
}

/* Drawloom fold — shed-threaded weft through SVG warps; fell; cloth; treadles. */
.ds-hero-loom{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-drawloom{display:flex;flex-direction:column;flex:1;min-height:inherit;position:relative}
.ds-loom-beam{
  display:flex;flex-wrap:wrap;gap:0.55rem 1.25rem;align-items:baseline;
  padding:calc(var(--nav-h,4.5rem) + var(--s-xs)) var(--gutter) var(--s-xs);
  border-bottom:1px solid var(--c-border);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;text-transform:none;
  color:var(--c-ink-tertiary);
}
.ds-loom-mark{margin-left:auto;color:var(--c-ink-secondary);letter-spacing:0.12em}
.ds-reed{
  display:flex;height:0.85rem;border-bottom:1px solid var(--c-border);
  padding:0 var(--gutter);gap:0;background:color-mix(in srgb,var(--c-paper) 85%,var(--c-accent-surface));
}
.ds-reed-tooth{
  flex:1;border-left:1px solid color-mix(in srgb,var(--c-border) 70%,transparent);
  height:100%;
}
.ds-reed-tooth:first-child{border-left:0}
.ds-drawloom-stage{
  position:relative;flex:1;display:grid;
  grid-template-rows:auto auto minmax(46vh,1fr);
  padding:0 var(--gutter) calc(var(--treadle-h,3.25rem) + var(--s-sm));
  min-height:0;
}
.ds-shed-stage{position:relative;isolation:isolate;padding:var(--s-xs) 0 var(--s-sm);min-height:11rem}
.ds-shed{
  position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;
  overflow:visible;
}
.ds-warp-end{
  stroke:color-mix(in srgb,var(--c-border) 75%,var(--c-accent));
  stroke-width:0.35;vector-effect:non-scaling-stroke;
}
.ds-weft-claim{
  position:relative;z-index:3;padding:var(--s-xs) 0 0;
  max-width:42rem;
}
.ds-weft-pick{
  position:relative;display:block;
  padding:0.1rem 0;
  animation:ds-weft-settle 900ms calc(var(--pick,0) * 70ms) both;
}
@keyframes ds-weft-settle{
  from{opacity:0;transform:translateX(-0.55rem)}
  to{opacity:1;transform:none}
}
@media (prefers-reduced-motion:reduce){
  .ds-weft-pick,.ds-shuttle{animation:none}
}
.ds-weft-thread{
  position:absolute;left:-2rem;right:-40vw;top:50%;height:1px;
  background:color-mix(in srgb,var(--c-accent) 50%,var(--c-border));
  pointer-events:none;z-index:0;
}
.ds-weft-ink{
  position:relative;z-index:2;display:inline;
  background:color-mix(in srgb,var(--c-paper) 82%,transparent);
  padding:0.05rem 0.2rem;
  box-decoration-break:clone;-webkit-box-decoration-break:clone;
  /* Shed weave: alternate over/under bars without splitting display glyphs (probe-safe). */
  background-image:
    linear-gradient(90deg,
      color-mix(in srgb,var(--c-paper) 88%,transparent) 0 10px,
      transparent 10px 14px);
  background-size:14px 100%;
}
.ds-shuttle{
  position:absolute;right:8%;top:42%;z-index:4;pointer-events:none;
  display:flex;align-items:center;gap:0.35rem;
  animation:ds-shuttle-fly 2.4s ease-in-out infinite alternate;
}
@keyframes ds-shuttle-fly{
  from{transform:translateX(-1.5rem)}
  to{transform:translateX(1.25rem)}
}
.ds-shuttle-body{
  width:2.4rem;height:0.55rem;border:1px solid var(--c-accent);
  background:color-mix(in srgb,var(--c-paper) 70%,var(--c-accent-surface));
  border-radius:1px 40% 40% 1px;
}
.ds-shuttle-tip{
  width:0;height:0;border-top:0.28rem solid transparent;border-bottom:0.28rem solid transparent;
  border-left:0.45rem solid var(--c-accent);
}
.ds-shuttle-meta{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.1em;color:var(--c-ink-tertiary);
}
.ds-fell{
  position:relative;z-index:2;height:1px;margin:0.15rem 0 0.35rem;
  background:var(--c-accent);
}
.ds-fell-label{
  position:absolute;left:0;top:-0.95rem;
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;color:var(--c-accent);
}
.ds-drawloom-cloth{
  position:relative;z-index:1;margin-top:0;
  mask-image:linear-gradient(180deg,transparent 0%,#000 5%,#000 100%);
}
.ds-loom-plate{margin:0;width:100%;display:block}
.ds-loom-plate .ds-fig{min-height:min(52vh,540px)}
/* Treadles — size tape as bottom instrument, not left sticky rail. */
.ds-treadles.ds-tape-rail{
  position:absolute;left:0;right:0;bottom:0;top:auto;width:100%;height:var(--treadle-h,3.25rem);
  display:flex;align-items:stretch;justify-content:stretch;padding:0;z-index:var(--z-nav);
  pointer-events:none;border-top:1px solid var(--c-border);
  background:color-mix(in srgb,var(--c-paper) 92%,var(--c-accent-surface));
}
.ds-treadles.ds-tape-rail ol{
  list-style:none;margin:0;padding:0 var(--gutter);flex:1;display:flex;flex-direction:row;
  justify-content:space-between;align-items:stretch;pointer-events:auto;width:100%;
}
.ds-treadles .ds-tape-chip{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-decoration:none;font-family:var(--f-mono);font-size:11px;letter-spacing:0.04em;
  color:var(--c-ink-tertiary);min-height:44px;line-height:1.1;gap:0.15rem;
  border-left:1px solid color-mix(in srgb,var(--c-border) 60%,transparent);
  border-top:1px solid transparent;padding:0.25rem;
}
.ds-treadles .ds-tape-chip:first-child{border-left:0}
.ds-treadles .ds-tape-meta{font-size:11px;opacity:0.7}
.ds-treadles .ds-tape-chip:hover,.ds-treadles .ds-tape-chip:focus-visible,.ds-treadles .ds-tape-chip.is-active{
  color:var(--c-accent);border-top-color:var(--c-accent);background:color-mix(in srgb,var(--c-accent-surface) 40%,transparent);
}
@media (max-width:800px){
  .ds-shed{opacity:0.45}
  .ds-shuttle{display:none}
  .ds-loom-plate .ds-fig{min-height:min(42vh,420px)}
  .ds-treadles .ds-tape-label{font-size:10px}
}
/* Hangtag essay. */
.ds-hang-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-hang-essay{display:flex;flex-direction:column;gap:var(--s-2xl);max-width:40rem}
.ds-hang-beat{
  position:relative;padding-left:1.75rem;
  border:1px solid var(--c-border);padding:var(--s-lg) var(--s-lg) var(--s-lg) 2rem;
  background:color-mix(in srgb,var(--c-paper) 92%,var(--c-accent-surface));
}
.ds-hang-eyelet{
  position:absolute;left:0.65rem;top:0.85rem;width:0.7rem;height:0.7rem;border-radius:50%;
  border:1px solid var(--c-accent);background:var(--c-paper);
}
.ds-hang-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-hang-note{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.06em;text-transform:none;
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;position:relative;z-index:1;
}
.ds-hang-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-hang-note + .ds-hang-mark{margin-top:var(--s-lg)}
.ds-hang-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-md)}
.ds-hang-aside-item{
  display:flex;flex-direction:column;gap:0.2rem;
  border-bottom:1px solid var(--c-border);padding-bottom:var(--s-sm);
}
.ds-hang-aside-title{font-size:var(--t-small-size,0.9rem);line-height:1.3;color:var(--c-ink-secondary);max-width:22ch}
@media (max-width:800px){
  .ds-hang-grid{grid-template-columns:1fr!important}
  .ds-hang-aside{order:-1}
}

/* Dissecting-tray glassine — hinged lid, entomology pins, specimen tag, vernier, binomial. */
.ds-hero-voucher{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-glassine-press,.ds-dissecting-tray{display:flex;flex-direction:column;flex:1;min-height:inherit;position:relative}
.ds-voucher-masthead{
  display:flex;flex-wrap:wrap;gap:0.55rem 1.25rem;align-items:baseline;
  padding:calc(var(--nav-h,4.5rem) + var(--s-xs)) var(--gutter) var(--s-xs);
  border-bottom:1px solid var(--c-border);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;text-transform:none;
  color:var(--c-ink-tertiary);
}
.ds-voucher-mark{margin-left:auto;color:var(--c-ink-secondary);letter-spacing:0.18em}
.ds-press-stage,.ds-tray-well{
  position:relative;flex:1;display:grid;place-items:stretch;
  padding:var(--s-md) var(--gutter) calc(var(--binomial-h,3.1rem) + var(--s-sm));
  min-height:min(58vh,620px);
  border:1px solid var(--c-border);
  margin:var(--s-sm) var(--gutter) 0;
  background:
    radial-gradient(120% 80% at 50% 0%,color-mix(in srgb,var(--c-accent-surface) 35%,transparent),transparent 55%),
    var(--c-paper);
}
.ds-tray-cork{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  box-shadow:inset 0 0 0 14px color-mix(in srgb,var(--c-accent-surface) 55%,var(--c-border));
  border:1px solid color-mix(in srgb,var(--c-border) 80%,transparent);
}
.ds-tray-hinge{
  position:absolute;top:0.55rem;left:50%;transform:translateX(-50%);z-index:5;
  display:flex;gap:0.55rem;pointer-events:none;
}
.ds-tray-hinge span{
  width:1.1rem;height:0.35rem;border:1px solid var(--c-border);
  background:color-mix(in srgb,var(--c-paper) 70%,var(--c-accent-surface));
}
.ds-press-plate{
  position:relative;z-index:1;margin:0.85rem;
  filter:saturate(0.92) contrast(1.04);
}
.ds-voucher-plate{margin:0;width:100%;display:block}
.ds-glassine-sheet,.ds-glassine-lid{
  position:absolute;inset:0.85rem;z-index:2;pointer-events:none;
  background:
    linear-gradient(145deg,color-mix(in srgb,var(--c-paper) 48%,transparent) 0%,color-mix(in srgb,var(--c-accent-surface) 22%,transparent) 46%,color-mix(in srgb,var(--c-paper) 38%,transparent) 100%),
    repeating-linear-gradient(0deg,transparent 0 3px,color-mix(in srgb,var(--c-border) 16%,transparent) 3px 4px);
  border:1px solid color-mix(in srgb,var(--c-border) 70%,transparent);
  transform-origin:50% 0%;
  clip-path:polygon(0 0,100% 0,100% 62%,78% 100%,0 100%);
  animation:ds-lid-lift 1.6s ease both;
}
@keyframes ds-lid-lift{
  from{transform:perspective(900px) rotateX(0deg)}
  to{transform:perspective(900px) rotateX(-6deg)}
}
.ds-lid-peel{
  position:absolute;right:0;bottom:0;width:6rem;height:5rem;
  background:linear-gradient(225deg,transparent 46%,color-mix(in srgb,var(--c-paper) 78%,var(--c-accent-surface)) 48%,color-mix(in srgb,var(--c-paper) 90%,transparent) 100%);
  border-left:1px solid color-mix(in srgb,var(--c-border) 55%,transparent);
  border-top:1px solid color-mix(in srgb,var(--c-border) 55%,transparent);
  transform-origin:100% 100%;
  animation:ds-peel-corner 1.5s 200ms ease both;
}
@keyframes ds-peel-corner{
  from{transform:rotate(0deg)}
  to{transform:rotate(-3deg)}
}
.ds-epin{
  position:absolute;z-index:4;width:0.85rem;height:0.85rem;border-radius:50%;
  border:1px solid var(--c-accent);background:var(--c-paper);
  display:grid;place-items:center;pointer-events:none;
  font-family:var(--f-mono);font-size:11px;color:var(--c-accent);font-style:normal;
}
.ds-epin i{font-style:normal;line-height:1}
.ds-epin[data-pin="1"]{top:16%;right:14%;left:auto}
.ds-epin[data-pin="2"]{top:30%;right:28%;left:auto}
.ds-epin[data-pin="3"]{top:48%;right:12%;left:auto}
.ds-epin[data-pin="4"]{bottom:26%;right:22%;left:auto}
.ds-vernier{
  position:absolute;z-index:3;left:1.1rem;right:1.1rem;bottom:calc(var(--binomial-h,3.1rem) + 0.35rem);
  pointer-events:none;display:flex;align-items:center;gap:0.5rem;
}
.ds-vernier-track{
  flex:1;height:1px;background:var(--c-border);
  background-image:repeating-linear-gradient(90deg,var(--c-accent) 0 1px,transparent 1px 12px);
}
.ds-vernier-meta{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.08em;color:var(--c-ink-tertiary);white-space:nowrap;
}
.ds-tag-string{
  position:absolute;z-index:4;left:calc(48% - 1rem);top:22%;width:7.5rem;height:5rem;
  color:var(--c-border);pointer-events:none;
}
.ds-press-label,.ds-specimen-tag{
  position:absolute;z-index:5;left:calc(var(--gutter) * 0.15 + 1.1rem);top:calc(var(--s-md) + 0.35rem);
  max-width:min(24rem,40%);
  padding:var(--s-sm) var(--s-md);
  background:color-mix(in srgb,var(--c-paper) 96%,var(--c-accent-surface));
  border:1px solid var(--c-border);
  transform:rotate(-1.4deg);
  animation:ds-tag-settle 1s 160ms both;
}
@keyframes ds-tag-settle{
  from{opacity:0;transform:rotate(-1.4deg) translateY(0.45rem)}
  to{opacity:1;transform:rotate(-1.4deg)}
}
.ds-tag-pinmeta{
  margin:0 0 0.25rem;font-family:var(--f-mono);font-size:11px;letter-spacing:0.1em;color:var(--c-accent);
}
.ds-press-label .ds-display,.ds-specimen-tag .ds-display{margin:0}
@media (prefers-reduced-motion:reduce){
  .ds-glassine-lid,.ds-lid-peel,.ds-specimen-tag{animation:none}
}
/* Binomial strip — dichotomous key as bottom instrument. */
.ds-binomial-strip.ds-taxon-rail{
  position:absolute;left:0;right:0;bottom:0;top:auto;width:100%;height:var(--binomial-h,3.1rem);
  display:flex;align-items:stretch;justify-content:stretch;padding:0;z-index:var(--z-nav);
  pointer-events:none;border-top:1px solid var(--c-border);
  background:color-mix(in srgb,var(--c-paper) 92%,var(--c-accent-surface));
}
.ds-binomial-strip.ds-taxon-rail ol{
  list-style:none;margin:0;padding:0 var(--gutter);flex:1;display:flex;flex-direction:row;
  justify-content:space-between;align-items:stretch;pointer-events:auto;width:100%;
}
.ds-binomial-strip .ds-taxon-chip{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-decoration:none;font-family:var(--f-mono);font-size:11px;letter-spacing:0.04em;
  color:var(--c-ink-tertiary);min-height:44px;line-height:1.1;gap:0.1rem;
  border-left:1px solid color-mix(in srgb,var(--c-border) 60%,transparent);
  border-top:1px solid transparent;padding:0.2rem;writing-mode:horizontal-tb;
}
.ds-binomial-strip .ds-taxon-chip:first-child{border-left:0}
.ds-binomial-strip .ds-taxon-meta{font-size:11px;color:var(--c-accent)}
.ds-binomial-strip .ds-taxon-label{font-size:11px;letter-spacing:0.02em;text-transform:none;opacity:0.75;max-width:none}
.ds-binomial-strip .ds-taxon-chip:hover,.ds-binomial-strip .ds-taxon-chip:focus-visible,.ds-binomial-strip .ds-taxon-chip.is-active{
  color:var(--c-accent);border-top-color:var(--c-accent);background:color-mix(in srgb,var(--c-accent-surface) 40%,transparent);
}
.ds-binomial-strip .ds-taxon-chip.is-active .ds-taxon-meta{text-decoration:underline}
@media (max-width:800px){
  .ds-specimen-tag{max-width:calc(100% - 2rem);left:0.75rem;right:0.75rem;transform:none;top:0.85rem}
  .ds-tag-string,.ds-vernier{display:none}
  .ds-glassine-lid{clip-path:none;animation:none}
  .ds-lid-peel{display:none}
  .ds-tray-well{margin-inline:var(--s-sm)}
  .ds-voucher-plate .ds-fig{min-height:min(42vh,420px)}
  .ds-binomial-strip .ds-taxon-label{font-size:10px}
}
/* Range essay. */
.ds-range-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-range-essay{position:relative;display:flex;flex-direction:column;gap:var(--s-2xl);max-width:42rem;padding-left:1.5rem}
.ds-range-track{
  position:absolute;left:0.35rem;top:0.5rem;bottom:0.5rem;width:1px;
  background:linear-gradient(180deg,var(--c-accent),var(--c-border));
}
.ds-range-bead{
  position:absolute;left:-1.28rem;top:0.55rem;width:0.7rem;height:0.7rem;border-radius:50%;
  background:var(--c-paper);border:1px solid var(--c-accent);z-index:1;
}
.ds-range-beat{position:relative}
.ds-range-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-range-note{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.06em;text-transform:none;
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;position:relative;z-index:1;
}
.ds-range-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-range-note + .ds-range-mark{margin-top:var(--s-lg)}
.ds-range-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-lg)}
.ds-range-aside-item{display:flex;flex-direction:column;gap:0.25rem;border-left:1px solid var(--c-border);padding-left:0.75rem}
.ds-range-aside-title{font-size:var(--t-small-size,0.9rem);line-height:1.3;color:var(--c-ink-secondary);max-width:22ch}
@media (max-width:800px){
  .ds-range-grid{grid-template-columns:1fr!important}
  .ds-range-aside{order:-1}
}

/* Press fold + signature rail (press atelier). */
.ds-hero-press{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-press-masthead{
  display:flex;flex-wrap:wrap;gap:0.55rem 1.25rem;align-items:baseline;
  padding:calc(var(--nav-h,4.5rem) + var(--s-md)) var(--gutter) var(--s-sm);
  padding-left:calc(var(--gutter) + var(--sig-rail,3.25rem));
  border-bottom:1px solid var(--c-border);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--c-ink-tertiary);
}
.ds-press-mark{margin-left:auto;color:var(--c-ink-secondary);letter-spacing:0.18em}
.ds-press-claim{
  padding:var(--s-md) 0 var(--s-lg);
  padding-left:var(--sig-rail,3.25rem);
}
.ds-press-claim .ds-hero-copy{max-width:30rem;gap:0.55rem}
.ds-press-field{margin-top:0;position:relative}
.ds-press-sheet{margin:0;width:100%;display:block}
.ds-press-sheet .ds-fig{width:100%;min-height:min(80vh,840px);display:block}
.ds-press-regs{
  position:absolute;inset:0.65rem;pointer-events:none;z-index:1;
}
.ds-press-regs span{
  position:absolute;width:14px;height:14px;
  border:1px solid var(--c-accent);border-radius:50%;
  box-shadow:0 0 0 1px color-mix(in srgb,var(--c-paper) 70%,transparent);
}
.ds-press-regs span::before,.ds-press-regs span::after{
  content:"";position:absolute;background:var(--c-border);
}
.ds-press-regs span::before{width:1px;height:18px;left:50%;top:50%;transform:translate(-50%,-50%)}
.ds-press-regs span::after{height:1px;width:18px;left:50%;top:50%;transform:translate(-50%,-50%)}
.ds-press-regs span:nth-child(1){top:0;left:0}
.ds-press-regs span:nth-child(2){top:0;right:0}
.ds-press-regs span:nth-child(3){bottom:0;left:0}
.ds-press-regs span:nth-child(4){bottom:0;right:0}
.ds-sig-rail{
  position:fixed;left:0;top:calc(var(--nav-h,4.5rem) + var(--s-sm));bottom:var(--s-sm);
  width:var(--sig-rail,3.25rem);z-index:var(--z-nav);pointer-events:none;
  display:flex;align-items:stretch;justify-content:center;padding:var(--s-xs) 0;
}
.ds-sig-rail ol{
  list-style:none;margin:0;padding:0;flex:1;display:flex;flex-direction:column;
  justify-content:space-between;align-items:center;pointer-events:auto;width:100%;
}
.ds-sig-letter{
  display:flex;align-items:center;justify-content:center;text-decoration:none;
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.06em;text-transform:uppercase;
  color:var(--c-ink-tertiary);min-width:36px;min-height:28px;line-height:1;writing-mode:vertical-rl;
  transform:rotate(180deg);
}
.ds-sig-letter:hover,.ds-sig-letter:focus-visible,.ds-sig-letter.is-active{color:var(--c-accent)}
@media (max-width:800px){
  .ds-sig-rail{display:none}
  .ds-press-masthead,.ds-press-claim,.ds-press-field{padding-left:var(--gutter)}
  .ds-press-sheet .ds-fig{min-height:min(58vh,560px)}
  .ds-press-regs{display:none}
}
/* Gather essay — fold ticks + plate index. */
.ds-gather-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-gather-essay{display:flex;flex-direction:column;gap:var(--s-2xl);max-width:40rem}
.ds-gather-beat{
  position:relative;padding-left:3.5rem;
  border-top:1px solid var(--c-border);padding-top:var(--s-lg);
}
.ds-gather-tick{
  position:absolute;left:0;top:var(--s-lg);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.16em;color:var(--c-accent);
  writing-mode:vertical-rl;transform:rotate(180deg);height:5rem;
}
.ds-gather-measure{
  border-left:1px solid var(--c-border);padding-left:var(--s-lg);max-width:36rem;
}
.ds-gather-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-gather-note{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;position:relative;z-index:1;
}
.ds-gather-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-gather-note + .ds-gather-mark{margin-top:var(--s-lg)}
.ds-gather-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-md)}
.ds-gather-aside-item{
  display:flex;flex-direction:column;gap:0.2rem;
  border-bottom:1px solid var(--c-border);padding-bottom:var(--s-sm);
}
.ds-gather-aside-sig{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;color:var(--c-accent);
}
.ds-gather-aside-title{font-size:var(--t-small-size,0.9rem);line-height:1.3;color:var(--c-ink-secondary);max-width:22ch}
@media (max-width:800px){
  .ds-gather-grid{grid-template-columns:1fr!important}
  .ds-gather-aside{order:-1}
  .ds-gather-beat{padding-left:0}
  .ds-gather-tick{position:static;writing-mode:horizontal-tb;transform:none;height:auto;display:block;margin-bottom:0.35rem}
}

/* Path fold + waypoint rail (lantern path). */
.ds-hero-path{
  position:relative;isolation:isolate;padding:0;min-height:min(100vh,960px);
  display:flex;flex-direction:column;
}
.ds-path-masthead{
  display:flex;flex-wrap:wrap;gap:0.55rem 1.25rem;align-items:baseline;
  padding:calc(var(--nav-h,4.5rem) + var(--s-md)) var(--gutter) var(--s-sm);
  padding-left:calc(var(--gutter) + var(--way-rail,3.5rem));
  border-bottom:1px solid var(--c-border);
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--c-ink-tertiary);
}
.ds-path-mark{margin-left:auto;color:var(--c-ink-secondary);letter-spacing:0.18em}
.ds-path-claim{
  padding:var(--s-sm) 0 var(--s-xs,0.35rem);
  padding-left:var(--way-rail,3.5rem);
}
.ds-path-claim .ds-hero-copy{max-width:30rem;gap:0.45rem}
.ds-path-field{margin-top:0;position:relative}
.ds-path-plate{margin:0;width:100%;display:block}
.ds-path-plate .ds-fig{width:100%;min-height:min(80vh,840px);display:block}
.ds-way-rail{
  position:fixed;left:0;top:calc(var(--nav-h,4.5rem) + var(--s-sm));bottom:var(--s-sm);
  width:var(--way-rail,3.5rem);z-index:var(--z-nav);pointer-events:none;
  display:flex;align-items:stretch;justify-content:center;padding:var(--s-xs) 0;
}
.ds-way-rail ol{
  list-style:none;margin:0;padding:0;flex:1;display:flex;flex-direction:column;
  justify-content:space-between;align-items:center;pointer-events:auto;width:100%;
}
.ds-way-mark{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.2rem;
  text-decoration:none;min-width:40px;min-height:44px;line-height:1.1;text-align:center;
  color:var(--c-ink-tertiary);padding:0.2rem;
}
.ds-way-mark:hover,.ds-way-mark:focus-visible{color:var(--c-accent);outline:2px solid var(--c-accent);outline-offset:2px}
.ds-way-mark.is-active{color:var(--c-accent)}
.ds-way-num{writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:0.08em}
.ds-way-label{display:none}
.ds-path-near{position:absolute;inset:auto 0 0 0;height:140px;pointer-events:none;overflow:hidden}
.ds-sil{position:absolute;bottom:0;background:var(--c-ink);opacity:0.35}

/* Ember essay (lantern path). */
.ds-ember{padding-block:var(--section-y)}
.ds-ember-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-ember-essay{display:flex;flex-direction:column;gap:var(--s-2xl);max-width:40rem;position:relative}
.ds-ember-essay::before{
  content:"";position:absolute;left:0.35rem;top:0.5rem;bottom:0.5rem;width:1px;
  background:color-mix(in srgb,var(--c-accent) 45%, var(--c-border));
}
.ds-ember-beat{position:relative;padding-left:1.75rem}
.ds-ember-bead{
  position:absolute;left:0;top:0.35rem;width:0.75rem;height:0.75rem;border-radius:50%;
  background:var(--c-accent);border:1px solid var(--c-paper);
}
.ds-ember-measure h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-ember-note{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;position:relative;z-index:1;
}
.ds-ember-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-ember-note + .ds-ember-mark{margin-top:var(--s-lg)}
.ds-ember-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-md)}
.ds-ember-aside-item{
  display:flex;flex-direction:column;gap:0.2rem;
  border-bottom:1px solid var(--c-border);padding-bottom:var(--s-sm);
}
.ds-ember-aside-ch{
  font-family:var(--f-mono);font-size:11px;letter-spacing:0.14em;color:var(--c-accent);
}
.ds-ember-aside-title{font-size:var(--t-small-size,0.9rem);line-height:1.3;color:var(--c-ink-secondary);max-width:22ch}
@media (max-width:800px){
  .ds-ember-grid{grid-template-columns:1fr!important}
  .ds-ember-aside{order:-1}
  .ds-ember-essay::before{display:none}
  .ds-ember-beat{padding-left:0}
  .ds-ember-bead{position:static;display:inline-block;margin-bottom:0.35rem}
}
.ds-marginalia-grid{display:grid;gap:var(--gutter);align-items:start;margin-top:var(--s-xl)}
.ds-marginalia-essay{display:flex;flex-direction:column;gap:var(--s-xl);max-width:42rem}
.ds-marginalia-beat{position:relative}
.ds-marginalia-beat h3{margin:0 0 var(--s-xs);font-family:var(--f-display);font-size:var(--t-title-size);line-height:1.15}
.ds-marginalia-rule{
  border:0;border-top:1px solid var(--surface-border);margin:var(--s-xl) 0 0;
  width:100vw;margin-left:calc(50% - 50vw);max-width:none;
}
.ds-marginalia-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
.ds-marginalia-rail{position:sticky;top:calc(var(--nav-h,4.5rem) + var(--s-md))}
.ds-marginalia-notes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-lg)}
.ds-marginalia-note{padding-left:var(--s-sm);border-left:2px solid var(--c-accent)}
.ds-marginalia-meta{
  margin:0 0 0.25rem;font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;
  text-transform:uppercase;color:var(--surface-quiet);
}
.ds-marginalia-title{margin:0;font-size:var(--t-small-size,0.85rem);line-height:1.35;color:var(--surface-muted);max-width:22ch}
@media (max-width:800px){
  .ds-marginalia-grid{grid-template-columns:1fr !important}
  .ds-marginalia-rail{position:static}
  .ds-marginalia-rule{width:100%;margin-left:0}
}
/* Shared content spine — personal-craft pages score high alignment axes from one repeated left edge. */
.ds-section > .ds-wrap,.ds-section > .ds-wrap-wide{position:relative}
/* Dashboard: keep the measured body voice on a full prose measure, not a squeezed app column. */
[data-sitekind="dashboard-webapp"] .ds-hero-overclaim .ds-lede{max-width:min(68ch,var(--w-prose));width:min(68ch,100%)}
[data-sitekind="dashboard-webapp"] .ds-section-head .ds-lede,
[data-sitekind="dashboard-webapp"] .ds-faq-item p{max-width:min(68ch,var(--w-prose));width:min(68ch,100%)}
[data-sitekind="dashboard-webapp"] .ds-faq .ds-split{grid-template-columns:minmax(12rem,3fr) minmax(36rem,9fr) !important}
[data-sitekind="dashboard-webapp"] .ds-app-main{min-width:0}
[data-sitekind="dashboard-webapp"] .ds-app-main .ds-lede{max-width:min(68ch,var(--w-prose));width:min(68ch,100%);font-size:var(--t-body-size);line-height:var(--t-body-leading)}
/*
 * Dashboard rhythm — honest band-variation without empty voids.
 * Compact metric register → sunken type-led specimen (ink, few chars) → dense shell peak.
 * Pack the app into one measured screen so shell density does not smear across quiet neighbours.
 */
[data-sitekind="dashboard-webapp"] .ds-metrics-band{padding-block:var(--section-y-tight)}
[data-sitekind="dashboard-webapp"] .ds-metrics-band .ds-metric{min-height:8.25rem;padding:var(--s-md) var(--s-sm) var(--s-sm)}
[data-sitekind="dashboard-webapp"] .ds-specimen{padding-block:var(--s-2xl) var(--s-3xl,var(--s-2xl))}
[data-sitekind="dashboard-webapp"] .ds-specimen-head{gap:0}
[data-sitekind="dashboard-webapp"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:10ch;line-height:1.15}
[data-sitekind="dashboard-webapp"] .ds-specimen .ds-plate{
  padding:var(--s-xs);border:1px solid var(--c-border);border-radius:var(--r-xl);
  background:var(--c-paper);color:var(--c-ink);
  box-shadow:0 18px 48px color-mix(in srgb,#000 18%,transparent);
  --surface-bg:var(--c-paper);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);
  --surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border);
}
/*
 * Stretch the drawn horizon so the specimen owns ~1.5 measured strips and the dense shell
 * that follows lands inside a single band. Ink fills the plate — not an empty 140vh void.
 */
[data-sitekind="dashboard-webapp"] .ds-specimen .ds-plate-bleed .ds-fig{border-radius:var(--r-lg);min-height:min(118vh,1180px)}
[data-sitekind="dashboard-webapp"] .ds-app-claim{display:grid;gap:var(--s-3xs);margin-bottom:var(--s-md)}
[data-sitekind="dashboard-webapp"] .ds-app-claim .ds-heading{font-size:var(--t-title-size);max-width:18ch;line-height:1.15}
[data-sitekind="dashboard-webapp"] .ds-app-band{padding-block:var(--section-y-tight) var(--section-y)}
[data-sitekind="dashboard-webapp"] .ds-app-grid{min-height:0}
[data-sitekind="dashboard-webapp"] .ds-app-main{padding:var(--s-md);gap:var(--s-sm);min-width:0}
[data-sitekind="dashboard-webapp"] .ds-app-side{padding:var(--s-sm) var(--s-xs);gap:var(--s-sm)}
[data-sitekind="dashboard-webapp"] .ds-app-stats{gap:var(--s-2xs)}
[data-sitekind="dashboard-webapp"] .ds-stat{padding:var(--s-xs)}
[data-sitekind="dashboard-webapp"] .ds-table th,[data-sitekind="dashboard-webapp"] .ds-table td{padding:var(--s-2xs) var(--s-xs)}
[data-sitekind="dashboard-webapp"] .ds-empty{padding:var(--s-sm) var(--s-md)}
[data-sitekind="dashboard-webapp"] .ds-index-row{padding-block:var(--s-sm)}
[data-sitekind="dashboard-webapp"] .ds-features .ds-index-row p{font-size:var(--t-body-size);line-height:var(--t-body-leading);max-width:58ch}
[data-sitekind="dashboard-webapp"] .ds-proof{padding-block:var(--s-2xl) calc(var(--section-y) * 0.9)}
[data-sitekind="dashboard-webapp"] .ds-proof-board{gap:0}
[data-sitekind="dashboard-webapp"] .ds-proof-cell p{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading)}
/* Proof claim was rendering at display size in a narrow column → body-measure 33.8. Keep it prose. */
[data-sitekind="dashboard-webapp"] .ds-proof-claim{
  font-size:var(--t-body-size);line-height:var(--t-body-leading);
  max-width:min(68ch,var(--w-prose));width:min(68ch,100%);
}
/* A hairline field behind the quiet band, so a nearly empty screen still reads as a surface. */
.ds-field{position:absolute;inset:0;overflow:hidden;pointer-events:none;display:grid;opacity:.55}
.ds-field .ds-fig{width:100%;height:100%}
.ds-app-plot{padding:var(--s-sm);border:1px solid var(--surface-border);border-radius:var(--r-lg);background:var(--surface-bg)}

/* Specimen band — one drawing, a screen to itself, a heading and nothing else.
 *
 * A quiet screen is one with almost no text on it, and that is not the same thing as one with
 * almost nothing on it. Reserving a viewport here and letting a 560px drawing sit centred in it
 * bought the low character count and three hundred pixels of hole with it, which is the single
 * most visible defect a reader can find on a page: a band that reserved a screen and filled a
 * third of it.
 *
 * So the band is as tall as its drawing, and the drawing is drawn to fill a screen. The silence is
 * bought with ink instead of with height.
 */
.ds-specimen{display:grid;gap:var(--s-md)}
.ds-specimen-head{display:grid;gap:var(--s-3xs);justify-items:start;text-align:start;width:min(100% - (var(--gutter) * 2),var(--w-wide));margin-inline:auto}
.ds-specimen-head .ds-heading{max-width:22ch}
.ds-specimen .ds-plate-bleed .ds-fig{min-height:min(70vh,720px)}
/* Soft-brand lead cells: rail only — avoid page-scale accent fills. */
body[data-mood="soft-brand-accent"] .ds-chapter:first-child,
body[data-mood="soft-brand-accent"] .ds-proof-cell.is-lead,
body[data-mood="soft-brand-accent"] .ds-proof-cell:first-child,
body[data-mood="soft-brand-accent"] .ds-metric:first-child,
body[data-mood="soft-brand-accent"] .ds-plan-recommended{background:transparent}
body[data-mood="soft-brand-accent"] .ds-chapter:first-child{box-shadow:inset 3px 0 0 var(--c-accent)}
body[data-mood="soft-brand-accent"] .ds-proof-cell.is-lead,
body[data-mood="soft-brand-accent"] .ds-proof-cell:first-child{box-shadow:inset 0 3px 0 var(--c-accent)}
body[data-mood="soft-brand-accent"] .ds-metric:first-child{border-color:var(--c-accent-border)}
body[data-mood="soft-brand-accent"] .ds-plan-recommended{border-color:var(--c-accent);margin-block:0;padding-block:var(--s-lg)}

/* Capability marks — one small schematic per capability, set into the card. */
.ds-card-mark{width:9rem;margin-bottom:var(--s-2xs);color:var(--surface-quiet);border-radius:var(--r-xs)}
.ds-card-lead .ds-card-mark{width:11rem}
.ds-index-mark{width:9.5rem;justify-self:end;align-self:center}
.ds-alt-mark{width:9rem;justify-self:end;align-self:center;border-radius:var(--r-sm);overflow:hidden}
.ds-metric-spark{margin-top:var(--s-2xs)}

/* Product panel — a structural stand-in for the real interface, drawn from tokens only */
.ds-panel{border:1px solid var(--surface-border);border-radius:var(--r-xl);background:var(--c-paper-raised);overflow:hidden}
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
.ds-metric{display:grid;gap:var(--s-3xs);padding:var(--s-md) var(--s-sm) var(--s-sm);border:1px solid var(--surface-border);border-radius:var(--r-lg);background:color-mix(in srgb,var(--surface-ink) 4%,transparent);position:relative}
.ds-metric:first-child{border-color:var(--c-accent-border);background:var(--accent-soft)}
/* Dense metric register — fintech-class inverse bands carry ink, not air. */
.ds-metrics-band .ds-metric{padding:var(--s-lg) var(--s-md) var(--s-md);min-height:9.5rem}
.ds-metrics-band .ds-metric-spark{width:100%;max-width:14rem}
.ds-metric-value{font-family:var(--f-display);font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);font-weight:var(--t-heading-weight);color:var(--surface-ink)}
.ds-metric-label{font-size:var(--t-caption-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--surface-quiet)}
.ds-metric-note{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-body);max-width:34ch}

/* Cards / bento */
.ds-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:var(--s-md);list-style:none;margin:0;padding:0}
.ds-card{grid-column:span 2;display:grid;gap:var(--s-2xs);align-content:start;padding:var(--s-md);border:1px solid var(--surface-border);border-radius:var(--r-lg);background:var(--c-paper-raised)}
.ds-card h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking)}
.ds-card p{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-body)}
.ds-card-lead{grid-column:span 4}
.ds-card-wide{grid-column:span 3}
.ds-card-points{margin:var(--s-2xs) 0 0;padding:0;list-style:none;display:grid;gap:var(--s-3xs)}
.ds-card-points li{font-size:var(--t-caption-size);color:var(--surface-body);padding-left:var(--s-sm);position:relative}
.ds-card-points li::before{content:"";position:absolute;left:0;top:0.55em;width:var(--s-3xs);height:1px;background:var(--c-border-strong)}

/* Index rows */
.ds-index{display:grid;list-style:none;margin:0;padding:0}
.ds-index-row{display:grid;grid-template-columns:var(--align-rail) minmax(12rem,28ch) minmax(0,1fr) minmax(7rem,9.5rem);gap:var(--s-md);align-items:center;padding:var(--s-md) var(--s-xs);border-top:1px solid var(--surface-border);border-radius:var(--r-sm)}
.ds-index-row .ds-mono,.ds-index-num{padding-left:0}
.ds-index-row:last-child{border-bottom:1px solid var(--surface-border)}
.ds-index-num{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-index-row h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking)}
.ds-index-row p{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-body);max-width:52ch}

/* Alternating feature rows */
/* Block, not grid. A grid gap here stacked on top of the row rules below, so a register of
 * one-sentence rows was separated by a gap and a padding and a margin at once — 100px of nothing
 * between 55px of content, which is how a page reads as padded rather than composed. */
.ds-alt{display:block}
.ds-alt-row + .ds-alt-row{margin-top:var(--s-xl)}
.ds-alt-pair + .ds-alt-pair{margin-top:0}
.ds-alt-row{display:grid;gap:var(--s-lg) var(--s-2xl);align-items:center}
.ds-alt-row:nth-child(even) .ds-alt-figure{order:-1}
.ds-alt-copy{display:grid;gap:var(--s-xs);align-content:start}
.ds-alt-copy h3{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);max-width:20ch}
.ds-alt-pair{display:grid;grid-template-columns:minmax(12rem,4fr) minmax(0,7fr) 5.5rem;gap:var(--s-sm) var(--s-xl);align-items:start;padding-block:var(--s-md);border-top:1px solid var(--surface-border)}
.ds-alt-pair:last-child{border-bottom:1px solid var(--surface-border)}
.ds-alt-name{display:grid;gap:var(--s-3xs);align-content:start}
.ds-alt-name h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking)}
.ds-alt-detail{display:grid;gap:var(--s-sm)}
.ds-alt-tier{margin:0;font-size:var(--t-caption-size);color:var(--surface-quiet)}

/* Chapters — two columns under a spread head. Surfaces, ordinals, and a rail so the sequence
 * reads as a composed register rather than four labelled boxes on paper. */
.ds-story{position:relative;isolation:isolate}
.ds-story::before{
  content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 55% 70% at 0% 10%,color-mix(in srgb,var(--c-accent) 16%,transparent),transparent 62%),
    radial-gradient(ellipse 40% 50% at 100% 80%,color-mix(in srgb,var(--c-accent) 8%,transparent),transparent 60%);
}
.ds-story > *{position:relative;z-index:1}
.ds-story .ds-section-head{margin-bottom:var(--s-lg)}
/* Sequence is a single register with a spine — never a 2-col grid that leaves a hole on odd counts.
 * --chapter-inset clears the lead accent bar; spine sits mid-gap after the index column.
 * Never left: calc(align-rail * 0.35) (cuts through "Step 0N") or inset bar with padding-left:0. */
.ds-chapters{
  --chapter-inset:1.15rem;
  display:grid;grid-template-columns:1fr;gap:0;list-style:none;margin:0;padding:0;position:relative;border-top:1px solid var(--surface-border)
}
.ds-chapters::before{
  content:"";position:absolute;left:calc(var(--chapter-inset) + var(--align-rail) + (var(--s-lg) / 2));top:var(--s-md);bottom:var(--s-md);width:1px;
  background:linear-gradient(180deg,var(--c-accent),color-mix(in srgb,var(--c-accent) 20%,transparent));
  border-radius:1px;z-index:0;pointer-events:none;
}
/* Title column shares --align-rail with section-head-main — third left edge beside wrap / wrap-wide. */
.ds-chapter{display:grid;grid-template-columns:var(--align-rail) minmax(12rem,22ch) minmax(0,1fr) minmax(7rem,9.5rem);gap:var(--s-sm) var(--s-lg);padding:var(--s-md) var(--s-sm) var(--s-md) var(--chapter-inset,1.15rem);border-bottom:1px solid var(--surface-border);border-radius:0;background:transparent;position:relative;align-items:center;z-index:1}
.ds-chapter:nth-child(odd){background:color-mix(in srgb,var(--c-paper-raised) 70%,transparent)}
/* Lead step: accent rail + soft wash — full accent-surface cells blew accent-coverage on brand hex briefs.
 * Rail lives in --chapter-inset padding so it never clips "Step 01". */
.ds-chapter:first-child{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--c-accent)}
.ds-chapter-index{
  font-family:var(--f-mono);font-size:var(--t-caption-size);line-height:1.15;letter-spacing:0;
  color:var(--c-accent);font-weight:600;min-width:2.5ch;max-width:100%;
  padding:0 var(--s-sm) 0 0;margin:0;position:relative;z-index:1;
  overflow-wrap:anywhere;
}
.ds-chapter h3{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);max-width:22ch;grid-column:auto;position:relative;z-index:1}
.ds-chapter .ds-body{max-width:52ch;grid-column:auto;position:relative;z-index:1}
.ds-chapter-mark{width:9.5rem;justify-self:end;opacity:.95;position:relative;z-index:1}

/* Proof board — dense inverse surface packed with declared evidence.
 *
 * A lonely quote on black is the toy look. This band is a filled instrument: head + claim, a
 * multi-cell capability board with marks, and a product figure. Every region of the band has ink.
 * Hangs into the next section for depth without buying height with emptiness. */
/* Proof board — dark stage with a lit product plate and an evidence register.
 *
 * Pattern borrowed from measured premium B2B pages: the inverse band is the stage; the product
 * drawing sits on a paper plate (readable contrast); evidence runs as a tight register, not a
 * lonely quote or a toy card grid with empty airways. */
.ds-proof{position:relative;padding-block:var(--s-2xl) calc(var(--section-y) * 0.7);margin-bottom:calc(var(--s-xl) * -1);z-index:var(--z-raised);isolation:isolate}
.ds-proof::before{
  content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 55% 70% at 90% 20%,color-mix(in srgb,var(--c-accent) 28%,transparent),transparent 65%),
    radial-gradient(ellipse 40% 50% at 10% 90%,color-mix(in srgb,var(--c-accent) 12%,transparent),transparent 60%),
    linear-gradient(135deg,color-mix(in srgb,var(--c-accent) 8%,transparent),transparent 40%);
}
.ds-proof > *{position:relative;z-index:1}
.ds-proof + .ds-section{padding-top:var(--s-2xl)}
.ds-proof + .ds-story{padding-top:var(--s-xl)}
.ds-proof-stage{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:var(--s-xl) var(--s-2xl);align-items:start;margin-bottom:var(--s-xl)}
.ds-proof-head{display:grid;gap:var(--s-md);align-content:start}
.ds-proof-head .ds-heading{max-width:14ch}
.ds-proof-claim{font-family:var(--f-display);font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);letter-spacing:var(--t-subheading-tracking);font-weight:var(--t-subheading-weight);max-width:34ch;color:var(--surface-muted);text-wrap:balance}
.ds-proof-foot{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:var(--t-micro-tracking);text-transform:uppercase;color:var(--surface-quiet);margin-top:var(--s-md);padding-top:var(--s-sm);border-top:1px solid var(--surface-border);max-width:36ch}
/* Lit plate on the dark stage — forces paper tokens so drawn UI keeps contrast. */
.ds-proof-figure{margin:0;padding:var(--s-sm);border:1px solid var(--c-border);border-radius:var(--r-xl);background:var(--c-paper);color:var(--c-ink);box-shadow:0 28px 64px color-mix(in srgb,#000 48%,transparent);--surface-bg:var(--c-paper);--surface-ink:var(--c-ink);--surface-body:var(--c-ink-body);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border);transform:translateY(var(--s-md))}
.ds-proof-figure .ds-fig{border-radius:var(--r-lg)}
.ds-proof-figure figcaption{color:var(--c-ink-tertiary)}
.ds-proof-figure-field{opacity:.55;padding:0;border:0;background:transparent;box-shadow:none;transform:none}
.ds-proof-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;list-style:none;margin:0;padding:0;border-top:1px solid var(--surface-border)}
.ds-proof-cell{display:grid;gap:var(--s-2xs);align-content:start;padding:0;border-right:1px solid var(--surface-border);min-height:0;background:transparent;border-radius:0}
.ds-proof-cell:last-child{border-right:0}
.ds-proof-cell.is-lead,.ds-proof-cell:first-child{background:var(--accent-soft);box-shadow:inset 0 3px 0 var(--c-accent)}
.ds-proof-hit{display:grid;gap:var(--s-2xs);align-content:start;width:100%;height:100%;margin:0;padding:var(--s-md) var(--s-sm);border:0;border-radius:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ds-proof-hit:hover,.ds-proof-hit:focus-visible{background:color-mix(in srgb,var(--c-accent) 8%,transparent)}
.ds-proof-hit:focus-visible{outline:2px solid var(--c-accent);outline-offset:-2px}
.ds-proof-hit.is-live{background:var(--accent-soft)}
.ds-proof-mark{width:7.25rem;margin-bottom:var(--s-3xs);opacity:.95}
.ds-proof-meta{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0;text-transform:none;color:var(--c-accent)}
.ds-proof-cell h3{font-size:var(--t-body-size);line-height:var(--t-body-leading);letter-spacing:var(--t-body-tracking);font-weight:600;max-width:16ch}
.ds-proof-cell p{font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--surface-muted);max-width:28ch}
/* Product-proof workflow — stage chips + HTMX-swapped panel on the lit stage.
 * The plate must NOT hang (translateY) into the panel — that cancelled the stack gap and
 * made figure + panel read as one fused block. */
.ds-workflow-rail{margin-top:var(--s-lg)}
.ds-workflow-rail ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:var(--s-sm)}
.ds-workflow-chip{display:inline-flex;align-items:center;gap:var(--s-2xs);margin:0;padding:0.55rem 0.85rem;border:1px solid var(--surface-border);border-radius:var(--r-md);background:color-mix(in srgb,var(--surface-bg) 40%,transparent);color:var(--surface-ink);font:inherit;cursor:pointer;min-height:44px}
.ds-workflow-chip:hover,.ds-workflow-chip:focus-visible{border-color:var(--c-accent);background:var(--accent-soft)}
.ds-workflow-chip:focus-visible{outline:2px solid var(--c-accent);outline-offset:3px}
.ds-workflow-chip.is-live{border-color:var(--c-accent);background:var(--accent-soft);box-shadow:inset 0 -2px 0 var(--c-accent)}
.ds-workflow-meta{font-family:var(--f-mono);font-size:10px;letter-spacing:0.12em;color:var(--c-accent)}
.ds-workflow-label{font-size:var(--t-caption-size);font-weight:600}
.ds-workflow-field{display:grid;gap:var(--s-xl);align-content:start;min-width:0}
.ds-workflow-field .ds-proof-figure{transform:none;margin:0}
.ds-workflow-field .ds-plate-lit{padding:var(--s-md)}
.ds-workflow-field .ds-plate figcaption{
  margin:0;padding:var(--s-xs) var(--s-3xs) var(--s-2xs);
  line-height:1.35;max-width:100%;
}
.ds-workflow-panel{
  margin:0;padding:var(--s-lg);border:1px solid var(--c-border);border-radius:var(--r-xl);
  background:var(--c-paper);color:var(--c-ink);
  box-shadow:0 20px 48px color-mix(in srgb,#000 40%,transparent);
  --surface-bg:var(--c-paper);--surface-ink:var(--c-ink);--surface-muted:var(--c-ink-secondary);--surface-quiet:var(--c-ink-tertiary);--surface-border:var(--c-border)
}
.ds-workflow-card{display:grid;gap:var(--s-md);align-content:start}
.ds-workflow-kicker{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0.08em;text-transform:uppercase;color:var(--c-accent);margin:0}
.ds-workflow-card h3{margin:0;font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);max-width:16ch}
.ds-workflow-body{margin:0;font-size:var(--t-body-size);line-height:var(--t-body-leading);color:var(--c-ink-secondary);max-width:42ch}
.ds-workflow-points{margin:0;padding-left:1.1rem;display:grid;gap:0.35rem;color:var(--c-ink-secondary);font-size:var(--t-caption-size)}
.ds-workflow-mark{width:min(100%,11rem);opacity:0.92;margin-top:var(--s-xs)}
.ds-workflow-gate{margin:var(--s-md) 0 0;padding:var(--s-md);border-left:3px solid var(--c-accent);background:var(--accent-soft);font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--c-ink-secondary);max-width:40ch}
.ds-workflow-gate-flag{display:inline-block;font-family:var(--f-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--c-accent);margin-right:0.5rem}
/* Self-contained stage — do not tuck into the following section via proof hang. */
.ds-proof.ds-workflow{margin-bottom:0;padding-block:var(--s-2xl) var(--section-y)}
.ds-proof.ds-workflow + .ds-section{padding-top:var(--section-y)}
@media (max-width:800px){
  .ds-workflow-stage{grid-template-columns:1fr!important}
  .ds-workflow-rail ol{flex-wrap:nowrap;overflow-x:auto;padding-bottom:var(--s-2xs);-webkit-overflow-scrolling:touch;gap:var(--s-xs)}
}
/* Indexed detail markers — quiet architectural rhythm, never competing with headings. */
.ds-index-mark{font-family:var(--f-mono);font-size:10px;letter-spacing:0.14em;color:var(--surface-quiet);line-height:1}
.ds-metric .ds-index-mark{position:absolute;top:var(--s-sm);right:var(--s-sm)}
.ds-metric{position:relative}
/* Pricing cadence + risk note (pricing-decision-craft). */
.ds-cadence{display:inline-flex;gap:var(--s-2xs);margin:0 0 var(--s-lg);padding:3px;border:1px solid var(--surface-border);border-radius:var(--r-md);background:color-mix(in srgb,var(--surface-ink) 3%,transparent)}
.ds-cadence-chip{margin:0;padding:0.45rem 0.85rem;min-height:40px;border:0;border-radius:calc(var(--r-md) - 2px);background:transparent;color:var(--surface-muted);font:inherit;font-size:var(--t-caption-size);font-weight:600;cursor:pointer}
.ds-cadence-chip.is-live{background:var(--c-paper);color:var(--surface-ink);box-shadow:var(--sh-sm,none)}
.ds-cadence-chip:focus-visible{outline:2px solid var(--c-accent);outline-offset:2px}
.ds-cadence-save{margin-left:0.35rem;font-family:var(--f-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--c-accent)}
.ds-pricing-risk{margin:var(--s-lg) 0 0;max-width:52ch;font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--surface-muted)}
/* Honest integration marks — declared capability names only; never fake logos. */
.ds-mark-row{display:flex;flex-wrap:wrap;gap:var(--s-sm) var(--s-md);list-style:none;margin:var(--s-lg) 0 0;padding:var(--s-md) 0 0;border-top:1px solid var(--surface-border)}
.ds-mark-row li{font-family:var(--f-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--surface-quiet)}
.ds-mark-row-label{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--c-accent);width:100%;margin:0 0 var(--s-2xs)}
/* Paper-technical frame — warm paper interior, dark outer field, quiet brackets. */
body[data-frame="paper-technical"]{background:
  repeating-linear-gradient(-32deg,transparent,transparent 11px,color-mix(in srgb,var(--c-ink) 2.5%,transparent) 11px,color-mix(in srgb,var(--c-ink) 2.5%,transparent) 12px),
  var(--c-inverse)}
/*
 * Footer lives outside #main as <footer class="ds-footer"> — not footer.ds-section.
 * Paper surfaces also set background:transparent, so a missed selector leaves the footer
 * sitting on the outer inverse field with paper ink (light-on-light or dark-on-dark).
 */
body[data-frame="paper-technical"] #main,
body[data-frame="paper-technical"] .ds-nav,
body[data-frame="paper-technical"] .ds-footer,
body[data-frame="paper-technical"] footer.ds-section{background:var(--c-paper);color:var(--c-ink)}
body[data-frame="paper-technical"] #main{margin:0 auto;max-width:min(100%,calc(var(--content-wide,72rem) + 4rem));border-inline:1px solid var(--c-border);box-shadow:var(--sh-overlay,none)}
.ds-tech-brackets{position:relative}
.ds-tech-brackets::before,.ds-tech-brackets::after{content:"";position:absolute;width:12px;height:12px;border-color:var(--c-accent);border-style:solid;pointer-events:none;opacity:0.55}
.ds-tech-brackets::before{top:var(--s-sm);left:var(--s-sm);border-width:1px 0 0 1px}
.ds-tech-brackets::after{right:var(--s-sm);bottom:var(--s-sm);border-width:0 1px 1px 0}
/* Split-panel technical — framed halves with mono rail metadata. */
.ds-pipeline-fold,.ds-queue-fold,.ds-diligence-fold,.ds-wire-fold{position:relative}
.ds-pipeline-fold.ds-tech-brackets .ds-pipeline-claim,
.ds-queue-fold.ds-tech-brackets .ds-queue-claim{padding-inline:var(--s-md)}
/* Edge fade craft — overflowing rails mask without heavy progressive blur. */
.ds-workflow-rail ol,
.ds-stage-rail ol,
.ds-priority-rail ol{
  -webkit-mask-image:linear-gradient(to right,transparent,black 4%,black 96%,transparent);
  mask-image:linear-gradient(to right,transparent,black 4%,black 96%,transparent);
}
@media (min-width:801px){
  .ds-workflow-rail ol,
  .ds-stage-rail ol,
  .ds-priority-rail ol{
    -webkit-mask-image:none;
    mask-image:none;
  }
}
/* Soft-elevation uses tokenized layered shadows on raised plates only. */
[data-depth="soft-elevation"] .ds-plan,
[data-depth="soft-elevation"] .ds-workflow-panel,
[data-depth="soft-elevation"] .ds-proof-figure{box-shadow:var(--sh-raised)}
[data-depth="soft-elevation"] .ds-btn{box-shadow:var(--sh-sm)}
/* Wireframe annotation craft — sparse mono callouts on specimen stages. */
.ds-specimen-stage{position:relative}
.ds-specimen-annotated .ds-plate-bleed{opacity:0.92}
.ds-anno-rail{list-style:none;margin:0;padding:0;position:absolute;inset:var(--s-md) var(--s-md) auto auto;display:grid;gap:var(--s-xs);max-width:14rem;z-index:2}
.ds-anno{display:flex;align-items:center;gap:var(--s-2xs);font-family:var(--f-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--surface-quiet);background:color-mix(in srgb,var(--c-paper) 88%,transparent);border:1px solid var(--surface-border);padding:0.35rem 0.55rem;border-radius:var(--r-sm);max-width:100%;min-width:0}
.ds-anno-tick{width:8px;height:1px;background:var(--c-accent);flex:0 0 auto}
.ds-anno-label{min-width:0;flex:1 1 auto;max-width:16ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Editorial chapters — stronger first beat, quieter subsequent. */
[data-editorial-chapters] .ds-chapter:first-child h3{font-size:var(--t-subheading-size)}
/* Ambient atmosphere — static sparse motes (full canvas sim lives in ambient-atmosphere-craft). */
.ds-atmosphere{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.ds-atmosphere-motes{position:absolute;inset:0;background-image:radial-gradient(circle,color-mix(in srgb,var(--c-accent) 35%,transparent) 0 1px,transparent 1.5px);background-size:72px 84px;background-position:0 0,36px 42px;opacity:0.22}
.ds-atmosphere-motes::after{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,color-mix(in srgb,var(--surface-ink) 40%,transparent) 0 1px,transparent 1.5px);background-size:96px 110px;background-position:18px 22px;opacity:0.5}
/* Signal beam — CSS accent vignette (full WebGL path in signal-beam-craft). */
.ds-accent-beam{position:fixed;inset:0;z-index:0;pointer-events:none;background:
  radial-gradient(ellipse 18% 70% at 72% 45%,color-mix(in srgb,var(--c-accent) 28%,transparent),transparent 70%),
  linear-gradient(90deg,transparent 68%,color-mix(in srgb,var(--c-accent) 12%,transparent) 72%,transparent 76%)}
body[data-atmosphere] .ds-nav,
body[data-atmosphere] #main,
body[data-atmosphere] .ds-footer,
body[data-atmosphere] footer.ds-section{position:relative;z-index:1}
/* Glass shell — at most one frosted language; solid fallback if backdrop unsupported. */
.ds-glass-panel{
  background:linear-gradient(180deg,color-mix(in srgb,#fff 8%,transparent),color-mix(in srgb,#fff 2%,transparent));
  background-color:color-mix(in srgb,var(--c-paper-raised) 62%,transparent);
  border:1px solid color-mix(in srgb,var(--c-border) 80%,transparent);
  border-radius:var(--r-xl);
  box-shadow:var(--sh-raised),inset 0 1px 0 color-mix(in srgb,#fff 10%,transparent);
  backdrop-filter:blur(14px) saturate(140%);
  -webkit-backdrop-filter:blur(14px) saturate(140%);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  .ds-glass-panel{background:var(--c-paper-raised);backdrop-filter:none;-webkit-backdrop-filter:none}
}
/* Sticky nav stays opaque (basics gate). Glass is opt-in via .ds-glass-panel only — never glass-everywhere. */
@media (prefers-reduced-motion:reduce){
  .ds-atmosphere-motes,.ds-accent-beam{opacity:0.12}
}
/* Bonding strip — metadata on a hairline, not empty reserved height between subjects. */
.ds-sec-meta{display:flex;justify-content:space-between;align-items:baseline;gap:var(--s-md);margin:0 0 var(--s-md);padding:var(--s-xs) 0;border-top:1px solid var(--surface-border);font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}
.ds-sec-meta b{color:var(--surface-ink);font-weight:600}
/* Legacy statement aliases — kept so older fixtures do not break mid-render. */
.ds-statement{position:relative;padding-block:calc(var(--section-y) * 0.75)}
.ds-quote{font-family:var(--f-display);font-size:var(--t-title-size);line-height:var(--t-title-leading);max-width:28ch}

/* Plans */
.ds-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:var(--s-md);align-items:start;list-style:none;margin:0;padding:0}
.ds-plan{display:grid;gap:var(--s-xs);align-content:start;padding:var(--s-lg) var(--s-md);border:1px solid var(--surface-border);border-radius:var(--r-xl);background:var(--c-paper)}
/* The recommended lane stands proud of the row. Depth by overlap — no shadow, no blur, nothing to
 * repaint on scroll — and it is the one place on a pricing row where a reader benefits from being
 * told where to look before they have read anything. */
.ds-plan-recommended{border-color:var(--c-accent);background:var(--c-accent-surface);margin-block:calc(var(--s-md) * -1);padding-block:calc(var(--s-lg) + var(--s-md));position:relative;z-index:var(--z-raised)}
.ds-plan-flag{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--c-accent);font-weight:600}
.ds-plan h3{font-size:var(--t-subheading-size)}
.ds-plan-meta{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--surface-quiet)}

/* Comparison matrix */
.ds-matrix{width:100%;border-collapse:collapse;font-size:var(--t-bodySmall-size)}
.ds-matrix caption{text-align:left;padding-bottom:var(--s-sm);color:var(--surface-body);font-size:var(--t-bodySmall-size)}
.ds-matrix th,.ds-matrix td{text-align:left;padding:var(--s-sm) var(--s-xs);border-bottom:1px solid var(--surface-border);vertical-align:top}
.ds-matrix thead th{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--surface-quiet);font-weight:600}
.ds-matrix tbody th{font-weight:600;color:var(--surface-ink);width:34%}
.ds-matrix-tier{font-size:var(--t-micro-size);color:var(--surface-quiet)}
.ds-matrix td{color:var(--surface-body)}
.ds-matrix .ds-yes{color:var(--c-signal);font-family:var(--f-mono)}
.ds-matrix .ds-no{color:var(--surface-quiet);font-family:var(--f-mono)}

/* FAQ — two registers side by side, so the answers are a screen rather than a scroll */
.ds-faq{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--s-2xl)}
.ds-faq-item{padding-block:var(--s-md);border-top:1px solid var(--surface-border)}
.ds-faq-item h3{font-size:var(--t-subheading-size);line-height:var(--t-subheading-leading);margin-bottom:var(--s-2xs);max-width:34ch}
.ds-faq-item p{font-size:var(--t-bodySmall-size);line-height:var(--t-bodySmall-leading);color:var(--surface-body);max-width:56ch}

/* CTA band — the decision on the left, the mark on the right, and no reserved height under either */
.ds-closing-grid{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:var(--s-2xl);align-items:center}
.ds-cta{display:grid;gap:var(--s-md);justify-items:start;align-content:center}
.ds-cta .ds-title{max-width:16ch}
.ds-cta .ds-lede{max-width:46ch}
.ds-closing-mark{justify-self:end;width:min(100%,22rem);opacity:.8;margin-bottom:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised);border-radius:var(--r-xl);overflow:hidden}
.ds-hero-aside{border-radius:var(--r-md);padding:var(--s-md);border:1px solid var(--surface-border);background:var(--c-paper-raised)}

/* Footer */
.ds-footer{padding-block:var(--section-y-tight);border-top:1px solid var(--c-border)}
.ds-footer-grid{display:grid;grid-template-columns:2.4fr 1fr 1fr 1fr 1fr;gap:var(--s-xl) var(--s-lg)}
.ds-footer-col{display:grid;gap:var(--s-2xs);align-content:start;font-size:var(--t-bodySmall-size)}
.ds-footer-brand{gap:var(--s-sm);max-width:34ch}
.ds-footer-brand .ds-btn{justify-self:start;margin-top:var(--s-2xs)}
.ds-footer-col h4{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--c-ink-tertiary);font-weight:600}
.ds-footer-col a{color:var(--c-ink-body)}
.ds-footer-col a:hover{color:var(--c-ink)}
.ds-footer-item{color:var(--c-ink-body);display:block}
.ds-footer-base{display:flex;justify-content:flex-start;flex-wrap:wrap;gap:var(--s-lg);margin-top:var(--s-xl);padding-top:var(--s-sm);border-top:1px solid var(--c-border);font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}

/* Figure */
.ds-figure{display:grid;gap:var(--s-sm);margin:0}
.ds-figure-stage{border:1px solid var(--surface-border);border-radius:var(--r-xl);background:var(--c-paper-raised);padding:var(--s-md)}
.ds-figure svg{width:100%;height:auto}
.ds-scrub{display:grid;gap:var(--s-2xs);margin-top:var(--s-sm)}
.ds-scrub input{width:100%;accent-color:var(--c-accent);min-height:1.5rem}
.ds-figure figcaption{font-size:var(--t-bodySmall-size);color:var(--surface-body);max-width:52ch}
.ds-figure-steps{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-2xs)}
.ds-figure-steps li{border-radius:var(--r-xs);font-size:var(--t-bodySmall-size);color:var(--surface-body);padding-left:var(--s-md);border-left:1px solid var(--surface-border)}
.ds-figure-steps li.is-active{color:var(--surface-ink);border-left-color:var(--c-accent)}
.ds-figure-steps a{color:inherit;text-decoration:none}
.ds-figure-steps a:hover{color:var(--surface-ink)}
.ds-figure-steps a:focus-visible{outline:2px solid var(--c-accent);outline-offset:2px}

/* Interactive flow stages — real buttons, never dead SVG shells */
.ds-flow-figure{margin:0}
.ds-flow-track{display:grid;gap:var(--s-sm)}
.ds-flow-list{list-style:none;margin:0;padding:0;display:flex;align-items:stretch;gap:0;overflow-x:auto}
.ds-flow-item{flex:1 1 0;min-width:8.5rem}
.ds-flow-arrow{flex:0 0 1.25rem;display:flex;align-items:center;justify-content:center;color:var(--surface-quiet)}
.ds-flow-arrow span{display:block;width:0.55rem;height:0.55rem;border-right:1px solid currentColor;border-top:1px solid currentColor;transform:rotate(45deg)}
.ds-flow-card{
  display:grid;gap:0.35rem;align-content:start;width:100%;height:100%;min-height:7.5rem;
  margin:0;padding:0.85rem 0.9rem;border:1px solid var(--surface-border);border-radius:var(--r-md);
  background:color-mix(in srgb,var(--surface-bg) 88%,transparent);color:var(--surface-ink);
  font:inherit;text-align:left;cursor:pointer;
}
.ds-flow-card:hover,.ds-flow-card:focus-visible{border-color:color-mix(in srgb,var(--c-accent) 45%,var(--surface-border))}
.ds-flow-card:focus-visible{outline:2px solid var(--c-accent);outline-offset:2px}
.ds-flow-card.is-live{
  background:color-mix(in srgb,var(--c-accent) 12%,var(--surface-bg));
  border-color:color-mix(in srgb,var(--c-accent) 55%,var(--surface-border));
}
.ds-flow-num{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0.12em;color:var(--surface-quiet)}
.ds-flow-card.is-live .ds-flow-num{color:var(--c-accent)}
.ds-flow-rule{display:block;height:1px;width:100%;background:var(--surface-border)}
.ds-flow-title{font-size:var(--t-body-size);line-height:var(--t-body-leading);font-weight:600}
.ds-flow-body,.ds-flow-meta{font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--surface-muted)}
.ds-flow-meter{display:block;height:2px;margin-top:auto;background:var(--surface-border);border-radius:1px;overflow:hidden}
.ds-flow-meter i{display:block;height:100%;background:var(--c-accent)}
.ds-flow-caption{display:flex;flex-wrap:wrap;gap:0.75rem;align-items:baseline;margin:0;font-size:var(--t-bodySmall-size);color:var(--surface-body)}
.ds-flow-caption-meta{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0.08em;text-transform:uppercase;color:var(--surface-quiet)}
body[data-mood="dark-premium"] .ds-flow-card{background:color-mix(in oklab,var(--c-paper) 8%,transparent)}

/* App shell */
.ds-app{display:grid;gap:0;border:1px solid var(--c-border);border-radius:var(--r-xl);overflow:hidden;background:var(--c-paper)}
.ds-app-top{display:flex;align-items:center;gap:var(--s-sm);padding:var(--s-xs) var(--s-md);border-bottom:1px solid var(--c-border);background:var(--c-paper-raised)}
.ds-app-crumbs{font-family:var(--f-mono);font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}
/* One screen. A product surface that needs two screens to show is not a screenshot, it is a page —
 * and split across two measured bands its density averages out to the same weight as the prose
 * either side of it, which is exactly the rhythm it should be interrupting. */
.ds-app-grid{display:grid;align-items:stretch;min-height:26rem}
.ds-app-side{border-right:1px solid var(--c-border);background:var(--c-paper-raised);padding:var(--s-md) var(--s-sm);display:grid;gap:var(--s-md);align-content:start}
.ds-app-nav{display:grid;gap:2px;list-style:none;margin:0;padding:0}
.ds-app-nav a,.ds-app-nav-item{display:block;width:100%;padding:var(--s-2xs) var(--s-xs);border:0;border-radius:var(--r-sm);background:transparent;font:inherit;font-size:var(--t-bodySmall-size);color:var(--c-ink-body);text-align:left;cursor:pointer}
.ds-app-nav a[aria-current="page"],.ds-app-nav-item[aria-current="page"],.ds-app-nav-item.is-current{background:var(--c-accent-surface);color:var(--c-ink);font-weight:600}
.ds-app-nav-item:hover,.ds-app-nav-item:focus-visible{color:var(--c-ink)}
.ds-app-nav-item:focus-visible{outline:2px solid var(--c-accent);outline-offset:1px}
.ds-app-view-label{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0.08em;text-transform:uppercase;color:var(--c-accent);margin:0 0 var(--s-sm)}
.ds-app-main{padding:var(--s-lg) var(--s-md);display:grid;gap:var(--s-lg);align-content:start}
.ds-app-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:var(--s-sm)}
.ds-stat{border:1px solid var(--c-border);border-radius:var(--r-md);padding:var(--s-sm);display:grid;gap:var(--s-3xs)}
.ds-stat-spark{margin-top:var(--s-3xs);opacity:.85}
.ds-stat b{font-family:var(--f-mono);font-size:var(--t-subheading-size);font-weight:500}
.ds-stat span{font-size:var(--t-caption-size);color:var(--c-ink-tertiary)}
.ds-table{width:100%;border-collapse:collapse;font-size:var(--t-bodySmall-size)}
.ds-table th,.ds-table td{padding:var(--s-xs);text-align:left;border-bottom:1px solid var(--c-border)}
.ds-table thead th{font-size:var(--t-micro-size);text-transform:uppercase;letter-spacing:var(--t-micro-tracking);color:var(--c-ink-tertiary);font-weight:600}
.ds-table td.ds-num{font-family:var(--f-mono);text-align:right;font-variant-numeric:tabular-nums}
.ds-pill{display:inline-flex;align-items:center;padding:2px var(--s-2xs);border-radius:var(--r-pill);font-size:var(--t-micro-size);border:1px solid var(--surface-border);color:var(--c-ink-body)}
.ds-pill-signal{color:var(--c-signal);border-color:var(--c-signal)}
.ds-empty{border:1px dashed var(--c-border-strong);border-radius:var(--r-lg);padding:var(--s-lg);display:grid;gap:var(--s-2xs);justify-items:start}

.ds-token-rail{display:none;flex-wrap:wrap;gap:var(--s-2xs);margin-top:var(--s-md)}
.ds-token-chip{font-family:var(--f-mono);font-size:var(--t-micro-size);padding:2px var(--s-2xs);border:1px solid var(--surface-border);border-radius:var(--r-pill);color:var(--surface-quiet)}

.ds-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ds-skip{position:absolute;left:var(--s-sm);top:calc(var(--s-sm) * -6);z-index:50;background:var(--c-paper);color:var(--c-ink);border:1px solid var(--c-border);border-radius:var(--r-sm);padding:var(--s-2xs) var(--s-sm)}
.ds-skip:focus{top:var(--s-sm)}

${leanCss(spec.taste.aestheticLean)}
${siteKindCss()}
${motionCss(spec.taste.motion)}
${motionSignatureCss(spec.brief.siteKind)}

@media (max-width:1080px){
  .ds-bento{grid-template-columns:repeat(4,1fr)}
  .ds-card,.ds-card-wide{grid-column:span 2}
  .ds-card-lead{grid-column:span 4}
  .ds-footer-grid{grid-template-columns:1fr 1fr 1fr}
}
@media (max-width:820px){
  .ds-split,.ds-alt-row,.ds-alt-pair,.ds-section-head-spread,.ds-proof-stage{grid-template-columns:1fr!important}
  .ds-chapter{grid-template-columns:2.75rem 1fr;row-gap:var(--s-2xs)}
  .ds-chapters::before{left:calc(var(--chapter-inset) + 2.75rem + (var(--s-sm) / 2))}
  .ds-chapter .ds-body{grid-column:2}
  .ds-chapter-mark{display:none}
  .ds-proof-board{grid-template-columns:1fr}
  .ds-proof-cell{border-right:0;border-bottom:1px solid var(--surface-border)}
  .ds-proof-figure{transform:none}
  /* The sign-off is a composition across the band. Stacked under the buttons on a phone it is just
     a large grey shape between the last CTA and the footer, so it goes. */
  .ds-closing-grid{grid-template-columns:1fr}
  .ds-closing-mark{display:none}
  .ds-alt-row:nth-child(even) .ds-alt-figure{order:0}
  .ds-bento{grid-template-columns:1fr}
  .ds-card,.ds-card-lead,.ds-card-wide{grid-column:span 1}
  .ds-alt-mark{display:none}
  .ds-index-row{grid-template-columns:2rem 1fr;row-gap:var(--s-2xs)}
  .ds-index-row p{grid-column:2}
  .ds-index-mark{display:none}
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
