import { NextResponse } from "next/server";
import { OfflineRedesignGenerator } from "@tell/redesign";
import { parseDirection } from "@tell/taste";
import { demoReport } from "@/lib/demo-report";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const proposal = await new OfflineRedesignGenerator().propose(
    demoReport,
    parseDirection(body.direction ?? "editorial"),
    body.findingId,
  );
  return NextResponse.json(proposal);
}
