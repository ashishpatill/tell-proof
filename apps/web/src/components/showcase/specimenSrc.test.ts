import { describe, expect, it } from "vitest";
import { specimenHtmlSrc, specimenOpenHref } from "./specimenSrc";

describe("specimenSrc", () => {
  it("maps crease to the live multipage specimen, not the design HTML API", () => {
    expect(specimenHtmlSrc("crease")).toBe("/crease");
    expect(specimenOpenHref("crease")).toBe("/crease");
  });

  it("keeps engine templates on the showcase HTML API", () => {
    expect(specimenHtmlSrc("saas")).toBe("/api/design/html?showcase=saas");
    expect(specimenOpenHref("saas")).toBe("/showcase/saas");
  });
});
