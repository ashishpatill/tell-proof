// Quality bar for Redesign Engine v2 (docs/06): every direction must read as a different
// designer's complete work — measurably different sheets, full recipe coverage, honest
// legibility — not a token nudge. Guards against regressing to "few minor color changes".
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TellReport } from "@tell/schema";
import { contrastRatio, parseColor } from "./color";
import { reconcile, RECONCILE_DIRECTIONS } from "./reconcile";
import { validateRestyleSheet } from "./validate";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const report = TellReport.parse(
  JSON.parse(readFileSync(path.join(repoRoot, "fixtures/reports/tell-report.json"), "utf8")),
);

const ids = Object.keys(RECONCILE_DIRECTIONS);
const recons = ids.map((id) => reconcile(report.capture, report.fingerprint, report.findings, id));

const ruleSet = (css: string): Set<string> =>
  new Set(
    css
      .split("}")
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => r.replace(/\s+/g, " ")),
  );

describe("redesign engine v2 — direction distinctness", () => {
  it("covers all six directions", () => {
    expect(ids.length).toBeGreaterThanOrEqual(6);
  });

  it("every direction passes the sheet validator", () => {
    for (const r of recons) {
      const v = validateRestyleSheet(r.css);
      expect(v.violations, `${r.directionId}: ${v.violations.join("; ")}`).toEqual([]);
      expect(v.ok).toBe(true);
    }
  });

  it("pairwise sheets differ by more than 40% of their rules", () => {
    for (let i = 0; i < recons.length; i++) {
      for (let j = i + 1; j < recons.length; j++) {
        const a = ruleSet(recons[i]!.css);
        const b = ruleSet(recons[j]!.css);
        const shared = [...a].filter((r) => b.has(r)).length;
        const union = new Set([...a, ...b]).size;
        const overlap = shared / union;
        expect(
          overlap,
          `${recons[i]!.directionId} vs ${recons[j]!.directionId} overlap ${(overlap * 100).toFixed(0)}%`,
        ).toBeLessThan(0.6);
      }
    }
  });

  it("each sheet carries at least 5 recipe families (hero/button/card/section/link + selection)", () => {
    for (const r of recons) {
      const css = r.css;
      const families = [
        /::selection/.test(css),
        /a\s*[,{[]|text-decoration/.test(css),                 // link language
        /::before|::after/.test(css),                          // decorative pseudo layer
        /box-shadow|border/.test(css),                         // card/depth language
        /letter-spacing|text-transform/.test(css),             // typographic voice
        /@import url\('https:\/\/fonts\.googleapis\.com/.test(r.fontImport), // committed pairing
      ].filter(Boolean).length;
      expect(families, r.directionId).toBeGreaterThanOrEqual(5);
    }
  });

  it("ships demo narration: >= 4 directionNotes and cssSource=recipes", () => {
    for (const r of recons) {
      expect(r.directionNotes.length, r.directionId).toBeGreaterThanOrEqual(4);
      expect(r.cssSource).toBe("recipes");
    }
  });

  it("after-scores are honest: better than before but never asserted perfect across the board", () => {
    for (const r of recons) {
      expect(r.scoreAfter).toBeLessThan(r.scoreBefore); // genericness drops
      expect(r.axes.length).toBe(6);
      for (const ax of r.axes) expect(ax.after).toBeGreaterThanOrEqual(ax.before - 1e-9);
    }
  });

  it("never pairs forced ink with a retained unreadable fill (the dark-chip bug)", () => {
    for (const r of recons) {
      // Reconstruct per-element decls from emitted [data-tell-id] rules.
      const rules = r.css.match(/\[data-tell-id="([^"]+)"\]\{[^}]*\}/g) ?? [];
      for (const rule of rules) {
        const id = rule.match(/\[data-tell-id="([^"]+)"\]/)![1];
        const colorMatch = rule.match(/[^-]color:\s*([^;!]+)/);
        const bgMatch = rule.match(/background-color:\s*([^;!]+)/);
        if (!colorMatch || bgMatch) continue; // no forced ink, or bg also owned → fine
        const sample = report.capture.styles.find((s) => s.tellId === id);
        const ownBg = sample?.backgroundColor;
        if (!ownBg || !parseColor(ownBg)) continue; // transparent fill → reads on page paper
        expect(
          contrastRatio(colorMatch[1]!.trim(), ownBg),
          `${r.directionId} ${id}: forced ink on retained fill ${ownBg}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
