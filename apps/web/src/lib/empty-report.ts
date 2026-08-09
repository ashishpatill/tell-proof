import { TellReport } from "@tell/schema";

/** Blank session — no findings, no seam — until a live capture or explicit offline load. */
export const emptyReport: TellReport = TellReport.parse({
  capture: {
    url: "",
    capturedAt: new Date(0).toISOString(),
    viewport: { width: 1440, height: 900 },
    screenshotBase64: "",
    snapshotHtml: "",
    cssVariables: [],
    styles: [],
    probes: [],
    stateShots: [],
    viewportMatrix: [],
    domSummary: {
      headingCount: 0,
      buttonCount: 0,
      centeredBlockRatio: 0,
      emojiInUiCount: 0,
    },
  },
  fingerprint: {
    url: "",
    generatedAt: new Date(0).toISOString(),
    fontFamilies: [],
    colors: [],
    shadows: [],
    radii: [],
    spacingValues: [],
    typeScale: [],
    centeredBlockRatio: 0,
    emojiInUiCount: 0,
    gradientDetected: false,
    gradientSamples: [],
    nearDuplicateGrays: [],
    focusRingCoverage: 1,
    stateCoverage: { hover: 1, focus: 1, disabled: 1 },
  },
  findings: [],
  verdicts: [],
  score: { total: 0, generic: 0, drift: 0, intentional: 0, uncertain: 0 },
});
