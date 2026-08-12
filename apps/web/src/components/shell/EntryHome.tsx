"use client";

import { ArrowUp, FileCode2, Github, ImageIcon, PenLine } from "lucide-react";
import { COMPOSER_STARTER_CHIPS } from "@/lib/composer-starters";
import type { ComposerMode, RecentSession } from "@/lib/recent-sessions";
import { svgSessionThumb } from "@/lib/session-thumb";

// Never show third-party product brands as templates/chips under the composer
// (see composer-brand-denylist.ts). Starters must be Tell specimens only.

const MODES: { id: ComposerMode; label: string; icon: typeof PenLine }[] = [
  { id: "design", label: "Design brief", icon: PenLine },
  { id: "url", label: "Live URL", icon: ImageIcon },
  { id: "github", label: "GitHub", icon: Github },
  { id: "offline", label: "Offline fixture", icon: FileCode2 },
];

export function EntryHome({
  mode,
  onModeChange,
  value,
  onChange,
  onSubmit,
  submitting,
  recent,
  onOpenRecent,
  showAllRecent,
  onToggleShowAll,
}: {
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  recent: RecentSession[];
  onOpenRecent: (session: RecentSession) => void;
  showAllRecent: boolean;
  onToggleShowAll: () => void;
}) {
  const placeholder =
    mode === "design"
      ? "Describe what you want to design — warmer editorial booking site, less shadow…"
      : mode === "github"
        ? "github.com/owner/repo"
        : mode === "offline"
          ? "Load the committed offline demo report (no live capture)"
          : "https://your-app.com or localhost:3001";

  const visible = showAllRecent ? recent : recent.slice(0, 6);

  return (
    <div className="tell-home">
      <div className="tell-home__hero">
        <div className="tell-home__mark" aria-hidden>
          ⊕
        </div>
        <h1 className="tell-home__title">What do you want to design?</h1>
        <p className="tell-home__sub">
          Name the tells on a live product, art-direct a direction, and draft a patch for Cursor — keys stay on
          your machine.
        </p>
      </div>

      <form
        className="tell-composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          className="tell-composer__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          aria-label={mode === "design" ? "Design brief" : "Capture target"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <div className="tell-composer__toolbar">
          <p className="font-mono text-meta text-muted">
            {mode === "offline" ? "No URL needed — submit to open the fixture session" : "⌘/Ctrl + Enter to run"}
          </p>
          <button
            type="submit"
            className="tell-composer__submit"
            disabled={submitting}
            aria-label="Start"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>

      {COMPOSER_STARTER_CHIPS.length > 0 && mode === "design" ? (
        <div className="tell-modes" role="group" aria-label="Starter templates">
          {COMPOSER_STARTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="tell-modes__pill"
              onClick={() => onChange(chip.brief ?? chip.label)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="tell-modes" role="group" aria-label="Composer mode">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              className="tell-modes__pill"
              data-active={mode === m.id ? "true" : "false"}
              onClick={() => onModeChange(m.id)}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {recent.length > 0 ? (
        <section className="tell-recent" aria-label="Recent sessions">
          <div className="tell-recent__head">
            <h2 className="tell-recent__title">Recent diagnoses</h2>
            {recent.length > 6 ? (
              <button
                type="button"
                className="font-mono text-meta text-accent underline-offset-2 hover:underline"
                onClick={onToggleShowAll}
              >
                {showAllRecent ? "Show fewer" : "View all"}
              </button>
            ) : null}
          </div>
          <div className="tell-recent__grid">
            {visible.map((session) => {
              const thumb =
                session.thumbDataUrl ||
                svgSessionThumb({
                  title: session.title,
                  findingCount: session.findingCount,
                  live: session.live,
                  accent: session.mode === "offline" ? "#8A7A68" : "#D4714A",
                });
              return (
              <button
                key={session.id}
                type="button"
                className="tell-recent__card"
                onClick={() => onOpenRecent(session)}
              >
                <div className="tell-recent__thumb" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" className="tell-recent__thumb-img" />
                </div>
                <span className="tell-recent__meta">
                  {session.mode}
                  {typeof session.findingCount === "number" ? ` · ${session.findingCount}` : ""}
                  {session.live === true ? " · live" : ""}
                </span>
                <span className="tell-recent__name">{session.title}</span>
              </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
