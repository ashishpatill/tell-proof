import { NextResponse } from "next/server";
import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";
import { hasRemoteCaptureBackend, runDiagnoseRemote } from "@/lib/run-diagnose-remote";
import { demoReport } from "@/lib/demo-report";
import { assertCaptureApiAuthorized } from "@/lib/capture-auth";
import { recordTrainingEvent } from "@/lib/training-data-sink";

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
  return `Capture failed for ${url}.`;
}

/** Treat localhost / 127.0.0.1 as the same host when comparing to the fixture URL. */
function urlsRoughlyEqual(a: string, b: string): boolean {
  try {
    const left = new URL(a);
    const right = new URL(b);
    const host = (h: string) => (h === "127.0.0.1" ? "localhost" : h);
    return (
      host(left.hostname) === host(right.hostname) &&
      left.port === right.port &&
      (left.pathname.replace(/\/$/, "") || "/") === (right.pathname.replace(/\/$/, "") || "/")
    );
  } catch {
    return a.trim() === b.trim();
  }
}

function offlineFallbackAllowed(body: Record<string, unknown>, requestedUrl: string): boolean {
  if (body.allowOfflineFallback === true) return true;
  if (body.offline === true) return true;
  if (process.env.TELL_DIAGNOSE_OFFLINE_FALLBACK === "1") return true;
  return urlsRoughlyEqual(requestedUrl, demoReport.capture.url);
}

export async function POST(request: Request) {
  const unauthorized = assertCaptureApiAuthorized(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const explicitOffline = body.offline === true;
  const url =
    typeof body.url === "string" && body.url.trim()
      ? body.url.trim()
      : demoReport.capture.url;
  const backend = hasRemoteCaptureBackend() ? "remote" : "local";

  return tracer.startActiveSpan("tell.diagnose", async (span: Span) => {
    span.setAttributes({
      "tell.url": url,
      "tell.backend": backend,
    });

    // Explicit offline demo — never pretend this was a live capture of another URL.
    if (explicitOffline) {
      const meta = {
        live: false,
        requestedUrl: url,
        capturedUrl: demoReport.capture.url,
        backend,
        offlineFixture: true,
      };
      recordTrainingEvent("diagnose", { report: demoReport }, meta);
      span.setAttributes({ "tell.live": false, "tell.offline_fixture": true });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return NextResponse.json({ report: demoReport, meta });
    }

    try {
      if (backend === "local" && process.env.VERCEL) {
        throw new Error("TELL_CAPTURE_API_URL is not configured for this Vercel deployment");
      }

      const report = backend === "remote"
        ? await runDiagnoseRemote(url)
        : await import("@/lib/run-diagnose").then(({ runDiagnose }) => runDiagnose(url));

      span.setAttributes({
        "tell.live": true,
        "tell.findings_total": report.findings.length,
        "tell.score_generic": report.score.generic,
        "tell.score_drift": report.score.drift,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      const meta = {
        live: true,
        requestedUrl: url,
        capturedUrl: report.capture.url,
        backend,
      };
      recordTrainingEvent("diagnose", { report }, meta);

      return NextResponse.json({
        report,
        meta,
      });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setAttributes({ "tell.live": false });
      span.end();

      console.error("[/api/diagnose]", error);
      const detail = error instanceof Error ? error.message : String(error);
      const message = captureErrorMessage(url, error, backend);
      const allowFallback = offlineFallbackAllowed(body, url);

      if (!allowFallback) {
        const meta = {
          live: false,
          requestedUrl: url,
          capturedUrl: null as string | null,
          error: message,
          detail,
          backend,
          offlineFixture: false,
        };
        return NextResponse.json({ report: null, meta }, { status: 502 });
      }

      const meta = {
        live: false,
        requestedUrl: url,
        capturedUrl: demoReport.capture.url,
        error: `${message} Showing the offline demo report instead.`,
        detail,
        backend,
        offlineFixture: true,
      };
      recordTrainingEvent("diagnose", { report: demoReport }, meta);
      return NextResponse.json({
        report: demoReport,
        meta,
      });
    }
  });
}
