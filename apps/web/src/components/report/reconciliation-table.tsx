"use client";

import type { Reconciliation } from "@tell/schema";

export function ReconciliationTable({ reconciliation, live }: { reconciliation: Reconciliation; live: boolean }) {
  if (!reconciliation) return null;
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Reconciliation · {reconciliation.label}</p>
        <span className="font-mono text-meta text-muted">{live ? "grounded in your captured tokens" : "capture a page to ground this"}</span>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-bg/60 font-mono text-meta uppercase tracking-[0.12em] text-muted">
              <th className="px-3 py-2 font-normal">Token</th>
              <th className="px-3 py-2 font-normal">Before</th>
              <th className="px-3 py-2 font-normal">After</th>
            </tr>
          </thead>
          <tbody>
            {reconciliation.rows.map((row) => (
              <tr key={row.key} className="border-t border-border align-top">
                <td className="px-3 py-2.5">
                  <p className="text-text">{row.label}</p>
                  {row.note ? <p className="mt-0.5 text-meta text-muted">{row.note}</p> : null}
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 font-mono text-label text-secondary">
                    {row.swatchBefore ? <span className="inline-block h-3 w-3 rounded-full ring-1 ring-white/20" style={{ background: row.swatchBefore }} /> : null}
                    {row.before}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 font-mono text-label text-text">
                    {row.swatchAfter ? <span className="inline-block h-3 w-3 rounded-full ring-1 ring-white/20" style={{ background: row.swatchAfter }} /> : null}
                    {row.after}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
