"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { ByokConfig, clearByok, loadByok, saveByok, byokHeaders } from "@/lib/byok";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const [config, setConfig] = useState<ByokConfig>({});
  const [saved, setSaved] = useState(false);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setConfig(loadByok());
    setSaved(false);
    setTestState("idle");
    setTestMessage("");
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

        <label htmlFor="tell-byok-capture">
          Capture API URL
          <input
            id="tell-byok-capture"
            type="url"
            spellCheck={false}
            value={config.captureApiUrl ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, captureApiUrl: e.target.value }))}
            placeholder="Optional override (else server env)"
          />
        </label>

        <p className="mt-4 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 font-mono text-meta text-secondary">
          Deterministic core (capture → fingerprint → detect → reconcile) makes zero LLM calls. Missing keys fall
          back to local parsers and offline fixtures.
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
