"use client";

import { Activity, Loader2, Split } from "lucide-react";
import type { MatrixProofSummary } from "@/components/report/types";
import { isBaselineCompareMode } from "@/lib/capture-honesty";

export function ScenarioMatrixPanel({
  state,
  proof,
  error,
  disabled,
  onScan,
}: {
  state: "idle" | "scanning" | "done" | "error";
  proof: MatrixProofSummary | null;
  error: string;
  disabled: boolean;
  onScan: () => void;
}) {
  const isCompare = isBaselineCompareMode(proof?.proofMode);

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-secondary">
            <Split className="h-4 w-4 text-accent" /> Scenario matrix
          </p>
          <p className="mt-1 text-sm text-secondary">
            Live Playwright cells across route × viewport × theme × interaction
            {proof?.authStorage ? " · auth session loaded" : ""}
            {proof?.authCellsDropped ? ` · ${proof.authCellsDropped} auth skipped` : ""}
            {proof
              ? isCompare
                ? " · baseline compare"
                : " · capture-only (no baseline compare)"
              : ""}
            .
          </p>
        </div>
        <button
          onClick={onScan}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {state === "scanning" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
          {state === "scanning" ? "Capturing matrix…" : "Scan scenario matrix"}
        </button>
      </div>
      {error ? <p className="font-mono text-xs text-drift">{error}</p> : null}
      {proof?.note ? <p className="font-mono text-xs text-muted">{proof.note}</p> : null}
      {proof ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 font-mono text-meta text-muted">
            {isCompare ? (
              <span>
                Overall{" "}
                <span
                  className={
                    proof.status === "passed"
                      ? "text-ok"
                      : proof.status === "failed"
                        ? "text-drift"
                        : "text-accent"
                  }
                >
                  {proof.status}
                </span>
              </span>
            ) : null}
            <span>{proof.cellCount} cells</span>
            {isCompare ? <span>{proof.matchedCells} matched</span> : null}
            {proof.skippedCells ? <span>{proof.skippedCells} skipped</span> : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left font-mono text-meta">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-1.5 pr-3 font-medium">Scenario</th>
                  <th className="py-1.5 pr-3 font-medium">Status</th>
                  {isCompare ? (
                    <>
                      <th className="py-1.5 pr-3 font-medium">Δ score</th>
                      <th className="py-1.5 font-medium">Flags</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {proof.cells.slice(0, 12).map((cell) => (
                  <tr key={cell.scenarioId} className="border-b border-border/60 text-secondary">
                    <td className="py-1.5 pr-3 text-text">{cell.scenarioId}</td>
                    <td className="py-1.5 pr-3">{cell.status}</td>
                    {isCompare ? (
                      <>
                        <td className="py-1.5 pr-3">{cell.scoreDelta}</td>
                        <td className="py-1.5">
                          {[cell.focusRegressed ? "focus" : null, cell.structureRegressed ? "structure" : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : state === "idle" ? (
        <p className="font-mono text-meta text-muted">
          Runs the compact live plan against this origin — including authenticated `/account` when storage state is present.
        </p>
      ) : null}
    </section>
  );
}
