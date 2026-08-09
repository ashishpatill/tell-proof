/** Redact secrets while preserving design signal (layout/tokens/copy structure). */
const PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{10,}\b/g,
  /\bghs_[A-Za-z0-9_]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._\-+=/]{8,}/gi,
  /\b[A-Z0-9_]*API[_-]?KEY\b\s*[:=]\s*["']?[^"'\\s]+/gi,
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  /([?&](?:token|access_token|key|secret)=)[^&\s"']+/gi,
];

export function scrubText(input: string): string {
  let out = input;
  for (const re of PATTERNS) {
    out = out.replace(re, (m) => {
      if (m.startsWith("Bearer")) return "Bearer [REDACTED]";
      if (m.includes("@")) return "[REDACTED_EMAIL]";
      if (m.startsWith("?") || m.startsWith("&")) return `${m.slice(0, m.indexOf("=") + 1)}[REDACTED]`;
      return "[REDACTED]";
    });
  }
  return out;
}

export function scrubJson<T>(value: T): T {
  return JSON.parse(scrubText(JSON.stringify(value))) as T;
}
