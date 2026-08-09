"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  FileCode2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { TellReport } from "@tell/schema";
import type { ProofResult } from "@/components/report/types";

export function ProofMetric({ label, before, after, good }: { label: string; before: string; after: string; good: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="font-mono text-meta uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm text-secondary">
        {before} <span className={good ? "text-ok" : "text-drift"}>→ {after}</span>
      </p>
    </div>
  );
}

export function VerifiedProofPanel({
  baseline,
  result,
  seam,
  setSeam,
  onRevert,
  onCopy,
}: {
  baseline: TellReport;
  result: ProofResult;
  seam: number;
  setSeam: (value: number) => void;
  onRevert: () => void;
  onCopy: () => void;
}) {
  const { proof } = result;
  const improved = proof.scoreDelta < 0;
  const tone = result.status === "passed"
    ? "border-ok/50"
    : result.status === "failed"
      ? "border-drift/50"
      : "border-accent/40";
  const afterClip = `polygon(${seam}% 0, 100% 0, 100% 100%, ${seam}% 100%)`;

  return (
    <section className={`overflow-hidden rounded-card border bg-surface-raised shadow-signal ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-full border ${
            result.status === "passed" ? "border-ok/50 bg-ok/10 text-ok" : "border-accent/40 bg-accent/10 text-accent"
          }`}>
            {result.status === "passed" ? <ShieldCheck className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Independent visual proof</p>
            <h2 className="mt-1 font-display text-3xl text-text">
              {result.status === "passed" ? "Passed this visual check." : "The code ran. The evidence needs judgment."}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary">
              Two separate browser captures from the running checkout. The after side is rendered source—not a CSS simulation.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 font-mono text-xs font-semibold text-white transition hover:bg-accent-hover"
          >
            <Clipboard className="h-3.5 w-3.5" /> Copy verified patch
          </button>
          <button
            onClick={onRevert}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs text-secondary transition hover:border-drift hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Revert worktree
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border border-b border-border md:grid-cols-4">
        <ProofMetric label="Genericness" before={String(proof.beforeScore)} after={String(proof.afterScore)} good={improved} />
        <ProofMetric
          label="Structure"
          before={`${proof.headingsBefore}h · ${proof.buttonsBefore}b`}
          after={`${proof.headingsAfter}h · ${proof.buttonsAfter}b`}
          good={!proof.structureRegressed}
        />
        <ProofMetric label="Focus coverage" before={`${Math.round(proof.focusBefore * 100)}%`} after={`${Math.round(proof.focusAfter * 100)}%`} good={!proof.focusRegressed} />
        <div className="px-4 py-3">
          <p className="font-mono text-meta uppercase tracking-[0.14em] text-muted">Verdict</p>
          <p className={`mt-1 flex items-center gap-2 font-mono text-sm uppercase ${
            result.status === "passed" ? "text-ok" : result.status === "failed" ? "text-drift" : "text-accent"
          }`}>
            {result.status === "passed" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {result.status}
          </p>
        </div>
      </div>

      <div className="p-4">
        <p className="mb-3 font-mono text-meta uppercase tracking-[0.14em] text-muted">
          Scope · 1 route · {baseline.capture.viewport.width}×{baseline.capture.viewport.height} · default rendered state
        </p>
        <div className="relative h-[500px] overflow-hidden rounded-md border border-border bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${baseline.capture.screenshotBase64}`}
            alt="Baseline browser capture"
            className="absolute left-0 top-0 h-auto w-full bg-white"
          />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: afterClip, WebkitClipPath: afterClip }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${result.afterReport.capture.screenshotBase64}`}
              alt="Verified browser capture after source patch"
              className="h-auto w-full bg-white"
            />
          </div>
          <span className="absolute bottom-0 top-0 z-10 w-px bg-accent" style={{ left: `${seam}%` }} />
          <span className="absolute left-3 top-3 z-10 rounded bg-bg/70 px-2 py-1 font-mono text-meta uppercase tracking-[0.14em] text-white">Baseline</span>
          <span className="absolute right-3 top-3 z-10 rounded bg-bg/70 px-2 py-1 font-mono text-meta uppercase tracking-[0.14em] text-white">Recaptured source</span>
          <input
            type="range"
            min={0}
            max={100}
            value={seam}
            onChange={(event) => setSeam(Number(event.target.value))}
            aria-label="Compare baseline and verified capture"
            className="absolute bottom-4 left-1/2 z-20 w-48 -translate-x-1/2 accent-[rgb(var(--accent))]"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-meta text-muted">
            Verified {new Date(proof.capturedAt).toLocaleTimeString()} · {proof.url}
          </p>
          <div className="flex flex-wrap gap-2">
            {proof.changedFiles.map((file) => (
              <span key={file} className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-2 py-1 font-mono text-meta text-secondary">
                <FileCode2 className="h-3 w-3 text-accent" /> {file}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
