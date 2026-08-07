/**
 * Section construction — turn the plan from `composition.ts` into filled section specs.
 *
 * Every string on the page traces back to something the brief declared. No invented customer
 * names, no fabricated percentages, no "trusted by thousands of teams".
 */
import { planSections, type SectionPlan } from "./composition";
import {
  chapters,
  count,
  ctaFor,
  eyebrows,
  featuresLede,
  featuresTitle,
  headline,
  heroLede,
  navFor,
  outcomeNames,
  outcomes,
  plans,
  pullQuote,
  questions,
  sentence,
} from "./copy";
import { catalogueBody, editorialize, type FeatureCopy } from "./editorial";
import { AESTHETIC_PROFILES } from "./tokens";
import { Block, SectionSpec, type DesignBrief, type FeatureSpec, type SkillNodeId, type TasteControls } from "./types";
import type { FeatureAnalysis } from "./analyze";

function block(input: Partial<Block> & { title: string }): Block {
  return Block.parse(input);
}

function skillFor(kind: SectionPlan["kind"]): SkillNodeId {
  switch (kind) {
    case "nav":
    case "footer":
      return "navigation-header-footer";
    case "hero":
      return "hero-section";
    case "features":
    case "compare":
      return "features-benefits";
    case "pricing":
      return "pricing-or-plans";
    case "story":
    case "figure":
    case "specimen":
      return "content-storytelling-pages";
    case "app":
      return "dashboard-or-webapp-ui";
    case "metrics":
    case "proof":
    case "faq":
    case "cta":
    default:
      return "forms-ctas-conversion";
  }
}

function inspiration(lean: TasteControls["aestheticLean"], skill: SkillNodeId, layout: string): string[] {
  const profile = AESTHETIC_PROFILES[lean];
  return [`${profile.label} — ${profile.sectionBias}`, `Layout: ${layout}`, `Skill node: ${skill}`];
}

/**
 * The capability catalogue — the one section allowed to carry a full description, because it is
 * the section a reader scans to answer "does it do X".
 */
function featureBlocks(copies: FeatureCopy[]): Block[] {
  return copies.map((c, i) =>
    block({
      title: c.name,
      body: catalogueBody(c),
      kicker: c.tier,
      meta: String(i + 1).padStart(2, "0"),
      emphasis: i === 0 ? "lead" : c.priority === "p2" ? "quiet" : "normal",
    }),
  );
}

export function buildSections(
  brief: DesignBrief,
  analysis: FeatureAnalysis,
  taste: TasteControls,
): SectionSpec[] {
  const features = analysis.prioritized;
  const p0 = features.filter((f) => f.priority === "p0");
  const plan = planSections({
    siteKind: analysis.siteKind,
    lean: taste.aestheticLean,
    density: taste.density,
    featureCount: features.length,
    p0Count: p0.length,
    goal: brief.businessGoal,
  });

  const eyebrow = eyebrows(brief);
  const cta = ctaFor(brief.businessGoal, brief.siteKind);
  const navItems = navFor(plan.map((p) => ({ kind: p.kind, id: p.id })));
  const editorial = editorialize(features);
  const allBlocks = featureBlocks(editorial.features);

  const sections: SectionSpec[] = [];
  let featureCursor = 0;

  for (const p of plan) {
    const base = {
      id: p.id,
      kind: p.kind,
      layout: p.layout,
      surface: p.surface,
      columns: p.columns,
      bond: p.bond ?? false,
      skillNode: skillFor(p.kind),
      inspirationNotes: inspiration(taste.aestheticLean, skillFor(p.kind), p.layout),
    };

    switch (p.kind) {
      case "nav":
        sections.push(
          SectionSpec.parse({
            ...base,
            title: brief.productName,
            brandLabel: brief.productName,
            navItems,
            ctaLabel: cta.primary,
          }),
        );
        break;

      case "hero": {
        /*
         * The fold names the core capabilities and says nothing else about them. It used to carry a
         * definition list whose values were descriptions hard-truncated at 42 characters, so every
         * generated page opened with three monospace boxes containing sentences cut mid-word.
         */
        const core = editorial.features.filter((c) => c.priority === "p0").slice(0, 4);
        const named = (core.length ? core : editorial.features.slice(0, 3)).map((c) =>
          block({ title: c.name, emphasis: "normal" }),
        );
        const isDossier = brief.siteKind === "research-dossier";
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: brief.audience,
            title: headline(brief, features),
            body: heroLede(brief, editorial.heroLines),
            brandLabel: brief.productName,
            ctaLabel: cta.primary,
            secondaryLabel: cta.secondary,
            // Folio fold must leave room for the dossier plate — skip the reassurance line.
            ctaNote: isDossier ? undefined : cta.note,
            blocks: named,
            aside: editorial.features
              .slice(0, 4)
              .map((c, i) => block({ title: c.name, meta: c.tier, emphasis: i === 0 ? "lead" : "normal" })),
          }),
        );
        break;
      }

      case "metrics": {
        const stated = editorial.outcomesAreStated;
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.metrics,
            title: stated
              ? sentence(`What ${brief.audience} stop doing once ${brief.productName} is in place`)
              : sentence(`What ${brief.productName} covers`),
            metrics: stated
              ? outcomes(editorial.outcomeFeatures)
              : outcomeNames(editorial.features),
          }),
        );
        break;
      }

      case "features": {
        /*
         * A follow-on catalogue has to be worth the heading, the lede and the screen it takes.
         *
         * The split was a flat 60/40, so a four-capability brief produced a second section titled
         * "the rest of what ships with X" containing exactly one row — a full screen of chrome
         * around a single line, which is what a page looks like when it has run out of things to
         * say and keeps the furniture anyway. Below two leftovers the catalogue is not split.
         */
        const total = allBlocks.length;
        const wanted = Math.min(total, Math.max(3, Math.ceil(total * 0.6)));
        const first = total - wanted < 2 ? total : wanted;
        const slice =
          featureCursor === 0 ? allBlocks.slice(0, first) : allBlocks.slice(Math.max(0, featureCursor));
        featureCursor = featureCursor === 0 ? slice.length : featureCursor + slice.length;
        if (!slice.length) break;
        const isSecond = p.id !== "features";
        const isStudio = brief.siteKind === "art-directed-studio";
        const isConsumer = brief.siteKind === "consumer-craft";
        const isFoundry = brief.siteKind === "editorial-foundry";
        const isDossier = brief.siteKind === "research-dossier";
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: isSecond
              ? isStudio
                ? "Also in practice"
                : isConsumer
                  ? "Also in the bag"
                  : isFoundry
                    ? "Also cut"
                    : isDossier
                      ? "Also in the brief"
                    : "Also included"
              : isStudio
                ? "Selected work"
                : isConsumer
                  ? "In hand"
                  : isFoundry
                    ? "The cuts"
                    : isDossier
                      ? "The instruments"
                    : eyebrow.features,
            title: isSecond
              ? isStudio
                ? sentence(`The quieter practices that keep ${brief.productName} sharp`)
                : isConsumer
                  ? sentence(`The details you notice on week three`)
                  : isFoundry
                    ? sentence(`The quieter cuts that keep the system honest`)
                  : isDossier
                    ? sentence(`The quieter instruments that keep a brief honest`)
                  : sentence(`The rest of what ships with ${brief.productName}`)
              : isStudio
                ? sentence(`Work that still holds after the launch week`)
                : isConsumer
                  ? sentence(`Built for the day you actually have`)
                  : isFoundry
                    ? sentence(`Cuts drawn for real reading sizes`)
                  : isDossier
                    ? sentence(`Instruments a capital brief actually uses`)
                  : featuresTitle(brief, features),
            body: isSecond
              ? isStudio
                ? sentence(`Handoffs, critique, and the rules that stop the system from drifting`)
                : isConsumer
                  ? sentence(`Repair, modes, and the pockets that keep unpacking honest`)
                  : isFoundry
                    ? sentence(`Italics, numerals, and the marks that stop a layout from inventing a second face`)
                  : isDossier
                    ? sentence(`Sources, caveats, and the rails that stop a memo from inventing conviction`)
                  : sentence(`Smaller surface area, same standard — these remove the objections that stall a rollout`)
              : isStudio
                ? sentence(`Each engagement is a composed surface — identity, product, and motion under one grid`)
                : isConsumer
                  ? sentence(`Each capability is something you can point at on the product — not a lifestyle claim`)
                  : isFoundry
                    ? sentence(`Each cut is a size and a job — not a style picker dressed as a product`)
                  : isDossier
                    ? sentence(`Each instrument is a named reading — not a dashboard dressed as research`)
                  : featuresLede(brief, features),
            blocks: slice,
          }),
        );
        break;
      }

      case "specimen": {
        /*
         * One short heading. This band exists to be looked at — eyebrow + lede here steal characters
         * from the quiet beat the denser screens are measured against.
         */
        sections.push(
          SectionSpec.parse({
            ...base,
            // Consumer specimen is a drawn beat — keep the title to a short brand mark.
            title:
              brief.siteKind === "consumer-craft"
                ? brief.productName.split(/\s+/)[0] ?? brief.productName
                : brief.siteKind === "editorial-foundry"
                  ? sentence(`${brief.productName} at reading size`)
                : brief.siteKind === "research-dossier"
                  ? sentence(`${brief.productName} field plate`)
                : sentence(brief.productName),
            body: "",
          }),
        );
        break;
      }

      case "figure": {
        const focal = editorial.features[0];
        const isFoundry = brief.siteKind === "editorial-foundry";
        const isDossier = brief.siteKind === "research-dossier";
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: isFoundry ? "Optical sizes" : isDossier ? "Plate legend" : eyebrow.figure,
            title: isFoundry
              ? sentence(`How ${brief.productName} changes with size`)
              : isDossier
                ? sentence(`How ${brief.productName} maps a briefing`)
              : sentence(`${focal?.name ?? brief.productName}, step by step`),
            body: isFoundry
              ? sentence(`The same face at display, title, deck, text, and caption — drawn, not described`)
              : isDossier
                ? sentence(`Pins, coordinates, and regions — the instruments drawn rather than claimed`)
              : sentence(
                  `The path work takes through ${brief.productName}, drawn rather than described`,
                ),
            // Step labels only. A diagram whose legend restates every description is a paragraph
            // with a picture behind it.
            blocks: editorial.features.slice(0, 4).map((c, i) =>
              block({ title: c.name, meta: `0${i + 1}` }),
            ),
            figureCaption: isFoundry
              ? sentence(`Step through the optical sizes ${brief.productName} is cut for`)
              : isDossier
                ? sentence(`Read the pins that mark each instrument on the dossier plate`)
              : sentence(
                  `Drag to step through how ${brief.productName} moves work from ${
                    features[0]?.name.toLowerCase() ?? "input"
                  } to ${features[features.length - 1]?.name.toLowerCase() ?? "outcome"}`,
                ),
          }),
        );
        break;
      }

      case "story":
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow:
              brief.siteKind === "art-directed-studio"
                ? "Method"
                : brief.siteKind === "consumer-craft"
                  ? "In use"
                  : brief.siteKind === "editorial-foundry"
                    ? "Composition notes"
                  : brief.siteKind === "research-dossier"
                    ? "Reading notes"
                  : eyebrow.story,
            title:
              brief.siteKind === "art-directed-studio"
                ? sentence(`How a system gets made here`)
                : brief.siteKind === "consumer-craft"
                  ? sentence(`A day with ${brief.productName}`)
                  : brief.siteKind === "editorial-foundry"
                    ? sentence(`How the face is set on a real page`)
                  : brief.siteKind === "research-dossier"
                    ? sentence(`How a brief is actually read`)
                  : sentence(`The order things happen in`),
            body:
              brief.siteKind === "art-directed-studio"
                ? sentence(`The sequence from first critique to handoff, without the pitch theatre`)
                : brief.siteKind === "consumer-craft"
                  ? sentence(`From morning pack to evening empty — what you actually do with it`)
                  : brief.siteKind === "editorial-foundry"
                    ? sentence(`Measure, hierarchy, and the notes that keep a layout from drifting`)
                  : brief.siteKind === "research-dossier"
                    ? sentence(`Verso claim, recto evidence, footnotes that keep conviction honest`)
                  : sentence(`The sequence ${brief.audience} actually meet, in order`),
            blocks: chapters(editorial.features).map((c, i) =>
              block({
                title: c.title,
                body: c.body,
                meta: c.meta,
                // Marginalia / footnotes hang these kickers beside the essay.
                kicker:
                  brief.siteKind === "editorial-foundry" || brief.siteKind === "research-dossier"
                    ? `Note ${String(i + 1).padStart(2, "0")}`
                    : undefined,
              }),
            ),
          }),
        );
        break;

      case "proof": {
        const q = pullQuote(brief, features);
        // Fill the board. Three chips beside a lonely quote still left a dark void; five evidence
        // cells from declared features are the matter a proof band is supposed to carry.
        const evidence = features.slice(0, 5).map((f) =>
          block({
            title: f.name,
            body: f.description,
            // Sentence case — screaming micro-labels inflate the uppercase count and read as chrome.
            meta: f.priority === "p0" ? "Primary" : "In product",
            kicker: f.priority === "p0" ? "Primary" : "In product",
            emphasis: f.priority === "p0" ? "lead" : "normal",
          }),
        );
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.proof,
            title: sentence(`Why ${brief.productName} holds under review`),
            body: q.quote,
            quote: q.quote,
            quoteAttribution: q.attribution,
            blocks: evidence,
          }),
        );
        break;
      }

      case "pricing": {
        const lanes = plans(brief, features);
        if (lanes.length < 2) break;
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.pricing,
            title: sentence(`Three ways to scope ${brief.productName}`),
            body: sentence(
              `Lanes are drawn from the ${count(features.length)} declared capabilities. Nothing is invented to fill a column`,
            ),
            ctaLabel: cta.primary,
            blocks: lanes.map((l) =>
              block({
                title: l.title,
                body: l.body,
                meta: l.meta,
                points: l.points,
                emphasis: l.recommended ? "lead" : "normal",
              }),
            ),
          }),
        );
        break;
      }

      case "compare":
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.compare,
            title: sentence(`What is included, capability by capability`),
            body: sentence(`The same list as above, arranged the way a procurement review asks for it`),
            // Names and tiers. A matrix that repeats the prose beside every row is not a matrix.
            blocks: editorial.features.map((c) => block({ title: c.name, meta: c.tier })),
          }),
        );
        break;

      case "faq":
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.faq,
            title: sentence(`Questions ${brief.audience} ask first`),
            blocks: questions(brief, features).map((q) => block({ title: q.title, body: q.body })),
          }),
        );
        break;

      case "cta":
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow:
              brief.siteKind === "editorial-foundry"
                ? "Colophon"
                : brief.siteKind === "research-dossier"
                  ? "Imprint"
                  : eyebrow.cta,
            title: sentence(
              brief.siteKind === "editorial-foundry"
                ? `Request a specimen of ${brief.productName}`
                : brief.siteKind === "research-dossier"
                  ? `Request the next ${brief.productName} folio`
                : brief.businessGoal === "trust"
                  ? `See it against your own material`
                  : `Put ${brief.productName} in front of your ${brief.audience.split(" ").slice(-1)[0] ?? "team"}`,
            ),
            // Not `cta.note` — the fold already said that, and a closing band that repeats the
            // reassurance from the top of the page reads as a page with one idea.
            body: sentence(
              brief.siteKind === "editorial-foundry"
                ? `Edition notes, trial files, and the cuts ${brief.audience} actually set`
                : brief.siteKind === "research-dossier"
                  ? `Numbered folios, source notes, and the instruments ${brief.audience} actually open`
                : `${count(features.length)[0]!.toUpperCase()}${count(features.length).slice(1)} capabilities, one conversation`,
            ),
            ctaLabel: cta.primary,
            secondaryLabel: cta.secondary,
          }),
        );
        break;

      case "footer":
        sections.push(
          SectionSpec.parse({
            ...base,
            title: brief.productName,
            brandLabel: brief.productName,
            body: sentence(`${brief.productName} for ${brief.audience}`),
            ctaLabel: cta.secondary,
            blocks: [
              block({ title: "Capabilities", points: editorial.features.map((c) => c.name) }),
              block({
                title: "Evaluate",
                points: ["How it works", "What is included", "Questions", "Security review", "Talk to us"],
              }),
              block({ title: "Company", points: ["About", "Customers", "Careers", "Press", "Contact"] }),
              block({
                title: "Trust",
                points: ["Security", "Availability", "Data handling", "Subprocessors", "Status"],
              }),
            ],
          }),
        );
        break;

      case "app": {
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: brief.productName,
            title: editorial.features[0]?.name ?? "Workspace",
            body: sentence(`The working surface ${brief.audience} keep open all day`),
            brandLabel: brief.productName,
            aside: editorial.features.map((c) => block({ title: c.name })),
            blocks: editorial.features.slice(0, 6).map((c, i) =>
              block({
                title: c.name,
                meta: `${(i + 3) * 7}`,
                kicker: i === 0 ? "Now" : i < 3 ? "Today" : "Queued",
              }),
            ),
            metrics: editorial.outcomesAreStated
              ? outcomes(editorial.outcomeFeatures)
              : outcomeNames(editorial.features),
            ctaLabel: cta.primary,
          }),
        );
        break;
      }

      default:
        break;
    }
  }

  return sections;
}
