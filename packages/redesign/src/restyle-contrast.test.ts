// Guards the white-on-cream seam bug: dark-capture light text must flip to ink on
// editorial paper, including unsampled class rules and role=other nodes.
import { describe, expect, it } from "vitest";
import type { CapturePayload, DesignFingerprint } from "@tell/schema";
import { contrastRatio } from "./color";
import { DIRECTIONS } from "./directions";
import { buildRestylePlan, emitRestyleCss } from "./restyle";

const fingerprint = {
  typography: { fonts: [], sizes: [], weights: [], lineHeights: [] },
  color: { backgrounds: [], foregrounds: [], accents: [] },
  spacing: { densities: [], radii: [] },
  depth: { shadows: [], blurs: [] },
  motion: { transitions: [] },
  components: { buttons: 0, inputs: 0, cards: 0 },
} as unknown as DesignFingerprint;

function captureWithLightText(): CapturePayload {
  const snapshotHtml = `<!doctype html><html><head>
<style data-tell-inlined>
body{background:#0a0a0a;color:#f4f4f4}
.hero-title{color:#ffffff}
.nav a{color:#f3f4f6}
.muted{color:rgba(255,255,255,0.7)}
.chip{background:#111111;color:#eeeeee;border-radius:999px}
</style></head><body>
<nav data-tell-id="t1"><a data-tell-id="t2" href="#">Features</a></nav>
<h1 data-tell-id="t3" class="hero-title">Build something</h1>
<span data-tell-id="t4" class="muted">describe your idea</span>
<div data-tell-id="t5" class="chip">beta</div>
</body></html>`;

  return {
    url: "http://localhost/dark-landing",
    capturedAt: new Date().toISOString(),
    viewport: { width: 1280, height: 720 },
    screenshotBase64: "",
    snapshotHtml,
    cssVariables: [],
    styles: [
      {
        tellId: "t1", tag: "nav", role: "nav", text: "",
        fontFamily: "Inter", fontSize: "14px", fontWeight: "500", lineHeight: "20px",
        color: "rgb(243, 244, 246)", backgroundColor: "rgba(0, 0, 0, 0)",
        padding: "0px", margin: "0px", borderRadius: "0px", boxShadow: "none",
        rect: { x: 0, y: 0, w: 1280, h: 64 },
      },
      {
        tellId: "t2", tag: "a", role: "link", text: "Features",
        fontFamily: "Inter", fontSize: "14px", fontWeight: "500", lineHeight: "20px",
        color: "rgb(243, 244, 246)", backgroundColor: "rgba(0, 0, 0, 0)",
        padding: "0px", margin: "0px", borderRadius: "0px", boxShadow: "none",
        rect: { x: 40, y: 20, w: 80, h: 24 },
      },
      {
        tellId: "t3", tag: "h1", role: "display", text: "Build something",
        fontFamily: "Inter", fontSize: "64px", fontWeight: "700", lineHeight: "72px",
        color: "rgb(255, 255, 255)", backgroundColor: "rgba(0, 0, 0, 0)",
        padding: "0px", margin: "0px", borderRadius: "0px", boxShadow: "none",
        rect: { x: 40, y: 120, w: 600, h: 80 },
      },
      {
        tellId: "t4", tag: "span", role: "other", text: "describe your idea",
        fontFamily: "Inter", fontSize: "28px", fontWeight: "400", lineHeight: "36px",
        color: "rgb(255, 255, 255)", backgroundColor: "rgba(0, 0, 0, 0)",
        padding: "0px", margin: "0px", borderRadius: "0px", boxShadow: "none",
        rect: { x: 40, y: 220, w: 320, h: 40 },
      },
      {
        tellId: "t5", tag: "div", role: "other", text: "beta",
        fontFamily: "Inter", fontSize: "12px", fontWeight: "600", lineHeight: "16px",
        color: "rgb(238, 238, 238)", backgroundColor: "rgb(17, 17, 17)",
        padding: "4px 10px", margin: "0px", borderRadius: "999px", boxShadow: "none",
        rect: { x: 40, y: 280, w: 48, h: 24 },
      },
    ],
  } as unknown as CapturePayload;
}

describe("restyle contrast — dark capture on light paper", () => {
  it("forces ink onto white/light text including role=other", () => {
    const plan = buildRestylePlan(captureWithLightText(), fingerprint, DIRECTIONS.editorial!);
    const css = emitRestyleCss(plan);

    expect(contrastRatio(plan.ink, plan.surface)).toBeGreaterThanOrEqual(4.5);

    const otherOp = plan.ops.find((o) => o.tellId === "t4");
    expect(otherOp?.decls.color, "role=other must get ink").toBe(plan.ink);
    expect(contrastRatio(otherOp!.decls.color!, plan.surface)).toBeGreaterThanOrEqual(4.5);

    // Hero display is owned by heroRules (skipped in the per-element loop)
    expect(css).toMatch(/\[data-tell-id="t3"\][^{]*\{[^}]*color:#241E17\s*!important/);

    // Unsampled light-text class rules get flipped in the sheet
    expect(css).toMatch(/\.hero-title\{[^}]*color:#241E17\s*!important/);
    expect(css).toMatch(/\.nav a\{[^}]*color:#241E17\s*!important/);
    expect(css).toMatch(/\.muted\{[^}]*color:#241E17\s*!important/);

    // Nav language is ink, not terracotta underline parade
    expect(css).toMatch(/nav a[^{]*\{[^}]*color:#241E17\s*!important/);
    expect(css).toMatch(/text-decoration:none\s*!important/);

    // Editorial craft: ink-block buttons, sharp radius — not soft SaaS pills
    expect(plan.direction.recipe.button.kind).toBe("ink-block");
    expect(plan.radius).toBe("2px");
  });
});
