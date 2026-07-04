"use client";

import { useCallback, useState } from "react";
import { Check, Eye, Mic, MicOff, Split, Wand2 } from "lucide-react";
import type { ArtDirection, TellReport, Verdict } from "@tell/schema";
import { DIRECTION_PRESETS, parseDirection } from "@tell/taste";
import { demoReport } from "@/lib/demo-report";
import { BeforeAfterSeam } from "@/components/BeforeAfterSeam";
import { useVoice } from "@/lib/use-voice";

const badgeStyles: Record<Verdict, string> = {
  generic: "border-accent/40 bg-accent/10 text-accent",
  drift: "border-drift/40 bg-drift/10 text-drift",
  intentional: "border-ok/40 bg-ok/10 text-ok",
  uncertain: "border-muted/40 bg-muted/10 text-muted",
};

const PRESET_CHIPS: { key: keyof typeof DIRECTION_PRESETS; label: string }[] = [
  { key: "editorial", label: "Editorial" },
  { key: "precision", label: "Precision instrument" },
  { key: "warm-minimal", label: "Warm minimal" },
  { key: "bold-contrast", label: "Bold contrast" },
];

type CaptureState = "idle" | "capturing" | "done";

export default function HomePage() {
  const [report, setReport] = useState<TellReport>(demoReport);
  const [selectedId, setSelectedId] = useState(demoReport.findings[0]?.id ?? "");
  const [seam, setSeam] = useState(52);
  const [activeDirection, setActiveDirection] = useState<ArtDirection>(DIRECTION_PRESETS.editorial);
  const [captureState, setCaptureState] = useState<CaptureState>("done");
  const [captureNote, setCaptureNote] = useState("");

  const verdictOf = useCallback(
    (id: string): Verdict => report.verdicts.find((v) => v.findingId === id)?.verdict ?? "uncertain",
    [report],
  );

  const applyTranscript = useCallback((text: string) => {
    if (text.trim().length < 2) return;
    setActiveDirection(parseDirection(text));
  }, []);

  const voice = useVoice(applyTranscript);

  const selectedFinding = report.findings.find((f) => f.id === selectedId) ?? report.findings[0];
  const verdict = report.verdicts.find((v) => v.findingId === selectedFinding?.id);
  const s = report.score;
  const scoreLine = `${s.total} findings · ${s.generic} generic · ${s.drift} drift · ${s.intentional} intentional`;

  async function runCapture() {
    setCaptureState("capturing");
    setCaptureNote("reading computed styles…");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: report.capture.url }),
      });
      const next = (await res.json()) as TellReport;
      setCaptureNote("detecting tells…");
      setReport(next);
      setSelectedId(next.findings[0]?.id ?? "");
      setCaptureState("done");
    } catch {
      setCaptureNote("Capture failed — showing the last committed report.");
      setCaptureState("done");
    }
  }

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
          <span className="truncate">{report.capture.url}</span>
        </div>
        <button
          onClick={runCapture}
          disabled={captureState === "capturing"}
          className="rounded-md bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
        >
          {captureState === "capturing" ? "Capturing…" : "Capture"}
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
              Capture the real page, name the tells, drag the redesign seam, and apply the patch in Cursor before tomorrow&apos;s demo.
            </p>
          </div>

          <section className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary" aria-live="polite">
                {captureState === "capturing" ? captureNote : scoreLine}
              </p>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
                direction: {activeDirection.id}
              </span>
            </div>
            <BeforeAfterSeam
              seam={seam}
              setSeam={setSeam}
              findings={report.findings}
              verdictOf={verdictOf}
              activeDirection={activeDirection}
              selectedId={selectedId}
              onSelectFinding={setSelectedId}
            />
            <p className="mt-2 font-mono text-[11px] text-muted">
              Drag the seam · ←/→ to nudge · double-click to reset · click a proof mark to inspect its finding
            </p>
          </section>

          <section className="rounded-card border border-border bg-surface p-4">
            <div className="mb-4 flex items-center gap-2">
              <Mic className="h-4 w-4 text-accent" />
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Voice director</p>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="flex items-center gap-3 rounded-md border border-border bg-bg px-4 py-3 text-secondary">
                {voice.supported ? (
                  <button
                    onClick={voice.listening ? voice.stop : voice.start}
                    aria-label={voice.listening ? "Stop listening" : "Start voice direction"}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                      voice.listening ? "animate-pulse border-accent bg-accent/20 text-accent" : "border-border text-secondary hover:border-accent hover:text-accent"
                    }`}
                  >
                    {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                ) : null}
                <span className="truncate">
                  {voice.transcript || (voice.listening ? "Listening…" : "Describe the direction — warmer, more editorial, less shadow…")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_CHIPS.map((chip) => {
                  const active = activeDirection.id === DIRECTION_PRESETS[chip.key].id;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setActiveDirection(DIRECTION_PRESETS[chip.key])}
                      className={`rounded-full border px-3 py-2 font-mono text-xs transition ${
                        active ? "border-accent bg-accent/10 text-accent" : "border-border text-secondary hover:border-accent hover:text-accent"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {!voice.supported ? (
              <p className="mt-2 font-mono text-[11px] text-muted">Voice input needs a Chromium browser — use the presets as the text equivalent.</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-secondary">Findings</p>
            <div className="space-y-2">
              {report.findings.map((finding) => {
                const itemVerdict = verdictOf(finding.id);
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
                      {report.verdicts.find((v) => v.findingId === finding.id)?.rationale}
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
              <ConfidenceMeter value={verdict.confidence} />
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
                <button className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accent-hover">
                  <Wand2 className="h-4 w-4" /> Draft fix
                </button>
                <button className="rounded-md border border-border px-4 py-2 text-secondary transition hover:text-text">Mark intentional</button>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const icon = verdict === "intentional" ? <Check className="h-3 w-3" /> : verdict === "drift" ? <Split className="h-3 w-3" /> : <Eye className="h-3 w-3" />;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${badgeStyles[verdict]}`}>
      {icon}
      {verdict}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const filled = Math.round(value * 5);
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">confidence</span>
      <div className="flex gap-1" aria-label={`Confidence ${Math.round(value * 100)}%`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-2 w-4 rounded-sm ${i < filled ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}
