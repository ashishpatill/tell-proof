"use client";

import { AlertTriangle, Check, Loader2 } from "lucide-react";
import type { UiNotice } from "@/components/report/types";

export function ToastNotice({ notice, onClose }: { notice: UiNotice; onClose: () => void }) {
  const tone =
    notice.tone === "success"
      ? "border-ok/40 bg-ok/10 text-ok"
      : notice.tone === "error"
        ? "border-drift/40 bg-drift/10 text-drift"
        : "border-accent/40 bg-accent/10 text-accent";
  const Icon = notice.tone === "success" ? Check : notice.tone === "error" ? AlertTriangle : Loader2;
  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-md rounded-card border p-4 shadow-signal ${tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${notice.tone === "info" ? "animate-spin" : ""}`} />
        <div className="min-w-0">
          <p className="font-mono text-sm text-text">{notice.title}</p>
          <p className="mt-1 text-sm text-secondary">{notice.message}</p>
        </div>
        <button onClick={onClose} className="ml-2 font-mono text-xs text-muted transition hover:text-text" aria-label="Dismiss notice">
          dismiss
        </button>
      </div>
    </div>
  );
}
