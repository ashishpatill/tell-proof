#!/usr/bin/env tsx
import { captureUrl, diagnoseCapture } from "../index";
import { reconcile } from "@tell/redesign";

const url = process.argv[2] ?? "https://superlearnai.com";
console.log("Capturing", url, "…");
const capture = await captureUrl(url);
console.log("styles sampled:", capture.styles.length);
console.log("elements with data-tell-id:", capture.styles.filter((s) => s.tellId).length);
console.log("snapshotHtml carries data-tell-id:", (capture.snapshotHtml || "").includes("data-tell-id"));
const roleCounts = capture.styles.reduce<Record<string, number>>((a, s) => { a[s.role] = (a[s.role] ?? 0) + 1; return a; }, {});
console.log("roles:", Object.entries(roleCounts).map(([k, v]) => `${k}:${v}`).join(" "));

const report = diagnoseCapture(capture);
const m = report.measures!;
console.log("\n=== BEFORE scorecard ===");
console.log(`genericness ${m.score}  band ${m.band}  tellScore ${m.tellScore}`);
for (const a of m.axes) console.log(`  ${a.label.padEnd(22)} ${a.before.toFixed(2)}  ${a.beforeText}`);
console.log("findings:", report.findings.map((f) => f.detector).join(", ") || "(none)");

for (const dir of ["editorial", "precision", "bold-contrast"]) {
  const r = reconcile(capture, report.fingerprint, report.findings, dir);
  console.log(`\n=== RECONCILE · ${r.label} ===`);
  console.log(`genericness ${r.scoreBefore} -> ${r.scoreAfter}   elementsRestyled ${r.elementsRestyled}   accent ${r.accentBefore} -> ${r.accentAfter}`);
  for (const a of r.axes) console.log(`  ${a.label.padEnd(22)} ${a.before.toFixed(2)} -> ${a.after.toFixed(2)}   ${a.afterText}`);
  console.log(`  element-precise CSS rules: ${(r.css.match(/\[data-tell-id="[^"]+"\]/g) ?? []).length}`);
}
process.exit(0);
