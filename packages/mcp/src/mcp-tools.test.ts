import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MCP_TOOL_NAMES } from "@tell/schema";
import { REGISTERED_MCP_TOOLS } from "../src/registered-tools";

describe("MCP tool drift guard", () => {
  it("registered tools match schema enum order and membership", () => {
    expect([...REGISTERED_MCP_TOOLS]).toEqual([...MCP_TOOL_NAMES]);
  });

  it("packages/mcp/src/index.ts registers every schema tool", () => {
    const src = readFileSync(path.resolve(__dirname, "../src/index.ts"), "utf8");
    for (const name of MCP_TOOL_NAMES) {
      expect(src).toContain(`"${name}"`);
    }
  });
});
