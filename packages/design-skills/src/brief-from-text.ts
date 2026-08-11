import { DesignBrief, type SiteKind } from "./types";
import { listTemplates } from "./templates";
import { matchSportFromQuery, type SportId } from "./sport-vernacular";

export type FreeTextBriefPlan = {
  query: string;
  nicheKey: string;
  siteKind: SiteKind;
  productName: string;
  steps: string[];
};

type Lean = NonNullable<DesignBrief["taste"]>["aestheticLean"];
type Density = NonNullable<DesignBrief["taste"]>["density"];
type Motion = NonNullable<DesignBrief["taste"]>["motion"];
type ColorMood = NonNullable<DesignBrief["taste"]>["colorMood"];

/**
 * Infer a DesignBrief from free-text (Home create flow).
 * Deterministic — no LLM. Templates only seed defaults; the query drives naming/taste.
 */
export function briefFromFreeText(queryInput: string): {
  brief: DesignBrief;
  plan: FreeTextBriefPlan;
} {
  const query = queryInput.trim();
  if (!query) {
    throw new Error("Describe the site you want to create.");
  }

  const sportPack = matchSportFromQuery(query);
  const sport = sportPack?.id;
  let siteKind: SiteKind = "saas-marketing";
  let nicheKey = "saas";
  let lean: Lean = "conversion-sharp";
  let density: Density = "balanced";
  let motion: Motion = "light-scroll-reveals";
  let colorMood: ColorMood = "neutral-professional";
  let businessGoal: DesignBrief["businessGoal"] = "demos";
  let audience = "founders shipping a product this week";
  let primaryCta = "Book a walkthrough";

  if (sport) {
    nicheKey = sport;
    siteKind = "saas-marketing";
    lean = "system-crafted";
    density = "balanced";
    motion = "subtle-micro";
    businessGoal = "activation";
    audience = `${sport} fans who need live clarity`;
    primaryCta = "Open live board";
  } else {
    const scored = scoreTemplates(query);
    if (scored) {
      nicheKey = scored.key;
      siteKind = scored.siteKind;
    }
    ({ lean, density, motion, colorMood, siteKind, businessGoal, audience, primaryCta } = applyTasteHeuristics(
      query,
      { lean, density, motion, colorMood, siteKind, businessGoal, audience, primaryCta },
    ));
  }

  const productName = inferProductName(query, nicheKey);
  const tagline = inferTagline(query);
  const features = inferFeatures(query, nicheKey, sport);

  const template = listTemplates().find((t) => t.key === nicheKey);
  const seeded = template?.brief;

  const brief = DesignBrief.parse({
    productName,
    tagline: tagline || seeded?.tagline || "Built for the job, not the template",
    audience: audience || seeded?.audience || "people who need this done",
    businessGoal,
    siteKind,
    lockSiteKind: true,
    primaryCta,
    brandAccent: seeded?.brandAccent,
    taste: {
      aestheticLean: lean,
      density,
      motion,
      colorMood,
      typographyWeight: lean === "refined-story" ? "light-elegant" : "medium-modern",
      roundingDepth: siteKind === "dashboard-webapp" ? "sharp" : "soft",
    },
    features,
    constraints: [
      "totally customized to content",
      "not distracting with too many animations",
      "multi-million-dollar business quality",
      `query: ${query.slice(0, 160)}`,
    ],
    banList: [
      "purple gradients",
      "emoji as icons",
      "Inter as the display font",
      "generic stock-photo placeholders",
      "equal three-card feature grids",
    ],
    ...(sport ? { sportId: sport } : {}),
  });

  const plan: FreeTextBriefPlan = {
    query,
    nicheKey,
    siteKind: brief.siteKind,
    productName: brief.productName,
    steps: [
      "Match niche and site kind from your brief",
      "Run domain research gate (prior pack → gaps → IA)",
      "Route craft skills for declared features",
      "Compose tokens, sections, and motion",
      "Render the first preview",
    ],
  };

  return { brief, plan };
}

function scoreTemplates(query: string): { key: string; siteKind: SiteKind } | null {
  const q = query.toLowerCase();
  let best: { key: string; siteKind: SiteKind; score: number } | null = null;
  for (const t of listTemplates()) {
    const hay = `${t.key} ${t.label} ${t.marketJob} ${t.siteKind}`.toLowerCase();
    let score = 0;
    for (const word of q.split(/[^a-z0-9]+/).filter((w) => w.length > 3)) {
      if (hay.includes(word)) score += 1;
    }
    if (q.includes(t.key)) score += 3;
    if (!best || score > best.score) best = { key: t.key, siteKind: t.siteKind, score };
  }
  return best && best.score > 0 ? { key: best.key, siteKind: best.siteKind } : null;
}

function applyTasteHeuristics(
  query: string,
  base: {
    lean: Lean;
    density: Density;
    motion: Motion;
    colorMood: ColorMood;
    siteKind: SiteKind;
    businessGoal: DesignBrief["businessGoal"];
    audience: string;
    primaryCta: string;
  },
) {
  const text = query.toLowerCase();
  let { lean, density, motion, colorMood, siteKind, businessGoal, audience, primaryCta } = base;

  if (/minimal|clean|quiet|sparse/.test(text)) {
    lean = "minimal-clean";
    density = "sparse";
    motion = "none";
  }
  if (/conversion|cta|demo|saas|sharp/.test(text)) {
    lean = "conversion-sharp";
    motion = "subtle-micro";
    siteKind = /fintech|treasury|payment|bank|payroll/.test(text) ? "fintech-marketing" : "saas-marketing";
    businessGoal = "demos";
    primaryCta = "Book a demo";
  }
  if (/system|token|crafted/.test(text)) lean = "system-crafted";
  if (/studio|portfolio|art.?direct|selected work|atelier|photograph/.test(text)) {
    siteKind = "art-directed-studio";
    lean = "refined-story";
    density = "sparse";
    businessGoal = "leads";
    primaryCta = "Book a call";
    audience = "clients booking premium sessions";
  }
  if (/consumer|everyday|lifestyle|shopper|retail|dtc/.test(text)) {
    siteKind = "consumer-craft";
    lean = "conversion-sharp";
  }
  if (/corporate|company story|about us/.test(text)) {
    siteKind = "corporate-story";
    lean = "refined-story";
    density = "sparse";
    businessGoal = "trust";
  }
  if (/dashboard|workspace|console|ops/.test(text)) {
    siteKind = "dashboard-webapp";
    lean = "minimal-clean";
    motion = "none";
    density = "information-rich";
    businessGoal = "activation";
    primaryCta = "Open workspace";
  }
  if (/docs|educational|textbook|chapter|learn/.test(text)) {
    siteKind = "docs-educational";
    lean = "refined-story";
    density = "sparse";
    businessGoal = "trust";
  }
  if (/dark/.test(text)) colorMood = "dark-premium";
  if (/no motion|without animation|static/.test(text)) motion = "none";
  if (/scroll reveal/.test(text)) motion = "light-scroll-reveals";
  if (/scroll narrative|pinned chapter|story scroll/.test(text)) motion = "scroll-narrative";
  if (/immersive|webgl|shader/.test(text)) motion = "immersive";
  if (/warm|editorial|serif/.test(text) && lean === "conversion-sharp") lean = "refined-story";

  return { lean, density, motion, colorMood, siteKind, businessGoal, audience, primaryCta };
}

function inferProductName(query: string, nicheKey: string): string {
  const quoted = query.match(/["“]([^"”]{2,40})["”]/);
  if (quoted?.[1]) return quoted[1].trim();
  const called = query.match(/\b(?:called|named|for)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)/);
  if (called?.[1]) return called[1].trim();
  const template = listTemplates().find((t) => t.key === nicheKey);
  return template?.brief.productName ?? "Northline";
}

function inferTagline(query: string): string {
  const cleaned = query.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 120) return cleaned;
  return `${cleaned.slice(0, 117)}…`;
}

function inferFeatures(
  query: string,
  nicheKey: string,
  sport: SportId | undefined,
): DesignBrief["features"] {
  const template = listTemplates().find((t) => t.key === nicheKey);
  if (template?.brief.features?.length) {
    return template.brief.features.map((f, i) => ({
      ...f,
      id: f.id || `f${i + 1}`,
    }));
  }
  if (sport) {
    return [
      {
        id: "f1",
        name: "Live score spine",
        description: "Glance-first scoreline that stays honest during play",
        priority: "p0" as const,
      },
      {
        id: "f2",
        name: "Format lens",
        description: "Swap the board for the competition shape fans already know",
        priority: "p0" as const,
      },
      {
        id: "f3",
        name: "Match notebook",
        description: "Sit-with reading for the passages that matter after the whistle",
        priority: "p1" as const,
      },
    ];
  }
  const lines = query
    .split(/[.\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 4);
  if (lines.length >= 2) {
    return lines.map((line, i) => ({
      id: `f${i + 1}`,
      name: line.split(/\s+/).slice(0, 4).join(" "),
      description: line,
      priority: (i < 2 ? "p0" : "p1") as "p0" | "p1",
    }));
  }
  return [
    {
      id: "f1",
      name: "Primary job",
      description: query.slice(0, 160),
      priority: "p0",
    },
    {
      id: "f2",
      name: "Proof on the page",
      description: "Show the product working — not a generic feature grid",
      priority: "p0",
    },
    {
      id: "f3",
      name: "Clear next step",
      description: "One primary action repeated without clutter",
      priority: "p1",
    },
  ];
}
