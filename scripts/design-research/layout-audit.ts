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

  // Two sections whose boxes overlap are either a packing bug or an intentional hang. A hang is
  // declared the same way the overflow probe recognises one: a negative margin on the upper
  // section, the lower section, or a child that crosses the seam. Anything else is a collision.
  const sectionDeclaresHang = (section) => {
    const cs = getComputedStyle(section);
    if (parseFloat(cs.marginBottom) < -4 || parseFloat(cs.marginTop) < -4) return true;
    for (const el of section.querySelectorAll('*')) {
      const ecs = getComputedStyle(el);
      if (parseFloat(ecs.marginBottom) < -4 || parseFloat(ecs.marginTop) < -4) return true;
    }
    return false;
  };

  for (let i = 0; i < sections.length - 1; i += 1) {
    const a = rect(sections[i]);
    const b = rect(sections[i + 1]);
    if (b.top < a.bottom - 1) {
      if (sectionDeclaresHang(sections[i]) || sectionDeclaresHang(sections[i + 1])) continue;
      out.collision.push({
        a: sections[i].dataset.section,
        b: sections[i + 1].dataset.section,
        by: Math.round(a.bottom - b.top),
      });
    }
  }

  /* ---------------- vacancy ----------------
   * The defect a person sees before any other: a band that reserves a screen and fills a corner of
   * it. No craft dimension catches it, because an empty screen is only a low number in a population
   * of numbers, and a page of evenly medium screens scores the same as a page with a real quiet
   * beat next to a real dense one.
   *
   * Measured in two dimensions, not one. Scanning row by row asks only whether *something* was
   * painted at this height, so a split with a heading top-left and a list running the full height on
   * the right reports as solid — every row has ink in it — while the reader is looking at half a
   * screen of nothing under the heading. The hole this is looking for is a rectangle.
   *
   * Matter is what a reader can see: set text, drawn figures, and boxes filled or bounded distinctly
   * enough to read as objects. A section's own background is not matter; counting it would make
   * every band look full by definition.
   */
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const isMatter = (el) => {
    const r = rect(el);
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'svg' || tag === 'img' || tag === 'canvas' || tag === 'video') return true;
    // Set text is matter at the leaf, where the glyphs are. Marking every ancestor that contains
    // text would fill the grid with the boxes doing the containing.
    if (el.children.length === 0 && (el.textContent || '').trim()) return true;
    // A filled or bounded box is an object only while it is smaller than the screen it sits on.
    // Anything larger is the surface the objects were placed on.
    if (r.width * r.height < vw * vh * 0.5) {
      const m = (cs.backgroundColor || '').match(/rgba?\\(([^)]+)\\)/);
      const parts = m ? m[1].split(',') : [];
      const alpha = m ? (parts[3] === undefined ? 1 : parseFloat(parts[3])) : 0;
      if (alpha > 0.02) return true;
    }
    return false;
  };

  /*
   * Matter is mapped over the document once and sliced per section afterwards, rather than gathered
   * from each section's own descendants. A figure that hangs across a boundary belongs to the
   * section above it in the DOM and to the screen below it in the eye, and attributing by ancestry
   * reported the room it occupies as a hole in the band it is sitting in — the opposite of what it
   * is doing there.
   */
  const CELL = 20;
  const cols = Math.ceil(vw / CELL);
  const docRows = Math.ceil(document.documentElement.scrollHeight / CELL);
  const grid = new Uint8Array(docRows * cols);
  for (const el of document.querySelectorAll('*')) {
    if (!isMatter(el)) continue;
    const r = rect(el);
    const y0 = Math.max(0, Math.floor((r.top + window.scrollY) / CELL));
    const y1 = Math.min(docRows - 1, Math.floor((r.bottom + window.scrollY - 1) / CELL));
    const x0 = Math.max(0, Math.floor(r.left / CELL));
    const x1 = Math.min(cols - 1, Math.floor((r.right - 1) / CELL));
    for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) grid[y * cols + x] = 1;
  }

  // Largest all-empty rectangle in a binary grid. Standard largest-rectangle-under-a-histogram:
  // accumulate empty run heights per column, then for each row a monotonic stack finds the widest
  // span each height can hold. Sentinel -1 on the stack keeps the width arithmetic honest.
  const largestHole = (rowFrom, rowTo, colFrom, colTo) => {
    const width = colTo - colFrom + 1;
    const heights = new Int32Array(width);
    let best = { area: 0, w: 0, h: 0 };
    const stack = new Int32Array(width + 2);
    for (let y = rowFrom; y <= rowTo; y += 1) {
      for (let i = 0; i < width; i += 1) {
        heights[i] = grid[y * cols + colFrom + i] ? 0 : heights[i] + 1;
      }
      let top = 0;
      stack[top++] = -1;
      for (let i = 0; i <= width; i += 1) {
        const h = i === width ? 0 : heights[i];
        while (top > 1 && heights[stack[top - 1]] >= h) {
          const hi = stack[--top];
          const height = heights[hi];
          const w = i - stack[top - 1] - 1;
          const area = height * w;
          if (area > best.area) best = { area, w, h: height };
        }
        stack[top++] = i;
      }
    }
    return best;
  };

  for (const section of sections) {
    const sr = rect(section);
    const top = Math.floor((sr.top + window.scrollY) / CELL);
    const bottom = Math.min(docRows - 1, Math.floor((sr.bottom + window.scrollY - 1) / CELL));
    if (bottom - top < 6) continue;

    // Judge the band over the ground its own content claims — the wrap, not the viewport. Page
    // margins are empty on purpose; a full-bleed decorative field at x=0 must not drag the column
    // out to the glass and invent a hole the size of the screen. Prefer an explicit wrap when the
    // section has one; otherwise take the interquartile span of matter so a single edge speck
    // cannot set the bounds.
    const wrap = section.querySelector('.ds-wrap, .ds-wrap-wide, .ds-wrap-narrow');
    let left;
    let right;
    if (wrap) {
      const wr = rect(wrap);
      left = Math.max(0, Math.floor(wr.left / CELL));
      right = Math.min(cols - 1, Math.floor((wr.right - 1) / CELL));
    } else {
      const xs = [];
      for (let y = top; y <= bottom; y += 1) {
        for (let x = 0; x < cols; x += 1) if (grid[y * cols + x]) xs.push(x);
      }
      if (xs.length < 8) continue;
      xs.sort((a, b) => a - b);
      left = xs[Math.floor(xs.length * 0.1)];
      right = xs[Math.floor(xs.length * 0.9)];
    }
    if (right - left < 4) continue;

    const hole = largestHole(top, bottom, left, right);
    const holeW = hole.w * CELL;
    const holeH = hole.h * CELL;
    // A hole has to be wide enough and tall enough to be a hole rather than the padding inside a
    // card, and big enough overall to be the thing the eye lands on. Below any one of the three it
    // is space, which is the material this whole engine is trying to use well.
    if (holeW > vw * 0.28 && holeH > vh * 0.28 && holeW * holeH > vw * vh * 0.12) {
      out.vacancy.push({
        section: section.dataset.section,
        height: Math.round(sr.height),
        fill: Math.round((1 - (holeW * holeH) / (sr.height * (right - left + 1) * CELL)) * 100) / 100,
        gap: Math.round(holeW) + 'x' + Math.round(holeH),
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
  vacancy: Array<{ section: string; height: number; fill: number; gap: string }>;
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
        window.scrollTo({ top: y, left: 0, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 90));
      }
      // Instant — smooth scroll-behavior leaves residual scrollY and false nav/hero collisions.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
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
    for (const v of r.vacancy) console.log(`  vacancy     ${v.section} ${v.height}px tall — ${v.gap}px hole inside its own content column`);
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
