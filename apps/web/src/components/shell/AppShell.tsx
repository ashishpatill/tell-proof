"use client";

import type { ReactNode } from "react";
import "./shell.css";

export function AppShell({
  rail,
  children,
}: {
  rail: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="tell-shell">
      {rail}
      <div className="tell-shell__main">
        <div className="tell-shell__body">{children}</div>
      </div>
    </div>
  );
}
