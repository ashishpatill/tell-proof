import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COMPOSER_TEMPLATE_BRAND_DENYLIST,
  findDeniedComposerBrands,
} from "./composer-brand-denylist";
import { COMPOSER_STARTER_CHIPS } from "./composer-starters";

const here = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.resolve(here, "..");

/** User-facing home composer / shell surfaces that must stay brand-clean. */
const COMPOSER_UI_SOURCES = [
  path.join(webSrc, "components/shell/EntryHome.tsx"),
  path.join(webSrc, "lib/composer-starters.ts"),
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
