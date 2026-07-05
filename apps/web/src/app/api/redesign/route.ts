import { NextResponse } from "next/server";
import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";
import { BrandDNA, TellReport } from "@tell/schema";
import { parseDirection, type DirectionPlan } from "@tell/taste";
import { demoReport } from "@/lib/demo-report";
import { proposeWithCursorAgent } from "@/lib/cursor-redesign";
import { collectProjectSources, rankSourcesForReport } from "@/lib/source-worktree";
import { fetchRemoteBackend, hasRemoteBackend } from "@/lib/remote-api";
import { assertRepoSetupEnabled } from "@/lib/setup-guard";

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
  const report = parsedReport.success ? parsedReport.data : demoReport;
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
      const proposal = await proposeWithCursorAgent(
        report,
        direction,
        findingId,
        dna,
        directionPlan?.actionItems,
        directionPlan?.summary ?? directionText,
        ranked?.files,
      );
      span.setAttributes({
        "tell.source_files": sourceContext?.files.length ?? 0,
        "tell.source_bytes": sourceContext?.totalBytes ?? 0,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return NextResponse.json({
        ...proposal,
        sourceContext: sourceContext
          ? {
              filesLoaded: sourceContext.files.length,
              filesDiscovered: sourceContext.scannedFiles,
              matchedFiles: ranked?.matchedFiles ?? 0,
              totalBytes: sourceContext.totalBytes,
              mode: "repo",
            }
          : { filesLoaded: 0, filesDiscovered: 0, matchedFiles: 0, totalBytes: 0, mode: "capture" },
      });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.end();
      throw error;
    }
  });
}
