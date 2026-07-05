import { NextResponse } from "next/server";
import { isRepoSetupEnabled } from "./repo-root";

export function repoSetupDisabledResponse(message?: string, status = 503) {
  return NextResponse.json(
    {
      error:
        message ??
        "GitHub repo setup is disabled in this deployment. Paste a live URL instead, or run Tell locally for clone-and-run.",
    },
    { status },
  );
}

export function assertRepoSetupEnabled(request?: Request) {
  if (!isRepoSetupEnabled()) {
    return repoSetupDisabledResponse();
  }
  const token = process.env.TELL_REPO_SETUP_TOKEN?.trim();
  if (process.env.NODE_ENV === "production" && !token) {
    return repoSetupDisabledResponse(
      "GitHub repo setup needs TELL_REPO_SETUP_TOKEN in production so only the trusted Vercel proxy can run clone-and-run jobs.",
    );
  }
  if (token && request?.headers.get("x-tell-repo-setup-token") !== token) {
    return repoSetupDisabledResponse("This repo setup endpoint requires the trusted Tell proxy.", 401);
  }
  return null;
}
