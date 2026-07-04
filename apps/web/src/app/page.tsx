"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Mic, Split, Wand2 } from "lucide-react";
import { demoReport } from "@/lib/demo-report";

const badgeStyles = {
  generic: "border-accent/40 bg-accent/10 text-accent",
  drift: "border-drift/40 bg-drift/10 text-drift",
  intentional: "border-ok/40 bg-ok/10 text-ok",
  uncertain: "border-muted/40 bg-muted/10 text-muted",
};

export default function HomePage() {
  const [selectedId, setSelectedId] = useState(demoReport.findings[0]?.id ?? "");
  const [seam, setSeam] = useState(52);
  const [direction, setDirection] = useState("editorial-warm");
  const selectedFinding = demoReport.findings.find((finding) => finding.id === selectedId) ?? demoReport.findings[0];
  const verdict = demoReport.verdicts.find((item) => item.findingId === selectedFinding?.id);
  const scoreLine = `${demoReport.score.total} findings · ${demoReport.score.generic} generic · ${demoReport.score.drift} drift · ${demoReport.score.intentional} intentional`;
  const grouped = useMemo(() => demoReport.findings, []);

  return (
    <main className="min-h-screen px-6 py-5 text-text">
      <header className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full border border-accent/50 bg-accent/10 font-mono text-accent">⊕</div>
          <div>
            <p className="font-display text-3xl leading-none">Tell</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">Every AI-built UI has a tell</p>
          </div>
        </div>
        <div className="ml-auto flex min-w-[320px] flex-1 items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 font-mono text-sm text-secondary">
          <span className="text-muted">url</span>
          <span className="truncate">{demoReport.capture.url}</span>
        </div>
        <button className="rounded-md bg-accent px-4 py-2 font-semibold text-white transition hover:opacity-90 active:scale-[0.99]">
          Capture
        </button>
        <span className="rounded-full border border-ok/40 bg-ok/10 px-3 py-2 font-mono text-xs text-ok">● MCP connected</span>
      </header>

      <section className="grid gap-6 py-8 lg:grid-cols-[1.4fr_.8fr]">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Rendered surface</p>
            <h1 className="mt-2 max-w-3xl font-display text-6xl leading-[0.95] text-text">
              Priya shipped fast. Tell shows why it still feels generic.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-secondary">
              Capture the real page, name the tells, drag the redesign seam, and apply the patch in Cursor before tomorrow's demo.
            </p>
          </div>

          <section className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">{scoreLine}</p>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
                direction: {direction}
              </span>
            </div>
            <BeforeAfterSeam seam={seam} setSeam={setSeam} />
          </section>

          <section className="rounded-card border border-border bg-surface p-4">
            <div className="mb-4 flex items-center gap-2">
              <Mic className="h-4 w-4 text-accent" />
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Voice director</p>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-md border border-border bg-bg px-4 py-3 text-secondary">
                Describe the direction — warmer, more editorial, less shadow…
              </div>
              <div className="flex flex-wrap gap-2">
                {["editorial-warm", "precision-instrument", "warm-minimal", "bold-contrast"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDirection(preset)}
                    className="rounded-full border border-border px-3 py-2 font-mono text-xs text-secondary transition hover:border-accent hover:text-accent"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-secondary">Findings</p>
            <div className="space-y-2">
              {grouped.map((finding) => {
                const itemVerdict = demoReport.verdicts.find((item) => item.findingId === finding.id)?.verdict ?? "uncertain";
                return (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedId(finding.id)}
                    className={`w-full rounded-md border p-3 text-left transition hover:border-accent ${
                      selectedId === finding.id ? "border-accent bg-accent/10" : "border-border bg-bg/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm">{finding.detector}</span>
                      <VerdictBadge verdict={itemVerdict} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-secondary">
                      {demoReport.verdicts.find((item) => item.findingId === finding.id)?.rationale}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedFinding && verdict ? (
            <section className="rounded-card border border-accent/40 bg-surface-raised p-5 shadow-signal">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-mono text-lg">{selectedFinding.detector}</h2>
                <VerdictBadge verdict={verdict.verdict} />
              </div>
              <p className="mt-4 text-secondary">{verdict.rationale}</p>
              <div className="mt-5 rounded-md border border-border bg-bg p-4">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Evidence</p>
                {selectedFinding.evidence.map((evidence) => (
                  <p key={`${evidence.label}-${evidence.value}`} className="mt-2 font-mono text-sm text-secondary">
                    <span className="text-accent">⊕</span> {evidence.label}: {evidence.value}
                  </p>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-white">
                  <Wand2 className="h-4 w-4" /> Draft fix
                </button>
                <button className="rounded-md border border-border px-4 py-2 text-secondary hover:text-text">Mark intentional</button>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function VerdictBadge({ verdict }: { verdict: keyof typeof badgeStyles }) {
  const icon = verdict === "intentional" ? <Check className="h-3 w-3" /> : verdict === "drift" ? <Split className="h-3 w-3" /> : <Eye className="h-3 w-3" />;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${badgeStyles[verdict]}`}>
      {icon}
      {verdict}
    </span>
  );
}

function BeforeAfterSeam({ seam, setSeam }: { seam: number; setSeam: (value: number) => void }) {
  return (
    <div className="relative h-[430px] overflow-hidden rounded-card border border-border bg-bg">
      <div className="demo-before absolute inset-0 grid place-items-center text-center">
        <div className="max-w-xl px-8">
          <p className="demo-before-pill mx-auto mb-4 w-fit rounded-full px-4 py-2 font-sans text-sm">🚀 AI-powered analytics</p>
          <h2 className="font-sans text-5xl font-bold tracking-tight text-white">Ship insights faster ✨</h2>
          <p className="demo-before-copy mt-4 text-lg">A beautiful dashboard for modern teams.</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="demo-before-card rounded-lg p-5">
                <p className="demo-before-card-copy">📊 Metric</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${seam}%)` }}>
        <div className="demo-after grid h-full place-items-center">
          <div className="max-w-2xl px-10 text-left">
            <p className="demo-after-muted font-mono text-xs uppercase tracking-[0.16em]">Partner-ready intelligence</p>
            <h2 className="mt-3 font-display text-6xl leading-none">Insight that feels considered.</h2>
            <p className="demo-after-copy mt-5 max-w-lg text-lg">Warm editorial hierarchy, one human accent, and depth used with restraint.</p>
          </div>
        </div>
      </div>
      <input
        aria-label="Move before and after seam"
        type="range"
        min="18"
        max="82"
        value={seam}
        onChange={(event) => setSeam(Number(event.target.value))}
        className="absolute bottom-5 left-1/2 z-20 w-64 -translate-x-1/2"
        style={{ accentColor: "rgb(var(--accent))" }}
      />
      <div className="absolute top-0 z-10 h-full w-1 bg-accent" style={{ left: `${seam}%` }} />
      <span className="absolute left-4 top-4 font-mono text-xs uppercase tracking-[0.16em] text-white/70">Before</span>
      <span className="absolute right-4 top-4 font-mono text-xs uppercase tracking-[0.16em] text-[#181614]/70">After</span>
    </div>
  );
}
