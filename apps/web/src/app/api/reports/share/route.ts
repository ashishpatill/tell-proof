import { NextResponse } from "next/server";
import { TellReport } from "@tell/schema";
import { saveSharedReport } from "@/lib/report-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = TellReport.safeParse(body.report);
  if (!parsed.success) {
    return NextResponse.json({ error: "Report payload is missing or invalid." }, { status: 400 });
  }
  const id = await saveSharedReport(parsed.data);
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    id,
    url: `${origin}/report/${id}`,
    expiresNote: "Hosted on this instance until cleared. Use for review handoff, not long-term archive.",
  });
}
