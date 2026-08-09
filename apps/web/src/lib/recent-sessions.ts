import { z } from "zod";

export const RECENT_SESSIONS_KEY = "tell:recent-sessions";
const MAX_RECENT = 12;

export const ComposerMode = z.enum(["design", "url", "github", "offline"]);
export type ComposerMode = z.infer<typeof ComposerMode>;

export const RecentSession = z.object({
  id: z.string(),
  title: z.string(),
  mode: ComposerMode,
  url: z.string().optional(),
  brief: z.string().optional(),
  findingCount: z.number().int().nonnegative().optional(),
  live: z.boolean().optional(),
  /** Compact JPEG/SVG data URL — craft beat for recent strip (never empty chrome). */
  thumbDataUrl: z.string().optional(),
  updatedAt: z.string(),
});
export type RecentSession = z.infer<typeof RecentSession>;

export function loadRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = z.array(RecentSession).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function upsertRecentSession(entry: RecentSession): RecentSession[] {
  const next = [entry, ...loadRecentSessions().filter((s) => s.id !== entry.id)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
  } catch {
    // Quota: drop thumbs from older entries and retry once.
    try {
      const slim = next.map((s, i) => (i === 0 ? s : { ...s, thumbDataUrl: undefined }));
      localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(slim));
      return slim;
    } catch {
      /* storage unavailable */
    }
  }
  return next;
}

export function sessionTitleFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "Capture";
  } catch {
    return url.slice(0, 40) || "Capture";
  }
}

export function sessionTitleFromBrief(brief: string): string {
  const cleaned = brief.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Design brief";
  return cleaned.length > 42 ? `${cleaned.slice(0, 40)}…` : cleaned;
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
