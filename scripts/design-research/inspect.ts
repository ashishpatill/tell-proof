/**
 * Inspect — a magnifying glass on one generated page.
 *
 * The critique scores a page against corridors; this prints the raw material behind the two
 * structural scores that are hardest to reason about from a single number: which elements are
 * carrying the drawn matter, and how the text density actually falls band by band down the scroll.
 *
 * Usage: pnpm research:inspect [-- --page saas-conversion]
 */
import { createServer } from "node:http";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS, HOLDOUT } from "./briefs";

const REPORT = `(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pageH = Math.max(document.body.scrollHeight, vh);

  const nodes = Array.from(document.querySelectorAll("img,video,canvas,picture,svg"));
  const set = new Set(nodes);
  const figures = [];
  for (const m of nodes) {
    let a = m.parentElement;
    let nested = false;
    while (a) { if (set.has(a)) { nested = true; break; } a = a.parentElement; }
    if (nested) continue;
    const r = m.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) continue;
    const top = r.top + window.scrollY;
    const foldOverlap = Math.max(0, Math.min(top + r.height, vh) - Math.max(top, 0));
    figures.push({
      kind: m.getAttribute("data-figure") || m.tagName.toLowerCase(),
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(top),
      area: Math.round(r.width * r.height),
      fold: Math.round(foldOverlap * Math.min(r.width, vw)),
    });
  }
  figures.sort((a, b) => b.area - a.area);

  // Text density per viewport band, matching the corpus probe's banding.
  const bandCount = Math.max(3, Math.min(14, Math.round(pageH / vh)));
  const bands = [];
  for (let b = 0; b < bandCount; b += 1) bands.push({ chars: 0, ink: 0 });
  const all = Array.from(document.querySelectorAll("body *"));
  for (const el of all) {
    let cs; try { cs = getComputedStyle(el); } catch { continue; }
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    let r; try { r = el.getBoundingClientRect(); } catch { continue; }
    const top = r.top + window.scrollY;
    const idx = Math.min(bandCount - 1, Math.max(0, Math.floor((top / pageH) * bandCount)));
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent || "").trim()).join(" ").trim();
    if (own) bands[idx].chars += Math.min(own.length, 600);
  }

  const sections = Array.from(document.querySelectorAll("section,footer,header")).map((s) => {
    const r = s.getBoundingClientRect();
    return {
      id: s.getAttribute("data-section") || s.id || "?",
      surface: s.getAttribute("data-surface") || "-",
      top: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      w: Math.round(r.width),
      chars: (s.textContent || "").trim().length,
    };
  });

  return { vw, vh, pageH: Math.round(pageH), bandCount, bands, figures, sections };
})()`;

async function main(): Promise<void> {
  const only = process.argv.includes("--page") ? process.argv[process.argv.indexOf("--page") + 1] : null;
  const entries = [...CRITIQUE_BRIEFS, HOLDOUT].filter((e) => !only || e.id === only);
  const pages = entries.map((e) => ({ id: e.id, html: designFromFeatures(e.brief).previewHtml }));

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.id === id);
    if (!page) return void res.writeHead(404).end("not found");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4322, "127.0.0.1", r));

  const browser = await chromium.launch();
  for (const page of pages) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:4322/${page.id}`, { waitUntil: "networkidle", timeout: 30_000 });
    await p.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(300);
    const r = (await p.evaluate(REPORT)) as any;

    const total = r.vw * r.pageH;
    const drawn = r.figures.reduce((a: number, f: any) => a + f.area, 0);
    const fold = r.figures.reduce((a: number, f: any) => a + f.fold, 0);
    console.log(`\n=== ${page.id} — ${r.pageH}px (${(r.pageH / r.vh).toFixed(1)} screens)`);
    console.log(`drawn ${(drawn / total * 100).toFixed(1)}% of page   fold ${(fold / (r.vw * r.vh) * 100).toFixed(1)}%`);
    console.log("figures:");
    for (const f of r.figures) {
      console.log(`  ${String(f.kind).padEnd(12)} ${String(f.w).padStart(5)}x${String(f.h).padStart(4)}  y=${String(f.top).padStart(5)}  ${(f.area / total * 100).toFixed(1)}% page  fold ${(f.fold / (r.vw * r.vh) * 100).toFixed(1)}%`);
    }
    const chars = r.bands.map((b: any) => b.chars);
    const mean = chars.reduce((a: number, b: number) => a + b, 0) / chars.length;
    const cv = Math.sqrt(chars.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / chars.length) / mean;
    console.log(`band chars (cv ${cv.toFixed(3)}): ${chars.join(" ")}`);
    console.log("sections:");
    for (const s of r.sections) {
      console.log(`  ${s.id.padEnd(12)} ${s.surface.padEnd(8)} y=${String(s.top).padStart(5)} h=${String(s.h).padStart(4)} w=${String(s.w).padStart(5)} chars=${s.chars}`);
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
