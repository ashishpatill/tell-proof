import { NextResponse } from "next/server";
import { designFromFeatures, getTemplate } from "@tell/design-skills";
import { recordTrainingEvent } from "@/lib/training-data-sink";

export const runtime = "nodejs";

/**
 * Specimen document for iframe `src` (gallery thumbs + proof frames).
 * Avoids embedding ~200KB HTML × N into the RSC/page payload.
 * No process-lifetime HTML cache — hot reload must reflect craft CSS/render changes.
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
    const { spec, previewHtml } = designFromFeatures(template.brief);
    recordTrainingEvent(
      "design",
      {
        brief: template.brief,
        spec,
        previewHtml,
        showcaseKey: key,
        siteKind: template.brief.siteKind,
        productName: template.brief.productName,
      },
      { via: "api.design.html", showcaseKey: key },
    );
    return new NextResponse(previewHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        Vary: "Accept-Encoding",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Showcase HTML failed";
    return new NextResponse(message, { status: 500 });
  }
}
