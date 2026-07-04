import { NextResponse } from "next/server";
import { stopRunningApp } from "@/lib/repo-runner";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(stopRunningApp());
}
