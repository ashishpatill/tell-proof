import Link from "next/link";
import { listTemplates, type DesignTemplate } from "@tell/design-skills";
import { ShowcaseAnthologyReel } from "@/components/showcase/ShowcaseAnthologyReel";
import { SpecimenPreview } from "@/components/showcase/SpecimenPreview";
import { specimenHtmlSrc } from "@/components/showcase/specimenSrc";
import "./showcase.css";

export const dynamic = "force-static";
export const metadata = {
  title: "Tell Specimens — Craft reels, not theme packs",
  description:
    "Fourteen research-backed site kinds — filmstrip reels play on hover; the hero slowly tours best beats across specimens.",
};

type OfferingMeta = DesignTemplate & { index: string };

function buildOfferings(): OfferingMeta[] {
  return listTemplates().map((t, i) => ({
    ...t,
    index: String(i + 1).padStart(2, "0"),
  }));
}

/**
 * Specimen gallery — hero anthology (slow cross-template tour) + filmstrip (hover-only reels).
 * Metadata only in the page payload; specimen HTML loads lazily via /api/design/html.
 */
export default function ShowcaseGalleryPage() {
  const offerings = buildOfferings();
  const anthologySlides = offerings.map((o) => ({
    key: o.key,
    label: o.label,
    marketJob: o.marketJob,
    index: o.index,
  }));
  const featured =
    offerings.find((o) => o.key === "herbarium") ??
    offerings.find((o) => o.key === "loom") ??
    offerings.find((o) => o.key === "archive") ??
    offerings[0]!;

  return (
    <div className="sx-root" data-testid="showcase-gallery">
      <div className="sx-grain" aria-hidden="true" />
      <div className="sx-shell">
        <header className="sx-nav">
          <Link className="sx-brand" href="/showcase" prefetch={false}>
            <span className="sx-brand-mark">Tell</span>
            <span className="sx-brand-meta">Specimens</span>
          </Link>
          <nav className="sx-nav-links" aria-label="Primary">
            <a href="#reels">Reels</a>
            <Link href="/studio" prefetch={false}>
              Studio
            </Link>
            <Link href="/" prefetch={false}>
              Tell Report
            </Link>
            <Link className="sx-nav-cta" href={`/showcase/${featured.key}`} prefetch={false}>
              Open featured
            </Link>
          </nav>
        </header>

        <section className="sx-stage" aria-labelledby="sx-hero-title">
          <div className="sx-stage-mast">
            <p className="sx-kicker">Craft reels · not theme packs</p>
            <h1 id="sx-hero-title" className="sx-display">
              Tell Specimens
            </h1>
            <p className="sx-lede">
              The stage slowly tours the best craft beat from each offering. Filmstrip cells stay
              still until you hover — then their reel plays.
            </p>
            <div className="sx-hero-actions">
              <a className="sx-nav-cta" href="#reels">
                Browse the filmstrip
              </a>
              <Link className="sx-btn-ghost" href={`/showcase/${featured.key}`} prefetch={false}>
                Open a specimen
              </Link>
            </div>
          </div>

          <article className="sx-stage-reel" aria-label="Featured craft tour across specimens">
            <div className="sx-reel-chrome" aria-hidden="true">
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
              <span className="sx-sprocket" />
            </div>
            <ShowcaseAnthologyReel slides={anthologySlides} totalCount={offerings.length} dwellMs={5200} />
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
              {offerings.length} offerings · hover a cell to play its craft reel. No autoplay in the
              strip.
            </p>
          </div>

          <ol className="sx-cells">
            {offerings.map((o) => (
              <li key={o.key} className="sx-cell">
                <Link
                  className="sx-cell-link"
                  href={`/showcase/${o.key}`}
                  prefetch={false}
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
                      src={specimenHtmlSrc(o.key)}
                      designWidth={1440}
                      designHeight={900}
                      mode="cinema"
                      prefer="figure"
                      decorative
                      lazy
                      autoplayInView={false}
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
            Deepened by the recursive improve loop · hero tours many specimens; strip reels wait for
            hover.
          </p>
          <p>
            <Link href="/studio" prefetch={false}>
              Edit in Studio
            </Link>
            {" · "}
            <Link href="/" prefetch={false}>
              Back to Tell
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
