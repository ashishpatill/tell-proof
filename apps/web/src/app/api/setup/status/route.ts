import { NextResponse } from "next/server";
import { getJob } from "@/lib/repo-runner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Unknown setup job. Start a new one." }, { status: 404 });
  }
  return NextResponse.json({ job });
}
