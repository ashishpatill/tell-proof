"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { ByokConfig, clearByok, loadByok, saveByok, byokHeaders } from "@/lib/byok";
import {
  formatCaptureHealth,
  type CaptureHealthPayload,
} from "@/lib/capture-honesty";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const [config, setConfig] = useState<ByokConfig>({});
  const [saved, setSaved] = useState(false);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [captureHealth, setCaptureHealth] = useState<CaptureHealthPayload | null>(null);
  const [captureHealthState, setCaptureHealthState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    setConfig(loadByok());
    setSaved(false);
    setTestState("idle");
    setTestMessage("");
    setCaptureHealth(null);
    setCaptureHealthState("loading");
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/health/capture", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as CaptureHealthPayload;
        if (cancelled) return;
        setCaptureHealth(data);
        setCaptureHealthState("idle");
      } catch {
        if (cancelled) return;
        setCaptureHealth(null);
        setCaptureHealthState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    saveByok(config);
    setSaved(true);
  };

  const testVoice = async () => {
    setTestState("testing");
    setTestMessage("");
    try {
      saveByok(config);
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: byokHeaders(),
        body: JSON.stringify({ transcript: "warmer, more editorial, less shadow" }),
      });
      if (!res.ok) throw new Error(`Voice API ${res.status}`);
      const data = (await res.json()) as { source?: string; presetId?: string };
      setTestState("ok");
      setTestMessage(
        data.source === "gemini"
          ? `Gemini connected · preset ${data.presetId ?? "ok"}`
          : "Deterministic parse OK (no Gemini key — still works)",
      );
    } catch (error) {
      setTestState("error");
      setTestMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const captureLine = formatCaptureHealth(captureHealth, captureHealthState);
  const captureOk = captureHealthState === "idle" && captureHealth?.ok === true;

  return (
    <div className="tell-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="tell-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tell-dialog__head">
          <div>
            <h2 id={titleId} className="font-display text-2xl text-text">
              Keys &amp; integrations
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Bring your own keys. Stored only in this browser. Capture, detect, and reconcile need none.
            </p>
          </div>
          <button
            type="button"
            className="tell-rail__btn"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label htmlFor="tell-byok-gemini">
          Gemini API key
          <input
            id="tell-byok-gemini"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={config.geminiApiKey ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, geminiApiKey: e.target.value }))}
            placeholder="Optional — taste & voice refinement"
          />
        </label>

        <label htmlFor="tell-byok-cursor">
          Cursor API key
          <input
            id="tell-byok-cursor"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={config.cursorApiKey ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, cursorApiKey: e.target.value }))}
            placeholder="Optional — richer patch drafts"
          />
        </label>

        <p
          className={`mt-4 rounded-md border px-3 py-2 font-mono text-meta ${
            captureOk
              ? "border-ok/30 bg-ok/10 text-secondary"
              : captureHealthState === "loading"
                ? "border-border bg-bg/40 text-muted"
                : "border-drift/30 bg-drift/10 text-secondary"
          }`}
          role="status"
          aria-live="polite"
        >
          {captureLine}
        </p>
        <p className="mt-2 font-mono text-meta text-muted">
          Live capture uses server Playwright (or{" "}
          <code className="text-secondary">TELL_CAPTURE_API_URL</code>). Browser settings do not override
          that URL.
        </p>

        <p className="mt-4 rounded-md border border-border bg-bg/40 px-3 py-2 font-mono text-meta text-secondary">
          Deterministic core (capture → fingerprint → detect → reconcile) makes zero LLM calls. Missing
          Gemini or Cursor keys fall back to local parsers — not a live-capture substitute. Offline fixture
          is opt-in only.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-accent px-3 py-2 font-semibold text-white transition hover:bg-accent-hover"
          >
            {saved ? "Saved" : "Save keys"}
          </button>
          <button
            type="button"
            onClick={() => {
              void testVoice();
            }}
            disabled={testState === "testing"}
            className="rounded-md border border-border px-3 py-2 text-secondary transition hover:text-text disabled:opacity-60"
          >
            {testState === "testing" ? "Testing…" : "Test voice"}
          </button>
          <button
            type="button"
            onClick={() => {
              clearByok();
              setConfig({});
              setSaved(false);
            }}
            className="rounded-md border border-border px-3 py-2 text-secondary transition hover:text-text"
          >
            Clear
          </button>
        </div>
        {testMessage ? (
          <p
            className={`mt-3 font-mono text-meta ${
              testState === "error" ? "text-drift" : "text-secondary"
            }`}
          >
            {testMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
