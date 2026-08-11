import { NextResponse } from "next/server";
import {
  DesignFromFeaturesRequest,
  briefFromFreeText,
  designFromFeatures,
  getTemplate,
  listTemplates,
} from "@tell/design-skills";
import { ZodError } from "zod";
import { recordTrainingEvent } from "@/lib/training-data-sink";

export const runtime = "nodejs";

function recordDesignResult(
  result: { spec: unknown; previewHtml: string },
  meta: Record<string, unknown>,
): void {
  const brief = (result.spec as { brief?: Record<string, unknown> } | undefined)?.brief;
  recordTrainingEvent(
    "design",
    {
      brief: brief ?? meta.brief ?? null,
      spec: result.spec,
      previewHtml: result.previewHtml,
      showcaseKey: meta.showcaseKey ?? null,
      siteKind: brief?.siteKind ?? meta.siteKind ?? null,
      productName: brief?.productName ?? meta.productName ?? null,
    },
    meta,
  );
}

/**
 * POST { brief, redesignFrom? } → DesignSpec + previewHtml
 * POST { query } → free-text create: niche match → research route → design (implicit Studio)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (typeof body.query === "string" && body.query.trim()) {
      const { brief, plan } = briefFromFreeText(body.query);
      const result = designFromFeatures(brief);
      recordDesignResult(result, {
        via: "api.design.post.query",
        siteKind: brief.siteKind,
        productName: brief.productName,
        nicheKey: plan.nicheKey,
      });
      return NextResponse.json({
        ...result,
        plan: {
          ...plan,
          researchNodes: result.spec.customizationHints.filter((h) =>
            h.startsWith("Research") || h.startsWith("Domain"),
          ),
          routedSkills: result.spec.routedSkills,
          summary: result.spec.summary,
        },
      });
    }

    const parsed = DesignFromFeaturesRequest.parse(
      body.brief !== undefined ? body : { brief: body },
    );
    const result = designFromFeatures(parsed.brief, { redesignFrom: parsed.redesignFrom });
    recordDesignResult(result, {
      via: "api.design.post",
      siteKind: parsed.brief.siteKind,
      productName: parsed.brief.productName,
    });
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
 * GET ?showcase=saas|dashboard|… → research-backed offering
 * GET ?templates=1 → catalog metadata (no HTML) for agents
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
    const result = designFromFeatures(template.brief);
    recordDesignResult(result, {
      via: "api.design.get",
      showcaseKey: key,
      siteKind: template.brief.siteKind,
      productName: template.brief.productName,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Showcase generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
