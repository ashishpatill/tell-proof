import { describe, expect, it } from "vitest";
import {
  applyFidelityNudges,
  DEFAULT_DESIGN_CONTROLS,
  designControlsToBriefFields,
} from "./design-controls-catalog";

describe("designControls fidelity", () => {
  it("wire nudges motion off and softens density", () => {
    const next = applyFidelityNudges({
      ...DEFAULT_DESIGN_CONTROLS,
      fidelity: "wire",
      density: "information-rich",
      motion: "light-scroll-reveals",
    });
    expect(next.motion).toBe("none");
    expect(next.density).toBe("balanced");
  });

  it("proof adds product-proof-stage craft node", () => {
    const fields = designControlsToBriefFields({
      ...DEFAULT_DESIGN_CONTROLS,
      fidelity: "proof",
    });
    expect(fields.craftNodes).toContain("product-proof-stage");
  });
});
