import { NextResponse } from "next/server";
import { revertWorkspacePatch } from "@/lib/source-worktree";
import { hasRemoteBackend, proxyRemoteBackend } from "@/lib/remote-api";
import { assertRepoSetupEnabled } from "@/lib/setup-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (hasRemoteBackend()) {
    return proxyRemoteBackend(request, "/api/proof/revert");
  }

  const blocked = assertRepoSetupEnabled(request);
  if (blocked) return blocked;

  const body = await request.json().catch(() => ({}));
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!jobId) return NextResponse.json({ error: "Missing job id." }, { status: 400 });
  try {
    return NextResponse.json(await revertWorkspacePatch(jobId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
