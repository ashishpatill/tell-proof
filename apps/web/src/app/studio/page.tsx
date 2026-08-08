"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DesignFromFeaturesResponse,
  listTemplates,
  templateToStudioPreset,
  type AestheticLean,
  type ColorMood,
  type Density,
  type DesignSpec,
  type MotionLevel,
  type RoundingDepth,
  type SiteKind,
  type TemplateKey,
  type TypeWeight,
} from "@tell/design-skills";

type DesignResponse = DesignFromFeaturesResponse & { error?: string };
type GenerateMode = "create" | "redesign";
type BusinessGoal = "leads" | "demos" | "trust" | "sales" | "activation";
type ViewportWidth = "390" | "768" | "1280";

/** Research-backed offerings — single source in @tell/design-skills templates. */
const TEMPLATE_KEYS = listTemplates().map((t) => t.key);
const PRESETS = Object.fromEntries(TEMPLATE_KEYS.map((key) => [key, templateToStudioPreset(key)])) as Record<
  TemplateKey,
  ReturnType<typeof templateToStudioPreset>
>;

function parseFeatures(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(/\s+[—–-]\s+/).map((s) => s.trim());
      const name = parts[0] || `Feature ${index + 1}`;
      const description = parts.slice(1).join(" — ");
      return {
        id: `feat-${index}`,
        name,
        description,
        priority: index < 2 ? ("p0" as const) : ("p1" as const),
      };
    });
}

export default function StudioPage() {
  const initial = PRESETS.saas!;
  const [productName, setProductName] = useState(initial.productName);
  const [tagline, setTagline] = useState(initial.tagline);
  const [audience, setAudience] = useState(initial.audience);
  const [siteKind, setSiteKind] = useState<SiteKind>(initial.siteKind);
  const [lockSiteKind, setLockSiteKind] = useState(true);
  const [businessGoal, setBusinessGoal] = useState<BusinessGoal>(initial.businessGoal);
  const [featuresText, setFeaturesText] = useState(initial.featuresText);
  const [density, setDensity] = useState<Density>(initial.density);
  const [motion, setMotion] = useState<MotionLevel>(initial.motion);
  const [aestheticLean, setAestheticLean] = useState<AestheticLean>(initial.aestheticLean);
  const [colorMood, setColorMood] = useState<ColorMood>("neutral-professional");
  const [typographyWeight, setTypographyWeight] = useState<TypeWeight>("medium-modern");
  const [roundingDepth, setRoundingDepth] = useState<RoundingDepth>("soft");
  const [magic, setMagic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DesignResponse | null>(null);
  const [generation, setGeneration] = useState(0);
  const [viewport, setViewport] = useState<ViewportWidth>("1280");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const lastSpecRef = useRef<DesignSpec | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const brief = useMemo(
    () => ({
      productName,
      tagline,
      audience,
      businessGoal,
      siteKind,
      lockSiteKind,
      features: parseFeatures(featuresText),
      taste: { density, motion, aestheticLean, colorMood, typographyWeight, roundingDepth },
    }),
    [
      productName,
      tagline,
      audience,
      businessGoal,
      siteKind,
      lockSiteKind,
      featuresText,
      density,
      motion,
      aestheticLean,
      colorMood,
      typographyWeight,
      roundingDepth,
    ],
  );

  const generateWith = useCallback(async (nextBrief: typeof brief, mode: GenerateMode = "create") => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const redesignFrom = mode === "redesign" ? lastSpecRef.current ?? undefined : undefined;
      const res = await fetch("/api/design", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brief: nextBrief, redesignFrom }),
        signal: controller.signal,
      });
      const raw = await res.json();
      if (requestId !== requestIdRef.current) return;
      if (!res.ok) throw new Error((raw as DesignResponse).error || "Design failed");
      const data = DesignFromFeaturesResponse.parse(raw);
      lastSpecRef.current = data.spec;
      setResult(data);
      setGeneration((g) => g + 1);
    } catch (e) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : "Design failed");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const generate = useCallback(async () => {
    // After the first result, the primary button redesigns; presets/magic still create from scratch.
    await generateWith(brief, lastSpecRef.current ? "redesign" : "create");
  }, [brief, generateWith]);

  useEffect(() => {
    // Defer the first /api/design call until after paint so /studio navigates instantly.
    let cancelled = false;
    const start = () => {
      if (!cancelled) void generateWith(brief, "create");
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(start, { timeout: 500 });
    } else {
      timeoutId = setTimeout(start, 50);
    }
    return () => {
      cancelled = true;
      if (idleId != null && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
      abortRef.current?.abort();
    };
    // initial generate only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyHtml() {
    if (!result?.previewHtml) return;
    try {
      await navigator.clipboard.writeText(result.previewHtml);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  function loadPreset(key: TemplateKey) {
    const p = PRESETS[key]!;
    setProductName(p.productName);
    setTagline(p.tagline);
    setAudience(p.audience);
    setSiteKind(p.siteKind);
    setBusinessGoal(p.businessGoal);
    setLockSiteKind(true);
    setFeaturesText(p.featuresText);
    setAestheticLean(p.aestheticLean);
    setMotion(p.motion);
    setDensity(p.density);
    setColorMood(p.colorMood);
    setTypographyWeight(p.typographyWeight);
    setRoundingDepth(p.roundingDepth);
    void generateWith({
      productName: p.productName,
      tagline: p.tagline,
      audience: p.audience,
      businessGoal: p.businessGoal,
      siteKind: p.siteKind,
      lockSiteKind: true,
      features: parseFeatures(p.featuresText),
      taste: {
        density: p.density,
        motion: p.motion,
        aestheticLean: p.aestheticLean,
        colorMood: p.colorMood,
        typographyWeight: p.typographyWeight,
        roundingDepth: p.roundingDepth,
      },
    });
  }

  function applyMagic() {
    const text = magic.toLowerCase();
    let nextDensity = density;
    let nextMotion = motion;
    let nextLean = aestheticLean;
    let nextColor = colorMood;
    let nextKind = siteKind;

    if (/minimal|clean|quiet|sparse/.test(text)) {
      nextLean = "minimal-clean";
      nextDensity = "sparse";
      nextMotion = "none";
    }
    if (/conversion|cta|saas|sharp/.test(text)) {
      nextLean = "conversion-sharp";
      nextMotion = "subtle-micro";
      if (/\b(fintech|treasury|payments?|banking|wire|payroll)\b/.test(text)) nextKind = "fintech-marketing";
      if (/saas/.test(text)) nextKind = "saas-marketing";
    }
    if (/system|token|crafted/.test(text)) nextLean = "system-crafted";
    if (/studio|portfolio|art.?direct|selected work|atelier/.test(text)) {
      nextKind = "art-directed-studio";
      nextLean = "refined-story";
      nextDensity = "sparse";
    }
    if (/consumer|everyday|lifestyle|shopper|retail|dtc/.test(text)) {
      nextKind = "consumer-craft";
      nextLean = "conversion-sharp";
      nextDensity = "balanced";
    }
    if (/foundry|typeface|specimen|optical|glyph|typography/.test(text)) {
      nextKind = "editorial-foundry";
      nextLean = "refined-story";
      nextDensity = "sparse";
    }
    if (/dossier|briefing|folio|capital brief|research desk|imprint|memo/.test(text)) {
      nextKind = "research-dossier";
      nextLean = "refined-story";
      nextDensity = "sparse";
    }
    if (/observatory|telemetry|signal desk|channel lattice|on.?call|sre desk|incident/.test(text)) {
      nextKind = "signal-observatory";
      nextLean = "refined-story";
      nextDensity = "balanced";
    }
    if (/archive|alphabetical|stamp roll|registry|alpha.?rail|index ledger|entry folio/.test(text)) {
      nextKind = "archive-index";
      nextLean = "refined-story";
      nextDensity = "sparse";
    }
    if (/story|editorial|refined|corporate/.test(text)) {
      nextLean = "refined-story";
      nextDensity = "sparse";
      if (/corporate/.test(text)) nextKind = "corporate-story";
    }
    if (/dashboard|workspace|console/.test(text)) {
      nextKind = "dashboard-webapp";
      nextLean = "minimal-clean";
      nextMotion = "none";
      nextDensity = "information-rich";
    }
    if (/docs|educational|textbook|chapter/.test(text)) {
      nextKind = "docs-educational";
      nextLean = "refined-story";
      nextDensity = "sparse";
    }
    if (/dark/.test(text)) nextColor = "dark-premium";
    if (/no motion|without animation|static/.test(text)) nextMotion = "none";
    if (/scroll reveal/.test(text)) nextMotion = "light-scroll-reveals";

    setDensity(nextDensity);
    setMotion(nextMotion);
    setAestheticLean(nextLean);
    setColorMood(nextColor);
    setSiteKind(nextKind);
    setLockSiteKind(true);

    void generateWith({
      ...brief,
      siteKind: nextKind,
      lockSiteKind: true,
      taste: {
        density: nextDensity,
        motion: nextMotion,
        aestheticLean: nextLean,
        colorMood: nextColor,
        typographyWeight,
        roundingDepth,
      },
    });
  }

  return (
    <div className="min-h-screen bg-bg text-text" data-testid="studio-page">
      <header className="border-b border-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Tell Studio</p>
            <h1 className="font-display text-xl font-semibold tracking-tight">Premium content-custom design</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-secondary">
            <a className="underline underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href="/showcase">
              Specimens
            </a>
            <a className="underline underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href="/showcase/studio">
              Featured
            </a>
            <a className="underline underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href="/">
              Tell Report
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 p-4 md:grid-cols-[380px_1fr] md:p-6">
        <aside className="space-y-4 rounded-card border border-border bg-surface p-4" data-testid="studio-controls">
          <div className="space-y-2" data-testid="preset-row">
            <p className="text-xs text-secondary">
              Research-backed offerings, deepened by the loop — not a theme gallery.
            </p>
            <div className="flex flex-wrap gap-2">
              {listTemplates().map((t) => (
                <button
                  key={t.key}
                  type="button"
                  title={t.marketJob}
                  className="rounded border border-border px-2 py-1 text-xs font-medium transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
                  onClick={() => loadPreset(t.key)}
                  disabled={loading}
                  data-testid={`preset-${t.key}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Product name</span>
            <input
              className="w-full rounded border border-border bg-bg px-3 py-2 text-text outline-none focus-visible:border-accent"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              data-testid="input-product"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tagline</span>
            <input
              className="w-full rounded border border-border bg-bg px-3 py-2 text-text outline-none focus-visible:border-accent"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              data-testid="input-tagline"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Audience</span>
            <input
              className="w-full rounded border border-border bg-bg px-3 py-2 text-text outline-none focus-visible:border-accent"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              data-testid="input-audience"
            />
          </label>

          <Select
            label="Site kind"
            value={siteKind}
            onChange={(v) => setSiteKind(v as SiteKind)}
            options={[
              "saas-marketing",
              "dashboard-webapp",
              "corporate-story",
              "docs-educational",
              "fintech-marketing",
              "art-directed-studio",
              "consumer-craft",
              "editorial-foundry",
              "research-dossier",
              "signal-observatory",
              "archive-index",
            ]}
            testId="input-sitekind"
          />
          <Select
            label="Business goal"
            value={businessGoal}
            onChange={(v) => setBusinessGoal(v as BusinessGoal)}
            options={["demos", "leads", "trust", "sales", "activation"]}
            testId="input-goal"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lockSiteKind}
              onChange={(e) => setLockSiteKind(e.target.checked)}
              data-testid="input-lock-sitekind"
            />
            Lock site kind (disable auto-detect)
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Features (one per line: Name — description)</span>
            <textarea
              className="min-h-[140px] w-full rounded border border-border bg-bg px-3 py-2 font-mono text-xs text-text outline-none focus-visible:border-accent"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              data-testid="input-features"
            />
          </label>

          <fieldset className="space-y-2 border-t border-border pt-3">
            <legend className="text-sm font-semibold">Taste Controls</legend>
            <Select label="Density" value={density} onChange={(v) => setDensity(v as Density)} options={["sparse", "balanced", "information-rich"]} testId="taste-density" />
            <Select label="Motion" value={motion} onChange={(v) => setMotion(v as MotionLevel)} options={["none", "subtle-micro", "light-scroll-reveals"]} testId="taste-motion" />
            <Select
              label="Aesthetic lean"
              value={aestheticLean}
              onChange={(v) => setAestheticLean(v as AestheticLean)}
              options={["minimal-clean", "conversion-sharp", "system-crafted", "refined-story"]}
              testId="taste-lean"
            />
            <Select
              label="Color mood"
              value={colorMood}
              onChange={(v) => setColorMood(v as ColorMood)}
              options={["neutral-professional", "soft-brand-accent", "dark-premium", "light-airy"]}
              testId="taste-color"
            />
            <Select
              label="Typography"
              value={typographyWeight}
              onChange={(v) => setTypographyWeight(v as TypeWeight)}
              options={["light-elegant", "medium-modern", "bold-confident"]}
              testId="taste-type"
            />
            <Select
              label="Rounding"
              value={roundingDepth}
              onChange={(v) => setRoundingDepth(v as RoundingDepth)}
              options={["sharp", "soft", "soft-elevation"]}
              testId="taste-rounding"
            />
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Magic edit</span>
            <textarea
              className="min-h-[72px] w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus-visible:border-accent"
              placeholder="e.g. redesign as dashboard, minimal-clean, no motion"
              value={magic}
              onChange={(e) => setMagic(e.target.value)}
              data-testid="input-magic"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
              onClick={() => void generate()}
              disabled={loading}
              data-testid="btn-generate"
            >
              {loading ? "Generating…" : generation === 0 ? "Generate from scratch" : "Redesign from features"}
            </button>
            <button
              type="button"
              className="rounded border border-border px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
              onClick={applyMagic}
              disabled={loading}
              data-testid="btn-magic"
            >
              Apply magic edit
            </button>
            <button
              type="button"
              className="rounded border border-border px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
              onClick={() => void copyHtml()}
              disabled={!result?.previewHtml || loading}
              data-testid="btn-copy-html"
            >
              {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy HTML"}
            </button>
          </div>

          {error ? (
            <p className="text-sm text-drift" data-testid="studio-error">
              {error}
            </p>
          ) : null}

          {result?.spec ? (
            <div className="space-y-2 border-t border-border pt-3 text-xs text-secondary" data-testid="studio-meta">
              <p data-testid="meta-summary">
                <strong className="text-text">Summary:</strong> {result.spec.summary}
              </p>
              <p data-testid="meta-sitekind">
                <strong className="text-text">Site kind:</strong> {result.spec.brief.siteKind}
              </p>
              <p data-testid="meta-skills">
                <strong className="text-text">Routed skills:</strong> {result.spec.routedSkills.join(", ")}
              </p>
              <p data-testid="meta-sections">
                <strong className="text-text">Sections:</strong> {result.spec.sections.map((s) => s.kind).join(", ")}
              </p>
              <p data-testid="meta-direction">
                <strong className="text-text">Tell direction:</strong> {result.spec.tellDirectionId}
              </p>
              <p data-testid="meta-generation">
                <strong className="text-text">Generation:</strong> {generation}
              </p>
              <ul className="list-disc pl-4" data-testid="meta-hints">
                {result.spec.customizationHints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <section className="overflow-hidden rounded-card border border-border bg-surface" data-testid="studio-canvas">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2" data-testid="viewport-bar">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">Preview</p>
            <div className="flex gap-1">
              {(
                [
                  ["390", "Mobile"],
                  ["768", "Tablet"],
                  ["1280", "Desktop"],
                ] as const
              ).map(([w, label]) => (
                <button
                  key={w}
                  type="button"
                  className={`rounded px-2 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    viewport === w ? "bg-accent text-white" : "border border-border text-secondary hover:border-accent hover:text-accent"
                  }`}
                  onClick={() => setViewport(w)}
                  data-testid={`viewport-${w}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading ? <p className="p-4 text-sm text-secondary" data-testid="studio-loading">Generating…</p> : null}
          {result?.previewHtml ? (
            <div className="flex justify-center bg-bg p-3 md:p-4" data-testid="preview-stage">
              <iframe
                title="Design preview"
                srcDoc={result.previewHtml}
                className="h-[80vh] border border-border bg-surface shadow-card md:h-[calc(100vh-10rem)]"
                style={{ width: "100%", maxWidth: `${viewport}px` }}
                data-testid="studio-frame"
                data-generation={generation}
                data-viewport={viewport}
              />
            </div>
          ) : (
            <div className="flex h-[50vh] items-center justify-center text-sm text-secondary">Generate a design to preview</div>
          )}
        </section>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  testId?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-secondary">{label}</span>
      <select
        className="w-full rounded border border-border bg-bg px-2 py-1.5 text-text outline-none focus-visible:border-accent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
