import { NextResponse } from "next/server";
import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";
import { BrandDNA, TellReport } from "@tell/schema";
import { parseDirection, type DirectionPlan } from "@tell/taste";
import { proposeWithCursorAgent } from "@/lib/cursor-redesign";
import { collectProjectSources, rankSourcesForReport } from "@/lib/source-worktree";
import { fetchRemoteBackend, hasRemoteBackend } from "@/lib/remote-api";
import { assertRepoSetupEnabled } from "@/lib/setup-guard";
import { resolveCursorKey } from "@/lib/byok";
import { recordTrainingEvent } from "@/lib/training-data-sink";

const tracer = trace.getTracer("tell.redesign");

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const body = rawBody
    ? (() => {
        try {
          return JSON.parse(rawBody);
        } catch {
          return {};
        }
      })()
    : {};
  const setupJobId = typeof body.setupJobId === "string" ? body.setupJobId : "";
  if (setupJobId && hasRemoteBackend()) {
    const res = await fetchRemoteBackend("/api/redesign", {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") ?? "application/json" },
      body: rawBody || "{}",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  }
  if (setupJobId) {
    const blocked = assertRepoSetupEnabled(request);
    if (blocked) return blocked;
  }
  const parsedReport = TellReport.safeParse(body.report);
  if (!parsedReport.success) {
    return NextResponse.json(
      {
        error: "Invalid or missing Tell report. Capture a page first, then draft a fix.",
        details: parsedReport.error.flatten(),
      },
      { status: 400 },
    );
  }
  const report = parsedReport.data;
  const directionPlan = body.directionPlan as DirectionPlan | undefined;
  const directionText = typeof body.direction === "string" ? body.direction : directionPlan?.summary ?? "editorial";
  const findingId = typeof body.findingId === "string" ? body.findingId : undefined;
  const parsedDna = BrandDNA.safeParse(body.dna);
  const dna = parsedDna.success ? parsedDna.data : undefined;

  return tracer.startActiveSpan("tell.redesign", async (span: Span) => {
    span.setAttributes({
      "tell.direction": directionText,
      "tell.finding_id": findingId ?? "(all)",
      "tell.has_dna": dna !== undefined,
    });

    try {
      const direction = directionPlan?.artDirection ?? parseDirection(directionText);
      const sourceContext = setupJobId
        ? await collectProjectSources(setupJobId).catch(() => null)
        : null;
      const ranked = sourceContext ? rankSourcesForReport(sourceContext.files, report) : null;
      const { proposal, patchSource } = await proposeWithCursorAgent(
        report,
        direction,
        findingId,
        dna,
        directionPlan?.actionItems,
        directionPlan?.summary ?? directionText,
        ranked?.files,
        resolveCursorKey(request),
      );
      span.setAttributes({
        "tell.source_files": sourceContext?.files.length ?? 0,
        "tell.source_bytes": sourceContext?.totalBytes ?? 0,
        "tell.patch_source": patchSource,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      const sourceContextMeta = sourceContext
        ? {
            filesLoaded: sourceContext.files.length,
            filesDiscovered: sourceContext.scannedFiles,
            matchedFiles: ranked?.matchedFiles ?? 0,
            totalBytes: sourceContext.totalBytes,
            mode: "repo" as const,
          }
        : { filesLoaded: 0, filesDiscovered: 0, matchedFiles: 0, totalBytes: 0, mode: "capture" as const };
      recordTrainingEvent(
        "redesign",
        {
          directionText,
          findingId,
          direction,
          directionPlan: directionPlan ?? null,
          dna: dna ?? null,
          proposal,
          patchSource,
          reportUrl: report.capture.url,
        },
        { setupJobId: setupJobId || null, ...sourceContextMeta },
      );
      return NextResponse.json({
        ...proposal,
        patchSource,
        sourceContext: sourceContextMeta,
      });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.end();
      throw error;
    }
  });
}
