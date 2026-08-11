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
  riskReversal,
  sentence,
} from "./copy";
import { catalogueBody, editorialize, type FeatureCopy } from "./editorial";
import { AESTHETIC_PROFILES } from "./tokens";
import { Block, SectionSpec, type DesignBrief, type FeatureSpec, type SkillNodeId, type TasteControls } from "./types";
import type { FeatureAnalysis } from "./analyze";

function block(input: Partial<Block> & { title: string }): Block {
  return Block.parse(input);
}

function skillFor(kind: SectionPlan["kind"], layout?: SectionPlan["layout"]): SkillNodeId {
  if (layout === "workflow-proof") return "product-proof-stage";
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
  const cta = ctaFor(brief.businessGoal, brief.siteKind, brief.primaryCta);
  const navItems = navFor(
    plan.map((p) => ({ kind: p.kind, id: p.id })),
    brief.siteKind,
  );
  const editorial = editorialize(features);
  const allBlocks = featureBlocks(editorial.features);

  const sections: SectionSpec[] = [];
  let featureCursor = 0;

  for (const p of plan) {
    const node = skillFor(p.kind, p.layout);
    const base = {
      id: p.id,
      kind: p.kind,
      layout: p.layout,
      surface: p.surface,
      columns: p.columns,
      bond: p.bond ?? false,
      skillNode: node,
      inspirationNotes: inspiration(taste.aestheticLean, node, p.layout),
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
        const isObservatory = brief.siteKind === "signal-observatory";
        const isArchive = brief.siteKind === "archive-index";
        const isLoom = brief.siteKind === "commerce-loom";
        const isField = brief.siteKind === "field-guide";
        const isPress = brief.siteKind === "press-atelier";
        const isLantern = brief.siteKind === "lantern-path";
        const isClinic = brief.siteKind === "care-pathway";
        const isPipeline = brief.siteKind === "saas-marketing";
        const isQueue = brief.siteKind === "dashboard-webapp";
        const isDiligence = brief.siteKind === "corporate-story";
        const isMechanism = brief.siteKind === "docs-educational";
        const isWire = brief.siteKind === "fintech-marketing";
        const craftFold =
          isDossier || isObservatory || isArchive || isLoom || isField || isPress || isLantern || isClinic
          || isPipeline || isQueue || isDiligence || isMechanism || isWire;
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: brief.audience,
            title: headline(brief, features),
            body: heroLede(brief, editorial.heroLines),
            brandLabel: brief.productName,
            ctaLabel: cta.primary,
            secondaryLabel: craftFold ? undefined : cta.secondary,
            // Compact claim — leave the fold to the instrument plate / rail.
            ctaNote: craftFold ? undefined : cta.note,
            blocks: named.map((b, i) => {
              const src = (core.length ? core : editorial.features.slice(0, 3))[i];
              return src
                ? block({
                    title: src.name,
                    body: isMechanism || isPipeline || isQueue || isDiligence || isWire
                      ? sentence(src.claim || src.consequence || src.name)
                      : "",
                    emphasis: "normal",
                  })
                : b;
            }),
            aside: editorial.features
              .slice(0, 4)
              .map((c, i) =>
                block({
                  title: c.name,
                  body: isMechanism || isDiligence ? sentence(c.claim || c.name) : "",
                  meta: c.tier,
                  emphasis: i === 0 ? "lead" : "normal",
                }),
              ),
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
        const isObservatory = brief.siteKind === "signal-observatory";
        const isArchive = brief.siteKind === "archive-index";
        const isLoom = brief.siteKind === "commerce-loom";
        const isField = brief.siteKind === "field-guide";
        const isPress = brief.siteKind === "press-atelier";
        const isLantern = brief.siteKind === "lantern-path";
        const isClinic = brief.siteKind === "care-pathway";
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
                      : isObservatory
                        ? "Also on the desk"
                        : isArchive
                          ? "Also in the roll"
                          : isLoom
                            ? "Also on the loom"
                            : isField
                              ? "Also on the plate"
                          : isPress
                            ? "Also on the forme"
                          : isLantern
                            ? "Also on the path"
                          : isClinic
                            ? "Also on the chart"
                    : "Also included"
              : isStudio
                ? "Selected work"
                : isConsumer
                  ? "In hand"
                  : isFoundry
                    ? "The cuts"
                    : isDossier
                      ? "The instruments"
                      : isObservatory
                        ? "The channels"
                        : isArchive
                          ? "The entries"
                          : isLoom
                            ? "The lines"
                            : isField
                              ? "The traits"
                          : isPress
                            ? "The plates"
                          : isLantern
                            ? "The chapters"
                          : isClinic
                            ? "The rounds"
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
                    : isObservatory
                      ? sentence(`The quieter channels that keep a desk honest`)
                      : isArchive
                        ? sentence(`The quieter entries that keep a registry honest`)
                        : isLoom
                          ? sentence(`The quieter lines that keep a loom honest`)
                          : isField
                            ? sentence(`The quieter traits that keep a voucher honest`)
                        : isPress
                          ? sentence(`The quieter plates that keep a forme honest`)
                        : isLantern
                          ? sentence(`The quieter waypoints that keep a walk honest`)
                        : isClinic
                          ? sentence(`The quieter handoffs that keep a pathway honest`)
                  : sentence(`The rest of what ships with ${brief.productName}`)
              : isStudio
                ? sentence(`Work that still holds after the launch week`)
                : isConsumer
                  ? sentence(`Built for the day you actually have`)
                  : isFoundry
                    ? sentence(`Cuts drawn for real reading sizes`)
                  : isDossier
                    ? sentence(`Instruments a capital brief actually uses`)
                    : isObservatory
                      ? sentence(`Channels an on-call desk actually watches`)
                      : isArchive
                        ? sentence(`Entries an archive index actually keeps`)
                        : isLoom
                          ? sentence(`Lines a merchandising loom actually cuts`)
                          : isField
                            ? sentence(`Traits a field voucher actually keeps`)
                        : isLantern
                          ? sentence(`Chapters a night walk actually keeps`)
                        : isClinic
                          ? sentence(`Stages a care pathway actually keeps`)
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
                    : isObservatory
                      ? sentence(`Thresholds, handoffs, and the rails that stop a page from inventing calm`)
                      : isArchive
                        ? sentence(`Cross-refs, stamps, and the rails that stop a catalog from inventing completeness`)
                        : isLoom
                          ? sentence(`Fit notes, swaps, and the rails that stop a cut from inventing completeness`)
                          : isField
                            ? sentence(`Range marks, synonyms, and the rails that stop a plate from inventing completeness`)
                        : isPress
                          ? sentence(`Gather ticks, densitometer marks, and the rails that stop a forme from inventing registration`)
                        : isLantern
                          ? sentence(`Waypoint beads, silhouette handoffs, and the rails that stop a walk from inventing atmosphere`)
                        : isClinic
                          ? sentence(`Handoff beads, encounter metas, and the rails that stop a pathway from inventing theatre`)
                  : sentence(`Smaller surface area, same standard — these remove the objections that stall a rollout`)
              : isStudio
                ? sentence(`Each engagement is a composed surface — identity, product, and motion under one grid`)
                : isConsumer
                  ? sentence(`Each capability is something you can point at on the product — not a lifestyle claim`)
                  : isFoundry
                    ? sentence(`Each cut is a size and a job — not a style picker dressed as a product`)
                  : isDossier
                    ? sentence(`Each instrument is a named reading — not a dashboard dressed as research`)
                    : isObservatory
                      ? sentence(`Each channel is a named signal — not a chart dressed as a product`)
                      : isArchive
                        ? sentence(`Each entry is a numbered stamp — not a search box dressed as an archive`)
                        : isLoom
                          ? sentence(`Each line is a woven SKU — not a product card dressed as merchandising`)
                          : isField
                            ? sentence(`Each trait is a pressed voucher — not a nature photo dressed as science`)
                        : isPress
                          ? sentence(`Each plate is a numbered signature — not a gallery dressed as a pressroom`)
                        : isLantern
                          ? sentence(`Each chapter is a lantern waypoint — not a dark glow page dressed as cinema`)
                        : isClinic
                          ? sentence(`Each stage is a chart waypoint — not a SaaS pipeline dressed as care`)
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
                : brief.siteKind === "signal-observatory"
                  ? sentence(`${brief.productName} channel field`)
                : brief.siteKind === "archive-index"
                  ? sentence(`${brief.productName} register field`)
                : brief.siteKind === "commerce-loom"
                  ? sentence(`${brief.productName} loom field`)
                : brief.siteKind === "field-guide"
                  ? sentence(`${brief.productName} specimen field`)
                : brief.siteKind === "press-atelier"
                  ? sentence(`${brief.productName} forme field`)
                : brief.siteKind === "lantern-path"
                  ? sentence(`${brief.productName} path field`)
                : brief.siteKind === "care-pathway"
                  ? sentence(`${brief.productName} chart field`)
                // Dashboard specimen is the quiet valley before the shell — short mark, not a claim.
                : brief.siteKind === "dashboard-webapp"
                  ? brief.productName.split(/\s+/)[0] ?? brief.productName
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
        const isObservatory = brief.siteKind === "signal-observatory";
        const isArchive = brief.siteKind === "archive-index";
        const isLoom = brief.siteKind === "commerce-loom";
        const isField = brief.siteKind === "field-guide";
        const isPress = brief.siteKind === "press-atelier";
        const isLantern = brief.siteKind === "lantern-path";
        const isClinic = brief.siteKind === "care-pathway";
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: isFoundry
              ? "Optical sizes"
              : isDossier
                ? "Plate legend"
                : isObservatory
                  ? "Channel legend"
                  : isArchive
                    ? "Entry legend"
                    : isLoom
                      ? "SKU legend"
                      : isField
                        ? "Trait legend"
                    : isPress
                      ? "Forme legend"
                    : isLantern
                      ? "Waypoint legend"
                    : isClinic
                      ? "Stage legend"
                  : eyebrow.figure,
            title: isFoundry
              ? sentence(`How ${brief.productName} changes with size`)
              : isDossier
                ? sentence(`How ${brief.productName} maps a briefing`)
                : isObservatory
                  ? sentence(`How ${brief.productName} reads a window`)
                  : isArchive
                    ? sentence(`How ${brief.productName} keeps the roll`)
                    : isLoom
                      ? sentence(`How ${brief.productName} weaves a cut`)
                      : isField
                        ? sentence(`How ${brief.productName} presses a voucher`)
                    : isPress
                      ? sentence(`How ${brief.productName} locks a forme`)
                    : isLantern
                      ? sentence(`How ${brief.productName} maps a night walk`)
                    : isClinic
                      ? sentence(`How ${brief.productName} maps a care pathway`)
              : sentence(`${focal?.name ?? brief.productName}, step by step`),
            body: isFoundry
              ? sentence(`The same face at display, title, deck, text, and caption — drawn, not described`)
              : isDossier
                ? sentence(`Pins, coordinates, and regions — the instruments drawn rather than claimed`)
                : isObservatory
                  ? sentence(`Amplitudes, live brackets, and channel ids — the lattice drawn rather than claimed`)
                  : isArchive
                    ? sentence(`Ordinals, letter columns, and ruled rows — the index drawn rather than claimed`)
                    : isLoom
                      ? sentence(`Warp, weft, and photo cells — the loom drawn rather than claimed`)
                      : isField
                        ? sentence(`Pressed silhouette, plate inset, and range ticks — the voucher drawn rather than claimed`)
                    : isPress
                      ? sentence(`Signatures, crop marks, and densitometer patches — the forme drawn rather than claimed`)
                    : isLantern
                      ? sentence(`Elevation, lanterns, and silhouette matter — the atlas drawn rather than claimed`)
                    : isClinic
                      ? sentence(`Stage nodes, dwell bars, and handoff beads — the chart drawn rather than claimed`)
              : sentence(
                  `The path work takes through ${brief.productName}, drawn rather than described`,
                ),
            // Mechanism / scrub legends need a real line of matter — title-only steps starved the
            // educational scrub list and any flow hero that reused figure blocks (empty cards).
            // Keep bodies short (claim only); do not reprint full catalogue paragraphs.
            blocks: editorial.features.slice(0, 4).map((c, i) =>
              block({
                title: c.name,
                meta: `0${i + 1}`,
                body: sentence(c.claim || c.consequence || c.name),
              }),
            ),
            figureCaption: isFoundry
              ? sentence(`Step through the optical sizes ${brief.productName} is cut for`)
              : isDossier
                ? sentence(`Read the pins that mark each instrument on the dossier plate`)
                : isObservatory
                  ? sentence(`Read the channels that mark each signal on the lattice`)
                  : isArchive
                    ? sentence(`Read the ordinals that mark each stamp on the ledger`)
                    : isLoom
                      ? sentence(`Read the SKU cells that mark each line on the loom`)
                      : isField
                        ? sentence(`Read the traits that mark each voucher on the plate`)
                    : isPress
                      ? sentence(`Read the signatures that mark each plate on the forme`)
                    : isLantern
                      ? sentence(`Read the lanterns that mark each chapter on the atlas`)
                    : isClinic
                      ? sentence(`Read the stages that mark each encounter on the chart`)
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
                    : brief.siteKind === "signal-observatory"
                      ? "Incident time"
                      : brief.siteKind === "archive-index"
                        ? "Entry notes"
                        : brief.siteKind === "commerce-loom"
                          ? "Hangtag notes"
                          : brief.siteKind === "field-guide"
                            ? "Range notes"
                        : brief.siteKind === "press-atelier"
                          ? "Gather notes"
                        : brief.siteKind === "lantern-path"
                          ? "Ember notes"
                        : brief.siteKind === "care-pathway"
                          ? "Round notes"
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
                    : brief.siteKind === "signal-observatory"
                      ? sentence(`How a window is actually walked`)
                      : brief.siteKind === "archive-index"
                        ? sentence(`How a single entry is actually read`)
                        : brief.siteKind === "commerce-loom"
                          ? sentence(`How a hangtag is actually cut`)
                          : brief.siteKind === "field-guide"
                            ? sentence(`How a voucher is actually read`)
                        : brief.siteKind === "press-atelier"
                          ? sentence(`How a signature is actually gathered`)
                        : brief.siteKind === "lantern-path"
                          ? sentence(`How a night walk is actually read`)
                        : brief.siteKind === "care-pathway"
                          ? sentence(`How a care pathway is actually walked`)
                  : brief.siteKind === "saas-marketing"
                    ? sentence(`How ${brief.productName} moves an account`)
                    : brief.siteKind === "dashboard-webapp"
                      ? sentence(`How a day on ${brief.productName} actually runs`)
                      : brief.siteKind === "corporate-story"
                        ? sentence(`How ${brief.productName} earns the room`)
                        : brief.siteKind === "docs-educational"
                          ? sentence(`How ${brief.productName} decides under constraint`)
                          : brief.siteKind === "fintech-marketing"
                            ? sentence(`How a send clears on ${brief.productName}`)
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
                    : brief.siteKind === "signal-observatory"
                      ? sentence(`Tick beads, channel notes, and the handoffs that keep calm honest`)
                      : brief.siteKind === "archive-index"
                        ? sentence(`Hanging folio, ruled measure, and the cross-refs that keep the roll honest`)
                        : brief.siteKind === "commerce-loom"
                          ? sentence(`Eyelet, size tape, and the notes that keep a cut honest`)
                          : brief.siteKind === "field-guide"
                            ? sentence(`Range beads, taxon ranks, and the notes that keep a voucher honest`)
                        : brief.siteKind === "press-atelier"
                          ? sentence(`Fold ticks, plate index, and the gathers that keep a forme honest`)
                        : brief.siteKind === "lantern-path"
                          ? sentence(`Lantern beads, chapter index, and the embers that keep a walk honest`)
                        : brief.siteKind === "care-pathway"
                          ? sentence(`Handoff beads, encounter index, and the rounds that keep a pathway honest`)
                  : brief.siteKind === "saas-marketing"
                    ? sentence(`From first signal to booked walkthrough — the path revenue leaders actually take`)
                    : brief.siteKind === "dashboard-webapp"
                      ? sentence(`Queue, deal room, playbook, handoff — the loop account executives live in`)
                      : brief.siteKind === "corporate-story"
                        ? sentence(`Language, principles, outcomes, posture — the diligence path in order`)
                        : brief.siteKind === "docs-educational"
                          ? sentence(`Placement, preemption, backpressure, failure — the cost function in order`)
                          : brief.siteKind === "fintech-marketing"
                            ? sentence(`Wire, wallet, approval, FX — the send path treasury actually walks`)
                  : sentence(`The sequence ${brief.audience} actually meet, in order`),
            blocks: chapters(editorial.features).map((c, i) =>
              block({
                title:
                  brief.siteKind === "lantern-path"
                    ? ["Threshold", "Gardens", "Craft", "Rituals", "Afterlight", "Ember"][i] ?? c.title
                    : brief.siteKind === "care-pathway"
                      ? ["Intake", "Triage", "Treat", "Follow-up", "Discharge", "Chart"][i] ?? c.title
                    : c.title,
                body: c.body,
                meta: brief.siteKind === "signal-observatory"
                  ? `T+${String(i * 6).padStart(2, "0")}h`
                  : brief.siteKind === "archive-index"
                    ? String(i + 1).padStart(3, "0")
                    : brief.siteKind === "commerce-loom"
                      ? ["XS", "S", "M", "L", "XL", "XXL"][i % 6]
                      : brief.siteKind === "field-guide"
                        ? ["K", "P", "C", "O", "F", "G"][i % 6]
                        : brief.siteKind === "press-atelier"
                          ? `Sig ${"ABCDEFGH"[i] ?? String(i + 1)}`
                        : brief.siteKind === "lantern-path"
                          ? `Ch ${["I","II","III","IV","V","VI"][i] ?? String(i + 1)}`
                        : brief.siteKind === "care-pathway"
                          ? `Enc ${String(i + 1).padStart(2, "0")}`
                  : c.meta,
                kicker:
                  brief.siteKind === "editorial-foundry" || brief.siteKind === "research-dossier" || brief.siteKind === "signal-observatory" || brief.siteKind === "archive-index" || brief.siteKind === "commerce-loom" || brief.siteKind === "field-guide" || brief.siteKind === "press-atelier" || brief.siteKind === "lantern-path" || brief.siteKind === "care-pathway"
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
        const isWorkflow = p.layout === "workflow-proof";
        /*
         * Workflow proof stages — five named handoffs that mirror how a careful product ships work.
         * Titles stay fixed (mechanism vocabulary); bodies come only from declared features.
         */
        const workflowBodies = features.slice(0, 5);
        const workflowStages = isWorkflow
          ? (
              [
                { id: "input", title: "Input", role: "Capture what the operator already knows" },
                { id: "process", title: "Process", role: "Run the declared mechanism — no magic" },
                { id: "draft", title: "Draft", role: "Surface a reviewable result" },
                { id: "review", title: "Review", role: "Human edits before anything ships" },
                { id: "approve", title: "Approve", role: "Explicit gate — never auto-apply" },
              ] as const
            ).map((stage, i) => {
              const src = workflowBodies[i] ?? workflowBodies[workflowBodies.length - 1] ?? features[0];
              return block({
                title: stage.title,
                body: src
                  ? sentence(`${stage.role}. Uses ${src.name}: ${src.description || src.name}`)
                  : sentence(stage.role),
                meta: stage.id,
                kicker: src?.name ?? "Sample",
                emphasis: i === 0 ? "lead" : i === 4 ? "lead" : "normal",
                points: src ? [src.name, stage.role] : [stage.role],
              });
            })
          : [];
        const proofTitle =
          brief.siteKind === "saas-marketing"
            ? isWorkflow
              ? sentence(`Walk the ${brief.productName} loop once`)
              : sentence(`Why ${brief.productName} earns the second meeting`)
            : brief.siteKind === "dashboard-webapp"
              ? sentence(`Why operators keep ${brief.productName} open all day`)
              : brief.siteKind === "corporate-story"
                ? sentence(`Why ${brief.productName} holds up in diligence`)
                : brief.siteKind === "fintech-marketing"
                  ? sentence(`Why treasury teams short-list ${brief.productName}`)
                  : brief.siteKind === "art-directed-studio"
                    ? sentence(`Why work from ${brief.productName} survives the handoff`)
                    : brief.siteKind === "docs-educational"
                      ? sentence(`Why the ${brief.productName} model holds under load`)
                      : brief.siteKind === "consumer-craft"
                        ? sentence(`Why ${brief.productName} earns a place on the shelf`)
                        : brief.siteKind === "editorial-foundry"
                          ? sentence(`Why setters keep a ${brief.productName} specimen`)
                          : brief.siteKind === "research-dossier"
                            ? sentence(`Why ${brief.productName} clears the briefing`)
                            : brief.siteKind === "signal-observatory"
                              ? sentence(`Why desks keep ${brief.productName} calibrated`)
                              : brief.siteKind === "archive-index"
                                ? sentence(`Why ${brief.productName} earns a cite`)
                                : brief.siteKind === "commerce-loom"
                                  ? sentence(`Why buyers keep a ${brief.productName} cut`)
                                  : brief.siteKind === "field-guide"
                                    ? sentence(`Why a ${brief.productName} voucher stands`)
                                    : brief.siteKind === "press-atelier"
                                      ? sentence(`Why ${brief.productName} locks the forme`)
                                      : brief.siteKind === "lantern-path"
                                        ? sentence(`Why ${brief.productName} holds the walk`)
                                      : brief.siteKind === "care-pathway"
                                        ? sentence(`Why ${brief.productName} holds the chart`)
                                        : sentence(`Why ${brief.productName} states only what it ships`);
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: isWorkflow ? "Sample workflow" : eyebrow.proof,
            title: proofTitle,
            body: isWorkflow
              ? sentence(
                  `Five named states. Every panel traces to a declared capability — nothing invented for theatre`,
                )
              : q.quote,
            quote: isWorkflow ? undefined : q.quote,
            quoteAttribution: isWorkflow ? "Human approves before apply" : q.attribution,
            blocks: isWorkflow ? workflowStages : evidence,
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
                  : brief.siteKind === "signal-observatory"
                    ? "Calibration"
                    : brief.siteKind === "archive-index"
                      ? "Registry"
                      : brief.siteKind === "commerce-loom"
                        ? "Care label"
                        : brief.siteKind === "field-guide"
                          ? "Voucher"
                      : brief.siteKind === "press-atelier"
                        ? "Pressroom"
                      : brief.siteKind === "lantern-path"
                        ? "Ember"
                      : brief.siteKind === "care-pathway"
                        ? "Chart"
                  : eyebrow.cta,
            title: sentence(
              brief.siteKind === "editorial-foundry"
                ? `Request a specimen of ${brief.productName}`
                : brief.siteKind === "research-dossier"
                  ? `Request the next ${brief.productName} folio`
                  : brief.siteKind === "signal-observatory"
                    ? `Calibrate a ${brief.productName} window`
                    : brief.siteKind === "archive-index"
                      ? `Request an entry in ${brief.productName}`
                      : brief.siteKind === "commerce-loom"
                        ? `Cut a sample from ${brief.productName}`
                        : brief.siteKind === "field-guide"
                          ? `Request a voucher of ${brief.productName}`
                      : brief.siteKind === "press-atelier"
                        ? `Lock a forme on ${brief.productName}`
                      : brief.siteKind === "lantern-path"
                        ? `Walk the next ${brief.productName} chapter`
                      : brief.siteKind === "care-pathway"
                        ? `Walk the next ${brief.productName} round`
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
                  : brief.siteKind === "signal-observatory"
                    ? `Tolerance marks, channel maps, and the windows ${brief.audience} actually watch`
                    : brief.siteKind === "archive-index"
                      ? `Numbered stamps, cross-refs, and the entries ${brief.audience} actually keep`
                      : brief.siteKind === "commerce-loom"
                        ? `Size tapes, SKU cells, and the lines ${brief.audience} actually cut`
                        : brief.siteKind === "field-guide"
                          ? `Pressed plates, range notes, and the vouchers ${brief.audience} actually keep`
                      : brief.siteKind === "press-atelier"
                        ? `Plate numbers, densitometer marks, and the formes ${brief.audience} actually run`
                      : brief.siteKind === "lantern-path"
                        ? `Waypoint marks, path plates, and the chapters ${brief.audience} actually walk`
                      : brief.siteKind === "care-pathway"
                        ? `Stage marks, care plates, and the rounds ${brief.audience} actually chart`
                : `${count(features.length)[0]!.toUpperCase()}${count(features.length).slice(1)} capabilities, one conversation`,
            ),
            ctaLabel: cta.primary,
            secondaryLabel: cta.secondary,
            // Conversion landing craft — name the reversible path once, at the close.
            ctaNote:
              brief.siteKind === "saas-marketing" || brief.siteKind === "fintech-marketing"
                ? riskReversal(brief)
                : undefined,
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
        const isDash = brief.siteKind === "dashboard-webapp";
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: brief.productName,
            title: editorial.features[0]?.name ?? "Workspace",
            body: sentence(`The working surface ${brief.audience} keep open all day`),
            brandLabel: brief.productName,
            aside: editorial.features.map((c) => block({ title: c.name })),
            blocks: editorial.features.slice(0, isDash ? 8 : 6).map((c, i) =>
              block({
                title: c.name,
                meta: `${(i + 3) * 7}`,
                kicker: i === 0 ? "Now" : i < 3 ? "Today" : "Queued",
                // Short detail — long cells stole body-measure from the FAQ prose column.
                points: isDash ? [`${c.name.split(/\s+/)[0] ?? c.name} · live`] : undefined,
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
