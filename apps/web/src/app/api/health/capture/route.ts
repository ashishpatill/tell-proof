import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Quick Playwright sanity check on the capture server. */
export async function GET() {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return NextResponse.json({
      ok: true,
      playwrightBrowsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH ?? "(default)",
      tellRepoRoot: process.env.TELL_REPO_ROOT ?? "(auto)",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        playwrightBrowsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH ?? "(default)",
      },
      { status: 500 },
    );
  }
}
