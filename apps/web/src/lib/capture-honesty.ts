/**
 * Honest labels for capture readiness and project-canvas chrome.
 * Keep in sync with GET /api/health/capture and diagnose meta (no silent fixture swap).
 */

export type CaptureHealthPayload = {
  ok?: boolean;
  backend?: "remote" | "local" | string;
  error?: string;
  remoteStatus?: number;
};

/** Format GET /api/health/capture for Settings (and any pre-Capture readiness UI). */
export function formatCaptureHealth(
  health: CaptureHealthPayload | null,
  state: "idle" | "loading" | "error" = "idle",
): string {
  if (state === "loading") return "Checking capture…";
  if (state === "error" || !health) return "Capture health unavailable";

  if (health.ok) {
    if (health.backend === "remote") return "Capture ready · remote Playwright backend";
    return "Capture ready · local Playwright";
  }

  const detail = (health.error ?? "").trim();
  if (/TELL_CAPTURE_API_URL/i.test(detail)) {
    return "Capture unavailable · missing TELL_CAPTURE_API_URL";
  }
  if (health.backend === "remote") {
    return detail
      ? `Capture unavailable · remote (${detail})`
      : "Capture unavailable · remote backend";
  }
  return detail
    ? `Capture unavailable · Playwright (${detail})`
    : "Capture unavailable · Playwright";
}

export type ProjectCanvasTitleInput = {
  captureState: "idle" | "capturing" | "done";
  captureNote?: string;
  scannedSite: string | null;
  /** Live Playwright capture with snapshot — true proof surface. */
  hasLiveProofSurface: boolean;
  /** Opt-in committed fixture (composer Offline / body.offline) — not proof. */
  offlineFixture: boolean;
  captureError?: string;
};

/** Project canvas eyebrow: never call an offline fixture a proof surface. */
export function projectCanvasTitle(input: ProjectCanvasTitleInput): string {
  if (input.captureState === "capturing") {
    return input.captureNote?.trim() || "Capturing…";
  }
  if (input.scannedSite && input.hasLiveProofSurface) {
    return `Proof surface · ${input.scannedSite}`;
  }
  if (input.scannedSite && input.offlineFixture) {
    return `Offline fixture · ${input.scannedSite}`;
  }
  if (input.captureError) {
    return `Capture failed · ${input.scannedSite ?? "page"}`;
  }
  return "No capture yet";
}

/** Scenario-matrix chrome: Overall / matched / Δ score only for real baseline compares. */
export function isBaselineCompareMode(
  proofMode: "baseline-compare" | "capture-only" | undefined,
): boolean {
  return proofMode === "baseline-compare";
}
