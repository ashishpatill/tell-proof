import { z } from "zod";

export const IntentScenario = z.enum([
  "diagnose-url",
  "diagnose-github",
  "studio-brief",
  "voice-direct",
  "proof-verify",
  "matrix-scan",
  "mcp-setup",
  "dogfood",
]);
export type IntentScenario = z.infer<typeof IntentScenario>;

/** Aligns with design-skills `SiteKind` for studio-brief defaults. */
export const IntentSiteKind = z.enum([
  "saas-marketing",
  "dashboard-webapp",
  "corporate-story",
  "docs-educational",
]);
export type IntentSiteKind = z.infer<typeof IntentSiteKind>;

export const ResolvedIntentDefaults = z.object({
  url: z.string().optional(),
  routes: z.array(z.string()).optional(),
  siteKind: IntentSiteKind.optional(),
  templateKey: z.string().optional(),
  direction: z.string().optional(),
});
export type ResolvedIntentDefaults = z.infer<typeof ResolvedIntentDefaults>;

export const ResolvedIntent = z.object({
  scenario: IntentScenario,
  defaults: ResolvedIntentDefaults,
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});
export type ResolvedIntent = z.infer<typeof ResolvedIntent>;

export type ResolveIntentOptions = {
  /** Offline demo URL when input is not URL-like. */
  fixtureUrl?: string;
};

const DEFAULT_FIXTURE = "http://localhost:3001";

const URL_RE = /https?:\/\/[^\s<>"')]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/i;
const DOMAIN_RE = /(?:^|\s)((?:[\w-]+\.)+[a-z]{2,})(?:\/[^\s]*)?/i;

const VOICE_KEYWORDS = /\b(warmer|editorial|less shadow|more contrast|precision|minimal|luxury|brutalist)\b/i;
const MATRIX_KEYWORDS = /\b(pricing|matrix|scenario matrix|multi-?page)\b/i;
const MCP_KEYWORDS = /\b(mcp|install|cursor)\b/i;
const STUDIO_KEYWORDS = /\b(studio|design from features|design-from-features|brief)\b/i;
const PROOF_KEYWORDS = /\b(proof|verify patch|proof verify|proof-verify)\b/i;
const DOGFOOD_KEYWORDS = /\bdogfood\b/i;

function extractUrl(text: string): string | undefined {
  const http = text.match(URL_RE)?.[0];
  if (http) return http.replace(/[.,;]+$/, "");
  const gh = text.match(GITHUB_RE)?.[0];
  if (gh) return gh.startsWith("http") ? gh : `https://${gh}`;
  const domain = text.match(DOMAIN_RE);
  if (domain?.[1] && !domain[1].includes("github.com")) {
    const path = domain[0].trim();
    return path.startsWith("http") ? path : `https://${path}`;
  }
  return undefined;
}

function extractGithubRepo(text: string): string | undefined {
  const match = text.match(GITHUB_RE)?.[0];
  if (!match) return undefined;
  return match.startsWith("http") ? match : `https://${match}`;
}

function extractRoutes(text: string): string[] | undefined {
  const routes = new Set<string>();
  for (const m of text.matchAll(/\/[\w-]+/g)) {
    const route = m[0];
    if (route.length > 1) routes.add(route);
  }
  if (/\bpricing\b/i.test(text)) routes.add("/pricing");
  if (/\baccount\b/i.test(text)) routes.add("/account");
  if (routes.size) return [...routes];
  if (/\bpricing\b/i.test(text)) return ["/", "/pricing"];
  if (/\bmatrix\b/i.test(text)) return ["/", "/pricing", "/account"];
  return undefined;
}

function inferSiteKind(text: string): IntentSiteKind | undefined {
  if (/\b(dashboard|webapp|app ui)\b/i.test(text)) return "dashboard-webapp";
  if (/\b(corporate|story|brand)\b/i.test(text)) return "corporate-story";
  if (/\b(docs|educational|documentation)\b/i.test(text)) return "docs-educational";
  if (/\b(saas|marketing|landing)\b/i.test(text)) return "saas-marketing";
  return undefined;
}

/**
 * Deterministic keyword/heuristic intent resolver (no LLM).
 * Shared by web CaptureBar suggestions, MCP `tell_resolve_intent`, and CLI `tell resolve`.
 */
export function resolveIntent(text: string, options: ResolveIntentOptions = {}): ResolvedIntent {
  const trimmed = text.trim();
  const fixtureUrl = options.fixtureUrl ?? DEFAULT_FIXTURE;
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return ResolvedIntent.parse({
      scenario: "diagnose-url",
      defaults: { url: fixtureUrl },
      confidence: 0.5,
      rationale: "Empty input — defaulting to the offline fixture URL so capture still works.",
    });
  }

  if (DOGFOOD_KEYWORDS.test(lower)) {
    return ResolvedIntent.parse({
      scenario: "dogfood",
      defaults: { url: fixtureUrl },
      confidence: 0.92,
      rationale: "You asked to dogfood — scan Tell's own UI against the detector rules.",
    });
  }

  if (MCP_KEYWORDS.test(lower) && /\b(setup|install|connect|configure|add)\b/i.test(lower)) {
    return ResolvedIntent.parse({
      scenario: "mcp-setup",
      defaults: {},
      confidence: 0.9,
      rationale: "Sounds like MCP install — fetch install-info and wire Tell into your agent.",
    });
  }

  const github = extractGithubRepo(trimmed);
  if (github || /\bgithub\.com\b/i.test(trimmed)) {
    return ResolvedIntent.parse({
      scenario: "diagnose-github",
      defaults: { url: github ?? trimmed },
      confidence: github ? 0.95 : 0.8,
      rationale: "GitHub repo detected — clone, boot localhost, then diagnose the rendered UI.",
    });
  }

  if (MATRIX_KEYWORDS.test(lower)) {
    const routes = extractRoutes(trimmed);
    const url = extractUrl(trimmed) ?? fixtureUrl;
    return ResolvedIntent.parse({
      scenario: "matrix-scan",
      defaults: { url, routes },
      confidence: 0.88,
      rationale: "Pricing or matrix language — run a route × viewport scenario scan for drift.",
    });
  }

  if (VOICE_KEYWORDS.test(lower)) {
    return ResolvedIntent.parse({
      scenario: "voice-direct",
      defaults: { direction: trimmed },
      confidence: 0.86,
      rationale: "Art-direction cues — parse this into action items before you reconcile.",
    });
  }

  if (STUDIO_KEYWORDS.test(lower)) {
    return ResolvedIntent.parse({
      scenario: "studio-brief",
      defaults: { siteKind: inferSiteKind(trimmed) },
      confidence: 0.84,
      rationale: "Studio or feature-brief language — open the design-from-features flow.",
    });
  }

  if (PROOF_KEYWORDS.test(lower)) {
    const url = extractUrl(trimmed) ?? fixtureUrl;
    return ResolvedIntent.parse({
      scenario: "proof-verify",
      defaults: { url },
      confidence: 0.82,
      rationale: "Proof language — verify a patch against a live recapture, not vibes.",
    });
  }

  const url = extractUrl(trimmed);
  if (url) {
    return ResolvedIntent.parse({
      scenario: "diagnose-url",
      defaults: { url },
      confidence: 0.9,
      rationale: "URL detected — capture the rendered page and name the generic tells.",
    });
  }

  return ResolvedIntent.parse({
    scenario: "diagnose-url",
    defaults: { url: fixtureUrl },
    confidence: 0.55,
    rationale: "No strong scenario keyword — defaulting to the fixture URL for a reliable demo capture.",
  });
}
