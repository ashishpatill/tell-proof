/**
 * Real-user Playwright pass over Tell Studio + skill graph + showcases.
 * Usage: pnpm e2e:studio
 * Expects @tell/web on http://localhost:3000
 */
import { chromium, type APIRequestContext, type Page } from "playwright";

const BASE = process.env.TELL_E2E_BASE ?? "http://localhost:3000";

async function assertText(page: Page, selector: string, includes: string) {
  const text = await page.locator(selector).innerText();
  if (!text.toLowerCase().includes(includes.toLowerCase())) {
    throw new Error(`Expected ${selector} to include "${includes}", got: ${text.slice(0, 240)}`);
  }
}

async function frameHas(page: Page, testId: string, text: string) {
  const frame = page.frameLocator(`[data-testid="${testId}"]`);
  await frame.locator("body").waitFor({ state: "attached", timeout: 20_000 });
  const body = await frame.locator("body").innerText();
  if (!body.includes(text)) {
    throw new Error(`iframe ${testId} missing "${text}". Saw: ${body.slice(0, 280)}`);
  }
}

async function frameMissing(page: Page, testId: string, text: string) {
  const frame = page.frameLocator(`[data-testid="${testId}"]`);
  await frame.locator("body").waitFor({ state: "attached", timeout: 20_000 });
  const body = await frame.locator("body").innerText();
  if (body.includes(text)) {
    throw new Error(`iframe ${testId} unexpectedly contains "${text}"`);
  }
}

async function readGeneration(page: Page): Promise<number> {
  const text = await page.getByTestId("meta-generation").innerText();
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function waitGeneration(page: Page, atLeast: number) {
  await page.waitForFunction(
    (min) => {
      const el = document.querySelector('[data-testid="meta-generation"]');
      const match = el?.textContent?.match(/(\d+)/);
      return match ? Number(match[1]) >= min : false;
    },
    atLeast,
    { timeout: 20_000 },
  );
}

async function clickAndAwaitNextGeneration(page: Page, click: () => Promise<void>) {
  const before = await readGeneration(page);
  await click();
  await waitGeneration(page, before + 1);
  return readGeneration(page);
}

async function apiDesign(
  request: APIRequestContext,
  brief: Record<string, unknown>,
  redesignFrom?: unknown,
) {
  const res = await request.post(`${BASE}/api/design`, {
    data: redesignFrom ? { brief, redesignFrom } : { brief },
  });
  if (!res.ok()) throw new Error(`API design failed: ${res.status()} ${await res.text()}`);
  return res.json() as Promise<{
    spec: {
      brief: { siteKind: string; productName: string; features: { name: string }[] };
      routedSkills: string[];
      researchPlan: {
        domainId: string;
        researchNodes: string[];
        packFound: boolean;
        followOnCraft: string[];
      };
      sections: { kind: string; title: string }[];
      taste: { aestheticLean: string; motion: string };
      tellDirectionId: string;
      customizationHints: string[];
      summary: string;
    };
    previewHtml: string;
    redesigned?: boolean;
  }>;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const request = page.context().request;

  try {
    // ── API: from-scratch for every site kind ───────────────────────
    const saas = await apiDesign(request, {
      productName: "Atlas",
      tagline: "Pipeline clarity",
      audience: "Sales leaders",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        { id: "1", name: "Deal radar", description: "Spot risk early", priority: "p0" },
        { id: "2", name: "Coach notes", description: "Next best action", priority: "p0" },
      ],
      taste: { aestheticLean: "conversion-sharp", motion: "subtle-micro" },
    });
    if (saas.spec.brief.siteKind !== "saas-marketing") throw new Error("saas kind mismatch");
    for (const skill of [
      "analyze-features-requirements",
      "design-system-foundation",
      "hero-section",
      "features-benefits",
      "product-proof-stage",
      "pricing-or-plans",
      "navigation-header-footer",
      "forms-ctas-conversion",
      "restrained-motion-micro",
      "responsive-performance",
    ]) {
      if (!saas.spec.routedSkills.includes(skill)) throw new Error(`saas missing skill ${skill}`);
    }
    if (!saas.previewHtml.includes("Deal radar")) throw new Error("saas preview missing feature");
    if (saas.previewHtml.includes("Account scoring")) throw new Error("saas leaked showcase feature");
    if (!saas.previewHtml.includes("ds-brand-mark")) throw new Error("saas missing brand-first hero mark");
    if (!saas.previewHtml.includes(":focus-visible")) throw new Error("saas missing focus-visible styles");
    if (saas.previewHtml.includes("Starter — core features")) throw new Error("saas invented filler pricing");
    if (!saas.previewHtml.includes("data-workflow-proof")) throw new Error("saas missing product-proof workflow");
    if (!saas.previewHtml.includes("Sample workflow")) throw new Error("saas workflow must be labeled sample");
    if (!saas.previewHtml.includes("htmx.org")) throw new Error("saas workflow should load HTMX for panel swaps");
    if (saas.spec.routedSkills[0] !== "website-domain-research") {
      throw new Error("saas must route website-domain-research first");
    }
    if (!saas.spec.researchPlan?.researchNodes?.includes("load-prior-domain")) {
      throw new Error("saas missing researchPlan.load-prior-domain");
    }
    if (!saas.previewHtml.includes('data-responsive-performance="required"')) {
      throw new Error("saas missing responsive-performance HTML marker");
    }

    const dash = await apiDesign(request, {
      productName: "Atlas",
      tagline: "Seller workspace",
      siteKind: "dashboard-webapp",
      lockSiteKind: true,
      features: [
        { id: "1", name: "Queue", description: "Today", priority: "p0" },
        { id: "2", name: "Room", description: "Context", priority: "p0" },
      ],
      taste: { aestheticLean: "minimal-clean", motion: "none" },
    });
    if (!dash.spec.routedSkills.includes("dashboard-or-webapp-ui")) throw new Error("dashboard skill missing");
    if (dash.spec.routedSkills.includes("pricing-or-plans")) throw new Error("dashboard should not price");
    if (dash.spec.routedSkills.includes("restrained-motion-micro")) throw new Error("motion none should drop micro skill");
    // Dashboard shell is one app grid (aside + main), not a marketing multi-grid.
    if ((dash.previewHtml.match(/class="ds-app-grid"/g) || []).length < 1) {
      throw new Error("dashboard must be one shell grid");
    }
    if (!dash.previewHtml.includes("ds-app-side") || !dash.previewHtml.includes("ds-app-main")) {
      throw new Error("dashboard shell incomplete");
    }

    const corp = await apiDesign(request, {
      productName: "Atlas",
      tagline: "Enterprise story",
      siteKind: "corporate-story",
      lockSiteKind: true,
      features: [{ id: "1", name: "Trust center", description: "Security narrative", priority: "p0" }],
      taste: { aestheticLean: "refined-story", motion: "light-scroll-reveals" },
    });
    if (!corp.spec.routedSkills.includes("content-storytelling-pages")) throw new Error("corporate story skill missing");

    const edu = await apiDesign(request, {
      productName: "Signal Path",
      tagline: "How it works",
      siteKind: "docs-educational",
      lockSiteKind: true,
      features: [{ id: "1", name: "Mechanism diagram", description: "Interactive chapter figure", priority: "p0" }],
      taste: { aestheticLean: "refined-story", motion: "subtle-micro" },
    });
    if (edu.spec.brief.siteKind !== "docs-educational") throw new Error("edu kind mismatch");
    if (!edu.previewHtml.includes("Mechanism diagram")) throw new Error("edu feature missing");
    if (!edu.previewHtml.includes('data-instrument="scrub"')) throw new Error("edu missing figure instrument");
    if (!edu.previewHtml.includes("data-scrub-caption") && !edu.previewHtml.includes("<figcaption")) {
      throw new Error("edu missing figure caption");
    }

    // API redesign: replace features entirely, prior features must not leak
    const redesigned = await apiDesign(
      request,
      {
        productName: "Harbor",
        tagline: "Inventory clarity",
        siteKind: "saas-marketing",
        lockSiteKind: true,
        features: [
          { id: "1", name: "Stock heatmaps", description: "Aging inventory", priority: "p0" },
          { id: "2", name: "Reorder alerts", description: "Replenish on time", priority: "p1" },
        ],
        taste: { aestheticLean: "system-crafted", motion: "subtle-micro", colorMood: "soft-brand-accent" },
      },
      saas.spec,
    );
    if (!redesigned.redesigned) throw new Error("API redesign flag missing");
    if (!redesigned.previewHtml.includes("Harbor")) throw new Error("redesign product missing");
    if (!redesigned.previewHtml.includes("Stock heatmaps")) throw new Error("redesign feature missing");
    if (redesigned.previewHtml.includes("Deal radar")) throw new Error("redesign leaked prior features");
    if (redesigned.previewHtml.includes("Account scoring")) throw new Error("redesign leaked showcase features");
    if (redesigned.spec.taste.aestheticLean !== "system-crafted") throw new Error("redesign lean mismatch");
    if (!redesigned.spec.customizationHints.some((h) => h.includes("Redesign from Atlas"))) {
      throw new Error("redesign continuity hint missing");
    }

    // Showcase GET endpoints
    for (const key of ["saas", "dashboard", "corporate", "educational", "clinic"]) {
      const res = await request.get(`${BASE}/api/design?showcase=${key}`);
      if (!res.ok()) throw new Error(`showcase API ${key} failed`);
      const body = await res.json();
      if (!body.spec?.routedSkills?.length) throw new Error(`showcase ${key} empty skills`);
      if (!body.previewHtml) throw new Error(`showcase ${key} empty html`);
    }

    // ── Studio UI as a real user ────────────────────────────────────
    // Preview hooks: preview-frame / preview-frame-wrap / viewport-{mobile,tablet,desktop}
    // (legacy studio-frame / viewport-390 / data-viewport retired with DesignControls).
    await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("studio-page").waitFor();
    await page.getByTestId("preview-frame-wrap").waitFor({ timeout: 20_000 });
    await page.getByTestId("preview-frame").waitFor({ timeout: 20_000 });
    await waitGeneration(page, 1);
    await frameHas(page, "preview-frame", "Northstar");
    await assertText(page, '[data-testid="meta-skills"]', "hero-section");
    await assertText(page, '[data-testid="meta-sitekind"]', "saas-marketing");
    await frameHas(page, "preview-frame", "Northstar");
    const brandCount = await page.frameLocator('[data-testid="preview-frame"]').locator(".ds-brand-mark").count();
    if (brandCount < 1) throw new Error("studio hero missing brand mark");

    // Viewport craft tools — assert via iframe maxWidth (data-viewport removed)
    await page.getByTestId("viewport-mobile").click();
    const mobileMax = await page.getByTestId("preview-frame").evaluate((el) => (el as HTMLElement).style.maxWidth);
    if (mobileMax !== "390px") throw new Error(`expected maxWidth 390px, got ${mobileMax}`);
    await page.getByTestId("viewport-desktop").click();
    const desktopMax = await page.getByTestId("preview-frame").evaluate((el) => (el as HTMLElement).style.maxWidth);
    if (desktopMax !== "1280px") throw new Error(`expected maxWidth 1280px, got ${desktopMax}`);

    // Taste controls → redesign (hidden bridge selects keep taste-* / input-sitekind testids)
    await page.getByTestId("taste-lean").selectOption("minimal-clean");
    await page.getByTestId("taste-motion").selectOption("none");
    await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-generate").click());
    const aesthetic = await page.frameLocator('[data-testid="preview-frame"]').locator("body").getAttribute("data-lean");
    if (aesthetic !== "minimal-clean") throw new Error(`Expected minimal-clean, got ${aesthetic}`);
    await assertText(page, '[data-testid="meta-skills"]', "analyze-features-requirements");
    await assertText(page, '[data-testid="meta-hints"]', "Redesign from");

    // Site-kind switches via controls (templates live on Showcase, not Studio)
    await page.getByTestId("input-product").fill("Pulseboard");
    await page.getByTestId("input-tagline").fill("See the queue that matters");
    await page.getByTestId("input-sitekind").selectOption("dashboard-webapp");
    await page.getByTestId("input-lock-sitekind").check();
    await page.getByTestId("input-features").fill("Priority queue — Surface the next action\nWatchlist — Pin accounts that moved\nDigest — Morning summary");
    await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-generate").click());
    await assertText(page, '[data-testid="meta-sitekind"]', "dashboard-webapp");
    await assertText(page, '[data-testid="meta-skills"]', "dashboard-or-webapp-ui");
    await frameHas(page, "preview-frame", "Priority queue");
    await frameMissing(page, "preview-frame", "Account scoring");

    await page.getByTestId("input-product").fill("Harbor");
    await page.getByTestId("input-tagline").fill("Clarity for teams");
    await page.getByTestId("input-sitekind").selectOption("corporate-story");
    await page.getByTestId("input-features").fill("Mission — Why we build\nTeams — Who ships\nProof — Customer outcomes");
    await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-generate").click());
    await assertText(page, '[data-testid="meta-sitekind"]', "corporate-story");
    await assertText(page, '[data-testid="meta-skills"]', "content-storytelling-pages");
    await frameHas(page, "preview-frame", "Clarity for teams");

    await page.getByTestId("input-product").fill("Fieldmark");
    await page.getByTestId("input-tagline").fill("Placement model explained");
    await page.getByTestId("input-sitekind").selectOption("docs-educational");
    await page.getByTestId("input-features").fill("Placement model — How scoring works\nWalkthrough — Step-by-step figure\nGlossary — Shared language");
    await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-generate").click());
    await assertText(page, '[data-testid="meta-sitekind"]', "docs-educational");
    await frameHas(page, "preview-frame", "Placement model");
    const figureCount = await page.frameLocator('[data-testid="preview-frame"]').locator("[data-instrument='scrub']").count();
    if (figureCount < 1) throw new Error("educational site missing scrub figure");

    // From-scratch custom product via primary redesign button (features win)
    await page.getByTestId("input-product").fill("Ledgerly");
    await page.getByTestId("input-tagline").fill("Close books without the chase");
    await page.getByTestId("input-sitekind").selectOption("saas-marketing");
    await page.getByTestId("input-lock-sitekind").check();
    await page.getByTestId("input-features").fill("Bank match — Auto-match transactions\nClose checklist — Month-end workflow\nAudit trail — Immutable history");
    await page.getByTestId("taste-lean").selectOption("conversion-sharp");
    await page.getByTestId("taste-motion").selectOption("subtle-micro");
    await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-generate").click());
    await frameHas(page, "preview-frame", "Ledgerly");
    await frameHas(page, "preview-frame", "Bank match");
    await frameHas(page, "preview-frame", "Close checklist");
    await frameMissing(page, "preview-frame", "Interactive diagram");
    await frameMissing(page, "preview-frame", "Priority queue");
    await assertText(page, '[data-testid="meta-skills"]', "pricing-or-plans");
    await assertText(page, '[data-testid="meta-sections"]', "hero");

    // Magic edit → dashboard create from same product features
    await page.getByTestId("input-magic").fill("redesign as dashboard workspace, minimal-clean, no motion");
    await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-magic").click());
    await assertText(page, '[data-testid="meta-sitekind"]', "dashboard-webapp");
    await assertText(page, '[data-testid="meta-summary"]', "minimal clean");
    await frameHas(page, "preview-frame", "Ledgerly");

    // All aesthetic leans via UI quickly
    const leanLabels: Record<string, string> = {
      "system-crafted": "system crafted",
      "refined-story": "refined story",
      "conversion-sharp": "conversion sharp",
    };
    for (const lean of ["system-crafted", "refined-story", "conversion-sharp"] as const) {
      await page.getByTestId("input-sitekind").selectOption("saas-marketing");
      await page.getByTestId("input-lock-sitekind").check();
      await page.getByTestId("taste-lean").selectOption(lean);
      await clickAndAwaitNextGeneration(page, () => page.getByTestId("btn-generate").click());
      await page.getByTestId("meta-summary").filter({ hasText: new RegExp(leanLabels[lean]!, "i") }).waitFor({ timeout: 15_000 });
      const attr = await page.frameLocator('[data-testid="preview-frame"]').locator("body").getAttribute("data-lean");
      if (attr !== lean) throw new Error(`lean UI mismatch: wanted ${lean}, got ${attr}`);
    }

    // Showcases pages
    for (const [path, needle, id, extra] of [
      ["/showcase/saas", "Account scoring", "showcase-saas", "ds-brand-mark"],
      ["/showcase/dashboard", "Priority queue", "showcase-dashboard", "ds-app-grid"],
      ["/showcase/corporate", "Clarity for teams", "showcase-corporate", "ds-chapter"],
      ["/showcase/educational", "Placement model", "showcase-educational", "data-instrument"],
    ] as const) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await page.getByTestId(id).waitFor();
      await frameHas(page, "showcase-frame", needle);
      const html = await page.frameLocator('[data-testid="showcase-frame"]').locator("html").innerHTML();
      if (!html.includes(extra)) throw new Error(`${path} missing craft marker ${extra}`);
      const ctaCount = await page.frameLocator('[data-testid="showcase-frame"]').locator("a.ds-btn-primary").count();
      // Quiet educational nav may omit header CTA; page CTA still required.
      if (ctaCount < 1) throw new Error(`${path} missing primary CTA`);
    }

    console.log("e2e-studio-playwright: PASS");
  } catch (err) {
    console.error("e2e-studio-playwright: FAIL");
    console.error(" -", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
