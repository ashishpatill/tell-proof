import { NextResponse } from "next/server";

export const CAPTURE_TOKEN_HEADER = "x-tell-capture-token";

export function captureApiToken(): string | null {
  const raw = process.env.TELL_CAPTURE_API_TOKEN?.trim();
  return raw || null;
}

/** When TELL_CAPTURE_API_TOKEN is set, require Bearer or x-tell-capture-token. */
export function assertCaptureApiAuthorized(request: Request): NextResponse | null {
  const expected = captureApiToken();
  if (!expected) return null;

  const auth = request.headers.get("authorization");
  const bearer = auth?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const header = request.headers.get(CAPTURE_TOKEN_HEADER)?.trim();
  const got = bearer || header;
  if (got && got === expected) return null;

  return NextResponse.json(
    {
      error: "Capture host refused the request — check TELL_CAPTURE_API_TOKEN on web and capture.",
    },
    { status: 401 },
  );
}
