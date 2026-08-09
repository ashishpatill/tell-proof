"use client";

import Link from "next/link";
import {
  FolderKanban,
  HelpCircle,
  Home,
  LayoutTemplate,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

export function EntryNavRail({
  active = "home",
  onHome,
  onSettings,
}: {
  active?: "home" | "project" | "other";
  onHome: () => void;
  onSettings: () => void;
}) {
  return (
    <nav className="tell-rail" aria-label="Tell Proof">
      <Link href="/" className="tell-rail__mark" aria-label="Tell Proof home" onClick={onHome}>
        ⊕
      </Link>
      <button
        type="button"
        className="tell-rail__btn"
        data-active={active === "home" || active === "project" ? "true" : "false"}
        aria-current={active === "home" ? "page" : undefined}
        aria-label="Diagnose home"
        onClick={onHome}
      >
        <Home className="h-4 w-4" />
      </button>
      <Link href="/showcase" className="tell-rail__btn" aria-label="Showcase specimens">
        <FolderKanban className="h-4 w-4" />
      </Link>
      <Link href="/studio" className="tell-rail__btn" aria-label="Studio">
        <Sparkles className="h-4 w-4" />
      </Link>
      <Link href="/kinetic" className="tell-rail__btn" aria-label="Kinetic">
        <Zap className="h-4 w-4" />
      </Link>
      <Link href="/showcase/studio" className="tell-rail__btn" aria-label="Studio specimen">
        <LayoutTemplate className="h-4 w-4" />
      </Link>
      <div className="tell-rail__spacer" />
      <a
        href="https://github.com/ashishpatill/tell-proof"
        className="tell-rail__btn"
        aria-label="Help and repository"
        target="_blank"
        rel="noreferrer"
      >
        <HelpCircle className="h-4 w-4" />
      </a>
      <button type="button" className="tell-rail__btn" aria-label="Settings and keys" onClick={onSettings}>
        <Settings className="h-4 w-4" />
      </button>
    </nav>
  );
}
