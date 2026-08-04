import type { FeatureAnalysis } from "./analyze";
import { AESTHETIC_PROFILES } from "./tokens";
import { SectionSpec, type DesignBrief, type FeatureSpec, type SkillNodeId, type TasteControls } from "./types";

function sec(input: Parameters<typeof SectionSpec.parse>[0]): SectionSpec {
  return SectionSpec.parse(input);
}

function inspiration(lean: TasteControls["aestheticLean"], skill: SkillNodeId): string[] {
  const profile = AESTHETIC_PROFILES[lean];
  const secondary =
    lean === "conversion-sharp"
      ? AESTHETIC_PROFILES["system-crafted"]
      : lean === "refined-story"
        ? AESTHETIC_PROFILES["minimal-clean"]
        : AESTHETIC_PROFILES["conversion-sharp"];

  return [
    `${profile.label} — ${profile.sectionBias}`,
    `${secondary.label} — ${secondary.principles[0]}`,
    `Skill node: ${skill}`,
  ];
}

function ctaForGoal(goal: DesignBrief["businessGoal"]): string {
  if (goal === "leads") return "Talk to sales";
  if (goal === "trust") return "See how it works";
  if (goal === "activation") return "Open workspace";
  if (goal === "sales") return "Start now";
  return "Book a demo";
}

/** Feature-derived plan lanes — never invent Starter/Growth/Enterprise filler. */
function plansFromFeatures(features: FeatureSpec[]): string[] {
  if (features.length === 0) return [];
  if (features.length === 1) {
    return [`Recommended — ${features[0]!.name}`];
  }
  const core = features.slice(0, Math.min(2, features.length)).map((f) => f.name);
  const recommended = features.slice(0, Math.min(4, features.length)).map((f) => f.name);
  const full = features.map((f) => f.name);
  const lanes = [
    `Core — ${core.join(", ")}`,
    `Recommended — ${recommended.join(", ")}`,
  ];
  if (full.length > recommended.length) {
    lanes.push(`Full — ${full.join(", ")}`);
  } else {
    lanes.push(`Team — ${features.map((f) => f.name).join(", ")} + shared workspace`);
  }
  return lanes;
}

function proofFromFeatures(features: FeatureSpec[], audience: string): string[] {
  return features.slice(0, 3).map((f, i) => {
    if (i === 0) return `Outcome: ${f.name} shortens time-to-value for ${audience}`;
    if (i === 1) return `Credibility: ${f.name} is measurable in the first week`;
    return `Operator note: ${f.name} stays calm under real workload`;
  });
}

export function buildSections(
  brief: DesignBrief,
  analysis: FeatureAnalysis,
  taste: TasteControls,
): SectionSpec[] {
  const features = analysis.prioritized;
  const top = features.slice(0, 6);
  const p0 = features.filter((f) => f.priority === "p0");
  const heroFeatures = (p0.length ? p0 : top).slice(0, 3);
  const sections: SectionSpec[] = [];
  const quietNav = analysis.siteKind === "docs-educational" || taste.aestheticLean === "minimal-clean";

  sections.push(
    sec({
      id: "nav",
      kind: "nav",
      skillNode: "navigation-header-footer",
      title: brief.productName,
      body: "Primary navigation",
      items: analysis.recommendedSections.includes("pricing")
        ? ["Product", "Features", "Pricing"]
        : analysis.siteKind === "docs-educational"
          ? ["Mechanism", "Chapters", "Capabilities"]
          : analysis.siteKind === "dashboard-webapp"
            ? ["Workspace", "Queue", "Settings"]
            : ["Product", "Features", "Story"],
      ctaLabel: quietNav ? undefined : ctaForGoal(brief.businessGoal),
      inspirationNotes: inspiration(taste.aestheticLean, "navigation-header-footer"),
    }),
  );

  if (analysis.siteKind === "dashboard-webapp") {
    sections.push(
      sec({
        id: "shell",
        kind: "dashboard-shell",
        skillNode: "dashboard-or-webapp-ui",
        brandLabel: brief.productName,
        title: top[0]?.name ?? "Overview",
        body: top[0]?.description || "Primary working surface for the product’s core job.",
        asideItems: top.map((f) => f.name),
        // Always include the focal feature in main so single-feature dashboards are not empty.
        items: top.map((f) => `${f.name} — ${f.description || "Core capability"}`),
        inspirationNotes: inspiration(taste.aestheticLean, "dashboard-or-webapp-ui"),
      }),
    );
  } else {
    sections.push(
      sec({
        id: "hero",
        kind: "hero",
        skillNode: "hero-section",
        brandLabel: brief.productName,
        title: brief.tagline || `${brief.productName} for ${brief.audience}`,
        body: `Centered on ${heroFeatures
          .map((f) => f.name.toLowerCase())
          .join(", ")} — composition built from your features, not a template.`,
        ctaLabel: ctaForGoal(brief.businessGoal),
        items: heroFeatures.map((f) => f.name),
        asideItems: [`For ${brief.audience}`],
        inspirationNotes: inspiration(taste.aestheticLean, "hero-section"),
      }),
    );

    if (analysis.recommendedSections.includes("figure")) {
      const focal = top[0];
      sections.push(
        sec({
          id: "figure",
          kind: "figure",
          skillNode: "content-storytelling-pages",
          title: focal?.name ?? "Mechanism",
          body: focal?.description || "Scrub the mechanism without leaving the page.",
          items: top.slice(0, 4).map((f) => f.name),
          figureCaption: `${focal?.name ?? "Mechanism"} — interactive teaching figure for ${brief.audience}`,
          inspirationNotes: inspiration(taste.aestheticLean, "content-storytelling-pages"),
        }),
      );
    }

    if (analysis.recommendedSections.includes("features")) {
      sections.push(
        sec({
          id: "features",
          kind: "features",
          skillNode: "features-benefits",
          title:
            taste.aestheticLean === "minimal-clean"
              ? "What ships"
              : taste.aestheticLean === "refined-story"
                ? "Capabilities in the narrative"
                : "Capabilities that match the product",
          body: "Every block maps to a declared feature — hierarchy over decoration.",
          items: top.map((f) => `${f.name} — ${f.description || "Delivers measurable buyer value."}`),
          inspirationNotes: inspiration(taste.aestheticLean, "features-benefits"),
        }),
      );
    }

    if (analysis.recommendedSections.includes("story")) {
      sections.push(
        sec({
          id: "story",
          kind: "story",
          skillNode: "content-storytelling-pages",
          title: analysis.siteKind === "docs-educational" ? "Chapters" : "How it works for your buyers",
          body: "A calm narrative that explains the mechanism without marketing fluff.",
          items: top.slice(0, 4).map((f, i) => `Chapter ${i + 1}: ${f.name} — ${f.description || "Understand the mechanism."}`),
          inspirationNotes: inspiration(taste.aestheticLean, "content-storytelling-pages"),
        }),
      );
    }

    if (analysis.recommendedSections.includes("proof")) {
      const proofItems = proofFromFeatures(top, brief.audience);
      if (proofItems.length) {
        sections.push(
          sec({
            id: "proof",
            kind: "proof",
            skillNode: "forms-ctas-conversion",
            title: "Proof that earns trust",
            body: "Outcomes tied to declared capabilities — near the decision, not a logo landfill.",
            items: proofItems,
            inspirationNotes: inspiration(taste.aestheticLean, "forms-ctas-conversion"),
          }),
        );
      }
    }

    if (analysis.recommendedSections.includes("pricing")) {
      const planItems = plansFromFeatures(top);
      if (planItems.length >= 2) {
        sections.push(
          sec({
            id: "pricing",
            kind: "pricing",
            skillNode: "pricing-or-plans",
            title: "Plans built from your features",
            body: "Lanes mirror declared capabilities. One recommended path. No filler tiers.",
            items: planItems,
            ctaLabel: planItems.some((p) => /recommended/i.test(p)) ? "Start with Recommended" : ctaForGoal(brief.businessGoal),
            inspirationNotes: inspiration(taste.aestheticLean, "pricing-or-plans"),
          }),
        );
      }
    }
  }

  sections.push(
    sec({
      id: "cta",
      kind: "cta",
      skillNode: "forms-ctas-conversion",
      title: brief.businessGoal === "trust" ? "See it on your content" : "Ready when your team is",
      body: top[0]
        ? `Next step with ${top[0].name} in view — single primary action.`
        : "Single primary action. Secondary link stays quiet.",
      ctaLabel: ctaForGoal(brief.businessGoal),
      items: top.slice(0, 2).map((f) => f.name),
      inspirationNotes: inspiration(taste.aestheticLean, "forms-ctas-conversion"),
    }),
  );

  sections.push(
    sec({
      id: "footer",
      kind: "footer",
      skillNode: "navigation-header-footer",
      title: brief.productName,
      body: "Content-aware footer",
      items: analysis.siteKind === "docs-educational" ? ["Mechanism", "Chapters", "Contact"] : ["Product", "Security", "Docs", "Contact"],
      inspirationNotes: inspiration(taste.aestheticLean, "navigation-header-footer"),
    }),
  );

  return sections;
}
