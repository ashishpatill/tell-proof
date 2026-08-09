import { describe, expect, it } from "vitest";
import { ByokConfig, GEMINI_KEY_HEADER, CURSOR_KEY_HEADER, resolveGeminiKey, resolveCursorKey } from "./byok";

describe("byok", () => {
  it("parses empty and partial configs", () => {
    expect(ByokConfig.parse({})).toEqual({});
    expect(ByokConfig.parse({ geminiApiKey: " g " }).geminiApiKey).toBe(" g ");
  });

  it("resolves Gemini from header before env", () => {
    const prev = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "env-key";
    const req = new Request("http://localhost/api/voice", {
      headers: { [GEMINI_KEY_HEADER]: "header-key" },
    });
    expect(resolveGeminiKey(req)).toBe("header-key");
    const reqEnv = new Request("http://localhost/api/voice");
    expect(resolveGeminiKey(reqEnv)).toBe("env-key");
    if (prev === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prev;
  });

  it("resolves Cursor from header before env", () => {
    const prev = process.env.CURSOR_API_KEY;
    process.env.CURSOR_API_KEY = "env-cursor";
    const req = new Request("http://localhost/api/redesign", {
      headers: { [CURSOR_KEY_HEADER]: "header-cursor" },
    });
    expect(resolveCursorKey(req)).toBe("header-cursor");
    if (prev === undefined) delete process.env.CURSOR_API_KEY;
    else process.env.CURSOR_API_KEY = prev;
  });
});
