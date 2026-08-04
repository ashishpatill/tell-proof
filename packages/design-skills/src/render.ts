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

function sectionHead(section: SectionSpec, headingLevel: 2 | 3 = 2): string {
  const cls = headingLevel === 2 ? "ds-title" : "ds-heading";
  return `<div class="ds-section-head">
    ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
    <h${headingLevel} class="${cls}">${esc(section.title)}</h${headingLevel}>
    ${section.body ? `<p class="ds-lede">${esc(section.body)}</p>` : ""}
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

/** Structural stand-in for the product surface, drawn entirely from tokens. */
function productPanel(section: SectionSpec, title: string): string {
  const rows = section.aside.length ? section.aside : section.blocks;
  if (!rows.length) return "";
  return `<div class="ds-panel" aria-hidden="true">
    <div class="ds-panel-bar"><i class="ds-panel-dot"></i><i class="ds-panel-dot"></i><i class="ds-panel-dot"></i><span class="ds-panel-title">${esc(title)}</span></div>
    <div class="ds-panel-body">
      ${rows
        .slice(0, 4)
        .map((row, i) => {
          const width = row.meta ?? `${Math.max(28, 92 - i * 18)}%`;
          return `<div class="ds-panel-row"><span>${esc(row.title)}</span><b>${esc(width)}</b></div>
        <div class="ds-meter"><i style="width:${esc(width)}"></i></div>`;
        })
        .join("")}
    </div>
  </div>`;
}

function cardMarkup(b: Block, i: number, opts: { lead?: boolean; wide?: boolean } = {}): string {
  const cls = ["ds-card"];
  if (opts.lead && i === 0) cls.push("ds-card-lead", "ds-lead-card");
  else if (opts.wide && i === 1) cls.push("ds-card-wide");
  return `<article class="${cls.join(" ")}" data-feature="${esc(b.title)}">
    ${b.kicker ? `<p class="ds-eyebrow">${esc(b.kicker)}</p>` : ""}
    <h3>${esc(b.title)}</h3>
    ${b.body ? `<p>${esc(b.body)}</p>` : ""}
    ${b.points.length ? `<ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
  </article>`;
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
  const meta = section.blocks.length
    ? `<dl class="ds-hero-meta">${section.blocks
        .map((b) => `<div><dt>${esc(b.title)}</dt><dd>${esc((b.body || "").slice(0, 42) || "included")}</dd></div>`)
        .join("")}</dl>`
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
      <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(section.columns ?? "8fr 4fr")}">
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
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(section.columns ?? "7fr 5fr")}">
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

function renderFeatures(section: SectionSpec, spec: DesignSpec): string {
  const inner = (() => {
    if (section.layout === "feature-bento") {
      return `<div class="ds-bento">${section.blocks
        .map((b, i) => cardMarkup(b, i, { lead: true, wide: true }))
        .join("")}</div>`;
    }
    if (section.layout === "feature-index") {
      return `<div class="ds-index">${section.blocks
        .map(
          (b, i) => `<article class="ds-index-row" data-feature="${esc(b.title)}">
            <span class="ds-index-num">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</span>
            <h3>${esc(b.title)}</h3>
            <p>${esc(b.body)}</p>
          </article>`,
        )
        .join("")}</div>`;
    }
    if (section.layout === "feature-alternating") {
      return `<div class="ds-alt">${section.blocks
        .map(
          (b, i) => `<div class="ds-alt-row ds-split" style="grid-template-columns:${esc(
            i % 2 === 0 ? section.columns ?? "6fr 6fr" : (section.columns ?? "6fr 6fr").split(" ").reverse().join(" "),
          )}">
            <div class="ds-alt-copy">
              ${b.kicker ? `<p class="ds-eyebrow">${esc(b.kicker)}</p>` : ""}
              <h3>${esc(b.title)}</h3>
              <p class="ds-body">${esc(b.body)}</p>
              ${b.points.length ? `<ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
            </div>
            <div class="ds-alt-figure">${productPanel(
              { ...section, aside: section.blocks.slice(i, i + 3) } as SectionSpec,
              b.title.toLowerCase(),
            )}</div>
          </div>`,
        )
        .join("")}</div>`;
    }
    // feature-rows
    return `<div class="ds-index">${section.blocks
      .map(
        (b, i) => `<article class="ds-index-row" data-feature="${esc(b.title)}">
          <span class="ds-index-num">${esc(b.meta ?? String(i + 1).padStart(2, "0"))}</span>
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.body)}</p>
        </article>`,
      )
      .join("")}</div>`;
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
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
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
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(section.columns ?? "5fr 7fr")}">
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
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(section.columns ?? "4fr 8fr")}">
      <div>${sectionHead(section)}</div>
      <div class="ds-chapters">
        ${section.blocks
          .map(
            (b) => `<article class="ds-chapter">
              <p class="ds-chapter-index">${esc(b.meta ?? "")}</p>
              <h3>${esc(b.title)}</h3>
              <p class="ds-body">${esc(b.body)}</p>
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderQuote(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
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
      <div class="ds-plans">
        ${section.blocks
          .map(
            (b) => `<article class="ds-plan${b.emphasis === "lead" ? " ds-plan-recommended" : ""}" data-plan="${esc(b.title)}">
              ${b.emphasis === "lead" ? `<p class="ds-plan-flag">Recommended</p>` : ""}
              <h3>${esc(b.title)}</h3>
              <p class="ds-plan-meta">${esc(b.meta ?? "")}</p>
              <p class="ds-small">${esc(b.body)}</p>
              <ul class="ds-card-points">${b.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
              ${b.emphasis === "lead" && section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderMatrix(section: SectionSpec): string {
  const lanes = ["Core", "Standard", "Full"];
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
      <table class="ds-matrix">
        <caption>${esc(section.body)}</caption>
        <thead><tr><th scope="col">Capability</th>${lanes.map((l) => `<th scope="col">${esc(l)}</th>`).join("")}<th scope="col">Notes</th></tr></thead>
        <tbody>
          ${section.blocks
            .map((b, i) => {
              const inCore = i < Math.ceil(section.blocks.length / 3);
              const inStandard = i < Math.ceil((section.blocks.length * 2) / 3);
              const mark = (on: boolean) =>
                on ? `<td class="ds-yes">included</td>` : `<td class="ds-no">—</td>`;
              return `<tr><th scope="row">${esc(b.title)}</th>${mark(inCore)}${mark(inStandard)}${mark(true)}<td>${esc(b.body)}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  </section>`;
}

function renderFaq(section: SectionSpec): string {
  return `<section class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide ds-split" style="grid-template-columns:${esc(section.columns ?? "5fr 7fr")}">
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
    <div class="ds-wrap-wide ds-cta">
      ${section.eyebrow ? `<p class="ds-eyebrow">${esc(section.eyebrow)}</p>` : ""}
      <h2 class="ds-title">${esc(section.title)}</h2>
      <p class="ds-lede">${esc(section.body)}</p>
      ${actions(section, "band")}
    </div>
  </section>`;
}

function renderFooter(section: SectionSpec): string {
  const year = 2026;
  return `<footer class="ds-footer" data-surface="${section.surface}" data-section="${esc(section.id)}">
    <div class="ds-wrap-wide">
      <div class="ds-footer-grid">
        <div class="ds-footer-col">
          <p class="ds-wordmark">${esc(section.brandLabel ?? section.title)}</p>
          <p class="ds-caption">${esc(section.body)}</p>
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
        <span>Designed against measured craft corridors, not a template</span>
      </div>
    </div>
  </footer>`;
}

function renderAppShell(section: SectionSpec, spec: DesignSpec): string {
  const rows = section.blocks;
  return `<section id="top" class="ds-section" data-surface="${section.surface}" data-section="${esc(section.id)}" id="${esc(section.id)}">
    <div class="ds-wrap-wide">
      ${sectionHead(section)}
      <div class="ds-app">
        <div class="ds-app-top">
          <span class="ds-wordmark">${esc(section.brandLabel ?? spec.brief.productName)}</span>
          <span class="ds-app-crumbs">workspace / ${esc(section.title.toLowerCase())}</span>
          <span class="ds-pill ds-pill-signal" style="margin-left:auto">live</span>
        </div>
        <div class="ds-app-grid" style="grid-template-columns:${esc(section.columns ?? "260px 1fr")}">
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
