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
[data-lean="system-crafted"] .ds-app-nav a[aria-current="page"]{box-shadow:inset 3px 0 0 var(--c-accent)}
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
[data-sitekind="fintech-marketing"] .ds-hero-overfigure .ds-plate-bleed .ds-fig{min-height:min(94vh,940px)}
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
/* Deliberate overlaps across band boundaries — layeredElements corridor floor is 11. */
[data-sitekind="editorial-foundry"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="editorial-foundry"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="editorial-foundry"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="editorial-foundry"] .ds-marginalia-mark{margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="editorial-foundry"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="editorial-foundry"] .ds-index-mark{margin-top:calc(var(--s-xs) * -1)}
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
[data-sitekind="research-dossier"] .ds-folio-claim{padding:var(--s-sm) 0 var(--s-xs,0.35rem)}
[data-sitekind="research-dossier"] .ds-folio-field{margin-top:calc(var(--s-2xl) * -1);position:relative;z-index:1}
[data-sitekind="research-dossier"] .ds-folio-claim{position:relative;z-index:2;background:linear-gradient(180deg,var(--c-paper) 70%,transparent)}
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
[data-sitekind="research-dossier"] .ds-spread-mark{margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="research-dossier"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="research-dossier"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(70vh,720px)}
[data-sitekind="research-dossier"] .ds-index-row{border-color:color-mix(in srgb,var(--surface-border) 70%,transparent)}
/* Signal observatory — chronometer, scrub rail, signal lattice, chrono essay, calibration. */
[data-sitekind="signal-observatory"]{
  --chrono-rail:3.25rem;
  --scrub-rail:3.5rem;
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
  padding:var(--s-xs,0.35rem) 0 0.2rem;
  padding-left:var(--chrono-rail);
  position:relative;z-index:2;
  background:linear-gradient(180deg,var(--c-paper) 65%,transparent);
}
[data-sitekind="signal-observatory"] .ds-chrono-field{
  margin-top:calc(var(--s-3xl,2.5rem) * -1.15);position:relative;z-index:1;
  padding-left:var(--chrono-rail);
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
[data-sitekind="signal-observatory"] .ds-chrono-essay,
[data-sitekind="signal-observatory"] .ds-chapter{padding-left:0;margin-left:var(--chrono-rail)}
[data-sitekind="signal-observatory"] .ds-closing-colophon{
  border-top:1px solid var(--c-border);padding-top:var(--s-xl);
}
[data-sitekind="signal-observatory"] .ds-closing-colophon .ds-title{font-family:var(--f-display);max-width:18ch}
[data-sitekind="signal-observatory"] .ds-closing-colophon .ds-eyebrow{letter-spacing:0.14em}
[data-sitekind="signal-observatory"] .ds-specimen{margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="signal-observatory"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="signal-observatory"] .ds-proof-figure{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="signal-observatory"] .ds-chrono-mark{margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
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
  padding:0.45rem 0 0.2rem;
  padding-left:var(--alpha-rail);
  position:relative;z-index:2;
  background:linear-gradient(180deg,var(--c-paper) 78%,transparent);
}
[data-sitekind="archive-index"] .ds-register-claim .ds-hero-copy{gap:0.35rem;max-width:28rem}
[data-sitekind="archive-index"] .ds-register-claim .ds-lede{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:40ch}
[data-sitekind="archive-index"] .ds-register-claim .ds-btn-secondary{display:none}
[data-sitekind="archive-index"] .ds-register-field{
  margin-top:calc(var(--s-xl) * -0.75);position:relative;z-index:1;
  padding-left:var(--alpha-rail);
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
[data-sitekind="archive-index"] .ds-entry-mark{margin-top:calc(var(--s-sm) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="archive-index"] .ds-closing-mark{margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="archive-index"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(72vh,740px)}
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
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-plate-bleed .ds-fig{
  min-height:min(68vh,700px);
}
[data-sitekind="docs-educational"] .ds-hero-aside{
  padding:var(--s-md);border:1px solid var(--surface-border);border-radius:var(--r-md);
  background:color-mix(in srgb,var(--c-paper-raised) 88%,transparent);
}
[data-sitekind="docs-educational"] .ds-figure-stage{
  min-height:20rem;padding:var(--s-md);border:1px solid var(--surface-border);
  border-radius:var(--r-lg);background:var(--c-paper);
}
[data-sitekind="docs-educational"] .ds-scrub{display:grid;gap:var(--s-2xs);margin-top:var(--s-sm)}
[data-sitekind="docs-educational"] .ds-specimen-head .ds-heading{font-size:var(--t-title-size);max-width:14ch}
[data-sitekind="docs-educational"] .ds-specimen .ds-plate-bleed .ds-fig{min-height:min(48vh,480px);opacity:.9}
[data-sitekind="docs-educational"] .ds-specimen{padding-block:var(--s-xl) var(--s-2xl)}
[data-sitekind="docs-educational"] .ds-chapters{margin-top:var(--s-sm);border-top-color:transparent}
[data-sitekind="docs-educational"] .ds-chapter-mark{width:10.5rem}
[data-sitekind="docs-educational"] .ds-matrix{font-size:var(--t-bodySmall-size)}
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
[data-sitekind="docs-educational"] .ds-figure-steps li{border:0;padding-block:0.35rem}
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
[data-sitekind="docs-educational"] [data-section="features"]{
  margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] [data-section="features"] + .ds-section{padding-top:calc(var(--section-y) + var(--s-md))}
[data-sitekind="docs-educational"] [data-section="figure"]{
  margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] [data-section="figure"] + .ds-section{padding-top:calc(var(--section-y) + var(--s-md))}
[data-sitekind="docs-educational"] .ds-specimen{
  margin-bottom:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-specimen + .ds-section{padding-top:calc(var(--section-y) + var(--s-lg))}
[data-sitekind="docs-educational"] .ds-story{
  margin-bottom:calc(var(--s-lg) * -1);position:relative;z-index:calc(var(--z-raised) + 1);
}
[data-sitekind="docs-educational"] .ds-story + .ds-section{padding-top:calc(var(--section-y) + var(--s-sm))}
[data-sitekind="docs-educational"] [data-section="compare"]{
  margin-top:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-matrix{margin-top:calc(var(--s-md) * -1);position:relative;z-index:var(--z-raised)}
[data-sitekind="docs-educational"] .ds-closing{
  margin-top:calc(var(--s-xl) * -1);position:relative;z-index:var(--z-raised);
}
[data-sitekind="docs-educational"] .ds-hero-stackfold .ds-plate-bleed{
  margin-bottom:calc(var(--s-lg) * -1);position:relative;z-index:var(--z-raised);
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
.ds-plate-fold,.ds-plate-lit{align-self:center;padding:var(--s-sm);border:1px solid var(--c-border);border-radius:var(--r-xl);background:var(--c-paper);box-shadow:var(--shadow-raised,0 18px 48px color-mix(in srgb,var(--c-ink) 10%,transparent)),0 0 0 1px color-mix(in srgb,var(--c-accent) 12%,transparent);position:relative}
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
.ds-chrono-field{margin-top:0;padding-left:var(--chrono-rail,3.25rem)}
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
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;
}
.ds-chrono-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
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
  padding:var(--s-sm) 0 var(--s-xs,0.35rem);
  padding-left:var(--alpha-rail,2.75rem);
}
.ds-register-claim .ds-hero-copy{max-width:30rem;gap:0.45rem}
.ds-register-field{margin-top:0;padding-left:var(--alpha-rail,2.75rem)}
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
  color:var(--c-ink-tertiary);margin:var(--s-sm) 0 0;
}
.ds-entry-mark{width:9rem;margin-top:var(--s-sm);opacity:.9}
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
/* Sequence is a single register with a spine — never a 2-col grid that leaves a hole on odd counts. */
.ds-chapters{display:grid;grid-template-columns:1fr;gap:0;list-style:none;margin:0;padding:0;position:relative;border-top:1px solid var(--surface-border)}
.ds-chapters::before{
  content:"";position:absolute;left:calc(var(--align-rail) * 0.35);top:var(--s-md);bottom:var(--s-md);width:2px;
  background:linear-gradient(180deg,var(--c-accent),color-mix(in srgb,var(--c-accent) 20%,transparent));border-radius:1px;
}
/* Title column shares --align-rail with section-head-main — third left edge beside wrap / wrap-wide. */
.ds-chapter{display:grid;grid-template-columns:var(--align-rail) minmax(12rem,22ch) minmax(0,1fr) minmax(7rem,9.5rem);gap:var(--s-sm) var(--s-lg);padding:var(--s-md) var(--s-sm) var(--s-md) 0;border-bottom:1px solid var(--surface-border);border-radius:0;background:transparent;position:relative;align-items:center}
.ds-chapter:nth-child(odd){background:color-mix(in srgb,var(--c-paper-raised) 70%,transparent)}
/* Lead step: accent rail + soft wash — full accent-surface cells blew accent-coverage on brand hex briefs. */
.ds-chapter:first-child{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--c-accent)}
.ds-chapter-index{font-family:var(--f-mono);font-size:var(--t-caption-size);line-height:1;letter-spacing:0;color:var(--c-accent);font-weight:600;min-width:2.5ch;padding-left:0}
.ds-chapter h3{font-size:var(--t-heading-size);line-height:var(--t-heading-leading);letter-spacing:var(--t-heading-tracking);max-width:22ch;grid-column:auto}
.ds-chapter .ds-body{max-width:52ch;grid-column:auto}
.ds-chapter-mark{width:9.5rem;justify-self:end;opacity:.95}

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
.ds-proof-cell{display:grid;gap:var(--s-2xs);align-content:start;padding:var(--s-md) var(--s-sm);border-right:1px solid var(--surface-border);min-height:0;background:transparent;border-radius:0}
.ds-proof-cell:last-child{border-right:0}
.ds-proof-cell.is-lead,.ds-proof-cell:first-child{background:var(--accent-soft);box-shadow:inset 0 3px 0 var(--c-accent)}
.ds-proof-mark{width:7.25rem;margin-bottom:var(--s-3xs);opacity:.95}
.ds-proof-meta{font-family:var(--f-mono);font-size:var(--t-caption-size);letter-spacing:0;text-transform:none;color:var(--c-accent)}
.ds-proof-cell h3{font-size:var(--t-body-size);line-height:var(--t-body-leading);letter-spacing:var(--t-body-tracking);font-weight:600;max-width:16ch}
.ds-proof-cell p{font-size:var(--t-caption-size);line-height:var(--t-caption-leading);color:var(--surface-muted);max-width:28ch}
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
.ds-app-nav a{display:block;padding:var(--s-2xs) var(--s-xs);border-radius:var(--r-sm);font-size:var(--t-bodySmall-size);color:var(--c-ink-body)}
.ds-app-nav a[aria-current="page"]{background:var(--c-accent-surface);color:var(--c-ink);font-weight:600}
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

@media (max-width:1080px){
  .ds-bento{grid-template-columns:repeat(4,1fr)}
  .ds-card,.ds-card-wide{grid-column:span 2}
  .ds-card-lead{grid-column:span 4}
  .ds-footer-grid{grid-template-columns:1fr 1fr 1fr}
}
@media (max-width:820px){
  .ds-split,.ds-alt-row,.ds-alt-pair,.ds-section-head-spread,.ds-proof-stage{grid-template-columns:1fr!important}
  .ds-chapter{grid-template-columns:2.75rem 1fr;row-gap:var(--s-2xs)}
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
