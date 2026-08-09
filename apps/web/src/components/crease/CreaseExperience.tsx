"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  FEATURED,
  HERO_IMAGE,
  LIVE_MATCHES,
  ODI_RANKINGS,
  SERIES,
  STORIES,
  T20_RANKINGS,
  TEST_RANKINGS,
  type LiveMatch,
  type RankingRow,
} from "./data";

type RankFormat = "test" | "odi" | "t20";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function statusLabel(status: LiveMatch["status"]): string {
  if (status === "live") return "Live";
  if (status === "result") return "Result";
  return "Upcoming";
}

function RankTable({ rows }: { rows: RankingRow[] }) {
  return (
    <table className="cr-rank-table">
      <caption className="sr-only">Team rankings</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Team</th>
          <th scope="col">Rating</th>
          <th scope="col">
            <span className="sr-only">Movement</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.team}>
            <td>{row.rank}</td>
            <td>{row.team}</td>
            <td className="cr-mono">{row.rating}</td>
            <td aria-label={row.change}>
              <span className={`cr-delta cr-delta-${row.change}`} aria-hidden="true">
                {row.change === "up" ? "↑" : row.change === "down" ? "↓" : "·"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MatchScore({ match, compact = false }: { match: LiveMatch; compact?: boolean }) {
  return (
    <div className={compact ? "cr-score cr-score-compact" : "cr-score"}>
      <div className="cr-score-team">
        <span className="cr-code">{match.teamA.code}</span>
        {match.teamA.score ? (
          <span className="cr-mono">
            {match.teamA.score}
            {match.teamA.overs ? <span className="cr-overs"> ({match.teamA.overs})</span> : null}
          </span>
        ) : (
          <span className="cr-muted">—</span>
        )}
      </div>
      <div className="cr-score-team">
        <span className="cr-code">{match.teamB.code}</span>
        {match.teamB.score ? (
          <span className="cr-mono">
            {match.teamB.score}
            {match.teamB.overs ? <span className="cr-overs"> ({match.teamB.overs})</span> : null}
          </span>
        ) : (
          <span className="cr-muted">{match.start ?? "Yet to bat"}</span>
        )}
      </div>
    </div>
  );
}

export function CreaseExperience() {
  const [rankFormat, setRankFormat] = useState<RankFormat>("odi");
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRoot = useRef<HTMLDivElement>(null);
  const navId = useId();

  useEffect(() => {
    const root = revealRoot.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (prefersReducedMotion()) {
      nodes.forEach((n) => n.setAttribute("data-in", "1"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).setAttribute("data-in", "1");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const rankings =
    rankFormat === "test" ? TEST_RANKINGS : rankFormat === "t20" ? T20_RANKINGS : ODI_RANKINGS;

  return (
    <div className="cr-root" ref={revealRoot} data-testid="crease-site">
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
          <a className="cr-brand" href="#top" aria-label="CREASE home">
            <span className="cr-brand-mark">CREASE</span>
            <span className="cr-brand-rule" aria-hidden="true" />
          </a>
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
            <a href="#live" onClick={() => setMenuOpen(false)}>
              Live
            </a>
            <a href="#matches" onClick={() => setMenuOpen(false)}>
              Matches
            </a>
            <a href="#stories" onClick={() => setMenuOpen(false)}>
              Stories
            </a>
            <a href="#rankings" onClick={() => setMenuOpen(false)}>
              Rankings
            </a>
            <a href="#series" onClick={() => setMenuOpen(false)}>
              Series
            </a>
            <a className="cr-nav-cta" href="#featured" onClick={() => setMenuOpen(false)}>
              Match theater
            </a>
          </nav>
        </div>
      </header>

      <div className="cr-live-rail" id="live" aria-label="Live and upcoming scores">
        <div className="cr-live-rail-inner">
          {LIVE_MATCHES.map((m) => (
            <a key={m.id} className="cr-live-chip" href={`#match-${m.id}`}>
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
            </a>
          ))}
        </div>
      </div>

      <main id="main">
        <section className="cr-hero" id="top" aria-labelledby="cr-hero-title">
          <div className="cr-hero-media" id="featured">
            <img
              src={HERO_IMAGE}
              alt="Cricket match underway on a green oval beneath a city skyline"
              width={2000}
              height={1200}
              fetchPriority="high"
            />
            <div className="cr-hero-veil" aria-hidden="true" />
            <div className="cr-crease-line" aria-hidden="true" />
          </div>

          <div className="cr-hero-copy">
            <p className="cr-kicker">
              <span className="cr-pill cr-pill-live">
                <span className="cr-pill-dot" aria-hidden="true" />
                Live · {FEATURED.format}
              </span>
              <span className="cr-kicker-meta">{FEATURED.venue}</span>
            </p>
            <p className="cr-brand-hero" aria-hidden="true">
              CREASE
            </p>
            <h1 id="cr-hero-title" className="cr-display">
              India chase 287 beneath the skyline
            </h1>
            <p className="cr-lede">
              {FEATURED.teamA.name} {FEATURED.teamA.score} ({FEATURED.teamA.overs}) need 73 from 70
              against {FEATURED.teamB.name}. The middle overs decide who owns the afternoon.
            </p>
            <div className="cr-hero-actions">
              <a className="cr-btn cr-btn-primary" href={`#match-${FEATURED.id}`}>
                Open this match
              </a>
              <a className="cr-btn cr-btn-ghost" href="#matches">
                All matches today
              </a>
            </div>
            <div className="cr-hero-scorecard" aria-label="Featured scorecard">
              <MatchScore match={FEATURED} />
              <p className="cr-hero-note">{FEATURED.note}</p>
            </div>
          </div>
        </section>

        <section className="cr-section cr-matches" id="matches" aria-labelledby="matches-title">
          <div className="cr-section-head" data-reveal>
            <p className="cr-eyebrow">Match center</p>
            <h2 id="matches-title" className="cr-h2">
              Today’s board
            </h2>
            <p className="cr-section-dek">
              Status first, score second, story last — so you can find the game in one glance.
            </p>
          </div>

          <ul className="cr-match-list">
            {LIVE_MATCHES.map((m, i) => (
              <li
                key={m.id}
                id={`match-${m.id}`}
                className="cr-match-row"
                data-reveal
                style={{ transitionDelay: `${Math.min(i, 4) * 40}ms` }}
              >
                <div className="cr-match-meta">
                  <span className={`cr-pill cr-pill-${m.status}`}>
                    <span className="cr-pill-dot" aria-hidden="true" />
                    {statusLabel(m.status)}
                  </span>
                  <span className="cr-format">{m.format}</span>
                  <span className="cr-series">{m.series}</span>
                </div>
                <div className="cr-match-body">
                  <MatchScore match={m} />
                  <p className="cr-match-note">{m.note}</p>
                  <p className="cr-venue">{m.venue}</p>
                </div>
                <a className="cr-match-link" href="#stories">
                  Read the notebook
                  <span aria-hidden="true"> →</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="cr-section cr-stories" id="stories" aria-labelledby="stories-title">
          <div className="cr-section-head" data-reveal>
            <p className="cr-eyebrow">The notebook</p>
            <h2 id="stories-title" className="cr-h2">
              Written for people who watch the whole over
            </h2>
            <p className="cr-section-dek">
              Less noise, more cricket — technique, tempo, and the grounds that shape both.
            </p>
          </div>

          <article className="cr-feature-story" data-reveal>
            <img src={STORIES[0]!.image} alt={STORIES[0]!.imageAlt} width={1400} height={900} />
            <div className="cr-feature-copy">
              <p className="cr-eyebrow">{STORIES[0]!.kicker}</p>
              <h3 className="cr-h3">{STORIES[0]!.title}</h3>
              <p>{STORIES[0]!.dek}</p>
              <p className="cr-read">{STORIES[0]!.read} read</p>
            </div>
          </article>

          <div className="cr-story-rail">
            {STORIES.slice(1).map((s, i) => (
              <article
                key={s.id}
                className="cr-story-item"
                data-reveal
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <img src={s.image} alt={s.imageAlt} width={800} height={560} loading="lazy" />
                <div>
                  <p className="cr-eyebrow">
                    {s.kicker} · {s.read}
                  </p>
                  <h3 className="cr-h4">{s.title}</h3>
                  <p className="cr-story-dek">{s.dek}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cr-split" aria-label="Rankings and series">
          <div className="cr-section cr-rankings" id="rankings" data-reveal>
            <div className="cr-section-head">
              <p className="cr-eyebrow">World rankings</p>
              <h2 className="cr-h2">Who sits where</h2>
            </div>
            <div className="cr-tabs" role="tablist" aria-label="Ranking format">
              {(
                [
                  ["odi", "ODI"],
                  ["test", "Test"],
                  ["t20", "T20"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={rankFormat === id}
                  className={rankFormat === id ? "is-active" : undefined}
                  onClick={() => setRankFormat(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <RankTable rows={rankings} />
          </div>

          <div className="cr-section cr-series" id="series" data-reveal>
            <div className="cr-section-head">
              <p className="cr-eyebrow">Series desk</p>
              <h2 className="cr-h2">What’s on the calendar</h2>
            </div>
            <ul className="cr-series-list">
              {SERIES.map((s) => (
                <li key={s.id}>
                  <span className="cr-series-window">{s.window}</span>
                  <strong>{s.name}</strong>
                  <span className="cr-series-detail">{s.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cr-close" data-reveal aria-labelledby="close-title">
          <p className="cr-eyebrow">Stay with the game</p>
          <h2 id="close-title" className="cr-display cr-display-sm">
            Scores you can scan.
            <br />
            Stories worth the wait between overs.
          </h2>
          <p className="cr-lede">
            CREASE is cricket information built like a pavilion evening — clear board, honest
            writing, no clutter between you and the next ball.
          </p>
          <div className="cr-hero-actions">
            <a className="cr-btn cr-btn-primary" href="#live">
              Back to live scores
            </a>
            <a className="cr-btn cr-btn-ghost" href="#stories">
              Open the notebook
            </a>
          </div>
        </section>
      </main>

      <footer className="cr-footer">
        <div className="cr-footer-brand">
          <span className="cr-brand-mark">CREASE</span>
          <span>For the love of cricket</span>
        </div>
        <nav aria-label="Footer">
          <a href="#live">Live</a>
          <a href="#matches">Matches</a>
          <a href="#stories">Stories</a>
          <a href="#rankings">Rankings</a>
          <a href="/showcase">Tell Specimens</a>
        </nav>
        <p className="cr-footer-note">
          Demo content · not a live scoring feed · photography via Wikimedia Commons &amp; Unsplash
        </p>
      </footer>
    </div>
  );
}
