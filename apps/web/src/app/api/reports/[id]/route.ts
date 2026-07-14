import { NextResponse } from "next/server";
import { loadSharedReport } from "@/lib/report-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const id = context.params.id?.trim() ?? "";
  if (!/^[a-f0-9]{16}$/.test(id)) {
    return NextResponse.json({ error: "Invalid share id." }, { status: 400 });
  }
  const report = await loadSharedReport(id);
  if (!report) return NextResponse.json({ error: "Report not found or expired." }, { status: 404 });
  return NextResponse.json({ report });
}
