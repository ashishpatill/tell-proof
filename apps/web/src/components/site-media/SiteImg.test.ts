import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteImg } from "./SiteImg";

describe("SiteImg loading defaults", () => {
  it("rewrites jpg to webp and applies LCP defaults for priority images", () => {
    const html = renderToStaticMarkup(
      createElement(SiteImg, {
        src: "/baseline/hero-court.jpg",
        alt: "Court",
        width: 1600,
        height: 1066,
        priority: true,
      }),
    );
    expect(html).toContain('src="/baseline/hero-court.webp"');
    expect(html).toContain('loading="eager"');
    expect(html.toLowerCase()).toContain('fetchpriority="high"');
    expect(html).toContain('decoding="sync"');
    expect(html).toContain('width="1600"');
  });

  it("lazily loads below-fold stills with low fetch priority", () => {
    const html = renderToStaticMarkup(
      createElement(SiteImg, {
        src: "/baseline/clay-dust.webp",
        alt: "Clay",
        width: 1000,
        height: 667,
      }),
    );
    expect(html).toContain('src="/baseline/clay-dust.webp"');
    expect(html).toContain('loading="lazy"');
    expect(html.toLowerCase()).toContain('fetchpriority="low"');
    expect(html).toContain('decoding="async"');
  });
});
