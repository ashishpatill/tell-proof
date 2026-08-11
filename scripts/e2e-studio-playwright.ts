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
    for (const key of ["saas", "dashboard", "corporate", "educational"]) {
      const res = await request.get(`${BASE}/api/design?showcase=${key}`);
      if (!res.ok()) throw new Error(`showcase API ${key} failed`);
      const body = await res.json();
      if (!body.spec?.routedSkills?.length) throw new Error(`showcase ${key} empty skills`);
      if (!body.previewHtml) throw new Error(`showcase ${key} empty html`);
    }

    // ── Implicit create (Home) — no Studio form ─────────────────────
    for (const query of [
      "B2B SaaS demo landing for pipeline coaching",
      "dashboard workspace for ops priority queue",
      "corporate story site for clarity for teams",
      "educational docs site for placement model",
    ]) {
      const res = await request.post(`${BASE}/api/design`, {
        data: { query },
      });
      if (!res.ok()) throw new Error(`create query failed: ${query}`);
      const body = await res.json();
      if (!body.previewHtml || !body.plan?.steps?.length) {
        throw new Error(`create query incomplete: ${query}`);
      }
      if (!body.spec?.routedSkills?.length) throw new Error(`create missing skills: ${query}`);
    }

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("product-sidebar").waitFor();
    // Studio is no longer an app feature in the rail
    const studioLink = page.locator('[data-testid="product-sidebar"] a[href="/studio"]');
    if ((await studioLink.count()) > 0) throw new Error("Studio must not appear in product sidebar");

    await page.getByRole("button", { name: /Create a site/i }).click();
    await page.getByLabel(/Design brief|site to create/i).fill(
      "B2B SaaS demo landing for pipeline — warmer editorial",
    );
    await page.keyboard.press("Control+Enter");
    await page.getByTestId("create-site-steps").waitFor({ timeout: 10_000 });
    await page.getByTestId("site-create-frame").waitFor({ timeout: 30_000 });
    await frameHas(page, "site-create-frame", "Northstar");

    // /studio deep-link hands off to Home create
    await page.goto(`${BASE}/studio?brief=${encodeURIComponent("portrait photographer booking site")}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
    await page.getByTestId("site-create-frame").waitFor({ timeout: 30_000 });

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
