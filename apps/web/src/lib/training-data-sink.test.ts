import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resetTrainingSinkCache,
  resolveDesignDataRepo,
  trainingSinkStatus,
  writeTrainingEvent,
} from "./training-data-sink";

describe("training-data-sink", () => {
  const prevRepo = process.env.TELL_DESIGN_DATA_REPO;
  const prevFlag = process.env.TELL_TRAINING_DATA;
  const prevVercel = process.env.VERCEL;
  let tmp: string | undefined;

  afterEach(async () => {
    resetTrainingSinkCache();
    if (prevRepo === undefined) delete process.env.TELL_DESIGN_DATA_REPO;
    else process.env.TELL_DESIGN_DATA_REPO = prevRepo;
    if (prevFlag === undefined) delete process.env.TELL_TRAINING_DATA;
    else process.env.TELL_TRAINING_DATA = prevFlag;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (tmp) await rm(tmp, { recursive: true, force: true });
  });

  async function seedRepo(): Promise<string> {
    tmp = await mkdtemp(path.join(tmpdir(), "tdd-sink-"));
    await writeFile(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "tell-design-data" }),
      "utf8",
    );
    process.env.TELL_DESIGN_DATA_REPO = tmp;
    process.env.TELL_TRAINING_DATA = "1";
    delete process.env.VERCEL;
    resetTrainingSinkCache();
    return tmp;
  }

  it("writes diagnose episode under training-data/", async () => {
    await seedRepo();
    expect(resolveDesignDataRepo()).toBe(tmp);

    const result = await writeTrainingEvent(
      "diagnose",
      {
        report: {
          capture: {
            url: "http://localhost:3001/",
            screenshotBase64: Buffer.from("hello-shot").toString("base64"),
            snapshotHtml: "<html></html>",
          },
          findings: [{ id: "1", detector: "equalCards" }],
          score: { total: 1, generic: 1, drift: 0, intentional: 0, uncertain: 0 },
        },
      },
      { live: true },
    );

    expect(result).not.toBeNull();
    const episode = JSON.parse(await readFile(result!.path, "utf8")) as {
      report: { capture: { screenshotBase64: string; url: string } };
    };
    expect(episode.report.capture.url).toBe("http://localhost:3001/");
    expect(episode.report.capture.screenshotBase64).toContain("[external");
  });

  it("writes proof events under raw/proof and by-day", async () => {
    const repo = await seedRepo();
    const result = await writeTrainingEvent(
      "proof",
      {
        mode: "compare",
        status: "passed",
        proof: { scoreDelta: -5 },
        beforeReport: {
          capture: { url: "http://localhost:3001/", screenshotBase64: "aaa" },
        },
        afterReport: {
          capture: { url: "http://localhost:3001/", screenshotBase64: "bbb" },
        },
      },
      { url: "http://localhost:3001/" },
    );
    expect(result).not.toBeNull();
    expect(result!.path).toContain(`${path.sep}raw${path.sep}proof${path.sep}`);
    const body = JSON.parse(await readFile(result!.path, "utf8")) as {
      payload: {
        beforeReport: { capture: { screenshotBase64: string } };
      };
    };
    expect(body.payload.beforeReport.capture.screenshotBase64).toContain("[external");
    const dayDirs = await readdir(path.join(repo, "training-data", "by-day"));
    expect(dayDirs.length).toBeGreaterThan(0);
    expect(trainingSinkStatus().enabled).toBe(true);
  });

  it("stays off on Vercel by default", async () => {
    await seedRepo();
    process.env.VERCEL = "1";
    delete process.env.TELL_TRAINING_DATA;
    resetTrainingSinkCache();
    const result = await writeTrainingEvent("voice", { transcript: "warmer" });
    expect(result).toBeNull();
    expect(trainingSinkStatus().reason).toBe("vercel_default_off");
  });
});
