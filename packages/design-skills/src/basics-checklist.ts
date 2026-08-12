/**
 * Implementation basics — the floor we kept rediscovering by hand.
 *
 * These checks come from two places, deliberately kept separate from taste:
 *
 *   1. Failure modes this engine hit repeatedly while iterating (opaque sticky bars,
 *      reserved heights that paint empty, equal-column splits, decorative rule spam,
 *      SVG text polluting the type ladder, sections that never stack on small viewports).
 *   2. Working patterns in open-source design builders that already solved those
 *      plumbing problems (structured specs, landmark HTML, focus rings, reduced-motion,
 *      token emission, previewable HTML). Those tools are not a source of templates or
 *      aesthetic direction — only of "does the page actually work".
 *
 * Aesthetic quality, composition corridors, and which offerings we ship live in the
 * design-research loop (`research/LOOP_LEDGER.md`, `docs/10_DESIGN_EVIDENCE.md`).
 * Do not add a check here because a peer tool has a theme named something pretty.
 */

import type { DesignSpec } from "./types";
import { assertSkillWiring } from "./skill-wiring";

export interface BasicsFinding {
  id: string;
  ok: boolean;
  detail: string;
}

export interface BasicsReport {
  passed: boolean;
  findings: BasicsFinding[];
}

function check(id: string, ok: boolean, detail: string): BasicsFinding {
  return { id, ok, detail };
}

/**
 * Fast, deterministic gates over a generated spec + preview HTML.
 * Meant for vitest and as a preflight before burning a research loop on craft score.
 */
export function assertBasics(spec: DesignSpec, html: string): BasicsReport {
  const findings: BasicsFinding[] = [
    check(
      "landmarks",
      /<nav[\s>]/.test(html) && /id="main"/.test(html) && /<(footer|div class="ds-footer)/.test(html),
      "Page exposes nav, main, and footer landmarks so assistive tech and audits can orient.",
    ),
    check(
      "skip-link",
      /Skip to content/i.test(html),
      "Skip link present — keyboard users are not trapped in the sticky bar.",
    ),
    check(
      "focus-visible",
      /:focus-visible/.test(html),
      "Focus rings are declared; peer builders treat this as non-negotiable chrome.",
    ),
    check(
      "reduced-motion",
      /prefers-reduced-motion/.test(html),
      "Motion respects reduced-motion. Continuous animation is never the floor.",
    ),
    check(
      "token-emission",
      (spec.tokens.declared ?? 0) >= 80 || (html.match(/--[a-z0-9-]+:/g) ?? []).length >= 80,
      "Tokens are emitted as custom properties, not hard-coded one-offs in the body.",
    ),
    check(
      "no-hash-hrefs",
      !/\shref="#"|href='#/.test(html),
      "No dead href=\"#\" anchors — they fail audits and feel unfinished.",
    ),
    check(
      "hero-present",
      spec.sections.some((s) => s.kind === "hero"),
      "Every offering opens with a hero that states the claim before the catalogue.",
    ),
    check(
      "cta-present",
      spec.sections.some((s) => s.kind === "cta" || Boolean(s.ctaLabel)),
      "A decision exists on the page — a primary action the reader can take.",
    ),
    check(
      "opaque-nav",
      !/\.ds-nav\{[^}]*backdrop-filter/.test(html) && /\.ds-nav\{[^}]*background:var\(--c-paper\)/.test(html),
      "Sticky nav is opaque. Translucent bars ghost headlines through the wordmark.",
    ),
    check(
      "mobile-stack",
      /@media \(max-width:820px\)/.test(html) || /@media\(max-width:820px\)/.test(html),
      "A mobile breakpoint stacks splits — equal columns on a phone is a known failure.",
    ),
    check(
      "asymmetric-or-statement-fold",
      (() => {
        if (/ds-hero-spanning|ds-hero-overfigure|ds-hero-claimband|ds-hero-stackfold|ds-hero-seam|ds-hero-folio|ds-hero-chrono|ds-hero-register|ds-hero-loom|ds-hero-voucher|ds-hero-press|ds-hero-drawloom|ds-hero-glassine/.test(html)) return true;
        const splits = html.match(/grid-template-columns:[^";]+/g) ?? [];
        return splits.some((s) => {
          const fr = Array.from(s.matchAll(/(\d+(?:\.\d+)?)fr/g)).map((m) => Number(m[1]));
          return fr.length === 2 && fr[0] !== fr[1];
        });
      })(),
      "Fold is either an asymmetric split, spanning statement, or hard-seam — equal 50/50 is the template tell.",
    ),
    check(
      "kind-shell",
      spec.brief.siteKind !== "dashboard-webapp"
        || spec.sections.filter((s) => s.layout === "app-shell").length === 1,
      "Dashboard offerings carry exactly one application shell, not a second pretend product.",
    ),
    check(
      "kind-figure",
      spec.brief.siteKind !== "docs-educational"
        || (
          /ds-hero-mechanism/.test(html)
          && /data-instrument="scrub"/.test(html)
          && /data-figure="mechanism-plate"/.test(html)
          && !/class="[^"]*ds-hero-stackfold/.test(html)
          && !/class="[^"]*ds-hero-overfigure/.test(html)
        ),
      "Educational offerings use mechanism fold + scrub on the fold — never shared stackfold skeleton.",
    ),
    check(
      "kind-saas-pipeline",
      spec.brief.siteKind !== "saas-marketing"
        || (
          /ds-hero-pipeline/.test(html)
          && /ds-stage-rail/.test(html)
          && /data-figure="pipeline-board"/.test(html)
          && !/class="[^"]*ds-hero-stackfold/.test(html)
        ),
      "SaaS owns a pipeline fold (stage rail + pipeline board) — not the shared stackfold skeleton.",
    ),
    check(
      "kind-fintech-wire",
      spec.brief.siteKind !== "fintech-marketing"
        || (
          /ds-hero-wire/.test(html)
          && /ds-cutoff-rail/.test(html)
          && /data-figure="wire-ledger"/.test(html)
          && /ds-tolerance-strip/.test(html)
          && !/class="[^"]*ds-hero-stackfold/.test(html)
        ),
      "Fintech owns a wire fold (cutoff rail + wire ledger) — not SaaS stackfold with extra inverse bands.",
    ),
    check(
      "kind-dashboard-queue",
      spec.brief.siteKind !== "dashboard-webapp"
        || (
          /ds-hero-queue/.test(html)
          && /ds-priority-rail/.test(html)
          && /data-figure="queue-console"/.test(html)
          && /id="app"/.test(html)
          && !/class="[^"]*ds-hero-stackfold/.test(html)
        ),
      "Dashboard owns a queue fold + app shell — not stackfold flow cards pretending to be unique.",
    ),
    check(
      "kind-corporate-diligence",
      spec.brief.siteKind !== "corporate-story"
        || (
          /ds-hero-diligence/.test(html)
          && /ds-principle-spine/.test(html)
          && /data-figure="posture-grid"/.test(html)
          && /ds-measure-rule/.test(html)
          && !/class="[^"]*ds-hero-stackfold/.test(html)
        ),
      "Corporate owns a diligence fold (principle spine + posture grid) — not editorial stackfold.",
    ),
    check(
      "kind-app-id",
      spec.brief.siteKind !== "dashboard-webapp" || /id="app"/.test(html),
      "Dashboard app shell exposes id=app so Workspace nav has a real scroll target.",
    ),
    check(
      "kind-app-sidebar-interactive",
      spec.brief.siteKind !== "dashboard-webapp" ||
        (
          /ds-app-nav-item[^>]*data-view=/.test(html) &&
          /data-app-shell/.test(html) &&
          /setAppView\(shell/.test(html) &&
          !/<a[^>]*class="[^"]*ds-app-nav-item/.test(html)
        ),
      "Dashboard sidebar views/filters must be real buttons that filter the table — not faux #app scroll links.",
    ),
    check(
      "kind-priority-rail-interactive",
      spec.brief.siteKind !== "dashboard-webapp" ||
        (
          /ds-priority-chip[^>]*data-rail-step=/.test(html) &&
          /data-rail="priority"/.test(html) &&
          !/<a[^>]*class="[^"]*ds-priority-chip/.test(html)
        ),
      "Dashboard priority rail chips must be buttons that select a view — never dead hash links.",
    ),
    check(
      "no-footer-top-spam",
      !/<footer[\s\S]*?<a href="#top">/.test(html),
      "Footer links must target real sections (or be plain text) — never mass-link to #top. Brand wordmark → #top is fine.",
    ),
    check(
      "paper-frame-footer-paint",
      !spec.routedSkills.includes("paper-technical-frame") ||
        (/body\[data-frame="paper-technical"\][\s\S]*?\.ds-footer/.test(html) &&
          /<footer class="ds-footer"/.test(html)),
      "Paper-technical frame must paint .ds-footer with paper/ink — footer.ds-section never matched the real markup, leaving paper ink on the inverse outer field.",
    ),
    check(
      "research-plan-wired",
      Boolean(spec.researchPlan?.researchNodes?.length) &&
        spec.routedSkills[0] === "website-domain-research" &&
        /data-research-domain=/.test(html) &&
        /name="tell-research-gate"/.test(html),
      "Every template carries a researchPlan and emits research-gate meta so agents execute LoadPrior→gap→IA before craft.",
    ),
    check(
      "responsive-performance-wired",
      spec.routedSkills.includes("responsive-performance") &&
        /data-responsive-performance="required"/.test(html) &&
        /name="tell-responsive-performance"/.test(html),
      "responsive-performance is always-on — HTML must mark media:site / WebP budgets required.",
    ),
    check(
      "sport-research-follow-on",
      !spec.brief.sportId ||
        (spec.researchPlan.researchNodes.includes("sport-site-research") &&
          spec.routedSkills.includes("sport-matchday-web") &&
          spec.routedSkills.includes("sport-vernacular-craft") &&
          spec.researchPlan.followOnCraft.includes("sport-vernacular-craft")),
      "Sport briefs must route sport-site-research + matchday/vernacular craft follow-ons.",
    ),
    check(
      "chapter-spine-clears-index",
      !/\.ds-chapters::before\{/.test(html) ||
        (!/left:calc\(var\(--align-rail\) \* 0\.35\)/.test(html) &&
          /--chapter-inset/.test(html) &&
          /left:calc\(var\(--chapter-inset\) \+ var\(--align-rail\)/.test(html)),
      "Chapter spine must sit mid-gap after --chapter-inset + align-rail — never through Step labels.",
    ),
    check(
      "chapter-lead-clears-index",
      !/\.ds-chapter:first-child\{[^}]*box-shadow:inset 3px/.test(html) ||
        /--chapter-inset:[^;]+;/.test(html),
      "Lead chapter inset accent bar needs --chapter-inset padding so it does not clip Step labels.",
    ),
    check(
      "workflow-stack-clears-panel",
      !/data-workflow-proof/.test(html) ||
        (/\.ds-workflow-field \.ds-proof-figure\{transform:none/.test(html) &&
          /\.ds-workflow-field\{[^}]*gap:var\(--s-xl\)/.test(html) &&
          /\.ds-proof\.ds-workflow\{[^}]*margin-bottom:0/.test(html)),
      "Workflow lit plate must not hang (translateY) into the swap panel — keep stack gap and no proof tuck into the next section.",
    ),
    check(
      "story-note-clears-mark",
      !/\.ds-(?:chrono|entry|hang|range|gather|ember|spread|marginalia)-mark\{[^}]*margin-top:calc\(var\(--s-(?:sm|xs|md)\) \* -1\)/.test(
        html,
      ) &&
        (
          !/class="ds-chrono-note"/.test(html) ||
          /\.ds-chrono-note \+ \.ds-chrono-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ) &&
        (
          !/class="ds-entry-note"/.test(html) ||
          /\.ds-entry-note \+ \.ds-entry-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ) &&
        (
          !/class="ds-hang-note"/.test(html) ||
          /\.ds-hang-note \+ \.ds-hang-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ) &&
        (
          !/class="ds-range-note"/.test(html) ||
          /\.ds-range-note \+ \.ds-range-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ) &&
        (
          !/class="ds-gather-note"/.test(html) ||
          /\.ds-gather-note \+ \.ds-gather-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ) &&
        (
          !/class="ds-ember-note"/.test(html) ||
          /\.ds-ember-note \+ \.ds-ember-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ) &&
        (
          !/class="ds-rounds-note"/.test(html) ||
          /\.ds-rounds-note \+ \.ds-rounds-mark\{[^}]*margin-top:var\(--s-lg\)/.test(html)
        ),
      "Story Note 0N labels must clear capability marks — never negative-margin the drawing under the label.",
    ),
    check(
      "craft-claim-clears-field",
      !/\.ds-(?:path|press|chrono|folio|register)-field\{[^}]*margin-top:calc\([^)]*\*\s*-/.test(html) &&
        (
          !/class="[^"]*ds-path-claim/.test(html) ||
          (/\[data-sitekind="lantern-path"\] \.ds-path-claim\{[^}]*background:var\(--c-paper\)/.test(html) &&
            /\[data-sitekind="lantern-path"\] \.ds-path-field\{[^}]*margin-top:0/.test(html))
        ) &&
        (
          !/class="[^"]*ds-care-claim/.test(html) ||
          (/\[data-sitekind="care-pathway"\] \.ds-care-claim\{[^}]*background:var\(--c-paper\)/.test(html) &&
            /\[data-sitekind="care-pathway"\] \.ds-care-field\{[^}]*margin-top:0/.test(html))
        ) &&
        (
          !/class="[^"]*ds-press-claim/.test(html) ||
          (/\[data-sitekind="press-atelier"\] \.ds-press-claim\{[^}]*background:var\(--c-paper\)/.test(html) &&
            /\[data-sitekind="press-atelier"\] \.ds-press-field\{[^}]*margin-top:0/.test(html))
        ) &&
        (
          !/class="[^"]*ds-chrono-claim/.test(html) ||
          (/\[data-sitekind="signal-observatory"\] \.ds-chrono-claim\{[^}]*background:var\(--c-paper\)/.test(html) &&
            /\[data-sitekind="signal-observatory"\] \.ds-chrono-field\{[^}]*margin-top:0/.test(html))
        ) &&
        (
          !/class="[^"]*ds-folio-claim/.test(html) ||
          (/\[data-sitekind="research-dossier"\] \.ds-folio-claim\{[^}]*background:var\(--c-paper\)/.test(html) &&
            /\[data-sitekind="research-dossier"\] \.ds-folio-field\{[^}]*margin-top:0/.test(html))
        ) &&
        (
          !/class="[^"]*ds-register-claim/.test(html) ||
          (/\[data-sitekind="archive-index"\] \.ds-register-claim\{[^}]*background:var\(--c-paper\)/.test(html) &&
            /\[data-sitekind="archive-index"\] \.ds-register-field\{[^}]*margin-top:0/.test(html))
        ),
      "Craft fold claims must be opaque paper stacked above the field — never soft-fade + negative-margin over labeled figure chrome.",
    ),
    check(
      "craft-rail-clears-bleed",
      !/--craft-rail:/.test(html) ||
        (/width:calc\(100vw - var\(--craft-rail,0px\)\)/.test(html) &&
          /margin-left:calc\(50% - 50vw \+ var\(--craft-rail,0px\)\)/.test(html)),
      "Craft left rails must inset .ds-bleed — full-viewport bleeds paint stages over Sig/Ch rails.",
    ),
    check(
      "press-regs-frame-field",
      !/class="[^"]*\bds-hero-press\b/.test(html) ||
        (/class="ds-bleed ds-press-field">[\s\S]*?ds-press-regs/.test(html) &&
          !/\.ds-press-regs\{[^}]*z-index:3/.test(html)),
      "Press registration marks frame the sheet field only — never sit above masthead/claim type.",
    ),
    check(
      "no-boilerplate-proof-title",
      !/holds under review/i.test(html),
      "Proof titles must be siteKind-specific — never the shared 'holds under review' spam across offerings.",
    ),
    check(
      "flow-band-interactive",
      !/data-figure="flow"/.test(html) ||
        (
          /ds-flow-card[^>]*data-step=/.test(html) &&
          /data-flow-caption/.test(html) &&
          /\.ds-flow-track/.test(html) &&
          !/<svg[^>]*data-figure="flow"/.test(html)
        ),
      "Flow stages must be HTML buttons with live state — never dead SVG shells that invite clicks.",
    ),
    check(
      "flow-band-has-matter",
      !/data-figure="flow"/.test(html) ||
        ((html.match(/ds-flow-title/g) || []).length >= 2 &&
          ((html.match(/ds-flow-body/g) || []).length >= 1 || (html.match(/ds-flow-meta/g) || []).length >= 1 || (html.match(/data-label=/g) || []).length >= 2)),
      "Flow stage cards must carry title + body matter — never ordinal shells with empty airways.",
    ),
    check(
      "scrub-steps-clickable",
      !/data-instrument="scrub"/.test(html) ||
        (/data-scrub/.test(html) && /go\(li\.getAttribute\('data-step'\)\)/.test(html)),
      "Educational scrub stage list must drive the range input — dead list items fail the human click test.",
    ),
    check(
      "kind-studio",
      spec.brief.siteKind !== "art-directed-studio"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && spec.sections.some((s) => s.layout === "feature-alternating")
          && spec.sections.some((s) => s.kind === "figure" || s.kind === "story")
          && /ds-hero-claimband/.test(html)
          && /ds-hero-stackfold/.test(html)
          && /data-figure="work-board"/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length <= 1
        ),
      "Studio offerings stay paper-led with a crop-marked work-board on the fold — stack fold + solid claim, no pricing, ≤1 inverse.",
    ),
    check(
      "kind-consumer",
      spec.brief.siteKind !== "consumer-craft"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && spec.sections.some((s) => s.layout === "feature-alternating")
          && /ds-hero-claimband/.test(html)
          && /ds-hero-stackfold/.test(html)
          && /ds-plate/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length <= 1
        ),
      "Consumer craft stays figure-forward and paper-led — stack fold + solid claim, no pricing, ≤1 inverse.",
    ),
    check(
      "kind-foundry",
      spec.brief.siteKind !== "editorial-foundry"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && !spec.sections.some((s) => s.id === "features-2")
          && /ds-hero-seam/.test(html)
          && /ds-spine/.test(html)
          && /data-figure="type-ladder"/.test(html)
          && /ds-marginalia/.test(html)
          && /ds-cut-slips/.test(html)
          && /Colophon/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Foundry offerings use hard-seam + type ladder + marginalia with cut slips + colophon — no pricing, no metrics theatre, no sparse second catalogue, zero inverse bands.",
    ),
    check(
      "kind-dossier",
      spec.brief.siteKind !== "research-dossier"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-folio/.test(html)
          && /ds-folio-masthead/.test(html)
          && /ds-chapter-rail/.test(html)
          && /data-figure="dossier-plate"/.test(html)
          && /ds-spread/.test(html)
          && /ds-footnote-register/.test(html)
          && /Imprint/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Dossier offerings use folio + chapter rail + dossier plate + spread footnotes + imprint — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "kind-observatory",
      spec.brief.siteKind !== "signal-observatory"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-chrono/.test(html)
          && /ds-chronometer/.test(html)
          && /ds-scrub-rail/.test(html)
          && /data-figure="signal-lattice"/.test(html)
          && /ds-chrono/.test(html)
          && /class="ds-chrono-desk"/.test(html)
          && /aria-label="Event waterfall"/.test(html)
          && /class="ds-chrono-waterfall"/.test(html)
          && !/class="ds-chrono-aside"/.test(html)
          && !/class="ds-chrono-grid"/.test(html)
          && /Calibration/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Observatory offerings use chronometer + scrub rail + signal lattice + event waterfall + calibration — no pricing, no metrics theatre, zero inverse bands.",
    ),
        check(
      "kind-archive",
      spec.brief.siteKind !== "archive-index"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && !spec.sections.some((s) => s.layout === "feature-rows")
          && !spec.sections.some((s) => s.layout === "marquee-proof")
          && /ds-hero-register/.test(html)
          && /ds-register-masthead/.test(html)
          && /ds-alpha-rail/.test(html)
          && /data-figure="index-ledger"/.test(html)
          && /ds-entry/.test(html)
          && /ds-cross-stamps/.test(html)
          && /ds-stamp-seal/.test(html)
          && /Registry/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Archive offerings use register + alpha rail + index ledger + entry essay with cross-stamp seals + Registry — no pricing, no metrics theatre, no sparse feature-rows, no shared marquee-proof, zero inverse bands.",
    ),
    check(
      "kind-loom",
      spec.brief.siteKind !== "commerce-loom"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-drawloom/.test(html)
          && /ds-shed/.test(html)
          && /ds-weft-pick/.test(html)
          && /ds-shuttle/.test(html)
          && /ds-fell/.test(html)
          && /ds-treadles/.test(html)
          && /data-figure="loom-weave"/.test(html)
          && /ds-hangtag/.test(html)
          && /class="ds-hang-tape"/.test(html)
          && /aria-label="Care tag stack"/.test(html)
          && /class="ds-hang-stack"/.test(html)
          && !/class="ds-hang-aside"/.test(html)
          && /Care label/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Loom offerings use shed-threaded weft + shuttle + fell + treadles + loom weave + care-tag stack + Care label — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "kind-field",
      spec.brief.siteKind !== "field-guide"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-glassine/.test(html)
          && /ds-dissecting-tray/.test(html)
          && /ds-glassine-lid/.test(html)
          && /ds-specimen-tag/.test(html)
          && /ds-epin/.test(html)
          && /ds-binomial-strip/.test(html)
          && /data-figure="specimen-plate"/.test(html)
          && /ds-range/.test(html)
          && /class="ds-range-ladder"/.test(html)
          && /aria-label="Dichotomous key"/.test(html)
          && /class="ds-range-sheets"/.test(html)
          && !/class="ds-range-aside"/.test(html)
          && !/class="ds-gather-stack"/.test(html)
          && !/class="ds-gather-forme"/.test(html)
          && /Voucher/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Field-guide offerings use dissecting tray + hinged glassine + entomology pins + specimen tag + binomial strip + dichotomous voucher key + Voucher — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "kind-press",
      spec.brief.siteKind !== "press-atelier"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-press/.test(html)
          && /ds-press-masthead/.test(html)
          && /ds-sig-rail/.test(html)
          && /data-figure="press-sheet"/.test(html)
          && /ds-gather/.test(html)
          && /class="ds-gather-stack"/.test(html)
          && /aria-label="Signature stack"/.test(html)
          && /class="ds-gather-forme"/.test(html)
          && /class="ds-gather-densito"/.test(html)
          && !/class="ds-gather-aside"/.test(html)
          && !/class="ds-range-ladder"/.test(html)
          && !/aria-label="Dichotomous key"/.test(html)
          && /Pressroom/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Press offerings use press fold + signature rail + press sheet + overlapping forme stack + densitometer + Pressroom — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "kind-lantern",
      spec.brief.siteKind !== "lantern-path"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-path/.test(html)
          && /ds-path-masthead/.test(html)
          && /ds-way-rail/.test(html)
          && /data-figure="path-plate"/.test(html)
          && /ds-ember/.test(html)
          && /class="ds-ember-trail"/.test(html)
          && /aria-label="Night trail"/.test(html)
          && !/class="ds-ember-aside"/.test(html)
          && !/class="ds-ember-grid"/.test(html)
          && /Ember/.test(html)
          && /ds-bleed-rule/.test(html)
          && /ds-path-near/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Lantern-path offerings use path fold + waypoint rail + path plate + night trail + Ember — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "kind-clinic",
      spec.brief.siteKind !== "care-pathway"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-rounds/.test(html)
          && /ds-care-masthead/.test(html)
          && /ds-care-rail/.test(html)
          && /data-figure="care-plate"/.test(html)
          && /ds-rounds/.test(html)
          && /class="ds-rounds-ladder"/.test(html)
          && /aria-label="Rounds ladder"/.test(html)
          && !/class="ds-rounds-aside"/.test(html)
          && !/class="ds-ember-trail"/.test(html)
          && /Chart/.test(html)
          && /ds-bleed-rule/.test(html)
          && /ds-care-imprint/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Care-pathway offerings use rounds fold + care rail + care plate + rounds ladder + Chart — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "care-plate-explains",
      spec.brief.siteKind !== "care-pathway"
        || (
          /ACTIVE CASE/.test(html)
          && /STAGE MAP/.test(html)
          && /HANDOFF BEADS/.test(html)
          && /DWELL WINDOWS/.test(html)
          && /ENCOUNTER LOG/.test(html)
          && /Desk → Triage|→/.test(html)
          && /Named stop|Who · when|Time-on-stage/.test(html)
          && !/NEAR PLANE/.test(html)
        ),
      "Care-plate must teach Stage map / Handoff beads / Dwell windows with citeable matter — not an empty schematic or title-only ENC chips (template:care-plate-empty-schematic).",
    ),
    check(
      "fig-mono-floor",
      !Array.from(html.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)).some((m) => Number(m[1]) > 0 && Number(m[1]) < 11),
      "SVG figure labels stay at ≥11px — smaller mono invents a type-step the probe counts but the eye cannot use.",
    ),
    check(
      "craft-figure-dense",
      (!/data-figure="press-sheet"/.test(html) || /data-figure="press-sheet"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="press-sheet"/.test(html))
        && (!/data-figure="path-plate"/.test(html) || /data-figure="path-plate"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="path-plate"/.test(html))
        && (!/data-figure="care-plate"/.test(html) || /data-figure="care-plate"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="care-plate"/.test(html)),
      "Cell-grid craft figures must carry drawn page matter (data-dense=ink) — empty stroked voids fail the eye.",
    ),
    check(
      "signature-figure-teaches",
      (() => {
        // Signature plates that only stamp a title fail the eye. When a craft figure is present,
        // require at least one teaching surface beyond chrome labels (log / legend / concept panel).
        const kind = spec.brief.siteKind;
        if (kind === "care-pathway") {
          return /ENCOUNTER LOG/.test(html) && /STAGE MAP/.test(html);
        }
        if (kind === "lantern-path") {
          return /PATH ATLAS|WAYPOINT|ELEV/.test(html);
        }
        if (kind === "press-atelier") {
          return /PRESS SHEET|SIG /.test(html);
        }
        return true;
      })(),
      "Signature craft figures must teach the product concept — title chrome alone is an empty schematic.",
    ),
    check(
      "fold-owns-craft",
      (() => {
        const kind = spec.brief.siteKind;
        if (kind === "press-atelier") {
          return /ds-press-field/.test(html) && /ds-press-claim/.test(html) && /ds-hero-press \.ds-cta-note\{display:none\}/.test(html);
        }
        if (kind === "lantern-path") {
          return /ds-path-field/.test(html) && /ds-path-claim/.test(html) && /ds-hero-path \.ds-cta-note\{display:none\}/.test(html);
        }
        if (kind === "care-pathway") {
          return (
            /ds-care-field/.test(html) &&
            /ds-care-claim/.test(html) &&
            /ds-hero-rounds \.ds-actions\{display:none\}/.test(html) &&
            /\[data-sitekind="care-pathway"\] \.ds-care-claim\{[^}]*background:var\(--c-paper\)/.test(html)
          );
        }
        if (kind === "archive-index") {
          return /ds-register-field/.test(html) && /ds-hero-register/.test(html);
        }
        if (kind === "signal-observatory") {
          return /ds-chrono-field/.test(html) && /ds-hero-chrono/.test(html);
        }
        if (kind === "research-dossier") {
          return /ds-folio-field/.test(html) && /ds-hero-folio/.test(html);
        }
        if (kind === "commerce-loom") {
          return /ds-drawloom-cloth/.test(html) && /ds-hero-drawloom/.test(html);
        }
        if (kind === "field-guide") {
          return /ds-press-plate/.test(html) && /ds-hero-glassine/.test(html);
        }
        if (kind === "saas-marketing") {
          return /ds-pipeline-fold/.test(html) && /ds-pipeline-field/.test(html) && /ds-hero-pipeline/.test(html);
        }
        if (kind === "dashboard-webapp") {
          return /ds-queue-fold/.test(html) && /ds-queue-field/.test(html) && /ds-hero-queue/.test(html);
        }
        if (kind === "corporate-story") {
          return /ds-diligence-fold/.test(html) && /ds-diligence-field/.test(html) && /ds-hero-diligence/.test(html);
        }
        if (kind === "docs-educational") {
          return /ds-mechanism-fold/.test(html) && /ds-mechanism-stage/.test(html) && /ds-hero-mechanism/.test(html);
        }
        if (kind === "fintech-marketing") {
          return /ds-wire-fold/.test(html) && /ds-wire-field/.test(html) && /ds-hero-wire/.test(html);
        }
        return true;
      })(),
      "Unique craft figures sit beside the claim in a split fold — never a tall left-only claim with an empty right half.",
    ),
    check(
      "solid-claim-when-labeled-fold",
      !(
        (spec.brief.siteKind === "art-directed-studio" || spec.brief.siteKind === "consumer-craft")
        && !(/ds-hero-claimband/.test(html) && /ds-hero-stackfold/.test(html))
      ),
      "Studio/consumer folds stack an opaque claim above the labeled figure — never overlay stage labels under type.",
    ),
    check(
      "no-filler-tiers",
      !/\b(Starter|Growth|Enterprise Plan|Lorem ipsum)\b/i.test(html)
        || spec.brief.features.some((f) => /starter|growth|enterprise/i.test(f.name)),
      "Pricing and proof copy come from declared features, not invented SaaS tiers.",
    ),
    check(
      "scroll-margin",
      /scroll-margin-top/.test(html),
      "Section anchors clear the sticky nav — without scroll-margin, deep links land under the bar.",
    ),
    check(
      "z-scale",
      /--z-nav/.test(html) && /--z-raised/.test(html),
      "A declared z-index scale keeps sticky chrome, hangs, and overlays from fighting with magic numbers.",
    ),
    check(
      "focus-ring-token",
      /--focus-ring/.test(html),
      "Focus ring is a token, not an ad-hoc outline that drifts from the accent.",
    ),
    check(
      "text-wrap",
      /text-wrap:pretty/.test(html) && /text-wrap:balance/.test(html),
      "Headings balance and prose wraps pretty — plumbing peer builders treat as baseline.",
    ),
    check(
      "proof-board",
      // Craft kinds prove via signature story instruments (entry, chrono, hangtag, …) — they must
      // NOT reuse the shared marquee evidence board. Marketing kinds that keep a proof section
      // still need a filled board (or SaaS workflow stage) rather than a lonely quote.
      // Match the live <ul … data-proof-board> — the shared script also mentions the attribute.
      (() => {
        const kind = spec.brief.siteKind;
        const hasBoard = /<ul[^>]*\bdata-proof-board\b/.test(html);
        const craftProof = [
          "docs-educational",
          "art-directed-studio",
          "consumer-craft",
          "editorial-foundry",
          "research-dossier",
          "signal-observatory",
          "archive-index",
          "commerce-loom",
          "field-guide",
          "press-atelier",
          "lantern-path",
          "care-pathway",
        ].includes(kind);
        if (craftProof) return !hasBoard;
        if (kind === "saas-marketing") return /data-workflow-proof/.test(html) && !hasBoard;
        return hasBoard;
      })(),
      "Craft templates prove with their own story instrument; marketing pages keep a filled proof board or workflow stage — never a lonely quote, never one shared board on every offering.",
    ),
  ];

  // RSI: skill wiring is part of the basics floor — every template / agency 2-build.
  const wiring = assertSkillWiring(spec, html);
  findings.push(
    ...wiring.findings.map((f) => check(f.id, f.ok, f.detail)),
  );

  return { passed: findings.every((f) => f.ok), findings };
}
