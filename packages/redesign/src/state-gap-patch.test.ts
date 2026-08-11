import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TellReport } from "@tell/schema";
import { OfflineRedesignGenerator } from "./index";
import { buildStateGapPatch, stateGapCss } from "./state-gap-patch";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const report = TellReport.parse(
  JSON.parse(readFileSync(path.join(repoRoot, "fixtures/reports/tell-report.json"), "utf8")),
);

describe("StateGap draft patch", () => {
  it("emits a control state matrix — not a palette restyle", () => {
    const css = stateGapCss();
    expect(css).toMatch(/:hover/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/:disabled/);
    expect(css).not.toMatch(/--tell-paper|--tell-accent|font-family:\s*"Fraunces"/);
  });

  it("propose(findingId=drift-state-gap) returns tell-state-matrix.css", async () => {
    const gen = new OfflineRedesignGenerator();
    const direction = {
      id: "editorial",
      label: "Editorial warm",
      keywords: [],
      tokenOverrides: {},
      summary: "",
    };
    const proposal = await gen.propose(report, direction, "drift-state-gap");
    expect(proposal.findingId).toBe("drift-state-gap");
    expect(proposal.files).toHaveLength(1);
    expect(proposal.files[0]!.file).toBe("tell-state-matrix.css");
    expect(proposal.files[0]!.summary).toMatch(/state matrix|hover/i);
    expect(proposal.files[0]!.unifiedDiff).toMatch(/\+button:focus-visible/);
    expect(proposal.reconciliation).toBeUndefined();
  });

  it("buildStateGapPatch summarizes missing hover counts", () => {
    const [file] = buildStateGapPatch("http://localhost:3001", { hover: 0, focus: 0, disabled: 1 }, {
      missingHover: 8,
      probeCount: 8,
    });
    expect(file!.summary).toContain("8/8 controls missing hover");
  });
});
