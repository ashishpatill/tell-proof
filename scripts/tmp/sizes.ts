import { createServer } from "node:http";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS, HOLDOUT } from "../design-research/briefs";

async function main(): Promise<void> {
  const entries = [...CRITIQUE_BRIEFS, HOLDOUT];
  const pages = entries.map((e) => ({ id: e.id, html: designFromFeatures(e.brief).previewHtml }));
  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.id === id);
    if (!page) return void res.writeHead(404).end("nf");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4323, "127.0.0.1", r));
  const browser = await chromium.launch();
  for (const page of pages) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:4323/${page.id}`, { waitUntil: "networkidle" });
    const r = (await p.evaluate(`(() => {
      const out = [];
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        let cs; try { cs = getComputedStyle(el); } catch { continue; }
        if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
        const text = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => (n.textContent||"").trim()).join(" ").trim();
        if (!text) continue;
        out.push({ px: Math.round(parseFloat(cs.fontSize)*10)/10, tag: el.tagName.toLowerCase(), cls: (el.getAttribute("class")||"").slice(0,40), t: text.slice(0,24) });
      }
      out.sort((a,b)=>b.px-a.px);
      return { top: out.slice(0,6), bottom: out.slice(-6), n: out.length };
    })()`)) as any;
    console.log(`\n=== ${page.id}`);
    for (const x of r.top) console.log(`  MAX ${String(x.px).padStart(6)} ${x.tag} .${x.cls} "${x.t}"`);
    for (const x of r.bottom) console.log(`  min ${String(x.px).padStart(6)} ${x.tag} .${x.cls} "${x.t}"`);
    await ctx.close();
  }
  await browser.close();
  server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
