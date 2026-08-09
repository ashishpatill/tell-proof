/**
 * Offering catalog — depth-first, research-backed.
 *
 * Templates are the horizontal surface of the product: one per site kind we have measured against
 * the expert corpus. Studio and MCP name offerings from this list.
 *
 *   Source of truth for QUALITY:  design-research-loop → LOOP_LEDGER → docs/10_DESIGN_EVIDENCE.md
 *   Source of truth for PLUMBING: basics-checklist.ts (implementation floors only)
 *
 * Open-source design builders are not used to invent or restyle these offerings. They are used
 * only when the engine is stuck on a working detail (landmarks, focus, stacking, token emission)
 * that those builders already solved as engineering.
 *
 * Expansion rule: add an offering only when a measured demand gap appears that no current kind
 * covers (e.g. fintech inverse/bleed rhythm ≠ SaaS conversion). Then deepen via the research loop.
 */

import { DesignBrief, type SiteKind } from "./types";

export type TemplateKey =
  | "saas"
  | "dashboard"
  | "corporate"
  | "educational"
  | "fintech"
  | "studio"
  | "consumer"
  | "foundry"
  | "dossier"
  | "observatory"
  | "archive"
  | "loom"
  | "herbarium"
  | "press"
  | "lantern";

export interface DesignTemplate {
  /** Stable key used by /showcase/*, /studio presets, and GET /api/design?showcase= */
  key: TemplateKey;
  label: string;
  /** One-line market job — why this offering exists, not how it looks. */
  marketJob: string;
  siteKind: SiteKind;
  /**
   * Research notes that justify keeping this offering in the catalog.
   * Updated when the design-research loop changes what "good" means for this kind.
   */
  researchBasis: string;
  brief: DesignBrief;
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    key: "saas",
    label: "SaaS conversion",
    marketJob:
      "Demo-booking landing for B2B teams — one primary conversion path, feature-grounded proof.",
    siteKind: "saas-marketing",
    researchBasis:
      "Calibrated against premium-b2b-saas, art-directed-studio, fintech-product, brand-agency, and personal-craft corridors (fold figure ~0.7–1.0, page figure ~0.4+, dense bleeds/layers; craft sites for alignment axes). Locked craft: spanning product fold for every SaaS lean, interactive workflow-proof stage (sample path + human approve gate), spined sequence with large capability marks — deepen uniqueness; no lonely pullquote voids, sparse bento airways, or chromatic page floods.",
    brief: DesignBrief.parse({
      productName: "Northstar",
      tagline: "Know which accounts are moving before the forecast call",
      audience: "revenue leaders at B2B software companies",
      businessGoal: "demos",
      siteKind: "saas-marketing",
      lockSiteKind: true,
      features: [
        {
          id: "f1",
          name: "Account scoring",
          description: "Ranks every account by fit and live intent, so the top of the list is the list worth working",
          priority: "p0",
        },
        {
          id: "f2",
          name: "Pipeline coaching",
          description: "Flags deals that have gone quiet and names the next action that unsticks them",
          priority: "p0",
        },
        {
          id: "f3",
          name: "CRM sync",
          description: "Writes back to your system of record both ways, so nobody keeps a second spreadsheet",
          priority: "p1",
        },
        {
          id: "f4",
          name: "Executive digest",
          description: "A weekly narrative leadership actually reads instead of a dashboard they never open",
          priority: "p1",
        },
        {
          id: "f5",
          name: "Territory modelling",
          description: "Test a coverage change against last year's pipeline before you announce it",
          priority: "p2",
        },
      ],
      taste: { aestheticLean: "conversion-sharp", motion: "light-scroll-reveals", colorMood: "neutral-professional" },
    }),
  },
  {
    key: "dashboard",
    label: "Operator console",
    marketJob:
      "Daily workspace for operators — dense shell, priority queue, empty states included.",
    siteKind: "dashboard-webapp",
    researchBasis:
      "Calibrated against design-tool / enterprise-observability density bands; system-crafted + dark-premium.",
    brief: DesignBrief.parse({
      productName: "Queueboard",
      tagline: "The seller workspace",
      audience: "account executives",
      businessGoal: "activation",
      siteKind: "dashboard-webapp",
      lockSiteKind: true,
      features: [
        {
          id: "d1",
          name: "Priority queue",
          description: "Today's accounts ranked by what changed overnight, not by alphabetical order",
          priority: "p0",
        },
        {
          id: "d2",
          name: "Deal room",
          description: "Context, stakeholders, and open risks for one deal on a single surface",
          priority: "p0",
        },
        {
          id: "d3",
          name: "Playbooks",
          description: "Guided steps for the motions your team already wins with",
          priority: "p1",
        },
        {
          id: "d4",
          name: "Activity feed",
          description: "Signals from email and the CRM, filtered to the ones that change a decision",
          priority: "p1",
        },
        {
          id: "d5",
          name: "Handoff notes",
          description: "State of an account written down automatically when ownership changes",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "system-crafted",
        density: "information-rich",
        motion: "subtle-micro",
        roundingDepth: "sharp",
        colorMood: "dark-premium",
      },
    }),
  },
  {
    key: "corporate",
    label: "Trust narrative",
    marketJob:
      "Enterprise credibility page — editorial story and measured outcomes for long sales cycles.",
    siteKind: "corporate-story",
    researchBasis:
      "Calibrated against enterprise-corporate / art-directed-studio bands; refined-story lean.",
    brief: DesignBrief.parse({
      productName: "Lattice",
      tagline: "Clarity for teams that sell complexity",
      audience: "enterprise operators and their boards",
      businessGoal: "trust",
      siteKind: "corporate-story",
      lockSiteKind: true,
      features: [
        {
          id: "c1",
          name: "One visual language",
          description: "A single system across product, sales material, and the contract you sign",
          priority: "p0",
        },
        {
          id: "c2",
          name: "Operating principles",
          description: "How decisions get made here, written down before you have to test them",
          priority: "p0",
        },
        {
          id: "c3",
          name: "Measured outcomes",
          description: "Results reported with their denominators, including the ones that did not move",
          priority: "p1",
        },
        {
          id: "c4",
          name: "Security posture",
          description: "Where data lives, who can reach it, and what happens when someone leaves",
          priority: "p1",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "soft-brand-accent",
        typographyWeight: "light-elegant",
      },
    }),
  },
  {
    key: "educational",
    label: "Mechanism explainer",
    marketJob:
      "Technical evaluation doc — scrubbable figure and chapter narrative for architecture decisions.",
    siteKind: "docs-educational",
    researchBasis:
      "Calibrated against docs-product / design-system-docs bands; minimal-clean teaching surface.",
    brief: DesignBrief.parse({
      productName: "Signal Path",
      tagline: "How the routing layer actually decides",
      audience: "engineers evaluating the runtime",
      businessGoal: "trust",
      siteKind: "docs-educational",
      lockSiteKind: true,
      features: [
        {
          id: "e1",
          name: "Placement model",
          description: "The real cost function, including the fairness constraint most schedulers leave out",
          priority: "p0",
        },
        {
          id: "e2",
          name: "Preemption ladder",
          description: "What gets evicted first, and which guarantees survive an eviction",
          priority: "p0",
        },
        {
          id: "e3",
          name: "Backpressure",
          description: "How queue depth turns into admission decisions upstream of the scheduler",
          priority: "p1",
        },
        {
          id: "e4",
          name: "Failure domains",
          description: "Spread rules, and what they cost you in packing efficiency",
          priority: "p1",
        },
      ],
      taste: { aestheticLean: "minimal-clean", density: "balanced", motion: "light-scroll-reveals", colorMood: "light-airy" },
    }),
  },
  {
    key: "fintech",
    label: "Fintech trust",
    marketJob:
      "Money-product landing — inverse-heavy proof, bleed product stages, conversion for treasury buyers.",
    siteKind: "fintech-marketing",
    researchBasis:
      "Calibrated against fintech-product corridors (invertedShare ~0.7, bleedBands ~13, fold figure ~0.88, accent used as stage not flood). Distinct from SaaS conversion: more inverse bands, specimen on inverse, denser metric register. Keep spanning product fold; deepen uniqueness without empty-height rhythm hacks.",
    brief: DesignBrief.parse({
      productName: "Clearwire",
      tagline: "Treasury that moves at the speed of the invoice",
      audience: "finance leads at mid-market companies running multi-entity cash",
      businessGoal: "demos",
      siteKind: "fintech-marketing",
      lockSiteKind: true,
      features: [
        {
          id: "t1",
          name: "Same-day wires",
          description: "Domestic wires that leave before the cut-off you can actually see, not the one in a PDF",
          priority: "p0",
        },
        {
          id: "t2",
          name: "Entity wallets",
          description: "Cash per entity with intercompany moves that post both ledgers in one action",
          priority: "p0",
        },
        {
          id: "t3",
          name: "Approval paths",
          description: "Thresholds and dual control enforced at send time, not discovered in the bank portal",
          priority: "p0",
        },
        {
          id: "t4",
          name: "FX at quote",
          description: "A locked rate on the payment screen so the P&L match is not a surprise tomorrow",
          priority: "p1",
        },
        {
          id: "t5",
          name: "Audit export",
          description: "Every send, approval, and fail as a package auditors open without a screenshare",
          priority: "p1",
        },
        {
          id: "t6",
          name: "Cash forecast",
          description: "Thirteen-week view built from open bills and scheduled pays, not a spreadsheet guess",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        density: "balanced",
        motion: "light-scroll-reveals",
        colorMood: "neutral-professional",
        typographyWeight: "bold-confident",
        roundingDepth: "soft",
      },
    }),
  },
  {
    key: "studio",
    label: "Art-directed studio",
    marketJob:
      "Selected-work studio landing — figure-owned fold, method narrative, paper-led proof for creative buyers.",
    siteKind: "art-directed-studio",
    researchBasis:
      "Calibrated against art-directed-studio corridors (foldFigure median 1.0, figureArea ~0.57, invertedShare ~0, display ~high corridor, alignment axes ~4). Distinct from SaaS/fintech: no pricing ladder, almost no inverse bands, selected-work alternating register + method figure + raised proof. Keep spanning overfigure fold; deepen uniqueness without empty-height rhythm hacks.",
    brief: DesignBrief.parse({
      productName: "Fieldmark",
      tagline: "Art direction that survives the handoff",
      audience: "brand and product leads hiring a studio for a system, not a deck",
      businessGoal: "trust",
      siteKind: "art-directed-studio",
      lockSiteKind: true,
      features: [
        {
          id: "s1",
          name: "Identity systems",
          description: "Type, colour, and motion rules that still hold when five vendors touch the brand",
          priority: "p0",
        },
        {
          id: "s2",
          name: "Product surfaces",
          description: "Interfaces composed as chapters of the same system, not a separate UI kit",
          priority: "p0",
        },
        {
          id: "s3",
          name: "Launch films",
          description: "Short motion pieces cut to the same grid the site and product already use",
          priority: "p0",
        },
        {
          id: "s4",
          name: "Editorial sites",
          description: "Marketing pages paced like print — tension, rest, and a real visual event",
          priority: "p1",
        },
        {
          id: "s5",
          name: "Handoff kits",
          description: "Tokens, specimens, and do-nots packaged so engineering does not invent a second brand",
          priority: "p1",
        },
        {
          id: "s6",
          name: "Critique loops",
          description: "Structured reviews that name the tell, not a vibe, before the next round of work",
          priority: "p2",
        },
      ],
      // Cool paper + restrained blue accent — avoids the cream/terracotta AI-default cluster.
      brandAccent: "#1F4B6E",
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "scroll-narrative",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "consumer",
    label: "Consumer craft",
    marketJob:
      "Voice-led consumer product landing — figure-dense story, short claim, conversion without SaaS theatre.",
    siteKind: "consumer-craft",
    researchBasis:
      "Calibrated against consumer-craft corridors (figureArea ~0.68, foldFigure ~0.73, invertedShare ~0, display ~3.2vw, many figures). Distinct from studio (smaller type, denser product plates) and SaaS (no pricing ladder, paper-led proof). Keep spanning product fold; deepen uniqueness without empty-height rhythm hacks.",
    brief: DesignBrief.parse({
      productName: "Harborline",
      tagline: "The everyday bag that earns its keep",
      audience: "people who carry work and weekend in the same bag",
      businessGoal: "sales",
      siteKind: "consumer-craft",
      lockSiteKind: true,
      brandAccent: "#0F5C4C",
      features: [
        {
          id: "v1",
          name: "One-bag day",
          description: "Laptop, shoes, and groceries without turning the bag into a suitcase",
          priority: "p0",
        },
        {
          id: "v2",
          name: "Quiet hardware",
          description: "Zips and pulls that do not announce themselves across a quiet room",
          priority: "p0",
        },
        {
          id: "v3",
          name: "Weather skin",
          description: "A finish that shrugs off rain without looking like outdoor gear",
          priority: "p0",
        },
        {
          id: "v4",
          name: "Repair path",
          description: "A zipper or strap replaced in weeks, not a whole bag written off",
          priority: "p1",
        },
        {
          id: "v5",
          name: "Carry modes",
          description: "Shoulder, crossbody, and hand — the strap changes, the silhouette does not",
          priority: "p1",
        },
        {
          id: "v6",
          name: "Pack map",
          description: "Pockets named for what goes in them, so unpacking is not a hunt",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "conversion-sharp",
        density: "balanced",
        motion: "scroll-narrative",
        colorMood: "neutral-professional",
        typographyWeight: "medium-modern",
        roundingDepth: "soft",
      },
    }),
  },
  {
    key: "foundry",
    label: "Editorial foundry",
    marketJob:
      "Type-craft / foundry landing — hard-seam fold, optical-size ladder, marginalia essay, colophon close.",
    siteKind: "editorial-foundry",
    researchBasis:
      "Calibrated against type-foundry + personal-craft + editorial-longform corridors (foldFigure ~0.97, figureArea ~0.38, invertedShare ~0, display ~3.3vw, alignment axes ~6). Distinct craft the theme-pack engines miss: hard vertical seam (paper claim | inverse ladder), sticky typographic spine, type-ladder figure, marginalia essay with full-bleed measure rules, paper colophon — no pricing, no metrics theatre, zero inverse bands.",
    brief: DesignBrief.parse({
      productName: "Glyph Press",
      tagline: "Faces cut for the sizes you actually set",
      audience: "art directors and editorial designers commissioning a text face",
      businessGoal: "trust",
      siteKind: "editorial-foundry",
      lockSiteKind: true,
      // Ink-led cool stock — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#1A3A4A",
      features: [
        {
          id: "g1",
          name: "Display cut",
          description: "Tight tracking and open counters that hold at poster size without going brittle",
          priority: "p0",
        },
        {
          id: "g2",
          name: "Text cut",
          description: "Optical size for long reading — ink traps and spacing tuned for 10–12 point",
          priority: "p0",
        },
        {
          id: "g3",
          name: "Caption cut",
          description: "A denser face for labels and footnotes that still matches the text colour",
          priority: "p0",
        },
        {
          id: "g4",
          name: "Italic mates",
          description: "True italics drawn as companions, not slanted romans with a costume change",
          priority: "p1",
        },
        {
          id: "g5",
          name: "Tabular figures",
          description: "Lining and oldstyle numerals that keep columns honest in tables and price lists",
          priority: "p1",
        },
        {
          id: "g6",
          name: "Language coverage",
          description: "Latin extended with the marks editorial work actually needs, not a checkbox dump",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "scroll-narrative",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "dossier",
    label: "Research dossier",
    marketJob:
      "Capital / research briefing landing — folio masthead, chapter rail, dossier plate, verso/recto footnotes, imprint.",
    siteKind: "research-dossier",
    researchBasis:
      "Calibrated against capital-brand + research-editorial + editorial-brand corridors (alignment axes ~6–8, spineConformity ~0.5–0.75, quiet display, dense bleeds, layered matter). Distinct craft theme packs miss: folio volume/issue masthead, sticky chapter rail, dossier-plate cartographic figure with pin callouts, verso/recto spread with footnote register, full-bleed accent rules, paper imprint — no pricing, no metrics theatre, zero inverse bands.",
    brief: DesignBrief.parse({
      productName: "Meridian Atlas",
      tagline: "Briefings that map conviction before the room decides",
      audience: "partners and principals at capital research desks",
      businessGoal: "trust",
      siteKind: "research-dossier",
      lockSiteKind: true,
      // Cool ink-led stock — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#243B55",
      features: [
        {
          id: "m1",
          name: "Thesis map",
          description: "A single plate that places every claim on a shared coordinate so the room argues the same terrain",
          priority: "p0",
        },
        {
          id: "m2",
          name: "Source rails",
          description: "Primary sources pinned to the claim they support, not buried in an appendix nobody opens",
          priority: "p0",
        },
        {
          id: "m3",
          name: "Caveat register",
          description: "Footnotes that travel with the reading — the limits of the brief stay visible while you decide",
          priority: "p0",
        },
        {
          id: "m4",
          name: "Scenario forks",
          description: "Two or three paths drawn on the same plate so a bull case cannot pretend the base case does not exist",
          priority: "p1",
        },
        {
          id: "m5",
          name: "Imprint trail",
          description: "Edition, authors, and revision stamped so a reused slide cannot orphan its provenance",
          priority: "p1",
        },
        {
          id: "m6",
          name: "Desk handoff",
          description: "A folio that survives the jump from analyst to partner without becoming a deck of orphan charts",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "observatory",
    label: "Signal observatory",
    marketJob:
      "Enterprise telemetry / on-call desk landing — chronometer fold, scrub rail, signal lattice, chrono essay, calibration close.",
    siteKind: "signal-observatory",
    researchBasis:
      "Calibrated against enterprise-observability + enterprise-data + award-index corridors (figureArea ~0.4–0.78, foldFigure ~0.23–0.57, alignment axes ~3–6, spineConformity ~0.2–0.8, quiet-to-moderate display, instrument-dense matter). Distinct craft theme packs miss: vertical chronometer ticks, sticky time-window scrub rail, signal-lattice amplitude figure with mono labels only, chrono essay with tick beads + outer time index, bleed rule + paper calibration close — no pricing, no metrics theatre, zero inverse bands.",
    brief: DesignBrief.parse({
      productName: "Nightglass",
      tagline: "The desk that keeps every channel under one live window",
      audience: "on-call leads and SRE desks at platform companies",
      businessGoal: "trust",
      siteKind: "signal-observatory",
      lockSiteKind: true,
      // Cool ink-led stock — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#1F4A45",
      features: [
        {
          id: "n1",
          name: "Live window",
          description: "A scrubbable time bracket that keeps the same channels under the eye while the incident moves",
          priority: "p0",
        },
        {
          id: "n2",
          name: "Channel lattice",
          description: "Amplitudes and status on a shared grid so a quiet service cannot hide beside a loud one",
          priority: "p0",
        },
        {
          id: "n3",
          name: "Threshold rails",
          description: "Limits that travel with the reading — the desk sees the floor before the page invents calm",
          priority: "p0",
        },
        {
          id: "n4",
          name: "Handoff beads",
          description: "Shift notes pinned to the minute they mattered, not buried in a chat nobody searches",
          priority: "p1",
        },
        {
          id: "n5",
          name: "Calibration strip",
          description: "Tolerance marks stamped on the close so a reused screenshot cannot orphan its scale",
          priority: "p1",
        },
        {
          id: "n6",
          name: "Desk memory",
          description: "A window that survives the jump from night lead to morning lead without becoming orphan charts",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "balanced",
        motion: "light-scroll-reveals",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "archive",
    label: "Archive index",
    marketJob:
      "Award / archive index landing — quiet register, A–Z alpha rail, index ledger, entry essay, Registry close.",
    siteKind: "archive-index",
    researchBasis:
      "Calibrated against award-index corridor (foldFigure ~0.54, figureArea ~0.58, invertedShare ~0, display ~1–3vw quiet, alignment axes ~3, spineConformity ~0.82, high ink variation). Distinct craft theme packs miss: hero-register with index owning the fold, sticky ds-alpha-rail A–Z letters, index-ledger multi-column ruled rows with mono ordinals ≤11px, story-entry hanging folio + ruled measure, paper Registry close — no pricing, no metrics theatre, zero inverse bands. Not SaaS, foundry, dossier, or observatory.",
    brief: DesignBrief.parse({
      productName: "Stamp Roll",
      tagline: "The index that keeps every entry under one quiet spine",
      audience: "archivists and editors maintaining a public award index",
      businessGoal: "trust",
      siteKind: "archive-index",
      lockSiteKind: true,
      // Cool ink-led stock — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#2A3340",
      features: [
        {
          id: "a1",
          name: "Alpha jump",
          description: "A sticky A–Z rail that lands you on the letter you need without scrolling the whole roll",
          priority: "p0",
        },
        {
          id: "a2",
          name: "Ruled ledger",
          description: "Multi-column entry rows with mono ordinals so density stays honest at a glance",
          priority: "p0",
        },
        {
          id: "a3",
          name: "Entry folio",
          description: "A single-entry reading with a hanging folio number and a ruled measure that does not drift",
          priority: "p0",
        },
        {
          id: "a4",
          name: "Cross stamps",
          description: "Cross-references that travel with the entry — related stamps stay visible while you read",
          priority: "p1",
        },
        {
          id: "a5",
          name: "Registry close",
          description: "Edition and custody stamped so a reused page cannot orphan its provenance",
          priority: "p1",
        },
        {
          id: "a6",
          name: "Quiet spine",
          description: "A register that survives the jump from browse to cite without becoming a search box costume",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "loom",
    label: "Commerce loom",
    marketJob:
      "Merchandising press landing — drawloom weft claim, size treadles, warp/weft photo cloth, hangtag essay, Care label close.",
    siteKind: "commerce-loom",
    researchBasis:
      "Calibrated against commerce-platform + brand-product-agency corridors (figure-forward, quiet-to-moderate display, low inverse). Distinct craft soft theme packs miss: claim-as-weft drawloom, bottom size treadles, loom-weave figure with copyright-free textile photo cells, hangtag essay with eyelet marks, paper Care label — no pricing, no metrics theatre, zero inverse bands, no glass card collage.",
    brief: DesignBrief.parse({
      productName: "Warp Desk",
      tagline: "The press that keeps every SKU under one honest weave",
      audience: "merchandisers and wholesale buyers cutting seasonal lines",
      businessGoal: "trust",
      siteKind: "commerce-loom",
      lockSiteKind: true,
      // Cool ink-led stock — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#3A4A3C",
      features: [
        {
          id: "l1",
          name: "Size treadles",
          description: "Bottom size treadles that land you on the fit window without a left sticky rail",
          priority: "p0",
        },
        {
          id: "l2",
          name: "Warp cells",
          description: "SKU cells woven on a shared loom so a quiet line cannot hide beside a loud one",
          priority: "p0",
        },
        {
          id: "l3",
          name: "Photo weft",
          description: "Copyright-free textile stock clipped into the weave — matter, not a lifestyle card grid",
          priority: "p0",
        },
        {
          id: "l4",
          name: "Hangtag notes",
          description: "Fit notes that travel with the reading — the limits of a cut stay visible while you decide",
          priority: "p1",
        },
        {
          id: "l5",
          name: "Care label",
          description: "Edition and care stamped so a reused page cannot orphan its provenance",
          priority: "p1",
        },
        {
          id: "l6",
          name: "Cut memory",
          description: "A loom that survives the jump from sample to order without becoming orphan cards",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "herbarium",
    label: "Field guide",
    marketJob:
      "Herbarium / voucher landing — glassine press, binomial strip, specimen plate with free botanical photos, range essay, Voucher close.",
    siteKind: "field-guide",
    researchBasis:
      "Calibrated against personal-craft + brand-agency + consumer-craft corridors (high figureArea, quiet display, paper-led). Distinct craft soft theme packs miss: glassine press with peeled sheet + museum label, bottom binomial strip, specimen-plate with pressed silhouette + copyright-free botanical inset, range essay with distribution beads, paper Voucher close — no pricing, no metrics theatre, zero inverse bands, no floating glass collage.",
    brief: DesignBrief.parse({
      productName: "Vellum Press",
      tagline: "The voucher that keeps every trait under one honest plate",
      audience: "naturalists and editors maintaining a public field guide",
      businessGoal: "trust",
      siteKind: "field-guide",
      lockSiteKind: true,
      // Cool ink-led stock — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#2F4538",
      features: [
        {
          id: "h1",
          name: "Binomial strip",
          description: "Kingdom→Species treadles under the press so ranks stay reachable without a left sticky rail",
          priority: "p0",
        },
        {
          id: "h2",
          name: "Pressed plate",
          description: "A specimen silhouette with pin marks so the voucher reads as collected matter, not stock art",
          priority: "p0",
        },
        {
          id: "h3",
          name: "Photo inset",
          description: "Copyright-free botanical stock clipped into the voucher window — evidence, not a card collage",
          priority: "p0",
        },
        {
          id: "h4",
          name: "Range beads",
          description: "Distribution notes that travel with the reading — west-to-east ticks stay visible while you decide",
          priority: "p1",
        },
        {
          id: "h5",
          name: "Voucher close",
          description: "Edition and custody stamped so a reused page cannot orphan its provenance",
          priority: "p1",
        },
        {
          id: "h6",
          name: "Plate memory",
          description: "A voucher that survives the jump from field to desk without becoming orphan photos",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "light-scroll-reveals",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "press",
    label: "Press atelier",
    marketJob:
      "Brand / production pressroom landing — registration fold, signature rail, press sheet, gather essay, Pressroom close.",
    siteKind: "press-atelier",
    researchBasis:
      "Calibrated against brand-agency + brand-product-agency + editorial-longform corridors (foldFigure ~0.9–1.0, figureArea ~0.4–0.52, invertedShare ~0, display ~1.5–3.8vw, alignment axes ~3–6, dense bleeds). Distinct craft theme packs miss: hero-press with registration/crop marks, sticky ds-sig-rail Sig A–H, press-sheet imposition grid with densitometer strip and mono plate labels ≤11px, story-gather with fold ticks, paper Pressroom close — no pricing, no metrics theatre, zero inverse bands. Not SaaS, foundry, dossier, observatory, or archive.",
    brief: DesignBrief.parse({
      productName: "Forme Desk",
      tagline: "The pressroom that keeps every signature under one forme",
      audience: "production leads and brand studios running print and digital formes",
      businessGoal: "trust",
      siteKind: "press-atelier",
      lockSiteKind: true,
      // Cool steel ink — escapes cream/terracotta and violet AI clusters.
      brandAccent: "#1E3A4C",
      features: [
        {
          id: "p1",
          name: "Registration lock",
          description: "Crop and registration marks that keep every plate aligned before ink hits the sheet",
          priority: "p0",
        },
        {
          id: "p2",
          name: "Imposition sheet",
          description: "A spanning press sheet that shows signature folds and page numbers at a glance",
          priority: "p0",
        },
        {
          id: "p3",
          name: "Signature rail",
          description: "A sticky Sig A–H rail that jumps the forme without losing the gather",
          priority: "p0",
        },
        {
          id: "p4",
          name: "Densitometer strip",
          description: "Ink density marks that stay honest when a proof drifts off the approved forme",
          priority: "p1",
        },
        {
          id: "p5",
          name: "Gather essay",
          description: "A folded-signature reading with outer plate ticks so the gather stays citeable",
          priority: "p1",
        },
        {
          id: "p6",
          name: "Pressroom close",
          description: "Plate numbers and custody stamped so a reused forme cannot orphan its edition",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "scroll-narrative",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },
  {
    key: "lantern",
    label: "Lantern path",
    marketJob:
      "Cinematic night-walk landing — chapter waypoints, path cartograph fold, silhouette near-plane, ember essay, Ember close.",
    siteKind: "lantern-path",
    researchBasis:
      "Calibrated against art-directed-studio + editorial-longform + personal-craft corridors (foldFigure high, figureArea ~0.4–0.7, invertedShare ~0, quiet-moderate display, dense plate matter). Distinct craft theme packs and soft dark glow pages miss: hero-path with sticky ds-way-rail Ch I–V, path-plate night cartograph (elevation + lantern waypoints + silhouette matter, data-dense=ink, mono ≤11px), story-ember bead essay, paper Ember close — no pricing, no metrics theatre, zero inverse bands. Not WebGL tourism chrome, not press/archive/loom.",
    brief: DesignBrief.parse({
      productName: "Ember Gate",
      tagline: "The atlas that keeps every night path under one reading",
      audience: "editors and founders staging a cinematic multi-chapter walk",
      businessGoal: "trust",
      siteKind: "lantern-path",
      lockSiteKind: true,
      // Warm amber lantern — escapes violet glow and cream/terracotta AI clusters.
      brandAccent: "#B86B2E",
      features: [
        {
          id: "n1",
          name: "Chapter waypoints",
          description: "Five sticky chapter marks that keep the walk citeable without a dark SaaS sidebar",
          priority: "p0",
        },
        {
          id: "n2",
          name: "Path cartograph",
          description: "A spanning night atlas with elevation, lanterns, and silhouette matter owning the fold",
          priority: "p0",
        },
        {
          id: "n3",
          name: "Lantern markers",
          description: "Waypoint beacons that light each chapter without decorative bloom stacks",
          priority: "p0",
        },
        {
          id: "n4",
          name: "Silhouette near-plane",
          description: "Pinned foreground silhouettes that hand off between chapters without orphan layers",
          priority: "p1",
        },
        {
          id: "n5",
          name: "Ember essay",
          description: "A bead-ticked reading so the afterlight stays citeable while you decide",
          priority: "p1",
        },
        {
          id: "n6",
          name: "Ember close",
          description: "Chapter custody stamped so a reused walk cannot orphan its edition",
          priority: "p2",
        },
      ],
      taste: {
        aestheticLean: "refined-story",
        density: "sparse",
        motion: "immersive",
        colorMood: "light-airy",
        typographyWeight: "light-elegant",
        roundingDepth: "sharp",
      },
    }),
  },

];

const BY_KEY = Object.fromEntries(DESIGN_TEMPLATES.map((t) => [t.key, t])) as Record<
  TemplateKey,
  DesignTemplate
>;

export function getTemplate(key: string): DesignTemplate | undefined {
  return Object.prototype.hasOwnProperty.call(BY_KEY, key) ? BY_KEY[key as TemplateKey] : undefined;
}

export function listTemplates(): DesignTemplate[] {
  return DESIGN_TEMPLATES.slice();
}

/** Studio / API form of a template — features as editable lines, taste flattened. */
export function templateToStudioPreset(key: TemplateKey) {
  const t = BY_KEY[key]!;
  const taste = t.brief.taste ?? {};
  return {
    key: t.key,
    label: t.label,
    marketJob: t.marketJob,
    productName: t.brief.productName,
    tagline: t.brief.tagline,
    audience: t.brief.audience,
    siteKind: t.siteKind,
    businessGoal: t.brief.businessGoal,
    featuresText: t.brief.features
      .map((f) => `${f.name} — ${f.description}`)
      .join("\n"),
    aestheticLean: taste.aestheticLean ?? "conversion-sharp",
    motion: taste.motion ?? "subtle-micro",
    density: taste.density ?? "balanced",
    colorMood: taste.colorMood ?? "neutral-professional",
    typographyWeight: taste.typographyWeight ?? "medium-modern",
    roundingDepth: taste.roundingDepth ?? "soft",
  };
}

/**
 * Backward-compatible map used by showcase routes and existing tests.
 * Prefer `getTemplate(key).brief` in new code.
 */
export const SHOWCASE_BRIEFS: Record<string, DesignBrief> = Object.fromEntries(
  DESIGN_TEMPLATES.map((t) => [t.key, t.brief]),
);
