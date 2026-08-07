import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  for (const path of ["showcase/educational", "showcase/archive", "showcase"]) {
    await p.goto(`http://127.0.0.1:3000/${path}`, { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(900);
    const slug = path.replace("/", "-");
    await p.screenshot({ path: `/opt/cursor/artifacts/screenshots/fix-${slug}-1600.png` });
    console.log("shot", slug);
  }
  // full-bleed html folds for edu + archive
  const { designFromFeatures, getTemplate } = await import("../packages/design-skills/src/index");
  for (const key of ["educational", "archive"]) {
    const html = designFromFeatures(getTemplate(key)!.brief).previewHtml;
    await p.setContent(html, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    await p.screenshot({ path: `/opt/cursor/artifacts/screenshots/fix-${key}-html-fold.png` });
    await p.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 0.95)));
    await p.waitForTimeout(300);
    await p.screenshot({ path: `/opt/cursor/artifacts/screenshots/fix-${key}-html-mid.png` });
    console.log("html", key);
  }
  await b.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
