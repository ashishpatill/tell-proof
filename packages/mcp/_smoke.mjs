import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";

const repo = path.resolve(process.cwd(), "../..");
const transport = new StdioClientTransport({
  command: "node",
  args: ["packages/mcp/dist/index.js"],
  cwd: repo,
  env: { ...process.env, TELL_REPORT_ARTIFACT: "fixtures/reports/tell-report.json" },
});
const client = new Client({ name: "smoke", version: "0" }, { capabilities: {} });
await client.connect(transport);

const red = await client.callTool({ name: "tell_redesign", arguments: { direction: "editorial" } });
console.log("tell_redesign ok, file:", JSON.parse(red.content[0].text).files?.[0]?.file);

const applied = await client.callTool({ name: "tell_apply", arguments: { projectRoot: path.join(repo, "fixtures/generic-app") } });
const out = JSON.parse(applied.content[0].text);
console.log("=== tell_apply files ===");
for (const f of out.files) console.log(" •", f.file, "→", f.summary);
console.log("=== instruction ===\n", out.instruction);
console.log("=== first patch (head) ===");
console.log((out.patches[0] || "(none)").split("\n").slice(0, 10).join("\n"));

const empty = await client.callTool({ name: "tell_apply", arguments: { projectRoot: path.join(repo, "fixtures/reports") } });
console.log("=== fallback (no sources) files ===", JSON.parse(empty.content[0].text).files.map(f=>f.file));

await client.close();
