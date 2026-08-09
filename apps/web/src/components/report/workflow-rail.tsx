"use client";

import { Check } from "lucide-react";
import type { ProofState } from "@/components/report/types";

export function WorkflowRail({
  captured,
  sourceMapped,
  patchReady,
  proofState,
}: {
  captured: boolean;
  sourceMapped: boolean;
  patchReady: boolean;
  proofState: ProofState;
}) {
  const proofDone = proofState === "passed" || proofState === "review" || proofState === "failed";
  const steps = [
    { label: "Observe", detail: "Rendered browser truth", done: captured, active: !captured },
    { label: "Match", detail: "Rank relevant source context", done: sourceMapped, active: captured && !sourceMapped },
    { label: "Repair", detail: "Disposable checkout", done: patchReady, active: sourceMapped && !patchReady },
    { label: "Check", detail: "Single-route live recapture", done: proofDone, active: patchReady && !proofDone },
  ];
  return (
    <div className="mt-4 grid overflow-hidden rounded-card border border-border bg-surface md:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.label} className={`relative px-4 py-3 ${index ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
          <div className="flex items-center gap-2">
            <span className={`grid h-5 w-5 place-items-center rounded-full border font-mono text-meta ${
              step.done
                ? "border-ok/50 bg-ok/10 text-ok"
                : step.active
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border text-muted"
            }`}>
              {step.done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span className={`font-mono text-xs uppercase tracking-[0.12em] ${step.done || step.active ? "text-text" : "text-muted"}`}>{step.label}</span>
            {step.active ? <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : null}
          </div>
          <p className="mt-1 pl-8 text-xs text-muted">{step.detail}</p>
        </div>
      ))}
    </div>
  );
}
