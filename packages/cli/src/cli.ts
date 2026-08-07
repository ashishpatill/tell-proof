import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createServer } from "node:net";
import {
  buildInstallInfo,
  type InstallInfo,
  type McpStdioServerConfig,
  TellReport,
} from "@tell/schema";

type CursorInstallScope = "project" | "user";

/** Walk up from cwd (and this file) until we find the Tell monorepo root. */
function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml")) && existsSync(path.join(dir, "packages"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function usage(): never {
  console.log(`tell — Tell CLI (mirrors MCP / HTTP)

Usage:
  tell diagnose [--url <url>] [--out <file>]
  tell voice --text <direction>
  tell install-info [--json]
  tell mcp print-config
  tell mcp install cursor [--project|--user]
  tell doctor
  tell help
`);
  process.exit(1);
}

/** Strip leading `--` inserted by some pnpm wrappers. */
function normalizeArgv(argv: string[]): string[] {
  return argv[0] === "--" ? argv.slice(1) : argv;
}

function argValue(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx < 0) return undefined;
  return args[idx + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

async function cmdDiagnose(args: string[]) {
  const { captureUrl, diagnoseCapture } = await import("@tell/core");
  const { classifyWithTaste } = await import("@tell/taste");
  const root = findRepoRoot();
  const url = argValue(args, "--url") ?? process.env.TELL_FIXTURE_URL ?? "http://localhost:3001";
  const out = argValue(args, "--out");
  const artifactRel = process.env.TELL_REPORT_ARTIFACT ?? "fixtures/reports/tell-report.json";
  const artifact = path.isAbsolute(artifactRel) ? artifactRel : path.join(root, artifactRel);
  try {
    const capture = await captureUrl(url);
    const base = diagnoseCapture(capture);
    const verdicts = await classifyWithTaste(base.findings, base.fingerprint, {
      apiKey: process.env.GEMINI_API_KEY,
    });
    const report = TellReport.parse({
      ...base,
      verdicts,
      score: {
        total: base.findings.length,
        generic: verdicts.filter((v) => v.verdict === "generic").length,
        drift: verdicts.filter((v) => v.verdict === "drift").length,
        intentional: verdicts.filter((v) => v.verdict === "intentional").length,
        uncertain: verdicts.filter((v) => v.verdict === "uncertain").length,
      },
    });
    const text = JSON.stringify(report, null, 2);
    if (out) await writeFile(out, text, "utf8");
    else console.log(text);
  } catch (error) {
    console.error(`[tell diagnose] live capture failed; falling back to ${artifact}`);
    console.error(error instanceof Error ? error.message : String(error));
    const raw = await readFile(artifact, "utf8");
    const text = JSON.stringify(TellReport.parse(JSON.parse(raw)), null, 2);
    if (out) await writeFile(out, text, "utf8");
    else console.log(text);
    process.exitCode = 2;
  }
}

async function cmdVoice(args: string[]) {
  const { parseDirectionPlan } = await import("@tell/taste");
  const text = argValue(args, "--text") ?? argValue(args, "--transcript");
  if (!text) {
    console.error("tell voice requires --text <direction>");
    process.exit(1);
  }
  console.log(JSON.stringify({ ...parseDirectionPlan(text), source: "local" }, null, 2));
}

function cmdInstallInfo(args: string[]) {
  const info = buildInstallInfo();
  if (hasFlag(args, "--markdown")) {
    console.log(printInstallSnippets(info));
    return;
  }
  console.log(JSON.stringify(info, null, 2));
}

function printInstallSnippets(info: InstallInfo): string {
  return [
    "# Tell MCP install snippets",
    "",
    "## Cursor deeplink",
    info.deeplink.cursor,
    "",
    "## Cursor mcp.json",
    JSON.stringify(info.mcp.cursor, null, 2),
    "",
    "## Claude Code",
    info.mcp.claudeCli,
    "",
    "## Codex",
    info.mcp.codexToml,
  ].join("\n");
}

function cursorMcpPath(cwd: string, scope: CursorInstallScope): string {
  if (scope === "project") return path.join(cwd, ".cursor", "mcp.json");
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".cursor", "mcp.json");
}

async function installCursorMcp(scope: CursorInstallScope) {
  const cwd = findRepoRoot();
  const info = buildInstallInfo();
  const tellConfig = info.mcp.cursor.mcpServers.tell as McpStdioServerConfig;
  const target = cursorMcpPath(cwd, scope);
  const created = !existsSync(target);
  if (!created) {
    const backupPath = `${target}.bak`;
    if (!existsSync(backupPath)) await copyFile(target, backupPath);
  }
  await mkdir(path.dirname(target), { recursive: true });
  let existing: Record<string, unknown> = {};
  if (!created) {
    existing = JSON.parse(await readFile(target, "utf8")) as Record<string, unknown>;
  }
  const mcpServers =
    existing.mcpServers && typeof existing.mcpServers === "object" && !Array.isArray(existing.mcpServers)
      ? { ...(existing.mcpServers as Record<string, unknown>) }
      : {};
  mcpServers.tell = tellConfig;
  await writeFile(target, `${JSON.stringify({ ...existing, mcpServers }, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        ok: true,
        path: target,
        scope,
        created,
        deeplink: info.deeplink.cursor,
        instruction: "Reload Cursor MCP servers, then run tell_diagnose on http://localhost:3001.",
      },
      null,
      2,
    ),
  );
}

async function cmdMcp(args: string[]) {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === "print-config") {
    console.log(printInstallSnippets(buildInstallInfo()));
    return;
  }
  if (sub === "install") {
    const agent = rest[0];
    if (agent !== "cursor") {
      console.error(`Unsupported agent "${agent ?? ""}". Supported: cursor (others: tell mcp print-config)`);
      process.exit(1);
    }
    const scope: CursorInstallScope = hasFlag(rest, "--user") ? "user" : "project";
    await installCursorMcp(scope);
    return;
  }
  usage();
}

async function portFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function cmdDoctor() {
  const root = findRepoRoot();
  const checks: Array<{ id: string; ok: boolean; detail: string }> = [];
  const nodeMajor = Number(process.versions.node.split(".")[0] ?? 0);
  checks.push({
    id: "node",
    ok: nodeMajor >= 20,
    detail: `Node ${process.versions.node} (need >=20)`,
  });

  checks.push({
    id: "repo",
    ok: existsSync(path.join(root, "pnpm-workspace.yaml")),
    detail: existsSync(path.join(root, "pnpm-workspace.yaml"))
      ? `monorepo root ${root}`
      : "Run tell from the Tell monorepo (or a child package)",
  });

  const mcpProject = path.join(root, ".cursor", "mcp.json");
  checks.push({
    id: "mcp-config",
    ok: existsSync(mcpProject),
    detail: existsSync(mcpProject)
      ? `.cursor/mcp.json present`
      : `Missing .cursor/mcp.json — run: tell mcp install cursor --project`,
  });

  const offlineRel = process.env.TELL_REPORT_ARTIFACT ?? "fixtures/reports/tell-report.json";
  const offline = path.isAbsolute(offlineRel) ? offlineRel : path.join(root, offlineRel);
  checks.push({
    id: "offline-report",
    ok: existsSync(offline),
    detail: existsSync(offline) ? offline : `Missing ${offline}`,
  });

  const p3000 = await portFree(3000);
  const p3001 = await portFree(3001);
  checks.push({
    id: "port-3000",
    ok: true,
    detail: p3000 ? "3000 free (start with pnpm dev)" : "3000 in use (ok if Tell web is running)",
  });
  checks.push({
    id: "port-3001",
    ok: true,
    detail: p3001 ? "3001 free (start with pnpm dev:fixture)" : "3001 in use (ok if fixture is running)",
  });

  const info = buildInstallInfo();
  const allOk = checks.every((c) => c.ok);
  console.log(JSON.stringify({ ok: allOk, checks, install: { deeplink: info.deeplink.cursor, cli: info.cli } }, null, 2));
  if (!allOk) process.exitCode = 1;
}

async function main() {
  const args = normalizeArgv(process.argv.slice(2));
  const [cmd, ...rest] = args;
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") usage();
  if (cmd === "diagnose") return cmdDiagnose(rest);
  if (cmd === "voice") return cmdVoice(rest);
  if (cmd === "install-info") return cmdInstallInfo(rest);
  if (cmd === "mcp") return cmdMcp(rest);
  if (cmd === "doctor") return cmdDoctor();
  usage();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
