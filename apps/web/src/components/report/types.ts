import type { TellReport } from "@tell/schema";

export type CaptureState = "idle" | "capturing" | "done";
export type DraftState = "idle" | "drafting" | "ready" | "copied" | "error";
export type CaptureMeta = {
  live: boolean;
  requestedUrl: string;
  capturedUrl: string;
  error?: string;
  backend?: "remote" | "local";
};
export type UiNotice = { tone: "success" | "error" | "info"; title: string; message: string };
export type SourceContext = {
  filesLoaded: number;
  filesDiscovered: number;
  matchedFiles: number;
  totalBytes: number;
  mode: "repo" | "capture";
};
export type ProofState = "idle" | "applying" | "verifying" | "passed" | "review" | "failed" | "error";
export type ProofResult = {
  status: "passed" | "review" | "failed";
  afterReport: TellReport;
  proof: {
    beforeScore: number;
    afterScore: number;
    scoreDelta: number;
    findingsBefore: number;
    findingsAfter: number;
    focusBefore: number;
    focusAfter: number;
    focusRegressed: boolean;
    screenshotsDiffer: boolean;
    structureRegressed: boolean;
    headingsBefore: number;
    headingsAfter: number;
    buttonsBefore: number;
    buttonsAfter: number;
    changedFiles: string[];
    capturedAt: string;
    url: string;
  };
};
export type MatrixCellSummary = {
  scenarioId: string;
  status: "passed" | "review" | "failed" | "skipped";
  scoreDelta: number;
  focusRegressed: boolean;
  structureRegressed: boolean;
};
export type MatrixProofSummary = {
  status: "passed" | "review" | "failed";
  matchedCells: number;
  skippedCells: number;
  cells: MatrixCellSummary[];
  cellCount: number;
  authStorage: boolean;
};
