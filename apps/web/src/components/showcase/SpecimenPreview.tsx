"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  discoverBeats,
  orderCinemaBeats,
  pickStill,
  type SpecimenBeat,
  type SpecimenPrefer,
} from "./specimenBeats";

export type PreviewMode = "still" | "cinema";
export type { SpecimenBeat, SpecimenPrefer };

type SpecimenPreviewProps = {
  /** Inline HTML (srcDoc). Prefer `src` for gallery/nav so pages stay small. */
  html?: string;
  /** Iframe URL — preferred for showcase (lazy + cacheable). */
  src?: string;
  title: string;
  designWidth?: number;
  designHeight?: number;
  className?: string;
  testId?: string;
  decorative?: boolean;
  /** still = best single beat; cinema = slow reel through beats (GIF-like, no asset). */
  mode?: PreviewMode;
  /** Prefer this beat family when picking the still frame. */
  prefer?: SpecimenPrefer;
  /**
   * When true, play the reel while the frame is in view (featured hero only).
   * Template filmstrip cells default to false — play on hover only.
   */
  autoplayInView?: boolean;
  /** Dwell ms between cinema beats when autoplaying (featured should be slow). */
  dwellMs?: number;
  /**
   * Defer attaching iframe src/srcDoc until near the viewport (default true when `src` is set).
   * Keeps the gallery from parsing 14×200KB documents on first paint.
   */
  lazy?: boolean;
};

/**
 * Showcase specimen window: fills width, focuses a craft beat (not the sticky nav),
 * optional cinema reel that scrolls key sections — a lightweight GIF substitute.
 */
export function SpecimenPreview({
  html,
  src,
  title,
  designWidth = 1440,
  designHeight = 900,
  className,
  testId,
  decorative = false,
  mode = "still",
  prefer = "auto",
  autoplayInView = false,
  dwellMs,
  lazy,
}: SpecimenPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const indexRef = useRef(0);
  const [scale, setScale] = useState<number | null>(null);
  const [beats, setBeats] = useState<SpecimenBeat[]>([]);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const lazyDefault = Boolean(src) && html == null;
  const lazyLoad = lazy ?? lazyDefault;
  const [shouldLoad, setShouldLoad] = useState(!lazyLoad);
  /** Specimen document painted + scrolled to craft beat — not merely iframe mounted. */
  const [docReady, setDocReady] = useState(false);

  const playInView = autoplayInView;
  const gapMs = dwellMs ?? (playInView ? 4200 : 1600);
  const firstDwellMs = playInView ? Math.max(gapMs, 3600) : 500;
  const docKey = src ?? html ?? "";

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    setDocReady(false);
    setBeats([]);
    setActive(0);
    indexRef.current = 0;
  }, [docKey]);

  useEffect(() => {
    if (!lazyLoad || shouldLoad) return;
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
        }
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazyLoad, shouldLoad]);

  // Hover can force-load a filmstrip cell before it scrolls into the rootMargin.
  useEffect(() => {
    if (hovering && lazyLoad && !shouldLoad) setShouldLoad(true);
  }, [hovering, lazyLoad, shouldLoad]);

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
    if (!shouldLoad) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;
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
          .ds-tape-rail{display:none!important}
          .ds-taxon-rail{display:none!important}
          .ds-sig-rail{display:none!important}
          .ds-way-rail{display:none!important}
          .ds-press-regs{display:none!important}
          .ds-stage-rail{display:none!important}
          .ds-priority-rail{display:none!important}
          .ds-cutoff-rail{display:none!important}
          .ds-principle-spine{display:none!important}
          html{scroll-padding-top:0!important}
        `;
        doc.head.appendChild(style);
      }
      window.setTimeout(() => {
        if (cancelled) return;
        const found = orderCinemaBeats(discoverBeats(doc), prefer);
        setBeats(found);
        const still = pickStill(found, prefer);
        const idx = Math.max(0, found.findIndex((b) => b.id === still.id));
        indexRef.current = idx;
        setActive(idx);
        win.scrollTo({ top: still.y, left: 0 });
        setDocReady(true);
      }, 80);
    };

    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument.body?.childNodes.length) {
      onLoad();
    }
    return () => {
      cancelled = true;
      iframe.removeEventListener("load", onLoad);
    };
  }, [docKey, prefer, shouldLoad]);

  const cinemaOn =
    mode === "cinema"
      ? playInView
        ? inView || hovering
        : hovering
      : decorative && hovering;

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
      timer = setTimeout(step, gapMs);
    };

    // Featured autoplay: long first dwell so the craft beat reads before advancing.
    timer = setTimeout(step, firstDwellMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cinemaOn, reducedMotion, beats, gapMs, firstDwellMs]);

  const scaled = scale !== null && scale > 0;
  const ready = scaled && docReady;
  const showLoading = !docReady;
  const style = {
    ["--sx-scale"]: scaled ? scale : 0,
    ["--sx-design-w"]: `${designWidth}px`,
    ["--sx-design-h"]: `${designHeight}px`,
  } as CSSProperties;

  // Filmstrip: show reel chrome while hovering (or always for featured autoplay cinema).
  const showBeats =
    beats.length > 1 &&
    mode === "cinema" &&
    (playInView || hovering || cinemaOn);

  return (
    <div
      ref={frameRef}
      className={className}
      data-testid={testId}
      data-ready={ready ? "true" : "false"}
      data-mode={mode}
      data-beat={beats[active]?.id ?? ""}
      data-playing={cinemaOn && !reducedMotion ? "true" : "false"}
      data-lazy={lazyLoad && !shouldLoad ? "pending" : "loaded"}
      data-loading={showLoading ? "true" : "false"}
      aria-busy={decorative ? undefined : showLoading}
      style={style}
      aria-hidden={decorative || undefined}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {showLoading ? (
        <div
          className="sx-preview-loading"
          role={decorative ? undefined : "status"}
          aria-live={decorative ? undefined : "polite"}
          aria-hidden={decorative || undefined}
        >
          <span className="sx-preview-loading-mark" aria-hidden="true" />
          <span className="sx-preview-loading-label">Loading specimen</span>
        </div>
      ) : null}
      <div className="sx-scale-surface">
        {shouldLoad ? (
          <iframe
            ref={iframeRef}
            title={decorative ? "" : title}
            src={src || undefined}
            srcDoc={src ? undefined : html}
            tabIndex={-1}
            loading="lazy"
          />
        ) : null}
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
