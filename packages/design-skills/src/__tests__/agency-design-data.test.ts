import { describe, expect, it, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  corridorDigest,
  loadDesignDataSeeds,
  mergeDesignDataMemory,
  writeBackDesignData,
} from "../../../../scripts/agency-pipeline/design-data";
import { EMPTY_MEMORY, saveMemory } from "../../../../scripts/agency-pipeline/memory";

describe("design-data companion", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
    delete process.env.TELL_DESIGN_DATA;
    delete process.env.TELL_DESIGN_DATA_COMMIT;
    delete process.env.TELL_DEV_CORPUS;
    delete process.env.TELL_PUBLIC_DEMO;
  });

  function makeTellRoot(): { tellRoot: string; dataRoot: string } {
    const tellRoot = mkdtempSync(join(tmpdir(), "tell-root-"));
    const dataRoot = mkdtempSync(join(tmpdir(), "design-data-"));
    dirs.push(tellRoot, dataRoot);
    mkdirSync(join(tellRoot, "research"), { recursive: true });
    writeFileSync(join(tellRoot, "pnpm-workspace.yaml"), "packages: []\n");
    writeFileSync(
      join(tellRoot, "research/design-data.local.json"),
      JSON.stringify({ path: dataRoot, pull: false }),
    );
    writeFileSync(
      join(dataRoot, "boards.seeds.json"),
      JSON.stringify({
        categories: {
          "portfolio-photography": [
            { url: "http://127.0.0.1:9/seed-a", note: "local-only" },
            { url: "http://127.0.0.1:9/seed-b", note: "local-only" },
            { url: "http://127.0.0.1:9/seed-c", note: "local-only" },
          ],
        },
      }),
    );
    writeFileSync(
      join(dataRoot, "agency-engine-memory.json"),
      JSON.stringify({
        ...EMPTY_MEMORY(),
        bansExtra: ["personal-corpus-ban"],
        craftHints: [
          {
            siteKind: "art-directed-studio",
            note: "From personal design-data",
            fromRun: "foreign",
          },
        ],
      }),
    );
    writeFileSync(
      join(dataRoot, "aggregate.json"),
      JSON.stringify({
        byCategory: {
          "art-directed-studio": {
            "typography.rangeRatio": { median: 4.2, n: 6 },
            "layout.foldFigureShare": { median: 0.41, n: 6 },
          },
        },
      }),
    );
    return { tellRoot, dataRoot };
  }

  it("loads seeds from design-data checkout", () => {
    const { tellRoot } = makeTellRoot();
    const { refs, mode } = loadDesignDataSeeds("portfolio-photography", tellRoot);
    expect(refs).toHaveLength(3);
    expect(mode).toMatch(/design-data:portfolio-photography/);
  });

  it("merges foreign memory bans into Tell memory", () => {
    const { tellRoot } = makeTellRoot();
    saveMemory(tellRoot, { ...EMPTY_MEMORY(), bansExtra: ["tell-only-ban"] });
    const merged = mergeDesignDataMemory(tellRoot);
    expect(merged.bansExtra.some((b) => /personal-corpus-ban/i.test(b))).toBe(true);
    expect(merged.bansExtra.some((b) => /tell-only-ban/i.test(b))).toBe(true);
  });

  it("reads corridor digest from design-data aggregate", () => {
    const { tellRoot } = makeTellRoot();
    const digest = corridorDigest("art-directed-studio", tellRoot);
    expect(digest.source).toBe("design-data");
    expect(digest.notes.length).toBeGreaterThan(0);
  });

  it("write-backs memory into design-data runs/", () => {
    const { tellRoot, dataRoot } = makeTellRoot();
    process.env.TELL_DESIGN_DATA_COMMIT = "0";
    process.env.TELL_DEV_CORPUS = "1";
    saveMemory(tellRoot, {
      ...EMPTY_MEMORY(),
      bansExtra: ["after-learn-ban"],
    });
    writeFileSync(join(tellRoot, "research/LEARNINGS.md"), "# learnings\n");
    const msg = writeBackDesignData(tellRoot, {
      runId: "unit-run",
      learnMarkdown: "# Learn unit\n",
    });
    expect(msg).toMatch(/wrote memory/);
    const back = JSON.parse(
      readFileSync(join(dataRoot, "agency-engine-memory.json"), "utf8"),
    ) as { bansExtra: string[] };
    expect(back.bansExtra).toContain("after-learn-ban");
    expect(existsSync(join(dataRoot, "runs/unit-run/LEARN.md"))).toBe(true);
  });

  it("stays off without developer gate even if TELL_DESIGN_DATA is set", async () => {
    const { loadDesignDataSeeds, isDevCorpusEnabled } = await import(
      "../../../../scripts/agency-pipeline/design-data"
    );
    const tellRoot = mkdtempSync(join(tmpdir(), "tell-no-dev-"));
    dirs.push(tellRoot);
    mkdirSync(join(tellRoot, "research"), { recursive: true });
    writeFileSync(join(tellRoot, "pnpm-workspace.yaml"), "packages: []\n");
    process.env.TELL_DESIGN_DATA = "/tmp/does-not-matter";
    delete process.env.TELL_DEV_CORPUS;
    process.env.TELL_PUBLIC_DEMO = "1";
    expect(isDevCorpusEnabled(tellRoot)).toBe(false);
    expect(loadDesignDataSeeds("portfolio-photography", tellRoot).refs).toHaveLength(0);
    delete process.env.TELL_PUBLIC_DEMO;
    delete process.env.TELL_DESIGN_DATA;
  });
});
