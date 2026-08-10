import { mkdir, readFile, writeFile, copyFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import os from "node:os";
import {
  buildInstallInfo,
  resolvePlatformId,
  platformListHelp,
  type InstallInfo,
  type McpStdioServerConfig,
  type PlatformCompatEntry,
  type PlatformId,
} from "@tell/schema";

export type InstallScope = "project" | "user";

export type McpInstallResult = {
  ok: boolean;
  platform: PlatformId;
  mode: "wrote" | "cli" | "print" | "snippet";
  path?: string;
  created?: boolean;
  command?: string;
  snippet?: string;
  instruction: string;
};

function expandHome(p: string): string {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  if (p === "~") return os.homedir();
  return p;
}

/** Prefer platform-native paths for hosts that diverge on macOS. */
function resolveOsUserPath(platformId: PlatformId, linuxPath: string): string {
  if (os.platform() !== "darwin") return expandHome(linuxPath);
  if (platformId === "cline") {
    return path.join(
      os.homedir(),
      "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    );
  }
  if (platformId === "trae") {
    return path.join(os.homedir(), "Library/Application Support/Trae/mcp.json");
  }
  return expandHome(linuxPath);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function backupOnce(target: string) {
  const backupPath = `${target}.bak`;
  if ((await pathExists(target)) && !(await pathExists(backupPath))) {
    await copyFile(target, backupPath);
  }
}

function tellStdio(info: InstallInfo): McpStdioServerConfig {
  return info.mcp.manual;
}

function findPlatform(info: InstallInfo, id: PlatformId): PlatformCompatEntry {
  const entry = info.platforms.find((p) => p.id === id);
  if (!entry) throw new Error(`Platform ${id} missing from install-info catalog`);
  return entry;
}

function resolveTargetPath(
  entry: PlatformCompatEntry,
  scope: InstallScope,
  cwd: string,
): string | undefined {
  const rel = scope === "user" ? entry.configPath.user : entry.configPath.project;
  if (!rel) {
    const fallback = entry.configPath.user ?? entry.configPath.project;
    if (!fallback) return undefined;
    if (fallback.startsWith("~")) {
      return resolveOsUserPath(entry.id, fallback);
    }
    return path.join(cwd, fallback);
  }
  if (rel.startsWith("~")) return resolveOsUserPath(entry.id, rel);
  return path.join(cwd, rel);
}

async function readJsonObject(target: string): Promise<Record<string, unknown>> {
  if (!(await pathExists(target))) return {};
  const raw = await readFile(target, "utf8");
  // Strip JSON5-ish line comments for OpenClaw-style files that happen to be comment-free JSON.
  const stripped = raw.replace(/^\s*\/\/.*$/gm, "");
  const parsed = JSON.parse(stripped) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as Record<string, unknown>;
}

async function writeJson(target: string, data: unknown) {
  await mkdir(path.dirname(target), { recursive: true });
  await backupOnce(target);
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

async function upsertMcpServersJson(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const existing = await readJsonObject(target);
  const mcpServers = asRecord(existing.mcpServers);
  mcpServers.tell = {
    command: stdio.command,
    args: stdio.args,
    ...(stdio.env ? { env: stdio.env } : {}),
  };
  await writeJson(target, { ...existing, mcpServers });
  return { created };
}

async function upsertVscodeServers(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const existing = await readJsonObject(target);
  const servers = asRecord(existing.servers);
  servers.tell = {
    type: "stdio",
    command: stdio.command,
    args: stdio.args,
    ...(stdio.env ? { env: stdio.env } : {}),
  };
  await writeJson(target, { ...existing, servers });
  return { created };
}

async function upsertZedContextServers(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const existing = await readJsonObject(target);
  const context_servers = asRecord(existing.context_servers);
  context_servers.tell = {
    command: stdio.command,
    args: stdio.args,
    ...(stdio.env ? { env: stdio.env } : {}),
  };
  await writeJson(target, { ...existing, context_servers });
  return { created };
}

async function upsertOpencode(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const existing = await readJsonObject(target);
  const mcp = asRecord(existing.mcp);
  mcp.tell = {
    type: "local",
    command: [stdio.command, ...stdio.args],
    enabled: true,
    ...(stdio.env ? { environment: stdio.env } : {}),
  };
  await writeJson(target, { ...existing, mcp });
  return { created };
}

async function upsertOpenclaw(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const existing = await readJsonObject(target);
  const mcp = asRecord(existing.mcp);
  const servers = asRecord(mcp.servers);
  servers.tell = {
    command: stdio.command,
    args: stdio.args,
    ...(stdio.env ? { env: stdio.env } : {}),
  };
  mcp.servers = servers;
  await writeJson(target, { ...existing, mcp });
  return { created };
}

/** Upsert `[mcp_servers.tell]` in a TOML file without a TOML dependency. */
function upsertTomlMcpServers(content: string, stdio: McpStdioServerConfig): string {
  const block = [
    "[mcp_servers.tell]",
    `command = ${JSON.stringify(stdio.command)}`,
    `args = ${JSON.stringify(stdio.args)}`,
  ];
  if (stdio.env && Object.keys(stdio.env).length > 0) {
    block.push(
      "env = { " +
        Object.entries(stdio.env)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join(", ") +
        " }",
    );
  }
  const replacement = block.join("\n");
  const re = /\[mcp_servers\.tell\][\s\S]*?(?=\n\[|\s*$)/;
  if (re.test(content)) {
    return content.replace(re, `${replacement}\n`).replace(/\n{3,}/g, "\n\n");
  }
  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n\n${replacement}\n` : `${replacement}\n`;
}

async function upsertTomlFile(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const prev = created ? "" : await readFile(target, "utf8");
  await mkdir(path.dirname(target), { recursive: true });
  await backupOnce(target);
  await writeFile(target, upsertTomlMcpServers(prev, stdio), "utf8");
  return { created };
}

/** Minimal YAML upsert for Hermes `mcp_servers.tell` only. */
function upsertYamlMcpServers(content: string, stdio: McpStdioServerConfig): string {
  const tellLines = [
    "  tell:",
    `    command: ${JSON.stringify(stdio.command)}`,
    `    args: [${stdio.args.map((a) => JSON.stringify(a)).join(", ")}]`,
  ];
  if (stdio.env && Object.keys(stdio.env).length > 0) {
    tellLines.push("    env:");
    for (const [k, v] of Object.entries(stdio.env)) {
      tellLines.push(`      ${k}: ${JSON.stringify(v)}`);
    }
  }
  const tellBlock = tellLines.join("\n");

  if (!content.trim()) {
    return `mcp_servers:\n${tellBlock}\n`;
  }

  if (/^mcp_servers:\s*$/m.test(content) || /^mcp_servers:\s*\n/m.test(content)) {
    // Replace existing tell entry under mcp_servers when present.
    const tellRe = /(^mcp_servers:\n)([\s\S]*?)(^  tell:\n(?:    .*\n)*)/m;
    if (tellRe.test(content)) {
      return content.replace(tellRe, `$1$2${tellBlock}\n`);
    }
    // Insert tell as first child of mcp_servers.
    return content.replace(/^mcp_servers:\s*\n/m, `mcp_servers:\n${tellBlock}\n`);
  }

  return `${content.trimEnd()}\n\nmcp_servers:\n${tellBlock}\n`;
}

async function upsertYamlFile(
  target: string,
  stdio: McpStdioServerConfig,
): Promise<{ created: boolean }> {
  const created = !(await pathExists(target));
  const prev = created ? "" : await readFile(target, "utf8");
  await mkdir(path.dirname(target), { recursive: true });
  await backupOnce(target);
  await writeFile(target, upsertYamlMcpServers(prev, stdio), "utf8");
  return { created };
}

function which(bin: string): boolean {
  const result = spawnSync(bin, ["--version"], { encoding: "utf8", timeout: 5000 });
  return result.status === 0 || result.status === 1 || Boolean(result.stdout || result.stderr);
}

async function installClaudeCli(
  entry: PlatformCompatEntry,
  cwd: string,
  printOnly: boolean,
): Promise<McpInstallResult> {
  if (printOnly || !which("claude")) {
    // Write project .mcp.json as durable fallback.
    if (!printOnly) {
      const target = path.join(cwd, ".mcp.json");
      const info = buildInstallInfo();
      const { created } = await upsertMcpServersJson(target, tellStdio(info));
      return {
        ok: true,
        platform: "claude",
        mode: "wrote",
        path: target,
        created,
        snippet: entry.snippet,
        instruction:
          "Wrote project .mcp.json (claude CLI not found). Or run the printed claude mcp add-json one-liner.",
      };
    }
    return {
      ok: true,
      platform: "claude",
      mode: "print",
      snippet: entry.snippet,
      instruction: "Run the Claude Code CLI one-liner, or paste into .mcp.json",
    };
  }

  const info = buildInstallInfo();
  const stdio = tellStdio(info);
  const json = JSON.stringify({
    command: stdio.command,
    args: stdio.args,
    ...(stdio.env ? { env: stdio.env } : {}),
  });
  const result = spawnSync("claude", ["mcp", "add-json", "--scope", "user", "tell", json], {
    encoding: "utf8",
    timeout: 30_000,
  });
  if (result.status !== 0) {
    const target = path.join(cwd, ".mcp.json");
    const { created } = await upsertMcpServersJson(target, stdio);
    return {
      ok: true,
      platform: "claude",
      mode: "wrote",
      path: target,
      created,
      command: entry.snippet,
      instruction: `claude mcp add-json failed (${result.stderr?.trim() || "exit " + String(result.status)}); wrote .mcp.json instead.`,
    };
  }
  return {
    ok: true,
    platform: "claude",
    mode: "cli",
    command: entry.snippet,
    instruction: "Claude Code MCP registered via claude mcp add-json --scope user.",
  };
}

function defaultScope(entry: PlatformCompatEntry, requested?: InstallScope): InstallScope {
  if (requested) return requested;
  if (entry.configPath.project) return "project";
  return "user";
}

export async function installPlatformMcp(options: {
  agent: string;
  cwd: string;
  scope?: InstallScope;
  printOnly?: boolean;
}): Promise<McpInstallResult> {
  const id = resolvePlatformId(options.agent);
  if (!id) {
    throw new Error(
      `Unknown platform "${options.agent}". Supported: ${platformListHelp()}. Aliases: claude-code, grok-build, kimi-code, qwen-code, muse-code, z-code, hermes-agent, pi-agent, cline-vscode.`,
    );
  }

  const info = buildInstallInfo();
  const entry = findPlatform(info, id);
  const stdio = tellStdio(info);
  const printOnly = Boolean(options.printOnly) || entry.strategy === "manual";

  if (printOnly || entry.status === "snippet") {
    return {
      ok: true,
      platform: id,
      mode: entry.status === "snippet" ? "snippet" : "print",
      snippet: entry.snippet,
      instruction: entry.notes ?? `Paste this snippet into ${entry.label} MCP settings.`,
    };
  }

  if (id === "claude" || entry.strategy === "cli") {
    return installClaudeCli(entry, options.cwd, Boolean(options.printOnly));
  }

  const scope = defaultScope(entry, options.scope);
  const target = resolveTargetPath(entry, scope, options.cwd);
  if (!target) {
    return {
      ok: true,
      platform: id,
      mode: "print",
      snippet: entry.snippet,
      instruction: `No config path for scope=${scope}. Use --print or the other scope.`,
    };
  }

  let created = false;
  switch (entry.strategy) {
    case "json-mcpServers":
      ({ created } = await upsertMcpServersJson(target, stdio));
      break;
    case "json-servers":
      ({ created } = await upsertVscodeServers(target, stdio));
      break;
    case "json-context_servers":
      ({ created } = await upsertZedContextServers(target, stdio));
      break;
    case "json-opencode":
      ({ created } = await upsertOpencode(target, stdio));
      break;
    case "json-openclaw":
      ({ created } = await upsertOpenclaw(target, stdio));
      break;
    case "toml-mcp_servers":
      ({ created } = await upsertTomlFile(target, stdio));
      break;
    case "yaml-mcp_servers":
      ({ created } = await upsertYamlFile(target, stdio));
      break;
    default:
      return {
        ok: true,
        platform: id,
        mode: "print",
        snippet: entry.snippet,
        instruction: entry.notes ?? "Print-only platform.",
      };
  }

  return {
    ok: true,
    platform: id,
    mode: "wrote",
    path: target,
    created,
    instruction: `Wired Tell into ${entry.label}. Reload MCP / restart the agent, then run tell_diagnose.`,
  };
}

export function printPlatformCompatibilityMarkdown(info = buildInstallInfo()): string {
  const lines = [
    "# Platform Compatibility",
    "",
    "Tell ships as an MCP server plus CLI. One command wires Tell into each agent’s config:",
    "",
    "```bash",
    "tell mcp install <platform> [--project|--user|--print]",
    "```",
    "",
    "| Coding agent / platform | Status | One-line MCP install |",
    "|---|:---:|---|",
  ];
  for (const p of info.platforms) {
    const status = p.status === "supported" ? "✅ Supported" : "📋 Snippet";
    lines.push(`| ${p.label} | ${status} | \`${p.installCommand}\` |`);
  }
  lines.push(
    "",
    "`tell mcp install <platform> --print` for a dry-run snippet · `tell mcp print-config` for all snippets.",
  );
  return lines.join("\n");
}
