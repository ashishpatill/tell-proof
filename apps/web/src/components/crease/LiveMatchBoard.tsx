"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FEATURED,
  LIVE_MATCHES,
  ballLabel,
  type BallEvent,
  type LiveMatch,
} from "./data";

type LiveFilter = "all" | "live" | "upcoming" | "result";

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

/** Client island: status tabs + filtered match list (no server→client function props). */
export function LiveMatchBoard() {
  const [filter, setFilter] = useState<LiveFilter>("all");
  const rows =
    filter === "all" ? LIVE_MATCHES : LIVE_MATCHES.filter((m) => m.status === filter);

  return (
    <>
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
    </>
  );
}
