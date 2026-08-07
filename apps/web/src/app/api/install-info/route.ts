import { NextResponse } from "next/server";
import { buildInstallInfo } from "@tell/schema";

/** Single source of truth for MCP/CLI install snippets (docs/11). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const launch = url.searchParams.get("launch") === "tell-mcp" ? "tell-mcp" : "pnpm";
  const info = buildInstallInfo({
    launch,
    fixtureUrl: process.env.TELL_FIXTURE_URL?.trim() || undefined,
    webUrl: process.env.TELL_WEB_URL?.trim() || undefined,
    offlineReportPath: process.env.TELL_REPORT_ARTIFACT?.trim() || undefined,
  });
  return NextResponse.json(info);
}
