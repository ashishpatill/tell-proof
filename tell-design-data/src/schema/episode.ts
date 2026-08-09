import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

/** Loose Tell report slice — avoid depending on @tell/schema from this repo. */
export const LooseTellReport = z
  .object({
    id: z.string().optional(),
    capture: z
      .object({
        url: z.string().optional(),
        viewport: z
          .object({
            width: z.number().optional(),
            height: z.number().optional(),
          })
          .passthrough()
          .optional(),
        screenshot: z.string().optional(),
        snapshotHtml: z.string().optional(),
        // Tell captures may use object maps or array-of-pairs depending on vintage.
        cssVariables: z.union([z.record(z.string()), z.array(z.any())]).optional(),
      })
      .passthrough()
      .optional(),
    fingerprint: z.record(z.any()).optional(),
    findings: z.array(z.record(z.any())).default([]),
    verdicts: z.array(z.record(z.any())).default([]),
    score: z
      .object({
        total: z.number().optional(),
        generic: z.number().optional(),
        drift: z.number().optional(),
        intentional: z.number().optional(),
        uncertain: z.number().optional(),
      })
      .partial()
      .optional(),
    measures: z
      .object({
        score: z.number().optional(),
        band: z.string().optional(),
        axes: z.array(z.any()).optional(),
      })
      .passthrough()
      .optional(),
    activeDirection: z.record(z.any()).optional(),
  })
  .passthrough();

export type LooseTellReport = z.infer<typeof LooseTellReport>;

export const Outcome = z.enum(["accepted", "discarded", "edited", "unknown"]);
export type Outcome = z.infer<typeof Outcome>;

export const RewardComponents = z.object({
  humanAccept: z.number(),
  contrastProxy: z.number(),
  detectorClearance: z.number(),
  genericPenalty: z.number(),
  thrashPenalty: z.number(),
  total: z.number(),
});
export type RewardComponents = z.infer<typeof RewardComponents>;

export const DesignEpisode = z.object({
  episode_id: z.string(),
  created_at: z.string(),
  source: z.enum(["ingest", "watch", "proxy", "manual", "tell-sink", "design"]),
  /** diagnose loop vs studio/template generation */
  artifact_kind: z.enum(["diagnose", "design"]).default("diagnose"),
  brief: z.string().default(""),
  url: z.string().default(""),
  viewport: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  outcome: Outcome.default("unknown"),
  reward: RewardComponents,
  report: LooseTellReport.default({ findings: [], verdicts: [] }),
  direction: z.record(z.any()).optional(),
  proposal: z.record(z.any()).optional(),
  final_artifact: z.string().optional(),
  proposal_artifact: z.string().optional(),
  /** Relative path under training-data/ when HTML is externalized */
  artifact_path: z.string().optional(),
  meta: z.record(z.any()).default({}),
});
export type DesignEpisode = z.infer<typeof DesignEpisode>;

export function contentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

export function newEpisodeId(seed?: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `ep_${stamp}_${seed ?? randomUUID().slice(0, 8)}`;
}
