/**
 * Rendering — one function per layout variant.
 *
 * The renderer never invents visual values; it composes token-driven classes. That constraint is
 * what keeps the emitted page consistent with the design system it declares, and it is what makes
 * the generated markup safe to hand to a developer as a starting point.
 */
import { renderCss } from "./css";
import type { Block, DesignSpec, SectionSpec } from "./types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function reveal(spec: DesignSpec, index: number): string {
  if (spec.taste.motion !== "light-scroll-reveals") return "";
  return ` ds-reveal" style="transition-delay:${Math.min(index, 5) * 60}ms`;
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
 * Structural stand-in for the product surface, drawn entirely from tokens.
 *
 * Rows carry a label and whatever short metadata the section supplied. Only the first row gets a
 * meter: a stack of four full-width accent bars is a bar chart of nothing, and it was the loudest
 * placeholder signal in the generated pages. One measured row reads as an interface; four read as
 * a wireframe someone forgot to replace.
 */
function productPanel(section: SectionSpec, title: string): string {
  const rows = section.aside.length ? section.aside : section.blocks;
  if (!rows.length) return "";
  return `<div class="ds-panel" aria-hidden="true">
    <div class="ds-panel-bar"><i class="ds-panel-dot"></i><i class="ds-panel-dot"></i><i class="ds-panel-dot"></i><span class="ds-panel-title">${esc(title)}</span></div>
    <div class="ds-panel-body">
      ${rows
        .slice(0, 5)
        .map((row, i) => {
          const meta = row.meta ?? "";
          const meter = i === 0 ? `<div class="ds-meter"><i style="width:72%"></i></div>` : "";
          return `<div class="ds-panel-row"><span>${esc(row.title)}</span>${
            meta ? `<b>${esc(meta)}</b>` : ""
          }</div>${meter}`;
        })
        .join("")}
    </div>
  </div>`;
}

function cardMarkup(b: Block, i: number, opts: { lead?: boolean; wide?: boolean } = {}): string {
  const cls = ["ds-card"];
  // Emphasis, not position. The accent wash used to land on whichever capability happened to be
  // first in a section, so a trailing "also included" grid opened with a tinted card promoting its
  // least important item.
  if (opts.lead && b.emphasis === "lead") cls.push("ds-card-lead", "ds-lead-card");
  else if (opts.wide && i === 1) cls.push("ds-card-wide");
  return `<li class="${cls.join(" ")}" data-feature="${esc(b.title)}">
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

function renderHero(section: SectionSpec, spec: DesignSpec): string {
  /*
   * A tracked list of the core capability names, on a hairline. Previously a definition list whose
   * values were `body.slice(0, 42)` — which put a sentence cut mid-word inside a monospace box at
   * the top of every page the engine produced. Nothing here needs a description; the fold names
   * the parts, and the catalogue explains them.
   */
  const meta = section.blocks.length
    ? `<ul class="ds-hero-facts">${section.blocks.map((b) => `<li>${esc(b.title)}</li>`).join("")}</ul>`
    : "";

  const copy = `<div class="ds-hero-copy">
    ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
    <h1 class="ds-display">${esc(section.title)}</h1>
    <p class="ds-lede">${esc(section.body)}</p>
    ${actions(section)}
    ${meta}
  </div>`;

  if (section.layout === "hero-statement") {
    return `<section id="top" class="ds-section ds-hero" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-wrap">${copy}</div>
    </section>`;
  }

  if (section.layout === "hero-editorial") {
    return `<section id="top" class="ds-section ds-hero" data-surface="${section.surface}" data-section="${esc(section.id)}">
      <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "8fr 4fr"))}">
        ${copy}
        <aside class="ds-hero-aside">
          <p class="ds-eyebrow">In this page</p>
          <ol class="ds-figure-steps">${section.aside
            .map((b, i) => `<li${i === 0 ? ' class="is-active"' : ""}>${esc(b.title)}</li>`)
            .join("")}</ol>
        </aside>
      </div>
    </section>`;
  }

  return `<section id="top" class="ds-section ds-hero" data-surface="${section.surface}" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "7fr 5fr"))}">
      ${copy}
      ${productPanel(section, spec.brief.productName.toLowerCase())}
    </div>
  </section>`;
}

function renderMetricBand(section: SectionSpec): string {
  return `<section class="ds-section ds-section-tight" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section, 2)}
      <div class="ds-metrics">
        ${section.metrics
          .map(
            (m) => `<div class="ds-metric">
              <p class="ds-metric-value">${esc(m.value)}</p>
              <p class="ds-metric-label">${esc(m.label)}</p>
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

function renderFeatures(section: SectionSpec, spec: DesignSpec): string {
  const inner = (() => {
    if (section.layout === "feature-bento") {
      return `<ul class="ds-bento">${section.blocks
        .map((b, i) => cardMarkup(b, i, { lead: true, wide: true }))
        .join("")}</ul>`;
    }
    if (section.layout === "feature-index") {
      return `<ol class="ds-index">${section.blocks
        .map(
          (b, i) => `<li class="ds-index-row" data-feature="${esc(b.title)}">
            <span class="ds-index-num">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</span>
            <h3>${esc(b.title)}</h3>
            <p>${esc(b.body)}</p>
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
              <div class="ds-alt-figure">${productPanel(section, b.title.toLowerCase())}</div>
            </div>`;
          }
          return `<div class="ds-alt-row ds-alt-pair">
            <div class="ds-alt-name">
              <h3>${esc(b.title)}</h3>
              ${b.kicker ? `<p class="ds-alt-tier">${esc(b.kicker)}</p>` : ""}
            </div>
            <div class="ds-alt-detail">
              ${b.body ? `<p class="ds-body">${esc(b.body)}</p>` : ""}
              ${b.points.length ? `<ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
            </div>
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
          <p>${esc(b.body)}</p>
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

  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="${frame(section)}">
      ${sectionHead(section, 2, frame(section) === "ds-wrap-wide")}
      ${inner}
      ${rail}
    </div>
  </section>`;
}

function renderFigure(section: SectionSpec): string {
  const steps = section.blocks.slice(0, 4);
  const mid = Math.max(0, Math.floor((steps.length - 1) / 2));
  const max = Math.max(steps.length - 1, 0);
  const points = steps.map((_, i) => ({ x: 48 + i * (264 / Math.max(1, steps.length - 1)), y: 118 - i * (72 / Math.max(1, steps.length - 1)) }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "5fr 7fr"))}">
      <div>${sectionHead(section)}
        <ol class="ds-figure-steps">${steps
          .map((s, i) => `<li data-step="${i}" class="${i === mid ? "is-active" : ""}">${esc(s.title)} — ${esc(s.body)}</li>`)
          .join("")}</ol>
      </div>
      <figure class="ds-figure" data-instrument="scrub">
        <div class="ds-figure-stage">
          <svg viewBox="0 0 360 160" role="img" aria-label="${esc(section.title)}">
            <line x1="24" y1="140" x2="336" y2="140" stroke="var(--surface-border)" stroke-width="1"/>
            <line x1="24" y1="20" x2="24" y2="140" stroke="var(--surface-border)" stroke-width="1"/>
            <path d="${path}" fill="none" stroke="var(--c-accent)" stroke-width="2" stroke-linecap="round"/>
            ${points
              .map(
                (p, i) =>
                  `<circle class="ds-scrub-node" data-step="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === mid ? 7 : 4}" fill="var(--c-accent)" opacity="${i === mid ? 1 : 0.4}"/>`,
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

function renderChapters(section: SectionSpec): string {
  // The wide frame here is not decoration: the narrow track carries the section introduction, and
  // inside the standard container it cannot hold a readable measure at these ratios.
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "4fr 8fr", "22rem"))}">
      <div>${sectionHead(section)}</div>
      <ol class="ds-chapters">
        ${section.blocks
          .map(
            (b) => `<li class="ds-chapter">
              <p class="ds-chapter-index">${esc(b.meta ?? "")}</p>
              <h3>${esc(b.title)}</h3>
              <p class="ds-body">${esc(b.body)}</p>
            </li>`,
          )
          .join("")}
      </ol>
    </div>
  </section>`;
}

function renderQuote(section: SectionSpec): string {
  return `<section class="ds-section ds-statement" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap">
      ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
      <blockquote class="ds-quote">${esc(section.quote ?? section.title)}</blockquote>
      <p class="ds-quote-attribution">${esc(section.quoteAttribution ?? "")}</p>
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

function renderFaq(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap ds-split" style="grid-template-columns:${esc(splitTemplate(section.columns ?? "5fr 7fr", "18rem"))}">
      <div>${sectionHead(section)}</div>
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

function renderCtaBand(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="cta">
    <div class="ds-wrap ds-cta">
      ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
      <h2 class="ds-title">${esc(section.title)}</h2>
      <p class="ds-lede">${esc(section.body)}</p>
      ${actions(section, "band")}
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

function renderAppShell(section: SectionSpec, spec: DesignSpec): string {
  const rows = section.blocks;
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}">
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
                .map((m) => `<div class="ds-stat"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`)
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

function renderSection(section: SectionSpec, index: number, spec: DesignSpec): string {
  const wrapped = (html: string): string => {
    if (spec.taste.motion !== "light-scroll-reveals" || section.layout === "nav") return html;
    return html.replace(/^<(section|footer)\s+class="/, (m, tag) => `<${tag} class="${reveal(spec, index).trim()} `);
  };

  switch (section.layout) {
    case "nav":
      return renderNav(section);
    case "hero-editorial":
    case "hero-split":
    case "hero-statement":
      return wrapped(renderHero(section, spec));
    case "metric-band":
      return wrapped(renderMetricBand(section));
    case "feature-bento":
    case "feature-index":
    case "feature-rows":
    case "feature-alternating":
      return wrapped(renderFeatures(section, spec));
    case "figure-explainer":
      return wrapped(renderFigure(section));
    case "story-chapters":
      return wrapped(renderChapters(section));
    case "pullquote":
      return wrapped(renderQuote(section));
    case "pricing-lanes":
      return wrapped(renderPlans(section));
    case "compare-matrix":
      return wrapped(renderMatrix(section));
    case "faq-columns":
      return wrapped(renderFaq(section));
    case "cta-band":
      return wrapped(renderCtaBand(section));
    case "footer-columns":
      return renderFooter(section);
    case "app-shell":
      return wrapped(renderAppShell(section, spec));
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
  var steps=[].slice.call(document.querySelectorAll('.ds-figure-steps [data-step]'));
  var caption=document.querySelector('[data-scrub-caption]');
  var base=caption?caption.textContent:'';
  function paint(v){
    var idx=Number(v)||0;
    nodes.forEach(function(n){
      var active=Number(n.getAttribute('data-step'))===idx;
      n.setAttribute('r', active ? '7' : '4');
      n.setAttribute('opacity', active ? '1' : '0.4');
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
<body data-lean="${esc(spec.taste.aestheticLean)}" data-motion="${esc(spec.taste.motion)}" data-density="${esc(spec.taste.density)}" data-sitekind="${esc(spec.brief.siteKind)}">
<a class="ds-skip" href="#main">Skip to content</a>
<p class="ds-sr">${esc(spec.summary)}</p>
${spec.sections
  .filter((s) => s.layout === "nav")
  .map((s, i) => renderSection(s, i, spec))
  .join("\n")}
<main id="main">
${spec.sections
  .filter((s) => s.layout !== "nav" && s.layout !== "footer-columns")
  .map((s, i) => renderSection(s, i, spec))
  .join("\n")}
</main>
${spec.sections
  .filter((s) => s.layout === "footer-columns")
  .map((s, i) => renderSection(s, i, spec))
  .join("\n")}
${scripts(spec)}
</body>
</html>`;
}
