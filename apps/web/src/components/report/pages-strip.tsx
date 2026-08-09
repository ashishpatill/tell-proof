"use client";

import { Layers, Loader2, Plus } from "lucide-react";
import type { DiscoveredRoute } from "@/lib/discover-routes";

export function PagesStrip({
  pages,
  activeUrl,
  capturing,
  scanningAll,
  pageInput,
  setPageInput,
  onSelect,
  onAdd,
  onScanAll,
}: {
  pages: DiscoveredRoute[];
  activeUrl: string;
  capturing: boolean;
  scanningAll: boolean;
  pageInput: string;
  setPageInput: (v: string) => void;
  onSelect: (url: string) => void;
  onAdd: () => void;
  onScanAll: () => void;
}) {
  const activePath = (() => {
    try {
      return new URL(activeUrl).pathname + new URL(activeUrl).search;
    } catch {
      return activeUrl;
    }
  })();

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-secondary">
          <Layers className="h-4 w-4 text-accent" /> Pages · {pages.length} discovered
        </p>
        {pages.length > 1 ? (
          <button
            onClick={onScanAll}
            disabled={scanningAll || capturing}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {scanningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {scanningAll ? "Scanning all…" : "Scan all pages"}
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {pages.map((p) => {
          const active = (p.path || "/") === (activePath || "/");
          return (
            <button
              key={p.url}
              onClick={() => onSelect(p.url)}
              disabled={capturing || scanningAll}
              title={p.url}
              className={`max-w-[240px] truncate rounded-full border px-3 py-2 font-mono text-xs transition disabled:opacity-50 ${
                active ? "border-accent bg-accent/10 text-accent" : "border-border text-secondary hover:border-accent hover:text-accent"
              }`}
            >
              {p.path || "/"}
            </button>
          );
        })}
        <div className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1">
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
            placeholder="/pricing"
            spellCheck={false}
            className="w-24 bg-transparent px-1 py-1 font-mono text-xs text-text outline-none placeholder:text-muted"
          />
          <button onClick={onAdd} aria-label="Add page" className="grid h-6 w-6 place-items-center rounded-full text-secondary transition hover:text-accent">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-2 font-mono text-meta text-muted">
        Scan each route to catch drift that only shows on some pages. The drafted patch is a site-wide stylesheet — one apply covers every page here.
      </p>
    </section>
  );
}
