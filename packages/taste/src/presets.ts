import { ArtDirection } from "@tell/schema";

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
