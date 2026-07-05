import { NextResponse } from "next/server";
import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";
import { runDiagnose } from "@/lib/run-diagnose";
import { hasRemoteCaptureBackend, runDiagnoseRemote } from "@/lib/run-diagnose-remote";
import { demoReport } from "@/lib/demo-report";

/** A remote capture backend can take ~90s (Playwright cold start). */
export const maxDuration = 90;

const tracer = trace.getTracer("tell.diagnose");

function captureErrorMessage(url: string, error: unknown, backend: "remote" | "local") {
  const detail = error instanceof Error ? error.message : String(error);
  if (backend === "local" && process.env.VERCEL) {
    return `Live capture for ${url} needs a Playwright capture backend. Set TELL_CAPTURE_API_URL on Vercel and redeploy.`;
  }
  if (/ERR_CONNECTION_REFUSED|ECONNREFUSED/i.test(detail)) {
    return `Tell could not reach ${url}. The dev server is not responding yet.`;
  }
  if (/Timeout|timed out|timeout/i.test(detail)) {
    return `Capture timed out while waiting for ${url}. The page may still be compiling or stuck loading.`;
  }
  return `Capture failed for ${url}. The offline demo report is showing instead.`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : demoReport.capture.url;
  const backend = hasRemoteCaptureBackend() ? "remote" : "local";

  return tracer.startActiveSpan("tell.diagnose", async (span: Span) => {
    span.setAttributes({
      "tell.url": url,
      "tell.backend": backend,
    });

    try {
      if (backend === "local" && process.env.VERCEL) {
        throw new Error("TELL_CAPTURE_API_URL is not configured for this Vercel deployment");
      }

      const report = backend === "remote"
        ? await runDiagnoseRemote(url)
        : await runDiagnose(url);

      span.setAttributes({
        "tell.live": true,
        "tell.findings_total": report.findings.length,
        "tell.score_generic": report.score.generic,
        "tell.score_drift": report.score.drift,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return NextResponse.json({
        report,
        meta: {
          live: true,
          requestedUrl: url,
          capturedUrl: report.capture.url,
          backend,
        },
      });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setAttributes({ "tell.live": false });
      span.end();

      console.error("[/api/diagnose]", error);
      const detail = error instanceof Error ? error.message : String(error);
      const message = captureErrorMessage(url, error, backend);
      return NextResponse.json({
        report: demoReport,
        meta: { live: false, requestedUrl: url, capturedUrl: demoReport.capture.url, error: message, detail, backend },
      });
    }
  });
}
