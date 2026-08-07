import { describe, expect, it } from "vitest";
import { ResolvedIntent, resolveIntent } from "../src/resolve-intent";

const FIXTURE = "http://localhost:3999";

describe("resolveIntent", () => {
  it("parses output through ResolvedIntent zod", () => {
    const result = resolveIntent("https://example.com");
    expect(() => ResolvedIntent.parse(result)).not.toThrow();
  });

  it("routes github.com to diagnose-github", () => {
    const result = resolveIntent("github.com/acme/widget");
    expect(result.scenario).toBe("diagnose-github");
    expect(result.defaults.url).toContain("github.com/acme/widget");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("routes warmer/editorial to voice-direct with direction default", () => {
    const result = resolveIntent("warmer, editorial, less shadow");
    expect(result.scenario).toBe("voice-direct");
    expect(result.defaults.direction).toContain("warmer");
  });

  it("routes pricing/matrix to matrix-scan with routes", () => {
    const pricing = resolveIntent("scan pricing page for drift");
    expect(pricing.scenario).toBe("matrix-scan");
    expect(pricing.defaults.routes).toContain("/pricing");

    const matrix = resolveIntent("run scenario matrix on http://localhost:3001");
    expect(matrix.scenario).toBe("matrix-scan");
    expect(matrix.defaults.url).toBe("http://localhost:3001");
  });

  it("routes mcp install to mcp-setup", () => {
    const result = resolveIntent("install tell mcp in cursor");
    expect(result.scenario).toBe("mcp-setup");
  });

  it("routes dogfood to dogfood scenario", () => {
    const result = resolveIntent("dogfood tell on itself");
    expect(result.scenario).toBe("dogfood");
  });

  it("routes studio/design from features to studio-brief", () => {
    const studio = resolveIntent("open studio for a saas marketing landing");
    expect(studio.scenario).toBe("studio-brief");
    expect(studio.defaults.siteKind).toBe("saas-marketing");

    const features = resolveIntent("design from features for my dashboard webapp");
    expect(features.scenario).toBe("studio-brief");
    expect(features.defaults.siteKind).toBe("dashboard-webapp");
  });

  it("routes proof verify to proof-verify", () => {
    const result = resolveIntent("proof verify patch on https://app.test");
    expect(result.scenario).toBe("proof-verify");
    expect(result.defaults.url).toBe("https://app.test");
  });

  it("routes bare URLs to diagnose-url", () => {
    const result = resolveIntent("https://my-app.vercel.app");
    expect(result.scenario).toBe("diagnose-url");
    expect(result.defaults.url).toBe("https://my-app.vercel.app");
  });

  it("falls back to diagnose-url with fixture when not URL-like", () => {
    const result = resolveIntent("check my landing page", { fixtureUrl: FIXTURE });
    expect(result.scenario).toBe("diagnose-url");
    expect(result.defaults.url).toBe(FIXTURE);
    expect(result.confidence).toBeLessThan(0.7);
  });

  it("empty text uses fixture default", () => {
    const result = resolveIntent("", { fixtureUrl: FIXTURE });
    expect(result.scenario).toBe("diagnose-url");
    expect(result.defaults.url).toBe(FIXTURE);
  });
});
