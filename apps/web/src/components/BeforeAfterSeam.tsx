"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Finding, Reconciliation } from "@tell/schema";
import type { LlmSheet, RestyleMode, RestyleStatus } from "@/lib/use-llm-restyle";

const SLANT = 5;
const MIN = 0;
const MAX = 100;
const DESIGN_W = 1440;
const FRAME_H = 540;

function CropMark({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const pos = {
    tl: "left-2 top-2 border-l border-t",
    tr: "right-2 top-2 border-r border-t",
    bl: "left-2 bottom-2 border-l border-b",
    br: "right-2 bottom-2 border-r border-b",
  }[corner];
  return <span aria-hidden className={`pointer-events-none absolute z-[22] h-3 w-3 border-[var(--border-proof)] ${pos}`} />;
}

/**
 * Proof mark — registration target for evidence pins.
 * Keep the crosshair short and the mark small; a full viewBox of arms reads as clutter
 * when many findings pin the seam at once.
 */
function ProofMark({ className = "", quiet = false }: { className?: string; quiet?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r={quiet ? 4.25 : 5}
        className={quiet ? "fill-surface-raised/95 stroke-accent/65" : "fill-surface-raised stroke-accent"}
        strokeWidth="1.25"
      />
      <circle cx="12" cy="12" r="1.35" className="fill-accent" />
      {quiet ? null : (
        <path
          d="M12 7v2.25M12 14.75V17M7 12h2.25M14.75 12H17"
          className="stroke-accent"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/** Inject a stylesheet last so it wins the cascade in the "after" render. */
function injectReconcile(html: string, sheet?: { css: string; fontImport: string }): string {
  if (!sheet) return html;
  const style = `<style data-tell-reconcile>\n${sheet.fontImport}\n${sheet.css}\n</style>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${style}</body>`);
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, `${style}</html>`);
  return html + style;
}

const MOCK_PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  GradientCrutchTell: { x: 0.3, y: 0.18 },
  SystemFontTell: { x: 0.36, y: 0.44 },
  ShadowEverywhereTell: { x: 0.22, y: 0.78 },
  EmojiChromeTell: { x: 0.52, y: 0.16 },
  AcidAccentTell: { x: 0.66, y: 0.3 },
  FocusRingInconsistency: { x: 0.46, y: 0.64 },
  RadiusMonotoneTell: { x: 0.72, y: 0.52 },
  CenteredEverythingTell: { x: 0.48, y: 0.28 },
  GrayMushTell: { x: 0.58, y: 0.7 },
};

const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
/** Cap pins so the seam stays readable — full finding list lives in the inspector. */
const MAX_SEAM_PINS = 5;

function pinPosition(finding: Finding, index: number, total: number) {
  const named = MOCK_PIN_POSITIONS[String(finding.detector)];
  if (named) return named;
  // Spread leftovers across a shallow arc — never stack in one left column.
  const t = total <= 1 ? 0 : index / (total - 1);
  return { x: 0.22 + t * 0.56, y: 0.2 + (index % 2) * 0.12 + t * 0.42 };
}

function pinsForSeam(findings: Finding[], selectedId: string): Finding[] {
  if (findings.length <= MAX_SEAM_PINS) return findings;
  const selected = findings.find((f) => f.id === selectedId);
  const ranked = [...findings].sort((a, b) => {
    const bySev = (SEVERITY_RANK[a.severity] ?? 1) - (SEVERITY_RANK[b.severity] ?? 1);
    if (bySev !== 0) return bySev;
    return String(a.detector).localeCompare(String(b.detector));
  });
  const out: Finding[] = [];
  if (selected) out.push(selected);
  for (const f of ranked) {
    if (out.length >= MAX_SEAM_PINS) break;
    if (!out.some((x) => x.id === f.id)) out.push(f);
  }
  return out;
}

type Props = {
  seam: number;
  setSeam: (v: number) => void;
  findings: Finding[];
  reconciliation?: Reconciliation;
  selectedId: string;
  onSelectFinding: (id: string) => void;
  snapshotHtml?: string;
  screenshotBase64?: string;
  // ── v2: background LLM-refined sheet (optional, additive — deterministic still ships instantly) ──
  llmStatus?: RestyleStatus;
  llmSheet?: LlmSheet | null;
  llmMode?: RestyleMode;
  onLlmModeChange?: (mode: RestyleMode) => void;
};

export function BeforeAfterSeam({
  seam,
  setSeam,
  findings,
  reconciliation,
  selectedId,
  onSelectFinding,
  snapshotHtml,
  screenshotBase64,
  llmStatus = "idle",
  llmSheet = null,
  llmMode = "recipes",
  onLlmModeChange,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESIGN_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    if (e.key === "ArrowLeft") { setSeam(clamp(seam - 4)); e.preventDefault(); }
    if (e.key === "ArrowRight") { setSeam(clamp(seam + 4)); e.preventDefault(); }
  };

  const afterClip = `polygon(${seam + SLANT}% 0%, 100% 0%, 100% 100%, ${seam - SLANT}% 100%)`;
  const hasLive = Boolean(snapshotHtml);
  const beforeDoc = snapshotHtml ?? "";

  // "ai" only actually wins once the sheet has landed — otherwise we're still on recipes.
  const usingLlm = llmMode === "ai" && Boolean(llmSheet);
  const activeCss = usingLlm ? llmSheet!.css : reconciliation?.css ?? "";
  const activeFontImport = usingLlm ? llmSheet!.fontImport : reconciliation?.fontImport ?? "";
  const activeSheet = reconciliation ? { css: activeCss, fontImport: activeFontImport } : undefined;

  // afterDoc rebuilds a multi-MB snapshot string — only redo the concat when the
  // underlying page or the winning CSS sheet actually changes.
  const afterDoc = useMemo(
    () => injectReconcile(beforeDoc, activeSheet),
    [beforeDoc, activeSheet?.css, activeSheet?.fontImport],
  );
  const iframeStyle: React.CSSProperties = {
    width: DESIGN_W,
    height: FRAME_H / scale,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    border: "0",
    pointerEvents: "none",
    background: "#fff",
  };

  return (
    <div
      ref={frameRef}
      onDoubleClick={() => setSeam(50)}
      className="seam-frame relative select-none overflow-hidden rounded-card border border-border bg-bg"
      style={{ height: FRAME_H }}
    >
      {hasLive ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <iframe title="Captured page" srcDoc={beforeDoc} sandbox="allow-same-origin" scrolling="no" style={iframeStyle} />
          </div>
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: afterClip, WebkitClipPath: afterClip }}>
            <iframe title="Reconciled preview" srcDoc={afterDoc} sandbox="allow-same-origin" scrolling="no" style={iframeStyle} />
            {reconciliation ? (
              <div className="pointer-events-none absolute bottom-4 right-4 z-[16] max-w-xs rounded-md border border-white/25 bg-bg/80 px-3 py-2 text-left backdrop-blur-sm">
                <p className="font-mono text-meta uppercase tracking-[0.14em] text-white/80">Reconciled · {reconciliation.label}</p>
                <p className="mt-1 text-sm text-white">{reconciliation.summary}</p>
                <p className="mt-2 flex items-center gap-2 font-mono text-meta text-white/70">
                  <span className="inline-block h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: reconciliation.accentBefore }} />
                  → <span className="inline-block h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: reconciliation.accentAfter }} />
                  {reconciliation.accentBefore} → {reconciliation.accentAfter}
                </p>
                {onLlmModeChange && (llmSheet || llmStatus === "pending") ? (
                  <div className="pointer-events-auto mt-2.5 flex items-center gap-1.5 border-t border-white/15 pt-2">
                    <button
                      type="button"
                      onClick={() => onLlmModeChange("recipes")}
                      className={`rounded px-2 py-1 font-mono text-meta uppercase tracking-[0.1em] transition ${
                        !usingLlm ? "bg-white/25 text-white" : "text-white/60 hover:text-white/90"
                      }`}
                    >
                      Recipes
                    </button>
                    <button
                      type="button"
                      disabled={!llmSheet}
                      onClick={() => onLlmModeChange("ai")}
                      className={`rounded px-2 py-1 font-mono text-meta uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        usingLlm ? "bg-white/25 text-white" : "text-white/60 hover:text-white/90"
                      }`}
                    >
                      AI-refined
                    </button>
                    {llmStatus === "pending" ? (
                      <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-label="Refining with AI…" title="Refining with AI…" />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : screenshotBase64 ? (
        <>
          <div className="absolute inset-0 bg-[#0b0b0b]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${screenshotBase64}`} alt="Captured page" className="h-full w-full object-cover object-top" />
          </div>
          <div className="absolute inset-0 grid place-items-center" style={{ clipPath: afterClip, WebkitClipPath: afterClip }}>
            <div className="grid h-full w-full place-items-center bg-[#17140F] text-center">
              <p className="max-w-xs px-6 font-mono text-xs text-white/70">Snapshot unavailable for this page — recapture to render the live restyle.</p>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div className="max-w-md px-8">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">No capture yet</p>
            <h2 className="mt-3 font-display text-3xl text-text">Paste a URL and capture.</h2>
            <p className="mt-3 text-secondary">Tell renders the real page here, then wipes to the reconciled restyle on the right.</p>
          </div>
        </div>
      )}

      {hasLive
        ? pinsForSeam(findings, selectedId).map((f, index, pins) => {
            const pos = pinPosition(f, index, pins.length);
            const active = selectedId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFinding(f.id)}
                aria-label={`Evidence: ${f.detector}`}
                aria-pressed={active}
                title={String(f.detector)}
                className={`seam-pin absolute z-[18] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-raised/90 p-0.5 shadow-sm ring-1 ring-border/50 ${active ? "seam-pin--active" : "seam-pin--quiet"}`}
                style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
              >
                <ProofMark className={active ? "h-4 w-4" : "h-3.5 w-3.5"} quiet={!active} />
              </button>
            );
          })
        : null}

      <svg className="seam-line pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1={seam + SLANT} y1={0} x2={seam - SLANT} y2={100} className="stroke-accent" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
      </svg>

      <button
        role="slider"
        aria-label="Reveal seam — captured page versus reconciled restyle"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(seam)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="seam-handle absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border border-accent bg-surface-raised px-3 py-2 shadow-signal"
        style={{ left: `${seam}%` }}
      >
        <ProofMark className="h-5 w-5" />
      </button>

      <CropMark corner="tl" />
      <CropMark corner="tr" />
      <CropMark corner="bl" />
      <CropMark corner="br" />
      <span className="absolute left-4 top-4 z-[21] rounded bg-bg/75 px-2 py-1 font-mono text-xs uppercase tracking-[0.16em] text-white/90">
        {hasLive ? "Captured" : "Before"}
      </span>
      <span className="absolute right-4 top-4 z-[21] flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs uppercase tracking-[0.16em]"
        style={{ background: reconciliation?.surfaceAfter ?? "rgba(255,255,255,.85)", color: reconciliation?.textAfter ?? "#181614" }}>
        Reconciled
        {reconciliation ? (
          <span className="rounded-full bg-surface/50 px-2 py-1 text-meta normal-case tracking-normal">
            {usingLlm ? "Gemini-refined" : "Recipe engine"}
          </span>
        ) : null}
      </span>
    </div>
  );
}
