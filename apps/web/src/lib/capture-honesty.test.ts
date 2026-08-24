import { describe, expect, it } from "vitest";
import {
  formatCaptureHealth,
  isBaselineCompareMode,
  projectCanvasTitle,
} from "./capture-honesty";

describe("formatCaptureHealth", () => {
  it("reports loading and missing payloads", () => {
    expect(formatCaptureHealth(null, "loading")).toBe("Checking capture…");
    expect(formatCaptureHealth(null, "error")).toBe("Capture health unavailable");
    expect(formatCaptureHealth(null)).toBe("Capture health unavailable");
  });

  it("names local vs remote when ok", () => {
    expect(formatCaptureHealth({ ok: true })).toBe("Capture ready · local Playwright");
    expect(formatCaptureHealth({ ok: true, backend: "remote" })).toBe(
      "Capture ready · remote Playwright backend",
    );
  });

  it("surfaces missing TELL_CAPTURE_API_URL and Playwright failures", () => {
    expect(
      formatCaptureHealth({
        ok: false,
        backend: "remote",
        error: "TELL_CAPTURE_API_URL is not configured",
      }),
    ).toBe("Capture unavailable · missing TELL_CAPTURE_API_URL");
    expect(
      formatCaptureHealth({
        ok: false,
        error: "Executable doesn't exist",
      }),
    ).toBe("Capture unavailable · Playwright (Executable doesn't exist)");
  });
});

describe("projectCanvasTitle", () => {
  it("labels live capture as proof surface", () => {
    expect(
      projectCanvasTitle({
        captureState: "done",
        scannedSite: "localhost:3001",
        hasLiveProofSurface: true,
        offlineFixture: false,
      }),
    ).toBe("Proof surface · localhost:3001");
  });

  it("does not call offline fixture a proof surface", () => {
    expect(
      projectCanvasTitle({
        captureState: "done",
        scannedSite: "demo.fixture",
        hasLiveProofSurface: false,
        offlineFixture: true,
      }),
    ).toBe("Offline fixture · demo.fixture");
  });

  it("keeps failed capture naming", () => {
    expect(
      projectCanvasTitle({
        captureState: "idle",
        scannedSite: "example.com",
        hasLiveProofSurface: false,
        offlineFixture: false,
        captureError: "refused",
      }),
    ).toBe("Capture failed · example.com");
  });
});

describe("isBaselineCompareMode", () => {
  it("is true only for baseline-compare", () => {
    expect(isBaselineCompareMode("baseline-compare")).toBe(true);
    expect(isBaselineCompareMode("capture-only")).toBe(false);
    expect(isBaselineCompareMode(undefined)).toBe(false);
  });
});
