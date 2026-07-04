import { NextResponse } from "next/server";
import { TellReport } from "@tell/schema";
import { OfflineRedesignGenerator } from "@tell/redesign";
import { parseDirection } from "@tell/taste";
import { demoReport } from "@/lib/demo-report";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsedReport = TellReport.safeParse(body.report);
  const report = parsedReport.success ? parsedReport.data : demoReport;
  const direction = typeof body.direction === "string" ? body.direction : "editorial";
  const findingId = typeof body.findingId === "string" ? body.findingId : undefined;

  const proposal = await new OfflineRedesignGenerator().propose(
    report,
    parseDirection(direction),
    findingId,
  );
  return NextResponse.json(proposal);
}
