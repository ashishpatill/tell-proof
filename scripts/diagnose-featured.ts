import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await p.goto("http://127.0.0.1:3000/showcase", { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForSelector('[data-testid="showcase-featured-preview"][data-ready="true"]', {
    timeout: 45000,
  });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => {
    const el = document.querySelector('[data-testid="showcase-featured-preview"]');
    const iframe = el?.querySelector("iframe");
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    return {
      ready: el?.getAttribute("data-ready"),
      beat: el?.getAttribute("data-beat"),
      playing: el?.getAttribute("data-playing"),
      scrollY: win?.scrollY ?? null,
      bodyH: doc?.body?.scrollHeight ?? null,
      hasLedger: !!doc?.querySelector(".ds-register-ledger"),
      sample: (doc?.body?.innerText || "").slice(0, 280),
      frameH: el?.getBoundingClientRect().height,
      frameW: el?.getBoundingClientRect().width,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await p.screenshot({ path: "/opt/cursor/artifacts/screenshots/pass21-showcase-featured.png" });
  const plate = p.locator(".sx-plate-stage").first();
  if (await plate.count()) {
    await plate.screenshot({ path: "/opt/cursor/artifacts/screenshots/pass21-featured-plate.png" });
  }
  await b.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
