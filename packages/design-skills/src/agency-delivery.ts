/**
 * Agency delivery gates — pre-ship checklist for marketing pages.
 * Complements assertBasics (plumbing floor) with ban-list + CTA + motion discipline
 * learned from packaged-judgment + UX priority reviews (principle-only; no vendor DBs).
 */

import type { DesignSpec } from "./types";
import { agencyPolishAxesPresent } from "./agency-polish";

export interface AgencyFinding {
  id: string;
  ok: boolean;
  detail: string;
}

export interface AgencyDeliveryReport {
  passed: boolean;
  findings: AgencyFinding[];
}

function check(id: string, ok: boolean, detail: string): AgencyFinding {
  return { id, ok, detail };
}

const DEFAULT_BANS = [
  "purple gradients",
  "violet gradients",
  "emoji as icons",
  "Inter as display",
  "generic stock placeholders",
  "centered-everything",
  "equal three-card feature grids",
  "shadow-everywhere",
];

/** Detect common AI-default / ban-list failures in emitted HTML. */
export function assertAgencyDelivery(
  spec: DesignSpec,
  html: string,
  options: {
    requirePolishAxes?: boolean;
    banList?: string[];
  } = {},
): AgencyDeliveryReport {
  const banList = [...DEFAULT_BANS, ...(options.banList ?? []), ...(spec.brief.banList ?? [])];
  const primaryCta = (spec.brief.primaryCta ?? "").trim();

  const emojiIconHits =
    (html.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length +
    (html.match(/>(?:🚀|✨|🎨|⚙️|🔥|💡|📱|🌟)</g) ?? []).length;

  const purpleGradient =
    /linear-gradient\([^)]*(#7c3aed|#8b5cf6|#a855f7|#6366f1|violet|purple)/i.test(html) ||
    /from-(violet|purple|indigo)-.*to-(violet|purple|indigo)/i.test(html);

  const interAsDisplay =
    /--font-display:\s*['"]?Inter\b/i.test(html) ||
    /\.ds-display[^}]*font-family:\s*[^;]*\bInter\b/i.test(html);

  const creamTerracottaCluster =
    /#([fF]4[fF]1[eE][aA]|[fF]5[fF]0[eE]6|[fF][aA][fF]5[eE][fF])/i.test(html) &&
    /#([cC]26[bB]4[aA]|[eE]07[aA]5[fF]|[dD]46[aA]3[aA]|terracotta)/i.test(html);

  const deadHash = /\shref=["']#["']/.test(html);

  const findings: AgencyFinding[] = [
    check(
      "ban-purple-gradient",
      !purpleGradient,
      "No purple/violet gradient as the brand story (AI-default cluster).",
    ),
    check(
      "ban-emoji-icons",
      emojiIconHits === 0,
      "No emoji used as structural icons — use SVG or none.",
    ),
    check(
      "ban-inter-display",
      !interAsDisplay,
      "Display face is not Inter — pair a characterful display with a complementary body.",
    ),
    check(
      "ban-cream-terracotta-default",
      !creamTerracottaCluster,
      "Avoid cream paper + terracotta accent unless the brief explicitly asked for that look.",
    ),
    check(
      "ban-dead-hash",
      !deadHash,
      "No dead href=\"#\" anchors.",
    ),
    check(
      "one-primary-cta",
      Boolean(primaryCta) ||
        spec.sections.some((s) => Boolean(s.ctaLabel)) ||
        /Book a call|Book|Schedule|Get started|Start|Contact/i.test(html),
      "Page pushes toward one primary action (CTA present).",
    ),
    check(
      "reduced-motion",
      /prefers-reduced-motion/.test(html),
      "Motion respects prefers-reduced-motion.",
    ),
    check(
      "focus-visible",
      /:focus-visible/.test(html),
      "Focus-visible rings declared for keyboard users.",
    ),
    check(
      "brand-mark",
      /ds-brand-mark|class="[^"]*brand/i.test(html) ||
        html.toLowerCase().includes(spec.brief.productName.toLowerCase()),
      "Brand / product name appears as a first-class signal on the page.",
    ),
    check(
      "ban-list-recorded",
      banList.length >= 4,
      "Ban list is explicit — constraints beat vibes.",
    ),
  ];

  if (options.requirePolishAxes) {
    const axes = agencyPolishAxesPresent(html);
    findings.push(
      check(
        "polish-typography",
        axes.includes("typography"),
        "Typography-only polish pass applied.",
      ),
      check(
        "polish-spacing",
        axes.includes("spacing"),
        "Spacing-only polish pass applied.",
      ),
      check(
        "polish-motion",
        axes.includes("motion"),
        "Motion-only polish pass applied.",
      ),
    );
  }

  return {
    passed: findings.every((f) => f.ok),
    findings,
  };
}

export const AGENCY_DEFAULT_BAN_LIST = DEFAULT_BANS;
