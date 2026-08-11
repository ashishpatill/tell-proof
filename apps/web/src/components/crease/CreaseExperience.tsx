"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CreaseShell, type CreaseRouteId } from "./CreaseShell";
import {
  BATTING,
  BOWLING,
  COMMENTARY,
  EXTRAS,
  FALL_OF_WICKETS,
  FEATURED,
  FIXTURES,
  HERO_IMAGE,
  LIVE_MATCHES,
  ODI_RANKINGS,
  PARTNERSHIPS,
  PLAYER_BAT_ODI,
  PLAYER_BOWL_ODI,
  PLAYERS,
  POINTS_TABLE,
  RECORDS,
  SERIES,
  STORIES,
  T20_RANKINGS,
  TEAMS,
  TEST_RANKINGS,
  ballLabel,
  type BallEvent,
  type LiveMatch,
  type PlayerRankingRow,
  type RankingRow,
} from "./data";

type RankFormat = "test" | "odi" | "t20";
type RankAxis = "team" | "player-bat" | "player-bowl";
type LiveFilter = "all" | "live" | "upcoming" | "result";

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

function PlayerRankTable({ rows }: { rows: PlayerRankingRow[] }) {
  return (
    <table className="cr-rank-table">
      <caption className="sr-only">Player rankings</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Player</th>
          <th scope="col">Team</th>
          <th scope="col">Rating</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.player}>
            <td>{row.rank}</td>
            <td>{row.player}</td>
            <td>{row.team}</td>
            <td className="cr-mono">{row.rating}</td>
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
      {match.powerplay ? <p className="cr-phase">{match.powerplay}</p> : null}
      {match.latency === "delayed" ? (
        <p className="cr-latency" role="status">
          Feed delayed · scores may lag a ball or two
        </p>
      ) : null}
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

function MatchList({ filter = "all" }: { filter?: LiveFilter }) {
  const rows =
    filter === "all" ? LIVE_MATCHES : LIVE_MATCHES.filter((m) => m.status === filter);
  return (
    <ul className="cr-match-list">
      {rows.map((m, i) => (
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
        <MatchList filter="live" />
        <div className="cr-inline-links" data-reveal>
          <Link href="/crease/fixtures">Full fixtures →</Link>
          <Link href="/crease/teams">Teams desk →</Link>
          <Link href="/crease/stats">Stats &amp; records →</Link>
        </div>
      </section>

      <section className="cr-section" aria-labelledby="home-series-title">
        <div className="cr-section-head" data-reveal>
          <p className="cr-eyebrow">Series pulse</p>
          <h2 id="home-series-title" className="cr-h2">
            Competition arcs
          </h2>
        </div>
        <ul className="cr-series-list">
          {SERIES.slice(0, 3).map((s) => (
            <li key={s.id} data-reveal>
              <span className="cr-series-window">{s.window}</span>
              <strong>{s.name}</strong>
              <span className="cr-series-detail">{s.detail}</span>
            </li>
          ))}
        </ul>
        <p className="cr-inline-links" data-reveal>
          <Link href="/crease/series">Open series desk →</Link>
        </p>
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
  const [filter, setFilter] = useState<LiveFilter>("all");
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
        <div className="cr-tabs" role="tablist" aria-label="Match status">
          {(
            [
              ["all", "All"],
              ["live", "Live"],
              ["upcoming", "Upcoming"],
              ["result", "Completed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={filter === id ? "is-active" : undefined}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
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
      <MatchList filter={filter === "all" ? "all" : filter} />

      <div id="commentary" className="cr-commentary" data-reveal>
        <div className="cr-section-head">
          <p className="cr-eyebrow">Ball-by-ball</p>
          <h2 className="cr-h3">Commentary strip</h2>
          <p className="cr-section-dek">
            Sit-with depth under the glance fold — over.ball markers, not a wall of undifferentiated
            text.
          </p>
        </div>
        <ol className="cr-commentary-list">
          {COMMENTARY.map((line) => (
            <li key={line.id} className={`cr-commentary-item cr-commentary-${line.kind}`}>
              <span className="cr-mono cr-commentary-ball">{line.overBall}</span>
              <span>{line.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ScorecardMain() {
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
      <div className="cr-scorecard-grid" data-reveal data-testid="crease-scorecard-board">
        <div className="cr-board" aria-label="Batting">
          <div className="cr-board-row cr-board-head" role="row">
            <span>Batter</span>
            <span className="cr-stat">R</span>
            <span className="cr-stat">B</span>
            <span className="cr-stat">4</span>
            <span className="cr-stat">6</span>
            <span>Dismissal</span>
          </div>
          {BATTING.map((r) => (
            <div className="cr-board-row" role="row" key={r.name}>
              <span className="cr-name">{r.name}</span>
              <span className="cr-stat">{r.runs}</span>
              <span className="cr-stat">{r.balls}</span>
              <span className="cr-stat">{r.fours}</span>
              <span className="cr-stat">{r.sixes}</span>
              <span className="cr-note">{r.out}</span>
            </div>
          ))}
        </div>
        <p className="cr-extras cr-mono" data-reveal>
          Extras {EXTRAS.total} (b {EXTRAS.byes}, lb {EXTRAS.legByes}, w {EXTRAS.wides}, nb{" "}
          {EXTRAS.noBalls})
        </p>
        <div className="cr-board" aria-label="Bowling">
          <div className="cr-board-row cr-board-head" role="row">
            <span>Bowler</span>
            <span className="cr-stat">O</span>
            <span className="cr-stat">M</span>
            <span className="cr-stat">R</span>
            <span className="cr-stat">W</span>
            <span className="sr-only">Spell note</span>
          </div>
          {BOWLING.map((r) => (
            <div className="cr-board-row" role="row" key={r.name}>
              <span className="cr-name">{r.name}</span>
              <span className="cr-stat">{r.o}</span>
              <span className="cr-stat">{r.m}</span>
              <span className="cr-stat">{r.r}</span>
              <span className="cr-stat">{r.w}</span>
              <span className="cr-note" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      <div id="partnerships" className="cr-depth-grid" data-reveal>
        <div>
          <h2 className="cr-h3">Partnerships</h2>
          <ul className="cr-pair-list">
            {PARTNERSHIPS.map((p) => (
              <li key={p.wicket}>
                <span className="cr-mono">{p.wicket}</span>
                <span>{p.pair}</span>
                <span className="cr-mono">
                  {p.runs} ({p.balls})
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="cr-h3">Fall of wickets</h2>
          <ul className="cr-fow-list">
            {FALL_OF_WICKETS.map((f) => (
              <li key={f.score}>
                <span className="cr-mono">{f.score}</span>
                <span>({f.overs})</span>
                <span>{f.batter}</span>
              </li>
            ))}
          </ul>
        </div>
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

      <div className="cr-section-head" data-reveal style={{ marginTop: "2.5rem" }}>
        <p className="cr-eyebrow">Points table</p>
        <h2 className="cr-h3">Asia Cup warm-up · group lean</h2>
        <p className="cr-section-dek">Stakes next to the live view — NRR when points tie.</p>
      </div>
      <table className="cr-rank-table" data-reveal>
        <caption className="sr-only">Points table</caption>
        <thead>
          <tr>
            <th scope="col">Team</th>
            <th scope="col">P</th>
            <th scope="col">W</th>
            <th scope="col">L</th>
            <th scope="col">NR</th>
            <th scope="col">Pts</th>
            <th scope="col">NRR</th>
          </tr>
        </thead>
        <tbody>
          {POINTS_TABLE.map((row) => (
            <tr key={row.team}>
              <td>{row.team}</td>
              <td className="cr-mono">{row.played}</td>
              <td className="cr-mono">{row.won}</td>
              <td className="cr-mono">{row.lost}</td>
              <td className="cr-mono">{row.nr}</td>
              <td className="cr-mono">{row.points}</td>
              <td className="cr-mono">{row.nrr}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cr-inline-links" data-reveal>
        <Link href="/crease/fixtures">Open fixtures calendar →</Link>
      </p>
    </section>
  );
}

function RankingsMain() {
  const [rankFormat, setRankFormat] = useState<RankFormat>("odi");
  const [axis, setAxis] = useState<RankAxis>("team");
  const rankings =
    rankFormat === "test" ? TEST_RANKINGS : rankFormat === "t20" ? T20_RANKINGS : ODI_RANKINGS;
  return (
    <section className="cr-section cr-rankings" aria-labelledby="rankings-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">World rankings</p>
        <h1 id="rankings-title" className="cr-h2">
          Who sits where
        </h1>
        <p className="cr-section-dek">
          Dual axis — team vs player, then format lens. Test, ODI, and T20 are different tables.
        </p>
      </div>
      <div className="cr-tabs" role="tablist" aria-label="Ranking axis">
        {(
          [
            ["team", "Teams"],
            ["player-bat", "Batters"],
            ["player-bowl", "Bowlers"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={axis === id}
            className={axis === id ? "is-active" : undefined}
            onClick={() => setAxis(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {axis === "team" ? (
        <>
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
        </>
      ) : (
        <PlayerRankTable rows={axis === "player-bat" ? PLAYER_BAT_ODI : PLAYER_BOWL_ODI} />
      )}
      <p className="cr-inline-links" data-reveal>
        <Link href="/crease/players">Browse player cards →</Link>
        <Link href="/crease/stats">Records index →</Link>
      </p>
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
          Sit-with reading — separated from glance-live chrome. Technique, tempo, grounds, before
          play.
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

function FixturesMain() {
  return (
    <section className="cr-section" aria-labelledby="fixtures-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Fixtures</p>
        <h1 id="fixtures-title" className="cr-h2">
          When the next ball is due
        </h1>
        <p className="cr-section-dek">
          Before-play mode — schedule as chapters with format and venue, not a flat dump.
        </p>
      </div>
      <ul className="cr-fixture-list">
        {FIXTURES.map((f) => (
          <li key={f.id} data-reveal className="cr-fixture-row">
            <div className="cr-fixture-when">
              <span className={`cr-pill cr-pill-${f.status}`}>
                <span className="cr-pill-dot" aria-hidden="true" />
                {statusLabel(f.status)}
              </span>
              <span className="cr-mono">{f.when}</span>
            </div>
            <div>
              <strong>{f.teams}</strong>
              <p className="cr-series-detail">
                {f.format} · {f.series}
              </p>
              <p className="cr-venue">{f.venue}</p>
            </div>
            <Link className="cr-match-link" href={f.status === "live" ? "/crease/live" : "/crease/series"}>
              {f.status === "live" ? "Open live →" : "Series →"}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TeamsMain() {
  return (
    <section className="cr-section" aria-labelledby="teams-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Teams</p>
        <h1 id="teams-title" className="cr-h2">
          Boards on tour
        </h1>
        <p className="cr-section-dek">
          Category sites treat teams as hubs — next fixture, form, and a path into Live.
        </p>
      </div>
      <div className="cr-card-grid">
        {TEAMS.map((t) => (
          <article key={t.id} className="cr-info-card" data-reveal>
            <p className="cr-code">{t.code}</p>
            <h2 className="cr-h4">{t.name}</h2>
            <p className="cr-series-detail">{t.board}</p>
            <p>{t.next}</p>
            <p className="cr-mono cr-form">{t.form}</p>
            <Link className="cr-match-link" href="/crease/live">
              Follow live →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlayersMain() {
  return (
    <section className="cr-section" aria-labelledby="players-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Players</p>
        <h1 id="players-title" className="cr-h2">
          Who owns this contest
        </h1>
        <p className="cr-section-dek">
          Strike pair and bowler identity from the spine, expanded into people you can follow.
        </p>
      </div>
      <div className="cr-card-grid">
        {PLAYERS.map((p) => (
          <article key={p.id} className="cr-info-card" data-reveal>
            <p className="cr-eyebrow">{p.team}</p>
            <h2 className="cr-h4">{p.name}</h2>
            <p className="cr-series-detail">{p.role}</p>
            <p>{p.note}</p>
            <Link className="cr-match-link" href="/crease/rankings">
              Rankings →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatsMain() {
  return (
    <section className="cr-section" aria-labelledby="stats-title">
      <div className="cr-section-head" data-reveal>
        <p className="cr-eyebrow">Stats &amp; records</p>
        <h1 id="stats-title" className="cr-h2">
          Numbers that survived the over
        </h1>
        <p className="cr-section-dek">
          After-play archive — records index without burying the live spine elsewhere.
        </p>
      </div>
      <ul className="cr-record-list">
        {RECORDS.map((r) => (
          <li key={r.label} data-reveal>
            <span className="cr-series-window">{r.label}</span>
            <strong>{r.holder}</strong>
            <span className="cr-mono">{r.mark}</span>
          </li>
        ))}
      </ul>
      <p className="cr-inline-links" data-reveal>
        <Link href="/crease/scorecard">Full scorecard →</Link>
        <Link href="/crease/rankings">World rankings →</Link>
      </p>
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
  fixtures: FixturesMain,
  teams: TeamsMain,
  players: PlayersMain,
  stats: StatsMain,
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
