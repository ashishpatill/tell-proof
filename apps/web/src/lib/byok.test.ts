import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ByokConfig,
  BYOK_STORAGE_KEY,
  GEMINI_KEY_HEADER,
  CURSOR_KEY_HEADER,
  byokHeaders,
  loadByok,
  resolveGeminiKey,
  resolveCursorKey,
  saveByok,
} from "./byok";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    key: (i) => [...map.keys()][i] ?? null,
  };
}

describe("byok", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses empty and partial configs", () => {
    expect(ByokConfig.parse({})).toEqual({});
    expect(ByokConfig.parse({ geminiApiKey: " g " }).geminiApiKey).toBe(" g ");
    // Legacy captureApiUrl still parses but is unused by byokHeaders
    expect(ByokConfig.parse({ captureApiUrl: "https://capture.example" }).captureApiUrl).toBe(
      "https://capture.example",
    );
  });

  it("byokHeaders sends Gemini/Cursor keys only — never captureApiUrl", () => {
    saveByok({
      geminiApiKey: "g-key",
      cursorApiKey: "c-key",
      captureApiUrl: "https://should-not-be-sent.example",
    });
    const headers = new Headers(byokHeaders());
    expect(headers.get(GEMINI_KEY_HEADER)).toBe("g-key");
    expect(headers.get(CURSOR_KEY_HEADER)).toBe("c-key");
    expect(headers.get("x-tell-capture-url")).toBeNull();
    expect([...headers.keys()].some((k) => /capture/i.test(k))).toBe(false);
    // saveByok drops the unused capture override so Settings cannot overclaim
    expect(loadByok().captureApiUrl).toBeUndefined();
    expect(localStorage.getItem(BYOK_STORAGE_KEY)).not.toContain("captureApiUrl");
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
