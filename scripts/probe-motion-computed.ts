import { createServer } from "node:http";
import { chromium } from "playwright";
import { designFromFeatures, SHOWCASE_BRIEFS } from "../packages/design-skills/src/index";

async function main() {
  const keys = ["saas", "consumer", "foundry", "fintech", "dashboard", "studio"] as const;
  const expectKf: Record<string, string> = {
    saas: "ds-saas-in",
    consumer: "ds-consumer-in",
    foundry: "ds-foundry-mask",
    fintech: "ds-fin-in",
    dashboard: "(none)",
    studio: "ds-studio-in",
  };
  const pages = keys.map((key) => ({
    key,
    html: designFromFeatures(SHOWCASE_BRIEFS[key]!).previewHtml,
  }));

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.key === id);
    if (!page) {
      res.writeHead(404).end("missing");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4331, "127.0.0.1", r));

  const browser = await chromium.launch();
  for (const page of pages) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "no-preference",
    });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:4331/${page.key}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(250);
    await p.evaluate(() => window.scrollTo(0, Math.floor(window.innerHeight * 1.4)));
    await p.waitForTimeout(500);
    const info = await p.evaluate((expected) => {
      const body = document.body;
      const reveal = document.querySelector(".ds-reveal");
      const enter = document.querySelector(".ds-enter");
      const r = reveal ? getComputedStyle(reveal) : null;
      const e = enter ? getComputedStyle(enter) : null;
      return {
        siteKind: body.getAttribute("data-sitekind"),
        motion: body.getAttribute("data-motion"),
        revealCount: document.querySelectorAll(".ds-reveal").length,
        revealAnim: r?.animationName ?? null,
        enterAnim: e?.animationName ?? null,
        htmlHasExpectedKf: expected === "(none)" ? true : document.documentElement.outerHTML.includes(`@keyframes ${expected}`),
        supportsView: CSS.supports("animation-timeline", "view()"),
      };
    }, expectKf[page.key]!);
    console.log(JSON.stringify({ key: page.key, expect: expectKf[page.key], ...info }));
    await ctx.close();
  }

  await browser.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
