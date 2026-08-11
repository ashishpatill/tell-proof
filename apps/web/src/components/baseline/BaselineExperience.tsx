import type { ReactNode } from "react";
import type { BaselineRouteId } from "./baselineNav";
import { HomeBoard, LiveBoard, RankingsBoard, ScorecardBoard } from "./BaselineBoards";
import { SiteImg } from "@/components/site-media/SiteImg";
import { STORIES, TOURNAMENTS } from "./data";

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
  home: HomeBoard,
  live: LiveBoard,
  scorecard: ScorecardBoard,
  series: SeriesMain,
  rankings: RankingsBoard,
  notebook: NotebookMain,
};

/** Page body only — chrome lives in the baseline layout so nav stays mounted. */
export function BaselineExperience({ page = "home" }: { page?: BaselineRouteId }) {
  const Main = PAGE_MAIN[page];
  return <Main />;
}
