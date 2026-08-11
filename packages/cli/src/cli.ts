import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createServer } from "node:net";
import {
  buildInstallInfo,
  platformListHelp,
  type InstallInfo,
  resolveIntent,
  TellReport,
} from "@tell/schema";
import { installPlatformMcp, printPlatformCompatibilityMarkdown } from "./mcp-install.js";

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
  tell diagnose [--url <url>] [--out <file>] [--fallback]
  tell voice --text <direction>
  tell resolve --text <input>
  tell install-info [--json|--markdown]
  tell mcp print-config
  tell mcp platforms
  tell mcp install <platform> [--project|--user|--print]
  tell doctor
  tell help

Platforms: ${platformListHelp()}
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
  const allowFallback =
    hasFlag(args, "--fallback") || process.env.TELL_DIAGNOSE_OFFLINE_FALLBACK === "1";
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
        generic: verdicts.filter((v: { verdict: string }) => v.verdict === "generic").length,
        drift: verdicts.filter((v: { verdict: string }) => v.verdict === "drift").length,
        intentional: verdicts.filter((v: { verdict: string }) => v.verdict === "intentional").length,
        uncertain: verdicts.filter((v: { verdict: string }) => v.verdict === "uncertain").length,
      },
    });
    const text = JSON.stringify(report, null, 2);
    if (out) await writeFile(out, text, "utf8");
    else console.log(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[tell diagnose] live capture failed for ${url}`);
    console.error(detail);
    if (!allowFallback) {
      console.error("Pass --fallback (or TELL_DIAGNOSE_OFFLINE_FALLBACK=1) to emit the offline fixture.");
      console.log(JSON.stringify({ ok: false, live: false, url, error: detail }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.error(`[tell diagnose] emitting offline fixture from ${artifact}`);
    const raw = await readFile(artifact, "utf8");
    const text = JSON.stringify(TellReport.parse(JSON.parse(raw)), null, 2);
    if (out) await writeFile(out, text, "utf8");
    else console.log(text);
    process.exitCode = 2;
  }
}

async function cmdVoice(args: string[]) {
  const { parseDirectionPlan, parseDirectionWithGemini } = await import("@tell/taste");
  const text = argValue(args, "--text") ?? argValue(args, "--transcript");
  if (!text) {
    console.error("tell voice requires --text <direction>");
    process.exit(1);
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    const plan = await parseDirectionWithGemini(text, apiKey);
    console.log(JSON.stringify({ ...plan, source: "gemini" }, null, 2));
    return;
  }
  console.log(JSON.stringify({ ...parseDirectionPlan(text), source: "local" }, null, 2));
}

function cmdResolve(args: string[]) {
  const text = argValue(args, "--text");
  if (!text) {
    console.error("tell resolve requires --text <input>");
    process.exit(1);
  }
  const fixtureUrl = argValue(args, "--fixture-url") ?? process.env.TELL_FIXTURE_URL ?? "http://localhost:3001";
  console.log(JSON.stringify(resolveIntent(text, { fixtureUrl }), null, 2));
}

function cmdInstallInfo(args: string[]) {
  const info = buildInstallInfo();
  if (hasFlag(args, "--markdown")) {
    console.log(printPlatformCompatibilityMarkdown(info));
    console.log("");
    console.log(printInstallSnippets(info));
    return;
  }
  console.log(JSON.stringify(info, null, 2));
}

function printInstallSnippets(info: InstallInfo): string {
  const platformSnippets = info.platforms
    .map((p) => [`## ${p.label} (\`${p.id}\`)`, p.installCommand, "", p.snippet, ""].join("\n"))
    .join("\n");
  return [
    "# Tell MCP install snippets",
    "",
    "## Cursor deeplink",
    info.deeplink.cursor,
    "",
    platformSnippets.trimEnd(),
  ].join("\n");
}

async function cmdMcp(args: string[]) {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === "print-config") {
    console.log(printInstallSnippets(buildInstallInfo()));
    return;
  }
  if (sub === "platforms") {
    console.log(printPlatformCompatibilityMarkdown(buildInstallInfo()));
    return;
  }
  if (sub === "install") {
    const agent = rest[0];
    if (!agent) {
      console.error(`Missing platform. Supported: ${platformListHelp()}`);
      process.exit(1);
    }
    const scope: CursorInstallScope | undefined = hasFlag(rest, "--user")
      ? "user"
      : hasFlag(rest, "--project")
        ? "project"
        : undefined;
    try {
      const result = await installPlatformMcp({
        agent,
        cwd: findRepoRoot(),
        scope,
        printOnly: hasFlag(rest, "--print"),
      });
      console.log(JSON.stringify(result, null, 2));
      if (result.snippet && (result.mode === "print" || result.mode === "snippet")) {
        console.error("\n--- snippet ---\n" + result.snippet);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
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

  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(path.join(root, "package.json"));
    const { chromium } = require("playwright") as typeof import("playwright");
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    checks.push({
      id: "playwright-chromium",
      ok: true,
      detail: "Chromium launches (live capture ready)",
    });
  } catch (error) {
    checks.push({
      id: "playwright-chromium",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (!p3000) {
    try {
      const res = await fetch("http://127.0.0.1:3000/api/health/capture", {
        signal: AbortSignal.timeout(8_000),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      checks.push({
        id: "capture-health",
        ok: res.ok && payload.ok === true,
        detail: res.ok && payload.ok === true
          ? "GET /api/health/capture ok"
          : `health/capture ${res.status}${payload.error ? `: ${payload.error}` : ""}`,
      });
    } catch (error) {
      checks.push({
        id: "capture-health",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    checks.push({
      id: "capture-health",
      ok: true,
      detail: "skipped (Tell web not listening on 3000)",
    });
  }

  const info = buildInstallInfo();
  const allOk = checks.every((c) => c.ok);
  console.log(
    JSON.stringify(
      {
        ok: allOk,
        checks,
        platforms: info.platforms.map((p) => ({ id: p.id, status: p.status })),
        install: { deeplink: info.deeplink.cursor, cli: info.cli },
      },
      null,
      2,
    ),
  );
  if (!allOk) process.exitCode = 1;
}

async function main() {
  const args = normalizeArgv(process.argv.slice(2));
  const [cmd, ...rest] = args;
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") usage();
  if (cmd === "diagnose") return cmdDiagnose(rest);
  if (cmd === "voice") return cmdVoice(rest);
  if (cmd === "resolve") return cmdResolve(rest);
  if (cmd === "install-info") return cmdInstallInfo(rest);
  if (cmd === "mcp") return cmdMcp(rest);
  if (cmd === "doctor") return cmdDoctor();
  usage();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
