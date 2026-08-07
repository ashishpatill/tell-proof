"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clipboard, Loader2, TerminalSquare } from "lucide-react";
import type { InstallInfo } from "@tell/schema";

type CopyState = "idle" | "copied";

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
    <section
      className="rounded-card border border-border bg-surface p-4"
      aria-labelledby="connect-agent-heading"
      data-testid="connect-agent"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
          <TerminalSquare className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="connect-agent-heading" className="font-display text-lg text-text">
            Connect Agent
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Wire Tell into Cursor in one click — then ask your agent to diagnose a URL without hunting MCP config.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 font-mono text-meta text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading install snippets…
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-drift/40 bg-drift/10 px-3 py-2 text-sm text-drift">{error}</p>
      ) : null}

      {info ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyText(info.deeplink.cursor, "deeplink")}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {deeplinkCopy === "copied" ? (
              <Check className="h-4 w-4 text-ok" aria-hidden />
            ) : (
              <Clipboard className="h-4 w-4" aria-hidden />
            )}
            {deeplinkCopy === "copied" ? "Deeplink copied" : "Copy Cursor deeplink"}
          </button>
          <button
            type="button"
            onClick={() => copyText(cursorJson, "json")}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {jsonCopy === "copied" ? (
              <Check className="h-4 w-4 text-ok" aria-hidden />
            ) : (
              <Clipboard className="h-4 w-4" aria-hidden />
            )}
            {jsonCopy === "copied" ? "JSON copied" : "Copy Cursor JSON"}
          </button>
          <span className="self-center font-mono text-meta text-muted">
            {info.mcp.tools.length} MCP tools · fixture {info.demo.fixtureUrl}
          </span>
        </div>
      ) : null}
    </section>
  );
}
