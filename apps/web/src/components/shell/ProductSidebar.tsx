"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FolderKanban,
  Home,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import type { WorkspaceTab } from "./WorkspaceTabsBar";

export type ProductNavId = "home" | "showcase" | "studio";

const COLLAPSE_DELAY_MS = 320;
const PIN_KEY = "tell:rail-pinned";

/**
 * Single app chrome: left sidebar only.
 * Collapses to icons when idle; expands on hover / focus / pin.
 * Specimens live on /showcase — not listed here.
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
  const [pinned, setPinned] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = pinned || expanded;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PIN_KEY);
      if (stored === "1") {
        setPinned(true);
        setExpanded(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const clearLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const openRail = useCallback(() => {
    clearLeave();
    setExpanded(true);
  }, [clearLeave]);

  const scheduleClose = useCallback(() => {
    clearLeave();
    if (pinned) return;
    leaveTimer.current = setTimeout(() => setExpanded(false), COLLAPSE_DELAY_MS);
  }, [clearLeave, pinned]);

  useEffect(() => () => clearLeave(), [clearLeave]);

  const togglePin = () => {
    setPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PIN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next) setExpanded(true);
      return next;
    });
  };

  return (
    <nav
      className="tell-rail"
      aria-label="Tell app"
      data-testid="product-sidebar"
      data-expanded={open ? "true" : "false"}
      data-pinned={pinned ? "true" : "false"}
      onMouseEnter={openRail}
      onMouseLeave={scheduleClose}
      onFocusCapture={openRail}
      onBlurCapture={(e) => {
        const next = e.relatedTarget;
        if (next instanceof Node && e.currentTarget.contains(next)) return;
        scheduleClose();
      }}
    >
      <Link
        href="/"
        className="tell-rail__brand"
        aria-label="Tell home"
        title="Tell"
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
          aria-label="Home"
          title="Home"
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
          aria-label="Showcase"
          title="Showcase"
        >
          <FolderKanban className="tell-rail__icon" aria-hidden />
          <span className="tell-rail__label">Showcase</span>
        </Link>
        <Link
          href="/studio"
          className="tell-rail__link"
          data-active={active === "studio" ? "true" : "false"}
          aria-current={active === "studio" ? "page" : undefined}
          aria-label="Studio"
          title="Studio"
        >
          <Sparkles className="tell-rail__icon" aria-hidden />
          <span className="tell-rail__label">Studio</span>
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
        <button
          type="button"
          className="tell-rail__link"
          aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          aria-pressed={pinned}
          title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          onClick={togglePin}
        >
          {pinned ? (
            <PanelLeftClose className="tell-rail__icon" aria-hidden />
          ) : (
            <PanelLeft className="tell-rail__icon" aria-hidden />
          )}
          <span className="tell-rail__label">{pinned ? "Unpin" : "Pin open"}</span>
        </button>
        {onToggleFocus ? (
          <button
            type="button"
            className="tell-rail__link"
            aria-label={focusCanvas ? "Show critic pane" : "Focus canvas"}
            title={focusCanvas ? "Show critic pane" : "Focus canvas"}
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
          title="Settings"
          onClick={onSettings}
        >
          <Settings className="tell-rail__icon" aria-hidden />
          <span className="tell-rail__label">Settings</span>
        </button>
      </div>
    </nav>
  );
}
