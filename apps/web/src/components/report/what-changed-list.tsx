"use client";

/** Compact "what the direction actually did" bullets — narration for the demo, not a diff. */
export function WhatChangedList({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">What changed</p>
      <ul className="mt-2 space-y-1.5">
        {notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
