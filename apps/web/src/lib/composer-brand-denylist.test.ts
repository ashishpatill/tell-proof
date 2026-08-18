import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COMPOSER_TEMPLATE_BRAND_DENYLIST,
  findDeniedComposerBrands,
} from "./composer-brand-denylist";
import { COMPOSER_STARTER_CHIPS } from "./composer-starters";
import {
  allDesignControlLabels,
  designControlsToBriefFields,
  DEFAULT_DESIGN_CONTROLS,
  parseDesignControls,
  serializeDesignControls,
  SURFACE_OPTIONS_COMPACT,
  SURFACE_OPTIONS_FULL,
} from "./design-controls-catalog";

const here = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.resolve(here, "..");

/** User-facing home composer / design-control surfaces that must stay brand-clean. */
const COMPOSER_UI_SOURCES = [
  path.join(webSrc, "components/shell/EntryHome.tsx"),
  path.join(webSrc, "lib/composer-starters.ts"),
  path.join(webSrc, "lib/design-controls-catalog.ts"),
  path.join(webSrc, "components/design-controls/DesignControls.tsx"),
] as const;

describe("composer brand denylist", () => {
  it("lists competitor hosts and product chips we refuse as starters", () => {
    expect(COMPOSER_TEMPLATE_BRAND_DENYLIST).toEqual(
      expect.arrayContaining([
        "emergent",
        "emergent.sh",
        "lovable",
        "v0.dev",
        "bolt.new",
        "replit",
        "cursor.com",
        "framer.com",
      ]),
    );
  });

  it("detects denylisted tokens without false-positive on Cursor tooling copy", () => {
    expect(findDeniedComposerBrands("Try lovable or bolt.new")).toEqual(
      expect.arrayContaining(["lovable", "bolt.new"]),
    );
    expect(findDeniedComposerBrands("draft a patch for Cursor — keys stay local")).toEqual([]);
    expect(findDeniedComposerBrands("open cursor.com as a starter chip")).toEqual(["cursor.com"]);
    expect(findDeniedComposerBrands("github.com/owner/repo")).toEqual([]);
  });

  it("keeps COMPOSER_STARTER_CHIPS free of denylisted brands", () => {
    for (const chip of COMPOSER_STARTER_CHIPS) {
      const blob = `${chip.id} ${chip.label} ${chip.brief ?? ""}`;
      expect(findDeniedComposerBrands(blob), `chip ${chip.id}`).toEqual([]);
    }
  });

  it("keeps DesignControls option labels Tell-owned (no competitor brands)", () => {
    for (const label of allDesignControlLabels()) {
      expect(findDeniedComposerBrands(label), label).toEqual([]);
    }
    for (const opt of [...SURFACE_OPTIONS_COMPACT, ...SURFACE_OPTIONS_FULL]) {
      expect(findDeniedComposerBrands(`${opt.value} ${opt.label} ${opt.hint ?? ""}`)).toEqual([]);
    }
  });

  it("keeps home composer UI sources free of denylisted brand strings", () => {
    const violations: string[] = [];
    for (const file of COMPOSER_UI_SOURCES) {
      const source = readFileSync(file, "utf8");
      const hits = findDeniedComposerBrands(source);
      for (const hit of hits) {
        violations.push(`${path.relative(webSrc, file)}: ${hit}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("design-controls catalog", () => {
  it("round-trips serialize/parse for DesignBrief-aligned fields", () => {
    const qs = serializeDesignControls(DEFAULT_DESIGN_CONTROLS);
    const parsed = parseDesignControls(new URLSearchParams(qs));
    expect(parsed).toEqual(DEFAULT_DESIGN_CONTROLS);
  });

  it("maps controls into Studio brief taste + brandAccent", () => {
    const fields = designControlsToBriefFields(DEFAULT_DESIGN_CONTROLS);
    expect(fields.siteKind).toBe("care-pathway");
    expect(fields.businessGoal).toBe("trust");
    expect(fields.brandAccent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(fields.taste.aestheticLean).toBe("refined-story");
    expect(fields.lockSiteKind).toBe(true);
  });

  it("defaults Surface compact catalog to Care pathway Roundspool specimen", () => {
    const care = SURFACE_OPTIONS_COMPACT.find((o) => o.value === "care-pathway");
    expect(care?.label).toBe("Care pathway");
    expect(care?.hint?.toLowerCase()).toContain("roundspool");
  });
});
