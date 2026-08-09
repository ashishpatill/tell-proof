"use client";

import { Loader2 } from "lucide-react";

export function OperationPlaceholder({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-md border border-accent/30 bg-bg/80">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-accent/40 bg-accent/10">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
        <p className="mt-4 font-display text-3xl text-text">{title || "Tell is working"}</p>
        <p className="mt-2 text-sm text-secondary">{detail || "Preparing the next rendered surface…"}</p>
        <p className="mt-4 font-mono text-meta uppercase tracking-[0.14em] text-muted">previous capture hidden while this runs</p>
      </div>
    </div>
  );
}
