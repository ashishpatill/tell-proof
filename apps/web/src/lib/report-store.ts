import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { TellReport } from "@tell/schema";
import { head, put } from "@vercel/blob";

const STORE_DIR = path.join(process.cwd(), "data", "shared-reports");
const BLOB_PREFIX = "shared-reports";

export type ShareBackend = "neon" | "blob" | "disk";

function databaseUrl(): string | undefined {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim();
  return url || undefined;
}

function useNeonStore(): boolean {
  return Boolean(databaseUrl());
}

function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function resolveShareBackend(): ShareBackend {
  if (useNeonStore()) return "neon";
  if (useBlobStore()) return "blob";
  return "disk";
}

export function shareBackendNote(backend: ShareBackend = resolveShareBackend()): string {
  switch (backend) {
    case "neon":
      return "Stored in Neon Postgres — persists across serverless instances and cold starts.";
    case "blob":
      return "Stored in Vercel Blob — persists across serverless instances.";
    default:
      return "Hosted on this instance until cleared. Set DATABASE_URL (Neon) or BLOB_READ_WRITE_TOKEN for durable share links.";
  }
}

/** Preferred write backend first, then any other configured stores (disk always last). */
export function loadBackendOrder(): ShareBackend[] {
  const preferred = resolveShareBackend();
  const order: ShareBackend[] = [preferred];
  for (const backend of ["neon", "blob", "disk"] as const) {
    if (order.includes(backend)) continue;
    if (backend === "neon" && !useNeonStore()) continue;
    if (backend === "blob" && !useBlobStore()) continue;
    order.push(backend);
  }
  return order;
}

let neonReady: Promise<void> | null = null;

function getSql() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

async function ensureNeonTable(): Promise<void> {
  if (!neonReady) {
    neonReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS shared_reports (
          id TEXT PRIMARY KEY,
          report JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      // Index creation is best-effort; table existence is what share/load require.
      try {
        await sql`
          CREATE INDEX IF NOT EXISTS shared_reports_created_at_idx
          ON shared_reports (created_at DESC)
        `;
      } catch {
        /* older Neon roles may lack CREATE INDEX; reads/writes still work */
      }
    })().catch((err) => {
      neonReady = null;
      throw err;
    });
  }
  await neonReady;
}

async function saveToNeon(id: string, report: TellReport): Promise<void> {
  await ensureNeonTable();
  const sql = getSql();
  // Use query() so the JSONB cast binds reliably with the HTTP driver.
  const payload = JSON.stringify(report);
  await sql.query(
    `INSERT INTO shared_reports (id, report)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (id) DO UPDATE SET report = EXCLUDED.report`,
    [id, payload],
  );
}

async function loadFromNeon(id: string): Promise<TellReport | null> {
  await ensureNeonTable();
  const sql = getSql();
  const rows = await sql`SELECT report FROM shared_reports WHERE id = ${id} LIMIT 1`;
  const row = rows[0] as { report?: unknown } | undefined;
  if (row?.report == null) return null;
  const raw = typeof row.report === "string" ? JSON.parse(row.report) : row.report;
  return TellReport.parse(raw);
}

async function loadFromBlob(id: string): Promise<TellReport | null> {
  const meta = await head(`${BLOB_PREFIX}/${id}.json`);
  const res = await fetch(meta.url);
  if (!res.ok) return null;
  return TellReport.parse(await res.json());
}

async function loadFromDisk(id: string): Promise<TellReport | null> {
  const raw = await readFile(path.join(STORE_DIR, `${id}.json`), "utf8");
  return TellReport.parse(JSON.parse(raw));
}

export async function saveSharedReport(report: TellReport): Promise<string> {
  const id = randomBytes(8).toString("hex");
  const payload = JSON.stringify(report);
  const backend = resolveShareBackend();

  if (backend === "neon") {
    await saveToNeon(id, report);
    return id;
  }

  if (backend === "blob") {
    await put(`${BLOB_PREFIX}/${id}.json`, payload, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    return id;
  }

  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(path.join(STORE_DIR, `${id}.json`), payload, "utf8");
  return id;
}

export async function loadSharedReport(id: string): Promise<TellReport | null> {
  if (!/^[a-f0-9]{16}$/.test(id)) return null;

  // Prefer the write backend, then fall back so Blob-era links still resolve after Neon is enabled.
  for (const backend of loadBackendOrder()) {
    try {
      if (backend === "neon") {
        const report = await loadFromNeon(id);
        if (report) return report;
        continue;
      }
      if (backend === "blob") {
        const report = await loadFromBlob(id);
        if (report) return report;
        continue;
      }
      const report = await loadFromDisk(id);
      if (report) return report;
    } catch {
      // Missing object / unreachable store — try the next backend.
    }
  }
  return null;
}

/** Strip connection strings and truncate before returning errors to clients. */
export function sanitizeStoreError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://***")
    .replace(/BLOB_READ_WRITE_TOKEN[=:]\S+/gi, "BLOB_READ_WRITE_TOKEN=***")
    .slice(0, 240);
}
