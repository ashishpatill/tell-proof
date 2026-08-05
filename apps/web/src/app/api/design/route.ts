import { NextResponse } from "next/server";
import {
  DesignFromFeaturesRequest,
  designFromFeatures,
  getTemplate,
  listTemplates,
} from "@tell/design-skills";
import { ZodError } from "zod";

export const runtime = "nodejs";

/** POST { brief, redesignFrom? } → DesignSpec + previewHtml (deterministic skill graph). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = DesignFromFeaturesRequest.parse(
      body.brief !== undefined ? body : { brief: body },
    );
    const result = designFromFeatures(parsed.brief, { redesignFrom: parsed.redesignFrom });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid design brief", details: err.flatten() },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Design generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET ?showcase=saas|dashboard|corporate|educational → research-backed offering
 * GET ?templates=1 → catalog metadata (no HTML) for Studio / agents
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("templates") === "1") {
      return NextResponse.json({
        templates: listTemplates().map(({ key, label, marketJob, siteKind, researchBasis }) => ({
          key,
          label,
          marketJob,
          siteKind,
          researchBasis,
        })),
      });
    }
    const key = url.searchParams.get("showcase") ?? "saas";
    const template = getTemplate(key);
    if (!template) {
      return NextResponse.json({ error: `Unknown showcase "${key}"` }, { status: 404 });
    }
    return NextResponse.json(designFromFeatures(template.brief));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Showcase generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
