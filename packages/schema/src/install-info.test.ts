import { describe, expect, it } from "vitest";
import { buildInstallInfo, InstallInfo, MCP_TOOL_NAMES, McpToolName } from "../src/install-info";
import {
  buildPlatformCatalog,
  PLATFORM_IDS,
  resolvePlatformId,
} from "../src/platform-compat";

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

  it("includes platform compatibility catalog for requested agents", () => {
    const info = buildInstallInfo();
    expect(info.platforms.map((p) => p.id).sort()).toEqual([...PLATFORM_IDS].sort());
    const required = [
      "grok",
      "cursor",
      "codex",
      "claude",
      "pi",
      "opencode",
      "kiro",
      "muse",
      "qwen",
      "kimi",
      "zcode",
      "trae",
      "cline",
      "hermes",
      "antigravity",
      "openclaw",
    ];
    for (const id of required) {
      expect(info.platforms.some((p) => p.id === id)).toBe(true);
    }
    expect(info.platforms.filter((p) => p.status === "supported").length).toBeGreaterThanOrEqual(15);
    expect(info.cli.tellMcpInstall).toContain("tell mcp install");
  });
});

describe("platform aliases", () => {
  it("resolves common aliases", () => {
    expect(resolvePlatformId("claude-code")).toBe("claude");
    expect(resolvePlatformId("grok-build")).toBe("grok");
    expect(resolvePlatformId("kimi-code")).toBe("kimi");
    expect(resolvePlatformId("z-code")).toBe("zcode");
    expect(resolvePlatformId("hermes-agent")).toBe("hermes");
    expect(resolvePlatformId("unknown-agent")).toBeUndefined();
  });
});

describe("buildPlatformCatalog", () => {
  it("marks muse and zcode as snippet-only until paths are verified", () => {
    const catalog = buildPlatformCatalog({ command: "pnpm", args: ["-F", "@tell/mcp", "start"] });
    expect(catalog.find((p) => p.id === "muse")?.status).toBe("snippet");
    expect(catalog.find((p) => p.id === "zcode")?.status).toBe("snippet");
    expect(catalog.find((p) => p.id === "opencode")?.snippet).toContain('"type": "local"');
    expect(catalog.find((p) => p.id === "hermes")?.snippet).toContain("mcp_servers:");
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
