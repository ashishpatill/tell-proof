import { readFile, writeFile } from "node:fs/promises";
import { CapturePayload } from "@tell/schema";
import { diagnoseCapture } from "../diagnose";

const capture = CapturePayload.parse(JSON.parse(await readFile("fixtures/reports/capture.json", "utf8")));
const report = diagnoseCapture(capture);
await writeFile("fixtures/reports/tell-report.generated.json", JSON.stringify(report, null, 2));
console.log(`Tell diagnosed ${report.score.total} findings.`);
