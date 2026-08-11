#!/usr/bin/env node
/**
 * Measured gate: Crease scorecard rows share one CSS baseline and one column rail.
 * Uses Range getClientRects bottoms (glyph baseline proxy), not cell midlines alone.
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

    const board = document.querySelector('[data-testid="crease-scorecard-board"]');
    if (!board) return { error: "missing board" };
    const boards = [...board.querySelectorAll(".cr-board")];
    if (boards.length < 2) return { error: `expected 2 boards, got ${boards.length}` };

    const baselineIssues = [];
    for (const [bi, section] of boards.entries()) {
      for (const row of section.querySelectorAll(".cr-board-row:not(.cr-board-head)")) {
        const cells = [...row.children].filter((el) => el.textContent?.trim());
        if (cells.length < 2) continue;
        const bottoms = cells.map((el) => ({
          text: el.textContent?.trim(),
          bottom: textBottom(el),
          font: getComputedStyle(el).fontFamily,
          size: getComputedStyle(el).fontSize,
        }));
        const base = bottoms[0].bottom;
        for (let i = 1; i < bottoms.length; i++) {
          if (base == null || bottoms[i].bottom == null) continue;
          const delta = Math.abs(bottoms[i].bottom - base);
          if (delta > 1.5) {
            baselineIssues.push({
              board: bi,
              name: bottoms[0].text,
              against: bottoms[i].text,
              delta,
              fonts: [bottoms[0].font, bottoms[i].font],
              sizes: [bottoms[0].size, bottoms[i].size],
            });
          }
        }
      }
    }

    const batRow = boards[0].querySelector(".cr-board-row:not(.cr-board-head)");
    const bowlRow = boards[1].querySelector(".cr-board-row:not(.cr-board-head)");
    const batName = batRow?.children[0]?.getBoundingClientRect();
    const bowlName = bowlRow?.children[0]?.getBoundingClientRect();
    const batStat = batRow?.querySelector(".cr-stat")?.getBoundingClientRect();
    const bowlStat = bowlRow?.querySelector(".cr-stat")?.getBoundingClientRect();

    const sameFontIssues = [];
    for (const row of board.querySelectorAll(".cr-board-row:not(.cr-board-head)")) {
      const name = row.querySelector(".cr-name");
      const stat = row.querySelector(".cr-stat");
      if (!name || !stat) continue;
      const nf = getComputedStyle(name).fontFamily;
      const sf = getComputedStyle(stat).fontFamily;
      if (nf !== sf) {
        sameFontIssues.push({ name: name.textContent?.trim(), nameFont: nf, statFont: sf });
      }
    }

    return {
      baselineIssues,
      sameFontIssues,
      nameLeftDelta: batName && bowlName ? Math.abs(batName.left - bowlName.left) : null,
      firstStatLeftDelta: batStat && bowlStat ? Math.abs(batStat.left - bowlStat.left) : null,
    };
  });

  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/crease-scorecard-aligned.png",
    fullPage: false,
  });
  await browser.close();

  if (report.error) throw new Error(report.error);

  const fails = [];
  if (report.sameFontIssues.length) {
    fails.push(`name/stat font mismatch: ${JSON.stringify(report.sameFontIssues)}`);
  }
  if (report.baselineIssues.length) {
    fails.push(
      `glyph baseline drift >${MAX_BASELINE_DELTA_PX}px: ${JSON.stringify(report.baselineIssues, null, 2)}`,
    );
  }
  if (report.nameLeftDelta != null && report.nameLeftDelta > MAX_COLUMN_DELTA_PX) {
    fails.push(`name column left delta ${report.nameLeftDelta.toFixed(2)}px`);
  }
  if (report.firstStatLeftDelta != null && report.firstStatLeftDelta > MAX_COLUMN_DELTA_PX) {
    fails.push(`first stat column left delta ${report.firstStatLeftDelta.toFixed(2)}px`);
  }

  if (fails.length) {
    console.error("FAIL crease scorecard alignment");
    for (const f of fails) console.error("-", f);
    process.exit(1);
  }

  console.log(
    "PASS crease scorecard alignment",
    JSON.stringify({
      nameLeftDelta: report.nameLeftDelta,
      firstStatLeftDelta: report.firstStatLeftDelta,
      baselineIssues: report.baselineIssues.length,
      sameFontIssues: report.sameFontIssues.length,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
