import { describe, expect, it } from "vitest";
import { buildInstallInfo, InstallInfo, MCP_TOOL_NAMES, McpToolName } from "../src/install-info";

describe("buildInstallInfo", () => {
  it("returns schema-valid install info with all MCP tools", () => {
    const info = buildInstallInfo();
    expect(InstallInfo.parse(info).mcp.tools).toEqual([...MCP_TOOL_NAMES]);
    expect(info.mcp.cursor.mcpServers.tell?.command).toBe("pnpm");
    expect(info.deeplink.cursor.startsWith("cursor://")).toBe(true);
    expect(info.deeplink.cursor).toContain("config=");
  });

  it("supports tell-mcp launch mode", () => {
    const info = buildInstallInfo({ launch: "tell-mcp" });
    expect(info.mcp.manual.command).toBe("tell-mcp");
    expect(info.mcp.vscode.servers.tell?.command).toBe("tell-mcp");
  });
});

describe("McpToolName", () => {
  it("includes voice and install_info", () => {
    expect(McpToolName.options).toContain("tell_voice");
    expect(McpToolName.options).toContain("tell_install_info");
    expect(McpToolName.options).toContain("tell_resolve_intent");
    expect(MCP_TOOL_NAMES).toHaveLength(11);
  });
});
