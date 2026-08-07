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

  const figureRaw =
    pick(".ds-hero .ds-folio-plate", "figure", "Figure") ||
    pick(".ds-hero .ds-seam-figure", "figure", "Figure") ||
    pick(".ds-hero .ds-plate-bleed", "figure", "Figure") ||
    pick(".ds-plate-bleed .ds-fig", "figure", "Figure") ||
    pick(".ds-alt-figure, [data-section='features'] .ds-plate", "figure", "Figure");
  // Overfigure plates start at y≈0 (under the claim). Nudge into the product surface past sticky nav.
  if (figureRaw) {
    const figure =
      figureRaw.y < 120 ? { ...figureRaw, y: Math.max(figureRaw.y, 168) } : figureRaw;
    if (!hero || Math.abs(figure.y - hero.y) > 80) beats.push(figure);
  }

  const metrics = pick(".ds-metrics-band, [data-section='metrics']", "metrics", "Stakes");
  if (metrics) beats.push(metrics);

  const specimen = pick(".ds-specimen, [data-section='specimen']", "specimen", "Specimen");
  if (specimen) beats.push(specimen);

  const proof = pick(".ds-proof, [data-surface='inverse']", "proof", "Proof");
  if (proof) beats.push(proof);

  const out: Beat[] = [];
  for (const b of beats.sort((a, c) => a.y - c.y)) {
    if (out.length && Math.abs(out[out.length - 1]!.y - b.y) < 60) continue;
    out.push(b);
  }
  return out.length ? out : [{ id: "top", y: 96, label: "Fold" }];
}

function pickStill(beats: Beat[], prefer: SpecimenPreviewProps["prefer"]): Beat {
  const figure = beats.find((b) => b.id === "figure");
  const hero = beats.find((b) => b.id === "hero");
  if (prefer === "hero") return hero || figure || beats[0]!;
  // Prefer a figure that is actually down-page; otherwise the claim beat (never bare y=0 nav).
  if (figure && figure.y >= 140) return figure;
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
}: SpecimenPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const indexRef = useRef(0);
  const [scale, setScale] = useState<number | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;
      // Showcase chrome: hide sticky nav so stills/reels show craft, not browser chrome.
      if (!doc.getElementById("sx-preview-chrome")) {
        const style = doc.createElement("style");
        style.id = "sx-preview-chrome";
        style.textContent = `
          .ds-nav{display:none!important}
          .ds-skip{display:none!important}
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

  const cinemaOn = mode === "cinema" || (decorative && hovering);

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
      timer = setTimeout(step, decorative ? 1500 : 2100);
    };

    timer = setTimeout(step, decorative ? 700 : 1200);
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

  const showBeats = mode === "cinema" && beats.length > 1 && !decorative;

  return (
    <div
      ref={frameRef}
      className={className}
      data-testid={testId}
      data-ready={ready ? "true" : "false"}
      data-mode={mode}
      data-beat={beats[active]?.id ?? ""}
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
