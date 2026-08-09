import { describe, expect, it } from "vitest";
import { svgSessionThumb } from "./session-thumb";

describe("svgSessionThumb", () => {
  it("emits a data URL with title and finding craft beat", () => {
    const url = svgSessionThumb({
      title: "localhost:3001",
      findingCount: 14,
      live: false,
      accent: "#8B5CF6",
    });
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    const decoded = decodeURIComponent(url.replace("data:image/svg+xml;charset=utf-8,", ""));
    expect(decoded).toContain("localhost:3001");
    expect(decoded).toContain("14 findings");
    expect(decoded).toContain("offline");
  });
});
