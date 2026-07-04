import { ArtDirection, DesignFingerprint, Finding, TasteVerdict } from "@tell/schema";
import { createTasteEngine, deterministicVerdict, type TasteEngine } from "./engine";
import { parseDirectionPlan } from "./parse-direction";
import { DIRECTION_PRESETS } from "./presets";

export * from "./engine";
export * from "./parse-direction";
export { DIRECTION_PRESETS } from "./presets";

/** Deterministic single-finding verdict (offline-safe). */
export function classifyFinding(finding: Finding): TasteVerdict {
  return deterministicVerdict(finding);
}

export function classifyFindings(findings: Finding[]): TasteVerdict[] {
  return findings.map(classifyFinding);
}

/** One-line, model-friendly digest of the fingerprint used to ground taste calls. */
export function summarizeFingerprint(fp: DesignFingerprint): string {
  const fonts = fp.fontFamilies.slice(0, 3).map((f) => `${f.family}×${f.count}`).join(", ");
  return [
    `fonts: ${fonts || "n/a"}`,
    `type sizes: ${fp.typeScale.length}`,
    `radii: ${fp.radii.length}`,
    `gradient: ${fp.gradientDetected}`,
    `centered: ${fp.centeredBlockRatio.toFixed(2)}`,
    `emoji: ${fp.emojiInUiCount}`,
    `focus-ring coverage: ${fp.focusRingCoverage.toFixed(2)}`,
  ].join(" · ");
}

/**
 * Classify a whole finding set. Uses the real (Gemini) engine when an api key
 * is supplied, else the deterministic engine. Reflection + fallback are handled
 * inside the engine, so every finding always gets a valid verdict.
 */
export async function classifyWithTaste(
  findings: Finding[],
  fingerprint: DesignFingerprint,
  opts: { apiKey?: string; engine?: TasteEngine } = {},
): Promise<TasteVerdict[]> {
  const engine = opts.engine ?? createTasteEngine(opts.apiKey);
  const ctx = { fingerprintSummary: summarizeFingerprint(fingerprint) };
  return Promise.all(findings.map((f) => engine.classify(f, ctx)));
}

export function parseDirection(input: string): ArtDirection {
  return parseDirectionPlan(input).artDirection;
}
