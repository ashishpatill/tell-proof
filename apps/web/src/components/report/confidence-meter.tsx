"use client";

export function ConfidenceMeter({ value }: { value: number }) {
  const filled = Math.round(value * 5);
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="font-mono text-meta uppercase tracking-[0.12em] text-muted">confidence</span>
      <div className="flex gap-1" aria-label={`Confidence ${Math.round(value * 100)}%`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-2 w-4 rounded-sm ${i < filled ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}
