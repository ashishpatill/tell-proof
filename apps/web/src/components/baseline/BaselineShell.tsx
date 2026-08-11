"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { LIVE_MATCHES, type LiveMatch } from "./data";

export type BaselineRouteId =
  | "home"
  | "live"
  | "scorecard"
  | "series"
  | "rankings"
  | "notebook";

export const BASELINE_NAV: Array<{ id: BaselineRouteId; href: string; label: string }> = [
  { id: "home", href: "/baseline", label: "Home" },
  { id: "live", href: "/baseline/live", label: "Live" },
  { id: "scorecard", href: "/baseline/scorecard", label: "Scorecard" },
  { id: "series", href: "/baseline/series", label: "Tournaments" },
  { id: "rankings", href: "/baseline/rankings", label: "Rankings" },
  { id: "notebook", href: "/baseline/notebook", label: "Notebook" },
];

function statusLabel(status: LiveMatch["status"]): string {
  if (status === "live") return "Live";
  if (status === "result") return "Result";
  return "Upcoming";
}

function chipScore(m: LiveMatch): string {
  if (m.status === "upcoming") return m.start ?? "Soon";
  if (m.status === "result") {
    return `${m.playerA.setsWon}–${m.playerB.setsWon}`;
  }
  return `${m.playerA.games}-${m.playerB.games} · ${m.playerA.points}-${m.playerB.points}`;
}

export function BaselineShell({
  active,
  children,
}: {
  active: BaselineRouteId;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();

  return (
    <div className="bl-root" data-testid="baseline-site" data-baseline-route={active}>
      <a className="bl-skip" href="#main">
        Skip to content
      </a>

      <div className="bl-atmosphere" aria-hidden="true">
        <span className="bl-haze" />
        <span className="bl-mote bl-mote-a" />
        <span className="bl-mote bl-mote-b" />
        <span className="bl-mote bl-mote-c" />
      </div>

      <header className="bl-nav">
        <div className="bl-nav-inner">
          <Link className="bl-brand" href="/baseline" aria-label="BASELINE home">
            <span className="bl-brand-mark">BASELINE</span>
            <span className="bl-brand-rule" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="bl-menu-btn"
            aria-expanded={menuOpen}
            aria-controls={navId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <nav
            id={navId}
            className={`bl-nav-links${menuOpen ? " is-open" : ""}`}
            aria-label="Primary"
          >
            {BASELINE_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active === item.id ? "page" : undefined}
                className={active === item.id ? "is-active" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link className="bl-nav-cta" href="/baseline/live" onClick={() => setMenuOpen(false)}>
              Court board
            </Link>
          </nav>
        </div>
      </header>

      <div className="bl-live-rail" aria-label="Live and upcoming scores">
        <div className="bl-live-rail-inner">
          {LIVE_MATCHES.map((m) => (
            <Link key={m.id} className="bl-live-chip" href="/baseline/live">
              <span className={`bl-pill bl-pill-${m.status}`}>
                <span className="bl-pill-dot" aria-hidden="true" />
                {statusLabel(m.status)}
              </span>
              <span className="bl-live-chip-teams">
                {m.playerA.short}
                <span aria-hidden="true"> · </span>
                {m.playerB.short}
              </span>
              <span className="bl-live-chip-score bl-mono">{chipScore(m)}</span>
            </Link>
          ))}
        </div>
      </div>

      <main id="main">{children}</main>

      <footer className="bl-footer">
        <div className="bl-footer-brand">
          <span className="bl-brand-mark">BASELINE</span>
          <span>Sets, games, points — stacked</span>
        </div>
        <nav aria-label="Footer" className="bl-footer-dirs">
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Match</p>
            <Link href="/baseline/live">Live</Link>
            <Link href="/baseline/scorecard">Scorecard</Link>
          </div>
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Compete</p>
            <Link href="/baseline/series">Tournaments</Link>
            <Link href="/baseline/rankings">Rankings</Link>
          </div>
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Read</p>
            <Link href="/baseline/notebook">Notebook</Link>
            <Link href="/baseline">Home</Link>
          </div>
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Utility</p>
            <Link href="/showcase">Tell Specimens</Link>
          </div>
        </nav>
        <p className="bl-footer-note">
          Demo content · not a live scoring feed · photography via Unsplash
        </p>
      </footer>
    </div>
  );
}
