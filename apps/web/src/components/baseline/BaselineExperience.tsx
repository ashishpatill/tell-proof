"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BaselineShell, type BaselineRouteId } from "./BaselineShell";
import { SiteImg } from "@/components/site-media/SiteImg";
import {
  CLAY_RANKINGS,
  FEATURED,
  GRASS_RANKINGS,
  HARD_RANKINGS,
  HERO_IMAGE,
  LIVE_MATCHES,
  SURFACE_ATMOSPHERE,
  STORIES,
  TOURNAMENTS,
  formatLabel,
  lensFacts,
  type FormatLens,
  type LiveMatch,
  type RankingRow,
  type SetBead,
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

function beadLabel(bead: SetBead): string {
  if (bead.tiebreak) return `${bead.a}–${bead.b}ᵗᵇ`;
  return `${bead.a}–${bead.b}`;
}

/** Nested spine: per-set columns when beads exist, else sets|games|pts.
 *  Live tie-break replaces G/Pts with a single TB column (vernacular §3b.9). */
function NestedScore({ match }: { match: LiveMatch }) {
  const rows = [match.playerA, match.playerB] as const;
  const beads = match.setBeads;
  const useSetCols = beads.length > 0;
  const liveTb = beads.some((b) => b.current && b.tiebreak);

  return (
    <table className="bl-score" data-spine data-tb={liveTb ? "1" : undefined}>
      <caption className="sr-only">
        Nested score — sets, games, and points
        {liveTb ? ", tie-break in progress" : ""}
        {match.playerA.serving
          ? `, ${match.playerA.name} on serve`
          : match.playerB.serving
            ? `, ${match.playerB.name} on serve`
            : ""}
      </caption>
      <colgroup>
        <col className="bl-col-player" />
        {useSetCols
          ? beads.map((b, i) => (
              <col key={b.current ? `live-${i}` : `set-${i}`} className="bl-col-set" />
            ))
          : null}
        {!useSetCols ? <col className="bl-col-sets" /> : null}
        {liveTb ? (
          <col className="bl-col-tb" />
        ) : (
          <>
            <col className="bl-col-games" />
            <col className="bl-col-pts" />
          </>
        )}
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className="bl-score-player-h">
            <span className="sr-only">Player</span>
          </th>
          {useSetCols
            ? beads.map((b, i) => (
                <th
                  key={`h-${i}`}
                  scope="col"
                  className={b.current ? "is-live-set" : undefined}
                  title={b.tiebreak ? "Tiebreak" : `Set ${i + 1}`}
                >
                  {b.tiebreak ? "TB" : i + 1}
                </th>
              ))
            : (
              <th scope="col">Sets</th>
            )}
          {liveTb ? (
            <th scope="col" className="is-live-set">
              TB
            </th>
          ) : (
            <>
              <th scope="col">G</th>
              <th scope="col">Pts</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((p, side) => (
          <tr key={p.short} className={p.serving ? "is-serving" : undefined}>
            <th scope="row" className="bl-score-player">
              <span className="bl-code">{p.short}</span>
              <span className="bl-player-name">
                {p.name}
                {p.seed ? <span className="bl-seed"> ({p.seed})</span> : null}
              </span>
              {p.serving ? (
                <span className="bl-on-serve">
                  <span className="bl-serve-pip" aria-hidden="true" />
                  ON SERVE
                </span>
              ) : (
                <span className="bl-serve-spacer" aria-hidden="true" />
              )}
            </th>
            {useSetCols
              ? beads.map((b, i) => {
                  const val = side === 0 ? b.a : b.b;
                  const other = side === 0 ? b.b : b.a;
                  const won = !b.current && val > other;
                  return (
                    <td
                      key={`${p.short}-s${i}`}
                      className={`bl-mono${b.current ? " is-live-set" : ""}${won ? " is-won-set" : ""}`}
                    >
                      {match.status === "upcoming" ? "—" : val}
                    </td>
                  );
                })
              : (
                <td className="bl-mono">{match.status === "upcoming" ? "—" : p.setsWon}</td>
              )}
            {liveTb ? (
              <td className="bl-mono is-live-set">{p.points}</td>
            ) : (
              <>
                <td className="bl-mono">{match.status === "upcoming" ? "—" : p.games}</td>
                <td className="bl-mono">{match.status === "upcoming" ? "—" : p.points}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SetBeadRail({ match }: { match: LiveMatch }) {
  if (!match.setBeads.length) return null;
  return (
    <div className="bl-set-beads" aria-label="Set progress">
      {match.setBeads.map((bead, i) => (
        <div
          key={`bead-${i}`}
          className={`bl-set-bead${bead.current ? " is-current" : ""}${bead.tiebreak ? " is-tb" : ""}`}
          data-status={bead.current ? "live" : "final"}
        >
          <span className="bl-set-bead__label">{bead.tiebreak ? "TB" : `S${i + 1}`}</span>
          <span className="bl-set-bead__score bl-mono">{beadLabel(bead)}</span>
          {bead.current ? <span className="bl-set-bead__live">live</span> : null}
        </div>
      ))}
    </div>
  );
}

function PointTrail({ trail, liveTb }: { trail: string[]; liveTb?: boolean }) {
  if (!trail.length) return null;
  return (
    <div className="bl-point-trail" aria-label={liveTb ? "Tie-break point trail" : "Current game point trail"}>
      <span className="bl-point-trail__label">{liveTb ? "This tie-break" : "This game"}</span>
      <ol className="bl-point-trail__list">
        {trail.map((pt, i) => (
          <li
            key={`${pt}-${i}`}
            className={`bl-point-trail__pt${i === trail.length - 1 ? " is-latest" : ""}`}
          >
            <span className="bl-mono">{pt}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FormatLensRail({ match, lens }: { match: LiveMatch; lens: FormatLens }) {
  const { title, facts } = lensFacts(match, lens);
  return (
    <div className="bl-lens-rail" data-format={lens}>
      <p className="bl-lens-rail__title">{title}</p>
      <ul className="bl-lens-rail__facts">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    </div>
  );
}

function CourtTheater({
  match,
  lens,
  onLens,
  compact = false,
}: {
  match: LiveMatch;
  lens: FormatLens;
  onLens?: (f: FormatLens) => void;
  compact?: boolean;
}) {
  const surface = SURFACE_ATMOSPHERE[match.surface];
  const formatGroupId = useId();
  const liveTb = match.setBeads.some((b) => b.current && b.tiebreak);

  return (
    <div
      className={`bl-theater${compact ? " bl-theater--compact" : ""}`}
      data-surface={match.surface}
      data-tb={liveTb ? "1" : undefined}
      style={
        {
          "--bl-surface-wash": surface.wash,
          "--bl-surface-line": surface.line,
          "--bl-surface-glow": surface.glow,
          "--bl-surface-chalk": surface.chalk,
        } as CSSProperties
      }
    >
      <div className="bl-theater__meta">
        <p className="bl-theater__surface">{surface.label}</p>
        <p className="bl-theater__venue">
          {match.round} · {match.venue}
        </p>
      </div>

      {onLens ? (
        <div className="bl-theater__format" role="group" aria-labelledby={formatGroupId}>
          <span className="bl-theater__format-label" id={formatGroupId}>
            Format lens
          </span>
          <div className="bl-tabs bl-tabs--inline" role="radiogroup" aria-label="Match format lens">
            {(
              [
                ["BO3", "Best of 3"],
                ["BO5", "Best of 5"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={lens === id}
                className={lens === id ? "is-active" : undefined}
                onClick={() => onLens(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="bl-theater__format-hint">
            {lens === "BO3"
              ? "Secondary rail: break chances and return games under pressure."
              : "Secondary rail: set momentum and legs left — same score, different story."}
          </p>
        </div>
      ) : null}

      <NestedScore match={match} />
      <SetBeadRail match={match} />

      {match.pressureLabel ? (
        <p className="bl-pressure bl-pressure--band" role="status">
          {match.pressureLabel}
        </p>
      ) : null}

      <p className="bl-situation-line">{match.note}</p>

      {match.challengePending ? (
        <p className="bl-challenge" role="status">
          Challenge pending — score holds until confirmed
        </p>
      ) : null}

      <PointTrail trail={match.pointTrail} liveTb={liveTb} />
      <FormatLensRail match={match} lens={lens} />
    </div>
  );
}

function SituationBlock({ match, lens }: { match: LiveMatch; lens?: FormatLens }) {
  const activeLens = lens ?? match.format;
  const liveTb = match.setBeads.some((b) => b.current && b.tiebreak);
  return (
    <div className="bl-situation">
      <SetBeadRail match={match} />
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
      <PointTrail trail={match.pointTrail} liveTb={liveTb} />
      <FormatLensRail match={match} lens={activeLens} />
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

function MatchList({ lens }: { lens?: FormatLens }) {
  const ordered = [...LIVE_MATCHES].sort((a, b) => {
    if (!lens) return 0;
    const aMatch = a.format === lens ? 0 : 1;
    const bMatch = b.format === lens ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    const statusRank = (s: LiveMatch["status"]) => (s === "live" ? 0 : s === "upcoming" ? 1 : 2);
    return statusRank(a.status) - statusRank(b.status);
  });

  return (
    <ul className="bl-match-list">
      {ordered.map((m, i) => (
        <li
          key={m.id}
          id={`match-${m.id}`}
          className={`bl-match-row${lens && m.format !== lens ? " is-lens-dim" : ""}`}
          data-reveal
          data-surface={m.surface}
          style={{ transitionDelay: `${Math.min(i, 4) * 40}ms` }}
        >
          <div className="bl-match-meta">
            <span className={`bl-pill bl-pill-${m.status}`}>
              <span className="bl-pill-dot" aria-hidden="true" />
              {statusLabel(m.status)}
            </span>
            <span className="bl-format">{formatLabel(m.format)}</span>
            <span className="bl-series">{m.tournament}</span>
          </div>
          <div className="bl-match-body">
            <NestedScore match={m} />
            <SituationBlock match={m} lens={lens ?? m.format} />
            <p className="bl-venue">
              {SURFACE_ATMOSPHERE[m.surface].label} · {m.round} · {m.venue}
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
  const [lens, setLens] = useState<FormatLens>(FEATURED.format);
  return (
    <>
      <section className="bl-hero bl-hero--theater" aria-labelledby="bl-hero-title">
        <div className="bl-hero-media" data-surface={FEATURED.surface}>
          <SiteImg
            src={FEATURED.image || HERO_IMAGE}
            alt={FEATURED.imageAlt}
            width={1600}
            height={1067}
            priority
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
            <span className="bl-kicker-meta">{SURFACE_ATMOSPHERE[FEATURED.surface].label}</span>
          </p>
          <p className="bl-brand-hero">BASELINE</p>
          <h1 id="bl-hero-title" className="bl-display">
            One break point owns the third
          </h1>
          <p className="bl-lede">
            Nested stack first — sets, games, the point you are in. Format lens changes what the
            secondary rail argues about.
          </p>
          <div className="bl-hero-actions">
            <Link className="bl-btn bl-btn-primary" href="/baseline/live">
              Open court theater
            </Link>
            <Link className="bl-btn bl-btn-ghost" href="/baseline/scorecard">
              Full scorecard
            </Link>
          </div>
          <div className="bl-hero-scorecard" aria-label="Featured court theater">
            <CourtTheater match={FEATURED} lens={lens} onLens={setLens} compact />
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
            Status, nested spine, set beads, point trail — then Live for the full theater.
          </p>
        </div>
        <MatchList lens={lens} />
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
  const [lens, setLens] = useState<FormatLens>("BO3");
  const featured =
    LIVE_MATCHES.find((m) => m.format === lens && m.status === "live") ??
    LIVE_MATCHES.find((m) => m.status === "live") ??
    FEATURED;

  return (
    <section className="bl-section bl-matches bl-page-live" aria-labelledby="live-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">Live court</p>
        <h1 id="live-title" className="bl-h2">
          Court theater
        </h1>
        <p className="bl-section-dek">
          Serve ownership, pressure band, set beads, point trail. Flip the format lens — secondary
          facts change; the nested score stays.
        </p>
      </div>
      <article
        className="bl-match-row bl-featured-live bl-featured-theater"
        data-surface={featured.surface}
      >
        <div className="bl-featured-theater__grid">
          <div className="bl-featured-theater__stage">
            <div className="bl-match-meta">
              <span className="bl-pill bl-pill-live">
                <span className="bl-pill-dot" aria-hidden="true" />
                Live
              </span>
              <span className="bl-format">{formatLabel(featured.format)}</span>
              <span className="bl-series">{featured.tournament}</span>
            </div>
            <CourtTheater match={featured} lens={lens} onLens={setLens} />
            <Link className="bl-match-link" href="/baseline/scorecard">
              Full scorecard →
            </Link>
          </div>
          <div className="bl-featured-theater__media">
            <SiteImg
              src={featured.image}
              alt={featured.imageAlt}
              width={1200}
              height={900}
            />
          </div>
        </div>
      </article>
      <MatchList lens={lens} />
    </section>
  );
}

function ScorecardMain() {
  const [lens, setLens] = useState<FormatLens>(FEATURED.format);
  const sets = FEATURED.setBeads.map((b, i) => ({
    set: i + 1,
    a: b.a,
    b: b.b,
    note: b.current
      ? "In progress · break point"
      : b.tiebreak
        ? "Tie-break"
        : i === 0
          ? "Świątek broke late"
          : "Pegula held through deuce games",
    current: !!b.current,
  }));

  return (
    <section className="bl-section" aria-labelledby="scorecard-title">
      <div className="bl-section-head">
        <p className="bl-eyebrow">Scorecard</p>
        <h1 id="scorecard-title" className="bl-h2">
          Set history — semi-final
        </h1>
        <p className="bl-section-dek">
          After-play depth one tap from Live. Theater objects stay; set line expands without layout
          jitter.
        </p>
        <div className="bl-hero-scorecard" aria-label="Live court theater">
          <CourtTheater match={FEATURED} lens={lens} onLens={setLens} compact />
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
              <tr key={r.set} className={r.current ? "is-current-set" : undefined}>
                <td className="bl-mono">{r.set}</td>
                <td className="bl-mono">{r.a}</td>
                <td className="bl-mono">{r.b}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bl-point-tree">
          <p className="bl-eyebrow">Point trail (this game)</p>
          <ol className="bl-point-list bl-mono">
            {FEATURED.pointTrail.map((pt, i) => (
              <li key={`${pt}-${i}`} className={i === FEATURED.pointTrail.length - 1 ? "is-latest" : undefined}>
                {pt}
                {i === FEATURED.pointTrail.length - 1 ? " · break point · return pending" : ""}
              </li>
            ))}
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
        <SiteImg src={STORIES[0]!.image} alt={STORIES[0]!.imageAlt} width={1200} height={800} />
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
            <SiteImg src={s.image} alt={s.imageAlt} width={1000} height={700} />
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
