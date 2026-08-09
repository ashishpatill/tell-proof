/** Small recent-session thumbs — craft beat, never empty chrome. */

const MAX_DATA_URL_CHARS = 48_000;

export function svgSessionThumb(opts: {
  title: string;
  accent?: string;
  surface?: string;
  findingCount?: number;
  live?: boolean;
}): string {
  const accent = opts.accent ?? "#D4714A";
  const surface = opts.surface ?? "#221F1C";
  const title = escapeXml(opts.title.slice(0, 28) || "Session");
  const count = typeof opts.findingCount === "number" ? `${opts.findingCount} findings` : "brief";
  const status = opts.live === false ? "offline" : opts.live ? "live" : "ready";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(accent)}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${escapeXml(surface)}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="200" fill="${escapeXml(surface)}"/>
  <rect x="0" y="0" width="320" height="92" fill="url(#g)"/>
  <circle cx="28" cy="28" r="8" fill="#F3EDE4" fill-opacity="0.9"/>
  <path d="M28 22 v12 M22 28 h12" stroke="${escapeXml(surface)}" stroke-width="1.5"/>
  <text x="20" y="128" fill="#F3EDE4" font-family="Georgia, serif" font-size="18">${title}</text>
  <text x="20" y="152" fill="#B8AA98" font-family="ui-monospace, monospace" font-size="11">${escapeXml(count)} · ${status}</text>
  <rect x="20" y="168" width="72" height="6" rx="1" fill="${escapeXml(accent)}" fill-opacity="0.7"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/** Downscale a capture PNG/JPEG base64 into a compact JPEG data URL for localStorage. */
export async function thumbFromScreenshotBase64(base64: string): Promise<string | null> {
  const raw = base64.trim();
  if (!raw || typeof document === "undefined") return null;
  const src = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
  try {
    const img = await loadImage(src);
    const maxW = 320;
    const scale = Math.min(1, maxW / Math.max(1, img.width));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    let quality = 0.72;
    let out = canvas.toDataURL("image/jpeg", quality);
    while (out.length > MAX_DATA_URL_CHARS && quality > 0.4) {
      quality -= 0.1;
      out = canvas.toDataURL("image/jpeg", quality);
    }
    return out.length > MAX_DATA_URL_CHARS ? null : out;
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("thumb image load failed"));
    img.src = src;
  });
}
