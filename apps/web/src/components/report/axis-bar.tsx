"use client";

export function AxisBar({ before, after }: { before: number; after: number }) {
  // Axes are 0..1 QUALITY (higher = better). Ghost = before, filled = after.
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/60">
      <span className="absolute inset-y-0 left-0 rounded-full bg-secondary/40" style={{ width: `${Math.round(before * 100)}%` }} />
      <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.round(after * 100)}%` }} />
    </div>
  );
}
