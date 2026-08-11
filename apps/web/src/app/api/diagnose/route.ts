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
  return `Capture failed for ${url}. Fix the URL or capture backend — Tell will not silently swap in the demo fixture.`;
}

export async function POST(request: Request) {
  const unauthorized = assertCaptureApiAuthorized(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const requested = typeof body.url === "string" ? body.url.trim() : "";
  // Explicit empty → offline fixture only when client opts in via ?offline=1 or body.offline
  const wantOffline = body.offline === true || body.mode === "offline";
  if (!requested && !wantOffline) {
    return NextResponse.json(
      {
        report: null,
        meta: {
          live: false,
          requestedUrl: "",
          capturedUrl: "",
          error: "Paste a live URL (or choose Offline fixture). Tell will not invent a demo capture.",
        },
      },
      { status: 400 },
    );
  }

  const url = requested || demoReport.capture.url;
  const backend = hasRemoteCaptureBackend() ? "remote" : "local";

  // Explicit offline load — return the committed fixture without pretending it was live.
  if (wantOffline && !requested) {
    const meta = {
      live: false,
      requestedUrl: demoReport.capture.url,
      capturedUrl: demoReport.capture.url,
      backend,
      fallback: "offline-fixture" as const,
    };
    recordTrainingEvent("diagnose", { report: demoReport }, meta);
    return NextResponse.json({ report: demoReport, meta });
  }

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
      const meta = {
        live: false,
        requestedUrl: url,
        capturedUrl: "",
        error: message,
        detail,
        backend,
      };
      recordTrainingEvent("diagnose", {}, meta);
      // Do NOT return demoReport as if it were the user's site. Offline fixture is opt-in.
      return NextResponse.json(
        {
          report: null,
          meta,
        },
        { status: 502 },
      );
    }
  });
}
