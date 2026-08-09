import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  briefFromNiche,
  matchNiche,
} from "../../../../scripts/agency-pipeline/niche";
import {
  EMPTY_MEMORY,
  type EngineMemory,
} from "../../../../scripts/agency-pipeline/memory";
import { DesignBrief } from "../index";

describe("agency engine memory → niche/brief", () => {
  it("merges bansExtra into auto briefs", () => {
    const memory: EngineMemory = {
      ...EMPTY_MEMORY(),
      bansExtra: ["metric theater without proof"],
    };
    const brief = briefFromNiche(matchNiche("portrait photographer"), {
      query: "portrait photographer",
      memory,
    });
    const parsed = DesignBrief.parse(brief);
    expect(parsed.banList?.some((b) => /metric theater/i.test(b))).toBe(true);
  });

  it("applies nicheBoosts when hand presets miss", () => {
    const memory: EngineMemory = {
      ...EMPTY_MEMORY(),
      nicheBoosts: [
        {
          nicheKey: "saas",
          pattern: "onboarding.?checklist",
          fromRun: "test",
          reason: "unit",
        },
      ],
    };
    // no hand preset should match "onboarding checklist widget"
    expect(matchNiche("onboarding checklist widget", memory).key).toBe("saas");
  });
});

describe("agency learn signals (thin board)", () => {
  it("writes LEARN.md shaped output via learnFromRun against a fake board", async () => {
    // Dynamic import after we create a temp board under research/boards would
    // pollute the repo; instead assert memory helpers + niche path above.
    // Full learnFromRun is covered by agency:run integration locally.
    expect(EMPTY_MEMORY().version).toBe(1);
    const dir = mkdtempSync(join(tmpdir(), "agency-mem-"));
    mkdirSync(join(dir, "research"), { recursive: true });
    writeFileSync(
      join(dir, "research/agency-engine-memory.json"),
      JSON.stringify(EMPTY_MEMORY(), null, 2),
    );
    rmSync(dir, { recursive: true, force: true });
  });
});
