/**
 * Playwright proof: priority rail / flow cards / app nav change visible state on click.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { designFromFeatures, getTemplate } from "../packages/design-skills/src/index";

async function main() {
  const OUT = "/opt/cursor/artifacts/screenshots";
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures: string[] = [];

  // --- Dashboard: priority rail + app nav ---
  const dash = designFromFeatures(getTemplate("dashboard")!.brief).previewHtml;
  await page.setContent(dash, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(120);

  const railTag = await page.evaluate(
    `document.querySelector(".ds-priority-chip")?.tagName`,
  );
  if (railTag !== "BUTTON") failures.push(`priority chip tag=${railTag}, expected BUTTON`);

  await page.click('.ds-priority-chip[data-rail-step="1"]');
  const afterRail = await page.evaluate(`({
    live: document.querySelector(".ds-priority-chip.is-live")?.getAttribute("data-rail-label"),
    pressed: document.querySelector('.ds-priority-chip[data-rail-step="1"]')?.getAttribute("aria-pressed"),
    view: document.querySelector("[data-app-view-label]")?.textContent,
    current: document.querySelector('[data-app-views] [aria-current="page"]')?.textContent,
    visibleRows: [...document.querySelectorAll("[data-row-view]")].filter(function(r){ return !r.hidden; }).map(function(r){ return r.getAttribute("data-row-view"); }),
  })`);
  console.log("dashboard after Deal room click", afterRail);
  if ((afterRail as { live?: string }).live !== "Deal room") {
    failures.push(`rail live=${JSON.stringify(afterRail)}`);
  }
  if ((afterRail as { view?: string }).view !== "Deal room") {
    failures.push(`app view label not synced: ${JSON.stringify(afterRail)}`);
  }

  await page.evaluate(`window.scrollTo(0, document.querySelector("#app")?.offsetTop ?? 0)`);
  await page.click('.ds-app-nav-item[data-view="Playbooks"]');
  const afterNav = await page.evaluate(`({
    current: document.querySelector('[data-app-views] [aria-current="page"]')?.textContent,
    label: document.querySelector("[data-app-view-label]")?.textContent,
    visible: [...document.querySelectorAll("[data-row-view]")].filter(function(r){ return !r.hidden; }).map(function(r){ return r.getAttribute("data-row-view"); }),
  })`);
  console.log("dashboard after Playbooks nav", afterNav);
  if ((afterNav as { current?: string }).current !== "Playbooks") {
    failures.push(`nav current=${JSON.stringify(afterNav)}`);
  }

  await page.screenshot({
    path: resolve(OUT, "affordance-dashboard-rail.png"),
    fullPage: false,
  });

  // --- Studio: flow cards ---
  const studio = designFromFeatures(getTemplate("studio")!.brief).previewHtml;
  await page.setContent(studio, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(120);
  const flowY = await page.evaluate(`(() => {
    const el = document.querySelector(".ds-flow-track");
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  })()`);
  if (flowY == null) failures.push("studio missing .ds-flow-track");
  else {
    await page.evaluate(`window.scrollTo(0, ${Math.max(0, flowY - 40)})`);
    await page.click('.ds-flow-card[data-step="2"]');
    const flowState = await page.evaluate(`({
      liveStep: document.querySelector(".ds-flow-card.is-live")?.getAttribute("data-step"),
      pressed: document.querySelector('.ds-flow-card[data-step="2"]')?.getAttribute("aria-pressed"),
      caption: document.querySelector("[data-flow-caption]")?.textContent?.slice(0, 80),
    })`);
    console.log("studio flow after step 2", flowState);
    if ((flowState as { liveStep?: string }).liveStep !== "2") {
      failures.push(`flow liveStep=${JSON.stringify(flowState)}`);
    }
    await page.screenshot({
      path: resolve(OUT, "affordance-studio-flow.png"),
      clip: { x: 0, y: 0, width: 1440, height: 520 },
    });
  }

  await browser.close();

  const report = { ok: failures.length === 0, failures };
  writeFileSync(resolve(OUT, "affordance-report.json"), JSON.stringify(report, null, 2));
  console.log(report);
  if (failures.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
