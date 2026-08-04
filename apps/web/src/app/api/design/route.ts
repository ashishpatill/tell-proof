import { NextResponse } from "next/server";
import { DesignFromFeaturesRequest, SHOWCASE_BRIEFS, designFromFeatures } from "@tell/design-skills";
import { ZodError } from "zod";

export const runtime = "nodejs";

const SHOWCASE_KEYS = new Set(Object.keys(SHOWCASE_BRIEFS));

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

/** GET ?showcase=saas|dashboard|corporate|educational → preset design */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("showcase") ?? "saas";
    if (!SHOWCASE_KEYS.has(key) || !Object.prototype.hasOwnProperty.call(SHOWCASE_BRIEFS, key)) {
      return NextResponse.json({ error: `Unknown showcase "${key}"` }, { status: 404 });
    }
    const brief = SHOWCASE_BRIEFS[key]!;
    return NextResponse.json(designFromFeatures(brief));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Showcase generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
