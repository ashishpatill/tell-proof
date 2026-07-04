"use client";

import { useCallback, useRef } from "react";
import type { ArtDirection, Finding, Verdict } from "@tell/schema";

const SLANT = 6; // diagonal lean of the reveal seam, in % of frame width
const MIN = 16;
const MAX = 84;

/** Registration / crop mark — L-bracket in pre-press corner style. */
function CropMark({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const pos = {
    tl: "left-2 top-2 border-l border-t",
    tr: "right-2 top-2 border-r border-t",
    bl: "left-2 bottom-2 border-l border-b",
    br: "right-2 bottom-2 border-r border-b",
  }[corner];
  return <span aria-hidden className={`pointer-events-none absolute h-3 w-3 border-[var(--border-proof)] ${pos}`} />;
}

/** The signature proof mark: a filled ring with a crosshair. */
function ProofMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="6" className="fill-accent/20 stroke-accent" strokeWidth="1.5" />
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5" className="stroke-accent" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Where each detector's evidence pin sits over the "before" mock (0-1 of frame).
const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  GradientCrutchTell: { x: 0.28, y: 0.16 },
  SystemFontTell: { x: 0.34, y: 0.42 },
  ShadowEverywhereTell: { x: 0.2, y: 0.78 },
  EmojiChromeTell: { x: 0.5, y: 0.14 },
  FocusRingInconsistency: { x: 0.44, y: 0.62 },
};

type Props = {
  seam: number;
  setSeam: (v: number) => void;
  findings: Finding[];
  verdictOf: (id: string) => Verdict;
  activeDirection: ArtDirection;
  selectedId: string;
  onSelectFinding: (id: string) => void;
};

export function BeforeAfterSeam({ seam, setSeam, findings, verdictOf, activeDirection, selectedId, onSelectFinding }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

  const seamFromClientX = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return seam;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, [seam]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSeam(seamFromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    setSeam(seamFromClientX(e.clientX));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { setSeam(clamp(seam - 5)); e.preventDefault(); }
    if (e.key === "ArrowRight") { setSeam(clamp(seam + 5)); e.preventDefault(); }
  };

  const tok = activeDirection.tokenOverrides;
  const afterVars = {
    "--pv-display": tok["--font-display"] ?? "Instrument Serif",
    "--pv-accent": tok["--accent"] ?? "#D4714A",
    "--pv-radius": tok["--radius-card"] ?? "16px",
    "--pv-shadow": tok["--shadow-card"] ?? "0 2px 8px rgba(0,0,0,.25)",
  } as React.CSSProperties;

  // After layer is clipped to the right of a diagonal running from
  // (seam+SLANT) at the top to (seam-SLANT) at the bottom.
  const afterClip = `polygon(${seam + SLANT}% 0%, 100% 0%, 100% 100%, ${seam - SLANT}% 100%)`;

  return (
    <div
      ref={frameRef}
      onDoubleClick={() => setSeam(50)}
      className="seam-frame relative h-[460px] select-none overflow-hidden rounded-card border border-border bg-bg"
    >
      {/* BEFORE — the shipped generic surface */}
      <div className="demo-before absolute inset-0 grid place-items-center text-center">
        <div className="max-w-xl px-8">
          <p className="demo-before-pill mx-auto mb-4 w-fit rounded-full px-4 py-2 text-sm">🚀 AI-powered analytics</p>
          <h2 className="text-5xl font-bold tracking-tight text-white" style={{ fontFamily: "Inter, system-ui" }}>Ship insights faster ✨</h2>
          <p className="demo-before-copy mt-4 text-lg">A beautiful dashboard for modern teams.</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="demo-before-card rounded-lg p-5"><p className="demo-before-card-copy">📊 Metric</p></div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence pins — proof marks over the offending regions (before side only) */}
      {findings.map((f) => {
        const pos = PIN_POSITIONS[String(f.detector)];
        if (!pos) return null;
        return (
          <button
            key={f.id}
            onClick={() => onSelectFinding(f.id)}
            aria-label={`Evidence: ${f.detector}`}
            title={String(f.detector)}
            className={`seam-pin absolute z-[15] -translate-x-1/2 -translate-y-1/2 rounded-full ${selectedId === f.id ? "seam-pin--active" : ""}`}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
          >
            <ProofMark className="h-6 w-6" />
          </button>
        );
      })}

      {/* AFTER — the proposed direction, driven by the active art direction */}
      <div className="seam-after absolute inset-0" style={{ clipPath: afterClip, WebkitClipPath: afterClip }}>
        <div className="grid h-full place-items-center bg-[var(--surface-paper,#F3EDE4)]" style={afterVars}>
          <div className="max-w-2xl px-10 text-left">
            <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "var(--pv-accent)" }}>
              Partner-ready intelligence
            </p>
            <h2 className="mt-3 text-6xl leading-none text-[#181614]" style={{ fontFamily: "var(--pv-display), Georgia, serif" }}>
              Insight that feels considered.
            </h2>
            <p className="mt-5 max-w-lg text-lg text-[#3D3731]">
              Warm editorial hierarchy, one human accent, and depth used with restraint.
            </p>
            <div className="mt-7 inline-flex items-center gap-3">
              <span
                className="inline-block px-4 py-2 text-sm text-white"
                style={{ background: "var(--pv-accent)", borderRadius: "var(--pv-radius)", boxShadow: "var(--pv-shadow)" }}
              >
                {activeDirection.label}
              </span>
              <span className="font-mono text-xs text-[#73665A]">{activeDirection.summary}</span>
            </div>
          </div>
        </div>
      </div>

      {/* The diagonal seam line + registration marks at its endpoints */}
      <svg className="seam-line pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1={seam + SLANT} y1={0} x2={seam - SLANT} y2={100} className="stroke-accent" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Draggable handle riding the seam at mid-height */}
      <button
        role="slider"
        aria-label="Reveal seam — before versus proposed"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(seam)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="seam-handle absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border border-accent bg-surface-raised p-1.5 shadow-signal"
        style={{ left: `${seam}%` }}
      >
        <ProofMark className="h-5 w-5" />
      </button>

      <CropMark corner="tl" />
      <CropMark corner="tr" />
      <CropMark corner="bl" />
      <CropMark corner="br" />
      <span className="absolute left-4 top-4 z-20 font-mono text-xs uppercase tracking-[0.16em] text-white/70">Before</span>
      <span className="absolute right-4 top-4 z-20 font-mono text-xs uppercase tracking-[0.16em] text-[#181614]/70">After</span>
    </div>
  );
}
