import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { CapturePayload } from "@tell/schema";
import { buildFingerprint } from "../fingerprint/build-fingerprint";
import { detectFindings } from "../detectors";

type CorpusManifest = {
  version: number;
  categories: Array<{
    id: string;
    label: string;
    capturePath?: string;
    expectedDetectors?: string[];
    notes?: string;
  }>;
};

const manifest = JSON.parse(
  readFileSync(join(process.cwd(), "fixtures/corpus/manifest.json"), "utf8"),
) as CorpusManifest;

describe("detector golden corpus manifest", () => {
  it("declares at least the primary AI-SaaS category with a committed capture", () => {
    const primary = manifest.categories.find((c) => c.id === "ai-saas-generic");
    expect(primary?.capturePath).toBe("fixtures/reports/capture.json");
    expect(primary?.expectedDetectors?.length).toBe(14);
  });

  it("matches the golden detector set on the committed generic fixture capture", () => {
    const primary = manifest.categories.find((c) => c.id === "ai-saas-generic");
    const capturePath = primary?.capturePath ?? "fixtures/reports/capture.json";
    const capture = CapturePayload.parse(
      JSON.parse(readFileSync(join(process.cwd(), capturePath), "utf8")),
    );
    const findings = detectFindings(buildFingerprint(capture), capture);
    const detectors = findings.map((f) => f.detector).sort();
    expect(detectors).toEqual([...(primary?.expectedDetectors ?? [])].sort());
  });

  it("documents intentional and dogfood categories for future expansion", () => {
    const ids = manifest.categories.map((c) => c.id);
    expect(ids).toContain("intentional-brutalist");
    expect(ids).toContain("tell-dogfood");
  });
});
