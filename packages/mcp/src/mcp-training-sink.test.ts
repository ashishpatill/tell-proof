import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resetTrainingSinkCache } from "@tell/design-skills/training-data-sink";
import { TellReport } from "@tell/schema";
import {
  handleDesignFromFeatures,
  handleDiagnose,
  handleRedesign,
  rememberReport,
} from "./tool-handlers";

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

  it("tell_diagnose writes raw/episodes, not raw/design", async () => {
    const repo = await seedMockSibling();
    const reportById = new Map<string, TellReport>();

    const report = await handleDiagnose({}, reportById, { awaitSink: true });
    expect(report.findings.length).toBeGreaterThan(0);

    const episodesDir = path.join(repo, "training-data", "raw", "episodes");
    const jsonFiles = (await readdir(episodesDir)).filter((f) => f.endsWith(".json"));
    expect(jsonFiles.length).toBe(1);

    const body = JSON.parse(await readFile(path.join(episodesDir, jsonFiles[0]!), "utf8")) as {
      kind: string;
      meta: { via?: string };
    };
    expect(body.kind).toBe("diagnose");
    expect(body.meta.via).toBe("mcp.tell_diagnose");

    const designDir = path.join(repo, "training-data", "raw", "design");
    expect(existsSync(designDir) ? await readdir(designDir) : []).toEqual([]);
  });

  it("tell_redesign writes raw/redesign, not raw/episodes", async () => {
    const repo = await seedMockSibling();
    const reportById = new Map<string, TellReport>();

    const proposal = await handleRedesign(
      { direction: "warmer, editorial, less shadow" },
      {
        reportById,
        remember: (r) => rememberReport(r, reportById),
      },
      { awaitSink: true },
    );
    expect(proposal.id).toBeTruthy();

    const redesignDir = path.join(repo, "training-data", "raw", "redesign");
    const jsonFiles = (await readdir(redesignDir)).filter((f) => f.endsWith(".json"));
    expect(jsonFiles.length).toBe(1);

    const body = JSON.parse(await readFile(path.join(redesignDir, jsonFiles[0]!), "utf8")) as {
      kind: string;
      meta: { via?: string };
    };
    expect(body.kind).toBe("redesign");
    expect(body.meta.via).toBe("mcp.tell_redesign");

    const episodesDir = path.join(repo, "training-data", "raw", "episodes");
    expect(existsSync(episodesDir) ? await readdir(episodesDir) : []).toEqual([]);
  });

  it("missing sibling is an honest no-op (tool still returns a spec)", async () => {
    tmp = await mkdtemp(path.join(tmpdir(), "mcp-tdd-missing-"));
    process.env.TELL_DESIGN_DATA_REPO = path.join(tmp, "does-not-exist");
    process.env.TELL_TRAINING_DATA = "1";
    process.env.TELL_TRAINING_DATA_SYNC = "0";
    delete process.env.VERCEL;
    resetTrainingSinkCache();

    const result = await handleDesignFromFeatures(
      {
        productName: "Ghost Sink",
        features: [{ name: "Capture", priority: "p0" }],
      },
      { awaitSink: true },
    );
    expect(result.spec).toBeTruthy();
    expect(existsSync(path.join(tmp, "does-not-exist"))).toBe(false);
  });

  it("tell_apply source never writes the training sink", () => {
    const src = readFileSync(path.resolve(__dirname, "index.ts"), "utf8");
    const start = src.indexOf('server.tool(\n  "tell_apply"');
    expect(start).toBeGreaterThan(-1);
    const next = src.indexOf("server.tool(", start + 10);
    const block = src.slice(start, next === -1 ? undefined : next);
    expect(block).not.toMatch(/recordTrainingEvent|writeTrainingEvent/);
  });

  it("mcp handlers do not import @tell/web", () => {
    const handlers = readFileSync(path.resolve(__dirname, "tool-handlers.ts"), "utf8");
    const index = readFileSync(path.resolve(__dirname, "index.ts"), "utf8");
    expect(handlers).not.toContain("@tell/web");
    expect(index).not.toContain("@tell/web");
  });
});
