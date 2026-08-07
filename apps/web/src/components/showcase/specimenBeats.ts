/**
 * Showcase cinema beat discovery — pure helpers so craft-first reel policy is unit-testable.
 * Empty specimen / feature cards must never open the reel when a unique craft figure exists.
 */

export type SpecimenBeat = { id: string; y: number; label: string };

export type SpecimenPrefer = "hero" | "figure" | "auto";

/** How far into a craft figure the still/cinema should land past claim chrome. */
export function craftFigureFloor(doc: Pick<Document, "querySelector">): number {
  if (doc.querySelector(".ds-press-sheet, [data-sitekind='press-atelier']")) return 360;
  if (doc.querySelector(".ds-register-ledger, [data-sitekind='archive-index']")) return 300;
  if (doc.querySelector(".ds-chrono-lattice, [data-sitekind='observatory-signal']")) return 300;
  if (doc.querySelector(".ds-folio-plate, [data-sitekind='research-dossier']")) return 280;
  if (doc.querySelector(".ds-seam-figure")) return 260;
  return 220;
}

export function discoverBeats(doc: Document): SpecimenBeat[] {
  const win = doc.defaultView;
  if (!win) return [{ id: "top", y: 96, label: "Fold" }];

  const pick = (sel: string, id: string, label: string): SpecimenBeat | null => {
    const el = doc.querySelector(sel);
    if (!el) return null;
    const y = Math.max(0, Math.round(el.getBoundingClientRect().top + win.scrollY - 28));
    return { id, y, label };
  };

  const beats: SpecimenBeat[] = [];
  const hero =
    pick(".ds-press-label .ds-display, .ds-weft-display, .ds-hero .ds-display", "hero", "Claim") ||
    pick(".ds-hero", "hero", "Claim") ||
    pick("h1", "hero", "Claim");
  if (hero) beats.push(hero);

  const figureRaw =
    pick(".ds-hero .ds-press-sheet .ds-fig, .ds-press-sheet", "figure", "Forme") ||
    pick(".ds-hero .ds-press-plate .ds-fig, .ds-press-plate, .ds-voucher-plate", "figure", "Specimen") ||
    pick(".ds-hero .ds-drawloom-cloth .ds-fig, .ds-drawloom-cloth, .ds-loom-plate", "figure", "Loom") ||
    pick(".ds-hero .ds-register-ledger .ds-fig, .ds-register-ledger", "figure", "Ledger") ||
    pick(".ds-hero .ds-chrono-lattice .ds-fig, .ds-chrono-lattice", "figure", "Lattice") ||
    pick(".ds-hero .ds-folio-plate .ds-fig, .ds-folio-plate", "figure", "Plate") ||
    pick(".ds-hero .ds-seam-figure .ds-fig, .ds-seam-figure", "figure", "Ladder") ||
    pick(".ds-hero .ds-plate-bleed", "figure", "Figure") ||
    pick(".ds-plate-bleed .ds-fig", "figure", "Figure") ||
    pick(".ds-alt-figure, [data-section='features'] .ds-plate", "figure", "Figure");

  if (figureRaw) {
    const floor = craftFigureFloor(doc);
    const figure =
      figureRaw.y < floor ? { ...figureRaw, y: Math.max(figureRaw.y, floor) } : figureRaw;
    if (!hero || Math.abs(figure.y - hero.y) > 80) beats.push(figure);
  }

  const metrics = pick(".ds-metrics-band, [data-section='metrics']", "metrics", "Stakes");
  if (metrics) beats.push(metrics);

  const hasCraftFigure = beats.some((b) => b.id === "figure");
  const instruments =
    pick("[data-section='features'] .ds-index, [data-section='features']", "instruments", "Index");
  if (instruments && instruments.y > 400 && !hasCraftFigure) beats.push(instruments);

  const specimen = pick(".ds-specimen, [data-section='specimen']", "specimen", "Specimen");
  if (specimen && !hasCraftFigure) beats.push(specimen);

  const spread = pick(
    ".ds-spread, .ds-marginalia, .ds-chrono, .ds-entry, .ds-hangtag, .ds-range, .ds-gather, [data-section='story']",
    "spread",
    "Spread",
  );
  if (spread) beats.push(spread);

  const proof =
    pick(".ds-proof-board, .ds-proof", "proof", "Proof") ||
    pick("[data-surface='inverse']", "proof", "Proof");
  if (proof) beats.push(proof);

  const imprint = pick(".ds-closing-colophon, .ds-closing, #cta", "imprint", "Imprint");
  if (imprint) beats.push(imprint);

  const out: SpecimenBeat[] = [];
  for (const b of beats.sort((a, c) => a.y - c.y)) {
    if (out.length && Math.abs(out[out.length - 1]!.y - b.y) < 90) continue;
    out.push(b);
  }
  return (out.length ? out : [{ id: "top", y: 96, label: "Fold" }]).slice(0, 6);
}

export function pickStill(beats: SpecimenBeat[], prefer: SpecimenPrefer = "auto"): SpecimenBeat {
  const figure = beats.find((b) => b.id === "figure");
  const hero = beats.find((b) => b.id === "hero");
  const spread = beats.find((b) => b.id === "spread");
  const specimen = beats.find((b) => b.id === "specimen");
  if (prefer === "hero") return hero || figure || beats[0]!;
  // Craft figure always wins when present — never open on sparse specimen chrome.
  if (figure && figure.y >= 140) return figure;
  if (spread && spread.y >= 200) return spread;
  if (specimen && specimen.y >= 200 && !figure) return specimen;
  if (hero) return hero;
  if (figure) return { ...figure, y: Math.max(figure.y, 168) };
  return { ...beats[0]!, y: Math.max(beats[0]!.y, 96) };
}

/**
 * Craft-first cinema order. When a unique figure exists, lock forme → essay → proof
 * regardless of prefer — prefer=figure is the gallery default; auto must not reopen on specimen.
 */
export function orderCinemaBeats(
  beats: SpecimenBeat[],
  prefer: SpecimenPrefer = "auto",
): SpecimenBeat[] {
  const hasFigure = beats.some((b) => b.id === "figure");
  if (!hasFigure && prefer !== "figure") return beats;
  const order = hasFigure
    ? ["figure", "spread", "proof", "imprint"]
    : ["figure", "spread", "proof", "imprint", "specimen", "hero"];
  const picked = order
    .map((id) => beats.find((b) => b.id === id))
    .filter((b): b is SpecimenBeat => Boolean(b));
  return picked.length >= 2 ? picked : beats;
}
