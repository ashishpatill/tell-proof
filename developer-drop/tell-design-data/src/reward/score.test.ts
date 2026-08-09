import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ingestReportFile } from "../collect/ingest.js";
import { convertAll } from "../convert/to-jsonl.js";
import { scoreReport } from "../reward/score.js";
import { scrubText } from "../scrub/scrub.js";

test("scrub redacts secrets and emails", () => {
  const out = scrubText("key sk-abc1234567890 and user@example.com Bearer tokensecretvalue");
  assert.match(out, /REDACTED/);
  assert.doesNotMatch(out, /user@example\.com/);
});

test("reward prefers lower genericness", () => {
  const high = scoreReport({
    findings: [],
    verdicts: [],
    measures: { score: 20, band: "distinctive" },
    score: { total: 2, generic: 0 },
  }, "accepted");
  const low = scoreReport({
    findings: [{ detector: "InterOnly", verdictHint: "generic", family: "tell" }],
    verdicts: [],
    measures: { score: 88, band: "slop" },
    score: { total: 8, generic: 7 },
  }, "unknown");
  assert.ok(high.total > low.total);
});

test("ingest + convert writes sft jsonl", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "tdd-"));
  const reportPath = path.join(home, "sample-report.json");
  await writeFile(
    reportPath,
    JSON.stringify({
      capture: { url: "http://localhost:3001/", viewport: { width: 1440, height: 900 } },
      findings: [{ id: "1", family: "tell", detector: "EqualCards", verdictHint: "generic", facts: {}, evidence: [], severity: "high" }],
      verdicts: [],
      score: { total: 1, generic: 1, drift: 0, intentional: 0, uncertain: 0 },
      measures: { score: 62, band: "template", axes: [] },
    }),
    "utf8",
  );

  const ep = await ingestReportFile(reportPath, {
    source: "ingest",
    outcome: "accepted",
    brief: "warmer editorial pricing",
    home,
  });
  assert.ok(ep.episode_id);

  const stats = await convertAll(home);
  assert.equal(stats.sft, 1);
  await rm(home, { recursive: true, force: true });
});
