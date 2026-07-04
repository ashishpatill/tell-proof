#!/usr/bin/env node
/** Warn if apps/web edits introduce raw hex or Inter-only patterns */
import { readFileSync } from "node:fs";

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

let payload = {};
try {
  payload = JSON.parse(input || "{}");
} catch {
  process.exit(0);
}

const filePath = payload.file_path ?? payload.path ?? "";
if (!filePath.includes("apps/web")) process.exit(0);

let content = "";
try {
  content = readFileSync(filePath, "utf8");
} catch {
  process.exit(0);
}

const warnings = [];
if (/className=[^>]*#([0-9A-Fa-f]{3,8})/.test(content)) {
  warnings.push("Raw hex in className — use design tokens (dogfood contract).");
}
if (/font-inter\b|"Inter"/.test(content) && !content.includes("generic-app")) {
  warnings.push("Inter detected in Tell UI — use Instrument Serif / Source Sans 3.");
}

if (warnings.length) {
  console.log(
    JSON.stringify({
      followup_message: `[Tell dogfood hook] ${filePath}:\n- ${warnings.join("\n- ")}`,
    })
  );
}
