import Link from "next/link";
import { designFromFeatures, listTemplates, type DesignTemplate } from "@tell/design-skills";
import { SpecimenPreview } from "@/components/showcase/SpecimenPreview";
import "./showcase.css";

export const dynamic = "force-static";
export const metadata = {
  title: "Tell Specimens — Craft reels, not theme packs",
  description:
    "Twelve research-backed site kinds — each gallery cell is a GIF-like craft reel of the best beats, not a cropped nav strip.",
};

type OfferingPreview = DesignTemplate & { previewHtml: string; index: string };

function buildOfferings(): OfferingPreview[] {
  return listTemplates().map((t, i) => ({
    ...t,
    previewHtml: designFromFeatures(t.brief).previewHtml,
    index: String(i + 1).padStart(2, "0"),
  }));
}

/**
 * Specimen gallery — one composition: brand + craft cinema stage, then a filmstrip of reels.
 * Each preview is a GIF substitute that walks the best craft beats (figure / spread / imprint),
 * never a sticky-nav thumbnail.
 */
export default function ShowcaseGalleryPage() {
  const offerings = buildOfferings();
  const featured =
    offerings.find((o) => o.key === "press") ??
    offerings.find((o) => o.key === "archive") ??
    offerings.find((o) => o.key === "observatory") ??
    offerings.find((o) => o.key === "dossier") ??
    offerings.find((o) => o.key === "foundry") ??
    offerings.find((o) => o.key === "studio") ??
    offerings[0]!;
  const strip = offerings.filter((o) => o.key !== featured.key);

  return (
    <div className="sx-root" data-testid="showcase-gallery">
      <div className="sx-grain" aria-hidden="true" />
      <div className="sx-shell">
        <header className="sx-nav">
          <Link className="sx-brand" href="/showcase">
            <span className="sx-brand-mark">Tell</span>
            <span className="sx-brand-meta">Specimens</span>
          </Link>
          <nav className="sx-nav-links" aria-label="Primary">
            <a href="#reels">Reels</a>
            <Link href="/studio">Studio</Link>
            <Link href="/">Tell Report</Link>
            <Link className="sx-nav-cta" href={`/showcase/${featured.key}`}>
              Open featured
            </Link>
          </nav>
        </header>

        {/* One composition: brand + headline + dominant cinema reel (GIF substitute). */}
        <section className="sx-stage" aria-labelledby="sx-hero-title">
          <div className="sx-stage-mast">
            <p className="sx-kicker">Craft reels · not theme packs</p>
            <h1 id="sx-hero-title" className="sx-display">
              Tell Specimens
            </h1>
            <p className="sx-lede">
              Each offering loops its best beats — plate, spread, stakes — like a GIF, without
              shipping a media file.
            </p>
            <div className="sx-hero-actions">
              <Link className="sx-nav-cta" href={`/showcase/${featured.key}`}>
                Watch {featured.label}
              </Link>
              <a className="sx-btn-ghost" href="#reels">
                Browse the filmstrip
              </a>
            </div>
          </div>

          <article className="sx-stage-reel" aria-label={`Featured craft reel: ${featured.label}`}>
            <div className="sx-reel-chrome" aria-hidden="true">
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
            </div>
            <div className="sx-featured-label">
              <span>Now playing</span>
              <span>
                {featured.index} / {String(offerings.length).padStart(2, "0")} · {featured.label}
              </span>
            </div>
            <div className="sx-plate sx-plate-stage">
              <SpecimenPreview
                className="sx-plate-frame"
                title={`${featured.label} craft reel`}
                html={featured.previewHtml}
                designWidth={1440}
                designHeight={1200}
                mode="cinema"
                prefer="figure"
                autoplayInView
                testId="showcase-featured-preview"
              />
              <div className="sx-plate-meta">
                <h2>{featured.label}</h2>
                <p>{featured.marketJob}</p>
                <Link href={`/showcase/${featured.key}`}>Open full specimen →</Link>
              </div>
            </div>
            <div className="sx-reel-chrome sx-reel-chrome-end" aria-hidden="true">
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
            </div>
          </article>
        </section>

        <section className="sx-filmstrip" id="reels" aria-labelledby="sx-reels-title">
          <div className="sx-index-head">
            <h2 id="sx-reels-title">The filmstrip</h2>
            <p>
              {offerings.length} offerings · each cell autoplays its craft reel in view. Hover to
              scrub faster.
            </p>
          </div>

          <ol className="sx-cells">
            {strip.map((o) => (
              <li key={o.key} className="sx-cell">
                <Link
                  className="sx-cell-link"
                  href={`/showcase/${o.key}`}
                  data-testid={`showcase-link-${o.key}`}
                >
                  <div className="sx-cell-frame">
                    <div className="sx-cell-sprockets" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <SpecimenPreview
                      className="sx-thumb sx-thumb-reel"
                      title={`${o.label} craft reel`}
                      html={o.previewHtml}
                      designWidth={1440}
                      designHeight={900}
                      mode="cinema"
                      prefer="figure"
                      decorative
                      autoplayInView
                      testId={`showcase-thumb-${o.key}`}
                    />
                    <div className="sx-cell-sprockets sx-cell-sprockets-end" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="sx-cell-meta">
                    <span className="sx-num" aria-hidden="true">
                      {o.index}
                    </span>
                    <div className="sx-row-copy">
                      <h3>{o.label}</h3>
                      <p className="sx-kind">{o.siteKind}</p>
                    </div>
                    <p className="sx-row-job">{o.marketJob}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <footer className="sx-foot">
          <p>
            Deepened by the recursive improve loop · cinema reels are live craft beats, not exported
            GIFs.
          </p>
          <p>
            <Link href="/studio">Edit in Studio</Link>
            {" · "}
            <Link href="/">Back to Tell</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
