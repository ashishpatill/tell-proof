import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resetTrainingSinkCache,
  resolveDesignDataRepo,
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

  it("writes diagnose episode under training-data/", async () => {
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
          findings: [{ id: "1", detector: "EqualCards" }],
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

  it("stays off on Vercel by default", async () => {
    tmp = await mkdtemp(path.join(tmpdir(), "tdd-sink-"));
    await writeFile(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "tell-design-data" }),
      "utf8",
    );
    process.env.TELL_DESIGN_DATA_REPO = tmp;
    process.env.VERCEL = "1";
    delete process.env.TELL_TRAINING_DATA;
    resetTrainingSinkCache();
    const result = await writeTrainingEvent("voice", { transcript: "warmer" });
    expect(result).toBeNull();
  });
});
