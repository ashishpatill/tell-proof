/**
 * Phase 1 connective-tissue author — CTA / FAQ / proof for ordinary
 * saas-marketing + demos briefs (Freightlane · Willowvet · Scalehouse class).
 *
 * Contract mirrors `@tell/taste` engine.ts:
 *   deterministic facts in → optional model judgment → validate against facts →
 *   fall back to today's `copy.ts` lookups.
 *
 * Never rewrites headline, heroLede, eyebrows, palette, or tokens.
 * Never invents workflow/approve copy unless `hasApprovalWorkflowSignal`.
 * CI / no-key path stays on deterministic tables — missing Gemini must not fail.
 */
import { hasApprovalWorkflowSignal } from "./analyze";
import { ctaFor, lower, questions, riskReversal, sentence } from "./copy";
import type { DesignBrief, FeatureSpec } from "./types";

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
  "your",
  "that",
  "this",
  "into",
  "from",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "is",
  "are",
  "be",
  "it",
  "as",
  "so",
  "you",
  "we",
  "they",
  "their",
  "our",
  "who",
  "what",
  "how",
  "when",
  "does",
  "need",
  "before",
  "after",
  "than",
  "then",
  "also",
  "only",
  "not",
  "yes",
  "all",
]);

/** Compact, authoritative facts handed to the model — it must not contradict these. */
export interface ContentContext {
  productName: string;
  tagline: string;
  audience: string;
  businessGoal: DesignBrief["businessGoal"];
  siteKind: DesignBrief["siteKind"];
  features: Array<{ name: string; description: string; priority: FeatureSpec["priority"] }>;
  hasApprovalWorkflow: boolean;
  primaryCta?: string;
}

export type AuthoredCta = {
  primary: string;
  secondary: string;
  note: string;
  riskReversal: string;
};

export type AuthoredFaqItem = { title: string; body: string };

export type AuthoredWorkflowStage = {
  id: string;
  title: string;
  role: string;
};

/**
 * Proof connective tissue.
 * - Marquee: optional `claim` (board cells that already interpolate feature names stay).
 * - Workflow: `stages` + `gateCopy` only when the brief has approval language.
 */
export type AuthoredProof = {
  claim?: string;
  gateCopy?: string;
  stages?: AuthoredWorkflowStage[];
};

export type AuthoredConnectiveTissue = {
  cta: AuthoredCta;
  faq: AuthoredFaqItem[];
  proof: AuthoredProof;
  source: "gemini" | "deterministic";
};

/**
 * Phase 1 gate: ordinary saas-marketing / demos family only
 * (Freightlane · Willowvet · Scalehouse class). Not showcase approval products,
 * not corporate/fintech Method-B surfaces.
 */
export function isConnectiveAuthorEligible(brief: DesignBrief): boolean {
  return brief.siteKind === "saas-marketing" && brief.businessGoal === "demos";
}

export function contentContextFromBrief(brief: DesignBrief): ContentContext {
  return {
    productName: brief.productName,
    tagline: brief.tagline,
    audience: brief.audience,
    businessGoal: brief.businessGoal,
    siteKind: brief.siteKind,
    features: brief.features.map((f) => ({
      name: f.name,
      description: f.description,
      priority: f.priority,
    })),
    hasApprovalWorkflow: hasApprovalWorkflowSignal(brief),
    primaryCta: brief.primaryCta,
  };
}

/** Tokens from productName / tagline / features — validation vocabulary. */
export function briefFactTokens(ctx: ContentContext): Set<string> {
  const raw = [
    ctx.productName,
    ctx.tagline,
    ...ctx.features.flatMap((f) => [f.name, f.description]),
  ].join(" ");
  return new Set(
    raw
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOP.has(t)),
  );
}

export function sentenceSharesFactToken(text: string, tokens: Set<string>): boolean {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((t) => t.length >= 4 && tokens.has(t));
}

function nonEmpty(text: unknown, max = 280): string | null {
  if (typeof text !== "string") return null;
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 3 || t.length > max) return null;
  return t;
}

function checkFactLine(
  label: string,
  text: string | undefined,
  tokens: Set<string>,
): string | null {
  if (text === undefined) return null;
  const t = nonEmpty(text);
  if (!t) return `${label} missing or empty`;
  if (!sentenceSharesFactToken(t, tokens)) {
    return `${label} shares no token with productName/tagline/features`;
  }
  return null;
}

/**
 * Validate model-provided fields only. Deterministic `copy.ts` fallbacks are
 * trusted without this check (goal-keyed CTA scaffolding may lack brief tokens).
 * Returns null when the draft is trustworthy.
 */
export function contradictionReason(
  ctx: ContentContext,
  draft: Partial<AuthoredConnectiveTissue>,
): string | null {
  const tokens = briefFactTokens(ctx);
  if (!tokens.size) return "brief has no fact tokens to ground authored copy";

  if (draft.cta) {
    for (const [label, value] of [
      ["cta.primary", draft.cta.primary],
      ["cta.secondary", draft.cta.secondary],
      ["cta.note", draft.cta.note],
      ["cta.riskReversal", draft.cta.riskReversal],
    ] as const) {
      if (value === undefined) continue;
      const reason = checkFactLine(label, value, tokens);
      if (reason) return reason;
    }
  }

  if (draft.faq) {
    if (!draft.faq.length) return "faq empty";
    for (let i = 0; i < draft.faq.length; i++) {
      const item = draft.faq[i]!;
      const titleReason = checkFactLine(`faq[${i}].title`, item.title, tokens);
      if (titleReason) return titleReason;
      const bodyReason = checkFactLine(`faq[${i}].body`, item.body, tokens);
      if (bodyReason) return bodyReason;
    }
  }

  if (draft.proof?.claim !== undefined) {
    const reason = checkFactLine("proof.claim", draft.proof.claim, tokens);
    if (reason) return reason;
  }

  if (ctx.hasApprovalWorkflow) {
    if (draft.proof?.stages) {
      if (!draft.proof.stages.length) return "approval workflow brief missing proof.stages";
      for (let i = 0; i < draft.proof.stages.length; i++) {
        const stage = draft.proof.stages[i]!;
        const roleReason = checkFactLine(`proof.stages[${i}].role`, stage.role, tokens);
        if (roleReason) return roleReason;
        if (!nonEmpty(stage.title, 40) || !nonEmpty(stage.id, 40)) {
          return `proof.stages[${i}] missing id/title`;
        }
      }
    }
    if (draft.proof?.gateCopy !== undefined) {
      const reason = checkFactLine("proof.gateCopy", draft.proof.gateCopy, tokens);
      if (reason) return reason;
    }
  } else if (draft.proof?.stages?.length || draft.proof?.gateCopy) {
    return "invented workflow/gate copy without approval-language signal";
  }

  return null;
}

/** True when merged tissue differs from the deterministic copy.ts baseline. */
export function authoredDiffersFromFallback(
  authored: AuthoredConnectiveTissue,
  fallback: AuthoredConnectiveTissue,
): boolean {
  if (
    authored.cta.primary !== fallback.cta.primary ||
    authored.cta.secondary !== fallback.cta.secondary ||
    authored.cta.note !== fallback.cta.note ||
    authored.cta.riskReversal !== fallback.cta.riskReversal
  ) {
    return true;
  }
  if (authored.faq.length !== fallback.faq.length) return true;
  for (let i = 0; i < authored.faq.length; i++) {
    const a = authored.faq[i]!;
    const b = fallback.faq[i];
    if (!b || a.title !== b.title || a.body !== b.body) return true;
  }
  if ((authored.proof.claim ?? "") !== (fallback.proof.claim ?? "")) return true;
  if ((authored.proof.gateCopy ?? "") !== (fallback.proof.gateCopy ?? "")) return true;
  return false;
}

/** Clamp authored CTA note / stage role to schema-friendly lengths. */
function clampLine(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > 40 ? cut.slice(0, at) : cut).trim()}…`;
}

/** Goal-keyed CTA note grounded in the lead feature (tone from copy.ts, product from brief). */
function groundedCtaNote(brief: DesignBrief, goalNote: string): string {
  const lead = brief.features[0]?.name?.trim();
  if (!lead) return goalNote;
  const tone = lower(goalNote.replace(/[.!?]+$/, ""));
  return clampLine(sentence(`${lead} ships first — ${tone}`), 240);
}

/** Workflow stage roles grounded in declared feature names (approval-signal path only). */
function groundedWorkflowStages(brief: DesignBrief): AuthoredWorkflowStage[] {
  const features = brief.features;
  const nameAt = (i: number): string => {
    const f = features[i % Math.max(features.length, 1)];
    return f?.name?.trim() || "capability";
  };
  const role = (verb: string, featureName: string, tail: string): string =>
    clampLine(`${verb} ${featureName} — ${tail}`, 140);
  return [
    { id: "input", title: "Input", role: role("Capture", nameAt(0), "what the operator already knows") },
    { id: "process", title: "Process", role: role("Run", nameAt(1), "the declared mechanism, no magic") },
    { id: "draft", title: "Draft", role: role("Draft", nameAt(2), "a reviewable result") },
    { id: "review", title: "Review", role: role("Review", nameAt(3), "human edits before anything ships") },
    { id: "approve", title: "Approve", role: role("Approve", nameAt(4), "explicit gate, never auto-apply") },
  ];
}

/** Today's copy.ts lookups — offline-safe baseline for CI / no-key, grounded in brief features. */
export function deterministicAuthored(brief: DesignBrief): AuthoredConnectiveTissue {
  const cta = ctaFor(brief.businessGoal, brief.siteKind, brief.primaryCta);
  const faq = questions(brief, brief.features);
  const hasWorkflow = hasApprovalWorkflowSignal(brief);

  const proof: AuthoredProof = {};
  if (hasWorkflow) {
    proof.stages = groundedWorkflowStages(brief);
    proof.gateCopy = "Human approves before apply";
    proof.claim = sentence(
      `Five named states. Every panel traces to a declared capability — nothing invented for theatre`,
    );
  }
  // Marquee claim stays on pullQuote in sections when proof.claim is omitted —
  // board cells that interpolate feature names are never rewritten here.

  return {
    cta: {
      primary: cta.primary,
      secondary: cta.secondary,
      note: groundedCtaNote(brief, cta.note),
      riskReversal: riskReversal(brief),
    },
    faq,
    proof,
    source: "deterministic",
  };
}

export interface ContentAuthor {
  /** Author connective tissue for a brief. Never throws. */
  author(brief: DesignBrief): Promise<AuthoredConnectiveTissue>;
}

export class DeterministicContentAuthor implements ContentAuthor {
  async author(brief: DesignBrief): Promise<AuthoredConnectiveTissue> {
    return deterministicAuthored(brief);
  }
}

const SYSTEM_PROMPT = [
  "You author CTA, FAQ, and proof connective tissue for a SaaS marketing page.",
  "You are given deterministic brief facts you MUST NOT contradict.",
  "Every sentence MUST reuse at least one content word (≥4 letters) from productName, tagline, or feature names/descriptions.",
  "Do NOT rewrite the hero headline, hero lede, eyebrows, palette, or design tokens.",
  "Do NOT invent customers, percentages, compliance badges, or capabilities not in the brief.",
  "Do NOT invent draft/review/approve workflow copy unless hasApprovalWorkflow is true.",
  "CTA: primary, secondary, note, and riskReversal — specific to this product and audience.",
  "FAQ: 6–8 buyer objections about scope, sequencing, limits, risk — not a feature catalogue reprint.",
  "Proof: when hasApprovalWorkflow, author five workflow stage roles + gateCopy + claim;",
  "otherwise author only an optional marquee claim (feature board cells stay as-is).",
  "Respond ONLY with minified JSON matching:",
  '{"cta":{"primary":"..","secondary":"..","note":"..","riskReversal":".."},',
  '"faq":[{"title":"..","body":".."}],',
  '"proof":{"claim"?: "..","gateCopy"?: "..","stages"?: [{"id":"..","title":"..","role":".."}]}}',
].join(" ");

export interface GeminiAuthorConfig {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export class GeminiContentAuthor implements ContentAuthor {
  private readonly model: string;
  private readonly doFetch: typeof fetch;

  constructor(private readonly cfg: GeminiAuthorConfig) {
    this.model = cfg.model ?? "gemini-2.0-flash";
    this.doFetch = cfg.fetchImpl ?? fetch;
  }

  async author(brief: DesignBrief): Promise<AuthoredConnectiveTissue> {
    const fallback = deterministicAuthored(brief);
    if (!isConnectiveAuthorEligible(brief)) return fallback;

    const ctx = contentContextFromBrief(brief);
    const draft = await this.ask(ctx);
    if (draft) {
      const reason = contradictionReason(ctx, draft);
      if (!reason) {
        const merged = mergeWithFallback(draft, fallback, ctx);
        if (authoredDiffersFromFallback(merged, fallback)) {
          return { ...merged, source: "gemini" };
        }
        return fallback;
      }
      const refined = await this.ask(ctx, reason);
      if (refined && !contradictionReason(ctx, refined)) {
        const merged2 = mergeWithFallback(refined, fallback, ctx);
        if (authoredDiffersFromFallback(merged2, fallback)) {
          return { ...merged2, source: "gemini" };
        }
      }
    }
    return fallback;
  }

  private async ask(
    ctx: ContentContext,
    contradiction?: string,
  ): Promise<Partial<AuthoredConnectiveTissue> | null> {
    const userParts = [
      `Authoritative facts (do not contradict): ${JSON.stringify(ctx)}.`,
      contradiction
        ? `Your previous answer was rejected because: ${contradiction}. Correct it.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.cfg.apiKey}`;
      const res = await this.doFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userParts }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      return parseAuthorJson(stripFences(text));
    } catch {
      return null;
    }
  }
}

/**
 * Field-level merge: keep model text only when it shares a brief fact token;
 * otherwise keep the deterministic fallback for that field.
 */
export function mergeWithFallback(
  draft: Partial<AuthoredConnectiveTissue>,
  fallback: AuthoredConnectiveTissue,
  ctx: ContentContext,
): AuthoredConnectiveTissue {
  const tokens = briefFactTokens(ctx);
  const pick = (candidate: string | undefined, base: string): string => {
    const t = nonEmpty(candidate);
    if (!t) return base;
    return sentenceSharesFactToken(t, tokens) ? t : base;
  };

  const ctaDraft = draft.cta;
  const cta: AuthoredCta = {
    primary: pick(ctaDraft?.primary, fallback.cta.primary),
    secondary: pick(ctaDraft?.secondary, fallback.cta.secondary),
    note: pick(ctaDraft?.note, fallback.cta.note),
    riskReversal: pick(ctaDraft?.riskReversal, fallback.cta.riskReversal),
  };

  let faq = fallback.faq;
  if (Array.isArray(draft.faq) && draft.faq.length >= 4) {
    const mapped: AuthoredFaqItem[] = [];
    let ok = true;
    for (const item of draft.faq) {
      const title = nonEmpty(item?.title, 160);
      const body = nonEmpty(item?.body, 400);
      if (!title || !body || !sentenceSharesFactToken(title, tokens) || !sentenceSharesFactToken(body, tokens)) {
        ok = false;
        break;
      }
      mapped.push({ title, body: sentence(body) });
    }
    if (ok && mapped.length) faq = mapped;
  }

  const proof: AuthoredProof = { ...fallback.proof };
  if (!ctx.hasApprovalWorkflow) {
    delete proof.stages;
    delete proof.gateCopy;
    const claim = nonEmpty(draft.proof?.claim, 400);
    if (claim && sentenceSharesFactToken(claim, tokens)) {
      proof.claim = sentence(claim);
    } else if (draft.proof?.claim === undefined) {
      // leave claim unset so sections keep pullQuote
      delete proof.claim;
    }
  } else {
    const claim = nonEmpty(draft.proof?.claim, 400);
    if (claim && sentenceSharesFactToken(claim, tokens)) proof.claim = sentence(claim);
    const gate = nonEmpty(draft.proof?.gateCopy, 160);
    if (gate && sentenceSharesFactToken(gate, tokens)) proof.gateCopy = gate;
    if (Array.isArray(draft.proof?.stages) && draft.proof.stages.length === 5) {
      const stages: AuthoredWorkflowStage[] = [];
      let ok = true;
      for (const s of draft.proof.stages) {
        const id = nonEmpty(s?.id, 40);
        const title = nonEmpty(s?.title, 40);
        const role = nonEmpty(s?.role, 200);
        if (!id || !title || !role || !sentenceSharesFactToken(role, tokens)) {
          ok = false;
          break;
        }
        stages.push({ id, title, role });
      }
      if (ok) proof.stages = stages;
    }
  }

  return { cta, faq, proof, source: "gemini" };
}

function parseAuthorJson(text: string): Partial<AuthoredConnectiveTissue> | null {
  try {
    const parsed = JSON.parse(text) as Partial<AuthoredConnectiveTissue>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Pick a real author when an API key is supplied, else the deterministic one.
 * Callers pass `process.env.GEMINI_API_KEY` (kept out of this package so it
 * stays free of a Node env dependency and safe in any environment).
 */
export function createContentAuthor(
  apiKey?: string,
  opts: { fetchImpl?: typeof fetch; model?: string } = {},
): ContentAuthor {
  return apiKey
    ? new GeminiContentAuthor({ apiKey, fetchImpl: opts.fetchImpl, model: opts.model })
    : new DeterministicContentAuthor();
}

/**
 * Author connective tissue when the brief is Phase-1 eligible; otherwise
 * return deterministic copy.ts lookups. Never throws; never requires Gemini.
 */
export async function authorConnectiveTissue(
  briefInput: DesignBrief,
  opts: { apiKey?: string; author?: ContentAuthor; fetchImpl?: typeof fetch; model?: string } = {},
): Promise<AuthoredConnectiveTissue> {
  const brief = briefInput;
  if (!isConnectiveAuthorEligible(brief)) {
    return deterministicAuthored(brief);
  }
  const author = opts.author ?? createContentAuthor(opts.apiKey, {
    fetchImpl: opts.fetchImpl,
    model: opts.model,
  });
  return author.author(brief);
}
