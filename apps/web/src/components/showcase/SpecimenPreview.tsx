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
  prefer?: SpecimenPrefer;
  /**
   * When true (default for decorative cinema), play the reel while the frame is in view —
   * not only on hover. Featured cinema always plays when visible.
   */
  autoplayInView?: boolean;
};

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
  const [beats, setBeats] = useState<SpecimenBeat[]>([]);
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
          .ds-tape-rail{display:none!important}
          .ds-taxon-rail{display:none!important}
          .ds-sig-rail{display:none!important}
          .ds-press-regs{display:none!important}
          html{scroll-padding-top:0!important}
        `;
        doc.head.appendChild(style);
      }
      window.setTimeout(() => {
        const found = orderCinemaBeats(discoverBeats(doc), prefer);
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

    // Featured cinema: longer first dwell so the craft beat reads before the reel advances.
    timer = setTimeout(step, decorative ? 600 : 2800);
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
