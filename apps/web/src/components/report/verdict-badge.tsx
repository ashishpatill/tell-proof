"use client";

import { Check, Eye, Split } from "lucide-react";
import type { Verdict } from "@tell/schema";

export const badgeStyles: Record<Verdict, string> = {
  generic: "border-accent/40 bg-accent/10 text-accent",
  drift: "border-drift/40 bg-drift/10 text-drift",
  intentional: "border-ok/40 bg-ok/10 text-ok",
  uncertain: "border-muted/40 bg-muted/10 text-muted",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const icon = verdict === "intentional" ? <Check className="h-3 w-3" /> : verdict === "drift" ? <Split className="h-3 w-3" /> : <Eye className="h-3 w-3" />;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-meta uppercase tracking-[0.12em] ${badgeStyles[verdict]}`}>
      {icon}
      {verdict}
    </span>
  );
}
