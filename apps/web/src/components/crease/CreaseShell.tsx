"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { LIVE_MATCHES } from "./data";

/** Primary nav stays ≤6 (Core six). Secondary lives in footer / deep links. */
export type CreasePrimaryRouteId =
  | "home"
  | "live"
  | "scorecard"
  | "series"
  | "rankings"
  | "notebook";

export type CreaseSecondaryRouteId = "fixtures" | "teams" | "players" | "stats";

export type CreaseRouteId = CreasePrimaryRouteId | CreaseSecondaryRouteId;

export const CREASE_NAV: Array<{ id: CreasePrimaryRouteId; href: string; label: string }> = [
  { id: "home", href: "/crease", label: "Home" },
  { id: "live", href: "/crease/live", label: "Live" },
  { id: "scorecard", href: "/crease/scorecard", label: "Scorecard" },
  { id: "series", href: "/crease/series", label: "Series" },
  { id: "rankings", href: "/crease/rankings", label: "Rankings" },
  { id: "notebook", href: "/crease/notebook", label: "Notebook" },
];

export const CREASE_SECONDARY: Array<{ id: CreaseSecondaryRouteId; href: string; label: string }> = [
  { id: "fixtures", href: "/crease/fixtures", label: "Fixtures" },
  { id: "teams", href: "/crease/teams", label: "Teams" },
  { id: "players", href: "/crease/players", label: "Players" },
  { id: "stats", href: "/crease/stats", label: "Stats" },
];

function statusLabel(status: (typeof LIVE_MATCHES)[number]["status"]): string {
  if (status === "live") return "Live";
  if (status === "result") return "Result";
  return "Upcoming";
}

function isPrimaryActive(active: CreaseRouteId, id: CreasePrimaryRouteId): boolean {
  return active === id;
}

export function CreaseShell({
  active,
  children,
}: {
  active: CreaseRouteId;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();

  return (
    <div className="cr-root" data-testid="crease-site" data-crease-route={active}>
      <a className="cr-skip" href="#main">
        Skip to content
      </a>

      <div className="cr-atmosphere" aria-hidden="true">
        <span className="cr-haze" />
        <span className="cr-mote cr-mote-a" />
        <span className="cr-mote cr-mote-b" />
        <span className="cr-mote cr-mote-c" />
      </div>

      <header className="cr-nav">
        <div className="cr-nav-inner">
          <Link className="cr-brand" href="/crease" aria-label="CREASE home">
            <span className="cr-brand-mark">CREASE</span>
            <span className="cr-brand-rule" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="cr-menu-btn"
            aria-expanded={menuOpen}
            aria-controls={navId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <nav
            id={navId}
            className={`cr-nav-links${menuOpen ? " is-open" : ""}`}
            aria-label="Primary"
          >
            {CREASE_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isPrimaryActive(active, item.id) ? "page" : undefined}
                className={isPrimaryActive(active, item.id) ? "is-active" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link className="cr-nav-cta" href="/crease/live" onClick={() => setMenuOpen(false)}>
              Live match
            </Link>
          </nav>
        </div>
      </header>

      <div className="cr-live-rail" aria-label="Live and upcoming scores">
        <div className="cr-live-rail-inner">
          {LIVE_MATCHES.map((m) => (
            <Link key={m.id} className="cr-live-chip" href="/crease/live">
              <span className={`cr-pill cr-pill-${m.status}`}>
                <span className="cr-pill-dot" aria-hidden="true" />
                {statusLabel(m.status)}
              </span>
              <span className="cr-live-chip-teams">
                {m.teamA.code}
                <span aria-hidden="true"> · </span>
                {m.teamB.code}
              </span>
              <span className="cr-live-chip-score cr-mono">
                {m.status === "upcoming"
                  ? m.start
                  : `${m.teamA.score ?? "—"} · ${m.teamB.score ?? "—"}`}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <main id="main">{children}</main>

      <footer className="cr-footer">
        <div className="cr-footer-brand">
          <span className="cr-brand-mark">CREASE</span>
          <span>For the love of cricket</span>
        </div>
        <nav aria-label="Footer" className="cr-footer-dirs">
          <div className="cr-footer-col">
            <p className="cr-footer-col-title">Match</p>
            <Link href="/crease/live">Live</Link>
            <Link href="/crease/scorecard">Scorecard</Link>
            <Link href="/crease/live#commentary">Commentary</Link>
            <Link href="/crease/scorecard#partnerships">Partnerships</Link>
          </div>
          <div className="cr-footer-col">
            <p className="cr-footer-col-title">Compete</p>
            <Link href="/crease/series">Series</Link>
            <Link href="/crease/fixtures">Fixtures</Link>
            <Link href="/crease/rankings">Rankings</Link>
            <Link href="/crease/teams">Teams</Link>
          </div>
          <div className="cr-footer-col">
            <p className="cr-footer-col-title">People</p>
            <Link href="/crease/players">Players</Link>
            <Link href="/crease/stats">Stats &amp; records</Link>
            <Link href="/crease/rankings">Player rankings</Link>
          </div>
          <div className="cr-footer-col">
            <p className="cr-footer-col-title">Read</p>
            <Link href="/crease/notebook">Notebook</Link>
            <Link href="/crease">Home</Link>
            <Link href="/showcase">Tell Specimens</Link>
          </div>
        </nav>
        <p className="cr-footer-note">
          Demo content · not a live scoring feed · photography via Wikimedia Commons &amp; Unsplash
        </p>
      </footer>
    </div>
  );
}
