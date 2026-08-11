"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BaselineShell, type BaselineRouteId } from "./BaselineShell";
import {
  CLAY_RANKINGS,
  FEATURED,
  GRASS_RANKINGS,
  HARD_RANKINGS,
  HERO_IMAGE,
  LIVE_MATCHES,
  STORIES,
  TOURNAMENTS,
  formatLabel,
  surfaceLabel,
  type LiveMatch,
  type RankingRow,
} from "./data";

type SurfaceLens = "hard" | "clay" | "grass";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function statusLabel(status: LiveMatch["status"]): string {
  if (status === "live") return "Live";
  if (status === "result") return "Result";
  return "Upcoming";
}

function NestedScore({ match }: { match: LiveMatch }) {
  const rows = [match.playerA, match.playerB];
  return (
    <div className="bl-score" data-spine>
      <div className="bl-score-head" aria-hidden="true">
        <span className="bl-score-player-h"> </span>
        <span>Sets</span>
        <span>Games</span>
        <span>Pts</span>
      </div>
      {rows.map((p) => (
        <div key={p.short} className={`bl-score-row${p.serving ? " is-serving" : ""}`}>
          <span className="bl-score-player">
            <span className="bl-code">{p.short}</span>
            <span className="bl-player-name">{p.name}</span>
            {p.serving ? (
              <span className="bl-serve" title="Serving">
                <span className="sr-only">Serving</span>
                <span aria-hidden="true">●</span>
              </span>
            ) : (
              <span className="bl-serve-spacer" aria-hidden="true" />
            )}
          </span>
          <span className="bl-mono bl-sets">{match.status === "upcoming" ? "—" : p.setsWon}</span>
          <span className="bl-mono">{match.status === "upcoming" ? "—" : p.games}</span>
          <span className="bl-mono bl-points">{match.status === "upcoming" ? "—" : p.points}</span>
        </div>
      ))}
    </div>
  );
}

function SituationBlock({ match }: { match: LiveMatch }) {
  return (
    <div className="bl-situation">
      {match.pressureLabel ? (
        <p className="bl-pressure" role="status">
          {match.pressureLabel}
        </p>
      ) : null}
      <p className="bl-situation-line">{match.note}</p>
      {match.challengePending ? (
        <p className="bl-challenge" role="status">
          Challenge pending — score provisional
        </p>
      ) : null}
      {match.format === "BO5" && match.setHistory ? (
        <p className="bl-set-history bl-mono">Sets {match.setHistory}</p>
      ) : null}
      {match.format === "BO3" && match.setHistory && match.status === "live" ? (
        <p className="bl-set-history bl-mono">Line {match.setHistory}</p>
      ) : null}
    </div>
  );
}

function useReveal() {
  const revealRoot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = revealRoot.current;
    if (!root) return;
    const site = root.querySelector<HTMLElement>(".bl-root") ?? root;
    site.setAttribute("data-reveal-ready", "1");
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (prefersReducedMotion()) {
      nodes.forEach((n) => n.setAttribute("data-in", "1"));
      return;
    }
    const reveal = (el: HTMLElement) => el.setAttribute("data-in", "1");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((n) => {
      const rect = n.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        reveal(n);
        return;
      }
      io.observe(n);
    });
    return () => io.disconnect();
  }, []);
  return revealRoot;
}

function RankTable({ rows }: { rows: RankingRow[] }) {
  return (
    <table className="bl-rank-table">
      <caption className="sr-only">Singles rankings</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Player</th>
          <th scope="col">Points</th>
          <th scope="col">
            <span className="sr-only">Movement</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.player}>
            <td>{row.rank}</td>
            <td>{row.player}</td>
            <td className="bl-mono">{row.points.toLocaleString("en-US")}</td>
            <td aria-label={row.change}>
              <span className={`bl-delta bl-delta-${row.change}`} aria-hidden="true">
                {row.change === "up" ? "↑" : row.change === "down" ? "↓" : "·"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MatchList() {
  return (
    <ul className="bl-match-list">
      {LIVE_MATCHES.map((m, i) => (
        <li
          key={m.id}
          id={`match-${m.id}`}
          className="bl-match-row"
          data-reveal
          style={{ transitionDelay: `${Math.min(i, 4) * 40}ms` }}
        >
          <div className="bl-match-meta">
            <span className={`bl-pill bl-pill-${m.status}`}>
              <span className="bl-pill-dot" aria-hidden="true" />
              {statusLabel(m.status)}
            </span>
            <span className="bl-format">{formatLabel(m.format)}</span>
            <span className="bl-surface">{surfaceLabel(m.surface)}</span>
            <span className="bl-series">{m.tournament}</span>
          </div>
          <div className="bl-match-body">
            <NestedScore match={m} />
            <SituationBlock match={m} />
            <p className="bl-venue">
              {m.round} · {m.venue}
            </p>
          </div>
          <Link className="bl-match-link" href="/baseline/scorecard">
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
      <section className="bl-hero" aria-labelledby="bl-hero-title">
        <div className="bl-hero-media">
          <img
            src={HERO_IMAGE}
            alt="Hard court under evening light with clean baseline chalk"
            width={2000}
            height={1333}
            fetchPriority="high"
          />
          <div className="bl-hero-veil" aria-hidden="true" />
          <div className="bl-baseline-line" aria-hidden="true" />
        </div>
        <div className="bl-hero-copy">
          <p className="bl-kicker">
            <span className="bl-pill bl-pill-live">
              <span className="bl-pill-dot" aria-hidden="true" />
              Live · {formatLabel(FEATURED.format)}
            </span>
            <span className="bl-kicker-meta">
              {surfaceLabel(FEATURED.surface)} · {FEATURED.venue}
            </span>
          </p>
          <p className="bl-brand-hero" aria-hidden="true">
            BASELINE
          </p>
          <h1 id="bl-hero-title" className="bl-display">
            One break point owns the third
          </h1>
          <p className="bl-lede">
            Pegula serving at 3–4, 30–40 against — nested stack intact, pressure named in text.
          </p>
          <div className="bl-hero-actions">
            <Link className="bl-btn bl-btn-primary" href="/baseline/live">
              Open court board
            </Link>
            <Link className="bl-btn bl-btn-ghost" href="/baseline/series">
              Tournament desk
            </Link>
          </div>
          <div className="bl-hero-scorecard" aria-label="Featured nested score">
            <NestedScore match={FEATURED} />
            <SituationBlock match={FEATURED} />
          </div>
        </div>
      </section>

      <section className="bl-section bl-matches" aria-labelledby="home-board-title">
        <div className="bl-section-head" data-reveal>
          <p className="bl-eyebrow">Court pulse</p>
          <h2 id="home-board-title" className="bl-h2">
            Today’s board
          </h2>
          <p className="bl-section-dek">
            Status first, nested score second, pressure third — then open Live for the full spine.
          </p>
        </div>
        <MatchList />
      </section>

      <section className="bl-close" data-reveal aria-labelledby="close-title">
        <p className="bl-eyebrow">Stay with the point</p>
        <h2 id="close-title" className="bl-display bl-display-sm">
          Sets you can scan.
          <br />
          Stories worth the changeover.
        </h2>
        <div className="bl-hero-actions">
          <Link className="bl-btn bl-btn-primary" href="/baseline/live">
            Live scores
          </Link>
          <Link className="bl-btn bl-btn-ghost" href="/baseline/notebook">
            Open the notebook
          </Link>
        </div>
      </section>
    </>
  );
}

function LiveMain() {
  const [lens, setLens] = useState<"BO3" | "BO5">("BO3");
  const featured = LIVE_MATCHES.find((m) => m.format === lens && m.status === "live") ?? FEATURED;
  return (
    <section className="bl-section bl-matches bl-page-live" aria-labelledby="live-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">Live court</p>
        <h1 id="live-title" className="bl-h2">
          Nested spine
        </h1>
        <p className="bl-section-dek">
          Sets | games | points with server marker. Format lens changes secondary facts; best-of-5
          keeps set history close.
        </p>
        <div className="bl-tabs" role="tablist" aria-label="Format lens">
          {(
            [
              ["BO3", "Best of 3"],
              ["BO5", "Best of 5"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lens === id}
              className={lens === id ? "is-active" : undefined}
              onClick={() => setLens(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <article className="bl-match-row bl-featured-live">
        <div className="bl-match-meta">
          <span className="bl-pill bl-pill-live">
            <span className="bl-pill-dot" aria-hidden="true" />
            Live
          </span>
          <span className="bl-format">{formatLabel(featured.format)}</span>
          <span className="bl-surface">{surfaceLabel(featured.surface)}</span>
          <span className="bl-series">{featured.tournament}</span>
        </div>
        <div className="bl-match-body">
          <NestedScore match={featured} />
          <SituationBlock match={featured} />
          <p className="bl-venue">
            {featured.round} · {featured.venue}
          </p>
        </div>
        <Link className="bl-match-link" href="/baseline/scorecard">
          Full scorecard →
        </Link>
      </article>
      <MatchList />
    </section>
  );
}

function ScorecardMain() {
  const sets = [
    { set: 1, a: 6, b: 4, note: "Świątek broke late" },
    { set: 2, a: 3, b: 6, note: "Pegula held serve through deuce games" },
    { set: 3, a: 4, b: 3, note: "In progress · break point" },
  ];
  return (
    <section className="bl-section" aria-labelledby="scorecard-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">Scorecard</p>
        <h1 id="scorecard-title" className="bl-h2">
          Set history — semi-final
        </h1>
        <p className="bl-section-dek">
          After-play depth one tap from Live. Nested spine stays visible; set line expands without
          layout jitter.
        </p>
        <div className="bl-hero-scorecard" aria-label="Live nested score">
          <NestedScore match={FEATURED} />
          <SituationBlock match={FEATURED} />
        </div>
      </div>
      <div className="bl-scorecard-grid" data-reveal>
        <table className="bl-rank-table">
          <caption className="sr-only">Set-by-set</caption>
          <thead>
            <tr>
              <th scope="col">Set</th>
              <th scope="col">ŚWI</th>
              <th scope="col">PEG</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((r) => (
              <tr key={r.set}>
                <td className="bl-mono">{r.set}</td>
                <td className="bl-mono">{r.a}</td>
                <td className="bl-mono">{r.b}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bl-point-tree">
          <p className="bl-eyebrow">Current game</p>
          <ol className="bl-point-list bl-mono">
            <li>0–0 · Pegula first serve in</li>
            <li>0–15 · return deep middle</li>
            <li>15–15 · forehand winner</li>
            <li>15–30 · second serve · float</li>
            <li>30–30 · body serve held</li>
            <li>30–40 · break point · return pending</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function SeriesMain() {
  return (
    <section className="bl-section bl-series" aria-labelledby="series-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">Tournament desk</p>
        <h1 id="series-title" className="bl-h2">
          What’s on the calendar
        </h1>
        <p className="bl-section-dek">Competition arc first — draws as chapters, not a dump.</p>
      </div>
      <ul className="bl-series-list">
        {TOURNAMENTS.map((s) => (
          <li key={s.id} data-reveal>
            <span className="bl-series-window">{s.window}</span>
            <strong>{s.name}</strong>
            <span className="bl-series-detail">{s.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RankingsMain() {
  const [surface, setSurface] = useState<SurfaceLens>("hard");
  const rankings =
    surface === "clay" ? CLAY_RANKINGS : surface === "grass" ? GRASS_RANKINGS : HARD_RANKINGS;
  return (
    <section className="bl-section bl-rankings" aria-labelledby="rankings-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">World rankings</p>
        <h1 id="rankings-title" className="bl-h2">
          Who sits where
        </h1>
        <p className="bl-section-dek">Surface lens required — hard, clay, and grass tell different stories.</p>
      </div>
      <div className="bl-tabs" role="tablist" aria-label="Ranking surface">
        {(
          [
            ["hard", "Hard"],
            ["clay", "Clay"],
            ["grass", "Grass"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={surface === id}
            className={surface === id ? "is-active" : undefined}
            onClick={() => setSurface(id)}
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
    <section className="bl-section bl-stories" aria-labelledby="notebook-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">The notebook</p>
        <h1 id="notebook-title" className="bl-h2">
          Written for people who watch the whole game
        </h1>
        <p className="bl-section-dek">
          Sit-with reading — separated from glance-live chrome. Technique, tempo, surfaces.
        </p>
      </div>
      <article className="bl-feature-story" data-reveal>
        <img src={STORIES[0]!.image} alt={STORIES[0]!.imageAlt} width={1400} height={900} />
        <div className="bl-feature-copy">
          <p className="bl-eyebrow">{STORIES[0]!.kicker}</p>
          <h2 className="bl-h3">{STORIES[0]!.title}</h2>
          <p>{STORIES[0]!.dek}</p>
          <p className="bl-read">{STORIES[0]!.read} read</p>
        </div>
      </article>
      <div className="bl-story-rail">
        {STORIES.slice(1).map((s, i) => (
          <article
            key={s.id}
            className="bl-story-item"
            data-reveal
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <img src={s.image} alt={s.imageAlt} width={800} height={560} loading="lazy" />
            <div>
              <p className="bl-eyebrow">
                {s.kicker} · {s.read}
              </p>
              <h3 className="bl-h4">{s.title}</h3>
              <p className="bl-story-dek">{s.dek}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const PAGE_MAIN: Record<BaselineRouteId, () => ReactNode> = {
  home: HomeMain,
  live: LiveMain,
  scorecard: ScorecardMain,
  series: SeriesMain,
  rankings: RankingsMain,
  notebook: NotebookMain,
};

export function BaselineExperience({ page = "home" }: { page?: BaselineRouteId }) {
  const revealRoot = useReveal();
  const Main = PAGE_MAIN[page];
  return (
    <div ref={revealRoot}>
      <BaselineShell active={page}>
        <Main />
      </BaselineShell>
    </div>
  );
}
