import { describe, expect, it } from "vitest";
import { DesignBrief, designFromFeatures } from "../index";
import {
  applyAgencyPolish,
  applyAgencyPolishSequence,
  agencyPolishAxesPresent,
} from "../agency-polish";
import { assertAgencyDelivery, AGENCY_DEFAULT_BAN_LIST } from "../agency-delivery";

const lensBrief = DesignBrief.parse({
  productName: "Lensroom",
  tagline: "Sessions that earn the wall",
  audience: "freelance photographers charging $2K+ per shoot",
  businessGoal: "leads",
  siteKind: "art-directed-studio",
  lockSiteKind: true,
  primaryCta: "Book a call",
  banList: ["purple gradients", "emoji as icons", "Inter as the display font"],
  brandAccent: "#1A3A4A",
  features: [
    {
      id: "p1",
      name: "Daylight sessions",
      description: "Location work timed to the hour the room actually looks expensive",
      priority: "p0",
    },
    {
      id: "p2",
      name: "Print-ready selects",
      description: "A shortlist graded for gallery walls, not social crops",
      priority: "p0",
    },
    {
      id: "p3",
      name: "Booking that respects the calendar",
      description: "One call to lock date, retainer, and shot list",
      priority: "p0",
    },
  ],
  taste: {
    aestheticLean: "refined-story",
    density: "sparse",
    motion: "light-scroll-reveals",
    colorMood: "light-airy",
    typographyWeight: "light-elegant",
    roundingDepth: "sharp",
  },
});

describe("agency polish + delivery", () => {
  it("applies axis-isolated polish markers without mixing axes in one block", () => {
    const { previewHtml } = designFromFeatures(lensBrief);
    const typed = applyAgencyPolish(previewHtml, "typography");
    expect(agencyPolishAxesPresent(typed)).toEqual(["typography"]);
    expect(typed).toContain("agency-polish:typography");
    expect(typed).not.toContain("agency-polish:spacing");

    const spaced = applyAgencyPolish(typed, "spacing");
    expect(agencyPolishAxesPresent(spaced)).toEqual(["typography", "spacing"]);

    const moved = applyAgencyPolishSequence(previewHtml);
    expect(agencyPolishAxesPresent(moved)).toEqual(["typography", "spacing", "motion"]);
    expect(moved).toContain("prefers-reduced-motion");
    expect(moved).toMatch(/240ms|200ms/);
  });

  it("passes agency delivery for Lensroom and surfaces Book a call", () => {
    const { spec, previewHtml } = designFromFeatures(lensBrief);
    expect(previewHtml).toContain("Book a call");
    const report = assertAgencyDelivery(spec, previewHtml);
    expect(report.passed).toBe(true);
    const polished = applyAgencyPolishSequence(previewHtml);
    const final = assertAgencyDelivery(spec, polished, { requirePolishAxes: true });
    expect(final.passed).toBe(true);
  });

  it("flags purple gradient + emoji ban hits", () => {
    const { spec, previewHtml } = designFromFeatures(lensBrief);
    const dirty =
      previewHtml.replace("</head>", `<style>.x{background:linear-gradient(90deg,#7c3aed,#a855f7)}</style></head>`) +
      `<span>🚀</span>`;
    const report = assertAgencyDelivery(spec, dirty);
    expect(report.findings.find((f) => f.id === "ban-purple-gradient")?.ok).toBe(false);
    expect(report.findings.find((f) => f.id === "ban-emoji-icons")?.ok).toBe(false);
    expect(AGENCY_DEFAULT_BAN_LIST.length).toBeGreaterThan(3);
  });
});
