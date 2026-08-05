/**
 * Rendering — one function per layout variant.
 *
 * The renderer never invents visual values; it composes token-driven classes. That constraint is
 * what keeps the emitted page consistent with the design system it declares, and it is what makes
 * the generated markup safe to hand to a developer as a starting point.
 */
import { renderCss } from "./css";
import { isReading, planFigures, type FigurePlan } from "./figures";
import type { Block, DesignSpec, SectionSpec } from "./types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  if (spread && section.body) {
    return `<div class="ds-section-head ds-section-head-spread">
      <div>
        ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
        <h${headingLevel} class="${cls}">${esc(section.title)}</h${headingLevel}>
      </div>
      ${lede}
    </div>`;
  }
  return `<div class="ds-section-head">
    ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
    <h${headingLevel} class="${cls}">${esc(section.title)}</h${headingLevel}>
    ${lede}
  </div>`;
}

function actions(section: SectionSpec, variant: "hero" | "band" = "hero"): string {
  if (!section.ctaLabel) return "";
  return `<div class="ds-actions${variant === "hero" ? " ds-hero-actions" : ""}">
    <a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>
    ${section.secondaryLabel ? `<a class="ds-btn ds-btn-secondary" href="#features">${esc(section.secondaryLabel)}</a>` : ""}
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
function plate(svg: string, caption: string, extraClass = ""): string {
  if (!svg) return "";
  return `<figure class="ds-plate${extraClass ? ` ${extraClass}` : ""}">
    ${svg}
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
    // Wide claim strip + full-bleed product — the corridor measured on premium-b2b / studio folds.
    return `<section id="top" class="ds-section ds-hero ds-hero-spanning" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-wrap-wide">${copy}</div>
      ${spanning}
    </section>`;
  }

  if (section.layout === "hero-editorial") {
    return `<section id="top" class="ds-section ds-hero ds-hero-spanning" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "8fr 4fr"))}">
        ${copy}
        <aside class="ds-hero-aside">
          <p class="ds-eyebrow">In this page</p>
          <ol class="ds-figure-steps">${section.aside
            .map((b, i) => `<li${i === 0 ? ' class="is-active"' : ""}>${esc(b.title)}</li>`)
            .join("")}</ol>
        </aside>
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
 */
function renderSpecimen(section: SectionSpec, figures: FigurePlan): string {
  if (!figures.band) return "";
  return `<section class="ds-section ds-specimen" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-specimen-head">
      <h2 class="ds-heading">${esc(section.title)}</h2>
      ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
    </div>
    <div class="ds-bleed">
      <figure class="ds-plate ds-plate-bleed">
        ${figures.band}
      </figure>
    </div>
  </section>`;
}

function renderMetricBand(section: SectionSpec, figures: FigurePlan): string {
  // A reading has a direction, and a column of bare numerals asks the reader to take the direction
  // on trust. The shape sits under the numeral at the width of its own column.
  return `<section class="ds-section ds-section-tight ds-metrics-band" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section, 2)}
      <div class="ds-metrics">
        ${section.metrics
          .map(
            (m, i) => `<div class="ds-metric">
              <p class="ds-metric-value">${esc(m.value)}</p>
              <p class="ds-metric-label">${esc(m.label)}</p>
              ${figures.sparks[i] && isReading(m.value) ? `<div class="ds-metric-spark">${figures.sparks[i]}</div>` : ""}
              ${m.note ? `<p class="ds-metric-note">${esc(m.note)}</p>` : ""}
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

/** Wide frame only where a layout genuinely needs the extra column. */
function frame(section: SectionSpec): string {
  switch (section.layout) {
    case "nav":
    case "hero-split":
    case "hero-editorial":
    case "metric-band":
    case "feature-bento":
    case "feature-alternating":
    case "figure-explainer":
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
  const W = 620;
  const H = 340;
  const left = 56;
  const right = W - 24;
  const top = 32;
  const floor = H - 56;
  const span = Math.max(1, steps.length - 1);
  const points = steps.map((_, i) => ({
    x: left + (i / span) * (right - left),
    y: floor - (i / span) * (floor - top) * 0.86,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1]?.x.toFixed(1) ?? left} ${floor} L${points[0]?.x.toFixed(1) ?? left} ${floor} Z`;

  const grid = [0, 1, 2, 3]
    .map((g) => {
      const y = top + ((floor - top) / 3) * g;
      return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${right}" y2="${y.toFixed(1)}" stroke="var(--surface-border)" stroke-width="1"/>
        <text class="ds-fig-mono" x="${left - 12}" y="${(y + 4).toFixed(1)}" font-size="10" fill="var(--surface-quiet)" text-anchor="end">${100 - g * 30}</text>`;
    })
    .join("");

  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "5fr 7fr"))}">
      <div>${sectionHead(section)}
        <ol class="ds-figure-steps">${steps
          .map(
            (s, i) =>
              `<li data-step="${i}" class="${i === mid ? "is-active" : ""}">${esc(s.title)}${
                s.body ? ` — ${esc(s.body)}` : ""
              }</li>`,
          )
          .join("")}</ol>
      </div>
      <figure class="ds-figure" data-instrument="scrub">
        <div class="ds-figure-stage">
          <svg class="ds-fig" data-figure="scrub" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(section.title)}">
            ${grid}
            <path d="${area}" fill="var(--c-accent-surface)"/>
            <path d="${path}" fill="none" stroke="var(--c-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="${left}" y1="${top}" x2="${left}" y2="${floor}" stroke="var(--surface-border)" stroke-width="1"/>
            ${points
              .map(
                (p, i) =>
                  `<line class="ds-scrub-stem" data-step="${i}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${floor}" stroke="var(--surface-border)" stroke-width="1" opacity="${i === mid ? 1 : 0}"/>
                   <circle class="ds-scrub-node" data-step="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === mid ? 6 : 4}" fill="${i === mid ? "var(--surface-bg)" : "var(--c-accent)"}" stroke="var(--c-accent)" stroke-width="2" opacity="${i === mid ? 1 : 0.45}"/>
                   <text class="ds-fig-mono" x="${p.x.toFixed(1)}" y="${(floor + 20).toFixed(1)}" font-size="10" fill="var(--surface-quiet)" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text>`,
              )
              .join("")}
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
   * read as wireframes. Every row carries index, title, body, and a capability mark.
   */
  const count = section.blocks.length;
  return `<section class="ds-section ds-story" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta("Sequence", `${count} steps · product order`)}
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
 * Proof band — a filled board, not a lonely quote on black.
 *
 * The pullquote layout left a dark void with one paragraph of type: the exact toy look buyers
 * reject. This board packs declared capabilities (with marks), a short claim strip, and a drawn
 * figure into one inverse surface so every region of the band has matter.
 */
function renderProofBoard(section: SectionSpec, figures: FigurePlan): string {
  const cells = section.blocks.slice(0, 5);
  const board = cells.length
    ? `<ul class="ds-proof-board">${cells
        .map((b, i) => {
          const mark = figures.marks[i] ?? "";
          return `<li class="ds-proof-cell${b.emphasis === "lead" ? " is-lead" : ""}">
            ${mark ? `<div class="ds-proof-mark" aria-hidden="true">${mark}</div>` : ""}
            <p class="ds-proof-meta">${esc(b.meta ?? b.kicker ?? "")}</p>
            <h3>${esc(b.title)}</h3>
            ${b.body ? `<p>${esc(b.body)}</p>` : ""}
          </li>`;
        })
        .join("")}</ul>`
    : "";
  const figure = figures.body
    ? plate(figures.body, section.quoteAttribution ?? "Declared scope", "ds-proof-figure ds-plate-lit")
    : figures.field
      ? `<figure class="ds-proof-figure ds-proof-figure-field" aria-hidden="true">${figures.field}</figure>`
      : "";
  return `<section class="ds-section ds-proof" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${secMeta("Proof", `${cells.length} capabilities · declared scope`)}
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

function renderPlans(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
      <ul class="ds-plans">
        ${section.blocks
          .map(
            (b) => `<li class="ds-plan${b.emphasis === "lead" ? " ds-plan-recommended" : ""}" data-plan="${esc(b.title)}">
              ${b.emphasis === "lead" ? `<p class="ds-plan-flag">Recommended</p>` : ""}
              <h3>${esc(b.title)}</h3>
              <p class="ds-plan-meta">${esc(b.meta ?? "")}</p>
              <p class="ds-small">${esc(b.body)}</p>
              <ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
              ${b.emphasis === "lead" && section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
            </li>`,
          )
          .join("")}
      </ul>
    </div>
  </section>`;
}

function renderMatrix(section: SectionSpec): string {
  const lanes = ["Core", "Standard", "Full"];
  // Tier rather than prose in the trailing column. The matrix stopped carrying descriptions when
  // the editorial layer moved them to the catalogue, which left this table with an empty column
  // down its right edge.
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap">
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
function renderCtaBand(section: SectionSpec, figures: FigurePlan): string {
  return `<section class="ds-section ds-closing" data-surface="${section.surface}" data-section="${esc(section.id)}" id="cta">
    <div class="ds-wrap-wide ds-closing-grid">
      <div class="ds-cta">
        ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
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
function renderFooter(section: SectionSpec): string {
  const year = 2026;
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
              ${b.points.map((p) => `<a href="#top">${esc(p)}</a>`).join("")}
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
  return `<section class="ds-section ds-app-band" data-surface="${section.surface}" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
      <div class="ds-app">
        <div class="ds-app-top">
          <span class="ds-wordmark">${esc(section.brandLabel ?? spec.brief.productName)}</span>
          <span class="ds-app-crumbs">workspace / ${esc(section.title.toLowerCase())}</span>
          <span class="ds-pill ds-pill-signal" style="margin-left:auto">live</span>
        </div>
        <div class="ds-app-grid" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "260px 1fr"))}">
          <aside class="ds-app-side" aria-label="Workspace navigation">
            <p class="ds-eyebrow">Views</p>
            <ul class="ds-app-nav">
              ${section.aside
                .map(
                  (b, i) =>
                    `<li><a href="#${esc(section.id)}"${i === 0 ? ' aria-current="page"' : ""}>${esc(b.title)}</a></li>`,
                )
                .join("")}
            </ul>
            <p class="ds-eyebrow">Filters</p>
            <ul class="ds-app-nav">
              <li><a href="#${esc(section.id)}">Needs a human</a></li>
              <li><a href="#${esc(section.id)}">Assigned to me</a></li>
              <li><a href="#${esc(section.id)}">Resolved today</a></li>
            </ul>
          </aside>
          <div class="ds-app-main">
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
            <table class="ds-table">
              <thead><tr><th scope="col">Item</th><th scope="col">State</th><th scope="col">Detail</th><th scope="col" class="ds-num">Age</th></tr></thead>
              <tbody>
                ${rows
                  .map(
                    (b) => `<tr>
                      <th scope="row">${esc(b.title)}</th>
                      <td><span class="ds-pill${b.kicker === "Now" ? " ds-pill-signal" : ""}">${esc(b.kicker ?? "Queued")}</span></td>
                      <td>${esc(b.body)}</td>
                      <td class="ds-num">${esc(b.meta ?? "0")}m</td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="ds-empty">
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
      return wrapped(renderHero(section, spec, figures));
    case "metric-band":
      return wrapped(renderMetricBand(section, figures));
    case "specimen-band":
      return wrapped(renderSpecimen(section, figures));
    case "feature-bento":
    case "feature-index":
    case "feature-rows":
    case "feature-alternating":
      return wrapped(renderFeatures(section, spec, figures));
    case "figure-explainer":
      return wrapped(renderFigure(section));
    case "story-chapters":
      return wrapped(renderChapters(section, figures));
    case "pullquote":
    case "marquee-proof":
      return wrapped(renderProofBoard(section, figures));
    case "pricing-lanes":
      return wrapped(renderPlans(section));
    case "compare-matrix":
      return wrapped(renderMatrix(section));
    case "faq-columns":
      return wrapped(renderFaq(section));
    case "cta-band":
      return wrapped(renderCtaBand(section, figures));
    case "footer-columns":
      return renderFooter(section);
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
  if(!scrub) return;
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
      caption.textContent = active ? active.textContent : base;
    }
  }
  scrub.addEventListener('input', function(){ paint(scrub.value); });
  paint(scrub.value);
})();
</script>`;
}

/** Self-contained HTML document for iframe preview / static showcase. */
export function renderPreviewHtml(spec: DesignSpec): string {
  const fonts = spec.tokens.fontRequests.map((f) => `family=${f}`).join("&");
  const figures = figuresFor(spec);
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
<noscript><style>.ds-reveal{opacity:1!important;transform:none!important}</style></noscript>
<style>${renderCss(spec)}</style>
</head>
<body data-lean="${esc(spec.taste.aestheticLean)}" data-motion="${esc(spec.taste.motion)}" data-density="${esc(spec.taste.density)}" data-mood="${esc(spec.taste.colorMood)}" data-sitekind="${esc(spec.brief.siteKind)}">
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
