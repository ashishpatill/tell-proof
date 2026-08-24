import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resetTrainingSinkCache } from "@tell/design-skills/training-data-sink";
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

  async function seedMockSibling(): Promise<string> {
    tmp = await mkdtemp(path.join(tmpdir(), "mcp-tdd-sink-"));
    await writeFile(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "tell-design-data" }),
      "utf8",
    );
    process.env.TELL_DESIGN_DATA_REPO = tmp;
    process.env.TELL_TRAINING_DATA = "1";
    // Frontend owns harness sync — do not exercise sibling sync from MCP tests.
    process.env.TELL_TRAINING_DATA_SYNC = "0";
    delete process.env.VERCEL;
    resetTrainingSinkCache();
    return tmp;
  }

  it("tell_design_from_features writes raw/design dump (same kind as /api/design), not raw/episodes", async () => {
    const repo = await seedMockSibling();

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

    const designDir = path.join(repo, "training-data", "raw", "design");
    const jsonFiles = (await readdir(designDir)).filter((f) => f.endsWith(".json"));
    expect(jsonFiles.length).toBe(1);

    const dumpPath = path.join(designDir, jsonFiles[0]!);
    expect(dumpPath).toContain(`${path.sep}raw${path.sep}design${path.sep}`);
    expect(dumpPath.endsWith(".json")).toBe(true);

    const body = JSON.parse(await readFile(dumpPath, "utf8")) as {
      kind: string;
      artifact_kind: string;
      source: string;
      id: string;
      payload: {
        brief: { productName?: string } | null;
        productName?: string | null;
        htmlPath?: string;
      };
      meta: { via?: string; artifact_kind?: string };
    };

    // Studio /api/design dump shape — kind "design" under raw/design/.
    expect(body.kind).toBe("design");
    expect(body.artifact_kind).toBe("design");
    expect(body.source).toBe("tell-proof");
    expect(body.meta.via).toBe("mcp.tell_design_from_features");
    expect(body.payload.productName ?? body.payload.brief?.productName).toBe("Northstar MCP");
    expect(body.payload.htmlPath).toMatch(/raw[/\\]design[/\\].+\.html$/);

    // Do not collapse design into the diagnose episode envelope.
    const episodesDir = path.join(repo, "training-data", "raw", "episodes");
    expect(existsSync(episodesDir) ? await readdir(episodesDir) : []).toEqual([]);

    const inbox = await readdir(path.join(repo, "training-data", "inbox"));
    expect(inbox.some((f) => f.startsWith("design_") && f.endsWith(".json"))).toBe(true);
  });
});
