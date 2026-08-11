/**
 * Skill-wiring gate — RSI challenger for `template:skill-metadata-only`.
 *
 * Every designFromFeatures / agency 2-build must prove research, craft, and
 * responsive-performance are actually attached — not only listed in hints.
 */
import { resolveRequestedCraft } from "./route";
import type { DesignSpec } from "./types";

export type SkillWiringFinding = {
  id: string;
  ok: boolean;
  detail: string;
};

export type SkillWiringReport = {
  passed: boolean;
  findings: SkillWiringFinding[];
  /** Executable checklist for agents / RESEARCH_GATE.md */
  executeChecklist: string[];
};

function check(id: string, ok: boolean, detail: string): SkillWiringFinding {
  return { id, ok, detail };
}

/** Required research subgraph for any website template. */
const ALWAYS_RESEARCH = [
  "load-prior-domain",
  "requirement-gap-diff",
  "ia-shell-synthesis",
  "variant-lens",
  "emit-training-episode",
] as const;

/**
 * Hard gate: research plan, always-on optim, follow-on craft merge, agency craftNodes.
 */
export function assertSkillWiring(spec: DesignSpec, html: string): SkillWiringReport {
  const plan = spec.researchPlan;
  const nodes = new Set(plan?.researchNodes ?? []);
  const routed = new Set(spec.routedSkills);
  const requested = resolveRequestedCraft(spec.brief);

  const findings: SkillWiringFinding[] = [
    check(
      "wiring-research-plan",
      Boolean(plan?.researchNodes?.length),
      "spec.researchPlan must list research nodes for every template build.",
    ),
    check(
      "wiring-research-first",
      spec.routedSkills[0] === "website-domain-research",
      "website-domain-research must be routed first.",
    ),
    check(
      "wiring-research-core",
      ALWAYS_RESEARCH.every((id) => nodes.has(id)),
      `Research core must include ${ALWAYS_RESEARCH.join(" → ")}.`,
    ),
    check(
      "wiring-research-html",
      /data-research-domain=/.test(html) && /name="tell-research-gate"/.test(html),
      "Preview HTML must emit research-gate meta + data-research-domain.",
    ),
    check(
      "wiring-responsive",
      routed.has("responsive-performance") &&
        /data-responsive-performance="required"/.test(html) &&
        /name="tell-responsive-performance"/.test(html),
      "responsive-performance always-on — HTML must mark media:site / WebP budgets.",
    ),
    check(
      "wiring-follow-on-merged",
      (plan?.followOnCraft ?? []).every((id) => routed.has(id)),
      "researchPlan.followOnCraft must be merged into routedSkills (no orphan craft).",
    ),
    check(
      "wiring-requested-craft",
      requested.every((id) => routed.has(id)),
      requested.length
        ? `brief.craftNodes / constraint craft must route: ${requested.join(", ")}`
        : "No explicit craftNodes — ok.",
    ),
    check(
      "wiring-sport",
      !spec.brief.sportId ||
        (nodes.has("sport-site-research") &&
          routed.has("sport-matchday-web") &&
          routed.has("sport-vernacular-craft")),
      "Sport briefs require sport-site-research + matchday/vernacular craft.",
    ),
  ];

  const executeChecklist: string[] = [
    ...(plan?.researchNodes ?? []).map((n, i) => `${i + 1}. Execute research node: \`${n}\``),
    ...((plan?.followOnCraft ?? []).map((c) => `Craft follow-on: \`${c}\``)),
    "Always-on: `responsive-performance` → `pnpm media:site -- --prune` after photography under apps/web/public",
    "Do not skip to pixels before research checklist is green",
  ];

  return {
    passed: findings.every((f) => f.ok),
    findings,
    executeChecklist,
  };
}

/** Markdown artifact for agency boards — agents execute these nodes every run. */
export function formatResearchGateMarkdown(
  spec: DesignSpec,
  wiring: SkillWiringReport,
): string {
  const plan = spec.researchPlan;
  const lines = [
    `# Research gate — ${spec.brief.productName}`,
    "",
    `Domain: \`${plan.domainId}\``,
    `Pack found: ${plan.packFound ? "yes" : "no — full walkthrough required"}`,
    `Walkthrough needed: ${plan.needsWalkthrough ? "yes" : "no"}`,
    `Skill wiring: **${wiring.passed ? "PASS" : "FAIL"}**`,
    "",
    "## Execute (required every run)",
    "",
    ...wiring.executeChecklist.map((c) => `- [ ] ${c}`),
    "",
    "## Gaps",
    "",
    ...(plan.gaps.length ? plan.gaps.map((g) => `- ${g}`) : ["- (none)"]),
    "",
    "## Reuse",
    "",
    ...(plan.reuse.length ? plan.reuse.slice(0, 12).map((r) => `- ${r}`) : ["- (none)"]),
    "",
    "## Wiring findings",
    "",
    ...wiring.findings.map((f) => `- ${f.ok ? "OK" : "FAIL"} \`${f.id}\` — ${f.detail}`),
    "",
    "## Routed skills",
    "",
    ...spec.routedSkills.map((s) => `- \`${s}\``),
    "",
  ];
  return lines.join("\n");
}
