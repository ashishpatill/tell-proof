import { NextResponse } from "next/server";
import { loadSharedReport } from "@/lib/report-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const report = await loadSharedReport(context.params.id);
  if (!report) return NextResponse.json({ error: "Report not found or expired." }, { status: 404 });
  return NextResponse.json({ report });
}
