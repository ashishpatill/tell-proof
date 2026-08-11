"use client";

import { Clipboard, GitPullRequest, Loader2, ShieldCheck } from "lucide-react";
import type { RedesignProposal } from "@tell/schema";
import type { DraftState, ProofState, SourceContext } from "@/components/report/types";

export function DiffViewer({
  proposal,
  draftState,
  sourceContext,
  patchSource,
  proofState,
  proofError,
  canProve,
  onCopy,
  onApply,
}: {
  proposal: RedesignProposal;
  draftState: DraftState;
  sourceContext: SourceContext | null;
  patchSource?: "cursor" | "deterministic" | null;
  proofState: ProofState;
  proofError: string;
  canProve: boolean;
  onCopy: () => void;
  onApply: () => void;
}) {
  const patch = proposal.files.map((file) => file.unifiedDiff).join("\n\n");
  const proving = proofState === "applying" || proofState === "verifying";
  const patchLabel =
    sourceContext?.mode === "repo"
      ? "Source-grounded patch"
      : patchSource === "cursor"
        ? "Cursor patch"
        : "Deterministic patch";

  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-md border border-border bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            {patchLabel} · {proposal.files.length} file{proposal.files.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 break-words text-sm text-secondary">{proposal.files[0]?.summary}</p>
          {sourceContext?.mode === "repo" ? (
            <p className="mt-1 break-words font-mono text-meta text-muted">
              Read {sourceContext.filesLoaded}/{sourceContext.filesDiscovered} project files · evidence matched {sourceContext.matchedFiles} · {Math.round(sourceContext.totalBytes / 1024)}KB context
            </p>
          ) : patchSource === "deterministic" ? (
            <p className="mt-1 break-words font-mono text-meta text-muted">
              Contrast-grounded override sheet — set CURSOR_API_KEY for agent-drafted source diffs
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs text-secondary transition hover:text-text">
            <Clipboard className="h-3.5 w-3.5" /> {draftState === "copied" ? "Copied" : "Copy patch"}
          </button>
          <button
            onClick={onApply}
            disabled={proving || proofState === "passed" || proofState === "review" || proofState === "failed"}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 font-mono text-xs font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {proving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : canProve ? <ShieldCheck className="h-3.5 w-3.5" /> : <GitPullRequest className="h-3.5 w-3.5" />}
            {proofState === "applying"
              ? "Applying in worktree…"
              : proofState === "verifying"
                ? "Recapturing…"
                : canProve
                  ? "Run & prove"
                  : "Send to Cursor"}
          </button>
        </div>
      </div>
      {canProve ? (
        <div className="flex items-center gap-2 border-b border-border bg-ok/5 px-3 py-2 font-mono text-meta text-secondary">
          <ShieldCheck className="h-3.5 w-3.5 text-ok" />
          Applies only to Tell&apos;s disposable clone · hot reloads · captures again · checks score and focus states
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-border bg-accent/5 px-3 py-2 font-mono text-meta text-secondary">
          <GitPullRequest className="h-3.5 w-3.5 text-accent" />
          Send to Cursor copies a prompt plus diff for the local repo. No fragile editor deep link required.
        </div>
      )}
      {proofError ? <p className="border-b border-drift/30 bg-drift/10 px-3 py-2 font-mono text-meta text-drift">{proofError}</p> : null}
      <pre className="max-h-80 overflow-auto p-4 text-left font-mono text-meta leading-relaxed text-secondary">
        <code>{patch}</code>
      </pre>
    </section>
  );
}
