import { z } from "zod";

export const BYOK_STORAGE_KEY = "tell:byok";

export const ByokConfig = z.object({
  geminiApiKey: z.string().optional(),
  cursorApiKey: z.string().optional(),
  /** @deprecated Not sent by byokHeaders — capture uses server TELL_CAPTURE_API_URL. Kept for localStorage parse only. */
  captureApiUrl: z.string().optional(),
});
export type ByokConfig = z.infer<typeof ByokConfig>;

export const GEMINI_KEY_HEADER = "x-tell-gemini-key";
export const CURSOR_KEY_HEADER = "x-tell-cursor-key";

export function loadByok(): ByokConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BYOK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = ByokConfig.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function saveByok(config: ByokConfig): void {
  if (typeof window === "undefined") return;
  // Intentionally omit captureApiUrl — it was never applied by byokHeaders();
  // live capture reads server TELL_CAPTURE_API_URL (see GET /api/health/capture).
  const cleaned: ByokConfig = {
    geminiApiKey: config.geminiApiKey?.trim() || undefined,
    cursorApiKey: config.cursorApiKey?.trim() || undefined,
  };
  localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(cleaned));
}

export function clearByok(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BYOK_STORAGE_KEY);
}

/**
 * Client fetch headers: content-type + optional Gemini/Cursor BYOK overrides (never log these).
 * Does not send captureApiUrl — capture backends use server env only.
 */
export function byokHeaders(extra?: HeadersInit): HeadersInit {
  const byok = loadByok();
  const headers = new Headers(extra);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (byok.geminiApiKey) headers.set(GEMINI_KEY_HEADER, byok.geminiApiKey);
  if (byok.cursorApiKey) headers.set(CURSOR_KEY_HEADER, byok.cursorApiKey);
  return headers;
}

/** Server-side: resolve Gemini key from request header, else env. */
export function resolveGeminiKey(request: Request): string | undefined {
  const fromHeader = request.headers.get(GEMINI_KEY_HEADER)?.trim();
  if (fromHeader) return fromHeader;
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

/** Server-side: resolve Cursor key from request header, else env. */
export function resolveCursorKey(request: Request): string | undefined {
  const fromHeader = request.headers.get(CURSOR_KEY_HEADER)?.trim();
  if (fromHeader) return fromHeader;
  return process.env.CURSOR_API_KEY?.trim() || undefined;
}
