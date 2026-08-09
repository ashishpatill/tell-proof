"use client";

import type { Reconciliation } from "@tell/schema";
import { AxisBar } from "@/components/report/axis-bar";

const BAND_COPY: Record<string, string> = {
  distinctive: "distinctive",
  conservative: "competent, conservative",
  template: "template-grade",
  slop: "reads as AI-generated",
};

/** The measured before→after genericness scorecard — the number that provably drops. */
export function Scorecard({ reconciliation, live }: { reconciliation: Reconciliation; live: boolean }) {
  if (!reconciliation || !reconciliation.axes.length) return null;
  const { scoreBefore, scoreAfter, axes, scoredAgainst } = reconciliation;
  const drop = Math.max(0, scoreBefore - scoreAfter);
  return (
    <section className="rounded-card border border-accent/40 bg-surface-raised p-4 shadow-signal">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Genericness score</p>
          <p className="mt-1 font-mono text-meta text-muted">
            0 = fully distinctive · lower is better · scored {scoredAgainst === "brand-dna" ? "against your Brand DNA" : "vs the generic baseline"} · docs/05 methodology
          </p>
        </div>
        <span className="font-mono text-meta text-muted">{live ? "measured from your capture" : "capture to measure live"}</span>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl text-secondary line-through decoration-secondary/40">{scoreBefore}</span>
          <span className="font-mono text-secondary">→</span>
          <span className="font-display text-3xl leading-none text-accent">{scoreAfter}</span>
        </div>
        <div className="mb-1 flex flex-col">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">−{drop} points</span>
          <span className="font-mono text-meta text-muted">{BAND_COPY[reconciliation.scoreAfter <= 25 ? "distinctive" : reconciliation.scoreAfter <= 45 ? "conservative" : "template"]}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {axes.map((a) => (
          <div key={a.key} className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text">{a.label}</span>
              <span className="font-mono text-meta text-muted">{a.beforeText} <span className="text-accent">→</span> {a.afterText}</span>
            </div>
            <AxisBar before={a.before} after={a.after} />
            <p className="text-meta text-muted">{a.rationale}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-meta text-muted">
        {reconciliation.elementsRestyled} real elements restyled by <span className="text-secondary">data-tell-id</span> — the preview transforms the page itself, not a filter.
      </p>
    </section>
  );
}
