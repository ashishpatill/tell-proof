/**
 * Record short motion clips for each showcase template.
 *
 * Serves designFromFeatures HTML (same path as critique), records Playwright video while
 * scrolling so hero entrance + section reveals + siteKind signatures are visible.
 *
 * Usage (from repo root):
 *   pnpm exec tsx scripts/record-template-motion.ts
 *   pnpm exec tsx scripts/record-template-motion.ts -- --only saas,studio,lantern
 *
 * Outputs:
 *   /opt/cursor/artifacts/motion-clips/<key>.webm
 *   research/motion-clips/manifest.json (gitignored path under research/shots pattern —
 *   also copied to /opt/cursor/artifacts/motion-clips/manifest.json)
 */
import { createServer } from "node:http";
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { designFromFeatures, listTemplates, type TemplateKey } from "../packages/design-skills/src/index";

function repoRoot(from = process.cwd()): string {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

const root = repoRoot();
const ARTIFACTS = "/opt/cursor/artifacts/motion-clips";
const TMP = "/tmp/tell-motion-clips";

const SIGNATURE: Record<string, string> = {
  saas: "rise + short stagger (conversion)",
  dashboard: "chip/nav micro-nudge only",
  corporate: "slow editorial fade from top",
  educational: "tight teaching travel + step nudge",
  fintech: "precision scale-in (no float)",
  studio: "deep rise + tall chapter pin",
  consumer: "horizontal slide (alternating)",
  foundry: "clip-path mask reveal",
  dossier: "edge slide + vertical chapter ink",
  observatory: "tight tick stagger + letter-spacing settle",
  archive: "ledger row left-slide + hover nudge",
  loom: "weave alternate X travel",
  herbarium: "soft float + slight scale",
  press: "press-snap settle",
  lantern: "ember rise + waypoint handoff",
};

async function main(): Promise<void> {
  const onlyArg = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]
    : null;
  const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;

  const templates = listTemplates().filter((t) => !only || only.has(t.key));
  mkdirSync(ARTIFACTS, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  for (const f of readdirSync(TMP)) rmSync(join(TMP, f), { recursive: true, force: true });

  const pages = templates.map((t) => {
    const { spec, previewHtml } = designFromFeatures(t.brief);
    return {
      key: t.key as TemplateKey,
      label: t.label,
      siteKind: spec.brief.siteKind,
      motion: spec.taste.motion,
      signature: SIGNATURE[t.key] ?? "shared grammar",
      html: previewHtml,
    };
  });

  const server = createServer((req, res) => {
    const id = (req.url ?? "/").replace(/^\//, "").replace(/\?.*$/, "");
    const page = pages.find((p) => p.key === id);
    if (!page) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.html);
  });
  await new Promise<void>((r) => server.listen(4330, "127.0.0.1", r));

  const browser = await chromium.launch();
  const manifest: Array<{
    key: string;
    label: string;
    siteKind: string;
    motion: string;
    signature: string;
    clip: string;
  }> = [];

  for (const page of pages) {
    const clipDir = join(TMP, page.key);
    mkdirSync(clipDir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      recordVideo: { dir: clipDir, size: { width: 1280, height: 800 } },
      // Prefer full motion for verification clips.
      reducedMotion: "no-preference",
    });
    const p = await context.newPage();
    await p.goto(`http://127.0.0.1:4330/${page.key}`, { waitUntil: "networkidle", timeout: 45_000 });
    // Slow motion for verification clips so siteKind signatures read on camera.
    await p.addStyleTag({
      content: `
        @media (prefers-reduced-motion: no-preference) {
          .ds-enter, .ds-reveal, .ds-reveal .ds-stagger > * {
            animation-duration: 1.1s !important;
          }
        }
      `,
    });
    // Capture computed signature for the manifest.
    const computed = await p.evaluate(() => {
      const reveal = document.querySelector(".ds-reveal");
      const enter = document.querySelector(".ds-enter");
      return {
        revealAnim: reveal ? getComputedStyle(reveal).animationName : null,
        enterAnim: enter ? getComputedStyle(enter).animationName : null,
        revealCount: document.querySelectorAll(".ds-reveal").length,
      };
    });
    // Let hero entrance play from the top.
    await p.waitForTimeout(1400);
    await p.evaluate(async () => {
      const step = Math.max(220, Math.floor(window.innerHeight * 0.42));
      const max = Math.min(document.body.scrollHeight, window.innerHeight * 4.8);
      for (let y = 0; y <= max; y += step) {
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        await new Promise((r) => setTimeout(r, 700));
      }
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      await new Promise((r) => setTimeout(r, 700));
    });
    // Light hover on a primary control if present.
    const btn = p.locator(".ds-btn-primary, .ds-btn, .ds-priority-chip, .ds-app-nav-item").first();
    if (await btn.count()) {
      await btn.hover().catch(() => {});
      await p.waitForTimeout(700);
    }
    await p.waitForTimeout(500);
    await context.close();

    const videos = readdirSync(clipDir).filter((f) => f.endsWith(".webm"));
    const outName = `${page.key}-motion.webm`;
    const outPath = join(ARTIFACTS, outName);
    if (videos[0]) {
      renameSync(join(clipDir, videos[0]!), outPath);
    }
    manifest.push({
      key: page.key,
      label: page.label,
      siteKind: page.siteKind,
      motion: page.motion,
      signature: page.signature,
      computed,
      clip: outPath,
    });
    console.log(
      `recorded ${page.key} (${page.motion}) → ${outName} — ${page.signature} [anim=${computed.revealAnim ?? computed.enterAnim ?? "none"}]`,
    );
  }

  await browser.close();
  server.close();

  const manifestPath = join(ARTIFACTS, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify({ recordedAt: new Date().toISOString(), clips: manifest }, null, 2));
  // Keep a copy under docs/media for local review if writable.
  const mediaDir = resolve(root, "docs/media/motion-clips");
  try {
    mkdirSync(mediaDir, { recursive: true });
    writeFileSync(join(mediaDir, "manifest.json"), JSON.stringify({ recordedAt: new Date().toISOString(), clips: manifest }, null, 2));
    for (const c of manifest) {
      if (existsSync(c.clip)) copyFileSync(c.clip, join(mediaDir, `${c.key}-motion.webm`));
    }
  } catch {
    /* artifacts-only is fine */
  }
  console.log(`\nmanifest → ${manifestPath}`);
  console.log(`clips: ${manifest.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
