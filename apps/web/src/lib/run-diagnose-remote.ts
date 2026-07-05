import { TellReport } from "@tell/schema";
import { fetchRemoteBackend, hasRemoteBackend, remoteBackendBaseUrl } from "./remote-api";

/** When set (e.g. on Vercel), proxy capture to a remote Docker backend. */
export function hasRemoteCaptureBackend(): boolean {
  return hasRemoteBackend();
}

export async function runDiagnoseRemote(url: string): Promise<TellReport> {
  const base = remoteBackendBaseUrl();
  if (!base) {
    throw new Error("TELL_CAPTURE_API_URL is not configured");
  }

  const res = await fetchRemoteBackend("/api/diagnose", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Capture backend ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const payload = (await res.json()) as { report?: unknown; meta?: { live?: boolean } };
  if (!payload.report) {
    throw new Error("Capture backend returned no report");
  }
  if (payload.meta?.live === false) {
    throw new Error("Capture backend fell back to offline demo");
  }

  return TellReport.parse(payload.report);
}
