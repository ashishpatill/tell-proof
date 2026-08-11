"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clipboard, Loader2 } from "lucide-react";
import type { InstallInfo } from "@tell/schema";

type CopyState = "idle" | "copied";

/**
 * Compact Cursor wiring — collapsed by default so the critic rail stays
 * findings-first (Ashish's loop), not MCP install chrome.
 */
export function ConnectAgent() {
  const [info, setInfo] = useState<InstallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deeplinkCopy, setDeeplinkCopy] = useState<CopyState>("idle");
  const [jsonCopy, setJsonCopy] = useState<CopyState>("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/install-info");
        if (!res.ok) throw new Error(`install-info ${res.status}`);
        const data = (await res.json()) as InstallInfo;
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load install info");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyText = useCallback(async (text: string, which: "deeplink" | "json") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "deeplink") {
        setDeeplinkCopy("copied");
        setTimeout(() => setDeeplinkCopy("idle"), 2000);
      } else {
        setJsonCopy("copied");
        setTimeout(() => setJsonCopy("idle"), 2000);
      }
    } catch {
      /* clipboard denied — silent */
    }
  }, []);

  const cursorJson = info ? JSON.stringify(info.mcp.cursor, null, 2) : "";

  return (
    <details
      className="group rounded-md border border-border/70 bg-surface/60 open:bg-surface"
      data-testid="connect-agent"
    >
      <summary className="cursor-pointer list-none px-3 py-2 font-mono text-meta text-muted transition hover:text-secondary [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span>
            <span className="text-secondary">Wire Cursor</span>
            <span className="text-muted"> — MCP when you want the agent path</span>
          </span>
          <span className="text-muted transition group-open:rotate-90" aria-hidden>
            ›
          </span>
        </span>
      </summary>

      <div className="border-t border-border/70 px-3 py-3">
        {loading ? (
          <p className="flex items-center gap-2 font-mono text-meta text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Loading…
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-drift/40 bg-drift/10 px-3 py-2 text-sm text-drift">{error}</p>
        ) : null}

        {info ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyText(info.deeplink.cursor, "deeplink")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {deeplinkCopy === "copied" ? (
                <Check className="h-3.5 w-3.5 text-ok" aria-hidden />
              ) : (
                <Clipboard className="h-3.5 w-3.5" aria-hidden />
              )}
              {deeplinkCopy === "copied" ? "Copied" : "Deeplink"}
            </button>
            <button
              type="button"
              onClick={() => copyText(cursorJson, "json")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {jsonCopy === "copied" ? (
                <Check className="h-3.5 w-3.5 text-ok" aria-hidden />
              ) : (
                <Clipboard className="h-3.5 w-3.5" aria-hidden />
              )}
              {jsonCopy === "copied" ? "Copied" : "JSON"}
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
