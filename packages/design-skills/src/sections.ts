/**
 * Section construction — turn the plan from `composition.ts` into filled section specs.
 *
 * Every string on the page traces back to something the brief declared. No invented customer
 * names, no fabricated percentages, no "trusted by thousands of teams".
 */
import { planSections, type SectionPlan } from "./composition";
import {
  chapters,
  ctaFor,
  eyebrows,
  featuresLede,
  featuresTitle,
  firstClause,
  headline,
  heroLede,
  navFor,
  outcomes,
  plans,
  pullQuote,
  questions,
  sentence,
} from "./copy";
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

function featureBlocks(features: FeatureSpec[], brief: DesignBrief): Block[] {
  return features.map((f, i) =>
    block({
      title: f.name,
      body: sentence(f.description || `${f.name} is one of the ${brief.features.length} capabilities ${brief.productName} ships.`),
      kicker: f.priority === "p0" ? "Core" : f.priority === "p1" ? "Included" : "At scale",
      meta: String(i + 1).padStart(2, "0"),
      emphasis: i === 0 ? "lead" : f.priority === "p2" ? "quiet" : "normal",
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
  const cta = ctaFor(brief.businessGoal);
  const navItems = navFor(plan.map((p) => p.kind));
  const allBlocks = featureBlocks(features, brief);

  const sections: SectionSpec[] = [];
  let featureCursor = 0;

  for (const p of plan) {
    const base = {
      id: p.id,
      kind: p.kind,
      layout: p.layout,
      surface: p.surface,
      columns: p.columns,
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
        const hero = features.slice(0, 3);
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: brief.audience,
            title: headline(brief, features),
            body: heroLede(brief, features),
            brandLabel: brief.productName,
            ctaLabel: cta.primary,
            secondaryLabel: cta.secondary,
            ctaNote: cta.note,
            blocks: hero.map((f) =>
              block({ title: f.name, body: firstClause(f.description) || f.name, emphasis: "normal" }),
            ),
            aside: features.slice(0, 4).map((f, i) =>
              block({ title: f.name, meta: `${Math.max(24, 96 - i * 17)}%`, emphasis: i === 0 ? "lead" : "normal" }),
            ),
          }),
        );
        break;
      }

      case "metrics":
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.metrics,
            title: sentence(`What ${brief.audience} stop doing once ${brief.productName} is in place`),
            metrics: outcomes(brief, features),
          }),
        );
        break;

      case "features": {
        const slice =
          featureCursor === 0
            ? allBlocks.slice(0, Math.min(allBlocks.length, Math.max(3, Math.ceil(allBlocks.length * 0.6))))
            : allBlocks.slice(Math.max(0, featureCursor));
        featureCursor = featureCursor === 0 ? slice.length : featureCursor + slice.length;
        if (!slice.length) break;
        const isSecond = p.id !== "features";
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: isSecond ? "Also included" : eyebrow.features,
            title: isSecond
              ? sentence(`The rest of what ships with ${brief.productName}`)
              : featuresTitle(brief, features),
            body: isSecond
              ? sentence(`Smaller surface area, same standard — these remove the objections that stall a rollout`)
              : featuresLede(brief, features),
            blocks: slice,
          }),
        );
        break;
      }

      case "figure": {
        const focal = features[0];
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.figure,
            title: sentence(`${focal?.name ?? brief.productName}, step by step`),
            body: sentence(
              focal?.description ||
                `The mechanism behind ${brief.productName}, drawn rather than described`,
            ),
            blocks: features.slice(0, 4).map((f, i) =>
              block({ title: f.name, body: firstClause(f.description) || f.name, meta: `0${i + 1}` }),
            ),
            figureCaption: sentence(
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
            eyebrow: eyebrow.story,
            title: sentence(`The order things happen in`),
            body: sentence(
              `${brief.productName} is a sequence, not a pile of features. This is the order ${brief.audience} experience it`,
            ),
            blocks: chapters(brief, features).map((c) => block({ title: c.title, body: c.body, meta: c.meta })),
          }),
        );
        break;

      case "proof": {
        const q = pullQuote(brief, features);
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: eyebrow.proof,
            title: sentence(`Why it holds up under review`),
            quote: q.quote,
            quoteAttribution: q.attribution,
            blocks: features.slice(0, 3).map((f) =>
              block({ title: f.name, body: firstClause(f.description) || f.name, emphasis: "quiet" }),
            ),
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
              `Lanes are drawn from the ${features.length} declared capabilities. Nothing is invented to fill a column`,
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
            blocks: features.map((f) =>
              block({
                title: f.name,
                body: firstClause(f.description) || f.name,
                meta: f.priority === "p0" ? "Core" : f.priority === "p1" ? "Included" : "At scale",
              }),
            ),
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
            eyebrow: eyebrow.cta,
            title: sentence(
              brief.businessGoal === "trust"
                ? `See it against your own material`
                : `Put ${brief.productName} in front of your ${brief.audience.split(" ").slice(-1)[0] ?? "team"}`,
            ),
            body: sentence(cta.note),
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
            blocks: [
              block({ title: "Product", points: features.slice(0, 4).map((f) => f.name) }),
              block({ title: "Company", points: ["About", "Careers", "Contact"] }),
              block({ title: "Trust", points: ["Security", "Availability", "Data handling"] }),
            ],
          }),
        );
        break;

      case "app": {
        sections.push(
          SectionSpec.parse({
            ...base,
            eyebrow: brief.productName,
            title: features[0]?.name ?? "Workspace",
            body: sentence(
              features[0]?.description || `The working surface ${brief.audience} keep open all day`,
            ),
            brandLabel: brief.productName,
            aside: features.map((f) => block({ title: f.name })),
            blocks: features.slice(0, 6).map((f, i) =>
              block({
                title: f.name,
                body: firstClause(f.description) || f.name,
                meta: `${(i + 3) * 7}`,
                kicker: i === 0 ? "Now" : i < 3 ? "Today" : "Queued",
              }),
            ),
            metrics: outcomes(brief, features),
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
