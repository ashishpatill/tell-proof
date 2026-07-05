import { NextResponse } from "next/server";

export function remoteBackendBaseUrl(): string | null {
  const raw = process.env.TELL_CAPTURE_API_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : null;
}

export function hasRemoteBackend(): boolean {
  return remoteBackendBaseUrl() !== null;
}

function repoSetupToken(): string | null {
  const raw = process.env.TELL_REPO_SETUP_TOKEN?.trim();
  return raw || null;
}

export function repoSetupAuthHeaders(headers?: HeadersInit): Headers {
  const out = new Headers(headers);
  const token = repoSetupToken();
  if (token) out.set("x-tell-repo-setup-token", token);
  return out;
}

type RemoteRequestInit = RequestInit & { timeoutMs?: number };

export async function fetchRemoteBackend(pathWithSearch: string, init: RemoteRequestInit = {}): Promise<Response> {
  const base = remoteBackendBaseUrl();
  if (!base) throw new Error("TELL_CAPTURE_API_URL is not configured");

  const { timeoutMs = Number(process.env.TELL_CAPTURE_TIMEOUT_MS ?? 90_000), ...fetchInit } = init;
  return fetch(`${base}${pathWithSearch}`, {
    ...fetchInit,
    cache: "no-store",
    headers: repoSetupAuthHeaders(fetchInit.headers),
    signal: fetchInit.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

export async function proxyRemoteBackend(
  request: Request,
  pathWithSearch: string,
  init: Omit<RemoteRequestInit, "body" | "headers" | "method"> & { method?: string } = {},
): Promise<NextResponse> {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const method = init.method ?? request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  const res = await fetchRemoteBackend(pathWithSearch, {
    ...init,
    method,
    headers,
    body,
  });
  const text = await res.text();
  const responseHeaders = new Headers();
  responseHeaders.set("content-type", res.headers.get("content-type") ?? "application/json");
  return new NextResponse(text, { status: res.status, headers: responseHeaders });
}
