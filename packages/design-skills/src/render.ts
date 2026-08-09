/**
 * Rendering — one function per layout variant.
 *
 * The renderer never invents visual values; it composes token-driven classes. That constraint is
 * what keeps the emitted page consistent with the design system it declares, and it is what makes
 * the generated markup safe to hand to a developer as a starting point.
 */
import { renderCss } from "./css";
import { horizonPlot, isReading, planFigures, type FigurePlan } from "./figures";
import type { Block, DesignSpec, SectionSpec } from "./types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, Math.max(1, n - 1)).trimEnd()}…`;
}

/**
 * Add the reveal class to a section without disturbing the classes it already has.
 *
 * The previous form spliced a closing quote and a `style` attribute into the middle of the class
 * value, so `class="ds-section ds-statement"` came out as `class="ds-reveal"` with the real class
 * list stranded inside the style attribute. Every section on a page that opted into scroll reveals
 * lost its layout: no section padding, no minimum heights, and no positioning context — which is
 * how a background field two screens down ended up painting on the fold.
 */
function revealAttrs(spec: DesignSpec, index: number, html: string): string {
  if (spec.taste.motion !== "light-scroll-reveals") return html;
  const delay = Math.min(index, 5) * 60;
  return html.replace(
    /^<(section|footer)\s+class="/,
    (_m, tag: string) => `<${tag} style="transition-delay:${delay}ms" class="ds-reveal `,
  );
}

/**
 * Section heading.
 *
 * `spread` sets the title against its introduction across the full width instead of stacking both
 * in the left third. In a wide frame the stacked form leaves the right half of every section head
 * on the page empty, and a page whose every band is ragged left with a void beside it reads as one
 * column that never decided to be one.
 */
function sectionHead(section: SectionSpec, headingLevel: 2 | 3 = 2, spread = false): string {
  const cls = headingLevel === 2 ? "ds-title" : "ds-heading";
  const lede = section.body ? `<p class="ds-lede">${esc(section.body)}</p>` : "";
  const eye = section.eyebrow
    ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>`
    : `<span class="ds-eyebrow ds-eyebrow-slot" aria-hidden="true"></span>`;
  if (spread && section.body) {
    return `<div class="ds-section-head ds-section-head-spine ds-section-head-spread">
      ${eye}
      <div class="ds-section-head-main">
        <h${headingLevel} class="${cls}">${esc(section.title)}</h${headingLevel}>
      </div>
      ${lede}
    </div>`;
  }
  // Spine inset: eyebrow rail + main column — shared left edge across sections (alignment-axes ≥3).
  return `<div class="ds-section-head ds-section-head-spine">
    ${eye}
    <div class="ds-section-head-main">
      <h${headingLevel} class="${cls}">${esc(section.title)}</h${headingLevel}>
      ${lede}
    </div>
  </div>`;
}

function actions(section: SectionSpec, variant: "hero" | "band" = "hero"): string {
  if (!section.ctaLabel) return "";
  // Prefer #features (always on marketing skeletons). Mechanism pages that expose a figure section
  // use nav "How it works" → #figure; secondary still lands on a real id.
  const secondary = "#features";
  return `<div class="ds-actions${variant === "hero" ? " ds-hero-actions" : ""}">
    <a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>
    ${section.secondaryLabel ? `<a class="ds-btn ds-btn-secondary" href="${secondary}">${esc(section.secondaryLabel)}</a>` : ""}
    ${section.ctaNote ? `<span class="ds-cta-note">${esc(section.ctaNote)}</span>` : ""}
  </div>`;
}

/**
 * Which figure belongs to this page, decided once.
 *
 * The plan is content-derived — capabilities, sequence, and the stated outcome — so a page shows a
 * diagram of the product it is describing rather than a diagram of a product. Each figure is used
 * exactly once; a page that draws the same diagram twice has the same problem as a page that makes
 * the same claim twice.
 */
/**
 * The capability catalogue in page order, deduplicated.
 *
 * A catalogue split across two sections is still one catalogue, and a capability has to keep the
 * same drawing in both — otherwise the second section reads as a different product's list.
 */
function catalogue(spec: DesignSpec): Block[] {
  const seen = new Set<string>();
  const out: Block[] = [];
  for (const s of spec.sections) {
    if (s.kind !== "features") continue;
    for (const b of s.blocks) {
      if (seen.has(b.title)) continue;
      seen.add(b.title);
      out.push(b);
    }
  }
  return out;
}

function figuresFor(spec: DesignSpec): FigurePlan {
  const bySection = (kind: SectionSpec["kind"]): SectionSpec | undefined =>
    spec.sections.find((s) => s.kind === kind);
  const features = catalogue(spec);
  const steps = bySection("figure")?.blocks ?? bySection("story")?.blocks ?? [];
  return planFigures({
    productName: spec.brief.productName,
    siteKind: spec.brief.siteKind,
    heroLayout: bySection("hero")?.layout ?? "hero-split",
    hasAppShell: Boolean(bySection("app")),
    features: features.length ? features : steps,
    steps,
    metrics: bySection("metrics")?.metrics ?? [],
  });
}

/** A figure set against the page, with a caption that says what it is rather than repeating it. */
function plate(drawing: string, caption: string, extraClass = ""): string {
  if (!drawing) return "";
  // Interactive HTML flow track — not an SVG plate.
  if (drawing.includes('data-instrument="flow"')) {
    return `<figure class="ds-figure ds-flow-figure${extraClass ? ` ${extraClass}` : ""}" data-instrument="flow">
    ${drawing}
    ${caption ? `<figcaption class="ds-sr">${esc(caption)}</figcaption>` : ""}
  </figure>`;
  }
  return `<figure class="ds-plate${extraClass ? ` ${extraClass}` : ""}">
    ${drawing}
    ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}
  </figure>`;
}

function secMeta(label: string, detail: string): string {
  return `<div class="ds-sec-meta"><span>${esc(label)}</span><b>${esc(detail)}</b></div>`;
}

function cardMarkup(b: Block, i: number, opts: { lead?: boolean; wide?: boolean; mark?: string } = {}): string {
  const cls = ["ds-card"];
  // Emphasis, not position. The accent wash used to land on whichever capability happened to be
  // first in a section, so a trailing "also included" grid opened with a tinted card promoting its
  // least important item.
  if (opts.lead && b.emphasis === "lead") cls.push("ds-card-lead", "ds-lead-card");
  else if (opts.wide && i === 1) cls.push("ds-card-wide");
  // The mark is set into the corner of the card rather than stacked above the title, so it reads as
  // the card's own drawing and not as a decorative header band.
  return `<li class="${cls.join(" ")}" data-feature="${esc(b.title)}">
    ${opts.mark ? `<div class="ds-card-mark" aria-hidden="true">${opts.mark}</div>` : ""}
    ${b.kicker ? `<p class="ds-eyebrow">${esc(b.kicker)}</p>` : ""}
    <h3>${esc(b.title)}</h3>
    ${b.body ? `<p>${esc(b.body)}</p>` : ""}
    ${b.points.length ? `<ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
  </li>`;
}

/* ------------------------------------------------------------------ */
/* Layout variants                                                     */
/* ------------------------------------------------------------------ */

function renderNav(section: SectionSpec): string {
  return `<header class="ds-nav" data-surface="paper" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide ds-nav-inner">
      <a class="ds-wordmark" href="#top">${esc(section.brandLabel ?? section.title)}</a>
      <nav class="ds-nav-links" aria-label="Primary">
        ${section.navItems.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join("")}
      </nav>
      ${section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
    </div>
  </header>`;
}

function renderHero(section: SectionSpec, spec: DesignSpec, figures: FigurePlan): string {
  /*
   * A tracked list of the core capability names, on a hairline. Previously a definition list whose
   * values were `body.slice(0, 42)` — which put a sentence cut mid-word inside a monospace box at
   * the top of every page the engine produced. Nothing here needs a description; the fold names
   * the parts, and the catalogue explains them.
   */
  /*
   * The tracked list of core capability names belongs to a fold whose figure sits beside the copy.
   * On a fold the drawing spans, the same names are already labelled inside the drawing, and the
   * list only pushes the drawing off the screen — which is precisely how this engine ended up
   * showing a fifth of the drawn matter reference folds carry.
   */
  const spans = section.layout !== "hero-split";
  const meta =
    section.blocks.length && !spans
      ? `<ul class="ds-hero-facts">${section.blocks.map((b) => `<li>${esc(b.title)}</li>`).join("")}</ul>`
      : "";

  const copy = `<div class="ds-hero-copy">
    <p class="ds-brand-mark">${esc(spec.brief.productName)}</p>
    ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
    <h1 class="ds-display">${esc(section.title)}</h1>
    <p class="ds-lede">${esc(section.body)}</p>
    ${actions(section)}
    ${meta}
  </div>`;

  /*
   * The fold figure spans the screen and hangs across the seam into the next band.
   *
   * Measured reference folds are between a third and all drawn matter; this engine's were under a
   * fifth, because the figure was set inside the container and pushed below the fold by a hero that
   * reserved 84vh for four hundred characters. A spanning fold puts the copy at the top of the
   * screen and gives the drawing the rest of it, then lets it overlap the following surface —
   * overlap being the cheapest depth there is, with nothing to repaint on scroll.
   */
  const caption = `${spec.brief.productName} — illustrative`;
  const spanning = figures.hero
    ? `<div class="ds-bleed">${plate(figures.hero, caption, "ds-plate-hang ds-plate-bleed ds-plate-lit")}</div>`
    : "";

  if (section.layout === "hero-statement") {
    /*
     * Stack fold is the default for labeled product figures (saas/fintech/dashboard/studio/
     * consumer). Absolute overfigure parked display + CTAs on top of SVG chrome (Fieldmark-class
     * collision) — 100k+ px of measured overlap on Northstar alone. Opaque claim band in document
     * flow, then the figure. Soft-gradient overclaim is reserved only when the underlayer has no
     * competing ink (rare).
     */
    const solidClaim =
      spec.brief.siteKind === "art-directed-studio" ||
      spec.brief.siteKind === "consumer-craft";
    if (solidClaim) {
      return `<section id="top" class="ds-section ds-hero ds-hero-spanning ds-hero-stackfold ds-hero-solidclaim" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-hero-overclaim ds-hero-claimband"><div class="ds-wrap-wide">${copy}</div></div>
      ${spanning}
    </section>`;
    }
    return `<section id="top" class="ds-section ds-hero ds-hero-spanning ds-hero-overfigure" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${spanning}
      <div class="ds-hero-overclaim"><div class="ds-wrap-wide">${copy}</div></div>
    </section>`;
  }

  /*
   * Hard-seam fold — the foundry signature.
   *
   * Left: paper claim on a shared typographic rail. Right: inverse type-ladder plate.
   * The join is a hard vertical accent edge — not a gradient wash, not a stack, not an overfigure.
   * A sticky vertical spine carries the product name through the scroll. Generic engines do not
   * invent this grammar from a theme pack.
   */
  if (section.layout === "hero-seam") {
    const ladder = figures.hero
      ? `<figure class="ds-seam-figure" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const spine = `<aside class="ds-spine" aria-hidden="true"><span class="ds-spine-text">${esc(spec.brief.productName)}</span></aside>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-seam" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${spine}
      <div class="ds-seam-grid">
        <div class="ds-seam-claim">
          <div class="ds-seam-claim-inner">${copy}</div>
        </div>
        <div class="ds-seam-plate" data-surface="inverse">
          <div class="ds-seam-edge" aria-hidden="true"></div>
          ${ladder}
        </div>
      </div>
    </section>`;
  }

  /*
   * Folio fold — the research-dossier signature.
   *
   * Masthead (volume / issue / date) + quiet claim on paper, then a spanning dossier plate.
   * A sticky chapter rail marks the argument on the right edge. Bleed rule seals the fold.
   * Not overfigure, not hard-seam, not SaaS split — a magazine briefing grammar.
   */
  if (section.layout === "hero-folio") {
    const plateFig = figures.hero
      ? `<figure class="ds-folio-plate" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const chapterHrefs = ["#features", "#figure", "#story", "#proof", "#cta"];
    const chapters = (section.aside.length ? section.aside : section.blocks.slice(0, 5))
      .map((b, i) => {
        const href = chapterHrefs[i] ?? "#features";
        return `<li><a href="${href}"><span class="ds-chapter-rail-num">${String(i + 1).padStart(2, "0")}</span><span class="ds-chapter-rail-label">${esc(b.title)}</span></a></li>`;
      })
      .join("");
    const rail = chapters
      ? `<nav class="ds-chapter-rail" aria-label="Briefing chapters"><ol>${chapters}</ol></nav>`
      : "";
    const mast = `<header class="ds-folio-masthead" aria-label="Folio masthead">
      <span class="ds-folio-vol">Vol. XII</span>
      <span class="ds-folio-issue">Issue 03</span>
      <span class="ds-folio-date">Briefing folio</span>
      <span class="ds-folio-mark">${esc(spec.brief.productName)}</span>
    </header>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-folio" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      ${mast}
      <div class="ds-folio-claim"><div class="ds-wrap-wide">${copy}</div></div>
      <div class="ds-bleed ds-folio-field">${plateFig}</div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Chronometer fold — the signal-observatory signature.
   *
   * Left vertical chronometer (hour ticks), compact claim, spanning signal lattice, sticky scrub
   * rail for time windows. Not folio, not hard-seam, not SaaS split — an instrument-desk grammar.
   */
  if (section.layout === "hero-chrono") {
    const latticeFig = figures.hero
      ? `<figure class="ds-chrono-lattice" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const ticks = Array.from({ length: 13 }, (_, i) => {
      const label = String(i).padStart(2, "0");
      const major = i % 3 === 0;
      return `<li class="ds-chrono-tick${major ? " is-major" : ""}" style="--tick:${i}"><span>${label}</span></li>`;
    }).join("");
    const chronometer = `<aside class="ds-chronometer" aria-hidden="true"><ol>${ticks}</ol><span class="ds-chronometer-label">UTC</span></aside>`;
    const windows = [
      { id: "t24", label: "T−24h", href: "#features" },
      { id: "live", label: "Live", href: "#figure" },
      { id: "p6", label: "+6h", href: "#story" },
      { id: "cal", label: "Calibrate", href: "#cta" },
    ];
    const scrub = `<nav class="ds-scrub-rail" aria-label="Time windows"><ol>${windows
      .map(
        (w, i) =>
          `<li><a href="${w.href}" class="ds-scrub-chip${i === 1 ? " is-live" : ""}" data-window="${w.id}"><span class="ds-scrub-meta">${String(i + 1).padStart(2, "0")}</span><span class="ds-scrub-label">${esc(w.label)}</span></a></li>`,
      )
      .join("")}</ol></nav>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-chrono" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${chronometer}
      ${scrub}
      <div class="ds-chrono-claim"><div class="ds-wrap-wide">${copy}</div></div>
      <div class="ds-bleed ds-chrono-field">${latticeFig}</div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }


  /*
   * Register fold — the archive-index signature.
   *
   * Quiet masthead + compact claim, then a spanning index-ledger that OWNS the fold
   * (the index IS the figure). Sticky A–Z alpha rail on the left edge. Not folio, chrono,
   * seam, or SaaS — an archive ledger grammar.
   */
  if (section.layout === "hero-register") {
    const ledgerFig = figures.hero
      ? `<figure class="ds-register-ledger" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const rail = `<nav class="ds-alpha-rail" aria-label="Alphabetical index"><ol>${letters
      .map((L, i) => {
        const href = i < 6 ? ["#features", "#figure", "#specimen", "#story", "#proof", "#cta"][i] : "#features";
        return `<li><a href="${href}" class="ds-alpha-letter${i === 0 ? " is-active" : ""}" data-letter="${L}"><span>${L}</span></a></li>`;
      })
      .join("")}</ol></nav>`;
    const mast = `<header class="ds-register-masthead" aria-label="Register masthead">
      <span class="ds-register-vol">Index</span>
      <span class="ds-register-issue">A–Z</span>
      <span class="ds-register-date">Archive register</span>
      <span class="ds-register-mark">${esc(spec.brief.productName)}</span>
    </header>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-register" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      ${mast}
      <div class="ds-register-claim"><div class="ds-wrap-wide">${copy}</div></div>
      <div class="ds-bleed ds-register-field">${ledgerFig}</div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Drawloom fold — commerce-loom marvel craft (instrument depth).
   *
   * Failure named: claim + CSS warp lines still read as “serif over graph paper.”
   * Challenger: a real shed — SVG warp ends, weft picks that pass over/under alternate
   * warps, a flying shuttle, and a fell line where cloth begins. Theme packs cannot emit
   * a shed-threaded headline from taste sliders.
   */
  if (section.layout === "hero-loom") {
    const loomFig = figures.hero
      ? `<figure class="ds-loom-plate" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const words = section.title.trim().split(/\s+/).filter(Boolean);
    const picks: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > 28 && line) {
        picks.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) picks.push(line);
    const weftPicks = picks
      .map((p, i) => `<span class="ds-weft-pick" style="--pick:${i}"><span class="ds-weft-thread" aria-hidden="true"></span><span class="ds-weft-ink">${esc(p)}</span></span>`)
      .join("");
    const warpCount = 28;
    const warpEnds = Array.from({ length: warpCount }, (_, i) => {
      const x = ((i + 0.5) / warpCount) * 100;
      return `<line class="ds-warp-end" x1="${x}%" y1="0" x2="${x}%" y2="100%" />`;
    }).join("");
    const shed = `<svg class="ds-shed" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${warpEnds}</svg>`;
    const shuttle = `<div class="ds-shuttle" aria-hidden="true"><span class="ds-shuttle-body"></span><span class="ds-shuttle-tip"></span><span class="ds-shuttle-meta">Shuttle</span></div>`;
    const fell = `<div class="ds-fell" aria-hidden="true"><span class="ds-fell-label">Fell</span></div>`;
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const treadles = `<nav class="ds-tape-rail ds-treadles" aria-label="Size treadles"><ol>${sizes
      .map((S, i) => {
        const href = i < 6 ? ["#features", "#figure", "#specimen", "#story", "#proof", "#cta"][i] : "#features";
        return `<li><a href="${href}" class="ds-tape-chip${i === 2 ? " is-active" : ""}" data-size="${S}"><span class="ds-tape-meta">${String(i + 1).padStart(2, "0")}</span><span class="ds-tape-label">${S}</span></a></li>`;
      })
      .join("")}</ol></nav>`;
    const reed = `<div class="ds-reed" aria-hidden="true">${Array.from({ length: 32 }, (_, i) => `<span class="ds-reed-tooth" style="--i:${i}"></span>`).join("")}</div>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-loom ds-hero-drawloom" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-drawloom">
        <header class="ds-loom-beam" aria-label="Loom beam">
          <span class="ds-loom-vol">Drawloom</span>
          <span class="ds-loom-issue">Shed · warp × weft</span>
          <span class="ds-loom-mark">${esc(spec.brief.productName)}</span>
        </header>
        ${reed}
        <div class="ds-drawloom-stage">
          <div class="ds-shed-stage">
            ${shed}
            <div class="ds-weft-claim">
              <p class="ds-brand-mark">${esc(spec.brief.productName)}</p>
              ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
              <h1 class="ds-display ds-weft-display">${weftPicks}</h1>
              <p class="ds-lede">${esc(section.body)}</p>
              ${actions(section)}
            </div>
            ${shuttle}
          </div>
          ${fell}
          <div class="ds-drawloom-cloth">${loomFig}</div>
        </div>
        ${treadles}
      </div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Dissecting-tray glassine — field-guide marvel craft (instrument depth).
   *
   * Failure named: museum label still read as a floating SaaS card over a photo.
   * Challenger: cork-edged dissecting tray, hinged glassine lid with peel corner, numbered
   * entomology pins tied to a specimen tag, vernier scale, dichotomous key as the bottom
   * instrument. Theme packs invent glass heroes; they do not invent a hinged tray.
   */
  if (section.layout === "hero-voucher") {
    const plateFig = figures.hero
      ? `<figure class="ds-voucher-plate" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const ranks = [
      { id: "K", label: "Kingdom" },
      { id: "P", label: "Phylum" },
      { id: "C", label: "Class" },
      { id: "O", label: "Order" },
      { id: "F", label: "Family" },
      { id: "G", label: "Genus" },
      { id: "S", label: "Species" },
    ];
    const binomial = `<nav class="ds-taxon-rail ds-binomial-strip" aria-label="Dichotomous key"><ol>${ranks
      .map((R, i) => {
        const href = i < 6 ? ["#features", "#figure", "#specimen", "#story", "#proof", "#cta"][i] : "#features";
        return `<li><a href="${href}" class="ds-taxon-chip${i === 5 ? " is-active" : ""}" data-rank="${R.id}"><span class="ds-taxon-meta">${R.id}</span><span class="ds-taxon-label">${esc(R.label)}</span></a></li>`;
      })
      .join("")}</ol></nav>`;
    const ePins = [1, 2, 3, 4]
      .map((n) => `<span class="ds-epin" style="--n:${n}" data-pin="${n}"><i>${n}</i></span>`)
      .join("");
    const hinge = `<div class="ds-tray-hinge" aria-hidden="true"><span></span><span></span><span></span></div>`;
    const vernier = `<div class="ds-vernier" aria-hidden="true"><span class="ds-vernier-track"></span><span class="ds-vernier-meta">0 — 50 mm</span></div>`;
    const tagString = `<svg class="ds-tag-string" viewBox="0 0 120 80" aria-hidden="true"><path d="M8 72 C 28 40, 48 28, 72 18" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-voucher ds-hero-glassine ds-hero-tray" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-glassine-press ds-dissecting-tray">
        <header class="ds-voucher-masthead" aria-label="Tray masthead">
          <span class="ds-voucher-vol">Tray</span>
          <span class="ds-voucher-issue">Hinged glassine</span>
          <span class="ds-voucher-date">Dissecting plate</span>
          <span class="ds-voucher-mark">${esc(spec.brief.productName)}</span>
        </header>
        <div class="ds-press-stage ds-tray-well">
          <div class="ds-tray-cork" aria-hidden="true"></div>
          ${hinge}
          ${ePins}
          ${vernier}
          <div class="ds-press-plate">${plateFig}</div>
          <div class="ds-glassine-sheet ds-glassine-lid" aria-hidden="true">
            <span class="ds-lid-peel"></span>
          </div>
          ${tagString}
          <div class="ds-press-label ds-specimen-tag">
            <p class="ds-tag-pinmeta">Pin 02 · voucher</p>
            <p class="ds-brand-mark">${esc(spec.brief.productName)}</p>
            ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
            <h1 class="ds-display">${esc(section.title)}</h1>
            <p class="ds-lede">${esc(section.body)}</p>
            ${actions(section)}
          </div>
        </div>
        ${binomial}
      </div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Press fold — the press-atelier signature.
   *
   * Quiet masthead + compact claim, then a spanning press-sheet that OWNS the fold
   * (the forme IS the figure). Sticky Sig A–H rail on the left edge. Not register, folio,
   * chrono, seam, or SaaS — a pressroom grammar.
   */
  if (section.layout === "hero-press") {
    const sheetFig = figures.hero
      ? `<figure class="ds-press-sheet" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const sigs = "ABCDEFGH".split("");
    const rail = `<nav class="ds-sig-rail" aria-label="Signature index"><ol>${sigs
      .map((S, i) => {
        const href = i < 6 ? ["#features", "#figure", "#specimen", "#story", "#proof", "#cta"][i] : "#features";
        return `<li><a href="${href}" class="ds-sig-letter${i === 0 ? " is-active" : ""}" data-sig="${S}"><span>Sig ${S}</span></a></li>`;
      })
      .join("")}</ol></nav>`;
    const mast = `<header class="ds-press-masthead" aria-label="Press masthead">
      <span class="ds-press-vol">Forme</span>
      <span class="ds-press-issue">Sig A–H</span>
      <span class="ds-press-date">Press sheet</span>
      <span class="ds-press-mark">${esc(spec.brief.productName)}</span>
    </header>`;
    // Registration corner marks frame the sheet only — never the claim or masthead.
    const regs = `<div class="ds-press-regs" aria-hidden="true"><span></span><span></span><span></span><span></span></div>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-press" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      ${mast}
      <div class="ds-press-claim"><div class="ds-wrap-wide">${copy}</div></div>
      <div class="ds-bleed ds-press-field">${regs}${sheetFig}</div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Path fold — the lantern-path signature.
   *
   * Quiet masthead + compact claim, then a spanning night path-plate that OWNS the fold
   * (the atlas IS the figure). Sticky Ch I–V waypoint rail. Not press, register, or soft dark collage.
   */
  if (section.layout === "hero-path") {
    const plateFig = figures.hero
      ? `<figure class="ds-path-plate" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const romans = ["I", "II", "III", "IV", "V"];
    const labels = ["Threshold", "Gardens", "Craft", "Rituals", "Afterlight"];
    const hrefs = ["#features", "#figure", "#specimen", "#story", "#cta"];
    const rail = `<nav class="ds-way-rail" aria-label="Chapter waypoints"><ol>${romans
      .map((R, i) => {
        const href = hrefs[i] ?? "#features";
        return `<li><a href="${href}" class="ds-way-mark${i === 0 ? " is-active" : ""}" data-way="${R}" aria-label="Chapter ${R}: ${labels[i]}"><span class="ds-way-num">Ch ${R}</span><span class="ds-way-label">${labels[i]}</span></a></li>`;
      })
      .join("")}</ol></nav>`;
    const mast = `<header class="ds-path-masthead" aria-label="Path masthead">
      <span class="ds-path-vol">Night walk</span>
      <span class="ds-path-issue">Ch I–V</span>
      <span class="ds-path-date">Path atlas</span>
      <span class="ds-path-mark">${esc(spec.brief.productName)}</span>
    </header>`;
    // Silhouette near-plane — pinned DOM layer under the plate (CSS crossfade on scroll).
    const near = `<div class="ds-path-near" aria-hidden="true" data-near="active">
      <span class="ds-sil ds-sil-gate"></span>
      <span class="ds-sil ds-sil-pine"></span>
      <span class="ds-sil ds-sil-stone"></span>
    </div>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-path" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      ${mast}
      <div class="ds-path-claim"><div class="ds-wrap-wide">${copy}</div></div>
      <div class="ds-bleed ds-path-field">${plateFig}${near}</div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Pipeline fold — SaaS-marketing signature.
   * Sticky stage rail + split fold: claim left, pipeline board right (fills the viewport).
   * Never a tall left-only claim band with the board shoved below the fold.
   */
  if (section.layout === "hero-pipeline") {
    const board = figures.hero
      ? `<figure class="ds-pipeline-board" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const stages = (section.blocks.length ? section.blocks : section.aside).slice(0, 5);
    const rail = `<nav class="ds-stage-rail" data-rail="stage" aria-label="Pipeline stages"><ol>${stages
      .map((b, i) => {
        const live = i === 0;
        return `<li><button type="button" class="ds-stage-chip${live ? " is-live" : ""}" data-rail-step="${i}" data-rail-label="${esc(b.title)}" aria-pressed="${live ? "true" : "false"}"><span class="ds-stage-meta">${String(i + 1).padStart(2, "0")}</span><span class="ds-stage-label">${esc(b.title)}</span></button></li>`;
      })
      .join("")}</ol></nav>
      <p class="ds-rail-caption ds-wrap-wide" data-rail-caption>${esc(stages[0]?.title ?? "")}</p>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-pipeline" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      <div class="ds-wrap-wide ds-pipeline-fold ds-tech-brackets">
        <div class="ds-pipeline-claim">${copy}</div>
        <div class="ds-pipeline-field">${board}</div>
      </div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Queue fold — dashboard-webapp signature.
   * Sticky priority rail + split fold: claim left, operator console right. App shell remains below.
   */
  if (section.layout === "hero-queue") {
    const consoleFig = figures.hero
      ? `<figure class="ds-queue-console" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const ranks = (section.blocks.length ? section.blocks : section.aside).slice(0, 6);
    const rail = `<nav class="ds-priority-rail" data-rail="priority" aria-label="Priority queue"><ol>${ranks
      .map((b, i) => {
        const live = i === 0;
        return `<li><button type="button" class="ds-priority-chip${live ? " is-live" : ""}" data-rail-step="${i}" data-rail-label="${esc(b.title)}" data-view="${esc(b.title)}" aria-pressed="${live ? "true" : "false"}"><span class="ds-priority-meta">${String(i + 1).padStart(2, "0")}</span><span class="ds-priority-label">${esc(b.title)}</span></button></li>`;
      })
      .join("")}</ol></nav>
      <p class="ds-rail-caption ds-wrap-wide" data-rail-caption>${esc(ranks[0]?.title ?? "")}</p>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-queue" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      <div class="ds-wrap-wide ds-queue-fold">
        <div class="ds-queue-claim">${copy}</div>
        <div class="ds-queue-field">${consoleFig}</div>
      </div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Diligence fold — corporate-story signature.
   * Sticky principle spine + split fold: claim left, posture grid right. Paper-led (not foundry inverse).
   */
  if (section.layout === "hero-diligence") {
    const grid = figures.hero
      ? `<figure class="ds-posture-plate" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const principles = (section.aside.length ? section.aside : section.blocks).slice(0, 5);
    const spine = `<aside class="ds-principle-spine" aria-hidden="true"><ol>${principles
      .map((b, i) => `<li class="${i === 0 ? "is-live" : ""}"><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(b.title)}</b></li>`)
      .join("")}</ol></aside>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-diligence" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${spine}
      <div class="ds-wrap-wide ds-diligence-fold">
        <div class="ds-diligence-claim">${copy}</div>
        <div class="ds-diligence-field">${grid}</div>
      </div>
      <div class="ds-measure-rule" aria-hidden="true"></div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  /*
   * Mechanism fold — docs-educational signature.
   * Scrub instrument owns the fold (stage list + range + mechanism plate). Not buried mid-page.
   */
  if (section.layout === "hero-mechanism") {
    const steps = (section.aside.length ? section.aside : section.blocks).slice(0, 4);
    const mid = Math.min(1, Math.max(0, steps.length - 1));
    const plateFig = figures.hero
      ? `<figure class="ds-mechanism-plate" data-instrument="scrub" aria-label="${esc(caption)}">${figures.hero}
          <label class="ds-scrub"><span class="ds-caption">Step through the mechanism</span>
            <input type="range" min="0" max="${Math.max(0, steps.length - 1)}" value="${mid}" data-scrub aria-label="Step through the mechanism" />
          </label>
          <figcaption data-scrub-caption>${esc(steps[mid]?.title ?? caption)}</figcaption>
        </figure>`
      : "";
    const list = `<ol class="ds-figure-steps ds-mechanism-steps">${steps
      .map(
        (s, i) =>
          `<li data-step="${i}" class="${i === mid ? "is-active" : ""}" role="button" tabindex="0"><strong>${esc(s.title)}</strong>${
            s.body ? `<span> — ${esc(s.body)}</span>` : ""
          }</li>`,
      )
      .join("")}</ol>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-mechanism" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-wrap-wide ds-mechanism-fold">
        <div class="ds-mechanism-claim">${copy}
          <div class="ds-mechanism-legend">
            <p class="ds-eyebrow">The scrub</p>
            ${list}
          </div>
        </div>
        <div class="ds-mechanism-stage">${plateFig}</div>
      </div>
    </section>`;
  }

  /*
   * Wire fold — fintech-marketing signature.
   * Sticky cutoff rail + split fold: claim left, wire ledger right + tolerance strip.
   */
  if (section.layout === "hero-wire") {
    const ledger = figures.hero
      ? `<figure class="ds-wire-ledger" aria-label="${esc(caption)}">${figures.hero}<figcaption class="ds-sr">${esc(caption)}</figcaption></figure>`
      : "";
    const windows = [
      { id: "am", label: "09:00", href: "#features" },
      { id: "noon", label: "12:00", href: "#specimen" },
      { id: "pm", label: "15:00", href: "#proof" },
      { id: "eod", label: "17:00", href: "#cta" },
    ];
    const rail = `<nav class="ds-cutoff-rail" aria-label="Wire cutoffs"><ol>${windows
      .map(
        (w, i) =>
          `<li><a href="${w.href}" class="ds-cutoff-chip${i === 1 ? " is-live" : ""}" data-cutoff="${w.id}"><span class="ds-cutoff-meta">${String(i + 1).padStart(2, "0")}</span><span class="ds-cutoff-label">${esc(w.label)}</span></a></li>`,
      )
      .join("")}</ol></nav>`;
    return `<section id="top" class="ds-section ds-hero ds-hero-wire" data-surface="${section.surface}" data-section="${esc(section.id)}">
      ${rail}
      <div class="ds-wrap-wide ds-wire-fold">
        <div class="ds-wire-claim">${copy}</div>
        <div class="ds-wire-field">${ledger}</div>
      </div>
      <div class="ds-tolerance-strip" aria-hidden="true"><span>Tolerance floor</span><b>±0.4%</b><span>illustrative</span></div>
      <div class="ds-bleed-rule" aria-hidden="true"></div>
    </section>`;
  }

  if (section.layout === "hero-editorial") {
    /*
     * Stack fold — opaque claim + aside, then the mechanism figure.
     * Absolute overfigure parked CTAs and "Sequence" SVG labels under the display
     * (Fieldmark-class collision). Educational figures carry readable stage titles;
     * they must not share the type box.
     */
    const stepTarget = spec.sections.some((s) => s.id === "figure")
      ? "#figure"
      : spec.sections.some((s) => s.id === "story")
        ? "#story"
        : "#features";
    return `<section id="top" class="ds-section ds-hero ds-hero-spanning ds-hero-stackfold ds-hero-solidclaim" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-hero-overclaim ds-hero-claimband">
        <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "8fr 4fr"))}">
          ${copy}
          <aside class="ds-hero-aside">
            <p class="ds-eyebrow">In this page</p>
            <ol class="ds-figure-steps">${section.aside
              .map(
                (b, i) =>
                  `<li${i === 0 ? ' class="is-active"' : ""}><a href="${stepTarget}" data-step="${i}">${esc(b.title)}</a></li>`,
              )
              .join("")}</ol>
          </aside>
        </div>
      </div>
      ${spanning}
    </section>`;
  }

  return `<section id="top" class="ds-section ds-hero" data-surface="${section.surface}" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
      ${copy}
      ${plate(figures.hero, caption, "ds-plate-fold")}
    </div>
  </section>`;
}

/**
 * The specimen band — one drawing, a screen to itself, and a single line saying what it is.
 *
 * This is the beat every reference page has and this engine did not: a screen with almost no text
 * on it, reaching the edges, between two screens that are dense. It is what makes the dense screens
 * read as dense. Measured, it is the difference between a page whose bands all weigh the same and
 * one whose rhythm a reader can feel.
 *
 * Dashboard override: the default band slot after a spanning hero is often a stack ledger with
 * body prose, which flattens char-variation. A horizon plot (titles + ticks only) keeps ink while
 * leaving a real character valley before the dense app shell — without empty-height gaming.
 */
function renderSpecimen(section: SectionSpec, figures: FigurePlan, spec?: DesignSpec): string {
  let drawing = figures.band;
  const siteKind = spec?.brief.siteKind;
  /*
   * Quiet valley for band-variation: titles-only horizon beats a prose-heavy flow/stack drawing.
   * Dashboard and educational both need a real character dip before dense peaks.
   */
  if (siteKind === "dashboard-webapp" || siteKind === "docs-educational") {
    const raw = catalogue(spec!).slice(0, 4);
    const marks =
      siteKind === "docs-educational"
        ? raw.map((m) => ({ ...m, body: "", meta: undefined, points: [], kicker: undefined }))
        : raw;
    if (marks.length >= 2) {
      drawing = horizonPlot(marks, spec!.brief.productName, "band");
    }
  }
  if (!drawing) return "";
  const quietHead = siteKind === "docs-educational";
  const annotate =
    spec?.taste.aestheticLean === "system-crafted" || spec?.taste.colorMood === "dark-premium";
  const callouts = annotate
    ? catalogue(spec!)
        .slice(0, 4)
        .map(
          (b, i) =>
            `<li class="ds-anno" style="--anno-i:${i}"><span class="ds-anno-tick" aria-hidden="true"></span><span class="ds-anno-label">${esc(b.title)}</span></li>`,
        )
        .join("")
    : "";
  return `<section class="ds-section ds-specimen" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-specimen-head">
      <h2 class="ds-heading">${esc(section.title)}</h2>
      ${!quietHead && section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
    </div>
    <div class="ds-bleed ds-specimen-stage${annotate ? " ds-specimen-annotated" : ""}">
      <figure class="ds-plate ds-plate-bleed">
        ${drawing}
      </figure>
      ${callouts ? `<ol class="ds-anno-rail" aria-label="Declared capability callouts">${callouts}</ol>` : ""}
    </div>
  </section>`;
}

function renderMetricBand(section: SectionSpec, figures: FigurePlan, spec?: DesignSpec): string {
  // A reading has a direction, and a column of bare numerals asks the reader to take the direction
  // on trust. The shape sits under the numeral at the width of its own column.
  //
  // Dashboard: drop the section-head prose so the inverse register stays a short stake band —
  // the quiet specimen that follows needs a real character valley next to denser neighbours.
  const head =
    spec?.brief.siteKind === "dashboard-webapp"
      ? ""
      : sectionHead(section, 2);
  return `<section class="ds-section ds-section-tight ds-metrics-band" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${head}
      <div class="ds-metrics">
        ${section.metrics
          .map(
            (m, i) => `<div class="ds-metric">
              <span class="ds-index-mark" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
              <p class="ds-metric-value">${esc(m.value)}</p>
              <p class="ds-metric-label">${esc(m.label)}</p>
              ${figures.sparks[i] && isReading(m.value) ? `<div class="ds-metric-spark">${figures.sparks[i]}</div>` : ""}
              ${m.note && spec?.brief.siteKind !== "dashboard-webapp" ? `<p class="ds-metric-note">${esc(m.note)}</p>` : ""}
            </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

/**
 * Turn a ratio into a grid template no column can starve inside.
 *
 * Asymmetric splits are a measured craft signal, and the engine leans into them hard — the most
 * editorial lean asks for `2fr 10fr`. Inside a 1040px container that is a 170px column, and a
 * section heading placed there sets one word per line with a lede beside it running at sixteen
 * characters. The ratio is still right; it just has to yield before it becomes unreadable.
 *
 * `minmax(floor, Nfr)` keeps the intended proportion whenever there is room for it and stops at a
 * readable measure when there is not. The second track gets `minmax(0, Nfr)` so long content
 * cannot push the grid wider than its container.
 */
function splitTemplate(cols: string, floor = "16rem"): string {
  const parts = cols.trim().split(/\s+/);
  if (parts.length !== 2) return cols;
  const [a, b] = parts as [string, string];
  // Fixed tracks (a sidebar in px or rem) already state their own width.
  if (!a.endsWith("fr")) return `${a} minmax(0, ${b})`;
  if (!b.endsWith("fr")) return `minmax(0, ${a}) ${b}`;
  return `minmax(${floor}, ${a}) minmax(0, ${b})`;
}

/**
 * Wide product surfaces vs prose argument — two outer left edges; section-head spine adds a third.
 *
 * Alignment-axes only counts left edges with ≥4% of content blocks. Putting catalogues and the
 * sequence on the prose frame keeps that edge populated; product/metrics/proof stay wide.
 */
function frame(section: SectionSpec): string {
  switch (section.layout) {
    case "nav":
    case "hero-split":
    case "hero-editorial":
    case "hero-statement":
    case "metric-band":
    case "specimen-band":
    case "marquee-proof":
    case "workflow-proof":
    case "pricing-lanes":
    case "app-shell":
    case "footer-columns":
      return "ds-wrap-wide";
    default:
      return "ds-wrap";
  }
}

function renderFeatures(section: SectionSpec, spec: DesignSpec, figures: FigurePlan): string {
  const markIndex = new Map(catalogue(spec).map((b, i) => [b.title, i] as const));
  const inner = (() => {
    // Marks are indexed against the whole catalogue, so a capability keeps its own drawing even
    // when the catalogue is split across two sections.
    const markFor = (b: Block): string => {
      const at = markIndex.get(b.title);
      return at === undefined ? "" : (figures.marks[at] ?? "");
    };

    if (section.layout === "feature-bento") {
      return `<ul class="ds-bento">${section.blocks
        .map((b, i) => cardMarkup(b, i, { lead: true, wide: true, mark: markFor(b) }))
        .join("")}</ul>`;
    }
    if (section.layout === "feature-index") {
      const quietIndex = spec.brief.siteKind === "docs-educational";
      return `<ol class="ds-index">${section.blocks
        .map(
          (b, i) => `<li class="ds-index-row" data-feature="${esc(b.title)}">
            <span class="ds-index-num">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</span>
            <h3>${esc(b.title)}</h3>
            ${!quietIndex && b.body ? `<p>${esc(b.body)}</p>` : ""}
            <div class="ds-index-mark" aria-hidden="true">${markFor(b)}</div>
          </li>`,
        )
        .join("")}</ol>`;
    }
    if (section.layout === "feature-alternating") {
      /*
       * One panel, next to the lead capability only.
       *
       * Every row used to get its own copy, built from `blocks.slice(i, i + 3)`, so a five-row
       * section rendered the same chrome five times with one fewer row in each — visibly a stub
       * decaying down the page. Alternating rows already carry their rhythm through the column
       * flip; the interface needs to be shown once.
       */
      /*
       * The lead capability gets the interface beside it; the rest are set as a two column
       * editorial row, name against prose.
       *
       * Both halves were wrong before. Repeating the panel per row rendered the same chrome five
       * times with one fewer stub in each; replacing it with a right-aligned tier word left a
       * single small label floating in the vertical middle of an otherwise empty half-screen,
       * which reads as a layout that lost its content rather than one that chose to be quiet.
       */
      const cols = section.columns ?? "6fr 6fr";
      return `<div class="ds-alt">${section.blocks
        .map((b, i) => {
          if (i === 0) {
            return `<div class="ds-alt-row ds-split" style="grid-template-columns:${esc(splitTemplate(cols))}">
              <div class="ds-alt-copy">
                ${b.kicker ? `<p class="ds-eyebrow">${esc(b.kicker)}</p>` : ""}
                <h3>${esc(b.title)}</h3>
                ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
              </div>
              <div class="ds-alt-figure">${plate(figures.body, "")}</div>
            </div>`;
          }
          /*
           * Name, prose, drawing — the same three columns the index rows use.
           *
           * The mark used to be stacked above the title, which broke the left edge of the register
           * with a 72px rectangle and read, at reading size, as a rendering fault rather than as a
           * drawing. Set in its own column at the end of the row it is the row's illustration, and
           * both row types in the engine now make the same shape.
           */
          return `<div class="ds-alt-row ds-alt-pair">
            <div class="ds-alt-name">
              <h3>${esc(b.title)}</h3>
              ${b.kicker ? `<p class="ds-alt-tier">${esc(b.kicker)}</p>` : ""}
            </div>
            <div class="ds-alt-detail">
              ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
              ${b.points.length ? `<ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
            </div>
            <div class="ds-alt-mark" aria-hidden="true">${markFor(b)}</div>
          </div>`;
        })
        .join("")}</div>`;
    }
    // feature-rows
    return `<ol class="ds-index">${section.blocks
      .map(
        (b, i) => `<li class="ds-index-row" data-feature="${esc(b.title)}">
          <span class="ds-index-num">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</span>
          <h3>${esc(b.title)}</h3>
          ${b.body ? `<p>${esc(b.body)}</p>` : ""}
          <div class="ds-index-mark" aria-hidden="true">${markFor(b)}</div>
        </li>`,
      )
      .join("")}</ol>`;
  })();

  const rail =
    spec.taste.aestheticLean === "system-crafted"
      ? `<div class="ds-token-rail" aria-hidden="true">${[
          `radius ${spec.tokens.radius.md}`,
          `body ${spec.tokens.type.find((t) => t.name === "body")?.px}px`,
          `${spec.taste.density}`,
          `${spec.taste.motion}`,
          `contrast ${spec.tokens.contrast.bodyOnPaper}:1`,
        ]
          .map((c) => `<span class="ds-token-chip">${esc(c)}</span>`)
          .join("")}</div>`
      : "";

  // The alternating layout sets the figure beside its lead row. Every other feature layout is a
  // list, and a list of capabilities with nothing drawn beside it is where these pages used to run
  // for three full screens without giving the eye anything but type.
  const standing =
    section.layout !== "feature-alternating" && section.id === "features"
      ? plate(figures.body, `How ${spec.brief.productName} is put together`, "ds-plate-wide")
      : "";

  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="${frame(section)}">
      ${sectionHead(section, 2, frame(section) === "ds-wrap-wide")}
      ${standing}
      ${inner}
      ${rail}
    </div>
  </section>`;
}

/**
 * The one instrument on the page a reader can move.
 *
 * The plot is drawn at the size it is read at rather than as a 360×160 thumbnail, with a labelled
 * axis, hairline gridlines, and a stage marker per step. The slider still drives it, so the only
 * motion on the page is motion a reader asked for.
 */
function renderFigure(section: SectionSpec): string {
  const steps = section.blocks.slice(0, 4);
  const mid = Math.max(0, Math.floor((steps.length - 1) / 2));
  const max = Math.max(steps.length - 1, 0);
  const W = 720;
  const H = 420;
  const left = 64;
  const right = W - 28;
  const top = 40;
  const floor = H - 72;
  const span = Math.max(1, steps.length - 1);
  const points = steps.map((_, i) => ({
    x: left + (i / span) * (right - left),
    y: floor - (0.22 + (i / span) * 0.72) * (floor - top),
    title: steps[i]?.title ?? `Step ${i + 1}`,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1]?.x.toFixed(1) ?? left} ${floor} L${points[0]?.x.toFixed(1) ?? left} ${floor} Z`;

  const grid = [0, 1, 2, 3, 4]
    .map((g) => {
      const y = top + ((floor - top) / 3) * g;
      return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${right}" y2="${y.toFixed(1)}" stroke="var(--surface-border)" stroke-width="1"/>
        <text class="ds-fig-mono" x="${left - 12}" y="${(y + 4).toFixed(1)}" font-size="11" fill="var(--surface-quiet)" text-anchor="end">${100 - g * 30}</text>`;
    })
    .join("");

  // Vertical guide + step titles — the stage must never read as an empty chart void.
  const guides = points
    .map(
      (p, i) =>
        `<line x1="${p.x.toFixed(1)}" y1="${top}" x2="${p.x.toFixed(1)}" y2="${floor}" stroke="var(--surface-border)" stroke-width="1" opacity="0.35" stroke-dasharray="2 4"/>
         <text class="ds-fig-mono" x="${p.x.toFixed(1)}" y="${(top - 12).toFixed(1)}" font-size="11" fill="${i === mid ? "var(--c-accent)" : "var(--surface-quiet)"}" text-anchor="middle">${esc(clip(p.title, 18))}</text>`,
    )
    .join("");

  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "5fr 7fr"))}">
      <div>${sectionHead(section)}
        <ol class="ds-figure-steps">${steps
          .map(
            (s, i) =>
              `<li data-step="${i}" class="${i === mid ? "is-active" : ""}"><strong>${esc(s.title)}</strong>${
                s.body ? `<span> — ${esc(s.body)}</span>` : ""
              }</li>`,
          )
          .join("")}</ol>
      </div>
      <figure class="ds-figure" data-instrument="scrub">
        <div class="ds-figure-stage">
          <svg class="ds-fig" data-figure="scrub" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(section.title)}">
            <rect x="${left}" y="${top}" width="${right - left}" height="${floor - top}" fill="var(--c-paper-raised)" opacity="0.55"/>
            ${grid}
            ${guides}
            <path d="${area}" fill="var(--c-accent-surface)"/>
            <path d="${path}" fill="none" stroke="var(--c-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="${left}" y1="${top}" x2="${left}" y2="${floor}" stroke="var(--surface-border)" stroke-width="1"/>
            <line x1="${left}" y1="${floor}" x2="${right}" y2="${floor}" stroke="var(--surface-border)" stroke-width="1"/>
            ${points
              .map(
                (p, i) =>
                  `<line class="ds-scrub-stem" data-step="${i}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${floor}" stroke="var(--surface-border)" stroke-width="1" opacity="${i === mid ? 1 : 0}"/>
                   <circle class="ds-scrub-node" data-step="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === mid ? 6 : 4}" fill="${i === mid ? "var(--surface-bg)" : "var(--c-accent)"}" stroke="var(--c-accent)" stroke-width="2" opacity="${i === mid ? 1 : 0.45}"/>
                   <text class="ds-fig-mono" x="${p.x.toFixed(1)}" y="${(floor + 20).toFixed(1)}" font-size="11" fill="var(--surface-quiet)" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text>`,
              )
              .join("")}
            <text class="ds-fig-mono" x="${left + 8}" y="${(floor - 10).toFixed(1)}" font-size="11" fill="var(--surface-quiet)">cost · cumulative</text>
          </svg>
          <label class="ds-scrub">
            <span class="ds-caption">Step through the mechanism</span>
            <input type="range" min="0" max="${max}" value="${mid}" data-scrub aria-label="Step through the mechanism" />
          </label>
        </div>
        <figcaption data-scrub-caption>${esc(section.figureCaption ?? section.title)}</figcaption>
      </figure>
    </div>
  </section>`;
}

function renderChapters(section: SectionSpec, figures: FigurePlan): string {
  /*
   * Spined register with a mark per step. Odd-count card grids left a hole; empty chapter bodies
   * read as wireframes. Every row carries index, title, body, and a capability mark sized to
   * count as drawn matter (premium-b2b pages carry dozens of figures, not three plates).
   */
  const count = section.blocks.length;
  return `<section class="ds-section ds-story" data-surface="${section.surface}" data-section="${esc(section.id)}" data-editorial-chapters id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta("Chapters", `${count} beats · editorial order`)}
      ${sectionHead(section, 2, true)}
      <ol class="ds-chapters">
        ${section.blocks
          .map(
            (b, i) => `<li class="ds-chapter">
              <p class="ds-chapter-index">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</p>
              <h3>${esc(b.title)}</h3>
              ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
              ${figures.marks[i] ? `<div class="ds-chapter-mark" aria-hidden="true">${figures.marks[i]}</div>` : ""}
            </li>`,
          )
          .join("")}
      </ol>
    </div>
  </section>`;
}

/**
 * Marginalia essay — editorial-longform craft the engine did not previously emit.
 *
 * Reading column on the shared rail; annotations hang in the outer column as true marginalia
 * (not cards). A full-bleed hairline interrupts the measure between beats. Hard for a generic
 * theme pack to fake without inventing this layout grammar.
 */
function renderMarginalia(section: SectionSpec, figures: FigurePlan): string {
  const count = section.blocks.length;
  const notes = section.blocks
    .map((b, i) => {
      const note = b.kicker || b.meta || `Cut ${String(i + 1).padStart(2, "0")}`;
      return `<li class="ds-marginalia-note" style="--note-i:${i}">
        <p class="ds-marginalia-meta">${esc(note)}</p>
        <p class="ds-marginalia-title">${esc(b.title)}</p>
      </li>`;
    })
    .join("");
  const essay = section.blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-marginalia-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      return `<article class="ds-marginalia-beat">
        <p class="ds-chapter-index">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</p>
        <h3>${esc(b.title)}</h3>
        ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
        ${mark}
        ${i < count - 1 ? `<hr class="ds-marginalia-rule" aria-hidden="true"/>` : ""}
      </article>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-marginalia" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta("Essay", `${count} cuts · annotated`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-marginalia-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-marginalia-essay">${essay}</div>
        <aside class="ds-marginalia-rail" aria-label="Marginal notes">
          <ol class="ds-marginalia-notes">${notes}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

/**
 * Verso/recto spread with footnote register — research-dossier signature essay.
 *
 * Two facing pages with a center gutter rule; superscript markers in the prose resolve to a
 * footnote strip under the spread. Theme packs do not invent book openings + footnote registers
 * from a density slider.
 */
function renderSpread(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const mid = Math.ceil(blocks.length / 2) || 1;
  const verso = blocks.slice(0, mid);
  const recto = blocks.slice(mid);
  const renderPage = (page: typeof blocks, side: "verso" | "recto") =>
    page
      .map((b, i) => {
        const globalIndex = side === "verso" ? i : mid + i;
        const mark = figures.marks[globalIndex]
          ? `<div class="ds-spread-mark" aria-hidden="true">${figures.marks[globalIndex]}</div>`
          : "";
        const ref = `<sup class="ds-fn-ref" id="fnref-${globalIndex + 1}"><a href="#fn-${globalIndex + 1}">${globalIndex + 1}</a></sup>`;
        return `<article class="ds-spread-beat">
          <p class="ds-chapter-index">${esc(b.meta ?? String(globalIndex + 1).padStart(2, "0"))}</p>
          <h3>${esc(b.title)}${ref}</h3>
          ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
          ${mark}
        </article>`;
      })
      .join("");
  const footnotes = blocks
    .map((b, i) => {
      const note = b.kicker || b.meta || `Note ${String(i + 1).padStart(2, "0")}`;
      return `<li class="ds-fn-item" id="fn-${i + 1}">
        <a class="ds-fn-back" href="#fnref-${i + 1}" aria-label="Back to reference ${i + 1}">${i + 1}</a>
        <span class="ds-fn-meta">${esc(note)}</span>
        <span class="ds-fn-body">${esc(b.title)}</span>
      </li>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-spread" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-bleed-rule" aria-hidden="true"></div>
    <div class="ds-wrap-wide">
      ${secMeta("Spread", `${blocks.length} notes · verso / recto`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-spread-grid">
        <div class="ds-spread-page ds-spread-verso">${renderPage(verso, "verso")}</div>
        <div class="ds-spread-gutter" aria-hidden="true"></div>
        <div class="ds-spread-page ds-spread-recto">${renderPage(recto, "recto")}</div>
      </div>
      <ol class="ds-footnote-register" aria-label="Footnotes">${footnotes}</ol>
    </div>
  </section>`;
}

/**
 * Chrono essay — signal-observatory signature story.
 *
 * A vertical event track with tick beads and outer time labels. Not chapters, not marginalia,
 * not verso/recto — a time-ordered instrument reading.
 */
function renderChrono(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const count = blocks.length || 1;
  const ticks = blocks
    .map((b, i) => {
      const t = b.meta || `T+${String(i * 6).padStart(2, "0")}h`;
      return `<li class="ds-chrono-aside-tick" style="--i:${i}">
        <span class="ds-chrono-aside-time">${esc(t)}</span>
        <span class="ds-chrono-aside-title">${esc(b.title)}</span>
      </li>`;
    })
    .join("");
  const essay = blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-chrono-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      const bead = `<span class="ds-chrono-bead" aria-hidden="true" style="--i:${i}"></span>`;
      return `<article class="ds-chrono-beat" style="--i:${i}">
        ${bead}
        <p class="ds-chapter-index">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</p>
        <h3>${esc(b.title)}</h3>
        ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
        ${b.kicker ? `<p class="ds-chrono-note">${esc(b.kicker)}</p>` : ""}
        ${mark}
      </article>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-chrono" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta("Chronology", `${count} events · instrument time`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-chrono-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-chrono-essay">
          <div class="ds-chrono-track" aria-hidden="true"></div>
          ${essay}
        </div>
        <aside class="ds-chrono-aside" aria-label="Time index">
          <ol class="ds-chrono-aside-list">${ticks}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

/**
 * Proof band — a filled board, not a lonely quote on black.
 *
 * The pullquote layout left a dark void with one paragraph of type: the exact toy look buyers
 * reject. This board packs declared capabilities (with marks), a short claim strip, and a drawn
 * figure into one inverse surface so every region of the band has matter.
 */

/**
 * Single-entry essay with hanging folio number + ruled measure — archive-index signature.
 *
 * Not chapters, marginalia, verso/recto, or chrono beads — one entry at a time with a folio
 * hanging in the margin and a ruled reading measure.
 */
function renderEntry(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const count = blocks.length || 1;
  const essay = blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-entry-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      const folio = esc(b.meta ?? String(i + 1).padStart(3, "0"));
      // Cross stamps — related entries that travel with this reading (archive signature, not a card grid).
      const related = blocks
        .map((other, j) => ({ other, j }))
        .filter(({ j }) => j !== i)
        .slice(0, 3);
      const stamps =
        related.length > 0
          ? `<ul class="ds-cross-stamps" aria-label="Cross-referenced stamps for ${esc(b.title)}">${related
              .map(({ other, j }) => {
                const relFolio = esc(other.meta ?? String(j + 1).padStart(3, "0"));
                return `<li class="ds-cross-stamp">
                  <span class="ds-stamp-seal" aria-hidden="true"></span>
                  <span class="ds-stamp-folio">${relFolio}</span>
                  <span class="ds-stamp-name">${esc(other.title)}</span>
                </li>`;
              })
              .join("")}</ul>`
          : "";
      return `<article class="ds-entry-beat" style="--i:${i}">
        <span class="ds-entry-folio" aria-hidden="true">${folio}</span>
        <div class="ds-entry-measure">
          <p class="ds-chapter-index">${folio}</p>
          <h3>${esc(b.title)}</h3>
          ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
          ${b.kicker ? `<p class="ds-entry-note">${esc(b.kicker)}</p>` : ""}
          ${stamps}
          ${mark}
        </div>
      </article>`;
    })
    .join("");
  const aside = blocks
    .map((b, i) => {
      const folio = esc(b.meta ?? String(i + 1).padStart(3, "0"));
      return `<li class="ds-entry-aside-item">
        <span class="ds-entry-aside-folio">${folio}</span>
        <span class="ds-entry-aside-title">${esc(b.title)}</span>
        <span class="ds-entry-aside-seal" aria-hidden="true"></span>
      </li>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-entry" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-bleed-rule" aria-hidden="true"></div>
    <div class="ds-wrap-wide">
      ${secMeta("Entry", `${count} stamps · ruled measure`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-entry-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-entry-essay">${essay}</div>
        <aside class="ds-entry-aside" aria-label="Entry index">
          <p class="ds-entry-aside-kicker">Shelf index</p>
          <ol class="ds-entry-aside-list">${aside}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

/**
 * Hangtag essay — commerce-loom signature.
 * String/eyelet mark + hangtag body + outer size index. Not entry folio or chrono beads.
 */
function renderHangtag(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const count = blocks.length || 1;
  const essay = blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-hang-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      const size = esc(b.meta ?? ["XS", "S", "M", "L", "XL", "XXL"][i % 6]!);
      return `<article class="ds-hang-beat" style="--i:${i}">
        <span class="ds-hang-eyelet" aria-hidden="true"></span>
        <div class="ds-hang-body">
          <p class="ds-hang-size">${size}</p>
          <h3>${esc(b.title)}</h3>
          ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
          ${b.kicker ? `<p class="ds-hang-note">${esc(b.kicker)}</p>` : ""}
          ${mark}
        </div>
      </article>`;
    })
    .join("");
  const aside = blocks
    .map((b, i) => {
      const size = esc(b.meta ?? ["XS", "S", "M", "L", "XL", "XXL"][i % 6]!);
      return `<li class="ds-hang-aside-item">
        <span class="ds-hang-aside-size">${size}</span>
        <span class="ds-hang-aside-title">${esc(b.title)}</span>
      </li>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-hangtag" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-bleed-rule" aria-hidden="true"></div>
    <div class="ds-wrap-wide">
      ${secMeta("Hangtag", `${count} tags · size index`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-hang-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-hang-essay">${essay}</div>
        <aside class="ds-hang-aside" aria-label="Size index">
          <ol class="ds-hang-aside-list">${aside}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

/**
 * Gather essay with fold ticks + outer plate index — press-atelier signature.
 *
 * Not entry folios, chrono beads, verso/recto, or marginalia — signatures gathered in order
 * with fold ticks hanging in the margin.
 */
function renderGather(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const count = blocks.length || 1;
  const sigs = "ABCDEFGH".split("");
  const essay = blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-gather-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      const sig = esc(b.meta ?? `Sig ${sigs[i] ?? String(i + 1)}`);
      return `<article class="ds-gather-beat" style="--i:${i}">
        <span class="ds-gather-tick" aria-hidden="true">${sig}</span>
        <div class="ds-gather-measure">
          <p class="ds-chapter-index">${sig}</p>
          <h3>${esc(b.title)}</h3>
          ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
          ${b.kicker ? `<p class="ds-gather-note">${esc(b.kicker)}</p>` : ""}
          ${mark}
        </div>
      </article>`;
    })
    .join("");
  const aside = blocks
    .map((b, i) => {
      const sig = esc(b.meta ?? `Sig ${sigs[i] ?? String(i + 1)}`);
      return `<li class="ds-gather-aside-item">
        <span class="ds-gather-aside-sig">${sig}</span>
        <span class="ds-gather-aside-title">${esc(b.title)}</span>
      </li>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-gather" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-bleed-rule" aria-hidden="true"></div>
    <div class="ds-wrap-wide">
      ${secMeta("Gather", `${count} signatures · fold ticks`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-gather-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-gather-essay">${essay}</div>
        <aside class="ds-gather-aside" aria-label="Plate index">
          <ol class="ds-gather-aside-list">${aside}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

/**
 * Ember essay with lantern bead ticks + outer chapter index — lantern-path signature.
 * Not gather signatures, range beads, hangtag, or chrono track.
 */
function renderEmber(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const count = blocks.length || 1;
  const romans = ["I", "II", "III", "IV", "V", "VI"];
  const essay = blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-ember-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      const ch = esc(b.meta ?? `Ch ${romans[i] ?? String(i + 1)}`);
      return `<article class="ds-ember-beat" style="--i:${i}">
        <span class="ds-ember-bead" aria-hidden="true"></span>
        <div class="ds-ember-measure">
          <p class="ds-chapter-index">${ch}</p>
          <h3>${esc(b.title)}</h3>
          ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
          ${b.kicker ? `<p class="ds-ember-note">${esc(b.kicker)}</p>` : ""}
          ${mark}
        </div>
      </article>`;
    })
    .join("");
  const aside = blocks
    .map((b, i) => {
      const ch = esc(b.meta ?? `Ch ${romans[i] ?? String(i + 1)}`);
      return `<li class="ds-ember-aside-item">
        <span class="ds-ember-aside-ch">${ch}</span>
        <span class="ds-ember-aside-title">${esc(b.title)}</span>
      </li>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-ember" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-bleed-rule" aria-hidden="true"></div>
    <div class="ds-wrap-wide">
      ${secMeta("Ember", `${count} chapters · lantern beads`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-ember-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-ember-essay">${essay}</div>
        <aside class="ds-ember-aside" aria-label="Chapter index">
          <ol class="ds-ember-aside-list">${aside}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

/**
 * Range essay — field-guide signature.
 * Distribution beads + outer taxon index. Not hangtag, entry, or verso/recto.
 */
function renderRange(section: SectionSpec, figures: FigurePlan): string {
  const blocks = section.blocks;
  const count = blocks.length || 1;
  const essay = blocks
    .map((b, i) => {
      const mark = figures.marks[i] ? `<div class="ds-range-mark" aria-hidden="true">${figures.marks[i]}</div>` : "";
      const rank = esc(b.meta ?? ["K", "P", "C", "O", "F", "G"][i % 6]!);
      return `<article class="ds-range-beat" style="--i:${i}">
        <span class="ds-range-bead" aria-hidden="true"></span>
        <div class="ds-range-body">
          <p class="ds-range-rank">${rank}</p>
          <h3>${esc(b.title)}</h3>
          ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
          ${b.kicker ? `<p class="ds-range-note">${esc(b.kicker)}</p>` : ""}
          ${mark}
        </div>
      </article>`;
    })
    .join("");
  const aside = blocks
    .map((b, i) => {
      const rank = esc(b.meta ?? ["K", "P", "C", "O", "F", "G"][i % 6]!);
      return `<li class="ds-range-aside-item">
        <span class="ds-range-aside-rank">${rank}</span>
        <span class="ds-range-aside-title">${esc(b.title)}</span>
      </li>`;
    })
    .join("");
  return `<section class="ds-section ds-story ds-range" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-bleed-rule" aria-hidden="true"></div>
    <div class="ds-wrap-wide">
      ${secMeta("Range", `${count} beads · taxon index`)}
      ${sectionHead(section, 2, true)}
      <div class="ds-range-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
        <div class="ds-range-essay">
          <div class="ds-range-track" aria-hidden="true"></div>
          ${essay}
        </div>
        <aside class="ds-range-aside" aria-label="Taxon index">
          <ol class="ds-range-aside-list">${aside}</ol>
        </aside>
      </div>
    </div>
  </section>`;
}

function renderProofBoard(section: SectionSpec, figures: FigurePlan, spec?: DesignSpec): string {
  const cells = section.blocks.slice(0, 5);
  const kind = spec?.brief.siteKind;
  const boardClass =
    kind === "dashboard-webapp"
      ? "ds-proof-board ds-proof-board-stack"
      : kind === "fintech-marketing"
        ? "ds-proof-board ds-proof-board-wire"
        : kind === "corporate-story"
          ? "ds-proof-board ds-proof-board-spine"
          : "ds-proof-board";
  const board = cells.length
    ? `<ul class="${boardClass}" data-proof-board>${cells
        .map((b, i) => {
          const mark = figures.marks[i] ?? "";
          return `<li class="ds-proof-cell${b.emphasis === "lead" ? " is-lead" : ""}">
            <button type="button" class="ds-proof-hit" data-proof="${esc(b.title)}" aria-pressed="${b.emphasis === "lead" ? "true" : "false"}">
            ${mark ? `<div class="ds-proof-mark" aria-hidden="true">${mark}</div>` : ""}
            <p class="ds-proof-meta">${esc(b.meta ?? b.kicker ?? "")}</p>
            <h3>${esc(b.title)}</h3>
            ${b.body ? `<p>${esc(b.body)}</p>` : ""}
            </button>
          </li>`;
        })
        .join("")}</ul>`
    : "";
  const figure = figures.body
    ? plate(
        figures.body,
        section.quoteAttribution ??
          (kind === "dashboard-webapp"
            ? "Live desk"
            : kind === "fintech-marketing"
              ? "Treasury controls"
              : kind === "corporate-story"
                ? "Diligence pack"
                : "Declared scope"),
        "ds-proof-figure ds-plate-lit",
      )
    : figures.field
      ? `<figure class="ds-proof-figure ds-proof-figure-field" aria-hidden="true">${figures.field}</figure>`
      : "";
  const metaLabel =
    kind === "dashboard-webapp"
      ? "Desk"
      : kind === "fintech-marketing"
        ? "Treasury"
        : kind === "corporate-story"
          ? "Diligence"
          : "Proof";
  const metaDetail =
    kind === "dashboard-webapp"
      ? `${cells.length} views · stays open`
      : kind === "fintech-marketing"
        ? `${cells.length} controls · audit-ready`
        : kind === "corporate-story"
          ? `${cells.length} pillars · verifiable`
          : `${cells.length} capabilities · declared scope`;
  return `<section class="ds-section ds-proof" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta(metaLabel, metaDetail)}
      <div class="ds-proof-stage" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "5fr 7fr"))}">
        <header class="ds-proof-head">
          ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
          <h2 class="ds-heading">${esc(section.title)}</h2>
          <p class="ds-proof-claim">${esc(section.body || section.quote || "")}</p>
          ${section.quoteAttribution ? `<p class="ds-proof-foot">${esc(section.quoteAttribution)}</p>` : ""}
        </header>
        ${figure}
      </div>
      ${board}
    </div>
  </section>`;
}

/**
 * Product-proof workflow stage — five named handoffs with HTMX panel swaps.
 * First panel is already in the DOM (works without JS). Templates hold the rest.
 */
function renderWorkflowProof(section: SectionSpec, figures: FigurePlan, spec?: DesignSpec): string {
  const stages = section.blocks.slice(0, 5);
  const first = stages[0];
  const rail = stages.length
    ? `<nav class="ds-workflow-rail" aria-label="Sample workflow stages" data-workflow-rail>
        <ol>${stages
          .map((b, i) => {
            const id = (b.meta || `step-${i}`).replace(/[^a-z0-9-]/gi, "").toLowerCase() || `step-${i}`;
            const live = i === 0;
            return `<li>
              <button type="button"
                class="ds-workflow-chip${live ? " is-live" : ""}"
                data-workflow-step="${esc(id)}"
                data-frag="wf-frag-${esc(id)}"
                aria-pressed="${live ? "true" : "false"}"
                aria-controls="wf-panel">
                <span class="ds-workflow-meta">${String(i + 1).padStart(2, "0")}</span>
                <span class="ds-workflow-label">${esc(b.title)}</span>
              </button>
            </li>`;
          })
          .join("")}</ol>
      </nav>`
    : "";

  const panelBody = (b: (typeof stages)[number] | undefined, i: number): string => {
    if (!b) return "";
    const mark = figures.marks[i] ?? "";
    return `<article class="ds-workflow-card" data-workflow-state="${esc(b.meta ?? b.title)}">
      <p class="ds-workflow-kicker">${esc(b.kicker ?? "Declared capability")}</p>
      <h3>${esc(b.title)}</h3>
      ${b.body ? `<p class="ds-workflow-body">${esc(b.body)}</p>` : ""}
      ${
        b.points.length
          ? `<ul class="ds-workflow-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`
          : ""
      }
      ${mark ? `<div class="ds-workflow-mark" aria-hidden="true">${mark}</div>` : ""}
      ${
        (b.meta ?? "").toLowerCase() === "approve"
          ? `<p class="ds-workflow-gate"><span class="ds-workflow-gate-flag">Human gate</span> Review the draft, then approve — nothing applies itself.</p>`
          : ""
      }
    </article>`;
  };

  const templates = stages
    .map((b, i) => {
      const id = (b.meta || `step-${i}`).replace(/[^a-z0-9-]/gi, "").toLowerCase() || `step-${i}`;
      return `<template id="wf-frag-${esc(id)}">${panelBody(b, i)}</template>`;
    })
    .join("");

  const figure = figures.body
    ? plate(figures.body, section.quoteAttribution ?? "Sample workflow", "ds-proof-figure ds-plate-lit")
    : figures.field
      ? `<figure class="ds-proof-figure ds-proof-figure-field" aria-hidden="true">${figures.field}</figure>`
      : "";

  // Honest integration marks — capability names only; never invent partner logos.
  const markNames = (spec?.brief.features ?? [])
    .filter((f) => /sync|integrat|crm|export|connect|api|sso/i.test(`${f.name} ${f.description}`))
    .map((f) => f.name);
  const marks =
    markNames.length > 0
      ? `<ul class="ds-mark-row" aria-label="Declared integrations and connectors"><li class="ds-mark-row-label">In product</li>${markNames
          .slice(0, 6)
          .map((n) => `<li>${esc(n)}</li>`)
          .join("")}</ul>`
      : "";

  return `<section class="ds-section ds-proof ds-workflow" data-surface="${section.surface}" data-section="${esc(section.id)}" data-workflow-proof id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta("Workflow", "Sample · five named states · human approve")}
      <div class="ds-proof-stage ds-workflow-stage" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "5fr 7fr"))}">
        <header class="ds-proof-head">
          ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
          <h2 class="ds-heading">${esc(section.title)}</h2>
          <p class="ds-proof-claim">${esc(section.body || "")}</p>
          ${section.quoteAttribution ? `<p class="ds-proof-foot">${esc(section.quoteAttribution)}</p>` : ""}
          ${rail}
        </header>
        <div class="ds-workflow-field">
          ${figure}
          <div id="wf-panel" class="ds-workflow-panel" aria-live="polite">${panelBody(first, 0)}</div>
        </div>
      </div>
      ${marks}
      ${templates}
    </div>
  </section>`;
}

function renderPlans(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
      <div class="ds-cadence" data-pricing-cadence role="group" aria-label="Billing cadence">
        <button type="button" class="ds-cadence-chip is-live" data-cadence="monthly" aria-pressed="true">Monthly</button>
        <button type="button" class="ds-cadence-chip" data-cadence="annual" aria-pressed="false">Annual <span class="ds-cadence-save">Save on annual</span></button>
      </div>
      <ul class="ds-plans">
        ${section.blocks
          .map(
            (b) => `<li class="ds-plan${b.emphasis === "lead" ? " ds-plan-recommended" : ""}" data-plan="${esc(b.title)}">
              ${b.emphasis === "lead" ? `<p class="ds-plan-flag">Recommended</p>` : ""}
              <h3>${esc(b.title)}</h3>
              <p class="ds-plan-meta">${esc(b.meta ?? "")}</p>
              <p class="ds-small">${esc(b.body)}</p>
              <ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
              ${
                section.ctaLabel
                  ? `<a class="ds-btn ${b.emphasis === "lead" ? "ds-btn-primary" : "ds-btn-secondary"}" href="#cta">${esc(
                      b.emphasis === "lead" ? section.ctaLabel : "Compare plans",
                    )}</a>`
                  : ""
              }
            </li>`,
          )
          .join("")}
      </ul>
      <p class="ds-pricing-risk">Limits and lanes come from declared capabilities only. Cancel or pause without a surprise lock-in.</p>
    </div>
  </section>`;
}

function renderMatrix(section: SectionSpec): string {
  const lanes = ["Core", "Standard", "Full"];
  // Tier rather than prose in the trailing column. The matrix stopped carrying descriptions when
  // the editorial layer moved them to the catalogue, which left this table with an empty column
  // down its right edge.
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
      <table class="ds-matrix">
        <caption class="ds-sr">${esc(section.title)}</caption>
        <thead><tr><th scope="col">Capability</th><th scope="col">Tier</th>${lanes.map((l) => `<th scope="col">${esc(l)}</th>`).join("")}</tr></thead>
        <tbody>
          ${section.blocks
            .map((b, i) => {
              const inCore = i < Math.ceil(section.blocks.length / 3);
              const inStandard = i < Math.ceil((section.blocks.length * 2) / 3);
              const mark = (on: boolean) =>
                on ? `<td class="ds-yes">included</td>` : `<td class="ds-no">—</td>`;
              return `<tr><th scope="row">${esc(b.title)}</th><td class="ds-matrix-tier">${esc(
                b.meta ?? "",
              )}</td>${mark(inCore)}${mark(inStandard)}${mark(true)}</tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  </section>`;
}

/**
 * The answers, set as a register rather than as a column beside a heading.
 *
 * The split form gave the head a third of the width and the questions the rest, which meant the
 * left third of the section was a heading and then three hundred pixels of nothing — the same
 * failure as a reserved height, turned on its side. Set across the full measure in two columns the
 * questions take half the height, the void goes, and the answers land on the same screen as the
 * table they follow, which is where a reader comparing options actually wants them.
 */
function renderFaq(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section, 2, true)}
      <div class="ds-faq">
        ${section.blocks
          .map(
            (b) => `<div class="ds-faq-item">
              <h3>${esc(b.title)}</h3>
              <p>${esc(b.body)}</p>
            </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

/**
 * The closing band, signed.
 *
 * Reference pages rarely end on a bare sentence and a button. The mark is drawn on the construction
 * grid it was built from and set beside the closing decision — a sign-off rather than one more
 * panel.
 *
 * It used to sit *behind* the copy, in a band holding three quarters of a screen for four lines of
 * text. Both halves of that were wrong. A mark faded to a third of its ink behind a headline is not
 * a sign-off, it is a watermark; and the reserved height meant the last thing a reader saw on the
 * page was three hundred pixels of nothing. Given its own column the mark is legible, the band is
 * as tall as what is in it, and the composition reads across rather than down.
 */
function renderCtaBand(section: SectionSpec, figures: FigurePlan, spec?: DesignSpec): string {
  const isColophon = /Colophon|Imprint|Calibration|Registry|Care label|Voucher|Pressroom/i.test(section.eyebrow ?? "");
  const colophonClass = isColophon ? " ds-closing-colophon" : "";
  // Observatory calibration close — paper strip of tolerance numerals (not metrics theatre).
  const isObservatoryCal =
    Boolean(spec && spec.brief.siteKind === "signal-observatory") &&
    /Calibration/i.test(section.eyebrow ?? "");
  const tolLadder = ["±0.5", "±1.0", "±1.5", "±2.0"];
  const fromCatalogue = isObservatoryCal && spec ? catalogue(spec).slice(0, 4) : [];
  const calLabels =
    fromCatalogue.length > 0
      ? fromCatalogue.map((b) => b.title)
      : isObservatoryCal && spec
        ? spec.brief.features.slice(0, 4).map((f) => f.name)
        : [];
  const calStrip =
    calLabels.length > 0
      ? `<ol class="ds-cal-strip" aria-label="Tolerance marks">${calLabels
          .map(
            (name, i) =>
              `<li class="ds-cal-mark"><span class="ds-cal-tol">${tolLadder[i % tolLadder.length]}</span><span class="ds-cal-ch">${esc(name.slice(0, 14))}</span></li>`,
          )
          .join("")}</ol>`
      : "";
  return `<section class="ds-section ds-closing${colophonClass}" data-surface="${section.surface}" data-section="${esc(section.id)}" id="cta">
    <div class="ds-wrap-wide ds-closing-grid">
      <div class="ds-cta">
        ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
        ${calStrip}
        <h2 class="ds-title">${esc(section.title)}</h2>
        <p class="ds-lede">${esc(section.body)}</p>
        ${actions(section, "band")}
      </div>
      ${figures.closing ? `<div class="ds-closing-mark">${figures.closing}</div>` : ""}
    </div>
  </section>`;
}

/**
 * The closing band.
 *
 * Reference pages end heavy. A four or five column footer carrying the whole site is the densest
 * screen most of them have, and it is half of why their vertical rhythm swings the way it does —
 * a full-screen statement two scrolls earlier only reads as quiet because this exists to be loud.
 * The stub version here was three columns of three links, which made the last screen of every
 * generated page weigh about the same as the middle of it.
 */
/**
 * Footer columns must not look like site links that only jump to #top.
 * Map evaluate/nav labels to real section ids; company/trust labels stay non-interactive text.
 */
function footerPointHref(label: string, knownIds: Set<string>, columnTitle: string): string | null {
  const key = label.trim().toLowerCase();
  const companyTrust = new Set([
    "about",
    "customers",
    "careers",
    "press",
    "contact",
    "security",
    "availability",
    "data handling",
    "subprocessors",
    "status",
  ]);
  if (companyTrust.has(key)) return null;

  const prefer = (id: string, fallback?: string): string | null => {
    if (knownIds.has(id)) return `#${id}`;
    if (fallback && knownIds.has(fallback)) return `#${fallback}`;
    return null;
  };

  const map: Record<string, () => string | null> = {
    "how it works": () => prefer("figure", "features"),
    "what is included": () => prefer("compare", "features"),
    questions: () => prefer("faq", "cta"),
    "security review": () => prefer("proof", "cta"),
    "talk to us": () => prefer("cta"),
    sequence: () => prefer("figure", "story"),
    "why it holds": () => prefer("proof"),
    workspace: () => prefer("app"),
    plans: () => prefer("pricing"),
    included: () => prefer("compare"),
  };
  if (map[key]) return map[key]!();

  // Capabilities column: feature names → catalogue
  if (/^capabilities$/i.test(columnTitle)) return prefer("features");
  return null;
}

function renderFooter(section: SectionSpec, spec: DesignSpec): string {
  const year = 2026;
  const knownIds = new Set(spec.sections.map((s) => s.id));
  // Closing band always exposes id="cta" even when section.id differs.
  knownIds.add("cta");
  knownIds.add("top");
  return `<footer class="ds-footer" data-surface="${section.surface}" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide">
      <div class="ds-footer-grid">
        <div class="ds-footer-col ds-footer-brand">
          <p class="ds-wordmark">${esc(section.brandLabel ?? section.title)}</p>
          <p class="ds-caption">${esc(section.body)}</p>
          ${section.ctaLabel ? `<a class="ds-btn ds-btn-secondary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
        </div>
        ${section.blocks
          .map(
            (b) => `<div class="ds-footer-col">
              <h4>${esc(b.title)}</h4>
              ${b.points
                .map((p) => {
                  const href = footerPointHref(p, knownIds, b.title);
                  return href
                    ? `<a href="${href}">${esc(p)}</a>`
                    : `<span class="ds-footer-item">${esc(p)}</span>`;
                })
                .join("")}
            </div>`,
          )
          .join("")}
      </div>
      <div class="ds-footer-base">
        <span>© ${year} ${esc(section.brandLabel ?? section.title)}</span>
        <span>All capabilities listed on this page are available today</span>
        <span>Accessibility</span>
        <span>Privacy</span>
        <span>Terms</span>
      </div>
    </div>
  </footer>`;
}

function renderAppShell(section: SectionSpec, spec: DesignSpec, figures: FigurePlan): string {
  const rows = section.blocks;
  const isDash = spec.brief.siteKind === "dashboard-webapp";
  // Dashboard packs the shell into one measured screen: short claim, dense table detail, no
  // duplicated lede. Height under ~1vh keeps the 2200-character peak from smearing into the
  // quiet specimen valley above.
  const head = isDash
    ? `<div class="ds-app-claim">
        ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
        <h2 class="ds-heading">${esc(section.title)}</h2>
      </div>`
    : sectionHead(section);
  const lede = isDash
    ? ""
    : section.body
      ? `<p class="ds-lede">${esc(section.body)} Each row is a live decision for ${esc(spec.brief.audience)} — state, detail, and age — so this surface stays the source of truth rather than a report you refresh.</p>`
      : "";
  return `<section id="${esc(section.id)}" class="ds-section ds-app-band" data-surface="${section.surface}" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${head}
      <div class="ds-app" data-app-shell>
        <div class="ds-app-top">
          <span class="ds-wordmark">${esc(section.brandLabel ?? spec.brief.productName)}</span>
          <span class="ds-app-crumbs">workspace / ${esc(section.title.toLowerCase())}</span>
          <span class="ds-pill ds-pill-signal" style="margin-left:auto">live</span>
        </div>
        <div class="ds-app-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "260px 1fr"))}">
          <aside class="ds-app-side" aria-label="Workspace navigation">
            <p class="ds-eyebrow">Views</p>
            <ul class="ds-app-nav" role="list" data-app-views>
              ${section.aside
                .map(
                  (b, i) =>
                    `<li><button type="button" class="ds-app-nav-item${i === 0 ? " is-current" : ""}" data-view="${esc(b.title)}"${i === 0 ? ' aria-current="page"' : ""}>${esc(b.title)}</button></li>`,
                )
                .join("")}
            </ul>
            <p class="ds-eyebrow">Filters</p>
            <ul class="ds-app-nav" role="list" data-app-filters>
              <li><button type="button" class="ds-app-nav-item" data-filter="now" aria-pressed="false">Needs a human</button></li>
              <li><button type="button" class="ds-app-nav-item" data-filter="today" aria-pressed="false">Assigned to me</button></li>
              <li><button type="button" class="ds-app-nav-item" data-filter="queued" aria-pressed="false">Resolved today</button></li>
            </ul>
          </aside>
          <div class="ds-app-main">
            ${lede}
            <p class="ds-app-view-label" data-app-view-label>${esc(section.aside[0]?.title ?? "All views")}</p>
            <div class="ds-app-stats">
              ${section.metrics
                .map(
                  (m, i) => `<div class="ds-stat">
                    <b>${esc(m.value)}</b>
                    <span>${esc(m.label)}</span>
                    ${figures.sparks[i] && isReading(m.value) ? `<div class="ds-stat-spark" aria-hidden="true">${figures.sparks[i]}</div>` : ""}
                  </div>`,
                )
                .join("")}
            </div>
            <table class="ds-table" data-app-table>
              <thead><tr><th scope="col">Item</th><th scope="col">State</th><th scope="col">Detail</th><th scope="col" class="ds-num">Age</th></tr></thead>
              <tbody>
                ${rows
                  .map(
                    (b) => `<tr data-row-view="${esc(b.title)}" data-row-state="${esc((b.kicker ?? "Queued").toLowerCase())}">
                      <th scope="row">${esc(b.title)}</th>
                      <td><span class="ds-pill${b.kicker === "Now" ? " ds-pill-signal" : ""}">${esc(b.kicker ?? "Queued")}</span></td>
                      <td>${esc(b.points[0] ?? b.body ?? b.kicker ?? b.title)}</td>
                      <td class="ds-num">${esc(b.meta ?? "0")}m</td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="ds-empty" data-app-empty hidden>
              <p class="ds-eyebrow">Nothing else needs you</p>
              <p class="ds-small">Everything outside the filters above is handled automatically. This state is the goal, not an error.</p>
              ${section.ctaLabel ? `<a class="ds-btn ds-btn-secondary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Mark a section that continues the previous one's subject, so the stylesheet can drop the break
 * above it. Applied here rather than in each layout because it is a property of where the section
 * sits in the argument, not of the shape it makes.
 */
function bondAttr(section: SectionSpec, html: string): string {
  if (!section.bond) return html;
  return html.replace(/^<(section|footer)\s/, (_m, tag: string) => `<${tag} data-bond="continues" `);
}

function renderSection(section: SectionSpec, index: number, spec: DesignSpec, figures: FigurePlan): string {
  const wrapped = (html: string): string => {
    if (section.layout === "nav") return html;
    return revealAttrs(spec, index, bondAttr(section, html));
  };

  switch (section.layout) {
    case "nav":
      return renderNav(section);
    case "hero-editorial":
    case "hero-split":
    case "hero-statement":
    case "hero-seam":
    case "hero-folio":
    case "hero-chrono":
    case "hero-register":
    case "hero-loom":
    case "hero-voucher":
    case "hero-press":
    case "hero-path":
    case "hero-pipeline":
    case "hero-queue":
    case "hero-diligence":
    case "hero-mechanism":
    case "hero-wire":
      return wrapped(renderHero(section, spec, figures));
    case "metric-band":
      return wrapped(renderMetricBand(section, figures, spec));
    case "specimen-band":
      return wrapped(renderSpecimen(section, figures, spec));
    case "feature-bento":
    case "feature-index":
    case "feature-rows":
    case "feature-alternating":
      return wrapped(renderFeatures(section, spec, figures));
    case "figure-explainer":
      return wrapped(renderFigure(section));
    case "story-chapters":
      return wrapped(renderChapters(section, figures));
    case "story-marginalia":
      return wrapped(renderMarginalia(section, figures));
    case "story-spread":
      return wrapped(renderSpread(section, figures));
    case "story-chrono":
      return wrapped(renderChrono(section, figures));
    case "story-entry":
      return wrapped(renderEntry(section, figures));
    case "story-hangtag":
      return wrapped(renderHangtag(section, figures));
    case "story-range":
      return wrapped(renderRange(section, figures));
    case "story-gather":
      return wrapped(renderGather(section, figures));
    case "story-ember":
      return wrapped(renderEmber(section, figures));
    case "pullquote":
    case "marquee-proof":
      return wrapped(renderProofBoard(section, figures, spec));
    case "workflow-proof":
      return wrapped(renderWorkflowProof(section, figures, spec));
    case "pricing-lanes":
      return wrapped(renderPlans(section));
    case "compare-matrix":
      return wrapped(renderMatrix(section));
    case "faq-columns":
      return wrapped(renderFaq(section));
    case "cta-band":
      return wrapped(renderCtaBand(section, figures, spec));
    case "footer-columns":
      return renderFooter(section, spec);
    case "app-shell":
      return wrapped(renderAppShell(section, spec, figures));
    default:
      return "";
  }
}

function scripts(spec: DesignSpec): string {
  const revealJs =
    spec.taste.motion === "light-scroll-reveals"
      ? `var nodes=[].slice.call(document.querySelectorAll('.ds-reveal'));
  if(nodes.length){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){
      nodes.forEach(function(n){n.classList.add('is-in')});
    } else {
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
      },{threshold:0.08,rootMargin:'0px 0px -6% 0px'});
      nodes.forEach(function(n){io.observe(n)});
    }
  }`
      : "";

  return `<script>
(function(){
  ${revealJs}

  var scrub=document.querySelector('[data-scrub]');
  if(scrub){
    var nodes=[].slice.call(document.querySelectorAll('.ds-scrub-node'));
    var stems=[].slice.call(document.querySelectorAll('.ds-scrub-stem'));
    var steps=[].slice.call(document.querySelectorAll('.ds-figure-steps [data-step]'));
    var caption=document.querySelector('[data-scrub-caption]');
    var base=caption?caption.textContent:'';
    function paint(v){
      var idx=Number(v)||0;
      nodes.forEach(function(n){
        var active=Number(n.getAttribute('data-step'))===idx;
        n.setAttribute('r', active ? '6' : '4');
        n.setAttribute('opacity', active ? '1' : '0.45');
        n.setAttribute('fill', active ? 'var(--surface-bg)' : 'var(--c-accent)');
      });
      stems.forEach(function(s){
        s.setAttribute('opacity', Number(s.getAttribute('data-step'))===idx ? '1' : '0');
      });
      steps.forEach(function(li){
        li.classList.toggle('is-active', Number(li.getAttribute('data-step'))===idx);
      });
      if(caption){
        var active=steps.filter(function(li){return Number(li.getAttribute('data-step'))===idx})[0];
        if(active){
          var strong=active.querySelector('strong');
          caption.textContent = strong ? strong.textContent : active.textContent;
        } else {
          caption.textContent = base;
        }
      }
    }
    scrub.addEventListener('input', function(){ paint(scrub.value); });
    function go(idx){
      scrub.value=String(idx);
      paint(scrub.value);
    }
    steps.forEach(function(li){
      li.setAttribute('role','button');
      li.setAttribute('tabindex','0');
      li.style.cursor='pointer';
      li.addEventListener('click', function(){ go(li.getAttribute('data-step')); });
      li.addEventListener('keydown', function(e){
        if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(li.getAttribute('data-step')); }
      });
    });
    nodes.forEach(function(n){
      n.style.cursor='pointer';
      n.addEventListener('click', function(){ go(n.getAttribute('data-step')); });
    });
    paint(scrub.value);
  }

  [].slice.call(document.querySelectorAll('.ds-flow-track')).forEach(function(root){
    var cards=[].slice.call(root.querySelectorAll('.ds-flow-card[data-step]'));
    var caption=root.querySelector('[data-flow-caption]');
    function activate(i){
      cards.forEach(function(el, idx){
        var on=idx===i;
        el.classList.toggle('is-live', on);
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if(caption){
        var live=cards[i];
        caption.textContent=live ? (live.getAttribute('data-label') || (live.querySelector('.ds-flow-title')||{}).textContent || '') : '';
      }
    }
    cards.forEach(function(el, i){
      el.addEventListener('click', function(){ activate(i); });
    });
    var initial=cards.findIndex(function(el){ return el.classList.contains('is-live'); });
    activate(initial >= 0 ? initial : 0);
  });

  function setAppView(shell, view){
    if(!shell || !view) return;
    var nav=[].slice.call(shell.querySelectorAll('[data-app-views] [data-view]'));
    var filters=[].slice.call(shell.querySelectorAll('[data-app-filters] [data-filter]'));
    var rows=[].slice.call(shell.querySelectorAll('[data-row-view]'));
    var label=shell.querySelector('[data-app-view-label]');
    var empty=shell.querySelector('[data-app-empty]');
    var activeFilter='all';
    filters.forEach(function(el){
      if(el.getAttribute('aria-pressed')==='true') activeFilter=el.getAttribute('data-filter')||'all';
    });
    nav.forEach(function(el){
      var on=el.getAttribute('data-view')===view;
      el.classList.toggle('is-current', on);
      if(on) el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
    var visible=0;
    rows.forEach(function(el){
      var viewOk=el.getAttribute('data-row-view')===view;
      var state=(el.getAttribute('data-row-state')||'');
      var filterOk=activeFilter==='all' || state===activeFilter;
      var show=viewOk && filterOk;
      el.hidden=!show;
      if(show) visible+=1;
    });
    if(label) label.textContent=view;
    if(empty) empty.hidden=visible>0;
  }

  [].slice.call(document.querySelectorAll('[data-app-shell]')).forEach(function(shell){
    var nav=[].slice.call(shell.querySelectorAll('[data-app-views] [data-view]'));
    var filters=[].slice.call(shell.querySelectorAll('[data-app-filters] [data-filter]'));
    function activeView(){
      var cur=nav.filter(function(el){ return el.getAttribute('aria-current')==='page'; })[0];
      return cur ? cur.getAttribute('data-view') : (nav[0] && nav[0].getAttribute('data-view'));
    }
    nav.forEach(function(el){
      el.addEventListener('click', function(){
        filters.forEach(function(f){ f.classList.remove('is-current'); f.setAttribute('aria-pressed','false'); });
        setAppView(shell, el.getAttribute('data-view'));
      });
    });
    filters.forEach(function(el){
      el.addEventListener('click', function(){
        var on=el.getAttribute('aria-pressed')!=='true';
        filters.forEach(function(f){
          var active=on && f===el;
          f.classList.toggle('is-current', active);
          f.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        setAppView(shell, activeView());
      });
    });
    setAppView(shell, activeView());
  });

  [].slice.call(document.querySelectorAll('[data-rail]')).forEach(function(rail){
    var chips=[].slice.call(rail.querySelectorAll('[data-rail-step]'));
    var caption=rail.parentElement && rail.parentElement.querySelector('[data-rail-caption]');
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(other){
          var on=other===chip;
          other.classList.toggle('is-live', on);
          other.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var label=chip.getAttribute('data-rail-label') || '';
        if(caption) caption.textContent=label;
        var view=chip.getAttribute('data-view');
        if(view){
          var shell=document.querySelector('[data-app-shell]');
          if(shell){
            var filters=[].slice.call(shell.querySelectorAll('[data-app-filters] [data-filter]'));
            filters.forEach(function(f){ f.classList.remove('is-current'); f.setAttribute('aria-pressed','false'); });
            setAppView(shell, view);
            var app=document.getElementById('app');
            if(app && app.scrollIntoView) app.scrollIntoView({ behavior:'smooth', block:'nearest' });
          }
        }
      });
    });
  });

  [].slice.call(document.querySelectorAll('[data-proof-board]')).forEach(function(board){
    var hits=[].slice.call(board.querySelectorAll('[data-proof]'));
    hits.forEach(function(el){
      el.addEventListener('click', function(){
        hits.forEach(function(other){
          var on=other===el;
          other.classList.toggle('is-live', on);
          other.setAttribute('aria-pressed', on ? 'true' : 'false');
          var cell=other.closest('.ds-proof-cell');
          if(cell) cell.classList.toggle('is-lead', on);
        });
        var target=el.getAttribute('data-proof');
        var feature=document.querySelector('[data-feature="'+target+'"], [data-feature-id="'+target+'"]');
        if(feature && feature.scrollIntoView) feature.scrollIntoView({ behavior:'smooth', block:'nearest' });
      });
    });
  });

  /* Product-proof workflow — prefer htmx.swap when HTMX is present; DOM fallback otherwise. */
  [].slice.call(document.querySelectorAll('[data-workflow-proof]')).forEach(function(root){
    var chips=[].slice.call(root.querySelectorAll('[data-workflow-step]'));
    var panel=root.querySelector('#wf-panel') || document.getElementById('wf-panel');
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(other){
          var on=other===chip;
          other.classList.toggle('is-live', on);
          other.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var fragId=chip.getAttribute('data-frag');
        var frag=fragId ? document.getElementById(fragId) : null;
        if(!frag || !panel) return;
        var html=frag.innerHTML;
        if(window.htmx && typeof window.htmx.swap==='function'){
          window.htmx.swap('#wf-panel', html, {swapStyle:'innerHTML'});
        } else {
          panel.innerHTML=html;
        }
      });
    });
  });

  [].slice.call(document.querySelectorAll('[data-pricing-cadence]')).forEach(function(group){
    var chips=[].slice.call(group.querySelectorAll('[data-cadence]'));
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(other){
          var on=other===chip;
          other.classList.toggle('is-live', on);
          other.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });
  });

  /* Lantern-path: waypoint rail active chapter + silhouette near-plane handoff. */
  (function(){
    var marks=[].slice.call(document.querySelectorAll('.ds-way-mark[data-way]'));
    var sils=[].slice.call(document.querySelectorAll('.ds-path-near .ds-sil'));
    if(!marks.length) return;
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function setActive(i){
      marks.forEach(function(m, idx){ m.classList.toggle('is-active', idx===i); });
      if(sils.length){
        sils.forEach(function(s, idx){
          var on=idx===i%sils.length;
          s.style.opacity = on ? '0.7' : '0.28';
          if(!reduce) s.style.transform = on ? 'translateY(0)' : 'translateY(8px)';
        });
      }
    }
    marks.forEach(function(m, i){
      m.addEventListener('click', function(){ setActive(i); });
    });
    var sections=['#features','#figure','#specimen','#story','#cta'].map(function(sel){ return document.querySelector(sel); });
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting) return;
          var idx=sections.indexOf(e.target);
          if(idx>=0) setActive(idx);
        });
      },{threshold:0.25,rootMargin:'-20% 0px -40% 0px'});
      sections.forEach(function(el){ if(el) io.observe(el); });
    }
    setActive(0);
  })();
})();
</script>`;
}

/** Self-contained HTML document for iframe preview / static showcase. */
export function renderPreviewHtml(spec: DesignSpec): string {
  const fonts = spec.tokens.fontRequests.map((f) => `family=${f}`).join("&");
  const figures = figuresFor(spec);
  const needsHtmx = spec.sections.some((s) => s.layout === "workflow-proof");
  const paperFrame = spec.routedSkills.includes("paper-technical-frame");
  const atmosphere =
    spec.routedSkills.includes("ambient-atmosphere-craft") ||
    spec.routedSkills.includes("signal-beam-craft");
  const depth = spec.taste.roundingDepth;
  const atmosphereLayer = atmosphere
    ? `<div class="ds-atmosphere" aria-hidden="true"><div class="ds-atmosphere-motes"></div><div class="ds-accent-beam"></div></div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(spec.brief.productName)} — ${esc(spec.brief.tagline || spec.brief.audience)}</title>
<meta name="description" content="${esc(spec.summary)}"/>
<meta name="color-scheme" content="${spec.taste.colorMood === "dark-premium" ? "dark" : "light"}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap"/>
${needsHtmx ? `<script src="https://unpkg.com/htmx.org@2.0.4" defer></script>` : ""}
<noscript><style>.ds-reveal{opacity:1!important;transform:none!important}</style></noscript>
<style>${renderCss(spec)}</style>
</head>
<body data-lean="${esc(spec.taste.aestheticLean)}" data-motion="${esc(spec.taste.motion)}" data-density="${esc(spec.taste.density)}" data-mood="${esc(spec.taste.colorMood)}" data-sitekind="${esc(spec.brief.siteKind)}" data-depth="${esc(depth)}"${paperFrame ? ` data-frame="paper-technical"` : ""}${atmosphere ? ` data-atmosphere="static"` : ""}>
${atmosphereLayer}
<a class="ds-skip" href="#main">Skip to content</a>
<p class="ds-sr">${esc(spec.summary)}</p>
${spec.sections
  .filter((s) => s.layout === "nav")
  .map((s, i) => renderSection(s, i, spec, figures))
  .join("\n")}
<main id="main">
${spec.sections
  .filter((s) => s.layout !== "nav" && s.layout !== "footer-columns")
  .map((s, i) => renderSection(s, i, spec, figures))
  .join("\n")}
</main>
${spec.sections
  .filter((s) => s.layout === "footer-columns")
  .map((s, i) => renderSection(s, i, spec, figures))
  .join("\n")}
${scripts(spec)}
</body>
</html>`;
}
