import { NextResponse } from "next/server";
import { designFromFeatures, getTemplate } from "@tell/design-skills";

export const runtime = "nodejs";

const htmlCache = new Map<string, string>();

/**
 * Lightweight specimen document for iframe `src` (gallery thumbs + proof frames).
 * Avoids embedding ~200KB HTML × N into the RSC/page payload.
 *
 * GET /api/design/html?showcase=saas
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("showcase") ?? "saas";
    const template = getTemplate(key);
    if (!template) {
      return new NextResponse(`Unknown showcase "${key}"`, { status: 404 });
    }
    let previewHtml = htmlCache.get(key);
    if (!previewHtml) {
      previewHtml = designFromFeatures(template.brief).previewHtml;
      htmlCache.set(key, previewHtml);
    }
    return new NextResponse(previewHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        Vary: "Accept-Encoding",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Showcase HTML failed";
    return new NextResponse(message, { status: 500 });
  }
}
