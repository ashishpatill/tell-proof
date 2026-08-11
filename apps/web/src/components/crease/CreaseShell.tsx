import Link from "next/link";
import type { ReactNode } from "react";
import { LIVE_MATCHES } from "./data";
import type { CreaseRouteId } from "./creaseNav";
import { CreaseNavClient } from "./CreaseNavClient";

export type { CreasePrimaryRouteId, CreaseRouteId, CreaseSecondaryRouteId } from "./creaseNav";
export { CREASE_NAV, CREASE_SECONDARY } from "./creaseNav";

function statusLabel(status: (typeof LIVE_MATCHES)[number]["status"]): string {
  if (status === "live") return "Live";
  if (status === "result") return "Result";
  return "Upcoming";
}

/** Server shell — static HTML + one client island for the mobile menu. */
export function CreaseShell({
  active,
  children,
}: {
  active: CreaseRouteId;
  children: ReactNode;
}) {
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
          <CreaseNavClient active={active} />
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
