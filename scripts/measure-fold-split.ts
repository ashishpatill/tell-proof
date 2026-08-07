import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { designFromFeatures, getTemplate } from "../packages/design-skills/src/index";

const OUT = resolve("/opt/cursor/artifacts/screenshots");
mkdirSync(OUT, { recursive: true });
const keys = ["saas", "corporate", "dashboard", "educational", "fintech"];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  for (const key of keys) {
    const t = getTemplate(key)!;
    const html = designFromFeatures(t.brief).previewHtml;
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    const m = await page.evaluate(`(() => {
      const fold = document.querySelector(
        ".ds-pipeline-fold, .ds-diligence-fold, .ds-queue-fold, .ds-mechanism-fold, .ds-wire-fold",
      );
      const field = document.querySelector(
        ".ds-pipeline-field, .ds-diligence-field, .ds-queue-field, .ds-mechanism-stage, .ds-wire-field",
      );
      const claim = document.querySelector(
        ".ds-pipeline-claim, .ds-diligence-claim, .ds-queue-claim, .ds-mechanism-claim, .ds-wire-claim",
      );
      const fig = field ? field.querySelector(".ds-fig, svg, figure") : null;
      function box(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          left: Math.round(r.left),
          w: Math.round(r.width),
          h: Math.round(r.height),
          bottom: Math.round(r.bottom),
        };
      }
      return {
        vh: window.innerHeight,
        fold: box(fold),
        claim: box(claim),
        field: box(field),
        fig: box(fig),
        fieldInFold: field ? field.getBoundingClientRect().top < window.innerHeight * 0.55 : false,
        fieldRightHalf: field ? field.getBoundingClientRect().left > window.innerWidth * 0.35 : false,
      };
    })()`);
    console.log(JSON.stringify({ key, ...m }));
    await page.screenshot({
      path: resolve(OUT, `fold-fix-${key}.png`),
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
