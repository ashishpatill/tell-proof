"use client";

type SiteCreateResult = {
  previewHtml: string;
  productName: string;
  siteKind: string;
  summary: string;
  routedSkills: string[];
};

/** Read-only site preview after implicit create finishes — no controls until complete. */
export function SiteCreateCanvas({
  result,
  creating,
}: {
  result: SiteCreateResult | null;
  creating?: boolean;
}) {
  if (creating && !result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-sm text-secondary" data-testid="site-create-waiting">
        Tell is composing the site — stay on this page until the preview lands.
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="site-create-canvas">
      <div className="border-b border-border px-4 py-3">
        <p className="font-mono text-meta uppercase tracking-[0.14em] text-secondary">Created site</p>
        <h2 className="mt-1 font-display text-xl text-text">{result.productName}</h2>
        <p className="mt-1 text-sm text-secondary">{result.summary}</p>
        <p className="mt-2 font-mono text-meta text-muted">
          {result.siteKind} · {result.routedSkills.slice(0, 6).join(" · ")}
          {result.routedSkills.length > 6 ? "…" : ""}
        </p>
      </div>
      <iframe
        title={`${result.productName} preview`}
        srcDoc={result.previewHtml}
        className="min-h-[70vh] w-full flex-1 border-0 bg-surface"
        data-testid="site-create-frame"
      />
    </div>
  );
}
