"use client";

import { Fingerprint } from "lucide-react";
import type { BrandDNA } from "@tell/schema";

/** Learn / show / clear the Brand DNA that the redesign steers toward and the scorecard scores against. */
export function BrandDnaBar({ dna, onLearn, onClear, live }: { dna: BrandDNA | null; onLearn: () => void; onClear: () => void; live: boolean }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Brand DNA</p>
          {dna ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border border-border" style={{ background: dna.accent }} />
                <span className="font-mono text-label">{dna.accent}</span>
              </span>
              <span className="text-muted">·</span>
              <span>{dna.displayFont} / {dna.bodyFont}</span>
              <span className="text-muted">·</span>
              <span className="font-mono text-meta text-muted">radius {dna.radius} · from {dna.source}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-secondary">
              No brand learned yet — Tell scores against the generic baseline. Capture a page whose look you trust, then remember it.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {dna ? (
            <button
              onClick={onClear}
              className="rounded-md border border-border px-3 py-2 font-mono text-xs text-muted transition hover:text-text"
            >
              Clear
            </button>
          ) : null}
          <button
            onClick={onLearn}
            className="inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition hover:bg-accent/20"
            title={live ? "Learn this captured page's fonts, accent, radius, and rhythm as your Brand DNA" : "Capture a page first for a real Brand DNA"}
          >
            <Fingerprint className="h-4 w-4" />
            {dna ? "Relearn from this page" : "Remember as Brand DNA"}
          </button>
        </div>
      </div>
    </section>
  );
}
