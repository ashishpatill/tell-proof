import { NextResponse } from "next/server";
import { DesignBrief, DesignFromFeaturesRequest, DesignSpec, designFromFeatures } from "@tell/design-skills";

export const runtime = "nodejs";

/** POST { brief, redesignFrom? } → DesignSpec + previewHtml (deterministic skill graph). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = DesignFromFeaturesRequest.safeParse(
      body.brief !== undefined ? body : { brief: body },
    );
    const brief = parsed.success ? parsed.data.brief : DesignBrief.parse(body.brief ?? body);
    const redesignFrom = parsed.success
      ? parsed.data.redesignFrom
      : body.redesignFrom
        ? DesignSpec.parse(body.redesignFrom)
        : undefined;
    const result = designFromFeatures(brief, { redesignFrom });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid design brief";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** GET ?showcase=saas|dashboard|corporate|educational → preset design */
export async function GET(req: Request) {
  const { SHOWCASE_BRIEFS, designFromFeatures } = await import("@tell/design-skills");
  const url = new URL(req.url);
  const key = url.searchParams.get("showcase") ?? "saas";
  const brief = SHOWCASE_BRIEFS[key];
  if (!brief) {
    return NextResponse.json({ error: `Unknown showcase "${key}"` }, { status: 404 });
  }
  return NextResponse.json(designFromFeatures(brief));
}
