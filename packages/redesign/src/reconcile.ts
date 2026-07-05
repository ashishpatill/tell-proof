import type {
  BrandDNA, CapturePayload, DesignFingerprint, Finding, Reconciliation, ReconTokenRow, ScoreAxis,
} from "@tell/schema";
import { round1 } from "./color";
import { AXIS_WEIGHTS, genericness, measureAxes } from "./measures";
import { DIRECTIONS, resolveDirection, type Direction } from "./scales";
import { afterAxes, buildRestylePlan, emitRestyleCss } from "./restyle";

// Back-compat alias — the web app imports RECONCILE_DIRECTIONS.
export const RECONCILE_DIRECTIONS = DIRECTIONS;
export { resolveDirection };
export type { Direction };

function fontImportFor(plan: { display: string; body: string; mono: string; direction: Direction }, dna?: BrandDNA): string {
  const spec = (family: string) => `${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700`;
  const fams = dna
    ? [spec(plan.display), spec(plan.body), plan.mono ? spec(plan.mono) : ""]
    : [plan.direction.displayGF, plan.direction.bodyGF, plan.direction.monoGF];
  const q = fams.filter(Boolean).map((f) => `family=${f}`).join("&");
  return `@import url('https://fonts.googleapis.com/css2?${q}&display=swap');`;
}

/**
 * Page-grounded, MEASURED redesign. Builds an element-precise restyle plan from the real
 * captured elements, scores the page before and after on the 6-axis genericness rubric
 * (docs/05), and returns CSS that the live "after" preview injects verbatim.
 */
export function reconcile(
  capture: CapturePayload,
  fingerprint: DesignFingerprint,
  _findings: Finding[],
  directionId: string,
  dna?: BrandDNA,
): Reconciliation {
  const dir = resolveDirection(directionId);
  const plan = buildRestylePlan(capture, fingerprint, dir, dna);
  const css = emitRestyleCss(plan);
  const fontImport = fontImportFor(plan, dna);

  const before = measureAxes(capture, fingerprint, dna);
  const after = afterAxes(plan, { contrast: before.contrast });
  const scoreBefore = genericness(before, before.tellScore);
  const scoreAfter = genericness(after, 0);

  const rationale: Record<ScoreAxis["key"], string> = {
    contrast: "Forced ≥4.5:1 text on surfaces Tell owns; hierarchy from a committed display/body ramp (§6).",
    typescale: `Snapped every size onto a ${dir.ratio} modular scale (§2).`,
    spacing: `Normalized padding onto a ${plan.spacingBase}pt token grid (§3).`,
    depth: `Collapsed shadows to ${Math.max(1, plan.elevationLevels)} considered level(s); ${plan.floatedCount} surface(s) float, the rest sit flat (§4).`,
    accent: plan.accentTamed
      ? "Replaced an AI-default / acid accent with one considered hue (§5)."
      : "Kept the brand hue, pulled its saturation + lightness into a considered band (§5).",
    identity: `Paired ${plan.display} + ${plan.body} — distinct type classes, committed display weight (§7).`,
  };

  const axes: ScoreAxis[] = ([
    ["contrast", "Contrast & hierarchy", before.contrast, after.contrast],
    ["typescale", "Type scale", before.typescale, after.typescale],
    ["spacing", "Spacing rhythm", before.spacing, after.spacing],
    ["depth", "Depth restraint", before.depth, after.depth],
    ["accent", "Accent discipline", before.accent, after.accent],
    ["identity", "Type identity", before.identity, after.identity],
  ] as const).map(([k, label, b, a]) => ({
    key: k, label, weight: AXIS_WEIGHTS[k], before: round1(b), after: round1(a),
    beforeText: before.text[k], afterText: afterText(k, plan),
    rationale: rationale[k],
  }));

  const rows: ReconTokenRow[] = [
    {
      key: "type", label: "Typeface",
      before: primaryOf(capture, "display") || "system default",
      after: `${plan.display} / ${plan.body}`,
      note: "Authored display + body pairing, distinct type classes (§7).",
    },
    {
      key: "accent", label: "Accent",
      before: plan.accentBefore, after: plan.accentAfter,
      swatchBefore: plan.accentBefore, swatchAfter: plan.accentAfter,
      note: plan.accentTamed ? "Tamed an AI-default / acid accent into a considered hue (§5)." : "Kept brand hue, harmonized saturation + lightness (§5).",
    },
    { key: "typescale", label: "Type scale", before: before.text.typescale, after: `${plan.distinctSizesAfter} sizes on a ${dir.ratio} scale`, note: rationale.typescale },
    { key: "spacing", label: "Spacing", before: before.text.spacing, after: `${plan.distinctSpacesAfter} steps · 100% on-grid`, note: rationale.spacing },
    { key: "depth", label: "Depth", before: before.text.depth, after: `${plan.floatedCount} float · rest flat`, note: rationale.depth },
    { key: "radius", label: "Corner radius", before: capture.surfaceTokens?.radius || "mixed", after: plan.radius, note: "One radius language across controls + cards." },
  ];

  return {
    directionId: dir.id,
    label: dir.label,
    summary: `${dir.summary} Genericness ${scoreBefore} → ${scoreAfter}.`,
    rows,
    css,
    fontImport,
    accentBefore: plan.accentBefore,
    accentAfter: plan.accentAfter,
    surfaceAfter: plan.surface,
    textAfter: plan.ink,
    scoreBefore,
    scoreAfter,
    axes,
    elementsRestyled: plan.ops.length,
    scoredAgainst: dna ? "brand-dna" : "baseline",
    cssSource: "recipes",
    directionNotes: plan.directionNotes,
  } satisfies Reconciliation;
}

function afterText(k: ScoreAxis["key"], plan: ReturnType<typeof buildRestylePlan>): string {
  switch (k) {
    case "contrast": return "≥4.5:1 text · committed hierarchy";
    case "typescale": return `${plan.distinctSizesAfter} sizes · one ratio`;
    case "spacing": return `${plan.distinctSpacesAfter} steps · on-grid`;
    case "depth": return `${Math.max(1, plan.elevationLevels)} level · ${plan.floatedCount} float`;
    case "accent": return `${plan.accentAfter} · one hue`;
    case "identity": return `${plan.display} + ${plan.body}`;
  }
}

function primaryOf(capture: CapturePayload, role: string): string {
  const s = capture.styles.find((x) => x.role === role);
  if (!s) return "";
  return (s.fontFamily.split(",")[0] ?? "").replace(/["']/g, "").trim();
}

// ── Legacy drop-in patch (kept for callers not yet on the source-aware patch) ──
export function buildOverridesPatch(recon: Reconciliation, url: string): { file: string; unifiedDiff: string; summary: string }[] {
  const file = "tell-overrides.css";
  const body = `${recon.fontImport}\n${recon.css}`;
  const lines = body.split("\n");
  const hunk = lines.map((l) => `+${l}`).join("\n");
  const unifiedDiff = `diff --git a/${file} b/${file}
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/${file}
@@ -0,0 +1,${lines.length} @@
${hunk}`;
  return [{
    file,
    summary: `${recon.label} for ${hostOf(url)} — genericness ${recon.scoreBefore} → ${recon.scoreAfter}. Import after the global stylesheet (or ask Cursor to fold it into tokens).`,
    unifiedDiff,
  }];
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "your page"; }
}
