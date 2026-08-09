import http from "node:http";
import { ingestReportJson } from "./ingest.js";
import { convertAll } from "../convert/to-jsonl.js";
import { ensureDataDirs, resolveDataHome } from "../util/paths.js";

const CAPTURE_PATHS = new Set(["/api/diagnose", "/api/voice", "/api/redesign"]);

export type ProxyOptions = {
  listen: number;
  target: string;
  home?: string;
  autoConvert?: boolean;
};

/**
 * Local reverse proxy: browser → sidecar → Tell.
 * Persists diagnose/voice/redesign JSON locally. No Tell code changes required.
 */
export async function startProxy(opts: ProxyOptions): Promise<http.Server> {
  const home = resolveDataHome(opts.home);
  await ensureDataDirs(home);
  const target = new URL(opts.target);
  const autoConvert = opts.autoConvert !== false;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${opts.listen}`);
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks);

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string" && k.toLowerCase() !== "host") headers[k] = v;
    }
    headers.host = target.host;

    let upstream: Response;
    try {
      upstream = await fetch(new URL(url.pathname + url.search, target), {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      });
    } catch (err) {
      res.statusCode = 502;
      res.end(`Upstream Tell unreachable at ${opts.target}: ${String(err)}`);
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });
    res.end(buf);

    if (req.method === "POST" && CAPTURE_PATHS.has(url.pathname) && upstream.ok) {
      try {
        const json = JSON.parse(buf.toString("utf8")) as unknown;
        if (url.pathname === "/api/diagnose") {
          const ep = await ingestReportJson(
            json && typeof json === "object" && "report" in (json as object)
              ? (json as { report: unknown }).report
              : json,
            {
              source: "proxy",
              meta: {
                api: url.pathname,
                envelope_meta:
                  json && typeof json === "object" && "meta" in (json as object)
                    ? (json as { meta: unknown }).meta
                    : undefined,
              },
            },
          );
          console.log(`[proxy-ingest] diagnose ${ep.episode_id} reward=${ep.reward.total}`);
        } else {
          // voice / redesign: attach as sidecar files keyed by timestamp
          const { writeFile } = await import("node:fs/promises");
          const { pathsFor } = await import("../util/paths.js");
          const p = pathsFor(home);
          const stamp = new Date().toISOString().replace(/[:.]/g, "-");
          const kind = url.pathname.split("/").pop() ?? "api";
          await writeFile(
            `${p.rawEpisodes}/side_${kind}_${stamp}.json`,
            JSON.stringify({ kind, at: stamp, body: json }, null, 2),
            "utf8",
          );
          console.log(`[proxy-side] saved ${kind}`);
        }
        if (autoConvert) await convertAll(home);
      } catch (err) {
        console.error("[proxy-ingest-error]", err);
      }
    }
  });

  await new Promise<void>((resolve) => server.listen(opts.listen, "127.0.0.1", () => resolve()));
  console.log(`[tell-design-data] proxy http://127.0.0.1:${opts.listen} → ${opts.target}`);
  console.log(`[tell-design-data] capturing ${[...CAPTURE_PATHS].join(", ")}`);
  return server;
}
