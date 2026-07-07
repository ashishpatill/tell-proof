import { describe, expect, it } from "vitest";
import { shouldApplyDesignDoc } from "./load-design-doc";

describe("shouldApplyDesignDoc", () => {
  it("applies only for Tell-owned surfaces", () => {
    expect(shouldApplyDesignDoc("http://localhost:3000")).toBe(true);
    expect(shouldApplyDesignDoc("http://127.0.0.1:3000/report/abc")).toBe(true);
    expect(shouldApplyDesignDoc("https://tell-five.vercel.app")).toBe(true);
    expect(shouldApplyDesignDoc("http://localhost:3001")).toBe(false);
    expect(shouldApplyDesignDoc("https://superlearnai.com")).toBe(false);
    expect(shouldApplyDesignDoc("not-a-url")).toBe(false);
  });
});
