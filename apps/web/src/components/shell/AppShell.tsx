"use client";

import type { ReactNode } from "react";
import "./shell.css";

export function AppShell({
  rail,
  tabs,
  children,
}: {
  rail: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="tell-shell">
      {rail}
      <div className="tell-shell__main">
        {tabs}
        <div className="tell-shell__body">{children}</div>
      </div>
    </div>
  );
}
