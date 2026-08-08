"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { specimenHtmlSrc } from "./specimenSrc";
import { SpecimenPreview } from "./SpecimenPreview";

export type AnthologySlide = {
  key: string;
  label: string;
  marketJob: string;
  index: string;
};

/** Curated order — distinct fold instruments, not the same template looping 2–3 beats. */
export const ANTHOLOGY_KEYS = [
  "archive",
  "observatory",
  "dossier",
  "foundry",
  "loom",
  "saas",
  "dashboard",
  "corporate",
  "educational",
  "fintech",
  "press",
  "herbarium",
] as const;

type ShowcaseAnthologyReelProps = {
  slides: AnthologySlide[];
  /** Slow autoplay dwell per specimen (ms). */
  dwellMs?: number;
  totalCount: number;
  testId?: string;
};

/**
 * Featured hero reel: slow tour across best craft beats from *different* templates.
 * Loads one specimen document at a time via cached HTML API — not 14× inline HTML.
 */
export function ShowcaseAnthologyReel({
  slides,
  dwellMs = 5200,
  totalCount,
  testId = "showcase-featured-preview",
}: ShowcaseAnthologyReelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sequence = useMemo(() => {
    if (!slides.length) return [] as AnthologySlide[];
    const byKey = new Map(slides.map((s) => [s.key, s]));
    const ordered = ANTHOLOGY_KEYS.map((k) => byKey.get(k)).filter(
      (s): s is AnthologySlide => Boolean(s),
    );
    const rest = slides.filter(
      (s) => !ANTHOLOGY_KEYS.includes(s.key as (typeof ANTHOLOGY_KEYS)[number]),
    );
    return [...ordered, ...rest];
  }, [slides]);

  const [idx, setIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.2));
      },
      { threshold: [0.2, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || sequence.length < 2 || !inView || hovering) return;
    const timer = window.setInterval(() => {
      setIdx((i) => (i + 1) % sequence.length);
    }, dwellMs);
    return () => window.clearInterval(timer);
  }, [reducedMotion, sequence.length, dwellMs, inView, hovering]);

  // Warm the next slide’s HTML into HTTP cache while the current one dwells.
  useEffect(() => {
    if (sequence.length < 2) return;
    const next = sequence[(idx + 1) % sequence.length];
    if (!next) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = specimenHtmlSrc(next.key);
    link.as = "document";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [idx, sequence]);

  const slide = sequence[idx] ?? sequence[0];
  if (!slide) return null;

  return (
    <div
      ref={rootRef}
      className="sx-anthology"
      data-testid="showcase-anthology"
      data-slide={slide.key}
      data-playing={!reducedMotion && inView && !hovering ? "true" : "false"}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="sx-featured-label">
        <span>Across specimens</span>
        <span>
          {String(idx + 1).padStart(2, "0")} / {String(sequence.length).padStart(2, "0")} · {slide.label}
        </span>
      </div>
      <div className="sx-plate sx-plate-stage">
        <SpecimenPreview
          key={slide.key}
          className="sx-plate-frame"
          title={`${slide.label} craft beat`}
          src={specimenHtmlSrc(slide.key)}
          lazy={false}
          designWidth={1440}
          designHeight={1200}
          mode="still"
          prefer="figure"
          testId={testId}
        />
        <div className="sx-plate-meta">
          <h2>{slide.label}</h2>
          <p>{slide.marketJob}</p>
          <Link href={`/showcase/${slide.key}`} prefetch={false}>
            Open full specimen →
          </Link>
        </div>
      </div>
      <div className="sx-anthology-dots" aria-label="Specimen tour">
        {sequence.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={i === idx ? "is-active" : undefined}
            title={s.label}
            aria-label={`Show ${s.label}`}
            aria-current={i === idx ? "true" : undefined}
            onClick={() => setIdx(i)}
          />
        ))}
        <em aria-hidden="true">
          {slide.index} · of {String(totalCount).padStart(2, "0")}
        </em>
      </div>
    </div>
  );
}
