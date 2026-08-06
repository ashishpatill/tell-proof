"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type ScaledPreviewProps = {
  html: string;
  title: string;
  /** Design viewport width baked into the preview HTML. */
  designWidth?: number;
  /** Design viewport height for the scaled surface. */
  designHeight?: number;
  className?: string;
  testId?: string;
  /** Decorative thumbs inside links — hide from assistive tech. */
  decorative?: boolean;
};

/**
 * Fills a fluid frame with a fixed-width design preview (no empty right gutter).
 * Container-query scale on iframes is unreliable — measure the frame and set --sx-scale.
 */
export function ScaledPreview({
  html,
  title,
  designWidth = 1440,
  designHeight = 900,
  className,
  testId,
  decorative = false,
}: ScaledPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

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

  const ready = scale !== null && scale > 0;
  const style = {
    ["--sx-scale"]: ready ? scale : 0,
    ["--sx-design-w"]: `${designWidth}px`,
    ["--sx-design-h"]: `${designHeight}px`,
  } as CSSProperties;

  return (
    <div
      ref={frameRef}
      className={className}
      data-testid={testId}
      data-ready={ready ? "true" : "false"}
      style={style}
      aria-hidden={decorative || undefined}
    >
      <div className="sx-scale-surface">
        <iframe title={decorative ? "" : title} srcDoc={html} tabIndex={-1} />
      </div>
    </div>
  );
}
