#!/usr/bin/env tsx
import { captureUrl, diagnoseCapture, loadDesignDoc, shouldApplyDesignDoc } from "../index";

const url = process.argv[2];
if (!url) {
  console.error("Usage: diagnose-url <url>");
  process.exit(1);
}

const designDoc = shouldApplyDesignDoc(url) ? await loadDesignDoc() : undefined;
const report = diagnoseCapture(await captureUrl(url), undefined, designDoc);
process.stdout.write(JSON.stringify(report));
