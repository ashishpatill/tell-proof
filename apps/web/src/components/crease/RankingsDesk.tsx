"use client";

import { useState } from "react";
import type { PlayerRankingRow, RankingRow } from "./data";

type RankFormat = "test" | "odi" | "t20";
type RankAxis = "team" | "player-bat" | "player-bowl";

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

export function RankingsDesk({
  test,
  odi,
  t20,
  bat,
  bowl,
}: {
  test: RankingRow[];
  odi: RankingRow[];
  t20: RankingRow[];
  bat: PlayerRankingRow[];
  bowl: PlayerRankingRow[];
}) {
  const [rankFormat, setRankFormat] = useState<RankFormat>("odi");
  const [axis, setAxis] = useState<RankAxis>("team");
  const rankings = rankFormat === "test" ? test : rankFormat === "t20" ? t20 : odi;

  return (
    <>
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
        <PlayerRankTable rows={axis === "player-bat" ? bat : bowl} />
      )}
    </>
  );
}
