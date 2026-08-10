import { z } from "zod";

/** Local stdio shape — avoid circular import with install-info. */
export type PlatformStdioConfig = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

/**
 * Coding-agent / IDE hosts that can consume Tell as an MCP server.
 * Tell does not spawn these agents as design engines — install only.
 */
export const PlatformId = z.enum([
  "cursor",
  "claude",
  "codex",
  "vscode",
  "windsurf",
  "zed",
  "opencode",
  "cline",
  "kiro",
  "kimi",
  "qwen",
  "pi",
  "grok",
  "trae",
  "antigravity",
  "hermes",
  "openclaw",
  "muse",
  "zcode",
]);
export type PlatformId = z.infer<typeof PlatformId>;
export const PLATFORM_IDS = PlatformId.options;

/** Aliases accepted by `tell mcp install <id>`. */
export const PLATFORM_ALIASES: Record<string, PlatformId> = {
  "claude-code": "claude",
  "grok-build": "grok",
  "kimi-code": "kimi",
  "qwen-code": "qwen",
  "muse-code": "muse",
  "z-code": "zcode",
  "hermes-agent": "hermes",
  "pi-agent": "pi",
  copilot: "vscode",
  "vs-code": "vscode",
  "cline-vscode": "cline",
};

export const PlatformInstallStrategy = z.enum([
  "json-mcpServers",
  "json-servers",
  "json-context_servers",
  "json-opencode",
  "json-openclaw",
  "toml-mcp_servers",
  "yaml-mcp_servers",
  "cli",
  "manual",
]);
export type PlatformInstallStrategy = z.infer<typeof PlatformInstallStrategy>;

export const PlatformCompatEntry = z.object({
  id: PlatformId,
  label: z.string().min(1),
  status: z.enum(["supported", "snippet"]),
  strategy: PlatformInstallStrategy,
  installCommand: z.string().min(1),
  configPath: z.object({
    project: z.string().optional(),
    user: z.string().optional(),
  }),
  /** One-liner or pasteable config fragment for print-config / UI. */
  snippet: z.string().min(1),
  notes: z.string().optional(),
});
export type PlatformCompatEntry = z.infer<typeof PlatformCompatEntry>;

function stdioJson(stdio: PlatformStdioConfig): string {
  return JSON.stringify(
    {
      command: stdio.command,
      args: stdio.args,
      ...(stdio.env ? { env: stdio.env } : {}),
    },
    null,
    2,
  );
}

function mcpServersBlock(stdio: PlatformStdioConfig): string {
  return JSON.stringify({ mcpServers: { tell: JSON.parse(stdioJson(stdio)) } }, null, 2);
}

function tomlBlock(stdio: PlatformStdioConfig): string {
  return [
    "[mcp_servers.tell]",
    `command = ${JSON.stringify(stdio.command)}`,
    `args = ${JSON.stringify(stdio.args)}`,
    ...(stdio.env
      ? [
          "env = { " +
            Object.entries(stdio.env)
              .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
              .join(", ") +
            " }",
        ]
      : []),
  ].join("\n");
}

function yamlBlock(stdio: PlatformStdioConfig): string {
  const lines = [
    "mcp_servers:",
    "  tell:",
    `    command: ${JSON.stringify(stdio.command)}`,
    `    args: [${stdio.args.map((a) => JSON.stringify(a)).join(", ")}]`,
  ];
  if (stdio.env && Object.keys(stdio.env).length > 0) {
    lines.push("    env:");
    for (const [k, v] of Object.entries(stdio.env)) {
      lines.push(`      ${k}: ${JSON.stringify(v)}`);
    }
  }
  return lines.join("\n");
}

function opencodeBlock(stdio: PlatformStdioConfig): string {
  return JSON.stringify(
    {
      mcp: {
        tell: {
          type: "local",
          command: [stdio.command, ...stdio.args],
          enabled: true,
          ...(stdio.env ? { environment: stdio.env } : {}),
        },
      },
    },
    null,
    2,
  );
}

function openclawBlock(stdio: PlatformStdioConfig): string {
  return JSON.stringify(
    {
      mcp: {
        servers: {
          tell: {
            command: stdio.command,
            args: stdio.args,
            ...(stdio.env ? { env: stdio.env } : {}),
          },
        },
      },
    },
    null,
    2,
  );
}

function vscodeBlock(stdio: PlatformStdioConfig): string {
  return JSON.stringify(
    {
      servers: {
        tell: {
          type: "stdio",
          command: stdio.command,
          args: stdio.args,
          ...(stdio.env ? { env: stdio.env } : {}),
        },
      },
    },
    null,
    2,
  );
}

function zedBlock(stdio: PlatformStdioConfig): string {
  return JSON.stringify(
    {
      context_servers: {
        tell: {
          command: stdio.command,
          args: stdio.args,
          ...(stdio.env ? { env: stdio.env } : {}),
        },
      },
    },
    null,
    2,
  );
}

/**
 * Single catalog for README / install-info / `tell mcp install`.
 * Paths use ~ for user home; writers expand at install time.
 */
export function buildPlatformCatalog(stdio: PlatformStdioConfig): PlatformCompatEntry[] {
  const claudeJson = JSON.stringify({
    command: stdio.command,
    args: stdio.args,
    ...(stdio.env ? { env: stdio.env } : {}),
  });

  const entries: PlatformCompatEntry[] = [
    {
      id: "cursor",
      label: "Cursor",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install cursor --project",
      configPath: { project: ".cursor/mcp.json", user: "~/.cursor/mcp.json" },
      snippet: mcpServersBlock(stdio),
      notes: "Also supports Cursor deeplink from install-info.deeplink.cursor",
    },
    {
      id: "claude",
      label: "Claude Code",
      status: "supported",
      strategy: "cli",
      installCommand: "tell mcp install claude",
      configPath: { project: ".mcp.json", user: "~/.claude.json" },
      snippet: `claude mcp add-json --scope user tell '${claudeJson}'`,
      notes: "Falls back to writing project .mcp.json when claude CLI is absent",
    },
    {
      id: "codex",
      label: "Codex CLI",
      status: "supported",
      strategy: "toml-mcp_servers",
      installCommand: "tell mcp install codex --project",
      configPath: { project: ".codex/config.toml", user: "~/.codex/config.toml" },
      snippet: tomlBlock(stdio),
    },
    {
      id: "vscode",
      label: "VS Code + GitHub Copilot",
      status: "supported",
      strategy: "json-servers",
      installCommand: "tell mcp install vscode --project",
      configPath: { project: ".vscode/mcp.json", user: undefined },
      snippet: vscodeBlock(stdio),
    },
    {
      id: "windsurf",
      label: "Windsurf",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install windsurf --user",
      configPath: { user: "~/.codeium/windsurf/mcp_config.json" },
      snippet: mcpServersBlock(stdio),
    },
    {
      id: "zed",
      label: "Zed",
      status: "supported",
      strategy: "json-context_servers",
      installCommand: "tell mcp install zed --project",
      configPath: { project: ".zed/settings.json", user: "~/.config/zed/settings.json" },
      snippet: zedBlock(stdio),
      notes: "Merges context_servers into settings.json",
    },
    {
      id: "opencode",
      label: "OpenCode",
      status: "supported",
      strategy: "json-opencode",
      installCommand: "tell mcp install opencode --project",
      configPath: {
        project: "opencode.json",
        user: "~/.config/opencode/opencode.json",
      },
      snippet: opencodeBlock(stdio),
    },
    {
      id: "cline",
      label: "Cline (VS Code)",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install cline --user",
      configPath: {
        user: "~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      },
      snippet: mcpServersBlock(stdio),
      notes: "macOS uses ~/Library/Application Support/Code/User/globalStorage/…",
    },
    {
      id: "kiro",
      label: "Kiro",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install kiro --project",
      configPath: { project: ".kiro/settings/mcp.json", user: "~/.kiro/settings/mcp.json" },
      snippet: mcpServersBlock(stdio),
    },
    {
      id: "kimi",
      label: "Kimi Code",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install kimi --project",
      configPath: { project: ".kimi-code/mcp.json", user: "~/.kimi-code/mcp.json" },
      snippet: mcpServersBlock(stdio),
    },
    {
      id: "qwen",
      label: "Qwen Code",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install qwen --project",
      configPath: { project: ".qwen/settings.json", user: "~/.qwen/settings.json" },
      snippet: mcpServersBlock(stdio),
    },
    {
      id: "pi",
      label: "Pi Agent",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install pi --user",
      configPath: { project: ".pi/mcp.json", user: "~/.pi/agent/mcp.json" },
      snippet: mcpServersBlock(stdio),
    },
    {
      id: "grok",
      label: "Grok Build",
      status: "supported",
      strategy: "toml-mcp_servers",
      installCommand: "tell mcp install grok --project",
      configPath: { project: ".grok/config.toml", user: "~/.grok/config.toml" },
      snippet: tomlBlock(stdio),
      notes: "Also discovers Cursor/Claude .mcp.json; prefer native toml",
    },
    {
      id: "trae",
      label: "Trae",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install trae --user",
      configPath: { user: "~/.config/Trae/mcp.json" },
      snippet: mcpServersBlock(stdio),
      notes: "macOS: ~/Library/Application Support/Trae/mcp.json",
    },
    {
      id: "antigravity",
      label: "Antigravity",
      status: "supported",
      strategy: "json-mcpServers",
      installCommand: "tell mcp install antigravity --user",
      configPath: {
        project: ".agents/mcp_config.json",
        user: "~/.gemini/antigravity/mcp_config.json",
      },
      snippet: mcpServersBlock(stdio),
    },
    {
      id: "hermes",
      label: "Hermes Agent",
      status: "supported",
      strategy: "yaml-mcp_servers",
      installCommand: "tell mcp install hermes --user",
      configPath: { user: "~/.hermes/config.yaml" },
      snippet: yamlBlock(stdio),
    },
    {
      id: "openclaw",
      label: "OpenClaw",
      status: "supported",
      strategy: "json-openclaw",
      installCommand: "tell mcp install openclaw --user",
      configPath: { user: "~/.openclaw/openclaw.json" },
      snippet: openclawBlock(stdio),
    },
    {
      id: "muse",
      label: "Muse Code",
      status: "snippet",
      strategy: "manual",
      installCommand: "tell mcp install muse --print",
      configPath: {},
      snippet: mcpServersBlock(stdio),
      notes: "No verified public MCP path yet — paste mcpServers into Muse settings if supported",
    },
    {
      id: "zcode",
      label: "Z Code",
      status: "snippet",
      strategy: "manual",
      installCommand: "tell mcp install zcode --print",
      configPath: {},
      snippet: mcpServersBlock(stdio),
      notes: "No verified public MCP path yet — paste mcpServers into Z Code settings if supported",
    },
  ];

  return entries.map((e) => PlatformCompatEntry.parse(e));
}

export function resolvePlatformId(raw: string): PlatformId | undefined {
  const key = raw.trim().toLowerCase();
  if (PLATFORM_ALIASES[key]) return PLATFORM_ALIASES[key];
  const parsed = PlatformId.safeParse(key);
  return parsed.success ? parsed.data : undefined;
}

export function platformListHelp(): string {
  return PLATFORM_IDS.join(", ");
}
