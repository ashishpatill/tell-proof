// Safe structural pass. From the captured bounding rects we derive: the hero (first large
// text block up top), the content column width, section containers (tall full-width surfaces)
// sorted top→bottom for vertical rhythm + surface alternation, and grid groups (near-equal
// sibling rects) for gap normalization. Everything guards `rect` (it is z.optional): with no
// rects we degrade to non-layout recipes and touch nothing structural.

import type { ComputedStyleSample } from "@tell/schema";

export type Rect = { x: number; y: number; w: number; h: number };

export type LayoutModel = {
  hasRects: boolean;
  pageWidth: number;
  heroHeadingId: string | null;   // the display headline to art-direct
  heroContainerId: string | null; // its surrounding section/header (for background treatment)
  contentIds: string[];           // wide containers to constrain to the reading column
  sectionOrder: { id: string; index: number }[]; // section containers, top→bottom, for rhythm
  cardIds: string[];              // repeated tile cards (grid children)
  navId: string | null;
  footerId: string | null;
};

const rectOf = (s: ComputedStyleSample): Rect | null => (s.rect && s.rect.w > 0 ? s.rect : null);

export function analyzeLayout(styles: ComputedStyleSample[]): LayoutModel {
  const withRect = styles.filter((s) => s.tellId && rectOf(s));
  const hasRects = withRect.length > 0;

  const pageWidth = Math.max(360, ...styles.map((s) => rectOf(s)?.w ?? 0), 1440);

  const empty: LayoutModel = {
    hasRects, pageWidth,
    heroHeadingId: null, heroContainerId: null,
    contentIds: [], sectionOrder: [], cardIds: [],
    navId: styles.find((s) => s.role === "nav")?.tellId || null,
    footerId: styles.find((s) => s.tag === "footer")?.tellId || null,
  };
  if (!hasRects) return empty;

  // ── hero: the largest-area display/heading in the top 900px ──
  const heroCandidates = withRect
    .filter((s) => (s.role === "display" || s.role === "heading") && (rectOf(s)!.y) < 900)
    .sort((a, b) => (rectOf(b)!.w * rectOf(b)!.h) - (rectOf(a)!.w * rectOf(a)!.h));
  const heroHeadingId = heroCandidates[0]?.tellId || null;
  const heroRect = heroCandidates[0] ? rectOf(heroCandidates[0]!) : null;

  // hero container: the smallest surface/section that fully encloses the hero heading and sits high.
  let heroContainerId: string | null = null;
  if (heroRect) {
    const containers = withRect
      .filter((s) => (s.role === "surface" || s.role === "card" || s.tag === "header" || s.tag === "section") && s.tellId !== heroHeadingId)
      .filter((s) => {
        const r = rectOf(s)!;
        return r.y <= heroRect.y + 4 && r.y + r.h >= heroRect.y + heroRect.h - 4 && r.x <= heroRect.x + 4 && r.w >= heroRect.w - 8 && r.y < 700;
      })
      .sort((a, b) => (rectOf(a)!.w * rectOf(a)!.h) - (rectOf(b)!.w * rectOf(b)!.h));
    heroContainerId = containers[0]?.tellId || null;
  }

  // ── content column: wide containers (surfaces/sections) near page width ──
  const contentIds = withRect
    .filter((s) => (s.role === "surface" || s.role === "card") && rectOf(s)!.w >= pageWidth * 0.7 && rectOf(s)!.h >= 120)
    .map((s) => s.tellId)
    .filter((id) => id && id !== heroContainerId) as string[];

  // ── section containers for rhythm: tall, wide, top→bottom ──
  const sections = withRect
    .filter((s) => (s.role === "surface" || s.role === "card") && rectOf(s)!.w >= pageWidth * 0.6 && rectOf(s)!.h >= 150)
    .filter((s) => s.tellId !== heroContainerId && s.tag !== "footer" && s.role !== "nav")
    .sort((a, b) => rectOf(a)!.y - rectOf(b)!.y);
  const sectionOrder = sections.map((s, index) => ({ id: s.tellId, index }));

  // ── grid tiles: repeated cards of similar size (the feature/pricing tiles) ──
  const tiles = withRect.filter((s) => s.role === "card" && rectOf(s)!.w < pageWidth * 0.5 && rectOf(s)!.w > 120);
  // cluster by width bucket; keep buckets that repeat (≥2)
  const buckets = new Map<number, ComputedStyleSample[]>();
  for (const t of tiles) {
    const key = Math.round(rectOf(t)!.w / 40) * 40;
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(t);
  }
  const cardIds: string[] = [];
  for (const arr of buckets.values()) if (arr.length >= 2) for (const t of arr) cardIds.push(t.tellId);

  return {
    hasRects, pageWidth,
    heroHeadingId, heroContainerId,
    contentIds, sectionOrder, cardIds,
    navId: empty.navId, footerId: empty.footerId,
  };
}

/** Width-aware hero size: never overflow the measured container. */
export function fitHeroSize(targetPx: number, headingWidth: number | null): number {
  if (!headingWidth || headingWidth <= 0) return Math.max(34, Math.min(targetPx, 64));
  // A headline of ~0.55·size per glyph needs width ≥ chars·0.55·size. Without text we cap by a
  // conservative width fraction so a big display never spills its measured box.
  const widthCap = Math.floor(headingWidth / 5.2);
  return Math.max(34, Math.min(targetPx, widthCap));
}
