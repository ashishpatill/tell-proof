/**
 * Layout audit — the defects the craft score cannot see.
 *
 * The craft score reads a page as populations of numbers: type sizes, contrasts, paddings. A page
 * can sit inside every band while a heading renders one word per line in a 150px column, a
 * sentence is clipped mid-word inside a fixed-width box, or a section's content spills past the
 * band it is painted on. Those are the failures a person notices in the first second, and none of
 * them move a percentile.
 *
 * So this checks the things a designer checks by eye, mechanically:
 *
 *   overflow      content painted outside the section box that is supposed to contain it
 *   clipped       text truncated by the box it sits in, mid-word
 *   starved       a text column too narrow to set its own content — the one-word-per-line failure
 *   collision     two sections whose painted boxes overlap
 *   repetition    the same sentence rendered more than once on the page
 *
 * Usage: pnpm research:audit [briefId]
 */
import { createServer } from "node:http";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS, HOLDOUT } from "./briefs";

export const AUDIT_PROBE = `(() => {
  const out = { overflow: [], clipped: [], starved: [], collision: [], repetition: [] };
  const seen = new Map();

  const rect = (el) => el.getBoundingClientRect();
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + cls;
  };

  const sections = [...document.querySelectorAll('[data-section]')];

  for (const section of sections) {
    const sr = rect(section);
    const id = section.dataset.section;
    for (const el of section.querySelectorAll('*')) {
      const r = rect(el);
      if (r.width === 0 || r.height === 0) continue;
      // Content painted below the band that is supposed to hold it. 1px of slack absorbs
      // sub-pixel rounding on fractional layouts.
      if (r.bottom > sr.bottom + 1) {
        out.overflow.push({ section: id, el: label(el), by: Math.round(r.bottom - sr.bottom) });
      }
    }
  }

  // Assistive-only text is clipped to a 1px box on purpose. It is not a layout defect, and every
  // page carries one, so it would otherwise sit at the top of every report forever.
  const isVisuallyHidden = (el) => {
    const r = rect(el);
    if (r.width <= 2 || r.height <= 2) return true;
    const cs = getComputedStyle(el);
    return cs.clipPath !== 'none' || cs.clip !== 'auto';
  };

  for (const el of document.querySelectorAll('p, h1, h2, h3, h4, li, dd, dt, span, blockquote, td, th, figcaption')) {
    const r = rect(el);
    if (r.width === 0 || r.height === 0) continue;
    if (isVisuallyHidden(el)) continue;
    const text = (el.textContent || '').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);

    // Clipped: the element's own content is wider or taller than the box painting it, and the box
    // is not allowed to show the rest.
    const hides = cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    if (hides && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      out.clipped.push({ el: label(el), text: text.slice(0, 60), scroll: el.scrollWidth, client: el.clientWidth });
    }

    // Starved: a run of prose in a column so narrow it cannot set itself — the one-word-per-line
    // failure. Headings are exempt: a display line is *supposed* to break early, and the corpus
    // puts headline measure at 12–28 characters. This is about prose that has to be read.
    const isProse = /^(P|LI|DD|TD|FIGCAPTION)$/.test(el.tagName);
    const fs = parseFloat(cs.fontSize) || 16;
    const ch = r.width / (fs * 0.5);
    if (isProse && text.length > 40 && ch > 0 && ch < 24 && el.children.length === 0) {
      out.starved.push({ el: label(el), ch: Math.round(ch), text: text.slice(0, 60) });
    }

    // Repetition: the same sentence painted more than twice. Short strings and proper nouns repeat
    // for good reasons — a name in a nav, a tier in a matrix — so only whole sentences are
    // counted. Two is the tolerance rather than one: a page is allowed to make its central claim
    // at the fold and again in the catalogue, which is what reference pages do. Three or more is
    // the template smell this exists to catch.
    if (text.length >= 45 && el.children.length === 0) {
      const key = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\\s+/g, ' ');
      seen.set(key, (seen.get(key) || 0) + 1);
    }
  }

  for (const [key, count] of seen) {
    if (count > 2) out.repetition.push({ count, text: key.slice(0, 80) });
  }

  for (let i = 0; i < sections.length - 1; i += 1) {
    const a = rect(sections[i]);
    const b = rect(sections[i + 1]);
    if (b.top < a.bottom - 1) {
      out.collision.push({
        a: sections[i].dataset.section,
        b: sections[i + 1].dataset.section,
        by: Math.round(a.bottom - b.top),
      });
    }
  }

  return out;
})()`;

export interface AuditResult {
  id: string;
  overflow: Array<{ section: string; el: string; by: number }>;
  clipped: Array<{ el: string; text: string; scroll: number; client: number }>;
  starved: Array<{ el: string; ch: number; text: string }>;
  collision: Array<{ a: string; b: string; by: number }>;
  repetition: Array<{ count: number; text: string }>;
}

export async function auditBriefs(ids?: string[]): Promise<AuditResult[]> {
  const all = [...CRITIQUE_BRIEFS, HOLDOUT];
  const chosen = ids?.length ? all.filter((b) => ids.includes(b.id)) : all;
  const pages = chosen.map((entry) => ({ id: entry.id, html: designFromFeatures(entry.brief).previewHtml }));

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.id === id);
    if (!page) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4399, "127.0.0.1", r));

  const browser = await chromium.launch();
  const results: AuditResult[] = [];
  for (const page of pages) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await context.newPage();
    await p.goto(`http://127.0.0.1:4399/${page.id}`, { waitUntil: "networkidle", timeout: 30_000 });
    await p.waitForTimeout(400);
    // Scroll first. A page using scroll reveals holds un-entered sections under a transform, and
    // measuring in that state reports every reveal as a section overlapping its neighbour.
    await p.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(500);
    const found = (await p.evaluate(AUDIT_PROBE)) as Omit<AuditResult, "id">;
    results.push({ id: page.id, ...found });
    await context.close();
  }
  await browser.close();
  server.close();
  return results;
}

async function main(): Promise<void> {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const results = await auditBriefs(ids);
  let defects = 0;

  for (const r of results) {
    const count =
      r.overflow.length + r.clipped.length + r.starved.length + r.collision.length + r.repetition.length;
    defects += count;
    console.log(`\n${r.id} — ${count === 0 ? "clean" : `${count} defects`}`);
    for (const o of r.overflow.slice(0, 6)) console.log(`  overflow    ${o.section} ${o.el} +${o.by}px below the band`);
    for (const c of r.collision) console.log(`  collision   ${c.a} / ${c.b} overlap ${c.by}px`);
    for (const c of r.clipped.slice(0, 6)) console.log(`  clipped     ${c.el} ${c.client}px box, ${c.scroll}px content — "${c.text}"`);
    for (const s of r.starved.slice(0, 6)) console.log(`  starved     ${s.el} ${s.ch}ch — "${s.text}"`);
    for (const p of r.repetition.slice(0, 8)) console.log(`  repeated ${p.count}x  "${p.text}"`);
  }

  console.log(`\n${defects} defects across ${results.length} pages`);
  if (defects) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
