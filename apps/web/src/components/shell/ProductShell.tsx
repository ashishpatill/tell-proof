"use client";

import { useState, type ReactNode } from "react";
import { AppShell } from "./AppShell";
import { ProductSidebar, type ProductNavId } from "./ProductSidebar";
import { SettingsDialog } from "./SettingsDialog";
import "./shell.css";

/** Shared product chrome for Home / Showcase / Studio — left sidebar only. */
export function ProductShell({
  active,
  children,
}: {
  active: ProductNavId;
  children: ReactNode;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <AppShell
        rail={
          <ProductSidebar active={active} onSettings={() => setSettingsOpen(true)} />
        }
      >
        {children}
      </AppShell>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
