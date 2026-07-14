import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("report-store share backend", () => {
  const keys = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "NEON_DATABASE_URL",
    "BLOB_READ_WRITE_TOKEN",
  ] as const;
  const previous = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of keys) {
      previous.set(key, process.env[key]);
      delete process.env[key];
    }
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    previous.clear();
  });

  it("prefers Neon when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@ep-example.neon.tech/neondb";
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";
    const { resolveShareBackend, shareBackendNote } = await import("./report-store");
    expect(resolveShareBackend()).toBe("neon");
    expect(shareBackendNote("neon")).toMatch(/Neon Postgres/);
  });

  it("accepts POSTGRES_URL as a Neon alias", async () => {
    process.env.POSTGRES_URL = "postgresql://user:pass@ep-example.neon.tech/neondb";
    const { resolveShareBackend } = await import("./report-store");
    expect(resolveShareBackend()).toBe("neon");
  });

  it("falls back to Blob when only BLOB_READ_WRITE_TOKEN is set", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";
    const { resolveShareBackend, shareBackendNote } = await import("./report-store");
    expect(resolveShareBackend()).toBe("blob");
    expect(shareBackendNote("blob")).toMatch(/Vercel Blob/);
  });

  it("uses local disk when no durable store is configured", async () => {
    const { resolveShareBackend, shareBackendNote } = await import("./report-store");
    expect(resolveShareBackend()).toBe("disk");
    expect(shareBackendNote("disk")).toMatch(/DATABASE_URL/);
  });

  it("load order prefers Neon then still checks Blob", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@ep-example.neon.tech/neondb";
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";
    const { loadBackendOrder } = await import("./report-store");
    expect(loadBackendOrder()).toEqual(["neon", "blob", "disk"]);
  });

  it("rejects malformed share ids before touching storage", async () => {
    const { loadSharedReport } = await import("./report-store");
    expect(await loadSharedReport("../etc/passwd")).toBeNull();
    expect(await loadSharedReport("not-hex")).toBeNull();
    expect(await loadSharedReport("abcd")).toBeNull();
  });

  it("sanitizes postgres URLs out of store errors", async () => {
    const { sanitizeStoreError } = await import("./report-store");
    const cleaned = sanitizeStoreError(
      new Error("connect failed postgresql://user:secret@ep-x.neon.tech/neondb?sslmode=require boom"),
    );
    expect(cleaned).not.toMatch(/secret/);
    expect(cleaned).toMatch(/postgresql:\/\/\*\*\*/);
  });
});
