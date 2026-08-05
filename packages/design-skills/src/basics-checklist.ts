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
        if (/ds-hero-spanning/.test(html)) return true;
        const splits = html.match(/grid-template-columns:[^";]+/g) ?? [];
        return splits.some((s) => {
          const fr = Array.from(s.matchAll(/(\d+(?:\.\d+)?)fr/g)).map((m) => Number(m[1]));
          return fr.length === 2 && fr[0] !== fr[1];
        });
      })(),
      "Fold is either an asymmetric split or a spanning statement — equal 50/50 is the template tell.",
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
        || (spec.sections.some((s) => s.kind === "figure") && /data-instrument="scrub"/.test(html)),
      "Educational offerings include a scrubbable figure — the mechanism is shown, not only named.",
    ),
    check(
      "kind-studio",
      spec.brief.siteKind !== "art-directed-studio"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && spec.sections.some((s) => s.layout === "feature-alternating")
          && spec.sections.some((s) => s.kind === "figure" || s.kind === "story")
          && /ds-hero-overfigure/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length <= 1
        ),
      "Studio offerings stay paper-led with selected-work rhythm — no pricing ladder, at most one inverse close.",
    ),
    check(
      "kind-consumer",
      spec.brief.siteKind !== "consumer-craft"
        || (
          !spec.sections.some((s) => s.kind === "pricing")
          && spec.sections.some((s) => s.layout === "feature-alternating")
          && /ds-hero-overfigure/.test(html)
          && /ds-plate/.test(html)
          && spec.sections.filter((s) => s.surface === "inverse").length <= 1
        ),
      "Consumer craft stays figure-forward and paper-led — no SaaS pricing ladder, at most one inverse close.",
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
