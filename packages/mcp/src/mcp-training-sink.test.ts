import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resetTrainingSinkCache,
  writeTrainingEvent,
} from "@tell/design-skills/training-data-sink";
import { handleDesignFromFeatures } from "./tool-handlers";

describe("MCP training-data sink", () => {
  const prevRepo = process.env.TELL_DESIGN_DATA_REPO;
  const prevFlag = process.env.TELL_TRAINING_DATA;
  const prevVercel = process.env.VERCEL;
  const prevSync = process.env.TELL_TRAINING_DATA_SYNC;
  let tmp: string | undefined;

  afterEach(async () => {
    resetTrainingSinkCache();
    if (prevRepo === undefined) delete process.env.TELL_DESIGN_DATA_REPO;
    else process.env.TELL_DESIGN_DATA_REPO = prevRepo;
    if (prevFlag === undefined) delete process.env.TELL_TRAINING_DATA;
    else process.env.TELL_TRAINING_DATA = prevFlag;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (prevSync === undefined) delete process.env.TELL_TRAINING_DATA_SYNC;
    else process.env.TELL_TRAINING_DATA_SYNC = prevSync;
    if (tmp) await rm(tmp, { recursive: true, force: true });
  });

  async function seedMockSink(): Promise<string> {
    tmp = await mkdtemp(path.join(tmpdir(), "mcp-tdd-sink-"));
    await writeFile(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "tell-design-data" }),
      "utf8",
    );
    process.env.TELL_DESIGN_DATA_REPO = tmp;
    process.env.TELL_TRAINING_DATA = "1";
    process.env.TELL_TRAINING_DATA_SYNC = "0";
    delete process.env.VERCEL;
    resetTrainingSinkCache();
    return tmp;
  }

  it("tell_design_from_features leaves a design episode matching /api/design shape", async () => {
    const repo = await seedMockSink();

    // Same writer + shape Studio uses (baseline).
    const apiShape = await writeTrainingEvent(
      "design",
      {
        brief: { productName: "Baseline", siteKind: "saas-marketing" },
        spec: { brief: { productName: "Baseline" } },
        previewHtml: "<html><body>api</body></html>",
        showcaseKey: null,
        productName: "Baseline",
      },
      { via: "api.design.post" },
    );
    expect(apiShape).not.toBeNull();
    const apiBody = JSON.parse(await readFile(apiShape!.path, "utf8")) as {
      kind: string;
      artifact_kind: string;
      source: string;
      payload: { brief: unknown; previewHtml?: string; htmlPath?: string };
      meta: { via?: string };
    };

    const result = await handleDesignFromFeatures(
      {
        productName: "Northstar MCP",
        tagline: "Ship taste, not template",
        features: [{ name: "Capture", description: "Rendered UI evidence", priority: "p0" }],
        siteKind: "saas-marketing",
        lockSiteKind: true,
      },
      { awaitSink: true },
    );
    expect(result.spec).toBeTruthy();
    expect(typeof result.previewHtml === "string" || result.previewHtml === undefined).toBe(true);

    const designDir = path.join(repo, "training-data", "raw", "design");
    const files = (await readdir(designDir)).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(2);

    const mcpFile = files
      .filter((f) => f.startsWith("design_"))
      .sort()
      .at(-1)!;
    const mcpBody = JSON.parse(await readFile(path.join(designDir, mcpFile), "utf8")) as {
      kind: string;
      artifact_kind: string;
      source: string;
      payload: {
        brief: { productName?: string } | null;
        productName?: string | null;
        htmlPath?: string;
      };
      meta: { via?: string; artifact_kind?: string };
    };

    // Same envelope as /api/design (not a second sink format).
    expect(mcpBody.kind).toBe(apiBody.kind);
    expect(mcpBody.artifact_kind).toBe(apiBody.artifact_kind);
    expect(mcpBody.source).toBe("tell-proof");
    expect(mcpBody.meta.via).toBe("mcp.tell_design_from_features");
    expect(mcpBody.meta.artifact_kind).toBe("design");
    expect(mcpBody.payload.productName ?? mcpBody.payload.brief?.productName).toBe("Northstar MCP");

    const inbox = await readdir(path.join(repo, "training-data", "inbox"));
    expect(inbox.some((f) => f.startsWith("design_"))).toBe(true);
  });
});
