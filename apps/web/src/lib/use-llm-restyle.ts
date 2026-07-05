"use client";

import { useEffect, useState } from "react";
import type { BrandDNA, CapturePayload, DesignFingerprint } from "@tell/schema";

/** Which sheet the after-pane is currently showing. */
export type RestyleMode = "recipes" | "ai";
/** Lifecycle of the background /api/restyle upgrade for the current direction. */
export type RestyleStatus = "idle" | "pending" | "ready" | "error";

export type LlmSheet = {
  css: string;
  fontImport: string;
  notes: string[];
};

type RestyleResponse =
  | { ok: true; css: string; fontImport: string; cssSource: "llm"; notes: string[] }
  | { ok: false; reason: string };

const DEBOUNCE_MS = 500;

/**
 * Fires POST /api/restyle in the background once a reconciliation is on screen,
 * debounced and abortable, re-firing whenever direction/capture/DNA changes.
 * Never blocks the deterministic sheet: on any failure (network, non-ok, bad
 * payload) it just stays in "error" with no sheet, and the caller keeps
 * rendering the deterministic recipes CSS.
 */
export function useLlmRestyle(params: {
  capture?: CapturePayload;
  fingerprint?: DesignFingerprint;
  directionId: string;
  dna?: BrandDNA;
  enabled: boolean;
}) {
  const { capture, fingerprint, directionId, dna, enabled } = params;
  const [status, setStatus] = useState<RestyleStatus>("idle");
  const [sheet, setSheet] = useState<LlmSheet | null>(null);
  // Explicit user pick for this direction cycle; null = no override yet (auto-follow the fetch).
  const [userMode, setUserMode] = useState<RestyleMode | null>(null);

  useEffect(() => {
    // New direction (or capture/DNA) — drop any prior LLM upgrade and re-fire fresh.
    setStatus("idle");
    setSheet(null);
    setUserMode(null);

    if (!enabled || !capture || !fingerprint || !directionId) return;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setStatus("pending");
      try {
        const res = await fetch("/api/restyle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ capture, fingerprint, directionId, dna }),
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const payload = (await res.json()) as RestyleResponse;
        if (cancelled) return;
        if (!payload.ok) {
          setStatus("error");
          return;
        }
        setSheet({ css: payload.css, fontImport: payload.fontImport ?? "", notes: payload.notes ?? [] });
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
    // capture/fingerprint/dna are stable object references from page state; they
    // only change identity when a real recapture / DNA update happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture, fingerprint, directionId, dna, enabled]);

  // Default to AI-refined the moment it lands, unless the user explicitly flipped back.
  const mode: RestyleMode = userMode ?? (sheet ? "ai" : "recipes");

  return {
    status,
    sheet,
    mode,
    setMode: setUserMode,
    available: status === "ready" && sheet !== null,
  };
}
