#!/usr/bin/env node
/**
 * Measured gate: Crease scorecard — glyph baselines, shared name+stat rails,
 * and bowling must NOT stretch a phantom dismissal column across the viewport.
 */
import { createRequire } from "module";

const require = createRequire(new URL("../package.json", import.meta.url));
const { chromium } = require("playwright");

const BASE = process.env.TELL_BASE_URL ?? "http://localhost:3000";
const MAX_BASELINE_DELTA_PX = 1.5;
const MAX_COLUMN_DELTA_PX = 1.5;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const res = await page.goto(`${BASE}/crease/scorecard`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  if (!res || !res.ok()) throw new Error(`scorecard HTTP ${res?.status()}`);

  await page.evaluate(() => {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-in", "1"));
  });
  await page.waitForTimeout(400);

  const report = await page.evaluate(() => {
    function textBottom(el) {
      if (!el || !el.textContent?.trim()) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()];
      if (!rects.length) return null;
      return Math.max(...rects.map((r) => r.bottom));
    }

    const root = document.querySelector('[data-testid="crease-scorecard-board"]');
    if (!root) return { error: "missing board" };
    const bat = root.querySelector(".cr-board--bat");
    const bowl = root.querySelector(".cr-board--bowl");
    if (!bat || !bowl) return { error: "missing bat/bowl boards" };

    const baselineIssues = [];
    for (const [label, section] of [
      ["bat", bat],
      ["bowl", bowl],
    ]) {
      for (const row of section.querySelectorAll(".cr-board-row:not(.cr-board-head)")) {
        const cells = [...row.children].filter((el) => el.textContent?.trim());
        if (cells.length < 2) continue;
        const bottoms = cells.map((el) => ({
          text: el.textContent?.trim(),
          bottom: textBottom(el),
        }));
        const base = bottoms[0].bottom;
        for (let i = 1; i < bottoms.length; i++) {
          if (base == null || bottoms[i].bottom == null) continue;
          const delta = Math.abs(bottoms[i].bottom - base);
          if (delta > 1.5) {
            baselineIssues.push({ board: label, name: bottoms[0].text, against: bottoms[i].text, delta });
          }
        }
      }
    }

    const batRow = bat.querySelector(".cr-board-row:not(.cr-board-head)");
    const bowlRow = bowl.querySelector(".cr-board-row:not(.cr-board-head)");
    const batName = batRow?.querySelector(".cr-name")?.getBoundingClientRect();
    const bowlName = bowlRow?.querySelector(".cr-name")?.getBoundingClientRect();
    const batStat = batRow?.querySelector(".cr-stat")?.getBoundingClientRect();
    const bowlStat = bowlRow?.querySelector(".cr-stat")?.getBoundingClientRect();
    const bowlLast = bowlRow?.querySelectorAll(".cr-stat");
    const bowlLastRect = bowlLast?.[bowlLast.length - 1]?.getBoundingClientRect();
    const bowlBoard = bowl.getBoundingClientRect();
    const viewport = window.innerWidth;

    // Bowling must end near its last stat — not stretch toward the right edge
    const bowlTrailingSlack =
      bowlLastRect && bowlBoard ? bowlBoard.right - bowlLastRect.right : null;
    const bowlSpanRatio = bowlBoard ? bowlBoard.width / viewport : null;

    return {
      baselineIssues,
      nameLeftDelta: batName && bowlName ? Math.abs(batName.left - bowlName.left) : null,
      nameWidthDelta: batName && bowlName ? Math.abs(batName.width - bowlName.width) : null,
      firstStatLeftDelta: batStat && bowlStat ? Math.abs(batStat.left - bowlStat.left) : null,
      bowlTrailingSlack,
      bowlSpanRatio,
      bowlWidth: bowlBoard?.width,
      batStatLeft: batStat?.left,
      bowlStatLeft: bowlStat?.left,
    };
  });

  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/crease-scorecard-fixed-rail.png",
    fullPage: false,
  });
  await browser.close();

  if (report.error) throw new Error(report.error);

  const fails = [];
  if (report.baselineIssues.length) {
    fails.push(`baseline: ${JSON.stringify(report.baselineIssues)}`);
  }
  if (report.nameLeftDelta != null && report.nameLeftDelta > MAX_COLUMN_DELTA_PX) {
    fails.push(`name left delta ${report.nameLeftDelta}`);
  }
  if (report.nameWidthDelta != null && report.nameWidthDelta > MAX_COLUMN_DELTA_PX) {
    fails.push(`name width delta ${report.nameWidthDelta}`);
  }
  if (report.firstStatLeftDelta != null && report.firstStatLeftDelta > MAX_COLUMN_DELTA_PX) {
    fails.push(`first stat left delta ${report.firstStatLeftDelta}`);
  }
  // phantom-column smell: bowling board nearly full viewport OR huge slack after last W
  if (report.bowlSpanRatio != null && report.bowlSpanRatio > 0.55) {
    fails.push(`bowling board too wide (${(report.bowlSpanRatio * 100).toFixed(0)}% viewport)`);
  }
  if (report.bowlTrailingSlack != null && report.bowlTrailingSlack > 24) {
    fails.push(`bowling trailing slack ${report.bowlTrailingSlack.toFixed(1)}px after last stat`);
  }

  if (fails.length) {
    console.error("FAIL crease scorecard layout");
    for (const f of fails) console.error("-", f);
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log("PASS crease scorecard layout", JSON.stringify(report));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
