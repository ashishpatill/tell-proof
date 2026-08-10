"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CreaseShell, type CreaseRouteId } from "./CreaseShell";
import {
  FEATURED,
  HERO_IMAGE,
  LIVE_MATCHES,
  ODI_RANKINGS,
  SERIES,
  STORIES,
  T20_RANKINGS,
  TEST_RANKINGS,
  ballLabel,
  type BallEvent,
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

function OverTrail({ balls }: { balls: BallEvent[] }) {
  return (
    <ol className="cr-over-trail" aria-label="This over">
      {balls.map((b, i) => (
        <li key={`${b}-${i}`} className={`cr-ball cr-ball-${b}`} data-ball={b}>
          {ballLabel(b)}
        </li>
      ))}
      {Array.from({ length: Math.max(0, 6 - balls.length) }).map((_, i) => (
        <li key={`empty-${i}`} className="cr-ball cr-ball-empty" aria-hidden="true">
          –
        </li>
      ))}
    </ol>
  );
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

function MatchScore({ match }: { match: LiveMatch }) {
  return (
    <div className="cr-score" data-spine>
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

function SituationBlock({ match }: { match: LiveMatch }) {
  const showRates = match.format !== "TEST" && (match.crr || match.rrr);
  return (
    <div className="cr-situation">
      <p className="cr-situation-line">{match.note}</p>
      {match.session ? <p className="cr-session">{match.session}</p> : null}
      {showRates ? (
        <p className="cr-rates cr-mono">
          {match.crr ? <span>CRR {match.crr}</span> : null}
          {match.crr && match.rrr ? <span aria-hidden="true"> · </span> : null}
          {match.rrr ? <span>RRR {match.rrr}</span> : null}
        </p>
      ) : null}
      {match.format === "TEST" && match.crr ? (
        <p className="cr-rates cr-mono">Session rate {match.crr}</p>
      ) : null}
      {match.thisOver && match.thisOver.length > 0 ? <OverTrail balls={match.thisOver} /> : null}
      {match.striker ? (
        <p className="cr-pair">
          <span>{match.striker}</span>
          {match.nonStriker ? <span> · {match.nonStriker}</span> : null}
          {match.bowler ? <span className="cr-bowler"> · {match.bowler}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

function useReveal() {
  const revealRoot = useRef<HTMLDivElement>(null);
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
  return revealRoot;
}

function MatchList() {
  return (
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
            <SituationBlock match={m} />
            <p className="cr-venue">{m.venue}</p>
          </div>
          <Link className="cr-match-link" href="/crease/scorecard">
            Full scorecard
            <span aria-hidden="true"> →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HomeMain() {
  return (
    <>
      <section className="cr-hero" aria-labelledby="cr-hero-title">
        <div className="cr-hero-media">
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
            <Link className="cr-btn cr-btn-primary" href="/crease/live">
              Open live match
            </Link>
            <Link className="cr-btn cr-btn-ghost" href="/crease/series">
              Series desk
            </Link>
          </div>
          <div className="cr-hero-scorecard" aria-label="Featured scorecard">
            <MatchScore match={FEATURED} />
            <SituationBlock match={FEATURED} />
          </div>
        </div>
      </section>

      <section className="cr-section cr-matches" aria-labelledby="home-board-title">
        <div className="cr-section-head" data-reveal>
          <p className="cr-eyebrow">Match pulse</p>
          <h2 id="home-board-title" className="cr-h2">
            Today’s board
          </h2>
          <p className="cr-section-dek">
            Status first, score second, situation third — then open Live for the full spine.
          </p>
        </div>
        <MatchList />
      </section>

      <section className="cr-close" data-reveal aria-labelledby="close-title">
        <p className="cr-eyebrow">Stay with the game</p>
        <h2 id="close-title" className="cr-display cr-display-sm">
          Scores you can scan.
          <br />
          Stories worth the wait between overs.
        </h2>
        <div className="cr-hero-actions">
          <Link className="cr-btn cr-btn-primary" href="/crease/live">
            Live scores
          </Link>
          <Link className="cr-btn cr-btn-ghost" href="/crease/notebook">
            Open the notebook
          </Link>
        </div>
      </section>
    </>
  );
}

function LiveMain() {
  return (
    <section className="cr-section cr-matches cr-page-live" aria-labelledby="live-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Live match</p>
        <h1 id="live-title" className="cr-h2">
          Glance spine
        </h1>
        <p className="cr-section-dek">
          Inverted pyramid for second-screen glances — layout-stable scores, situation, this-over
          trail. Format lens changes secondary facts; Test keeps session language.
        </p>
        <div className="cr-tabs" role="tablist" aria-label="Format lens">
          <span className="cr-format-chip is-active">ODI</span>
          <span className="cr-format-chip">Test</span>
          <span className="cr-format-chip">T20</span>
        </div>
      </div>
      <article className="cr-match-row cr-featured-live" data-reveal>
        <div className="cr-match-meta">
          <span className="cr-pill cr-pill-live">
            <span className="cr-pill-dot" aria-hidden="true" />
            Live
          </span>
          <span className="cr-format">{FEATURED.format}</span>
          <span className="cr-series">{FEATURED.series}</span>
        </div>
        <div className="cr-match-body">
          <MatchScore match={FEATURED} />
          <SituationBlock match={FEATURED} />
          <p className="cr-venue">{FEATURED.venue}</p>
        </div>
        <Link className="cr-match-link" href="/crease/scorecard">
          Full scorecard →
        </Link>
      </article>
      <MatchList />
    </section>
  );
}

function ScorecardMain() {
  const bat = [
    { name: "Sharma", runs: 62, balls: 71, fours: 5, sixes: 1, out: "c Smith b Hazelwood" },
    { name: "Gill", runs: 38, balls: 44, fours: 4, sixes: 0, out: "b Starc" },
    { name: "Kohli*", runs: 41, balls: 39, fours: 3, sixes: 1, out: "not out" },
    { name: "Pant*", runs: 18, balls: 15, fours: 2, sixes: 0, out: "not out" },
  ];
  const bowl = [
    { name: "Starc", o: "8.2", m: 1, r: 42, w: 1 },
    { name: "Hazelwood", o: "9", m: 0, r: 48, w: 1 },
    { name: "Cummins", o: "8", m: 0, r: 51, w: 0 },
    { name: "Zampa", o: "7", m: 0, r: 55, w: 0 },
  ];
  return (
    <section className="cr-section" aria-labelledby="scorecard-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Scorecard</p>
        <h1 id="scorecard-title" className="cr-h2">
          Full board — India innings
        </h1>
        <p className="cr-section-dek">
          After-play depth one tap from Live. Tabular numerals; partnership and bowling spells
          without layout jitter.
        </p>
        <p className="cr-lede cr-mono">
          {FEATURED.teamA.name} {FEATURED.teamA.score} ({FEATURED.teamA.overs}) · need 73 from 70
        </p>
      </div>
      <div className="cr-scorecard-grid" data-reveal>
        <table className="cr-rank-table">
          <caption className="sr-only">Batting</caption>
          <thead>
            <tr>
              <th scope="col">Batter</th>
              <th scope="col">R</th>
              <th scope="col">B</th>
              <th scope="col">4</th>
              <th scope="col">6</th>
              <th scope="col">Dismissal</th>
            </tr>
          </thead>
          <tbody>
            {bat.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="cr-mono">{r.runs}</td>
                <td className="cr-mono">{r.balls}</td>
                <td className="cr-mono">{r.fours}</td>
                <td className="cr-mono">{r.sixes}</td>
                <td>{r.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="cr-rank-table">
          <caption className="sr-only">Bowling</caption>
          <thead>
            <tr>
              <th scope="col">Bowler</th>
              <th scope="col">O</th>
              <th scope="col">M</th>
              <th scope="col">R</th>
              <th scope="col">W</th>
            </tr>
          </thead>
          <tbody>
            {bowl.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="cr-mono">{r.o}</td>
                <td className="cr-mono">{r.m}</td>
                <td className="cr-mono">{r.r}</td>
                <td className="cr-mono">{r.w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeriesMain() {
  return (
    <section className="cr-section cr-series" aria-labelledby="series-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Series desk</p>
        <h1 id="series-title" className="cr-h2">
          What’s on the calendar
        </h1>
        <p className="cr-section-dek">Competition arc first — fixtures as chapters, not a dump.</p>
      </div>
      <ul className="cr-series-list">
        {SERIES.map((s) => (
          <li key={s.id} data-reveal>
            <span className="cr-series-window">{s.window}</span>
            <strong>{s.name}</strong>
            <span className="cr-series-detail">{s.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RankingsMain() {
  const [rankFormat, setRankFormat] = useState<RankFormat>("odi");
  const rankings =
    rankFormat === "test" ? TEST_RANKINGS : rankFormat === "t20" ? T20_RANKINGS : ODI_RANKINGS;
  return (
    <section className="cr-section cr-rankings" aria-labelledby="rankings-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">World rankings</p>
        <h1 id="rankings-title" className="cr-h2">
          Who sits where
        </h1>
        <p className="cr-section-dek">Format lens required — Test, ODI, and T20 are different tables.</p>
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
    </section>
  );
}

function NotebookMain() {
  return (
    <section className="cr-section cr-stories" aria-labelledby="notebook-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">The notebook</p>
        <h1 id="notebook-title" className="cr-h2">
          Written for people who watch the whole over
        </h1>
        <p className="cr-section-dek">
          Sit-with reading — separated from glance-live chrome. Technique, tempo, grounds.
        </p>
      </div>
      <article className="cr-feature-story" data-reveal>
        <img src={STORIES[0]!.image} alt={STORIES[0]!.imageAlt} width={1400} height={900} />
        <div className="cr-feature-copy">
          <p className="cr-eyebrow">{STORIES[0]!.kicker}</p>
          <h2 className="cr-h3">{STORIES[0]!.title}</h2>
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
  );
}

const PAGE_MAIN: Record<CreaseRouteId, () => ReactNode> = {
  home: HomeMain,
  live: LiveMain,
  scorecard: ScorecardMain,
  series: SeriesMain,
  rankings: RankingsMain,
  notebook: NotebookMain,
};

export function CreaseExperience({ page = "home" }: { page?: CreaseRouteId }) {
  const revealRoot = useReveal();
  const Main = PAGE_MAIN[page];
  return (
    <div ref={revealRoot}>
      <CreaseShell active={page}>
        <Main />
      </CreaseShell>
    </div>
  );
}
