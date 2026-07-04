import { ArtDirection, Finding, TasteVerdict } from "@tell/schema";

export const DIRECTION_PRESETS = {
  editorial: {
    id: "editorial-warm",
    label: "Editorial warm",
    keywords: ["warm", "editorial", "less shadow", "serif"],
    tokenOverrides: {
      "--font-display": "Instrument Serif",
      "--accent": "#D4714A",
      "--radius-card": "16px",
      "--shadow-card": "0 2px 8px rgba(0,0,0,.25)",
    },
    summary: "Warm paper tones, serif headlines, restrained depth.",
  },
  precision: {
    id: "precision-instrument",
    label: "Precision instrument",
    keywords: ["precise", "instrument", "measured", "mono"],
    tokenOverrides: {
      "--font-display": "IBM Plex Mono",
      "--accent": "#C4A035",
      "--radius-card": "4px",
      "--shadow-card": "none",
    },
    summary: "Measured spacing, sharper radius, data-forward surfaces.",
  },
  "warm-minimal": {
    id: "warm-minimal",
    label: "Warm minimal",
    keywords: ["warm", "minimal", "quiet"],
    tokenOverrides: {
      "--font-display": "Instrument Serif",
      "--accent": "#B85A32",
      "--radius-card": "8px",
      "--shadow-card": "none",
    },
    summary: "Quieter surfaces with one human accent.",
  },
  "bold-contrast": {
    id: "bold-contrast",
    label: "Bold contrast",
    keywords: ["bold", "contrast", "memorable"],
    tokenOverrides: {
      "--font-display": "Instrument Serif",
      "--accent": "#E8926F",
      "--radius-card": "2px",
      "--shadow-card": "0 12px 40px rgba(0,0,0,.45)",
    },
    summary: "Stronger hierarchy and sharper editorial contrast.",
  },
} satisfies Record<string, ArtDirection>;

export function classifyFinding(finding: Finding): TasteVerdict {
  return TasteVerdict.parse({
    findingId: finding.id,
    verdict: finding.verdictHint,
    confidence: finding.severity === "high" ? 0.84 : 0.72,
    rationale: rationaleFor(finding),
    intentionalReason: finding.verdictHint === "intentional" ? "The pattern is documented as a deliberate art direction." : undefined,
  });
}

export function classifyFindings(findings: Finding[]): TasteVerdict[] {
  return findings.map(classifyFinding);
}

export function parseDirection(input: string): ArtDirection {
  const normalized = input.toLowerCase();
  if (normalized.includes("precision") || normalized.includes("instrument")) return ArtDirection.parse(DIRECTION_PRESETS.precision);
  if (normalized.includes("minimal")) return ArtDirection.parse(DIRECTION_PRESETS["warm-minimal"]);
  if (normalized.includes("bold") || normalized.includes("contrast")) return ArtDirection.parse(DIRECTION_PRESETS["bold-contrast"]);
  return ArtDirection.parse(DIRECTION_PRESETS.editorial);
}

function rationaleFor(finding: Finding): string {
  const detector = String(finding.detector);
  if (finding.verdictHint === "generic") {
    return `${detector} matches a common AI-built UI tell. The evidence is rendered, not guessed, so the fix can target the surface users actually see.`;
  }
  if (finding.verdictHint === "drift") {
    return `${detector} found a split in the visual system. Normalize it into one semantic treatment before future agent edits widen the fracture.`;
  }
  return `${detector} looks deliberate in context. Keep it if this is part of the product's stated direction.`;
}
