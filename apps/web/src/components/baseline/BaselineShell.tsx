import Link from "next/link";
import type { ReactNode } from "react";
import { LIVE_MATCHES, type LiveMatch } from "./data";
import { BaselineNavClient } from "./BaselineNavClient";
import { BaselineRevealRoot } from "./BaselineRevealRoot";

export type { BaselineRouteId } from "./baselineNav";
export { BASELINE_NAV } from "./baselineNav";

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

/**
 * Persistent server shell — chrome stays mounted across soft navigations so
 * route swaps only replace <main>.
 */
export function BaselineShell({ children }: { children: ReactNode }) {
  return (
    <div className="bl-root" data-testid="baseline-site">
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
          <Link className="bl-brand" href="/baseline" prefetch aria-label="BASELINE home">
            <span className="bl-brand-mark">BASELINE</span>
            <span className="bl-brand-rule" aria-hidden="true" />
          </Link>
          <BaselineNavClient />
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
                prefetch
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

      <main id="main">
        <BaselineRevealRoot>{children}</BaselineRevealRoot>
      </main>

      <footer className="bl-footer">
        <div className="bl-footer-brand">
          <span className="bl-brand-mark">BASELINE</span>
          <span>Sets, games, points — stacked</span>
        </div>
        <nav aria-label="Footer" className="bl-footer-dirs">
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Match</p>
            <Link href="/baseline/live" prefetch>
              Live
            </Link>
            <Link href="/baseline/scorecard" prefetch>
              Scorecard
            </Link>
          </div>
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Compete</p>
            <Link href="/baseline/series" prefetch>
              Tournaments
            </Link>
            <Link href="/baseline/rankings" prefetch>
              Rankings
            </Link>
          </div>
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Read</p>
            <Link href="/baseline/notebook" prefetch>
              Notebook
            </Link>
            <Link href="/baseline" prefetch>
              Home
            </Link>
          </div>
          <div className="bl-footer-col">
            <p className="bl-footer-col-title">Utility</p>
            <Link href="/showcase" prefetch>
              Tell Specimens
            </Link>
          </div>
        </nav>
        <p className="bl-footer-note">
          Demo content · not a live scoring feed · photography via Unsplash
        </p>
      </footer>
    </div>
  );
}
