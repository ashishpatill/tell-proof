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
  const sets = `${m.playerA.setsWon}–${m.playerB.setsWon}`;
  const liveTb = m.setBeads.some((b) => b.current && b.tiebreak);
  if (liveTb) {
    return `${sets} · TB ${m.playerA.points}–${m.playerB.points}`;
  }
  return `${sets} · ${m.playerA.games}-${m.playerB.games} · ${m.playerA.points}-${m.playerB.points}`;
}

function chipServer(m: LiveMatch): string | null {
  if (m.status !== "live") return null;
  if (m.playerA.serving) return m.playerA.short;
  if (m.playerB.serving) return m.playerB.short;
  return null;
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
          {LIVE_MATCHES.map((m) => {
            const server = chipServer(m);
            return (
              <Link
                key={m.id}
                className="bl-live-chip"
                href="/baseline/live"
                data-surface={m.surface}
                data-status={m.status}
              >
                <span className={`bl-pill bl-pill-${m.status}`}>
                  <span className="bl-pill-dot" aria-hidden="true" />
                  {statusLabel(m.status)}
                </span>
                <span className="bl-live-chip-teams">
                  <span className={m.playerA.serving ? "is-serving" : undefined}>
                    {m.playerA.short}
                    {m.playerA.serving ? (
                      <span className="bl-live-chip-serve" title="On serve">
                        {" "}
                        ●
                      </span>
                    ) : null}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span className={m.playerB.serving ? "is-serving" : undefined}>
                    {m.playerB.short}
                    {m.playerB.serving ? (
                      <span className="bl-live-chip-serve" title="On serve">
                        {" "}
                        ●
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="bl-live-chip-score bl-mono">{chipScore(m)}</span>
                {server ? <span className="sr-only">{server} on serve</span> : null}
                {m.challengePending ? (
                  <span className="bl-live-chip-chal" title="Challenge pending">
                    CH
                  </span>
                ) : null}
              </Link>
            );
          })}
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
