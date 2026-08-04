import type { AestheticLean, DesignSpec, DesignTokens, SectionSpec, TypeWeight } from "./types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cssVars(t: DesignTokens, typeWeight: TypeWeight): string {
  const displayWeight = typeWeight === "bold-confident" ? "700" : typeWeight === "light-elegant" ? "500" : "600";
  const tracking = typeWeight === "bold-confident" ? "-0.03em" : typeWeight === "light-elegant" ? "-0.015em" : "-0.02em";
  return [
    `--ds-paper:${t.paper}`,
    `--ds-paper-alt:${t.paperAlt}`,
    `--ds-ink:${t.ink}`,
    `--ds-ink-muted:${t.inkMuted}`,
    `--ds-accent:${t.accent}`,
    `--ds-accent-ink:${t.accentInk}`,
    `--ds-border:${t.border}`,
    `--ds-radius:${t.radius}`,
    `--ds-shadow:${t.shadow}`,
    `--ds-font-display:"${t.fontDisplay}", ui-serif, Georgia, serif`,
    `--ds-font-body:"${t.fontBody}", ui-sans-serif, system-ui, sans-serif`,
    `--ds-content-max:${t.contentMax}`,
    `--ds-section-y:${t.sectionY}`,
    `--ds-display-weight:${displayWeight}`,
    `--ds-display-tracking:${tracking}`,
  ].join(";");
}

function motionCss(motion: DesignSpec["taste"]["motion"]): string {
  if (motion === "none") {
    return `*{animation:none!important;transition:none!important}`;
  }
  if (motion === "light-scroll-reveals") {
    return `
      @media (prefers-reduced-motion: no-preference) {
        .ds-reveal{opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s ease}
        .ds-reveal.is-in{opacity:1;transform:none}
      }
      @media (prefers-reduced-motion: reduce){.ds-reveal{opacity:1;transform:none}}
    `;
  }
  return `
    .ds-btn{transition:background-color .15s ease,color .15s ease,border-color .15s ease,transform .15s ease}
    .ds-btn:hover{transform:translateY(-1px)}
    .ds-row,.ds-card{transition:border-color .15s ease}
    @media (prefers-reduced-motion: reduce){.ds-btn,.ds-row,.ds-card{transition:none;transform:none}}
  `;
}

function leanCss(lean: AestheticLean): string {
  if (lean === "minimal-clean") {
    return `
      body[data-aesthetic="minimal-clean"] .ds-card{background:transparent;border:none;border-bottom:1px solid var(--ds-border);border-radius:0;box-shadow:none;padding:1rem 0}
      body[data-aesthetic="minimal-clean"] .ds-grid{gap:0;grid-template-columns:1fr}
      body[data-aesthetic="minimal-clean"] .ds-hero-visual{display:none}
      body[data-aesthetic="minimal-clean"] .ds-cta-panel{background:transparent;border-left:2px solid var(--ds-accent);border-radius:0}
    `;
  }
  if (lean === "conversion-sharp") {
    return `
      body[data-aesthetic="conversion-sharp"] .ds-hero{padding-bottom:calc(var(--ds-section-y) + 1rem)}
      body[data-aesthetic="conversion-sharp"] .ds-feature-lead{border-color:color-mix(in srgb,var(--ds-accent) 50%,var(--ds-border));box-shadow:var(--ds-shadow)}
      body[data-aesthetic="conversion-sharp"] .ds-actions .ds-btn-primary{min-width:10rem}
    `;
  }
  if (lean === "refined-story") {
    return `
      body[data-aesthetic="refined-story"] .ds-wrap{max-width:min(100% - 2.5rem, var(--ds-content-max))}
      body[data-aesthetic="refined-story"] .ds-chapter{border-top:1px solid var(--ds-border);padding:1.5rem 0}
      body[data-aesthetic="refined-story"] .ds-chapter-num{font-family:var(--ds-font-display);font-size:2rem;color:var(--ds-ink-muted);margin:0 0 .35rem}
      body[data-aesthetic="refined-story"] .ds-grid{grid-template-columns:1fr;gap:0}
      body[data-aesthetic="refined-story"] .ds-card{background:transparent;border:none;border-top:1px solid var(--ds-border);border-radius:0;box-shadow:none;padding:1.25rem 0}
    `;
  }
  return `
    body[data-aesthetic="system-crafted"] .ds-token-strip{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0 0}
    body[data-aesthetic="system-crafted"] .ds-token-chip{font-size:.75rem;padding:.35rem .55rem;border:1px solid var(--ds-border);border-radius:999px;color:var(--ds-ink-muted)}
    body[data-aesthetic="system-crafted"] .ds-card{border-radius:calc(var(--ds-radius) + 2px)}
  `;
}

function atmosphereCss(): string {
  return `
body{
  background:
    radial-gradient(900px 480px at 12% -8%, color-mix(in srgb, var(--ds-accent) 14%, transparent), transparent 60%),
    radial-gradient(700px 420px at 92% 8%, color-mix(in srgb, var(--ds-ink) 6%, transparent), transparent 55%),
    linear-gradient(180deg, var(--ds-paper) 0%, var(--ds-paper-alt) 48%, var(--ds-paper) 100%);
  background-attachment: fixed;
}
body::before{
  content:"";
  pointer-events:none;
  position:fixed;inset:0;z-index:0;opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
body > *{position:relative;z-index:1}
`;
}

function featureBlocks(items: string[], lean: AestheticLean): string {
  if (lean === "minimal-clean" || lean === "refined-story") {
    return `<div class="ds-stack" data-layout="${esc(lean)}">${items
      .map((item, i) => {
        const [name, ...rest] = item.split(" — ");
        return `<article class="ds-row${i === 0 ? " ds-feature-lead" : ""}" data-feature="${esc(name ?? item)}">
          <h3>${esc(name ?? item)}</h3>
          <p>${esc(rest.join(" — "))}</p>
        </article>`;
      })
      .join("")}</div>`;
  }
  return `<div class="ds-grid" data-layout="${esc(lean)}">${items
    .map((item, i) => {
      const [name, ...rest] = item.split(" — ");
      return `<article class="ds-card${i === 0 ? " ds-feature-lead" : ""}" data-feature="${esc(name ?? item)}">
        <h3>${esc(name ?? item)}</h3>
        <p>${esc(rest.join(" — "))}</p>
      </article>`;
    })
    .join("")}</div>`;
}

function heroVisual(items: string[]): string {
  const labels = items.slice(0, 3);
  if (!labels.length) return "";
  return `<aside class="ds-hero-visual" aria-hidden="true">
    <div class="ds-visual-panel">
      ${labels
        .map(
          (label, i) =>
            `<div class="ds-visual-row" style="--i:${i}"><span>${esc(label)}</span><i style="width:${72 - i * 14}%"></i></div>`,
        )
        .join("")}
    </div>
  </aside>`;
}

function figureInstrument(section: SectionSpec): string {
  const steps = section.items.slice(0, 4);
  const mid = Math.max(0, Math.floor((steps.length - 1) / 2));
  const max = Math.max(steps.length - 1, 0);
  return `<figure class="ds-figure" data-instrument="scrub">
    <div class="ds-figure-stage">
      <svg viewBox="0 0 360 160" role="img" aria-label="${esc(section.title)}">
        <rect x="8" y="24" width="344" height="112" rx="10" fill="var(--ds-paper-alt)" stroke="var(--ds-border)"/>
        <path d="M40 110 C90 40, 140 40, 180 80 S260 140, 320 70" fill="none" stroke="var(--ds-accent)" stroke-width="3"/>
        ${steps
          .map((_, i) => {
            const x = 60 + i * 70;
            const y = 50 + ((i * 23) % 50);
            return `<circle class="ds-scrub-node" data-step="${i}" cx="${x}" cy="${y}" r="${i === mid ? 8 : 5}" fill="var(--ds-accent)" opacity="${i === mid ? 1 : 0.45}"/>`;
          })
          .join("")}
      </svg>
      <label class="ds-scrub">
        <span class="ds-meta">Scrub mechanism</span>
        <input type="range" min="0" max="${max}" value="${mid}" data-scrub aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${mid}" />
      </label>
    </div>
    <figcaption data-scrub-caption>${esc(section.figureCaption || section.title)}</figcaption>
    <ol class="ds-list ds-figure-steps">${steps
      .map((s, i) => `<li data-step="${i}" class="${i === mid ? "is-active" : ""}">${esc(s)}</li>`)
      .join("")}</ol>
  </figure>`;
}

function previewScripts(motion: DesignSpec["taste"]["motion"]): string {
  const reveal =
    motion === "light-scroll-reveals"
      ? `var nodes=[].slice.call(document.querySelectorAll('.ds-reveal'));
  if(nodes.length){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){
      nodes.forEach(function(n){n.classList.add('is-in')});
    } else {
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);} });
      },{threshold:0.12,rootMargin:'0px 0px -8% 0px'});
      nodes.forEach(function(n){io.observe(n)});
    }
  }`
      : "";

  return `<script>
(function(){
  ${reveal}
  var scrub=document.querySelector('[data-scrub]');
  if(!scrub) return;
  var nodes=[].slice.call(document.querySelectorAll('.ds-scrub-node'));
  var steps=[].slice.call(document.querySelectorAll('.ds-figure-steps [data-step]'));
  var caption=document.querySelector('[data-scrub-caption]');
  function paint(v){
    var idx=Number(v)||0;
    scrub.setAttribute('aria-valuenow', String(idx));
    nodes.forEach(function(n){
      var active=Number(n.getAttribute('data-step'))===idx;
      n.setAttribute('r', active ? '8' : '5');
      n.setAttribute('opacity', active ? '1' : '0.45');
    });
    steps.forEach(function(li){
      var active=Number(li.getAttribute('data-step'))===idx;
      li.classList.toggle('is-active', active);
      if(active && caption){ caption.textContent = li.textContent || caption.textContent; }
    });
  }
  scrub.addEventListener('input', function(){ paint(scrub.value); });
  paint(scrub.value);
})();
</script>`;
}

function homeHref(siteKind: DesignSpec["brief"]["siteKind"]): string {
  return siteKind === "dashboard-webapp" ? "#workspace" : "#product";
}

function renderSection(section: SectionSpec, index: number, spec: DesignSpec): string {
  const lean = spec.taste.aestheticLean;
  const reveal = `ds-reveal`;
  const delay = `style="transition-delay:${Math.min(index, 6) * 40}ms"`;
  const brand = section.brandLabel || spec.brief.productName;
  const home = homeHref(spec.brief.siteKind);

  if (section.kind === "nav") {
    const quiet = !section.ctaLabel;
    return `<header class="ds-nav${quiet ? " ds-nav-quiet" : ""}" data-section="${esc(section.id)}">
      <div class="ds-wrap ds-nav-inner">
        <a class="ds-brand" href="${home}">${esc(section.title)}</a>
        <nav aria-label="Primary">${section.items
          .map((item) => {
            const key = item.toLowerCase();
            const href =
              key === "pricing"
                ? "#pricing"
                : key === "features" || key === "capabilities"
                  ? "#features"
                  : key === "chapters" || key === "story"
                    ? "#story"
                    : key === "mechanism"
                      ? "#figure"
                      : key === "workspace" || key === "queue" || key === "settings"
                        ? "#workspace"
                        : home;
            return `<a href="${href}">${esc(item)}</a>`;
          })
          .join("")}</nav>
        ${section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
      </div>
    </header>`;
  }

  if (section.kind === "hero") {
    return `<section class="ds-hero ${reveal}" ${delay} data-section="${esc(section.id)}" id="product">
      <div class="ds-wrap ds-hero-grid">
        <div class="ds-hero-copy">
          <p class="ds-brand-mark">${esc(brand)}</p>
          <h1>${esc(section.title)}</h1>
          <p class="ds-lede">${esc(section.body)}</p>
          ${section.asideItems?.[0] ? `<p class="ds-meta">${esc(section.asideItems[0])}</p>` : ""}
          <div class="ds-actions">
            ${section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
            <a class="ds-btn ds-btn-quiet" href="#features">See capabilities</a>
          </div>
        </div>
        ${lean === "minimal-clean" ? "" : heroVisual(section.items)}
      </div>
    </section>`;
  }

  if (section.kind === "figure") {
    return `<section class="ds-section ${reveal}" ${delay} data-section="${esc(section.id)}" id="figure">
      <div class="ds-wrap">
        <p class="ds-eyebrow">Mechanism</p>
        <h2>${esc(section.title)}</h2>
        <p class="ds-lede">${esc(section.body)}</p>
        ${figureInstrument(section)}
      </div>
    </section>`;
  }

  if (section.kind === "features") {
    return `<section class="ds-section ${reveal}" ${delay} data-section="${esc(section.id)}" id="features">
      <div class="ds-wrap">
        <h2>${esc(section.title)}</h2>
        <p class="ds-lede">${esc(section.body)}</p>
        ${
          lean === "system-crafted"
            ? `<div class="ds-token-strip" aria-hidden="true">
                <span class="ds-token-chip">accent</span><span class="ds-token-chip">radius ${esc(spec.tokens.radius)}</span>
                <span class="ds-token-chip">${esc(spec.taste.density)}</span><span class="ds-token-chip">${esc(spec.taste.motion)}</span>
              </div>`
            : ""
        }
        ${featureBlocks(section.items, lean)}
      </div>
    </section>`;
  }

  if (section.kind === "pricing") {
    return `<section class="ds-section ${reveal}" ${delay} data-section="${esc(section.id)}" id="pricing">
      <div class="ds-wrap">
        <h2>${esc(section.title)}</h2>
        <p class="ds-lede">${esc(section.body)}</p>
        <div class="ds-grid ds-pricing">${section.items
          .map((item) => {
            const recommended = /recommended/i.test(item);
            const [name, ...rest] = item.split(" — ");
            return `<article class="ds-card${recommended ? " ds-card-accent" : ""}" data-plan="${esc(name ?? item)}">
              <h3>${esc(name ?? item)}</h3>
              <p>${esc(rest.join(" — "))}</p>
              ${recommended && section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="#cta">${esc(section.ctaLabel)}</a>` : ""}
            </article>`;
          })
          .join("")}</div>
      </div>
    </section>`;
  }

  if (section.kind === "dashboard-shell" || section.kind === "dashboard-main") {
    const aside = section.asideItems?.length ? section.asideItems : section.kind === "dashboard-shell" ? section.items : [];
    const mainItems =
      section.kind === "dashboard-shell" && section.asideItems?.length
        ? section.items
        : section.kind === "dashboard-main"
          ? section.items
          : section.items.slice(1);
    return `<section class="ds-section ds-dash ${reveal}" ${delay} data-section="${esc(section.id)}" id="workspace">
      <div class="ds-wrap ds-dash-grid">
        <aside class="ds-side" aria-label="Workspace">
          <p class="ds-brand-mark">${esc(brand)}</p>
          <p class="ds-eyebrow">Workspace</p>
          <ul>${aside.map((item) => `<li><a href="#workspace">${esc(item)}</a></li>`).join("")}</ul>
        </aside>
        <div class="ds-main">
          <h2>${esc(section.title)}</h2>
          <p class="ds-lede">${esc(section.body)}</p>
          <div class="ds-stack">${mainItems
            .map((item) => {
              const [name, ...rest] = item.split(" — ");
              return `<article class="ds-row" data-feature="${esc(name ?? item)}"><h3>${esc(name ?? item)}</h3><p>${esc(rest.join(" — ") || item)}</p></article>`;
            })
            .join("")}</div>
        </div>
      </div>
    </section>`;
  }

  if (section.kind === "story") {
    return `<section class="ds-section ${reveal}" ${delay} data-section="${esc(section.id)}" id="story">
      <div class="ds-wrap">
        <h2>${esc(section.title)}</h2>
        <p class="ds-lede">${esc(section.body)}</p>
        <div class="ds-chapters">${section.items
          .map((item, i) => {
            const [head, ...rest] = item.split(" — ");
            return `<article class="ds-chapter">
              <p class="ds-chapter-num">${String(i + 1).padStart(2, "0")}</p>
              <h3>${esc(head ?? item)}</h3>
              <p>${esc(rest.join(" — "))}</p>
            </article>`;
          })
          .join("")}</div>
      </div>
    </section>`;
  }

  if (section.kind === "cta") {
    return `<section class="ds-section ds-cta ${reveal}" ${delay} data-section="${esc(section.id)}" id="cta">
      <div class="ds-wrap ds-cta-panel">
        <h2>${esc(section.title)}</h2>
        <p class="ds-lede">${esc(section.body)}</p>
        ${section.ctaLabel ? `<a class="ds-btn ds-btn-primary" href="${home}">${esc(section.ctaLabel)}</a>` : ""}
      </div>
    </section>`;
  }

  if (section.kind === "footer") {
    return `<footer class="ds-footer" data-section="${esc(section.id)}">
      <div class="ds-wrap ds-footer-inner">
        <strong>${esc(section.title)}</strong>
        <nav>${section.items.map((item) => `<a href="${home}">${esc(item)}</a>`).join("")}</nav>
      </div>
    </footer>`;
  }

  // proof / default
  return `<section class="ds-section ${reveal}" ${delay} data-section="${esc(section.id)}" id="${esc(section.kind)}">
    <div class="ds-wrap">
      <h2>${esc(section.title)}</h2>
      <p class="ds-lede">${esc(section.body)}</p>
      <ul class="ds-list">${section.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </div>
  </section>`;
}

/** Self-contained HTML document for iframe preview / static showcase. */
export function renderPreviewHtml(spec: DesignSpec): string {
  const { tokens: t, taste, sections, brief, summary } = spec;
  const googleFonts = [t.fontDisplay, t.fontBody]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(brief.productName)} — preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${googleFonts}&display=swap"/>
<noscript><style>.ds-reveal{opacity:1!important;transform:none!important}</style></noscript>
<style>
:root{${cssVars(t, taste.typographyWeight)}}
*{box-sizing:border-box}
html,body{margin:0;padding:0;color:var(--ds-ink);font-family:var(--ds-font-body);line-height:1.55;-webkit-font-smoothing:antialiased}
${atmosphereCss()}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible,input:focus-visible,.ds-btn:focus-visible{
  outline:2px solid var(--ds-accent);outline-offset:3px
}
.ds-figure-steps .is-active{color:var(--ds-ink);font-weight:600}
noscript .ds-reveal{opacity:1!important;transform:none!important}
h1,h2,h3{font-family:var(--ds-font-display);line-height:1.12;letter-spacing:var(--ds-display-tracking);margin:0 0 .6rem;font-weight:var(--ds-display-weight)}
h1{font-size:clamp(2.4rem,5vw,3.75rem)}
h2{font-size:clamp(1.65rem,2.8vw,2.35rem)}
h3{font-size:1.08rem}
p{margin:0 0 1rem;color:var(--ds-ink-muted)}
.ds-wrap{width:min(100% - 2.5rem,var(--ds-content-max));margin-inline:auto}
.ds-nav{border-bottom:1px solid var(--ds-border);background:color-mix(in srgb,var(--ds-paper) 88%,transparent);position:sticky;top:0;z-index:10;backdrop-filter:blur(10px)}
.ds-nav-quiet{position:static;backdrop-filter:none}
.ds-nav-inner{display:flex;align-items:center;gap:1.25rem;min-height:3.75rem}
.ds-brand,.ds-brand-mark{font-weight:700;letter-spacing:-0.03em;font-family:var(--ds-font-display);font-size:clamp(1.35rem,2vw,1.7rem)}
.ds-brand-mark{display:block;margin:0 0 .85rem;color:var(--ds-ink)}
.ds-nav nav{display:flex;gap:1rem;flex:1;flex-wrap:wrap;font-size:.95rem;color:var(--ds-ink-muted)}
.ds-nav nav a:hover{color:var(--ds-ink)}
.ds-hero,.ds-section{padding:var(--ds-section-y) 0}
.ds-hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(1.5rem,4vw,3rem);align-items:center}
.ds-hero-visual{min-height:220px}
.ds-visual-panel{border:1px solid var(--ds-border);border-radius:calc(var(--ds-radius) + 6px);padding:1.25rem;background:color-mix(in srgb,var(--ds-paper-alt) 88%, var(--ds-accent) 6%);box-shadow:var(--ds-shadow);display:grid;gap:.85rem}
.ds-visual-row{display:grid;gap:.35rem}
.ds-visual-row span{font-size:.85rem;color:var(--ds-ink)}
.ds-visual-row i{display:block;height:8px;border-radius:999px;background:linear-gradient(90deg,var(--ds-accent),color-mix(in srgb,var(--ds-accent) 30%, transparent))}
.ds-eyebrow{font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ds-ink-muted);margin-bottom:.75rem}
.ds-lede{font-size:1.08rem;max-width:40rem}
.ds-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.5rem}
.ds-btn{display:inline-flex;align-items:center;justify-content:center;padding:.75rem 1.15rem;border-radius:var(--ds-radius);border:1px solid var(--ds-border);font-weight:600;font-size:.95rem;min-height:44px}
.ds-btn-primary{background:var(--ds-accent);color:var(--ds-accent-ink);border-color:transparent}
.ds-btn-primary:hover{filter:brightness(1.05)}
.ds-btn-quiet{background:transparent}
.ds-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1.5rem}
.ds-stack{display:grid;gap:0;margin-top:1.25rem}
.ds-row{border-top:1px solid var(--ds-border);padding:1.1rem 0}
.ds-card{background:var(--ds-paper-alt);border:1px solid var(--ds-border);border-radius:var(--ds-radius);padding:1.15rem 1.2rem;box-shadow:var(--ds-shadow)}
.ds-card-accent{border-color:color-mix(in srgb,var(--ds-accent) 55%,var(--ds-border))}
.ds-list{margin:1rem 0 0;padding-left:1.2rem;color:var(--ds-ink-muted)}
.ds-list li{margin:.45rem 0}
.ds-cta-panel{border:1px solid var(--ds-border);border-radius:calc(var(--ds-radius) + 4px);padding:clamp(1.5rem,4vw,2.75rem);background:color-mix(in srgb,var(--ds-paper-alt) 92%, var(--ds-accent) 5%)}
.ds-footer{border-top:1px solid var(--ds-border);padding:1.5rem 0;margin-top:2rem}
.ds-footer-inner{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;color:var(--ds-ink-muted);font-size:.9rem}
.ds-footer nav{display:flex;gap:1rem;flex-wrap:wrap}
.ds-dash-grid{display:grid;grid-template-columns:220px 1fr;gap:1.25rem;align-items:start}
.ds-side{border:1px solid var(--ds-border);border-radius:var(--ds-radius);padding:1rem;background:var(--ds-paper-alt);position:sticky;top:4.5rem}
.ds-side ul{list-style:none;margin:.75rem 0 0;padding:0}
.ds-side li{margin:.35rem 0}
.ds-side a{display:block;padding:.35rem 0;min-height:44px}
.ds-meta{font-size:.8rem;color:var(--ds-ink-muted)}
.ds-figure{margin:1.5rem 0 0}
.ds-figure-stage{border:1px solid var(--ds-border);border-radius:calc(var(--ds-radius) + 4px);padding:1rem;background:var(--ds-paper-alt)}
.ds-figure svg{width:100%;height:auto;display:block}
.ds-scrub{display:grid;gap:.35rem;margin-top:.75rem}
.ds-scrub input{width:100%}
.ds-figure figcaption{margin-top:.75rem;font-size:.9rem;color:var(--ds-ink-muted)}
.ds-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.ds-token-strip{display:none}
${leanCss(taste.aestheticLean)}
${motionCss(taste.motion)}
@media (max-width:800px){
  .ds-hero-grid,.ds-dash-grid{grid-template-columns:1fr}
  .ds-nav-inner{flex-wrap:wrap;padding:.75rem 0}
  .ds-nav nav{order:3;width:100%}
  .ds-side{position:static}
  .ds-side ul{display:flex;flex-wrap:wrap;gap:.35rem .85rem}
  h1{font-size:clamp(2rem,9vw,2.8rem)}
  .ds-hero,.ds-section{padding:clamp(2.5rem,8vw,4rem) 0}
}
</style>
</head>
<body data-aesthetic="${esc(taste.aestheticLean)}" data-motion="${esc(taste.motion)}" data-sitekind="${esc(brief.siteKind)}">
<p class="ds-sr">${esc(summary)}</p>
${sections.map((s, i) => renderSection(s, i, spec)).join("\n")}
${previewScripts(taste.motion)}
</body>
</html>`;
}
