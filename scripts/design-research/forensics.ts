/**
 * Design forensics — measure rendered pages the way a design critic would, but numerically.
 *
 * Reads a local corpus file (never committed; see research/README.md), visits each entry with
 * Playwright, and emits an anonymised measurement record per reference. Output records carry a
 * stable `ref` id and a category only — no host names, no URLs, no third-party identities.
 *
 * Usage:
 *   pnpm research:forensics -- --corpus research/corpus.local.json --out research/measurements
 *   pnpm research:forensics -- --only ref-004 --headed
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

export interface CorpusEntry {
  /** Stable anonymised id, e.g. "ref-012". */
  ref: string;
  /** Broad bucket used for aggregation, never a brand or person. */
  category: string;
  /** Optional free-text role note (no names), e.g. "solo studio portfolio". */
  role?: string;
  url: string;
  /** Optional extra routes to sample on the same origin. */
  routes?: string[];
}

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

/* ------------------------------------------------------------------ */
/* In-page probe                                                       */
/* ------------------------------------------------------------------ */

/**
 * Serialised in the browser. Keep it dependency-free and defensive: reference sites are hostile,
 * lazy, and occasionally throw from getComputedStyle on detached nodes.
 */
export const PROBE = `(() => {
  const out = {};
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const els = Array.from(document.querySelectorAll("body *")).filter((el) => {
    if (el instanceof HTMLScriptElement || el instanceof HTMLStyleElement) return false;
    if (el.tagName === "NOSCRIPT" || el.tagName === "TEMPLATE") return false;
    return true;
  });

  const info = [];
  for (const el of els) {
    let cs;
    try { cs = getComputedStyle(el); } catch { continue; }
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
    let r;
    try { r = el.getBoundingClientRect(); } catch { continue; }
    const area = Math.max(0, r.width) * Math.max(0, r.height);
    const text = (el.childNodes ? Array.from(el.childNodes) : [])
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent || "").trim())
      .join(" ")
      .trim();
    info.push({ el, cs, r, area, text, tag: el.tagName.toLowerCase() });
  }

  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const tally = (arr) => {
    const m = new Map();
    for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
    return Array.from(m.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  };
  const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p;

  /* ---------------- colour helpers ---------------- */
  function parseColor(str) {
    if (!str) return null;
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number);
    const [r, g, b] = parts;
    const a = parts.length > 3 ? parts[3] : 1;
    if (![r, g, b].every((n) => Number.isFinite(n))) return null;
    return { r, g, b, a: Number.isFinite(a) ? a : 1 };
  }
  function lum(c) {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrast(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function toHsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
  }
  function effectiveBg(el) {
    let node = el;
    for (let i = 0; i < 12 && node; i += 1) {
      let cs;
      try { cs = getComputedStyle(node); } catch { return { r: 255, g: 255, b: 255, a: 1 }; }
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.5) return c;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  /* ---------------- typography ---------------- */
  const textNodes = info.filter((i) => i.text.length > 0);
  const famArea = new Map();
  const sizeArea = new Map();
  const weights = [];
  const sizes = [];
  let fluidType = false;

  for (const i of textNodes) {
    const fam = (i.cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim();
    const size = round(num(i.cs.fontSize), 1);
    const charArea = i.text.length * size * size * 0.45;
    famArea.set(fam, (famArea.get(fam) || 0) + charArea);
    sizeArea.set(size, (sizeArea.get(size) || 0) + charArea);
    weights.push(i.cs.fontWeight);
    sizes.push(size);
  }
  const famRanked = Array.from(famArea.entries())
    .map(([family, area]) => ({ family, area: Math.round(area) }))
    .sort((a, b) => b.area - a.area);

  const headings = info.filter((i) => /^h[1-3]$/.test(i.tag) && i.text.length > 0);
  // Premium sites frequently render the visual headline as a styled div/span, so trust
  // rendered size over tag semantics when identifying the display voice.
  const h1 = textNodes
    .filter((i) => i.text.length >= 8 && i.r.top < vh * 2.2 && i.r.width > 60 && i.r.height > 12)
    .sort((a, b) => num(b.cs.fontSize) - num(a.cs.fontSize))[0]
    || headings.find((i) => i.tag === "h1")
    || headings[0];
  // Screen-reader-only paragraphs are often the longest text on the page; a 1px-wide clipped
  // element must never define the measured body voice.
  const bodyCand = textNodes
    .filter((i) => i.text.length > 60 && i.r.width > 140 && i.r.height > 8 && ["p", "li", "span", "div"].includes(i.tag))
    .sort((a, b) => b.text.length - a.text.length)[0];

  const sizeSet = Array.from(new Set(sizes.filter((s) => s >= 9))).sort((a, b) => a - b);
  const ratios = [];
  for (let i = 1; i < sizeSet.length; i += 1) {
    if (sizeSet[i - 1] > 0) ratios.push(round(sizeSet[i] / sizeSet[i - 1], 3));
  }

  function measureCh(entry) {
    if (!entry) return null;
    const size = num(entry.cs.fontSize);
    if (!size) return null;
    return round(entry.r.width / (size * 0.5), 1);
  }

  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        const t = rule.cssText || "";
        if (/font-size:\\s*clamp\\(|font-size:[^;]*vw/.test(t)) { fluidType = true; break; }
      }
      if (fluidType) break;
    }
  } catch {}

  out.typography = {
    families: famRanked.slice(0, 6),
    familyCount: famRanked.length,
    displayFamily: (h1 && (h1.cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim()) || null,
    bodyFamily: (bodyCand && (bodyCand.cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim()) || null,
    distinctSizes: sizeSet.length,
    sizes: sizeSet,
    topSizesByArea: Array.from(sizeArea.entries())
      .map(([px, area]) => ({ px, area: Math.round(area) }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 8),
    stepRatios: ratios,
    distinctWeights: Array.from(new Set(weights)).sort(),
    fluidType,
    h1: h1 ? {
      px: round(num(h1.cs.fontSize), 1),
      pxPerVw: round((num(h1.cs.fontSize) / vw) * 100, 3),
      weight: h1.cs.fontWeight,
      lineHeight: round(num(h1.cs.lineHeight) / (num(h1.cs.fontSize) || 1), 3),
      letterSpacingEm: round(num(h1.cs.letterSpacing) / (num(h1.cs.fontSize) || 1), 4),
      chars: h1.text.length,
      measureCh: measureCh(h1),
      transform: h1.cs.textTransform,
    } : null,
    body: bodyCand ? {
      px: round(num(bodyCand.cs.fontSize), 1),
      weight: bodyCand.cs.fontWeight,
      lineHeight: round(num(bodyCand.cs.lineHeight) / (num(bodyCand.cs.fontSize) || 1), 3),
      letterSpacingEm: round(num(bodyCand.cs.letterSpacing) / (num(bodyCand.cs.fontSize) || 1), 4),
      measureCh: measureCh(bodyCand),
    } : null,
    displayToBodyRatio: h1 && bodyCand ? round(num(h1.cs.fontSize) / (num(bodyCand.cs.fontSize) || 1), 2) : null,
    variationSettings: Array.from(new Set(textNodes.map((i) => i.cs.fontVariationSettings).filter((v) => v && v !== "normal"))).slice(0, 4),
    featureSettings: Array.from(new Set(textNodes.map((i) => i.cs.fontFeatureSettings).filter((v) => v && v !== "normal"))).slice(0, 4),
    uppercaseLabels: textNodes.filter((i) => i.cs.textTransform === "uppercase" && i.text.length < 40).length,
  };

  /* ---------------- declared token system ---------------- */
  const tokenNames = new Set();
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (!rule.style || !rule.selectorText) continue;
        if (!/(^|,)\\s*(:root|html|body|\\[data-theme)/.test(rule.selectorText)) continue;
        for (let i = 0; i < rule.style.length; i += 1) {
          const prop = rule.style[i];
          if (prop && prop.startsWith("--")) tokenNames.add(prop);
        }
      }
    }
  } catch {}
  // Cross-origin stylesheets throw on cssRules; computedStyleMap still enumerates inherited
  // custom properties, which is the more reliable read of a site's declared token surface.
  try {
    const map = document.documentElement.computedStyleMap
      ? document.documentElement.computedStyleMap()
      : null;
    if (map) for (const key of map.keys()) if (key.startsWith("--")) tokenNames.add(key);
  } catch {}
  const tokenList = Array.from(tokenNames);
  const bucket = (re) => tokenList.filter((t) => re.test(t)).length;
  out.tokens = {
    declared: tokenList.length,
    color: bucket(/color|bg|background|fg|ink|surface|accent|brand|border/i),
    space: bucket(/space|spacing|gap|size-|inset|pad/i),
    type: bucket(/font|text|type|leading|tracking|letter/i),
    radius: bucket(/radius|rounded|corner/i),
    shadow: bucket(/shadow|elevation|depth/i),
    motion: bucket(/ease|duration|transition|anim|spring/i),
    layer: bucket(/z-|layer|index/i),
  };

  /* ---------------- colour ---------------- */
  const bgArea = new Map();
  const fgArea = new Map();
  let gradientCount = 0;
  const contrasts = [];
  let minTextContrast = 99;

  for (const i of info) {
    const bg = parseColor(i.cs.backgroundColor);
    if (bg && bg.a > 0.05 && i.area > 400) {
      const key = \`rgb(\${bg.r},\${bg.g},\${bg.b})\`;
      bgArea.set(key, (bgArea.get(key) || 0) + i.area);
    }
    if ((i.cs.backgroundImage || "").includes("gradient")) gradientCount += 1;
    // Text that occupies no area is not text a reader is asked to read, and letting it into the
    // contrast sample lets clipped and off-screen nodes define a page's measured legibility.
    if (i.text.length > 0 && i.area > 0) {
      const fg = parseColor(i.cs.color);
      if (fg) {
        const key = \`rgb(\${fg.r},\${fg.g},\${fg.b})\`;
        fgArea.set(key, (fgArea.get(key) || 0) + i.text.length);
        const c = round(contrast(fg, effectiveBg(i.el)), 2);
        contrasts.push(c);
        if (i.text.length > 20 && c < minTextContrast) minTextContrast = c;
      }
    }
  }

  const bgRanked = Array.from(bgArea.entries()).map(([color, area]) => ({ color, area: Math.round(area) })).sort((a, b) => b.area - a.area);
  const fgRanked = Array.from(fgArea.entries()).map(([color, chars]) => ({ color, chars })).sort((a, b) => b.chars - a.chars);
  const allColors = [...bgRanked.map((b) => b.color), ...fgRanked.map((f) => f.color)]
    .map(parseColor).filter(Boolean).map(toHsl);
  const chromatic = allColors.filter((c) => c.s > 12 && c.l > 4 && c.l < 96);
  const neutrals = allColors.filter((c) => c.s <= 12);

  const pageBg = parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  const pageBgHsl = toHsl(pageBg);

  out.color = {
    backgrounds: bgRanked.slice(0, 8),
    textColors: fgRanked.slice(0, 6),
    distinctBackgrounds: bgRanked.length,
    distinctTextColors: fgRanked.length,
    distinctHues: new Set(chromatic.map((c) => Math.round(c.h / 15))).size,
    chromaticCount: chromatic.length,
    maxSaturation: chromatic.length ? Math.max(...chromatic.map((c) => c.s)) : 0,
    medianNeutralHue: neutrals.length ? neutrals.map((c) => c.h).sort((a, b) => a - b)[Math.floor(neutrals.length / 2)] : null,
    medianNeutralSat: neutrals.length ? round(neutrals.map((c) => c.s).sort((a, b) => a - b)[Math.floor(neutrals.length / 2)], 1) : null,
    pageBackground: pageBgHsl,
    isDark: pageBgHsl.l < 45,
    gradientCount,
    minTextContrast: minTextContrast === 99 ? null : minTextContrast,
    medianTextContrast: contrasts.length ? round(contrasts.sort((a, b) => a - b)[Math.floor(contrasts.length / 2)], 2) : null,
  };

  /* ---------------- space & layout ---------------- */
  const sectionish = info.filter((i) => ["section", "header", "footer", "main", "article"].includes(i.tag) && i.r.width > vw * 0.6);
  const padTop = sectionish.map((i) => round(num(i.cs.paddingTop), 0)).filter((v) => v > 0);
  const padBottom = sectionish.map((i) => round(num(i.cs.paddingBottom), 0)).filter((v) => v > 0);
  const gaps = info.map((i) => round(num(i.cs.gap || i.cs.rowGap), 0)).filter((v) => v > 0);

  const wideBlocks = info.filter((i) => i.r.width > 320 && i.r.width < vw * 0.98 && i.area > 20000);
  const widthTally = tally(wideBlocks.map((i) => Math.round(i.r.width / 10) * 10));
  const containerMax = widthTally.length ? widthTally[0].value : null;

  const grids = info.filter((i) => i.cs.display === "grid" || i.cs.display === "inline-grid");
  const columnSpecs = grids.map((i) => (i.cs.gridTemplateColumns || "").split(" ").filter(Boolean));
  const columnCounts = columnSpecs.map((c) => c.length).filter((n) => n > 1);
  const asymmetric = columnSpecs.filter((cols) => {
    if (cols.length < 2) return false;
    const nums = cols.map((c) => parseFloat(c)).filter((n) => Number.isFinite(n));
    if (nums.length !== cols.length) return false;
    return Math.max(...nums) / Math.min(...nums) > 1.15;
  }).length;

  const allSpacing = [...padTop, ...padBottom, ...gaps].filter((v) => v > 0);
  const onEight = allSpacing.filter((v) => v % 8 === 0).length;
  const onFour = allSpacing.filter((v) => v % 4 === 0).length;

  const aboveFold = info.filter((i) => i.r.top < vh && i.r.bottom > 0);
  const aboveFoldText = aboveFold.reduce((n, i) => n + i.text.length, 0);
  const aboveFoldInk = aboveFold.reduce((n, i) => {
    const bg = parseColor(i.cs.backgroundColor);
    const painted = (bg && bg.a > 0.05) || i.text.length > 0 || (i.cs.borderTopWidth && num(i.cs.borderTopWidth) > 0);
    return painted ? n + Math.min(i.area, vw * vh) : n;
  }, 0);

  out.space = {
    sectionPaddingTop: padTop.sort((a, b) => a - b),
    sectionPaddingBottom: padBottom.sort((a, b) => a - b),
    medianSectionPadding: padTop.length ? padTop[Math.floor(padTop.length / 2)] : null,
    maxSectionPadding: padTop.length ? Math.max(...padTop) : null,
    gaps: Array.from(new Set(gaps)).sort((a, b) => a - b).slice(0, 16),
    containerMax,
    containerRatio: containerMax ? round(containerMax / vw, 3) : null,
    eightPointConformity: allSpacing.length ? round(onEight / allSpacing.length, 3) : null,
    fourPointConformity: allSpacing.length ? round(onFour / allSpacing.length, 3) : null,
    distinctSpacingValues: new Set(allSpacing).size,
  };

  out.layout = {
    sections: sectionish.length,
    gridContainers: grids.length,
    columnCounts: tally(columnCounts).slice(0, 6),
    asymmetricGrids: asymmetric,
    asymmetryRatio: columnCounts.length ? round(asymmetric / columnCounts.length, 3) : null,
    fullBleed: info.filter((i) => i.r.width >= vw - 2 && i.area > vw * 200).length,
    aboveFoldElements: aboveFold.length,
    aboveFoldTextChars: aboveFoldText,
    aboveFoldInkRatio: round(Math.min(1, aboveFoldInk / (vw * vh)), 3),
    stickyElements: info.filter((i) => i.cs.position === "sticky" || i.cs.position === "fixed").length,
    documentHeightVh: round(document.documentElement.scrollHeight / vh, 2),
  };

  /* ---------------- hero composition ---------------- */
  const heroText = aboveFold.filter((i) => i.text.length > 0);
  const heroDisplay = heroText
    .filter((i) => i.r.width > 60 && i.r.height > 12)
    .sort((a, b) => num(b.cs.fontSize) - num(a.cs.fontSize))[0];
  const heroCtas = aboveFold.filter((i) => ["a", "button"].includes(i.tag) && i.text.length > 1 && i.r.height >= 32);
  const navBar = info.find((i) => (i.tag === "header" || i.tag === "nav") && i.r.top <= 8 && i.r.width > vw * 0.6);
  out.hero = {
    displayPx: heroDisplay ? round(num(heroDisplay.cs.fontSize), 1) : null,
    displayVwRatio: heroDisplay ? round((num(heroDisplay.cs.fontSize) / vw) * 100, 2) : null,
    displayChars: heroDisplay ? heroDisplay.text.length : null,
    displayMeasureCh: measureCh(heroDisplay),
    displayWeight: heroDisplay ? heroDisplay.cs.fontWeight : null,
    displayLineHeight: heroDisplay ? round(num(heroDisplay.cs.lineHeight) / (num(heroDisplay.cs.fontSize) || 1), 3) : null,
    textBlocks: heroText.length,
    totalChars: aboveFoldText,
    ctaButtons: heroCtas.length,
    ctaHeights: Array.from(new Set(heroCtas.map((i) => Math.round(i.r.height)))).sort((a, b) => a - b),
    hasHeroMedia: aboveFold.some((i) => ["img", "video", "canvas"].includes(i.tag) && i.area > vw * vh * 0.06),
    navHeight: navBar ? Math.round(navBar.r.height) : null,
    firstTextTopVh: heroText.length ? round(Math.min(...heroText.map((i) => i.r.top)) / vh, 3) : null,
  };

  /* ---------------- vertical bands (rhythm of the scroll) ----------------
   *
   * Band weight has to describe what a reader sees, not what the DOM contains. Two corrections
   * matter here, both found by reading raw records where a single band reported half a million
   * characters:
   *  - only painted elements count (a clipped or zero-area node is not part of the composition)
   *  - a single element contributes at most a paragraph, so one node holding a serialised payload
   *    cannot outweigh an entire page of real copy
   * inkRatio is the geometry-only companion: the share of the band actually covered by painted
   * boxes, which describes rhythm without depending on how text is chunked into elements.
   */
  const CHAR_CAP = 600;
  const totalH = document.documentElement.scrollHeight;
  const bandCount = Math.min(10, Math.max(2, Math.round(totalH / vh)));
  const bands = [];
  for (let b = 0; b < bandCount; b += 1) {
    const top = (b * totalH) / bandCount;
    const bottom = ((b + 1) * totalH) / bandCount;
    const bandH = bottom - top;
    const inBand = info.filter((i) => {
      if (i.area <= 0 || i.r.width <= 0) return false;
      const absTop = i.r.top + window.scrollY;
      return absTop >= top && absTop < bottom;
    });
    const bgs = inBand.map((i) => parseColor(i.cs.backgroundColor)).filter((c) => c && c.a > 0.5);
    const bgKey = bgs.length ? toHsl(bgs[Math.floor(bgs.length / 2)]) : null;
    const inked = inBand.reduce((n, i) => {
      const bg = parseColor(i.cs.backgroundColor);
      const painted = (bg && bg.a > 0.05) || i.text.length > 0;
      if (!painted) return n;
      return n + Math.min(i.area, vw * bandH);
    }, 0);
    bands.push({
      index: b,
      elements: inBand.length,
      chars: inBand.reduce((n, i) => n + Math.min(i.text.length, CHAR_CAP), 0),
      inkRatio: bandH > 0 ? round(Math.min(4, inked / (vw * bandH)), 3) : 0,
      maxFontPx: inBand.length ? round(Math.max(...inBand.map((i) => num(i.cs.fontSize))), 1) : 0,
      medianBgLightness: bgKey ? bgKey.l : null,
    });
  }
  out.bands = bands;

  /* ---------------- composition: what shape the page makes ----------------
   *
   * Everything above measures quantity — how big, how dark, how far apart. A template can sit
   * inside every one of those corridors and still read as assembled, because none of them can see
   * structure. This block measures structure: how many alignment axes and content widths a page
   * commits to, whether anything reaches the viewport edge, how tone moves down the scroll, and
   * whether consecutive sections make the same shape twice.
   */
  const pageH = Math.max(totalH, vh);
  const blocks = info.filter((i) => i.r.width > 100 && i.r.height > 20 && i.area > 4000);

  // Only content that stops short of the full width is governed by a grid; a full-bleed wrapper
  // carries no alignment information.
  const contentBlocks = blocks.filter((i) => i.r.width < vw * 0.97 && i.r.left >= -2);
  const blockTotal = contentBlocks.length || 1;
  const edgeTally = tally(contentBlocks.map((i) => Math.round(i.r.left / 4) * 4));
  const majorAxes = edgeTally.filter((e) => e.count / blockTotal >= 0.04);
  const spineConformity = edgeTally.slice(0, 3).reduce((n, e) => n + e.count, 0) / blockTotal;
  const gutterPx = majorAxes.length ? Math.min.apply(null, majorAxes.map((e) => e.value)) : null;

  // Column widths in play. One width for everything is the clearest structural tell there is:
  // a designed page has a wide tier, a prose tier, and usually something narrower still.
  const contentWidthTally = tally(contentBlocks.map((i) => Math.round(i.r.width / 40) * 40));
  const widthTiers = contentWidthTally.filter((e) => e.count / blockTotal >= 0.05).length;

  const bleedBands = info.filter((i) => {
    if (i.r.width < vw - 4 || i.r.height < 80) return false;
    const bg = parseColor(i.cs.backgroundColor);
    const img = i.cs.backgroundImage && i.cs.backgroundImage !== "none";
    return (bg && bg.a > 0.05) || !!img;
  });

  // Tone down the scroll, read from whichever painted surface actually covers each band.
  function bandTone(top, bottom) {
    let best = null;
    for (const i of info) {
      const bg = parseColor(i.cs.backgroundColor);
      if (!bg || bg.a < 0.5) continue;
      const absTop = i.r.top + window.scrollY;
      const overlap = Math.min(absTop + i.r.height, bottom) - Math.max(absTop, top);
      if (overlap <= 0) continue;
      const cover = overlap * Math.min(i.r.width, vw);
      if (!best || cover > best.cover) best = { cover: cover, l: toHsl(bg).l };
    }
    const span = Math.max(1, (bottom - top) * vw);
    return best && best.cover > span * 0.3 ? best.l : pageBgHsl.l;
  }
  const tones = [];
  for (let b = 0; b < bandCount; b += 1) {
    tones.push(round(bandTone((b * totalH) / bandCount, ((b + 1) * totalH) / bandCount), 1));
  }
  const toneSpread = tones.length ? round(Math.max.apply(null, tones) - Math.min.apply(null, tones), 1) : 0;
  const invertedBands = tones.filter((l) => (pageBgHsl.l >= 50 ? l < 30 : l > 70)).length;

  /** Classify the shape a section makes, by descending to the first level that branches. */
  function archetypeOf(entry) {
    const sw = entry.r.width;
    const sh = entry.r.height;
    if (sw <= 0 || sh <= 0) return "empty";
    let mediaArea = 0;
    try {
      for (const m of Array.from(entry.el.querySelectorAll("img,video,canvas,picture"))) {
        const r = m.getBoundingClientRect();
        mediaArea += Math.max(0, r.width) * Math.max(0, r.height);
      }
    } catch {}
    if (mediaArea / (sw * sh) > 0.3) return "media";
    try { if (entry.el.querySelector("table")) return "table"; } catch {}
    let level = [];
    try { level = Array.from(entry.el.children); } catch { return "single"; }
    for (let d = 0; d < 5 && level.length; d += 1) {
      const subs = [];
      for (const c of level) {
        let r;
        try { r = c.getBoundingClientRect(); } catch { continue; }
        if (r.width > 60 && r.height > 40) subs.push(r);
      }
      if (subs.length >= 2) {
        const cols = new Set(subs.map((r) => Math.round(r.left / 24))).size;
        const rows = new Set(subs.map((r) => Math.round(r.top / 24))).size;
        if (cols >= 3) return "grid";
        if (cols === 2) return subs.length > 4 ? "grid" : "split";
        if (rows >= 3) return "list";
        return "single";
      }
      const next = [];
      for (const c of level) {
        try { next.push.apply(next, Array.from(c.children)); } catch {}
      }
      level = next;
    }
    return "single";
  }

  const ordered = sectionish
    .slice()
    .sort((a, b) => a.r.top + window.scrollY - (b.r.top + window.scrollY));
  const shapes = ordered.map(archetypeOf);
  let maxShapeRun = 0;
  let currentRun = 0;
  for (let i = 0; i < shapes.length; i += 1) {
    currentRun = i > 0 && shapes[i] === shapes[i - 1] ? currentRun + 1 : 1;
    if (currentRun > maxShapeRun) maxShapeRun = currentRun;
  }

  const layered = info.filter((i) => {
    if (i.area < 8000) return false;
    if (num(i.cs.marginTop) < -8 || num(i.cs.marginBottom) < -8) return true;
    if (i.cs.position === "absolute" && i.area > 30000) return true;
    return false;
  }).length;

  let accentArea = 0;
  for (const i of info) {
    const bg = parseColor(i.cs.backgroundColor);
    if (!bg || bg.a < 0.4 || i.area < 200) continue;
    const h = toHsl(bg);
    if (h.s > 15 && h.l > 6 && h.l < 94) accentArea += Math.min(i.area, vw * pageH);
  }

  const ruleEls = info.filter((i) => {
    if (i.tag === "hr") return true;
    if (i.r.height <= 3 && i.r.width > vw * 0.12) return true;
    const bt = num(i.cs.borderTopWidth);
    const bb = num(i.cs.borderBottomWidth);
    const bl = num(i.cs.borderLeftWidth);
    const br = num(i.cs.borderRightWidth);
    return (bt > 0 || bb > 0) && bl === 0 && br === 0 && i.r.width > vw * 0.2;
  }).length;

  const ordinalMarks = textNodes.filter((i) => {
    const t = i.text.trim();
    return t.length <= 4 && /^\\(?(0\\d|[1-9]\\d?)\\)?[.)]?$/.test(t);
  }).length;

  // A display line that changes voice partway through — a second weight, an italic, a tonal shift.
  // Doing this at all requires someone to have decided which words carry the emphasis.
  let mixedDisplay = 0;
  for (const i of info) {
    const size = num(i.cs.fontSize);
    if (size < 26) continue;
    let kids = [];
    try { kids = Array.from(i.el.children); } catch { continue; }
    let mixed = false;
    for (const k of kids) {
      if (!k.textContent || !k.textContent.trim()) continue;
      let ks;
      try { ks = getComputedStyle(k); } catch { continue; }
      if (
        ks.fontStyle !== i.cs.fontStyle ||
        ks.fontWeight !== i.cs.fontWeight ||
        Math.abs(num(ks.fontSize) - size) > 2 ||
        (ks.fontFamily || "").split(",")[0] !== (i.cs.fontFamily || "").split(",")[0] ||
        ks.color !== i.cs.color
      ) mixed = true;
    }
    if (mixed) mixedDisplay += 1;
  }

  // Drawn matter of any kind — photography, diagrams, charts, product surfaces. Counted by
  // outermost node so a diagram built from nested SVG is one figure, not forty.
  let figureArea = 0;
  let figureCount = 0;
  let foldFigureArea = 0;
  try {
    const nodes = Array.from(document.querySelectorAll("img,video,canvas,picture,svg"));
    const set = new Set(nodes);
    for (const m of nodes) {
      let ancestor = m.parentElement;
      let nested = false;
      while (ancestor) {
        if (set.has(ancestor)) { nested = true; break; }
        ancestor = ancestor.parentElement;
      }
      if (nested) continue;
      const r = m.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) continue;
      figureArea += r.width * r.height;
      figureCount += 1;
      const top = r.top + window.scrollY;
      const overlap = Math.min(top + r.height, vh) - Math.max(top, 0);
      if (overlap > 0) foldFigureArea += overlap * Math.min(r.width, vw);
    }
  } catch {}

  out.composition = {
    alignmentAxes: majorAxes.length,
    spineConformity: round(spineConformity, 3),
    edgeGutterPx: gutterPx,
    widthTiers,
    bleedBands: bleedBands.length,
    bleedRatio: sectionish.length ? round(bleedBands.length / sectionish.length, 3) : null,
    toneSpread,
    invertedBands,
    invertedShare: tones.length ? round(invertedBands / tones.length, 3) : 0,
    shapeVariety: new Set(shapes).size,
    maxShapeRun,
    shapeRunRatio: shapes.length ? round(maxShapeRun / shapes.length, 3) : null,
    layeredElements: layered,
    accentAreaRatio: round(Math.min(1, accentArea / (vw * pageH)), 4),
    ruleElements: ruleEls,
    ruleDensity: round(ruleEls / Math.max(1, totalH / vh), 2),
    ordinalMarks,
    mixedDisplayBlocks: mixedDisplay,
    figures: figureCount,
    figureAreaRatio: round(Math.min(1, figureArea / (vw * pageH)), 4),
    foldFigureRatio: round(Math.min(1, foldFigureArea / (vw * vh)), 4),
  };

  /* ---------------- shape & depth ---------------- */
  const radii = info.map((i) => round(num(i.cs.borderTopLeftRadius), 0)).filter((v) => v > 0);
  const shadows = info.map((i) => i.cs.boxShadow).filter((v) => v && v !== "none");
  const borderWidths = info.map((i) => round(num(i.cs.borderTopWidth), 1)).filter((v) => v > 0);

  function shadowStrength(s) {
    const alpha = (s.match(/rgba?\\([^)]*?([0-9.]+)\\s*\\)/) || [])[1];
    const blur = (s.match(/(-?[0-9.]+)px/g) || []).map(parseFloat)[2] || 0;
    return { alpha: alpha ? parseFloat(alpha) : 1, blur };
  }
  const shadowStats = shadows.map(shadowStrength);

  out.shape = {
    radii: tally(radii).slice(0, 8),
    distinctRadii: new Set(radii).size,
    medianRadius: radii.length ? radii.sort((a, b) => a - b)[Math.floor(radii.length / 2)] : 0,
    maxRadius: radii.length ? Math.max(...radii.filter((r) => r < 400)) : 0,
    pillCount: radii.filter((r) => r >= 100).length,
    shadowElements: shadows.length,
    shadowRatio: info.length ? round(shadows.length / info.length, 3) : 0,
    medianShadowAlpha: shadowStats.length ? round(shadowStats.map((s) => s.alpha).sort((a, b) => a - b)[Math.floor(shadowStats.length / 2)], 3) : null,
    medianShadowBlur: shadowStats.length ? shadowStats.map((s) => s.blur).sort((a, b) => a - b)[Math.floor(shadowStats.length / 2)] : null,
    distinctShadows: new Set(shadows).size,
    hairlineRatio: borderWidths.length ? round(borderWidths.filter((w) => w <= 1.5).length / borderWidths.length, 3) : null,
    borderedElements: borderWidths.length,
  };

  /* ---------------- motion ---------------- */
  const transitions = info.filter((i) => i.cs.transitionDuration && i.cs.transitionDuration !== "0s");
  const durations = [];
  const easings = [];
  for (const i of transitions) {
    for (const d of (i.cs.transitionDuration || "").split(",")) {
      const v = parseFloat(d);
      if (Number.isFinite(v) && v > 0) durations.push(Math.round(v * 1000));
    }
    for (const e of (i.cs.transitionTimingFunction || "").split(/,(?![^(]*\\))/)) {
      const t = e.trim();
      if (t) easings.push(t);
    }
  }
  const animated = info.filter((i) => i.cs.animationName && i.cs.animationName !== "none");
  const infinite = animated.filter((i) => (i.cs.animationIterationCount || "").includes("infinite"));

  let reducedMotionRules = 0;
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (rule.conditionText && /prefers-reduced-motion/.test(rule.conditionText)) reducedMotionRules += 1;
      }
    }
  } catch {}

  out.motion = {
    transitionElements: transitions.length,
    transitionRatio: info.length ? round(transitions.length / info.length, 3) : 0,
    medianDurationMs: durations.length ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)] : null,
    p90DurationMs: durations.length ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.9)] : null,
    topEasings: tally(easings).slice(0, 4),
    animatedElements: animated.length,
    infiniteAnimations: infinite.length,
    reducedMotionRules,
    hasVideo: document.querySelectorAll("video").length,
    hasCanvas: document.querySelectorAll("canvas").length,
    hasWebGL: Array.from(document.querySelectorAll("canvas")).some((c) => {
      try { return !!(c.getContext("webgl") || c.getContext("webgl2")); } catch { return false; }
    }),
    staggerGroups: document.querySelectorAll(".ds-stagger, [data-stagger]").length,
    enterBeats: document.querySelectorAll(".ds-enter, [data-enter]").length,
    chapterPins: document.querySelectorAll(".ds-chapter-pin, [data-chapter-pin]").length,
    revealNodes: document.querySelectorAll(".ds-reveal, [data-reveal]").length,
    choreographyScore:
      document.querySelectorAll(".ds-enter, [data-enter]").length +
      document.querySelectorAll(".ds-stagger, [data-stagger]").length +
      document.querySelectorAll(".ds-chapter-pin, [data-chapter-pin]").length +
      Math.min(6, document.querySelectorAll(".ds-reveal, [data-reveal]").length),
  };

  /* ---------------- media ---------------- */
  const imgs = Array.from(document.querySelectorAll("img"));
  const imgAreas = imgs.map((im) => { const r = im.getBoundingClientRect(); return r.width * r.height; });
  out.media = {
    images: imgs.length,
    svgInline: document.querySelectorAll("svg").length,
    videos: document.querySelectorAll("video").length,
    imageAreaRatio: round(imgAreas.reduce((a, b) => a + b, 0) / (vw * document.documentElement.scrollHeight || 1), 4),
    altCoverage: imgs.length ? round(imgs.filter((im) => im.getAttribute("alt") !== null).length / imgs.length, 3) : null,
    lazyCoverage: imgs.length ? round(imgs.filter((im) => im.getAttribute("loading") === "lazy").length / imgs.length, 3) : null,
    modernFormats: round(imgs.filter((im) => /\\.(webp|avif)/i.test(im.currentSrc || im.src || "")).length / (imgs.length || 1), 3),
  };

  /* ---------------- semantics ---------------- */
  const buttons = Array.from(document.querySelectorAll("a,button")).filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const ctaWords = /(get|start|try|book|demo|contact|sign|talk|request|buy|subscribe|join|schedule)/i;
  const primaryCtas = buttons.filter((b) => ctaWords.test((b.textContent || "").trim()));
  let focusVisibleRules = 0;
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (rule.selectorText && /:focus-visible/.test(rule.selectorText)) focusVisibleRules += 1;
      }
    }
  } catch {}

  const headingLevels = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => Number(h.tagName[1]));
  let headingJumps = 0;
  for (let i = 1; i < headingLevels.length; i += 1) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) headingJumps += 1;
  }

  out.semantics = {
    landmarks: {
      header: document.querySelectorAll("header").length,
      nav: document.querySelectorAll("nav").length,
      main: document.querySelectorAll("main").length,
      footer: document.querySelectorAll("footer").length,
    },
    h1Count: document.querySelectorAll("h1").length,
    headingCount: headingLevels.length,
    headingJumps,
    navLinks: document.querySelectorAll("nav a").length,
    interactiveElements: buttons.length,
    ctaCount: primaryCtas.length,
    formFields: document.querySelectorAll("input,select,textarea").length,
    focusVisibleRules,
    domNodes: document.querySelectorAll("*").length,
    textChars: (document.body.innerText || "").length,
  };

  return out;
})()`;

/* ------------------------------------------------------------------ */
/* Driver                                                              */
/* ------------------------------------------------------------------ */

interface NetStat {
  requests: number;
  bytes: number;
  byType: Record<string, { requests: number; bytes: number }>;
  fontFiles: number;
  thirdPartyHosts: number;
}

export async function measurePage(
  browser: Browser,
  url: string,
  viewport: { name: string; width: number; height: number },
): Promise<Record<string, unknown>> {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  });
  const page: Page = await context.newPage();

  const net: NetStat = { requests: 0, bytes: 0, byType: {}, fontFiles: 0, thirdPartyHosts: 0 };
  const hosts = new Set<string>();
  const origin = new URL(url).host;

  page.on("response", (res) => {
    net.requests += 1;
    const req = res.request();
    const type = req.resourceType();
    const bucket = (net.byType[type] ??= { requests: 0, bytes: 0 });
    bucket.requests += 1;
    const len = Number(res.headers()["content-length"] ?? 0);
    if (Number.isFinite(len) && len > 0) {
      bucket.bytes += len;
      net.bytes += len;
    }
    if (type === "font") net.fontFiles += 1;
    try {
      const h = new URL(res.url()).host;
      hosts.add(h);
    } catch {
      /* ignore */
    }
  });

  const started = Date.now();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(2200);
  try {
    await page.waitForLoadState("networkidle", { timeout: 8_000 });
  } catch {
    /* many premium sites keep sockets open; measurement is still valid */
  }
  const loadMs = Date.now() - started;

  net.thirdPartyHosts = Array.from(hosts).filter((h) => h !== origin).length;

  const paint = await page.evaluate(() => {
    const entries = performance.getEntriesByType("paint") as PerformanceEntry[];
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return {
      fcpMs: fcp ? Math.round(fcp.startTime) : null,
      domInteractiveMs: nav ? Math.round(nav.domInteractive) : null,
      transferBytes: nav ? nav.transferSize : null,
    };
  });

  const probe = (await page.evaluate(PROBE)) as Record<string, unknown>;

  // Scroll pass: reveal-on-scroll content changes the measurable surface materially.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
  await page.waitForTimeout(900);
  const scrolled = (await page.evaluate(PROBE)) as Record<string, unknown>;

  await context.close();

  return {
    viewport: viewport.name,
    loadMs,
    paint,
    network: net,
    initial: probe,
    afterScroll: {
      motion: (scrolled as { motion?: unknown }).motion,
      layout: (scrolled as { layout?: unknown }).layout,
      media: (scrolled as { media?: unknown }).media,
    },
  };
}

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

/** Scripts run from package dirs under pnpm -F; anchor paths at the workspace root. */
export function repoRoot(from = process.cwd()): string {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

async function main(): Promise<void> {
  const root = repoRoot();
  const corpusPath = resolve(root, arg("corpus", "research/corpus.local.json")!);
  const outDir = resolve(root, arg("out", "research/measurements")!);
  const only = arg("only");

  if (!existsSync(corpusPath)) {
    console.error(
      `No corpus at ${corpusPath}.\n` +
        `Create one locally (it is git-ignored on purpose) using the shape documented in research/README.md.`,
    );
    process.exit(2);
  }

  const corpus = JSON.parse(readFileSync(corpusPath, "utf8")) as CorpusEntry[];
  const entries = only ? corpus.filter((c) => c.ref === only) : corpus;
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const manifest: Array<{ ref: string; category: string; role?: string; urlHash: string; ok: boolean }> = [];

  for (const entry of entries) {
    const urlHash = createHash("sha256").update(entry.url).digest("hex").slice(0, 12);
    process.stdout.write(`[forensics] ${entry.ref} (${entry.category}) … `);
    const record: Record<string, unknown> = {
      ref: entry.ref,
      category: entry.category,
      role: entry.role ?? null,
      urlHash,
      measuredAt: new Date().toISOString(),
      views: [] as unknown[],
    };
    let ok = true;
    for (const vp of VIEWPORTS) {
      try {
        const view = await measurePage(browser, entry.url, vp);
        (record.views as unknown[]).push(view);
      } catch (err) {
        ok = false;
        (record.views as unknown[]).push({ viewport: vp.name, error: String(err).slice(0, 200) });
      }
    }
    manifest.push({ ref: entry.ref, category: entry.category, role: entry.role, urlHash, ok });
    const file = resolve(outDir, `${entry.ref}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(record, null, 2));
    console.log(ok ? "ok" : "partial");
  }

  await browser.close();
  writeFileSync(resolve(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n[forensics] ${manifest.length} references measured → ${outDir}`);
}

const invokedDirectly = process.argv[1]?.includes("design-research/forensics");
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
