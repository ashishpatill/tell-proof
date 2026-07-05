import { NextResponse } from "next/server";
import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";
import { z } from "zod";
import { BrandDNA, CapturePayload, DesignFingerprint } from "@tell/schema";
import { restyleWithGemini } from "@tell/redesign/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const tracer = trace.getTracer("tell.restyle");

const RestyleBody = z.object({
  capture: CapturePayload,
  fingerprint: DesignFingerprint,
  directionId: z.string().min(1),
  dna: BrandDNA.optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ ok: false, reason: "invalid JSON body" }, { status: 400 });
  }

  const parsed = RestyleBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: `invalid body: ${parsed.error.issues.map((i) => i.message).join("; ")}` },
      { status: 400 },
    );
  }
  const { capture, fingerprint, directionId, dna } = parsed.data;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "GEMINI_API_KEY not configured" });
  }

  return tracer.startActiveSpan("tell.restyle", async (span: Span) => {
    span.setAttributes({
      "tell.restyle.direction": directionId,
      "tell.restyle.has_dna": Boolean(dna),
    });

    try {
      const result = await restyleWithGemini(capture, fingerprint, directionId, dna, {
        apiKey,
        model: process.env.GEMINI_RESTYLE_MODEL?.trim() || "gemini-2.0-flash",
      });

      span.setAttributes({ "tell.restyle.ok": result.ok });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      if (!result.ok) {
        return NextResponse.json({ ok: false, reason: result.reason });
      }
      return NextResponse.json({
        ok: true,
        css: result.css,
        fontImport: result.fontImport,
        cssSource: "llm" as const,
        notes: result.notes,
      });
    } catch (error) {
      // restyleWithGemini never throws, but keep the route bulletproof regardless.
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.end();
      return NextResponse.json({ ok: false, reason: `unexpected error: ${String(error)}` });
    }
  });
}
