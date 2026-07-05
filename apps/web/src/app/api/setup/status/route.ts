import { NextResponse } from "next/server";
import { getJob } from "@/lib/repo-runner";
import { hasRemoteBackend, proxyRemoteBackend } from "@/lib/remote-api";
import { assertRepoSetupEnabled } from "@/lib/setup-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (hasRemoteBackend()) {
    return proxyRemoteBackend(request, `/api/setup/status${url.search}`);
  }

  const blocked = assertRepoSetupEnabled(request);
  if (blocked) return blocked;

  const id = url.searchParams.get("id") ?? "";
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Unknown setup job. Start a new one." }, { status: 404 });
  }
  return NextResponse.json({ job });
}
