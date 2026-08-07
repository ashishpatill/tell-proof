"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type PreviewMode = "still" | "cinema";

type Beat = { id: string; y: number; label: string };

type SpecimenPreviewProps = {
  html: string;
  title: string;
  designWidth?: number;
  designHeight?: number;
  className?: string;
  testId?: string;
  decorative?: boolean;
  /** still = best single beat; cinema = slow reel through beats (GIF-like, no asset). */
  mode?: PreviewMode;
  /** Prefer this beat family when picking the still frame. */
  prefer?: "hero" | "figure" | "auto";
  /**
   * When true (default for decorative cinema), play the reel while the frame is in view —
   * not only on hover. Featured cinema always plays when visible.
   */
  autoplayInView?: boolean;
};

function discoverBeats(doc: Document): Beat[] {
  const win = doc.defaultView;
  if (!win) return [{ id: "top", y: 96, label: "Fold" }];

  const pick = (sel: string, id: string, label: string): Beat | null => {
    const el = doc.querySelector(sel);
    if (!el) return null;
    const y = Math.max(0, Math.round(el.getBoundingClientRect().top + win.scrollY - 28));
    return { id, y, label };
  };

  const beats: Beat[] = [];
  const hero =
    pick(".ds-hero .ds-display", "hero", "Claim") ||
    pick(".ds-hero", "hero", "Claim") ||
    pick("h1", "hero", "Claim");
  if (hero) beats.push(hero);

  // Prefer the unique craft figure for each kind — lattice, folio plate, seam ladder, then product.
  const figureRaw =
    pick(".ds-hero .ds-register-ledger .ds-fig, .ds-register-ledger", "figure", "Ledger") ||
    pick(".ds-hero .ds-chrono-lattice .ds-fig, .ds-chrono-lattice", "figure", "Lattice") ||
    pick(".ds-hero .ds-folio-plate .ds-fig, .ds-folio-plate", "figure", "Plate") ||
    pick(".ds-hero .ds-seam-figure .ds-fig, .ds-seam-figure", "figure", "Ladder") ||
    pick(".ds-hero .ds-plate-bleed", "figure", "Figure") ||
    pick(".ds-plate-bleed .ds-fig", "figure", "Figure") ||
    pick(".ds-alt-figure, [data-section='features'] .ds-plate", "figure", "Figure");
  // Overfigure / folio plates start high — nudge into drawn matter past claim chrome.
  if (figureRaw) {
    const figure =
      figureRaw.y < 200 ? { ...figureRaw, y: Math.max(figureRaw.y, 220) } : figureRaw;
    if (!hero || Math.abs(figure.y - hero.y) > 80) beats.push(figure);
  }

  const metrics = pick(".ds-metrics-band, [data-section='metrics']", "metrics", "Stakes");
  if (metrics) beats.push(metrics);

  const instruments =
    pick("[data-section='features'] .ds-index, [data-section='features']", "instruments", "Index");
  if (instruments && instruments.y > 400) beats.push(instruments);

  const specimen = pick(".ds-specimen, [data-section='specimen']", "specimen", "Specimen");
  if (specimen) beats.push(specimen);

  // Dossier / foundry / observatory signature essays — the craft theme packs miss.
  const spread = pick(".ds-spread, .ds-marginalia, .ds-chrono, .ds-entry, [data-section='story']", "spread", "Spread");
  if (spread) beats.push(spread);

  const proof =
    pick(".ds-proof-board, .ds-proof", "proof", "Proof") ||
    pick("[data-surface='inverse']", "proof", "Proof");
  if (proof) beats.push(proof);

  const imprint = pick(".ds-closing-colophon, .ds-closing, #cta", "imprint", "Imprint");
  if (imprint) beats.push(imprint);

  const out: Beat[] = [];
  for (const b of beats.sort((a, c) => a.y - c.y)) {
    if (out.length && Math.abs(out[out.length - 1]!.y - b.y) < 90) continue;
    out.push(b);
  }
  // Cap reel length so the GIF-like loop stays punchy (best moments, not every section).
  return (out.length ? out : [{ id: "top", y: 96, label: "Fold" }]).slice(0, 6);
}

function pickStill(beats: Beat[], prefer: SpecimenPreviewProps["prefer"]): Beat {
  const figure = beats.find((b) => b.id === "figure");
  const hero = beats.find((b) => b.id === "hero");
  const spread = beats.find((b) => b.id === "spread");
  if (prefer === "hero") return hero || figure || beats[0]!;
  // Prefer a figure that is actually down-page; otherwise claim / spread craft.
  if (figure && figure.y >= 140) return figure;
  if (spread && spread.y >= 200) return spread;
  if (hero) return hero;
  if (figure) return { ...figure, y: Math.max(figure.y, 168) };
  return { ...beats[0]!, y: Math.max(beats[0]!.y, 96) };
}

/**
 * Showcase specimen window: fills width, focuses a craft beat (not the sticky nav),
 * optional cinema reel that scrolls key sections — a lightweight GIF substitute.
 */
export function SpecimenPreview({
  html,
  title,
  designWidth = 1440,
  designHeight = 900,
  className,
  testId,
  decorative = false,
  mode = "still",
  prefer = "auto",
  autoplayInView,
}: SpecimenPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const indexRef = useRef(0);
  const [scale, setScale] = useState<number | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(() => mode === "cinema" && !decorative);
  const [reducedMotion, setReducedMotion] = useState(false);

  const playInView = autoplayInView ?? (mode === "cinema" || decorative);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      setScale(w / designWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el || !playInView) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.2);
        setInView(hit);
      },
      { threshold: [0.15, 0.25, 0.4], rootMargin: "0px 0px -4% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playInView]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;
      // Showcase chrome: hide sticky nav + chapter rail so stills/reels show craft, not chrome.
      if (!doc.getElementById("sx-preview-chrome")) {
        const style = doc.createElement("style");
        style.id = "sx-preview-chrome";
        style.textContent = `
          .ds-nav{display:none!important}
          .ds-skip{display:none!important}
          .ds-chapter-rail{display:none!important}
          .ds-scrub-rail{display:none!important}
          .ds-chronometer{display:none!important}
          .ds-alpha-rail{display:none!important}
          html{scroll-padding-top:0!important}
        `;
        doc.head.appendChild(style);
      }
      window.setTimeout(() => {
        const found = discoverBeats(doc);
        setBeats(found);
        const still = pickStill(found, prefer);
        const idx = Math.max(0, found.findIndex((b) => b.id === still.id));
        indexRef.current = idx;
        setActive(idx);
        win.scrollTo({ top: still.y, left: 0 });
      }, 80);
    };

    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => iframe.removeEventListener("load", onLoad);
  }, [html, prefer]);

  const cinemaOn =
    mode === "cinema"
      ? playInView
        ? inView || hovering
        : true
      : decorative && (hovering || (playInView && inView));

  useEffect(() => {
    if (!cinemaOn || reducedMotion || beats.length < 2) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (cancelled) return;
      const next = (indexRef.current + 1) % beats.length;
      indexRef.current = next;
      setActive(next);
      win.scrollTo({ top: beats[next]!.y, left: 0, behavior: "smooth" });
      timer = setTimeout(step, decorative ? 1600 : 2200);
    };

    timer = setTimeout(step, decorative ? 600 : 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cinemaOn, reducedMotion, beats, decorative]);

  const ready = scale !== null && scale > 0;
  const style = {
    ["--sx-scale"]: ready ? scale : 0,
    ["--sx-design-w"]: `${designWidth}px`,
    ["--sx-design-h"]: `${designHeight}px`,
  } as CSSProperties;

  const showBeats = beats.length > 1 && (mode === "cinema" || (decorative && cinemaOn));

  return (
    <div
      ref={frameRef}
      className={className}
      data-testid={testId}
      data-ready={ready ? "true" : "false"}
      data-mode={mode}
      data-beat={beats[active]?.id ?? ""}
      data-playing={cinemaOn && !reducedMotion ? "true" : "false"}
      style={style}
      aria-hidden={decorative || undefined}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="sx-scale-surface">
        <iframe ref={iframeRef} title={decorative ? "" : title} srcDoc={html} tabIndex={-1} />
      </div>
      {showBeats ? (
        <div className="sx-beats" aria-hidden="true">
          <strong>Reel</strong>
          {beats.map((b, idx) => (
            <span key={b.id} className={idx === active ? "is-active" : undefined} title={b.label} />
          ))}
          <em>{beats[active]?.label ?? "Fold"}</em>
        </div>
      ) : null}
    </div>
  );
}
