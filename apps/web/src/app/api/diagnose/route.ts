import { NextResponse } from "next/server";
import { demoReport } from "@/lib/demo-report";

export async function POST() {
  return NextResponse.json(demoReport);
}
