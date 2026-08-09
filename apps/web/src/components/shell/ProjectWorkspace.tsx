"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function ProjectWorkspace({
  critic,
  canvas,
  focusCanvas = false,
  mobilePane,
  onMobilePane,
}: {
  critic: ReactNode;
  canvas: ReactNode;
  focusCanvas?: boolean;
  mobilePane: "critic" | "canvas";
  onMobilePane: (pane: "critic" | "canvas") => void;
}) {
  const splitRef = useRef<HTMLDivElement>(null);
  const [criticPct, setCriticPct] = useState(40);
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setCriticPct(Math.min(55, Math.max(28, pct)));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div className="tell-mobile-switch" role="tablist" aria-label="Project panes">
        <button
          type="button"
          data-active={mobilePane === "critic" ? "true" : "false"}
          onClick={() => onMobilePane("critic")}
        >
          Critic
        </button>
        <button
          type="button"
          data-active={mobilePane === "canvas" ? "true" : "false"}
          onClick={() => onMobilePane("canvas")}
        >
          Canvas
        </button>
      </div>
      <div
        ref={splitRef}
        className="tell-split"
        data-focus={focusCanvas ? "canvas" : "split"}
        data-mobile-pane={mobilePane}
        style={
          focusCanvas
            ? undefined
            : ({ ["--shell-split-critic" as string]: `${criticPct}%` } as CSSProperties)
        }
      >
        <aside className="tell-split__critic" aria-label="Critic pane">
          {critic}
        </aside>
        <button
          type="button"
          className="tell-split__handle"
          aria-label="Resize panes"
          onPointerDown={(e) => {
            e.preventDefault();
            dragging.current = true;
          }}
        />
        <section className="tell-split__canvas" aria-label="Proof canvas">
          {canvas}
        </section>
      </div>
    </>
  );
}
