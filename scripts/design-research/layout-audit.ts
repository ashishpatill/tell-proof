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
 *   vacancy       a run of the page tall enough to notice with nothing painted in it
 *   ghosting      page content legible through a fixed element that is meant to sit on top of it
 *
 * Usage: pnpm research:audit [briefId]
 */
import { createServer } from "node:http";
import { chromium } from "playwright";
import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS, HOLDOUT } from "./briefs";

export const AUDIT_PROBE = `(() => {
  const out = { overflow: [], clipped: [], starved: [], collision: [], repetition: [], vacancy: [], ghosting: [] };
  const seen = new Map();

  const rect = (el) => el.getBoundingClientRect();
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + cls;
  };

  const sections = [...document.querySelectorAll('[data-section]')];

  // Overlap across a section boundary is either a mistake or the cheapest depth a page can buy, and
  // the difference is whether someone asked for it. A pull that is declared — a negative margin on
  // the element or on the box carrying it — is a hang. Everything else past the boundary is spill.
  const isHung = (el, section) => {
    for (let node = el; node && node !== section; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (parseFloat(cs.marginBottom) < -4 || parseFloat(cs.marginTop) < -4) return true;
    }
    return false;
  };

  for (const section of sections) {
    const sr = rect(section);
    const id = section.dataset.section;
    for (const el of section.querySelectorAll('*')) {
      const r = rect(el);
      if (r.width === 0 || r.height === 0) continue;
      // Content painted below the band that is supposed to hold it. 1px of slack absorbs
      // sub-pixel rounding on fractional layouts.
      if (r.bottom > sr.bottom + 1 && !isHung(el, section)) {
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

  for (const el of document.querySelectorAll('p, h1, h2, h3, h4, li, dd, dt, span, blockquote, td, th, figcaption, caption')) {
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

  /* ---------------- vacancy ----------------
   * The defect a person sees before any other: a section that reserves a screen and fills the top
   * third of it. No band metric catches it, because an empty screen is just a low number in a
   * population of numbers, and a page of evenly medium screens scores the same as a page with a
   * real quiet beat next to a real dense one.
   *
   * A section's background is not content. Ink is what a reader can actually see inside the band:
   * set text, drawn figures, and boxes small enough to be objects rather than backdrops.
   */
  const vh = window.innerHeight;
  const isInk = (el) => {
    const r = rect(el);
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'svg' || tag === 'img' || tag === 'canvas' || tag === 'video') return true;
    // A box only reads as an object if it is smaller than the screen it sits on. Anything larger is
    // the surface the objects are placed on, and counting it would make every section look full.
    if (r.width * r.height < window.innerWidth * vh * 0.5) {
      const bg = cs.backgroundColor || '';
      const m = bg.match(/rgba?\\(([^)]+)\\)/);
      const alpha = m ? (m[1].split(',')[3] === undefined ? 1 : parseFloat(m[1].split(',')[3])) : 0;
      if (alpha > 0.02) return true;
      if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0) return true;
    }
    if (el.children.length === 0 && (el.textContent || '').trim()) return true;
    return false;
  };

  /*
   * Ink is mapped over the document once and sliced per section afterwards, rather than gathered
   * from each section's own descendants. A figure that hangs across a boundary belongs to the
   * section above it in the DOM and to the screen below it in the eye, and attributing by ancestry
   * reported the space it occupies as a hole in the band it is sitting in — which is the opposite
   * of what it is doing there.
   */
  const ROW = 16;
  const docRows = Math.ceil(document.documentElement.scrollHeight / ROW);
  const pageInk = new Uint8Array(docRows);
  for (const el of document.querySelectorAll('*')) {
    if (!isInk(el)) continue;
    const r = rect(el);
    const from = Math.max(0, Math.floor((r.top + window.scrollY) / ROW));
    const to = Math.min(docRows - 1, Math.floor((r.bottom + window.scrollY - 1) / ROW));
    for (let i = from; i <= to; i += 1) pageInk[i] = 1;
  }

  for (const section of sections) {
    const sr = rect(section);
    const base = Math.floor((sr.top + window.scrollY) / ROW);
    const rows = Math.ceil(sr.height / ROW);
    if (rows < 4) continue;
    let inked = 0;
    let run = 0;
    let worstRun = 0;
    for (let i = 0; i < rows; i += 1) {
      if (pageInk[base + i]) { inked += 1; run = 0; } else { run += 1; if (run > worstRun) worstRun = run; }
    }
    const fill = inked / rows;
    // Three ways to fail. A band that paints less than half its own height is holding more air than
    // matter whatever its size. A band taller than most of a screen has to work harder than that to
    // justify the room it took. And one unbroken hole longer than a fifth of the screen reads as a
    // mistake even when the rest of the band is dense — which is the failure mode of content that
    // sits at the top of a reserved height instead of sizing to it.
    if (fill < 0.5 || (sr.height > vh * 0.7 && fill < 0.58) || worstRun * ROW > vh * 0.22) {
      out.vacancy.push({
        section: section.dataset.section,
        height: Math.round(sr.height),
        fill: Math.round(fill * 100) / 100,
        gap: Math.round(worstRun * ROW),
      });
    }
  }

  /* ---------------- ghosting ----------------
   * A pinned bar is only a bar if the page cannot be read through it. A translucent header with no
   * backdrop treatment turns every headline that scrolls beneath it into a smear, which is the
   * cheapest way to make an otherwise careful page look unfinished.
   */
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    const r = rect(el);
    if (r.width * r.height < 4000) continue;
    if (cs.backdropFilter && cs.backdropFilter !== 'none') continue;
    const m = (cs.backgroundColor || '').match(/rgba?\\(([^)]+)\\)/);
    const parts = m ? m[1].split(',') : [];
    const alpha = m ? (parts[3] === undefined ? 1 : parseFloat(parts[3])) : 0;
    if (alpha < 0.98) out.ghosting.push({ el: label(el), alpha: Math.round(alpha * 100) / 100 });
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
  vacancy: Array<{ section: string; height: number; fill: number; gap: number }>;
  ghosting: Array<{ el: string; alpha: number }>;
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
      r.overflow.length +
      r.clipped.length +
      r.starved.length +
      r.collision.length +
      r.repetition.length +
      r.vacancy.length +
      r.ghosting.length;
    defects += count;
    console.log(`\n${r.id} — ${count === 0 ? "clean" : `${count} defects`}`);
    for (const o of r.overflow.slice(0, 6)) console.log(`  overflow    ${o.section} ${o.el} +${o.by}px below the band`);
    for (const c of r.collision) console.log(`  collision   ${c.a} / ${c.b} overlap ${c.by}px`);
    for (const v of r.vacancy) console.log(`  vacancy     ${v.section} ${v.height}px tall, ${Math.round(v.fill * 100)}% inked, ${v.gap}px empty run`);
    for (const g of r.ghosting) console.log(`  ghosting    ${g.el} pinned at alpha ${g.alpha} with no backdrop`);
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
