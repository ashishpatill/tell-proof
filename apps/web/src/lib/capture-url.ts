export function isGitHubRepoUrl(url: string) {
  let raw = url.trim();
  if (/^git@[\w.-]+:[\w.-]+\/[\w.-]+/.test(raw)) return true; // ssh
  const shorthand = raw.match(/^([\w.-]+)\/([\w.-]+)$/); // owner/repo (owner not a host)
  if (shorthand && !shorthand[1]!.includes(".")) return true;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const parsed = new URL(raw);
    return /(^|\.)(github|gitlab|bitbucket)\.com$/.test(parsed.hostname) && parsed.pathname.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

export function siteLabel(url: string) {
  try {
    return new URL(normalizeCaptureUrl(url) || url).hostname.replace(/^www\./, "");
  } catch {
    return "this page";
  }
}

export function normalizeCaptureUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:[/?#]|$)/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function sameOrigin(left: string, right: string) {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return false;
  }
}

export const DEFAULT_CAPTURE_URL = "https://superlearnai.com";
