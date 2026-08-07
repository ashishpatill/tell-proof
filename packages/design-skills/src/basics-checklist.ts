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
      "kind-app-sidebar-static",
      spec.brief.siteKind !== "dashboard-webapp" ||
        (!/\.ds-app-nav a href="#app"/.test(html) && /ds-app-nav-item/.test(html)),
      "Dashboard sidebar views/filters are static labels — not faux links that all scroll to #app.",
    ),
    check(
      "no-footer-top-spam",
      !/<footer[\s\S]*?<a href="#top">/.test(html),
      "Footer links must target real sections (or be plain text) — never mass-link to #top. Brand wordmark → #top is fine.",
    ),
    check(
      "no-boilerplate-proof-title",
      !/holds under review/i.test(html),
      "Proof titles must be siteKind-specific — never the shared 'holds under review' spam across offerings.",
    ),
    check(
      "flow-band-no-stretch",
      !/data-figure="flow"[^>]*preserveAspectRatio="none"/.test(html) &&
        !/<svg[^>]*data-figure="flow"[^>]*preserveAspectRatio="none"/.test(html),
      "Flow stage cards must keep aspect ratio — stretch+empty ordinals read as broken non-clickable UI.",
    ),
    check(
      "flow-band-has-matter",
      !/data-figure="flow"/.test(html) ||
        (() => {
          // Band flows use ~1200 design width (plus bleed inset); plate flows are ~720.
          const bands = [...html.matchAll(/<svg[^>]*data-figure="flow"[^>]*viewBox="([^"]+)"[\s\S]*?<\/svg>/g)].filter(
            (m) => {
              const parts = (m[1] ?? "").split(/\s+/).map(Number);
              const w = (parts[2] ?? 0) - (parts[0] ?? 0);
              return w >= 1000;
            },
          );
          if (!bands.length) return true;
          return bands.every((m) => {
            const texts = [...m[0].matchAll(/>([^<]{6,})</g)]
              .map((t) => (t[1] ?? "").replace(/&#39;/g, "'"))
              .filter((t) => t.length >= 6 && !/^\d{2}$|stages|Sequence|Step\s/i.test(t));
            return texts.length >= 6;
          });
        })(),
      "Flow band cards must carry title + body matter — never ordinal shells with empty airways.",
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
          && spec.sections.filter((s) => s.surface === "inverse").length <= 1
        ),
      "Studio offerings stay paper-led with selected-work rhythm — stack fold + solid claim, no pricing, ≤1 inverse.",
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
          && /ds-hero-seam/.test(html)
          && /ds-spine/.test(html)
          && /data-figure="type-ladder"/.test(html)
          && /ds-marginalia/.test(html)
          && /Colophon/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Foundry offerings use hard-seam + type ladder + marginalia + colophon — no pricing, no metrics theatre, zero inverse bands.",
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
          && /Calibration/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Observatory offerings use chronometer + scrub rail + signal lattice + chrono essay + calibration — no pricing, no metrics theatre, zero inverse bands.",
    ),
        check(
      "kind-archive",
      spec.brief.siteKind !== "archive-index"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && !spec.sections.some((s) => s.kind === "metrics")
          && /ds-hero-register/.test(html)
          && /ds-register-masthead/.test(html)
          && /ds-alpha-rail/.test(html)
          && /data-figure="index-ledger"/.test(html)
          && /ds-entry/.test(html)
          && /Registry/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Archive offerings use register + alpha rail + index ledger + entry essay + Registry — no pricing, no metrics theatre, zero inverse bands.",
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
          && /Care label/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Loom offerings use shed-threaded weft + shuttle + fell + treadles + loom weave + hangtag + Care label — no pricing, no metrics theatre, zero inverse bands.",
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
          && /Voucher/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Field-guide offerings use dissecting tray + hinged glassine + entomology pins + specimen tag + binomial strip + range + Voucher — no pricing, no metrics theatre, zero inverse bands.",
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
          && /Pressroom/.test(html)
          && /ds-bleed-rule/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length === 0
        ),
      "Press offerings use press fold + signature rail + press sheet + gather essay + Pressroom — no pricing, no metrics theatre, zero inverse bands.",
    ),
    check(
      "fig-mono-floor",
      !Array.from(html.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)).some((m) => Number(m[1]) > 0 && Number(m[1]) < 11),
      "SVG figure labels stay at ≥11px — smaller mono invents a type-step the probe counts but the eye cannot use.",
    ),
    check(
      "craft-figure-dense",
      !/data-figure="press-sheet"/.test(html) || /data-figure="press-sheet"[^>]*data-dense="ink"|data-dense="ink"[^>]*data-figure="press-sheet"/.test(html),
      "Cell-grid craft figures must carry drawn page matter (data-dense=ink) — empty stroked voids fail the eye.",
    ),
    check(
      "fold-owns-craft",
      (() => {
        const kind = spec.brief.siteKind;
        if (kind === "press-atelier") {
          return /ds-press-field/.test(html) && /ds-press-claim/.test(html) && /ds-hero-press \.ds-cta-note\{display:none\}/.test(html);
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
      spec.brief.siteKind === "docs-educational" || /ds-proof-board/.test(html),
      "Marketing and product pages carry a filled proof board, not a lonely quote on an empty band.",
    ),
  ];

  return { passed: findings.every((f) => f.ok), findings };
}
