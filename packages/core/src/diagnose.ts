import { CapturePayload, TellReport } from "@tell/schema";
import { buildFingerprint } from "./fingerprint/build-fingerprint";
import { detectFindings } from "./detectors";

export function diagnoseCapture(capture: CapturePayload): TellReport {
  const fingerprint = buildFingerprint(capture);
  const findings = detectFindings(fingerprint, capture);
  const verdicts = findings.map((finding) => ({
    findingId: finding.id,
    verdict: finding.verdictHint,
    confidence: 0.72,
    rationale: fallbackRationale(finding.detector, finding.verdictHint),
  }));
  return TellReport.parse({
    capture,
    fingerprint,
    findings,
    verdicts,
    score: {
      total: findings.length,
      generic: verdicts.filter((v) => v.verdict === "generic").length,
      drift: verdicts.filter((v) => v.verdict === "drift").length,
      intentional: verdicts.filter((v) => v.verdict === "intentional").length,
      uncertain: verdicts.filter((v) => v.verdict === "uncertain").length,
    },
  });
}

function fallbackRationale(detector: string, verdict: string): string {
  if (verdict === "generic") return `${detector} matches a common AI-built UI pattern. Tell can name it, show the evidence, and draft a more distinctive direction.`;
  if (verdict === "drift") return `${detector} found inconsistent rendered values. Pick one semantic treatment before the surface keeps splitting.`;
  return `${detector} may be intentional. Keep it only if it supports the product's chosen direction.`;
}
