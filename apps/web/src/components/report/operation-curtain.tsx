"use client";

import { Loader2 } from "lucide-react";

export function OperationCurtain({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="fixed inset-0 z-40 bg-bg/45 backdrop-blur-[2px]" aria-live="polite" aria-busy="true">
      <div className="absolute left-1/2 top-5 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 rounded-card border border-accent/40 bg-surface-raised p-4 shadow-signal">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </span>
          <div>
            <p className="font-mono text-sm text-text">{title || "Tell is working"}</p>
            <p className="mt-1 text-sm text-secondary">{detail || "Please wait while the current operation finishes."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
