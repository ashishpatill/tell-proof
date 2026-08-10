import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { installPlatformMcp } from "../src/mcp-install";

describe("installPlatformMcp", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "tell-mcp-install-"));
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("writes Cursor project mcp.json", async () => {
    const result = await installPlatformMcp({ agent: "cursor", cwd: tmp, scope: "project" });
    expect(result.mode).toBe("wrote");
    expect(result.path).toBe(path.join(tmp, ".cursor", "mcp.json"));
    const raw = JSON.parse(await readFile(result.path!, "utf8")) as {
      mcpServers: { tell: { command: string } };
    };
    expect(raw.mcpServers.tell.command).toBe("pnpm");
  });

  it("writes OpenCode local mcp entry", async () => {
    const result = await installPlatformMcp({ agent: "opencode", cwd: tmp, scope: "project" });
    const raw = JSON.parse(await readFile(result.path!, "utf8")) as {
      mcp: { tell: { type: string; command: string[] } };
    };
    expect(raw.mcp.tell.type).toBe("local");
    expect(raw.mcp.tell.command[0]).toBe("pnpm");
  });

  it("writes Codex toml mcp_servers.tell", async () => {
    const result = await installPlatformMcp({ agent: "codex", cwd: tmp, scope: "project" });
    const text = await readFile(result.path!, "utf8");
    expect(text).toContain("[mcp_servers.tell]");
    expect(text).toContain('command = "pnpm"');
  });

  it("writes Grok Build toml", async () => {
    const result = await installPlatformMcp({ agent: "grok-build", cwd: tmp, scope: "project" });
    expect(result.platform).toBe("grok");
    const text = await readFile(result.path!, "utf8");
    expect(text).toContain("[mcp_servers.tell]");
  });

  it("merges OpenClaw mcp.servers without clobbering siblings", async () => {
    const targetDir = path.join(tmp, ".openclaw");
    await mkdir(targetDir, { recursive: true });
    // Point HOME so --user writes into tmp
    const prevHome = process.env.HOME;
    process.env.HOME = tmp;
    try {
      await writeFile(
        path.join(targetDir, "openclaw.json"),
        JSON.stringify({ mcp: { servers: { other: { command: "echo" } } }, keep: true }, null, 2),
        "utf8",
      );
      const result = await installPlatformMcp({ agent: "openclaw", cwd: tmp, scope: "user" });
      const raw = JSON.parse(await readFile(result.path!, "utf8")) as {
        keep: boolean;
        mcp: { servers: Record<string, { command: string }> };
      };
      expect(raw.keep).toBe(true);
      expect(raw.mcp.servers.other?.command).toBe("echo");
      expect(raw.mcp.servers.tell?.command).toBe("pnpm");
    } finally {
      process.env.HOME = prevHome;
    }
  });

  it("prints snippet for muse without writing", async () => {
    const result = await installPlatformMcp({ agent: "muse-code", cwd: tmp });
    expect(result.mode).toBe("snippet");
    expect(result.snippet).toContain("mcpServers");
  });

  it("rejects unknown platforms", async () => {
    await expect(installPlatformMcp({ agent: "not-a-real-agent", cwd: tmp })).rejects.toThrow(
      /Unknown platform/,
    );
  });
});
