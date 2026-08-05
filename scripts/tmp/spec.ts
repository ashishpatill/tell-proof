import { designFromFeatures } from "../../packages/design-skills/src/index";
import { CRITIQUE_BRIEFS, HOLDOUT } from "../design-research/briefs";

for (const e of [...CRITIQUE_BRIEFS, HOLDOUT]) {
  const spec = designFromFeatures(e.brief).spec;
  console.log(`\n=== ${e.id}`);
  for (const s of spec.sections) {
    console.log(`  ${s.kind.padEnd(10)} ${s.layout.padEnd(18)} surface=${s.surface} blocks=${s.blocks.length} metrics=${s.metrics.length} "${s.title.slice(0, 40)}"`);
    if (s.kind === "figure" || s.kind === "story" || s.kind === "specimen") {
      for (const b of s.blocks) console.log(`      - ${b.title} | meta=${b.meta ?? ""} | pts=${b.points.length} | body="${(b.body ?? "").slice(0, 50)}"`);
    }
  }
}
