/**
 * Re-export the shared local training-data sink.
 * Canonical implementation: `@tell/design-skills/training-data-sink`
 * (used by Studio API routes and Cursor MCP tools).
 */
export {
  recordTrainingEvent,
  writeTrainingEvent,
  resolveDesignDataRepo,
  resolveTrainingSink,
  trainingSinkStatus,
  resetTrainingSinkCache,
  scheduleDesignDataHarness,
  runDesignDataHarness,
  type TrainingSinkKind,
} from "@tell/design-skills/training-data-sink";
