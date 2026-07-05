import { NextResponse } from "next/server";
import { stopRunningApp } from "@/lib/repo-runner";
import { hasRemoteBackend, proxyRemoteBackend } from "@/lib/remote-api";
import { assertRepoSetupEnabled } from "@/lib/setup-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (hasRemoteBackend()) {
    return proxyRemoteBackend(request, "/api/setup/stop");
  }

  const blocked = assertRepoSetupEnabled(request);
  if (blocked) return blocked;

  return NextResponse.json(stopRunningApp());
}
