"use client";

import Link from "next/link";
import {
  FolderKanban,
  Home,
  Settings,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import type { WorkspaceTab } from "./WorkspaceTabsBar";

export type ProductNavId = "home" | "showcase";

/**
 * Single app chrome: left sidebar only.
 * Features: Home (diagnose + create), Showcase (specimens).
 * Site creation runs implicitly from Home — no Studio control panel in nav.
 */
export function ProductSidebar({
  active,
  onHome,
  onSettings,
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
  focusCanvas,
  onToggleFocus,
}: {
  active: ProductNavId;
  onHome?: () => void;
  onSettings: () => void;
  sessions?: WorkspaceTab[];
  activeSessionId?: string;
  onSelectSession?: (id: string) => void;
  onCloseSession?: (id: string) => void;
  focusCanvas?: boolean;
  onToggleFocus?: () => void;
}) {
  return (
    <nav className="tell-rail" aria-label="Tell app" data-testid="product-sidebar">
      <Link
        href="/"
        className="tell-rail__brand"
        aria-label="Tell home"
        onClick={onHome}
      >
        <span className="tell-rail__mark" aria-hidden>
          ⊕
        </span>
        <span className="tell-rail__brand-text">
          <span className="tell-rail__brand-name">Tell</span>
          <span className="tell-rail__brand-meta">Proof</span>
        </span>
      </Link>

      <div className="tell-rail__section" aria-label="Features">
        <Link
          href="/"
          className="tell-rail__link"
          data-active={active === "home" ? "true" : "false"}
          aria-current={active === "home" ? "page" : undefined}
          onClick={onHome}
        >
          <Home className="tell-rail__icon" aria-hidden />
          <span className="tell-rail__label">Home</span>
        </Link>
        <Link
          href="/showcase"
          className="tell-rail__link"
          data-active={active === "showcase" ? "true" : "false"}
          aria-current={active === "showcase" ? "page" : undefined}
        >
          <FolderKanban className="tell-rail__icon" aria-hidden />
          <span className="tell-rail__label">Showcase</span>
        </Link>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="tell-rail__sessions" aria-label="Open sessions">
          <p className="tell-rail__section-label">Sessions</p>
          <ul className="tell-rail__session-list">
            {sessions.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  className="tell-rail__session"
                  data-active={activeSessionId === tab.id ? "true" : "false"}
                  aria-current={activeSessionId === tab.id ? "true" : undefined}
                  title={tab.title}
                  onClick={() => onSelectSession?.(tab.id)}
                >
                  <span className="tell-rail__session-title">{tab.title}</span>
                  {!tab.pinned ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className="tell-rail__session-close"
                      aria-label={`Close ${tab.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseSession?.(tab.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onCloseSession?.(tab.id);
                        }
                      }}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="tell-rail__spacer" />

      <div className="tell-rail__footer">
        {onToggleFocus ? (
          <button
            type="button"
            className="tell-rail__link"
            aria-label={focusCanvas ? "Show critic pane" : "Focus canvas"}
            onClick={onToggleFocus}
          >
            {focusCanvas ? (
              <Minimize2 className="tell-rail__icon" aria-hidden />
            ) : (
              <Maximize2 className="tell-rail__icon" aria-hidden />
            )}
            <span className="tell-rail__label">{focusCanvas ? "Split view" : "Focus canvas"}</span>
          </button>
        ) : null}
        <button
          type="button"
          className="tell-rail__link"
          aria-label="Settings and keys"
          onClick={onSettings}
        >
          <Settings className="tell-rail__icon" aria-hidden />
          <span className="tell-rail__label">Settings</span>
        </button>
      </div>
    </nav>
  );
}
