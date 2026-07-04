import { NextResponse } from "next/server";
import { parseDirectionPlan, parseDirectionWithGemini } from "@tell/taste";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";

  if (!transcript) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const plan = apiKey
    ? await parseDirectionWithGemini(transcript, apiKey)
    : parseDirectionPlan(transcript);

  return NextResponse.json(plan);
}
