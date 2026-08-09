import type { DesignEpisode, LooseTellReport, Outcome, RewardComponents } from "../schema/episode.js";

/**
 * Deterministic local reward from Tell report fields.
 * Literature: InstructGPT RM + UIClip-style quality; Tell detectors as domain reward.
 */
export function scoreReport(
  report: LooseTellReport,
  outcome: Outcome = "unknown",
  thrashHints = 0,
): RewardComponents {
  const findings = report.findings ?? [];
  const generic = Number(report.score?.generic ?? findings.filter((f) => f["verdictHint"] === "generic" || f["family"] === "tell").length);
  const totalFindings = Number(report.score?.total ?? findings.length);
  const measuresScore = report.measures?.score; // genericness 0..100, lower better
  const band = report.measures?.band;

  const humanAccept = outcome === "accepted" || outcome === "edited" ? 1 : outcome === "discarded" ? -0.5 : 0;

  // Proxy: lower genericness + distinctive band → higher
  let contrastProxy = 0.4;
  if (typeof measuresScore === "number") {
    contrastProxy = Math.max(0, Math.min(1, 1 - measuresScore / 100));
  } else if (band === "distinctive") contrastProxy = 0.85;
  else if (band === "conservative") contrastProxy = 0.65;
  else if (band === "template") contrastProxy = 0.35;
  else if (band === "slop") contrastProxy = 0.1;

  const detectorClearance =
    totalFindings === 0 ? 0.8 : Math.max(0, 1 - generic / Math.max(1, totalFindings));

  // Penalty for classic AI-default detectors if present in facts/detector names
  const blob = JSON.stringify(findings).toLowerCase();
  const clusterHits = ["inter", "violet", "purple", "gradient", "shadow-everywhere", "equal-card", "generic"]
    .filter((k) => blob.includes(k)).length;
  const genericPenalty = Math.min(1, clusterHits * 0.12);

  const thrashPenalty = Math.min(1, thrashHints * 0.15);

  const total =
    0.35 * humanAccept +
    0.25 * contrastProxy +
    0.25 * detectorClearance -
    0.2 * genericPenalty -
    0.15 * thrashPenalty;

  return {
    humanAccept,
    contrastProxy,
    detectorClearance,
    genericPenalty,
    thrashPenalty,
    total: Number(total.toFixed(4)),
  };
}

export function rescoreEpisode(ep: DesignEpisode, thrashHints = 0): DesignEpisode {
  return {
    ...ep,
    reward: scoreReport(ep.report, ep.outcome, thrashHints),
  };
}

export function scoreDesignArtifact(opts: {
  outcome?: Outcome;
  siteKind?: string;
  htmlBytes?: number;
}): RewardComponents {
  const outcome = opts.outcome ?? "accepted";
  const humanAccept = outcome === "accepted" || outcome === "edited" ? 1 : outcome === "discarded" ? -0.5 : 0.4;
  const sizeOk =
    typeof opts.htmlBytes === "number" && opts.htmlBytes > 2_000 && opts.htmlBytes < 2_000_000 ? 0.85 : 0.5;
  const total =
    0.45 * humanAccept +
    0.35 * sizeOk +
    0.2 * (opts.siteKind ? 0.8 : 0.4);
  return {
    humanAccept,
    contrastProxy: sizeOk,
    detectorClearance: 0.75,
    genericPenalty: 0,
    thrashPenalty: 0,
    total: Number(total.toFixed(4)),
  };
}

export function isRetainable(ep: DesignEpisode): boolean {
  if (ep.artifact_kind === "design" || ep.meta?.artifact_kind === "design") {
    if (ep.outcome === "discarded" && ep.reward.total < 0) return false;
    return Boolean(ep.final_artifact || ep.artifact_path || ep.proposal);
  }
  const url = ep.url || ep.report.capture?.url;
  if (!url) return false;
  if (ep.outcome === "discarded" && ep.reward.total < 0) return false;
  // Require some signal: findings or measures or human label
  if (
    ep.outcome === "unknown" &&
    !(ep.report.findings?.length) &&
    ep.report.measures?.score == null
  ) {
    return false;
  }
  return true;
}

export function retentionBucket(ep: DesignEpisode): "gold" | "strong" | "near_miss" | "junk" {
  if (!isRetainable(ep)) return "junk";
  if (ep.outcome === "accepted" || ep.outcome === "edited") return "gold";
  if (ep.reward.total >= 0.45) return "strong";
  if (ep.reward.total >= 0.15) return "near_miss";
  return "junk";
}
