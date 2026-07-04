import { writeFile } from "node:fs/promises";
import { captureUrl } from "../capture/capture-url";

const url = process.env.TELL_FIXTURE_URL ?? "http://localhost:3001";
const capture = await captureUrl(url);
await writeFile("fixtures/reports/capture.generated.json", JSON.stringify(capture, null, 2));
console.log(`Captured ${url}.`);
