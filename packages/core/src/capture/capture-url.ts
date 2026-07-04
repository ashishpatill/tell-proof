import { chromium } from "playwright";
import { CapturePayload } from "@tell/schema";

const SAMPLE_SELECTORS = [
  "body",
  "h1",
  "h2",
  "h3",
  "button",
  "a",
  "input",
  "nav",
  "[class*='card']",
  "[class*='hero']",
].join(",");

export async function captureUrl(url: string): Promise<CapturePayload> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 10_000 });
    const screenshotBase64 = await page.screenshot({ fullPage: true, type: "png" }).then((b) => b.toString("base64"));

    const payload = await page.evaluate((selector) => {
      const samples = Array.from(document.querySelectorAll<HTMLElement>(selector)).slice(0, 200).map((el) => {
        const cs = getComputedStyle(el);
        const selectorLabel =
          el.id ? `#${el.id}` : el.className ? `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}` : el.tagName.toLowerCase();
        return {
          selector: selectorLabel,
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          borderRadius: cs.borderRadius,
          boxShadow: cs.boxShadow,
          padding: cs.padding,
          textAlign: cs.textAlign,
          lineHeight: cs.lineHeight,
          backgroundImage: cs.backgroundImage,
        };
      });

      const probes = Array.from(document.querySelectorAll<HTMLElement>("button,a[href],input,select")).slice(0, 80).map((el, index) => ({
        role: el.getAttribute("role") ?? el.tagName.toLowerCase(),
        selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
        hasHoverDiff: /\bhover:|hover-|data-hover/i.test(el.className),
        hasFocusVisibleDiff: /focus-visible|focus:ring|outline/i.test(el.className),
        hasDisabledAttr: el.hasAttribute("disabled"),
        ariaDisabled: el.getAttribute("aria-disabled") === "true",
      }));

      const blockEls = Array.from(document.querySelectorAll<HTMLElement>("section,div,main,header"));
      const centered = blockEls.filter((el) => getComputedStyle(el).textAlign === "center").length;
      const text = document.body?.innerText ?? "";
      const emojiMatches = text.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? [];

      return {
        styles: samples,
        probes,
        domSummary: {
          headingCount: document.querySelectorAll("h1,h2,h3").length,
          buttonCount: document.querySelectorAll("button").length,
          centeredBlockRatio: blockEls.length ? centered / blockEls.length : 0,
          emojiInUiCount: emojiMatches.length,
        },
      };
    }, SAMPLE_SELECTORS);

    return CapturePayload.parse({
      url,
      capturedAt: new Date().toISOString(),
      viewport: { width: 1440, height: 1100 },
      screenshotBase64,
      ...payload,
    });
  } finally {
    await browser.close();
  }
}
