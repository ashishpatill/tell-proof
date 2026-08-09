/** Shared phase ids for the agency pipeline + orchestrator. */
export const PHASE_ORDER = [
  "1-refs",
  "2-build",
  "3a-typography",
  "3b-spacing",
  "3c-motion",
  "3d-mobile",
  "4-ship",
] as const;

export type PhaseId = (typeof PHASE_ORDER)[number];
