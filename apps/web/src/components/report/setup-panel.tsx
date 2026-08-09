"use client";

import { useState } from "react";
import { AlertTriangle, Check, ExternalLink, Loader2, Square, TerminalSquare } from "lucide-react";
import { SETUP_ACTIVE_STATES, type SetupJob } from "@/lib/setup-types";

export const STATE_LABEL: Record<SetupJob["state"], string> = {
  cloning: "Cloning",
  installing: "Installing",
  detecting: "Detecting",
  starting: "Starting",
  waiting: "Waiting",
  ready: "Running",
  "needs-manual": "Needs a hand",
  error: "Error",
};

export function SetupPanel({
  job,
  onRetry,
  onStop,
  onCaptureManual,
}: {
  job: SetupJob;
  onRetry: () => void;
  onStop: () => void;
  onCaptureManual: (url: string) => void;
}) {
  const [manualUrl, setManualUrl] = useState("");
  const active = SETUP_ACTIVE_STATES.includes(job.state);
  const ready = job.state === "ready";
  const manual = job.state === "needs-manual";
  const tone = ready ? "border-ok/40 bg-ok/5" : manual || job.state === "error" ? "border-drift/40 bg-drift/5" : "border-accent/40 bg-accent/5";

  const guessUrl = job.detected?.guessedPort ? `http://localhost:${job.detected.guessedPort}` : "";

  return (
    <div className={`mt-4 rounded-card border px-4 py-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-bg">
          {active ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : ready ? <Check className="h-4 w-4 text-ok" /> : <AlertTriangle className="h-4 w-4 text-drift" />}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-sm text-text">
            <span className="text-secondary">{STATE_LABEL[job.state]}</span> · {job.repoLabel}
          </p>
          <p className="truncate text-sm text-secondary">{job.step}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {job.detected?.framework ? (
            <span className="rounded-full border border-border px-2 py-1 font-mono text-meta text-secondary">{job.detected.framework}</span>
          ) : null}
          {job.detected?.runCmd ? (
            <span className="rounded-full border border-border px-2 py-1 font-mono text-meta text-secondary">{job.detected.runCmd}</span>
          ) : null}
          {ready && job.url ? (
            <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-ok/40 bg-ok/10 px-2 py-1 font-mono text-meta text-ok">
              <ExternalLink className="h-3 w-3" /> {job.url}
            </a>
          ) : null}
          {ready ? (
            <button onClick={onStop} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-meta text-secondary transition hover:text-text">
              <Square className="h-3 w-3" /> Stop app
            </button>
          ) : null}
          {(manual || job.state === "error") ? (
            <button onClick={onRetry} className="rounded-md border border-border px-2 py-1 font-mono text-meta text-secondary transition hover:text-text">Retry</button>
          ) : null}
        </div>
      </div>

      {job.logs.length ? (
        <details className="mt-3" open={active || job.state === "error"}>
          <summary className="flex cursor-pointer items-center gap-2 font-mono text-meta uppercase tracking-[0.14em] text-muted">
            <TerminalSquare className="h-3.5 w-3.5" /> Setup log
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-meta leading-relaxed text-secondary">
            <code>{job.logs.slice(-24).join("\n")}</code>
          </pre>
        </details>
      ) : null}

      {manual ? (
        <div className="mt-3 rounded-md border border-drift/30 bg-bg/60 p-3">
          <p className="text-sm text-secondary">
            Tell couldn&apos;t auto-run this repo. Start it yourself, then paste the localhost URL — Tell captures it the same way.
          </p>
          {job.detected?.readmeInstructions?.length ? (
            <div className="mt-2">
              <p className="font-mono text-meta uppercase tracking-[0.14em] text-muted">From the README</p>
              <ul className="mt-1 space-y-1">
                {job.detected.readmeInstructions.map((line) => (
                  <li key={line} className="font-mono text-label text-secondary">$ {line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && manualUrl.trim()) onCaptureManual(manualUrl.trim()); }}
              placeholder={guessUrl || "http://localhost:3000"}
              spellCheck={false}
              className="min-w-[220px] flex-1 rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text outline-none placeholder:text-muted"
            />
            <button
              onClick={() => onCaptureManual((manualUrl.trim() || guessUrl))}
              disabled={!manualUrl.trim() && !guessUrl}
              className="rounded-md bg-accent px-3 py-2 font-mono text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
            >
              Capture this URL
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
